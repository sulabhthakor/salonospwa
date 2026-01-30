import { PrismaClient } from '@prisma/client'
import { addMinutes, format, parse, isSameDay, startOfDay, endOfDay } from 'date-fns'

const prisma = new PrismaClient()

async function main() {
    console.log('--- DEBUG SLOTS START ---')

    // 1. Get ALL Staff (they might serve different services/locations)
    const allStaff = await prisma.user.findMany({
        where: {
            role: { in: ['STAFF', 'OWNER'] }
        },
        include: { staffSkills: true, availability: true }
    })
    console.log(`Found ${allStaff.length} total staff.`)

    // 4. Test Availability for EACH Service
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)

    // 4. Detailed Check for Service ID 1
    console.log('\n=== DEEP CHECK SERVICE ID 1 ===')
    const service1 = await prisma.service.findUnique({
        where: { id: 1 },
        include: { skillRequirements: true }
    })

    if (!service1) {
        console.log('Service ID 1 NOT FOUND')
    } else {
        console.log(`Service: ${service1.name}`)
        console.log(`  isActive: ${service1.isActive ?? 'UNDEFINED (Assuming true)'}`)
        console.log(`  LocationId: ${service1.locationId}`)
        console.log(`  Required Skills: ${service1.skillRequirements.map(s => s.skillId).join(', ') || 'NONE'}`)

        // Check Staff for Service 1
        const service1Staff = allStaff.filter(s => s.locationId === service1.locationId)
        console.log(`  Staff in Location ${service1.locationId}: ${service1Staff.length}`)

        const qualified = service1Staff.filter(s => {
            const req = service1.skillRequirements.map(sr => sr.skillId)
            if (req.length === 0) return true
            const has = s.staffSkills.map(ss => ss.skillId)
            const match = req.some(id => has.includes(id))
            if (!match) console.log(`    [x] ${s.name} missing skill`)
            return match
        })
        console.log(`  Qualified Staff: ${qualified.length}`)

        // Test 3 Days
        const dates = [
            new Date(),
            addMinutes(new Date(), 24 * 60), // Tomorrow
            addMinutes(new Date(), 48 * 60) // Day After
        ]

        for (const d of dates) {
            console.log(`  > Date: ${format(d, 'yyyy-MM-dd (EEEE)')}`)
            simulateSlots(service1, qualified, d)
        }
    }

    console.log('--- DEBUG END ---')
}

function simulateSlots(service: any, staff: any[], date: Date) {
    const WORK_START = "09:00"
    const WORK_END = "18:00"
    const dayOfWeek = date.getDay()

    let currentTime = parse(WORK_START, "HH:mm", date)
    const endTime = parse(WORK_END, "HH:mm", date)

    // Adjust for 'Now' if today
    const now = new Date()
    if (isSameDay(date, now)) {
        // Logic from availability.ts
        const currentMinutes = now.getHours() * 60 + now.getMinutes()
        const nextInterval = Math.ceil(currentMinutes / 30) * 30
        const nextTime = new Date(now)
        nextTime.setHours(0, Math.floor(nextInterval / 60), nextInterval % 60, 0) // Correctly set hours and minutes
        if (nextTime > currentTime) currentTime = nextTime
        console.log(`    Current Time is ${format(now, 'HH:mm')}. Next slot starts at ${format(currentTime, 'HH:mm')}`)
    }

    let slotsFound = 0
    while (currentTime < endTime && slotsFound < 3) {
        const slotStart = currentTime
        const slotEnd = addMinutes(slotStart, service.duration)

        const availableStaff = staff.filter(s => {
            const avail = s.availability.find((a: any) => a.dayOfWeek === dayOfWeek)
            if (avail && !avail.isWorking) return false

            const wsStr = avail ? avail.startTime : WORK_START
            const weStr = avail ? avail.endTime : WORK_END
            const ws = parse(wsStr, "HH:mm", date)
            const we = parse(weStr, "HH:mm", date)

            return slotStart >= ws && slotEnd <= we
        })

        if (availableStaff.length > 0) {
            console.log(`    Slot ${format(slotStart, 'HH:mm')}: OK (${availableStaff.length} staff)`)
            slotsFound++
        }

        currentTime = addMinutes(currentTime, 30)
    }

    if (slotsFound === 0) console.log('    [!!!] NO SLOTS FOUND')
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect()
    })
