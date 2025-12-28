"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import api from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Users, Scissors, TrendingUp, Plus, Clock, ArrowRight, Settings } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"

export default function DashboardPage() {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [stats, setStats] = useState({
        todayAppointments: 0,
        totalClients: 0,
        activeServices: 0,
        revenue: 0 // Placeholder
    })
    const [upcomingAppointments, setUpcomingAppointments] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const token = localStorage.getItem("token")
        if (!token) {
            router.push("/auth/login")
            return
        }

        const loadData = async () => {
            try {
                // 1. Load User
                const storedUser = localStorage.getItem("user")
                if (storedUser && storedUser !== "undefined") {
                    setUser(JSON.parse(storedUser))
                }

                // 2. Fetch Stats only if Owner
                // Clients use a separate component that fetches its own data
                if (storedUser && JSON.parse(storedUser).role === 'OWNER') {
                    const [clientsRes, servicesRes, appointmentsRes] = await Promise.all([
                        api.get("/clients").catch(() => ({ data: [] })),
                        api.get("/services").catch(() => ({ data: [] })),
                        api.get("/appointments").catch(() => ({ data: [] }))
                    ])
                    const appointments = appointmentsRes.data || []
                    // Filter for "Today"
                    const today = new Date().toISOString().split('T')[0]
                    const todayCount = appointments.filter((a: any) => a.startTime.startsWith(today)).length
                    setStats({
                        todayAppointments: todayCount,
                        totalClients: clientsRes.data.length || 0,
                        activeServices: servicesRes.data.length || 0,
                        revenue: 0
                    })
                    const upcoming = appointments
                        .filter((a: any) => new Date(a.startTime) > new Date())
                        .sort((a: any, b: any) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                        .slice(0, 3)
                    setUpcomingAppointments(upcoming)
                }

            } catch (error) {
                console.error("Dashboard Load Error", error)
                toast.error("Failed to load dashboard data")
            } finally {
                setLoading(false)
            }
        }

        loadData()
    }, [router])

    if (loading) {
        return (
            <div className="p-8 space-y-6 animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>)}
                </div>
            </div>
        )
    }

    if (!user) return null

    // Redirect Admin
    if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
        router.push("/admin/dashboard")
        return null
    }

    // Client Dashboard View
    if (user.role === 'CLIENT') {
        return <ClientDashboard user={user} router={router} />
    }

    // Owner / Staff Dashboard View
    return (
        <div className="p-6 space-y-8 max-w-7xl mx-auto">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard</h1>
                    <p className="text-muted-foreground mt-1">
                        Welcome back, <span className="font-semibold text-primary">{user.name}</span>. Here's what's happening today.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button onClick={() => router.push("/book")} className="bg-primary shadow-sm hover:shadow-md transition-all">
                        <Plus className="w-4 h-4 mr-2" /> New Booking
                    </Button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Appointments Today"
                    value={stats.todayAppointments}
                    icon={Calendar}
                    trend="+2 from yesterday"
                />
                <StatCard
                    title="Active Clients"
                    value={stats.totalClients}
                    icon={Users}
                    trend="Total database"
                />
                <StatCard
                    title="Services Menu"
                    value={stats.activeServices}
                    icon={Scissors}
                    trend="Live services"
                />
                <StatCard
                    title="Revenue (Est.)"
                    value="₹0"
                    icon={TrendingUp}
                    trend="Coming soon"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Main Content: Upcoming Appointments */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold tracking-tight">Upcoming Appointments</h2>
                        <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard/appointments")} className="text-primary hover:text-primary/80">
                            View Calendar <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                    </div>

                    {upcomingAppointments.length > 0 ? (
                        <div className="space-y-4">
                            {upcomingAppointments.map((apt) => (
                                <Card key={apt.id} className="group hover:shadow-md transition-all border-l-4 border-l-primary/50 overflow-hidden">
                                    <CardContent className="p-5 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                                                {format(new Date(apt.startTime), "d")}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-gray-900">{apt.service?.name || "Service"}</h3>
                                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {format(new Date(apt.startTime), "h:mm a")} • {apt.client?.name || "Client"}
                                                </p>
                                            </div>
                                        </div>
                                        <Button variant="outline" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                            Details
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <Card className="bg-slate-50 border-dashed">
                            <CardContent className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                                <Calendar className="w-12 h-12 mb-3 text-slate-300" />
                                <p className="font-medium">No upcoming appointments</p>
                                <p className="text-sm opacity-70">Get started by booking a new service.</p>
                                <Button variant="link" onClick={() => router.push("/book")} className="mt-2 text-primary">Book Now</Button>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Sidebar: Quick Actions */}
                <div className="space-y-6">
                    <h2 className="text-xl font-bold tracking-tight">Quick Actions</h2>
                    <div className="grid grid-cols-1 gap-3">
                        <QuickAction
                            icon={Users}
                            title="Manage Clients"
                            desc="View and add customers"
                            onClick={() => router.push("/dashboard/clients")}
                        />
                        <QuickAction
                            icon={Scissors}
                            title="Service Menu"
                            desc="Update prices & items"
                            onClick={() => router.push("/dashboard/services")}
                        />
                        <QuickAction
                            icon={Settings}
                            title="Business Setup"
                            desc="Manage profile details"
                            onClick={() => router.push("/dashboard/onboarding")}
                        />
                    </div>

                    <Card className="bg-gradient-to-br from-primary/90 to-blue-600 text-white border-none shadow-lg mt-6">
                        <CardHeader>
                            <CardTitle className="text-lg">Pro Tip</CardTitle>
                            <CardDescription className="text-white/80">
                                Complete your business profile to attract more clients.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button size="sm" variant="secondary" className="w-full font-semibold" onClick={() => router.push("/dashboard/onboarding")}>
                                Complete Profile
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

function ClientDashboard({ user, router }: any) {
    const [myAppointments, setMyAppointments] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Fetch only user's appointments
        api.get("/appointments").then(res => {
            setMyAppointments(res.data)
        }).catch(err => {
            // Fallback if endpoint doesn't exist, though it should ideally
            console.error(err)
        }).finally(() => setLoading(false))
    }, [])

    return (
        <div className="p-6 space-y-8 max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">My Dashboard</h1>
                    <p className="text-muted-foreground mt-1">
                        Hello, <span className="font-semibold text-primary">{user.name}</span>. Manage your bookings here.
                    </p>
                </div>
                <Button onClick={() => router.push("/book")} className="bg-primary shadow-sm hover:shadow-md transition-all">
                    <Plus className="w-4 h-4 mr-2" /> Book Appointment
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Your Upcoming Appointments</CardTitle>
                    <CardDescription>See what you have scheduled.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-10">Loading...</div>
                    ) : myAppointments.length > 0 ? (
                        <div className="space-y-4">
                            {myAppointments.map((apt) => (
                                <Card key={apt.id} className="group hover:shadow-md transition-all border-l-4 border-l-primary/50">
                                    <CardContent className="p-5 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                                                {format(new Date(apt.startTime), "d")}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-gray-900">{apt.service?.name || "Service"}</h3>
                                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {format(new Date(apt.startTime), "d MMM, yyyy • h:mm a")}
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                            <p className="font-medium text-muted-foreground">No upcoming appointments</p>
                            <Button variant="link" onClick={() => router.push("/book")} className="mt-1">Book some self-care</Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

function StatCard({ title, value, icon: Icon, trend }: any) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                    {title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                    {trend}
                </p>
            </CardContent>
        </Card>
    )
}

function QuickAction({ icon: Icon, title, desc, onClick }: any) {
    return (
        <Button variant="outline" className="h-auto py-4 px-4 justify-start text-left hover:border-primary hover:bg-primary/5 transition-all group" onClick={onClick}>
            <div className="bg-slate-100 p-2 rounded-full mr-4 group-hover:bg-white group-hover:text-primary transition-colors">
                <Icon className="w-5 h-5" />
            </div>
            <div>
                <div className="font-semibold text-gray-900">{title}</div>
                <div className="text-xs text-muted-foreground font-normal">{desc}</div>
            </div>
            <ArrowRight className="ml-auto w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0" />
        </Button>
    )
}
