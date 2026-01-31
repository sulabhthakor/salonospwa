import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('--- FIXING STAFF SKILLS ---')

    // 1. Get all skills
    const skills = await prisma.skill.findMany()
    if (skills.length === 0) {
        console.log('No skills found in DB. Creating default skills...')
        const location = await prisma.location.findFirst()
        if (!location) throw new Error("No location found")

        await prisma.skill.createMany({
            data: [
                { name: "Haircut", locationId: location.id },
                { name: "Color", locationId: location.id },
                { name: "Massage", locationId: location.id },
                { name: "Facial", locationId: location.id }
            ]
        })
    }
    const allSkills = await prisma.skill.findMany()

    // 2. Get all staff
    const staff = await prisma.user.findMany({
        where: { role: { in: ['STAFF', 'OWNER'] } }
    })

    // 3. Assign all skills to all staff
    for (const s of staff) {
        console.log(`Assigning skills to ${s.name}...`)

        for (const skill of allSkills) {
            await prisma.staffSkill.upsert({
                where: {
                    staffId_skillId: {
                        staffId: s.id,
                        skillId: skill.id
                    }
                },
                update: {},
                create: {
                    staffId: s.id,
                    skillId: skill.id
                }
            })
        }
    }

    // 4. Ensure all staff have locationId
    const defaultLocation = await prisma.location.findFirst()
    if (defaultLocation) {
        for (const s of staff) {
            if (!s.locationId) {
                console.log(`Fixing location for ${s.name}...`)
                await prisma.user.update({
                    where: { id: s.id },
                    data: { locationId: defaultLocation.id }
                })
            }
        }
    }

    console.log('--- DONE ---')
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect()
    })
