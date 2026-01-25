"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { getClientDetails } from "@/actions/clients"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { format } from "date-fns"

export default function ClientDetailPage() {
    const { id } = useParams()
    const [client, setClient] = useState<any>(null)

    useEffect(() => {
        if (id) {
            getClientDetails(Number(id)).then(res => {
                if (res.client) setClient(res.client)
            })
        }
    }, [id])

    if (!client) return <div className="p-8">Loading...</div>

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-primary">{client.name}</h1>
                <p className="text-gray-600">{client.email}</p>
            </div>

            <h2 className="text-xl font-semibold mb-4">Bookings History</h2>
            <div className="space-y-4">
                {client.appointments.map((apt: any) => (
                    <Card key={apt.id}>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base flex justify-between">
                                <span>{apt.service.name}</span>
                                <span className={`text-sm px-2 py-1 rounded bg-gray-100 ${apt.status === 'COMPLETED' ? 'text-green-600 bg-green-50' : ''}`}>
                                    {apt.status}
                                </span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-sm text-gray-600">
                                Date: {format(new Date(apt.startTime), "PPP p")} <br />
                                Duration: {apt.duration} mins <br />
                                Price: ₹{apt.service.price}
                            </div>
                        </CardContent>
                    </Card>
                ))}
                {client.appointments.length === 0 && <p className="text-gray-500">No bookings yet.</p>}
            </div>
        </div>
    )
}
