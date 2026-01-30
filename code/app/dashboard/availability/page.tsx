"use client"

import { useEffect, useState } from "react"
import { AvailabilityScheduler } from "@/components/dashboard/availability-scheduler"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"

export default function AvailabilityPage() {
    const router = useRouter()
    const [staffId, setStaffId] = useState<string | null>(null)

    useEffect(() => {
        const storedUser = localStorage.getItem("user")
        if (storedUser) {
            const user = JSON.parse(storedUser)
            setStaffId(user.id)
        } else {
            router.push("/auth/login")
        }
    }, [router])

    if (!staffId) return null

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Availability</h1>
                <p className="text-muted-foreground">Manage your working hours and days off.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Weekly Schedule</CardTitle>
                    <CardDescription>
                        Set your standard working hours for each day of the week.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <AvailabilityScheduler staffId={staffId} />
                </CardContent>
            </Card>
        </div>
    )
}
