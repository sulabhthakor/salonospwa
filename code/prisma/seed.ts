
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    // Hash for 'password123'
    const password = await bcrypt.hash('password123', 10);

    // 1. Create Users (Owner, Admin, Staff)
    console.log('--- Seeding Users ---');
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

    // 2. Create Business
    console.log('--- Seeding Business ---');
    let business = await prisma.business.findFirst({
        where: { ownerId: owner.id }
    });

    if (business) {
        business = await prisma.business.update({
            where: { id: business.id },
            data: { status: 'APPROVED' }
        });
    } else {
        business = await prisma.business.create({
            data: {
                name: 'Elite Salon & Spa',
                description: 'Premium grooming and wellness services.',
                status: 'APPROVED',
                ownerId: owner.id
            }
        });
    }

    // 3. Create Location
    console.log('--- Seeding Location ---');
    let location = await prisma.location.findFirst({
        where: { businessId: business.id }
    });

    if (!location) {
        location = await prisma.location.create({
            data: {
                name: 'Downtown Flagship',
                businessId: business.id
            }
        });
    }

    // Update Owner with Business and Location
    await prisma.user.update({
        where: { id: owner.id },
        data: {
            businessId: business.id,
            locationId: location.id
        }
    });

    // 4. Create Staff Members
    console.log('--- Seeding Staff ---');
    const staffData = [
        { name: 'John Doe', email: 'john@salon.com', role: 'STAFF' as any },
        { name: 'Jane Smith', email: 'jane@salon.com', role: 'STAFF' as any },
        { name: 'Mike Ross', email: 'mike@salon.com', role: 'STAFF' as any },
    ];

    const staffMembers = [];
    for (const s of staffData) {
        const user = await prisma.user.upsert({
            where: { email: s.email },
            update: { password, role: s.role, businessId: business.id, locationId: location.id },
            create: {
                email: s.email,
                name: s.name,
                password,
                role: s.role,
                businessId: business.id,
                locationId: location.id
            },
        });
        staffMembers.push(user);
    }

    // 5. Create Services
    console.log('--- Seeding Services ---');
    const serviceData = [
        { name: 'Signature Haircut', category: 'Hair', duration: 45, price: 65 },
        { name: 'Luxury Beard Grooming', category: 'Hair', duration: 30, price: 40 },
        { name: 'Balayage Coloring', category: 'Hair', duration: 180, price: 250 },
        { name: 'Full Body Swedish Massage', category: 'Spa', duration: 60, price: 95 },
        { name: 'Hot Stone Therapy', category: 'Spa', duration: 90, price: 140 },
        { name: 'Hydrating Facial', category: 'Skin', duration: 60, price: 110 },
        { name: 'Gel Manicure', category: 'Nails', duration: 45, price: 55 },
        { name: 'Luxury Pedicure', category: 'Nails', duration: 75, price: 75 },
    ];

    const seededServices = [];
    for (const svc of serviceData) {
        const existing = await prisma.service.findFirst({
            where: { name: svc.name, locationId: location.id }
        });
        if (!existing) {
            const s = await prisma.service.create({
                data: { ...svc, locationId: location.id }
            });
            seededServices.push(s);
        } else {
            seededServices.push(existing);
        }
    }

    // 6. Create Clients
    console.log('--- Seeding Clients ---');
    const clientData = [
        { name: 'Alice Cooper', email: 'alice@gmail.com', phone: '555-0101' },
        { name: 'Bob Marley', email: 'bob@gmail.com', phone: '555-0102' },
        { name: 'Charlie Brown', email: 'charlie@gmail.com', phone: '555-0103' },
        { name: 'Diana Ross', email: 'diana@gmail.com', phone: '555-0104' },
        { name: 'Edward Norton', email: 'edward@gmail.com', phone: '555-0105' },
        { name: 'Fiona Apple', email: 'fiona@gmail.com', phone: '555-0106' },
        { name: 'George Clooney', email: 'george@gmail.com', phone: '555-0107' },
        { name: 'Hannah Montana', email: 'hannah@gmail.com', phone: '555-0108' },
        { name: 'Ian Wright', email: 'ian@gmail.com', phone: '555-0109' },
        { name: 'Julie Andrews', email: 'julie@gmail.com', phone: '555-0110' },
    ];

    const seededClients = [];
    for (const c of clientData) {
        const existing = await prisma.client.findFirst({
            where: { email: c.email, locationId: location.id }
        });
        if (!existing) {
            const cl = await prisma.client.create({
                data: { ...c, locationId: location.id }
            });
            seededClients.push(cl);
        } else {
            seededClients.push(existing);
        }
    }

    // 7. Create Appointments (Past and Future)
    console.log('--- Seeding Appointments ---');
    const today = new Date();
    today.setMinutes(0, 0, 0);

    const appointmentStatuses = ['SCHEDULED', 'COMPLETED', 'CANCELLED'];

    // Future Appointments
    for (let i = 0; i < 15; i++) {
        const randomClient = seededClients[Math.floor(Math.random() * seededClients.length)];
        const randomStaff = staffMembers[Math.floor(Math.random() * staffMembers.length)];
        const randomService = seededServices[Math.floor(Math.random() * seededServices.length)];

        const startTime = new Date(today);
        startTime.setDate(today.getDate() + Math.floor(Math.random() * 7)); // Within next 7 days
        startTime.setHours(9 + Math.floor(Math.random() * 9), 0, 0, 0); // Working hours 9-5

        await prisma.appointment.create({
            data: {
                clientId: randomClient.id,
                staffId: randomStaff.id,
                serviceId: randomService.id,
                locationId: location.id,
                startTime: startTime,
                duration: randomService.duration,
                status: 'SCHEDULED'
            }
        });
    }

    // Past Appointments
    for (let i = 0; i < 10; i++) {
        const randomClient = seededClients[Math.floor(Math.random() * seededClients.length)];
        const randomStaff = staffMembers[Math.floor(Math.random() * staffMembers.length)];
        const randomService = seededServices[Math.floor(Math.random() * seededServices.length)];

        const startTime = new Date(today);
        startTime.setDate(today.getDate() - Math.floor(Math.random() * 5) - 1); // Last 5 days
        startTime.setHours(9 + Math.floor(Math.random() * 9), 0, 0, 0);

        await prisma.appointment.create({
            data: {
                clientId: randomClient.id,
                staffId: randomStaff.id,
                serviceId: randomService.id,
                locationId: location.id,
                startTime: startTime,
                duration: randomService.duration,
                status: Math.random() > 0.2 ? 'COMPLETED' : 'CANCELLED'
            }
        });
    }

    // 8. Create Products (Inventory)
    console.log('--- Seeding Products ---');
    const productData = [
        { name: 'Matte Clay Pomade', price: 25, stock: 15, sku: 'POM-001' },
        { name: 'Argan Oil Shampoo', price: 35, stock: 20, sku: 'SHA-002' },
        { name: 'Beard Growth Serum', price: 45, stock: 10, sku: 'BEA-003' },
        { name: 'Organic Body Wash', price: 18, stock: 30, sku: 'BOD-004' },
        { name: 'Hydrating Face Cream', price: 55, stock: 12, sku: 'SKI-005' },
    ];

    for (const prod of productData) {
        const existing = await prisma.product.findFirst({
            where: { name: prod.name, locationId: location.id }
        });
        if (!existing) {
            await prisma.product.create({
                data: { ...prod, locationId: location.id }
            });
        }
    }

    console.log('--- Seeding Completed Successfully! ---');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
