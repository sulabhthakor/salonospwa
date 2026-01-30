'use client'

import { useState } from 'react'
import { createMembershipCheckoutSession } from '@/actions/memberships'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, Check } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface Membership {
    id: number
    name: string
    description?: string | null
    price: number
    monthlyCredits: number
    discountPercent: number
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any
}

interface ClientMembership {
    id: number
    status: string
    currentCredits: number
    renewsAt: any
    membership: Membership
}

interface MembershipListProps {
    available: Membership[]
    myMemberships?: any[]
}

export default function MembershipList({ available, myMemberships = [] }: MembershipListProps) {
    const [loadingId, setLoadingId] = useState<number | null>(null)
    const router = useRouter()

    const activeSubscription = myMemberships.find((m: any) => m.status === 'ACTIVE')

    const handleSubscribe = async (membershipId: number) => {
        try {
            setLoadingId(membershipId)
            const result = await createMembershipCheckoutSession(membershipId)

            if (result.error) {
                toast.error(result.error)
            } else if (result.url) {
                window.location.href = result.url
            }
        } catch (error) {
            console.error(error)
            toast.error('Something went wrong')
        } finally {
            setLoadingId(null)
        }
    }

    return (
        <div className="space-y-10">
            {/* My Active Subscription */}
            {activeSubscription && (
                <section>
                    <h2 className="text-2xl font-bold mb-4">My Subscription</h2>
                    <Card className="border-purple-500/50 bg-purple-50/50 dark:bg-purple-900/10">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-xl">{activeSubscription.membership.name}</CardTitle>
                                    <CardDescription>
                                        Renews on {new Date(activeSubscription.renewsAt).toLocaleDateString()}
                                    </CardDescription>
                                </div>
                                <Badge className="bg-green-500">Active</Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-background rounded-lg border">
                                    <div className="text-sm text-muted-foreground">My Credits</div>
                                    <div className="text-2xl font-bold">{activeSubscription.currentCredits.toFixed(1)}</div>
                                </div>
                                <div className="p-4 bg-background rounded-lg border">
                                    <div className="text-sm text-muted-foreground">Monthly Benefit</div>
                                    <div className="text-2xl font-bold">{activeSubscription.membership.monthlyCredits} credits</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </section>
            )}

            {/* Available Plans */}
            <section>
                <h2 className="text-2xl font-bold mb-4">Available Plans</h2>
                <div className="grid md:grid-cols-3 gap-6">
                    {available.map((plan) => (
                        <Card key={plan.id} className="relative overflow-hidden hover:shadow-lg transition-shadow">
                            {activeSubscription?.membershipId === plan.id && (
                                <div className="absolute top-0 right-0 p-2">
                                    <Badge variant="secondary">Current Plan</Badge>
                                </div>
                            )}
                            <CardHeader>
                                <CardTitle>{plan.name}</CardTitle>
                                <CardDescription>{plan.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="text-3xl font-bold">
                                    {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(plan.price)}
                                    <span className="text-sm font-normal text-muted-foreground">/mo</span>
                                </div>

                                <ul className="space-y-2 text-sm">
                                    <li className="flex items-center gap-2">
                                        <Check className="w-4 h-4 text-green-500" />
                                        <span>{plan.monthlyCredits} Credits monthly</span>
                                    </li>
                                    {plan.discountPercent > 0 && (
                                        <li className="flex items-center gap-2">
                                            <Check className="w-4 h-4 text-green-500" />
                                            <span>{plan.discountPercent}% Discount on all services</span>
                                        </li>
                                    )}
                                </ul>
                            </CardContent>
                            <CardFooter>
                                {activeSubscription?.membershipId === plan.id ? (
                                    <Button disabled className="w-full">Subscribed</Button>
                                ) : (
                                    <Button
                                        className="w-full"
                                        onClick={() => handleSubscribe(plan.id)}
                                        disabled={!!loadingId || !!activeSubscription}
                                    >
                                        {loadingId === plan.id && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                        {activeSubscription ? 'Change Plan' : 'Subscribe Now'}
                                    </Button>
                                )}
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </section>
        </div>
    )
}
