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
                    <p>No appointments found.</p>
                ) : (
                    appointments.map(apt => (
                        <Card key={apt.id}>
                            <CardHeader>
                                <CardTitle className="text-lg">
                                    {apt.service.name} with {apt.client.name}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex justify-between">
                                    <span>{format(new Date(apt.startTime), "PPP p")}</span>
                                    <span className="font-semibold text-primary uppercase">{apt.status}</span>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    )
}
