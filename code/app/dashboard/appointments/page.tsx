"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getAppointments } from "@/actions/appointments"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import {
    Calendar,
    Clock,
    MapPin,
    User,
    Search,
    Filter,
    Plus,
    MoreHorizontal,
    CheckCircle2,
    XCircle,
    AlertCircle,
    ArrowLeft
} from "lucide-react"

export default function AppointmentsPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [appointments, setAppointments] = useState<any[]>([])
    const [filteredAppointments, setFilteredAppointments] = useState<any[]>([])

    // Filters
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState("ALL")

    // Stats
    const [stats, setStats] = useState({
        total: 0,
        confirmed: 0,
        pending: 0,
        cancelled: 0
    })

    useEffect(() => {
        const loadData = async () => {
            try {
                const res = await getAppointments()
                if (res.appointments) {
                    setAppointments(res.appointments)
                    setFilteredAppointments(res.appointments)
                    calculateStats(res.appointments)
                }
            } catch (err) {
                console.error("Failed to load appointments", err)
            } finally {
                setLoading(false)
            }
        }
        loadData()
    }, [])

    useEffect(() => {
        let res = [...appointments]

        if (searchQuery) {
            const lower = searchQuery.toLowerCase()
            res = res.filter(a =>
                a.client?.name?.toLowerCase().includes(lower) ||
                a.service?.name?.toLowerCase().includes(lower)
            )
        }

        if (statusFilter !== "ALL") {
            res = res.filter(a => a.status === statusFilter)
        }

        setFilteredAppointments(res)
    }, [searchQuery, statusFilter, appointments])

    const calculateStats = (data: any[]) => {
        setStats({
            total: data.length,
            confirmed: data.filter(a => a.status === 'CONFIRMED').length,
            pending: data.filter(a => a.status === 'SCHEDULED').length,
            cancelled: data.filter(a => ['CANCELLED', 'REJECTED'].includes(a.status)).length
        })
    }

    if (loading) {
        return (
            <div className="p-4 md:p-8 space-y-6 animate-pulse max-w-7xl mx-auto">
                <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-gray-200 rounded-xl"></div>)}
                </div>
                <div className="h-12 bg-gray-200 rounded-xl w-full"></div>
                <div className="space-y-4">
                    {[1, 2, 3].map(i => <div key={i} className="h-40 bg-gray-200 rounded-xl"></div>)}
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-white pb-20 md:pb-8">
            <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" onClick={() => router.back()} className="-ml-2">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Appointments</h1>
                            <p className="text-sm text-muted-foreground">Manage your booking schedule.</p>
                        </div>
                    </div>
                    <Button onClick={() => router.push("/book")} className="w-full md:w-auto bg-primary shadow-sm">
                        <Plus className="w-4 h-4 mr-2" /> New Appointment
                    </Button>
                </div>

                {/* Mobile-optimized Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
                    <StatBox label="Total" value={stats.total} icon={Calendar} color="bg-blue-50 text-blue-700" />
                    <StatBox label="Confirmed" value={stats.confirmed} icon={CheckCircle2} color="bg-green-50 text-green-700" />
                    <StatBox label="Pending" value={stats.pending} icon={AlertCircle} color="bg-yellow-50 text-yellow-700" />
                    <StatBox label="Cancelled" value={stats.cancelled} icon={XCircle} color="bg-red-50 text-red-700" />
                </div>

                {/* Filters Toolbar */}
                <div className="sticky top-0 z-10 bg-white/95 backdrop-blur pt-2 pb-4 border-b border-gray-100 flex flex-col md:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search client or service..."
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0 no-scrollbar">
                        <FilterButton label="All" active={statusFilter === "ALL"} onClick={() => setStatusFilter("ALL")} />
                        <FilterButton label="Confirmed" active={statusFilter === "CONFIRMED"} onClick={() => setStatusFilter("CONFIRMED")} />
                        <FilterButton label="Pending" active={statusFilter === "SCHEDULED"} onClick={() => setStatusFilter("SCHEDULED")} />
                    </div>
                </div>

                {/* Appointments List */}
                <div className="space-y-4">
                    {filteredAppointments.length === 0 ? (
                        <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                            <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                            <p className="font-semibold text-slate-900">No appointments found</p>
                            <p className="text-sm text-slate-500 max-w-xs mx-auto mt-1">Try adjusting your filters or search terms.</p>
                            {statusFilter !== "ALL" && (
                                <Button variant="link" onClick={() => setStatusFilter("ALL")} className="mt-2 text-primary">Clear Filters</Button>
                            )}
                        </div>
                    ) : (
                        filteredAppointments.map(apt => (
                            <div key={apt.id} className="group bg-white rounded-xl border border-slate-200 shadow-sm p-4 hover:shadow-md hover:border-primary/30 transition-all duration-200 cursor-pointer" onClick={() => router.push(`/dashboard/appointments/${apt.id}`)}>
                                <div className="flex flex-col md:flex-row gap-4 justify-between">

                                    {/* Left: Time & Avatar */}
                                    <div className="flex gap-4">
                                        {/* Date/Time Column */}
                                        <div className="flex flex-col items-center justify-center w-16 h-16 bg-slate-50 rounded-lg border border-slate-100 shrink-0">
                                            <span className="text-xs font-bold text-slate-500 uppercase">{format(new Date(apt.startTime), "MMM")}</span>
                                            <span className="text-xl font-bold text-slate-900 leading-none my-0.5">{format(new Date(apt.startTime), "d")}</span>
                                            <span className="text-xs text-slate-400">{format(new Date(apt.startTime), "EEE")}</span>
                                        </div>

                                        {/* Info Column */}
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="font-bold text-gray-900 text-base">{apt.service?.name || "Service"}</h3>
                                                <StatusBadge status={apt.status} />
                                            </div>

                                            <div className="text-sm text-slate-600 flex items-center gap-2">
                                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                                {format(new Date(apt.startTime), "h:mm a")}
                                                <span className="text-slate-300">•</span>
                                                {apt.duration} mins
                                            </div>

                                            <div className="flex items-center gap-2 text-sm text-slate-600 mt-1">
                                                <User className="w-3.5 h-3.5 text-slate-400" />
                                                <span className="font-medium text-slate-700">{apt.client?.name || "Client"}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Location & Actions */}
                                    <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-4 mt-2 md:mt-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                                        <div className="text-sm text-slate-500 flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md">
                                            <MapPin className="w-3.5 h-3.5" />
                                            {apt.location?.name || "Main Salon"}
                                        </div>

                                        <Button variant="ghost" size="sm" className="h-8 md:w-full text-slate-500 hover:text-primary hover:bg-primary/5">
                                            Details <MoreHorizontal className="w-4 h-4 ml-1.5" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}

// Sub-components for cleaner code

function StatBox({ label, value, icon: Icon, color }: any) {
    return (
        <div className={`p-4 rounded-xl border border-slate-100 ${color} bg-opacity-30 flex flex-col items-center justify-center text-center`}>
            <div className={`p-2 rounded-full bg-white/50 mb-2`}>
                <Icon className="w-5 h-5" />
            </div>
            <div className="text-2xl font-bold leading-none">{value}</div>
            <div className="text-xs font-medium opacity-80 mt-1">{label}</div>
        </div>
    )
}

function FilterButton({ label, active, onClick }: any) {
    return (
        <button
            onClick={onClick}
            className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-all ${active
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                }`}
        >
            {label}
        </button>
    )
}

function StatusBadge({ status }: { status: string }) {
    const styles: any = {
        SCHEDULED: "bg-yellow-100 text-yellow-700 border-yellow-200",
        CONFIRMED: "bg-green-100 text-green-700 border-green-200",
        CANCELLED: "bg-red-50 text-red-600 border-red-100",
        REJECTED: "bg-red-50 text-red-600 border-red-100",
    }
    const labels: any = {
        SCHEDULED: "Pending",
        CONFIRMED: "Confirmed",
        CANCELLED: "Cancelled",
        REJECTED: "Rejected"
    }

    const style = styles[status] || "bg-slate-100 text-slate-700 border-slate-200"
    const label = labels[status] || status

    return (
        <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wide font-bold border ${style}`}>
            {label}
        </span>
    )
}
