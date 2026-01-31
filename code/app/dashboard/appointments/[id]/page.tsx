"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { getAppointmentDetails, updateAppointmentStatus, rescheduleAppointment } from "@/actions/appointments"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { format } from "date-fns"
import { toast } from "sonner"
import {
    ArrowLeft,
    Calendar,
    Clock,
    MapPin,
    User,
    CheckCircle,
    XCircle,
    CalendarDays,
    Phone,
    Mail,
    CreditCard,
    Scissors
} from "lucide-react"

export default function AppointmentDetailsPage() {
    const { id } = useParams()
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [appointment, setAppointment] = useState<any>(null)
    const [rescheduleOpen, setRescheduleOpen] = useState(false)
    const [newDate, setNewDate] = useState("")
    const [newTime, setNewTime] = useState("")
    const [actionLoading, setActionLoading] = useState(false)

    useEffect(() => {
        if (id) fetchDetails();
    }, [id])

    const fetchDetails = () => {
        getAppointmentDetails(Number(id)).then(res => {
            if (res.appointment) {
                setAppointment(res.appointment)
            } else {
                toast.error(res.error || "Failed to load appointment")
            }
            setLoading(false)
        })
    }

    const handleStatusUpdate = async (status: string) => {
        setActionLoading(true)
        const res = await updateAppointmentStatus(Number(id), status)
        if (res.success) {
            toast.success(`Appointment ${status.toLowerCase()}`)
            setAppointment(res.appointment)
            // Re-fetch to get fresh state if needed, but updated object returned
            fetchDetails()
        } else {
            toast.error(res.error || "Failed to update status")
        }
        setActionLoading(false)
    }

    const handleReschedule = async () => {
        if (!newDate || !newTime) {
            toast.error("Please select date and time")
            return
        }
        setActionLoading(true)
        const combined = new Date(`${newDate}T${newTime}`)
        const res = await rescheduleAppointment(Number(id), combined.toISOString())
        if (res.success) {
            toast.success("Appointment rescheduled")
            setRescheduleOpen(false)
            fetchDetails()
        } else {
            toast.error(res.error || "Failed to reschedule")
        }
        setActionLoading(false)
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
            <span className={`px-3 py-1 rounded-full text-xs uppercase tracking-wide font-bold border ${style}`}>
                {status}
            </span>
        )
    }

    if (loading) {
        return (
            <div className="p-4 md:p-8 space-y-6 animate-pulse max-w-3xl mx-auto">
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                <div className="h-64 bg-gray-200 rounded-xl"></div>
            </div>
        )
    }

    if (!appointment) return <div className="p-8 text-center">Appointment not found</div>

    return (
        <div className="min-h-screen bg-white pb-20 md:pb-8">
            <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex flex-col gap-4">
                    <Button variant="ghost" size="sm" onClick={() => router.back()} className="-ml-2 w-fit text-slate-600 hover:text-primary">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Appointments
                    </Button>
                    <div className="flex items-start justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Appointment Details</h1>
                            <p className="text-slate-500 text-sm mt-1">ID: #{appointment.id}</p>
                        </div>
                        <StatusBadge status={appointment.status} />
                    </div>
                </div>

                {/* Service Card */}
                <Card className="border-slate-200 shadow-sm overflow-hidden">
                    <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center">
                        <div className="font-semibold text-slate-700 flex items-center gap-2">
                            <Scissors className="w-4 h-4" /> Service Info
                        </div>
                        <div className="font-bold text-primary text-lg">₹{appointment.service?.price}</div>
                    </div>
                    <CardContent className="p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-2">{appointment.service?.name}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 text-slate-600">
                                    <Clock className="w-5 h-5 text-slate-400" />
                                    <div>
                                        <div className="text-xs text-slate-500 uppercase font-medium">Time & Duration</div>
                                        <div>{format(new Date(appointment.startTime), "h:mm a")} ({appointment.duration} mins)</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 text-slate-600">
                                    <Calendar className="w-5 h-5 text-slate-400" />
                                    <div>
                                        <div className="text-xs text-slate-500 uppercase font-medium">Date</div>
                                        <div>{format(new Date(appointment.startTime), "EEEE, MMMM d, yyyy")}</div>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 text-slate-600">
                                    <User className="w-5 h-5 text-slate-400" />
                                    <div>
                                        <div className="text-xs text-slate-500 uppercase font-medium">Staff</div>
                                        <div>{appointment.staff?.name || "Unassigned"}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 text-slate-600">
                                    <MapPin className="w-5 h-5 text-slate-400" />
                                    <div>
                                        <div className="text-xs text-slate-500 uppercase font-medium">Location</div>
                                        <div>{appointment.location?.name || "Salon"}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Client Card */}
                <Card className="border-slate-200 shadow-sm">
                    <div className="bg-slate-50 p-4 border-b border-slate-100 font-semibold text-slate-700 flex items-center gap-2">
                        <User className="w-4 h-4" /> Client Details
                    </div>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                                {appointment.client?.name?.[0] || "C"}
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-gray-900">{appointment.client?.name}</h3>
                                <Button variant="link" className="h-auto p-0 text-primary text-sm" onClick={() => router.push(`/dashboard/clients/${appointment.client?.id}`)}>View Profile</Button>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center gap-2 text-slate-600">
                                <Mail className="w-4 h-4 text-slate-400" /> {appointment.client?.email || "No email"}
                            </div>
                            <div className="flex items-center gap-2 text-slate-600">
                                <Phone className="w-4 h-4 text-slate-400" /> {appointment.client?.phone || "No phone"}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Actions */}
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 md:static md:p-0 md:bg-transparent md:border-0">
                    <div className="max-w-3xl mx-auto flex flex-col sm:flex-row gap-3">

                        {appointment.status === 'SCHEDULED' && (
                            <>
                                <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white" onClick={() => handleStatusUpdate('CONFIRMED')} disabled={actionLoading}>
                                    <CheckCircle className="w-4 h-4 mr-2" /> Confirm Appointment
                                </Button>
                                <Button variant="outline" className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => handleStatusUpdate('REJECTED')} disabled={actionLoading}>
                                    <XCircle className="w-4 h-4 mr-2" /> Reject
                                </Button>
                            </>
                        )}

                        {appointment.status === 'CONFIRMED' && (
                            <Button variant="outline" className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => handleStatusUpdate('CANCELLED')} disabled={actionLoading}>
                                <XCircle className="w-4 h-4 mr-2" /> Cancel Appointment
                            </Button>
                        )}

                        <Dialog open={rescheduleOpen} onOpenChange={setRescheduleOpen}>
                            <DialogTrigger asChild>
                                <Button variant="secondary" className="flex-1" disabled={['COMPLETED', 'CANCELLED', 'REJECTED'].includes(appointment.status)}>
                                    <CalendarDays className="w-4 h-4 mr-2" /> Reschedule
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Reschedule Appointment</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">New Date</label>
                                        <input type="date" className="w-full p-2 border rounded-md" value={newDate} onChange={e => setNewDate(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">New Time</label>
                                        <input type="time" className="w-full p-2 border rounded-md" value={newTime} onChange={e => setNewTime(e.target.value)} />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setRescheduleOpen(false)}>Cancel</Button>
                                    <Button onClick={handleReschedule} disabled={actionLoading}>Save Changes</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>

                    </div>
                </div>

            </div>
        </div>
    )
}
