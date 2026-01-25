"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getClients } from "@/actions/clients"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function ClientsPage() {
    const router = useRouter()
    const [clients, setClients] = useState<any[]>([])

    useEffect(() => {
        getClients().then(res => {
            if (res.clients) setClients(res.clients)
        })
    }, [])

    return (
        <div className="p-8 max-w-5xl mx-auto">
            <h1 className="text-3xl font-bold mb-6 text-primary">Client Management</h1>

            <div className="grid gap-4">
                {clients.length === 0 ? (
                    <p>No clients found.</p>
                ) : (
                    <div className="bg-white rounded-md border shadow-sm">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b bg-gray-50">
                                    <th className="p-4 font-medium text-gray-700">Name</th>
                                    <th className="p-4 font-medium text-gray-700">Email</th>
                                    <th className="p-4 font-medium text-gray-700">Bookings</th>
                                    <th className="p-4 font-medium text-gray-700">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {clients.map(client => (
                                    <tr key={client.id} className="border-b hover:bg-gray-50">
                                        <td className="p-4 font-medium">{client.name}</td>
                                        <td className="p-4 text-gray-600">{client.email}</td>
                                        <td className="p-4 text-gray-600">{client._count.appointments}</td>
                                        <td className="p-4">
                                            <Button
                                                variant="ghost"
                                                className="text-primary hover:text-primary/80 hover:bg-primary/5"
                                                onClick={() => router.push(`/dashboard/clients/${client.id}`)}
                                            >
                                                View History
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}
