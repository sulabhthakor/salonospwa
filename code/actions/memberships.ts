'use server'

import { prisma } from '@/lib/prisma';
import { getSession } from './auth';
import { revalidatePath } from 'next/cache';
import { stripe } from '@/lib/stripe';
import { headers } from 'next/headers';

// ===== MEMBERSHIP CRUD =====

export async function createMembership(data: {
    name: string;
    description?: string;
    monthlyCredits: number;
    discountPercent?: number;
    price: number;
    stripePriceId?: string;
}) {
    try {
        const session = await getSession();
        if (!session) return { error: 'Unauthorized' };

        const user = await prisma.user.findUnique({
            where: { id: session.sub },
            include: { business: { include: { locations: true } } }
        });

        if (!user?.business?.locations?.[0]) {
            return { error: 'You must have a business with a location first.' };
        }

        let stripePriceId = data.stripePriceId;

        // Auto-create Stripe Product & Price if not provided
        if (!stripePriceId && process.env.STRIPE_SECRET_KEY) {
            try {
                const product = await stripe.products.create({
                    name: `Membership: ${data.name}`,
                    description: data.description || `Monthly membership for ${user.business.name}`
                });

                const price = await stripe.prices.create({
                    product: product.id,
                    unit_amount: Math.round(data.price * 100), // Stripe expects cents
                    currency: 'inr', // Defaulting to INR based on context
                    recurring: {
                        interval: 'month'
                    }
                });

                stripePriceId = price.id;
            } catch (stripeError) {
                console.error('Stripe Resource Creation Failed:', stripeError);
                // Continue without Stripe ID? Or fail? 
                // Better to warn or fail if payments are critical.
                // For now, allow proceed but return warning?
                // Or just return error.
                return { error: 'Failed to create Stripe subscription resources' };
            }
        }

        const membership = await prisma.membership.create({
            data: {
                name: data.name,
                description: data.description,
                monthlyCredits: data.monthlyCredits,
                discountPercent: data.discountPercent || 0,
                price: data.price,
                stripePriceId: stripePriceId,
                locationId: user.business.locations[0].id
            }
        });

        revalidatePath('/dashboard/memberships');
        return { success: true, membership };
    } catch (error) {
        console.error('Create Membership Error:', error);
        return { error: 'Failed to create membership' };
    }
}

export async function updateMembership(id: number, data: {
    name?: string;
    description?: string;
    monthlyCredits?: number;
    discountPercent?: number;
    price?: number;
    stripePriceId?: string;
    isActive?: boolean;
}) {
    try {
        const session = await getSession();
        if (!session) return { error: 'Unauthorized' };

        const membership = await prisma.membership.findFirst({
            where: {
                id,
                location: {
                    business: { ownerId: session.sub }
                }
            }
        });

        if (!membership) {
            return { error: 'Membership not found or access denied' };
        }

        const updatedMembership = await prisma.membership.update({
            where: { id },
            data
        });

        revalidatePath('/dashboard/memberships');
        return { success: true, membership: updatedMembership };
    } catch (error) {
        console.error('Update Membership Error:', error);
        return { error: 'Failed to update membership' };
    }
}

export async function deleteMembership(id: number) {
    try {
        const session = await getSession();
        if (!session) return { error: 'Unauthorized' };

        const membership = await prisma.membership.findFirst({
            where: {
                id,
                location: {
                    business: { ownerId: session.sub }
                }
            }
        });

        if (!membership) {
            return { error: 'Membership not found or access denied' };
        }

        // Soft delete to preserve subscription history
        await prisma.membership.update({
            where: { id },
            data: { isActive: false }
        });

        revalidatePath('/dashboard/memberships');
        return { success: true };
    } catch (error) {
        console.error('Delete Membership Error:', error);
        return { error: 'Failed to delete membership' };
    }
}

