
"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, Users, Store, Calendar } from "lucide-react"
import api from "@/lib/api"

export default function AdminDashboard() {
    const [stats, setStats] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/admin/stats')
                setStats(res.data)
            } catch (err) {
                console.error("Failed to fetch admin stats", err)
            } finally {
                setIsLoading(false)
            }
        }
        fetchStats()
    }, [])

    if (isLoading) return <div>Loading stats...</div>

    const statCards = [
        {
            title: "Total Revenue (Platform)",
            value: "₹0.00", // Placeholder for now until payments integrated
            icon: Activity,
            description: "From all transactions"
        },
        {
            title: "Total Users",
            value: stats?.totalUsers || 0,
            icon: Users,
            description: "Registered accounts"
        },
        {
            title: "Total Salons",
            value: stats?.totalSalons || 0,
            icon: Store,
            description: `${stats?.pendingSalons || 0} Pending Approval`
        },
        {
            title: "Total Bookings",
            value: stats?.totalBookings || 0,
            icon: Calendar,
            description: "All time appointments"
        }
    ]

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-gray-900">Platform Overview</h1>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {statCards.map((stat, i) => {
                    const Icon = stat.icon
                    return (
                        <Card key={i}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    {stat.title}
                                </CardTitle>
                                <Icon className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stat.value}</div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {stat.description}
                                </p>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>
        </div>
    )
}
