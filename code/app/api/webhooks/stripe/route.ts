import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
    const body = await req.text();
    const signature = (await headers()).get('Stripe-Signature') as string;

    let event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (error: any) {
        console.error('Webhook signature verification failed.', error.message);
        return new Response(`Webhook Error: ${error.message}`, { status: 400 });
    }

    const session = event.data.object as any;

    try {
        if (event.type === 'checkout.session.completed') {
            const metadata = session.metadata;

            // Handle Membership Subscription
            if (metadata?.type === 'membership_subscription') {
                const clientId = parseInt(metadata.clientId);
                const membershipId = parseInt(metadata.membershipId);
                const subscriptionId = session.subscription as string;

                console.log(`Processing new subscription for Client ${clientId}, Membership ${membershipId}`);

                const membership = await prisma.membership.findUnique({
                    where: { id: membershipId }
                });

                if (membership) {
                    // Calculate renewal date (30 days from now)
                    const renewsAt = new Date();
                    renewsAt.setDate(renewsAt.getDate() + 30);

                    // Create Client Membership
                    await prisma.clientMembership.create({
                        data: {
                            clientId,
                            membershipId,
                            stripeSubscriptionId: subscriptionId,
                            currentCredits: membership.monthlyCredits,
                            renewsAt,
                            status: 'ACTIVE'
                        }
                    });
                }
            }
        }

        if (event.type === 'invoice.payment_succeeded') {
            // Handle Subscription Renewal
            const subscriptionId = session.subscription as string;

            // Ensure this is a subscription invoice
            if (subscriptionId) {
                const clientMembership = await prisma.clientMembership.findFirst({
                    where: { stripeSubscriptionId: subscriptionId }
                });

                if (clientMembership) {
                    console.log(`Processing renewal for Subscription ${subscriptionId}`);

                    const membership = await prisma.membership.findUnique({
                        where: { id: clientMembership.membershipId }
                    });

                    if (membership) {
                        // Extend renewal date
                        const renewsAt = new Date();
                        renewsAt.setDate(renewsAt.getDate() + 30);

                        // Refresh credits (reset to monthly limit or accumulate? Usually reset or add)
                        // Implementing "Refresh" logic: User gets full monthly credits added? Or just set to max?
                        // Let's assume ADDITIVE for now (rollover) or RESET?
                        // "Refresh" implies resetting or topping up.
                        // Let's ADD standard monthly credits.

                        await prisma.clientMembership.update({
                            where: { id: clientMembership.id },
                            data: {
                                currentCredits: { increment: membership.monthlyCredits },
                                renewsAt,
                                status: 'ACTIVE' // Ensure it's active if it was paused/past due
                            }
                        });
                    }
                }
            }
        }
    } catch (error) {
        console.error('Webhook processing failed:', error);
        return new Response('Internal Server Error', { status: 500 });
    }

    return new Response(null, { status: 200 });
}