export async function getMemberships(locationId?: number) {
    try {
        const session = await getSession();
        if (!session) return { error: 'Unauthorized' };

        let targetLocationId = locationId;

        if (!targetLocationId) {
            const user = await prisma.user.findUnique({
                where: { id: session.sub },
                include: { business: { include: { locations: true } } }
            });

            if (!user?.business?.locations?.[0]) {
                return { memberships: [] };
            }

            targetLocationId = user.business.locations[0].id;
        }

        const memberships = await prisma.membership.findMany({
            where: {
                locationId: targetLocationId,
                isActive: true
            },
            orderBy: { price: 'asc' }
        });

        return { memberships };
    } catch (error) {
        console.error('Get Memberships Error:', error);
        return { error: 'Failed to fetch memberships' };
    }
}

// ===== CLIENT MEMBERSHIP MANAGEMENT =====

export async function subscribeMembership(data: {
    clientId: number;
    membershipId: number;
    stripeSubscriptionId?: string;
}) {
    try {
        const session = await getSession();
        if (!session) return { error: 'Unauthorized' };

        const membership = await prisma.membership.findUnique({
            where: { id: data.membershipId }
        });

        if (!membership || !membership.isActive) {
            return { error: 'Membership not found or inactive' };
        }

        // Check if client already has this membership
        const existingSubscription = await prisma.clientMembership.findFirst({
            where: {
                clientId: data.clientId,
                membershipId: data.membershipId,
                status: 'ACTIVE'
            }
        });

        if (existingSubscription) {
            return { error: 'Client already has an active subscription to this membership' };
        }

        // Calculate next renewal date (30 days from now)
        const renewsAt = new Date();
        renewsAt.setDate(renewsAt.getDate() + 30);

        const clientMembership = await prisma.clientMembership.create({
            data: {
                clientId: data.clientId,
                membershipId: data.membershipId,
                stripeSubscriptionId: data.stripeSubscriptionId,
                currentCredits: membership.monthlyCredits,
                renewsAt,
                status: 'ACTIVE'
            },
            include: { membership: true }
        });

        return { success: true, clientMembership };
    } catch (error) {
        console.error('Subscribe Membership Error:', error);
        return { error: 'Failed to subscribe to membership' };
    }
}

export async function cancelMembership(clientMembershipId: number) {
    try {
        const session = await getSession();
        if (!session) return { error: 'Unauthorized' };

        const clientMembership = await prisma.clientMembership.update({
            where: { id: clientMembershipId },
            data: { status: 'CANCELLED' }
        });

        // TODO: Cancel Stripe subscription if exists
        // if (clientMembership.stripeSubscriptionId) {
        //     await stripe.subscriptions.cancel(clientMembership.stripeSubscriptionId);
        // }

        return { success: true, clientMembership };
    } catch (error) {
        console.error('Cancel Membership Error:', error);
        return { error: 'Failed to cancel membership' };
    }
}

export async function pauseMembership(clientMembershipId: number) {
    try {
        const session = await getSession();
        if (!session) return { error: 'Unauthorized' };

        const clientMembership = await prisma.clientMembership.update({
            where: { id: clientMembershipId },
            data: { status: 'PAUSED' }
        });

        return { success: true, clientMembership };
    } catch (error) {
        console.error('Pause Membership Error:', error);
        return { error: 'Failed to pause membership' };
    }
}

export async function resumeMembership(clientMembershipId: number) {
    try {
        const session = await getSession();
        if (!session) return { error: 'Unauthorized' };

        const clientMembership = await prisma.clientMembership.update({
            where: { id: clientMembershipId },
            data: { status: 'ACTIVE' }
        });

        return { success: true, clientMembership };
    } catch (error) {
        console.error('Resume Membership Error:', error);
        return { error: 'Failed to resume membership' };
    }
}

export async function getClientMemberships(clientId: number) {
    try {
        const session = await getSession();
        if (!session) return { error: 'Unauthorized' };

        const memberships = await prisma.clientMembership.findMany({
            where: { clientId },
            include: { membership: true },
            orderBy: { createdAt: 'desc' }
        });

        return { memberships };
    } catch (error) {
        console.error('Get Client Memberships Error:', error);
        return { error: 'Failed to fetch client memberships' };
    }
}

