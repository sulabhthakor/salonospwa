import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('--- DIAGNOSIS START ---')

    // 1. Check Service Requirements
    const services = await prisma.service.findMany({
        include: { skillRequirements: true }
    })
    console.log(`Found ${services.length} services.`)
    services.forEach(s => {
        console.log(`Service: ${s.name} (ID: ${s.id}, Duration: ${s.duration}m, RequiresRoom: ${s.requiresRoom})`)
        console.log(`  Requirements: ${s.skillRequirements.length > 0 ? s.skillRequirements.map(r => r.skillId).join(', ') : 'None'}`)
    })

    // 2. Check Staff Data
    const staff = await prisma.user.findMany({
        where: { role: { in: ['STAFF', 'OWNER'] } },
        include: {
            staffSkills: true,
            availability: true,
            location: true
        }
    })

    console.log(`\nFound ${staff.length} staff/owners.`)
    staff.forEach(s => {
        console.log(`Staff: ${s.name} (ID: ${s.id}, Role: ${s.role})`)
        console.log(`  Location ID: ${s.locationId}`)
        console.log(`  Skills: ${s.staffSkills.length > 0 ? s.staffSkills.map(sk => sk.skillId).join(', ') : 'None'}`)
        console.log(`  Availability Records: ${s.availability.length}`)
        s.availability.forEach(a => {
            console.log(`    Day ${a.dayOfWeek}: ${a.startTime}-${a.endTime} (Working: ${a.isWorking})`)
        })
    })

    // 3. Check Rooms
    const rooms = await prisma.room.findMany()
    console.log(`\nFound ${rooms.length} rooms.`)
    rooms.forEach(r => {
        console.log(`Room: ${r.name} (Location: ${r.locationId}, Type: ${r.type}, Active: ${r.isActive})`)
    })

    console.log('--- DIAGNOSIS END ---')
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect()
    })
