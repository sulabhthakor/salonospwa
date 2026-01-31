"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { getClientDetails } from "@/actions/clients"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { format } from "date-fns"
import {
    ArrowLeft,
    Mail,
    Phone,
    Calendar,
    Clock,
    User,
    Edit,
    CreditCard,
    MapPin,
    Scissors,
    StickyNote
} from "lucide-react"

export default function ClientDetailPage() {
    const { id } = useParams()
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [client, setClient] = useState<any>(null)
    const [stats, setStats] = useState({
        totalBookings: 0,
        totalSpend: 0,
        lastVisit: null as Date | null
    })

    useEffect(() => {
        if (id) {
            getClientDetails(Number(id)).then(res => {
                if (res.client) {
                    setClient(res.client)
                    calculateStats(res.client)
                }
                setLoading(false)
            })
        }
    }, [id])

    const calculateStats = (data: any) => {
        const appointments = data.appointments || []
        const total = appointments.length

        let spend = 0
        let lastVisitDate = null

        const completedAppts = appointments.filter((a: any) => ['COMPLETED', 'CONFIRMED'].includes(a.status))

        completedAppts.forEach((a: any) => {
            spend += a.service?.price || 0
        })

        // Find last visit (past date)
        const past = appointments
            .filter((a: any) => new Date(a.startTime) < new Date())
            .sort((a: any, b: any) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())

        if (past.length > 0) {
            lastVisitDate = new Date(past[0].startTime)
        }

        setStats({
            totalBookings: total,
            totalSpend: spend,
            lastVisit: lastVisitDate
        })
    }

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)
    }

    const StatusBadge = ({ status }: { status: string }) => {
        const styles: any = {
            SCHEDULED: "bg-yellow-100 text-yellow-700 border-yellow-200",
            CONFIRMED: "bg-green-100 text-green-700 border-green-200",
            COMPLETED: "bg-blue-100 text-blue-700 border-blue-200",
            CANCELLED: "bg-red-50 text-red-600 border-red-100",
            REJECTED: "bg-red-50 text-red-600 border-red-100",
        }
        const style = styles[status] || "bg-slate-100 text-slate-700 border-slate-200"
        return (
            <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wide font-bold border ${style}`}>
                {status}
            </span>
        )
    }

    if (loading) {
        return (
            <div className="p-4 md:p-8 space-y-6 animate-pulse max-w-4xl mx-auto">
                <div className="flex gap-4 items-center mb-6">
                    <div className="h-20 w-20 bg-gray-200 rounded-full"></div>
                    <div className="space-y-2">
                        <div className="h-6 w-48 bg-gray-200 rounded"></div>
                        <div className="h-4 w-32 bg-gray-200 rounded"></div>
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-200 rounded-xl"></div>)}
                </div>
                <div className="h-64 bg-gray-200 rounded-xl"></div>
            </div>
        )
    }

    if (!client) return <div className="p-8 text-center text-red-500">Client not found</div>

    return (
        <div className="min-h-screen bg-white pb-20 md:pb-8">
            <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8">

                {/* Header & Navigation */}
                <div className="flex items-center justify-between">
                    <Button variant="ghost" size="sm" onClick={() => router.back()} className="-ml-2 text-slate-600 hover:text-primary">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Clients
                    </Button>
                    <Button variant="outline" size="sm" className="hidden md:flex">
                        <Edit className="w-4 h-4 mr-2" /> Edit Profile
                    </Button>
                </div>

                {/* Profile Profile */}
                <div className="bg-white md:border border-slate-200 md:shadow-sm md:rounded-2xl md:p-6 flex flex-col md:flex-row gap-6 items-start">
                    <div className="h-24 w-24 rounded-full bg-gradient-to-br from-primary/20 to-purple-100 flex items-center justify-center text-primary font-bold text-3xl shadow-inner shrink-0">
                        {getInitials(client.name)}
                    </div>

                    <div className="flex-1 w-full relative">
                        {/* Mobile Edit Button */}
                        <Button variant="ghost" size="icon" className="absolute right-0 top-0 md:hidden text-slate-400">
                            <Edit className="w-5 h-5" />
                        </Button>

                        <h1 className="text-3xl font-bold text-gray-900 leading-tight">{client.name}</h1>
                        <p className="text-sm text-slate-500 flex items-center gap-1 mt-1 mb-4">
                            Member since {format(new Date(client.createdAt), "MMMM d, yyyy")}
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-8">
                            <div className="flex items-center gap-3 text-slate-700">
                                <div className="p-2 bg-slate-50 rounded-full text-slate-400">
                                    <Mail className="w-4 h-4" />
                                </div>
                                <span className="text-sm font-medium">{client.email || "No email provided"}</span>
                            </div>
                            <div className="flex items-center gap-3 text-slate-700">
                                <div className="p-2 bg-slate-50 rounded-full text-slate-400">
                                    <Phone className="w-4 h-4" />
                                </div>
                                <span className="text-sm font-medium">{client.phone || "No phone provided"}</span>
                            </div>
                        </div>

                        {client.notes && (
                            <div className="mt-5 p-3 bg-yellow-50 rounded-lg border border-yellow-100 text-sm text-yellow-800 flex gap-3">
                                <StickyNote className="w-4 h-4 shrink-0 mt-0.5" />
                                <p>{client.notes}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-3 md:gap-6">
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center text-center">
                        <div className="text-2xl font-bold text-slate-900">{stats.totalBookings}</div>
                        <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mt-1">Bookings</div>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center text-center">
                        <div className="text-2xl font-bold text-slate-900">₹{stats.totalSpend.toLocaleString()}</div>
                        <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mt-1">Total Spend</div>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center text-center">
                        <div className="text-lg md:text-xl font-bold text-slate-900">
                            {stats.lastVisit ? format(stats.lastVisit, "dd MMM") : "-"}
                        </div>
                        <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mt-1">Last Visit</div>
                    </div>
                </div>

                <Separator className="bg-slate-100" />

                {/* Booking History */}
                <div>
                    <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-primary" /> Booking History
                    </h2>

                    <div className="space-y-4">
                        {client.appointments.length === 0 ? (
                            <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                <p className="text-slate-500">No booking history available.</p>
                            </div>
                        ) : (
                            client.appointments.map((apt: any) => (
                                <div key={apt.id} className="group bg-white rounded-xl border border-slate-200 shadow-sm p-4 hover:border-primary/30 transition-all duration-200">
                                    <div className="flex flex-col sm:flex-row justify-between gap-4">
                                        <div className="flex items-start gap-4">
                                            <div className="flex flex-col items-center justify-center w-14 h-14 bg-slate-50 rounded-lg border border-slate-100 shrink-0">
                                                <span className="text-xs font-bold text-slate-400 uppercase">{format(new Date(apt.startTime), "MMM")}</span>
                                                <span className="text-lg font-bold text-slate-900 leading-none my-0.5">{format(new Date(apt.startTime), "d")}</span>
                                            </div>

                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="font-bold text-gray-900">{apt.service.name}</h3>
                                                    <StatusBadge status={apt.status} />
                                                </div>

                                                <div className="text-sm text-slate-500 space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        {format(new Date(apt.startTime), "h:mm a")} • {apt.duration} mins
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <User className="w-3.5 h-3.5" />
                                                        With {apt.staff?.name || "Staff"}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-row sm:flex-col items-end justify-between sm:justify-center border-t sm:border-t-0 border-slate-50 pt-3 sm:pt-0 mt-2 sm:mt-0">
                                            <div className="font-bold text-slate-900 text-lg">₹{apt.service.price}</div>
                                            <Button variant="ghost" size="sm" className="h-7 text-xs text-primary hover:bg-primary/5 px-0 sm:px-3">
                                                View Details
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

            </div>
        </div>
    )
}
