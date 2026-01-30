"use server";

import { getSession } from "@/actions/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getClientAppointments() {
    const session = await getSession();

    if (!session || !session.sub) {
        return { success: false, error: "Unauthorized" };
    }

    // Since our User model ID is string (cuid) but Client model ID is Int in the schema provided earlier...
    // WAIT. Let's check the schema again.
    // Schema in Step 18:
    // model User { id String ... }
    // model Client { id Int ... email String? ... }
    // The "User" table handles authentication. The "Client" table seems to be a specific entity for a business location?
    // OR, is "User" with role "CLIENT" the intended way?
    // Schema says:
    // model User { role Role ... } where Role can be CLIENT.
    // model Appointment { clientId Int ... }
    // There is a disconnect. Appointment links to `Client` (Int), but Auth User is `User` (String).
    // Usually in this PRD system:
    // 1. A User (Auth) logs in.
    // 2. They might be linked to multiple "Client" records across different businesses (since multi-tenant).
    // OR, we should link Appointment to User directly?
    // Current Schema: Appointment -> Client (Int). User -> No direct link to Client.
    // BUT User has `email`. Client has `email`.

    // STRATEGY: Find all Client records that match the User's email.
    // Then find appointments for those Client IDs.

    const userEmail = session.email;

    try {
        const clientRecords = await prisma.client.findMany({
            where: { email: userEmail },
            select: { id: true }
        });

        const clientIds = clientRecords.map(c => c.id);

        if (clientIds.length === 0) {
            return { success: true, data: [] };
        }

        const appointments = await prisma.appointment.findMany({
            where: {
                clientId: { in: clientIds }
            },
            include: {
                service: true,
                staff: {
                    select: { name: true }
                },
                location: {
                    include: {
                        business: { select: { name: true } }
                    }
                }
            },
            orderBy: {
                startTime: 'desc'
            }
        });

        return { success: true, data: appointments };

    } catch (error) {
        console.error("Error fetching client appointments:", error);
        return { success: false, error: "Failed to fetch appointments" };
    }
}
