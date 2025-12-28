"use client"

import { useEffect, useState } from "react"
import api from "@/lib/api"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { format } from "date-fns"

export default function AppointmentsPage() {
    const [appointments, setAppointments] = useState<any[]>([])

    useEffect(() => {
        api.get("/appointments").then(res => setAppointments(res.data))
    }, [])

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-6 text-primary">Appointments</h1>

            <div className="grid gap-4">
                {appointments.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-lg border border-dashed">
                        <p className="text-muted-foreground">No appointments found.</p>
                    </div>
                ) : (
                    appointments.map(apt => (
                        <Card key={apt.id} className="overflow-hidden">
                            <CardHeader className="bg-slate-50 border-b py-3">
                                <div className="flex justify-between items-center">
                                    <div className="text-sm font-medium text-muted-foreground">
                                        {format(new Date(apt.startTime), "PPP")}
                                    </div>
                                    <StatusBadge status={apt.status} />
                                </div>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-lg">{apt.service?.name}</h3>
                                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                                            <span>at</span>
                                            <span className="font-medium text-foreground">{apt.location?.name}</span>
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold text-primary">
                                            {format(new Date(apt.startTime), "p")}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {apt.duration} mins
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    )
}

function StatusBadge({ status }: { status: string }) {
    if (status === 'SCHEDULED') {
        return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                Confirmation Pending
            </span>
        )
    }
    if (status === 'CONFIRMED') {
        return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                Confirmed
            </span>
        )
    }
    if (status === 'REJECTED' || status === 'CANCELLED') {
        return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                Rejected
            </span>
        )
    }
    return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status}
        </span>
    )
}
