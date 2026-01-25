
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Verifying Database Counts ---');

    const users = await prisma.user.count();
    const businesses = await prisma.business.count();
    const locations = await prisma.location.count();
    const services = await prisma.service.count();
    const clients = await prisma.client.count();
    const appointments = await prisma.appointment.count();
    const products = await prisma.product.count();

    console.log(`Users: ${users}`);
    console.log(`Businesses: ${businesses}`);
    console.log(`Locations: ${locations}`);
    console.log(`Services: ${services}`);
    console.log(`Clients: ${clients}`);
    console.log(`Appointments: ${appointments}`);
    console.log(`Products: ${products}`);

    console.log('--- Verification Complete ---');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
