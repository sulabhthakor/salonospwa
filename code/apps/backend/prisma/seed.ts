
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const password = await bcrypt.hash('password123', 10);

    // 1. Create Business Owner
    // Upsert is fine for User.email which is unique
    const owner = await prisma.user.upsert({
        where: { email: 'owner@example.com' },
        update: { password, role: 'OWNER' },
        create: {
            email: 'owner@example.com',
            name: 'Business Owner',
            password,
            role: 'OWNER',
        },
    });

    console.log({ owner });

    // 2. Create Client
    const client = await prisma.user.upsert({
        where: { email: 'client@example.com' },
        update: { password, role: 'CLIENT' },
        create: {
            email: 'client@example.com',
            name: 'Test Client',
            password,
            role: 'CLIENT',
        },
    });

    console.log({ client });

    // 3. Create Super Admin
    const superAdmin = await prisma.user.upsert({
        where: { email: 'admin@example.com' },
        update: { password, role: 'SUPER_ADMIN' },
        create: {
            email: 'admin@example.com',
            name: 'Super Admin',
            password,
            role: 'SUPER_ADMIN',
        },
    });
    console.log({ superAdmin });


    // 4. Create Business
    // ownerId is NOT unique, so we can't upsert directly on it easily without composite keys or logic.
    // Use findFirst -> update OR create
    let business = await prisma.business.findFirst({
        where: { ownerId: owner.id }
    });

    if (business) {
        await prisma.business.update({
            where: { id: business.id },
            data: { status: 'APPROVED' } // Ensure it's approved for testing
        });
    } else {
        business = await prisma.business.create({
            data: {
                name: 'Salon One',
                description: 'The best salon in town.',
                status: 'APPROVED',
                ownerId: owner.id
            }
        });
    }

    console.log({ business });

    if (!business) return; // Should not happen

    // 5. Create Location
    // We can upsert on ID if we knew it, but IDs are ints for locations? No, checked schema: Location.id is Int Autoincrement.
    // We can findFirst by businessId?
    let location = await prisma.location.findFirst({
        where: { businessId: business.id }
    });

    if (!location) {
        location = await prisma.location.create({
            data: {
                name: 'Main Branch',
                businessId: business.id // CUID String now
            }
        });
    }

    console.log({ location });

    // 6. Create Categorized Services
    const serviceData = [
        { name: 'Classic Haircut', category: 'Hair', duration: 45, price: 50 },
        { name: 'Beard Trim', category: 'Hair', duration: 30, price: 30 },
        { name: 'Hair Coloring', category: 'Hair', duration: 120, price: 150 },
        { name: 'Swedish Massage', category: 'Spa', duration: 60, price: 80 },
        { name: 'Deep Tissue', category: 'Spa', duration: 90, price: 110 },
        { name: 'Manicure', category: 'Nail', duration: 45, price: 40 },
        { name: 'Pedicure', category: 'Nail', duration: 60, price: 55 },
    ];

    const createdServices = [];

    for (const svc of serviceData) {
        const existing = await prisma.service.findFirst({
            where: {
                name: svc.name,
                locationId: location.id
            }
        });

        if (!existing) {
            const newSvc = await prisma.service.create({
                data: {
                    name: svc.name,
                    category: svc.category,
                    duration: svc.duration,
                    price: svc.price,
                    locationId: location.id
                }
            });
            createdServices.push(newSvc);
        } else {
            createdServices.push(existing);
        }
    }

    console.log(`Seeded ${createdServices.length} services.`);

    // 7. Create Sample Appointments
    // We need a Client entity (Business Record) linked to the Location, distinct from the User account for now unless linked.
    // For this seed, we'll create a Client record renaming the User we created.

    if (client && createdServices.length > 0 && location) {
        // Create a Client record for the business
        const businessClient = await prisma.client.create({
            data: {
                name: client.name || "Test Client",
                email: client.email,
                phone: "555-0123",
                locationId: location.id
            }
        });

        const today = new Date();
        today.setHours(14, 0, 0, 0); // 2:00 PM

        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        tomorrow.setHours(10, 30, 0, 0); // 10:30 AM

        await prisma.appointment.createMany({
            data: [
                {
                    clientId: businessClient.id,
                    staffId: owner.id, // Owner performs service
                    serviceId: createdServices[0].id, // Haircut
                    locationId: location.id,
                    startTime: today,
                    duration: createdServices[0].duration,
                    status: 'SCHEDULED'
                },
                {
                    clientId: businessClient.id,
                    staffId: owner.id,
                    serviceId: createdServices[3].id, // Massage
                    locationId: location.id,
                    startTime: tomorrow,
                    duration: createdServices[3].duration,
                    status: 'SCHEDULED'
                }
            ]
        });
        console.log('Seeded sample appointments.');
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
