'use server'

import { stripe } from '@/lib/stripe';
import { getSession } from './auth';

export async function createPaymentIntent(amount: number, currency: string = 'inr') {
    try {
        const session = await getSession();
        // Payment is allowed for guests too in some flows, but let's assume login for now or optional.
        // For this app, let's allow it but we might want to attach metadata.

        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100), // Stripe expects smallest currency unit (e.g., paise)
            currency,
            automatic_payment_methods: {
                enabled: true,
            },
            metadata: {
                userId: session?.sub || 'guest',
            }
        });

        return { clientSecret: paymentIntent.client_secret, id: paymentIntent.id };

    } catch (error) {
        console.error('Stripe Payment Intent Error:', error);
        return { error: 'Failed to create payment intent' };
    }
}
