"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = require("bcrypt");
const prisma = new client_1.PrismaClient();
async function main() {
    const password = await bcrypt.hash('password123', 10);
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
    let business = await prisma.business.findFirst({
        where: { ownerId: owner.id }
    });
    if (business) {
        await prisma.business.update({
            where: { id: business.id },
            data: { status: 'APPROVED' }
        });
    }
    else {
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
    if (!business)
        return;
    let location = await prisma.location.findFirst({
        where: { businessId: business.id }
    });
    if (!location) {
        location = await prisma.location.create({
            data: {
                name: 'Main Branch',
                businessId: business.id
            }
        });
    }
    console.log({ location });
    const services = ['Haircut', 'Massage', 'Manicure'];
    for (const svcName of services) {
        const existing = await prisma.service.findFirst({
            where: {
                name: svcName,
                locationId: location.id
            }
        });
        if (!existing) {
            await prisma.service.create({
                data: {
                    name: svcName,
                    duration: 60,
                    price: 50,
                    locationId: location.id
                }
            });
        }
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
//# sourceMappingURL=seed.js.map