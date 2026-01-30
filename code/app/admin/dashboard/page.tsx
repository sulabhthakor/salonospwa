"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
    Activity,
    Users,
    Store,
    Calendar,
    ArrowRight,
    Package,
    BarChart3,
    Megaphone,
    TrendingUp,
    Settings
} from "lucide-react"
import { getAdminStats } from "@/actions/admin"

export default function AdminDashboard() {
    const [stats, setStats] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [user, setUser] = useState<{ name: string } | null>(null)

    useEffect(() => {
        const storedUser = localStorage.getItem("user")
        if (storedUser) setUser(JSON.parse(storedUser))

        const fetchStats = async () => {
            try {
                const res = await getAdminStats()
                if ('stats' in res && res.stats) setStats(res.stats)
            } catch (err) {
                console.error("Failed to fetch admin stats", err)
            } finally {
                setIsLoading(false)
            }
        }
        fetchStats()
    }, [])

    if (isLoading) {
        return (
            <div className="p-6 space-y-6 max-w-7xl mx-auto animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>)}
                </div>
            </div>
        )
    }

    return (
        <div className="p-6 space-y-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Platform Overview</h1>
                    <p className="text-muted-foreground mt-1">
                        Welcome back{user?.name ? `, ${user.name}` : ''}. Here's your platform at a glance.
                    </p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Revenue"
                    value={`₹${(stats?.totalRevenue || 0).toLocaleString()}`}
                    icon={TrendingUp}
                    trend="Platform earnings"
                    href="/admin/reports"
                />
                <StatCard
                    title="Total Users"
                    value={stats?.totalUsers || 0}
                    icon={Users}
                    trend="Registered accounts"
                    href="/admin/users"
                />
                <StatCard
                    title="Total Salons"
                    value={stats?.totalSalons || 0}
                    icon={Store}
                    trend={`${stats?.pendingSalons || 0} pending`}
                    href="/admin/salons"
                />
                <StatCard
                    title="Total Bookings"
                    value={stats?.totalBookings || 0}
                    icon={Calendar}
                    trend="All time"
                    href="/admin/reports"
                />
            </div>

            {/* Quick Management */}
            <div>
                <h2 className="text-lg font-bold tracking-tight mb-4">Quick Management</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <QuickAction
                        icon={Store}
                        title="Salons"
                        desc="Manage salons"
                        href="/admin/salons"
                    />
                    <QuickAction
                        icon={Users}
                        title="Users"
                        desc="Manage users"
                        href="/admin/users"
                    />
                    <QuickAction
                        icon={Package}
                        title="Inventory"
                        desc="Stock & products"
                        href="/admin/inventory"
                    />
                    <QuickAction
                        icon={BarChart3}
                        title="Reports"
                        desc="Analytics"
                        href="/admin/reports"
                    />
                    <QuickAction
                        icon={Megaphone}
                        title="Marketing"
                        desc="Campaigns"
                        href="/admin/marketing"
                    />
                    <QuickAction
                        icon={Settings}
                        title="Settings"
                        desc="Platform config"
                        href="/admin/dashboard"
                    />
                </div>
            </div>

            {/* Recent Activity Placeholder */}
            <Card className="shadow-sm bg-white dark:bg-zinc-900">
                <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Latest platform events and updates.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center h-32 text-muted-foreground">
                        <div className="text-center">
                            <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Activity feed coming soon...</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

// StatCard Component (matching Owner Dashboard style)
interface StatCardProps {
    title: string
    value: string | number
    icon: any
    trend: string
    href?: string
}

function StatCard({ title, value, icon: Icon, trend, href }: StatCardProps) {
    const Content = (
        <Card className="h-full transition-all duration-200 border border-slate-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    {title}
                </CardTitle>
                <div className="p-2 bg-slate-100 dark:bg-zinc-800 rounded-full shadow-sm">
                    <Icon className="h-4 w-4 text-primary" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{value}</div>
                <p className="text-xs text-muted-foreground mt-1 font-medium">
                    {trend}
                </p>
            </CardContent>
        </Card>
    )

    if (href) return <Link href={href}>{Content}</Link>
    return Content
}

// QuickAction Component (matching Owner Dashboard style)
interface QuickActionProps {
    icon: any
    title: string
    desc: string
    href: string
}

function QuickAction({ icon: Icon, title, desc, href }: QuickActionProps) {
    return (
        <Link href={href}>
            <Button
                variant="outline"
                className="w-full h-auto py-4 px-4 justify-start text-left bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 border-slate-200 dark:border-zinc-800"
            >
                <div className="bg-primary/10 p-2 rounded-full mr-3 text-primary">
                    <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-900 dark:text-white truncate">{title}</div>
                    <div className="text-xs text-muted-foreground font-normal truncate">{desc}</div>
                </div>
            </Button>
        </Link>
    )
}