export async function getMyClientMemberships() {
    try {
        const session = await getSession();
        if (!session || !session.email) return { error: 'Unauthorized' };

        // Find client by email
        const client = await prisma.client.findFirst({
            where: { email: session.email }
        });

        if (!client) return { memberships: [] };

        return getClientMemberships(client.id);
    } catch (error) {
        console.error('Get My Memberships Error:', error);
        return { error: 'Failed to fetch your memberships' };
    }
}

// ===== CREDIT MANAGEMENT =====

export async function deductMembershipCredits(clientMembershipId: number, amount: number) {
    try {
        const session = await getSession();
        if (!session) return { error: 'Unauthorized' };

        const clientMembership = await prisma.clientMembership.findUnique({
            where: { id: clientMembershipId }
        });

        if (!clientMembership) {
            return { error: 'Membership not found' };
        }

        if (clientMembership.status !== 'ACTIVE') {
            return { error: 'Membership is not active' };
        }

        if (clientMembership.currentCredits < amount) {
            return { error: 'Insufficient credits' };
        }

        const updated = await prisma.clientMembership.update({
            where: { id: clientMembershipId },
            data: {
                currentCredits: {
                    decrement: amount
                }
            }
        });

        return { success: true, clientMembership: updated };
    } catch (error) {
        console.error('Deduct Credits Error:', error);
        return { error: 'Failed to deduct credits' };
    }
}

export async function refreshMembershipCredits(clientMembershipId: number) {
    try {
        const session = await getSession();
        if (!session) return { error: 'Unauthorized' };

        const clientMembership = await prisma.clientMembership.findUnique({
            where: { id: clientMembershipId },
            include: { membership: true }
        });

        if (!clientMembership) {
            return { error: 'Membership not found' };
        }

        // Calculate new renewal date
        const renewsAt = new Date();
        renewsAt.setDate(renewsAt.getDate() + 30);

        const updated = await prisma.clientMembership.update({
            where: { id: clientMembershipId },
            data: {
                currentCredits: clientMembership.membership.monthlyCredits,
                renewsAt
            }
        });

        return { success: true, clientMembership: updated };
    } catch (error) {
        console.error('Refresh Credits Error:', error);
        return { error: 'Failed to refresh credits' };
    }
}

// ===== HELPER: Get active membership discount =====

export async function getClientMembershipDiscount(clientId: number) {
    try {
        const activeMembership = await prisma.clientMembership.findFirst({
            where: {
                clientId,
                status: 'ACTIVE'
            },
            include: { membership: true },
            orderBy: {
                membership: { discountPercent: 'desc' }
            }
        });

        if (!activeMembership) {
            return { discountPercent: 0 };
        }

    } catch (error) {
        console.error('Get Discount Error:', error);
        return { discountPercent: 0 };
    }
}

// ===== STRIPE CHECKOUT =====

export async function createMembershipCheckoutSession(membershipId: number) {
    try {
        const session = await getSession();
        if (!session) return { error: 'Unauthorized' };

        // 1. Get Membership
        const membership = await prisma.membership.findUnique({
            where: { id: membershipId }
        });

        if (!membership || !membership.stripePriceId) {
            return { error: 'Membership not configured for online payment' };
        }

        // 2. Get Client (User must have a Client record)
        const client = await prisma.client.findFirst({
            where: { email: session.email }
        });

        if (!client) {
            return { error: 'Client profile not found. Please complete your profile.' };
        }

        // 3. Create Checkout Session
        // Use headers() to determine origin if needed, or env var
        const origin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

        const checkoutSession = await stripe.checkout.sessions.create({
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [
                {
                    price: membership.stripePriceId,
                    quantity: 1
                }
            ],
            success_url: `${origin}/dashboard/memberships?success=true`,
            cancel_url: `${origin}/dashboard/memberships?canceled=true`,
            customer_email: session.email,
            metadata: {
                type: 'membership_subscription',
                clientId: client.id.toString(),
                membershipId: membership.id.toString(),
                locationId: membership.locationId.toString()
            }
        });

        return { url: checkoutSession.url };

    } catch (error) {
        console.error('Create Checkout Session Error:', error);
        return { error: 'Failed to initiate checkout' };
    }
}
