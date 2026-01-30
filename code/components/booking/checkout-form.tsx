"use client"

import { useState } from "react"
import { useStripe, useElements, PaymentElement } from "@stripe/react-stripe-js"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export function CheckoutForm({ amount, onSuccess }: { amount: number, onSuccess: (paymentIntentId: string) => void }) {
    const stripe = useStripe()
    const elements = useElements()
    const [message, setMessage] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!stripe || !elements) {
            return;
        }

        setIsLoading(true)

        const { error, paymentIntent } = await stripe.confirmPayment({
            elements,
            redirect: "if_required",
        })

        if (error) {
            setMessage(error.message || "An unexpected error occurred.")
            toast.error("Payment Failed", { description: error.message })
            setIsLoading(false)
        } else if (paymentIntent && paymentIntent.status === "succeeded") {
            toast.success("Payment Successful!")
            onSuccess(paymentIntent.id)
            // Function completes here, parent handles navigation
        } else {
            setMessage("Payment status: " + (paymentIntent?.status || "unknown"))
            setIsLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white dark:bg-zinc-900 p-4 rounded-lg border border-gray-200 dark:border-gray-800">
                <PaymentElement />
            </div>
            {message && <div className="text-red-500 text-sm">{message}</div>}

            <Button
                disabled={isLoading || !stripe || !elements}
                className="w-full rounded-full shadow-lg font-bold text-lg h-12"
            >
                {isLoading ? "Processing..." : `Pay ₹${amount}`}
            </Button>
        </form>
    )
}
