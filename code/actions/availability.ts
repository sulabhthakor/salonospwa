'use server'

import { prisma } from '@/lib/prisma'
import { getSession } from './auth'
import { addMinutes, format, isBefore, parse, startOfDay, endOfDay, isSameDay } from 'date-fns'

type SlotRequest = {
    serviceIds: number[]
    addOnIds?: number[][] // Array of add-ons per service index (e.g. [[addon1, addon2], [addon3]])
    date: Date
    staffId?: string // Optional specific staff preference
    guests?: number  // Defaults to 1
}

type TimeSlot = {
    time: string      // "09:00"
    available: boolean
    reason?: string   // "Full" or "Closed"
}

// Helper to check if intervals overlap
const isOverlapping = (start1: Date, end1: Date, start2: Date, end2: Date) => {
    return start1 < end2 && start2 < end1
}

export async function getAvailableSlots({ serviceIds, addOnIds: addOnIdGroups, date, staffId, guests = 1 }: SlotRequest) {
    try {
        // 1. Basic Validation
        if (!serviceIds.length) return { error: 'No services selected' }

        // 2. Fetch Services with requirements
        const services = await prisma.service.findMany({
            where: { id: { in: serviceIds } },
            include: {
                skillRequirements: true
            }
        })

        if (services.length !== serviceIds.length) return { error: 'Some services not found' }

        // Determine total duration
        let totalDuration = services.reduce((acc, s) => acc + s.duration, 0)

        // Add duration from add-ons
        if (addOnIdGroups && addOnIdGroups.length > 0) {
            const allAddOnIds = addOnIdGroups.flat().filter(id => typeof id === 'number');
            if (allAddOnIds.length > 0) {
                const addOns = await prisma.addOn.findMany({
                    where: { id: { in: allAddOnIds } }
                })
                totalDuration += addOns.reduce((acc, a) => acc + a.durationChange, 0)
            }
        }

        // Buffers: Apply first service's buffer-before and last service's buffer-after
        const bufferBefore = services[0].bufferBefore || 0
        const bufferAfter = services[services.length - 1].bufferAfter || 0

        // 3. Define Business Hours (Hardcoded for now)
        const WORK_START = "09:00"
        const WORK_END = "18:00"
        const SLOT_INTERVAL = 30

        // 4. Fetch All Staff and their Skills
        const locationId = services[0].locationId

        const allStaff = await prisma.user.findMany({
            where: {
                locationId,
                role: { in: ['STAFF', 'OWNER', 'ADMIN'] },
                isActive: true
            },
            include: {
                staffSkills: true
            }
        })

        // 5. Fetch All Rooms
        const allRooms = await prisma.room.findMany({
            where: {
                locationId,
                isActive: true
            }
        })

        // 6. Fetch Existing Appointments for the date
        const queryDateStart = startOfDay(date)
        const queryDateEnd = endOfDay(date)
        const dayOfWeekOfWeek = date.getDay() // 0=Sun, 1=Mon...

        const existingAppointments = await prisma.appointment.findMany({
            where: {
                locationId,
                startTime: {
                    gte: queryDateStart,
                    lte: queryDateEnd
                },
                status: { not: 'CANCELLED' }
            },
            include: {
                roomBookings: true,
                service: true
            }
        })

        // 6b. Fetch Staff Availability for this day
        const staffAvailability = await prisma.staffAvailability.findMany({
            where: {
                staffId: { in: allStaff.map(s => s.id) },
                dayOfWeek: dayOfWeekOfWeek
            }
        })

        // 7. Generate Time Slots
        const slots: TimeSlot[] = []

        // Find the earliest start and latest end across all qualified staff
        // Note: This logic assumes we show a slot if AT LEAST ONE staff is working.
        // We'll intersect this with individual availability.

        // Defaults if no records found
        let minStart = "09:00"
        let maxEnd = "18:00"

        // If records exist, calculate bounds
        const workingStaff = staffAvailability.filter(a => a.isWorking)

        if (workingStaff.length > 0) {
            // Find earliest start
            const starts = workingStaff.map(a => parseInt(a.startTime.replace(':', '')))
            const ends = workingStaff.map(a => parseInt(a.endTime.replace(':', '')))

            const minStartVal = Math.min(...starts)
            const maxEndVal = Math.max(...ends)

            // Format back to HH:mm
            minStart = `${Math.floor(minStartVal / 100).toString().padStart(2, '0')}:${(minStartVal % 100).toString().padStart(2, '0')}`
            maxEnd = `${Math.floor(maxEndVal / 100).toString().padStart(2, '0')}:${(maxEndVal % 100).toString().padStart(2, '0')}`
        } else if (staffAvailability.length > 0 && workingStaff.length === 0) {
            // All staff set to NOT working
            return { slots: [] }
        }

        let currentTime = parse(minStart, "HH:mm", date)
        const endTime = parse(maxEnd, "HH:mm", date)

        // Ensure we don't generate slots in the past if date is today
        const now = new Date()
        if (isSameDay(date, now)) {
            const currentMinutes = now.getHours() * 60 + now.getMinutes()
            const nextInterval = Math.ceil(currentMinutes / SLOT_INTERVAL) * SLOT_INTERVAL
            const nextTime = new Date(now)
            nextTime.setHours(0, nextInterval, 0, 0)
            if (nextTime > currentTime) {
                currentTime = nextTime
            }
        }

        while (addMinutes(currentTime, totalDuration) <= endTime) {
            const slotStart = currentTime
            const slotEnd = addMinutes(slotStart, totalDuration)

            // Effective Resource Start/End (Blocked Time)
            const resourceStart = addMinutes(slotStart, -bufferBefore)
            const resourceEnd = addMinutes(slotEnd, bufferAfter)

            // 7a. Find ID of staff busy during this slot (considering THEIR buffers)
            const busyStaffIds = new Set<string>()
            existingAppointments.forEach(apt => {
                const aptBufferBefore = apt.service.bufferBefore || 0
                const aptBufferAfter = apt.service.bufferAfter || 0

                const aptStart = new Date(apt.startTime)
                const aptDuration = apt.duration

                // Existing appointment occupies: Start-Buffer -> End+Buffer
                const aptResourceStart = addMinutes(aptStart, -aptBufferBefore)
                const aptResourceEnd = addMinutes(aptStart, aptDuration + aptBufferAfter)

                if (isOverlapping(resourceStart, resourceEnd, aptResourceStart, aptResourceEnd)) {
                    busyStaffIds.add(apt.staffId)
                }
            })

            // 7b. Find ID of rooms busy during this slot
            const busyRoomIds = new Set<number>()
            existingAppointments.forEach(apt => {
                apt.roomBookings.forEach(booking => {
                    const bookingStart = new Date(booking.startTime)
                    const bookingEnd = new Date(booking.endTime)
                    // Check overlap with OUR required resource time
                    if (isOverlapping(resourceStart, resourceEnd, bookingStart, bookingEnd)) {
                        busyRoomIds.add(booking.roomId)
                    }
                })
            })

            // 7c. Available Resources
            const availableStaff = allStaff.filter(s => !busyStaffIds.has(s.id))
            const availableRooms = allRooms.filter(r => !busyRoomIds.has(r.id))

            // 7d. Check capacity for 'guests' count
            const qualifiedStaff = availableStaff.filter(staff => {
                if (staffId && staff.id !== staffId) return false

                // Check staff specific availability
                // 1. Get their availability record or default
                const availability = staffAvailability.find(a => a.staffId === staff.id)
                    || { startTime: "09:00", endTime: "18:00", isWorking: true } // Implicit default if no record

                if (!availability.isWorking) return false

                // 2. Check if slot falls within their hours
                const workStart = parse(availability.startTime, "HH:mm", date)
                const workEnd = parse(availability.endTime, "HH:mm", date)

                if (slotStart < workStart || slotEnd > workEnd) return false

                return services.every(service => {
                    if (!service.skillRequirements || service.skillRequirements.length === 0) return true
                    const requiredSkillIds = service.skillRequirements.map(sr => sr.skillId)
                    if (requiredSkillIds.length === 0) return true
                    const staffSkillIds = staff.staffSkills.map(ss => ss.skillId)
                    return requiredSkillIds.some(id => staffSkillIds.includes(id))
                })
            })

            const qualifiedRooms = availableRooms.filter(room => {
                return services.every(service => {
                    if (!service.requiresRoom) return true
                    if (!service.roomTypes || service.roomTypes.length === 0) return true
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    return (service.roomTypes as any[]).includes(room.type)
                })
            })

            const requiresRoom = services.some(s => s.requiresRoom)
            const maxCapacity = requiresRoom
                ? Math.min(qualifiedStaff.length, qualifiedRooms.length)
                : qualifiedStaff.length

            if (maxCapacity >= guests) {
                slots.push({
                    time: format(slotStart, "HH:mm"),
                    available: true
                })
            }

            currentTime = addMinutes(currentTime, SLOT_INTERVAL)
        }

        return { slots }

    } catch (error) {
        console.error('Get Available Slots Error:', error)
        return { error: 'Failed to calculate availability' }
    }
}
