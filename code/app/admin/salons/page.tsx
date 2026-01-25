
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Check, X, Building2 } from "lucide-react"
import { getAdminSalons, updateSalonStatus } from "@/actions/admin"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { toast } from "sonner"

export default function SalonsPage() {
    const [salons, setSalons] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const fetchSalons = async () => {
        try {
            const res = await getAdminSalons()
            if (res.salons) setSalons(res.salons)
        } catch (err) {
            console.error("Failed to fetch salons", err)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchSalons()
    }, [])

    const handleStatusUpdate = async (id: string, status: 'APPROVED' | 'REJECTED') => {
        try {
            const res = await updateSalonStatus(id, status)
            if (res.success) {
                toast(`Salon ${status === 'APPROVED' ? 'Approved' : 'Rejected'}`, {
                    description: "The salon status has been updated.",
                })
                fetchSalons() // Refresh list
            } else {
                toast.error("Error", { description: res.error || "Failed" })
            }
        } catch (err) {
            toast.error("Error", {
                description: "Failed to update status",
            })
        }
    }

    if (isLoading) return <div>Loading salons...</div>

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Salons Management</h1>
            </div>

            <div className="bg-white rounded-lg border shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Owner</TableHead>
                            <TableHead>Locations</TableHead>
                            <TableHead>Registered</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {salons.map((salon) => (
                            <TableRow key={salon.id}>
                                <TableCell className="font-medium">
                                    <div className="flex items-center gap-2">
                                        <Building2 className="w-4 h-4 text-gray-400" />
                                        {salon.name}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span>{salon.owner?.name || 'Unknown'}</span>
                                        <span className="text-xs text-gray-500">{salon.owner?.email}</span>
                                    </div>
                                </TableCell>
                                <TableCell>{salon._count?.locations || 0}</TableCell>
                                <TableCell>{format(new Date(salon.createdAt), 'PPP')}</TableCell>
                                <TableCell>
                                    <Badge variant={
                                        salon.status === 'APPROVED' ? 'default' :
                                            salon.status === 'REJECTED' ? 'destructive' : 'secondary'
                                    } className={
                                        salon.status === 'APPROVED' ? 'bg-green-600' :
                                            salon.status === 'PENDING' ? 'bg-yellow-500 hover:bg-yellow-600' : ''
                                    }>
                                        {salon.status}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="flex gap-2">
                                        {salon.status !== 'APPROVED' && (
                                            <Button
                                                size="sm"
                                                className="bg-green-600 hover:bg-green-700 h-8"
                                                onClick={() => handleStatusUpdate(salon.id, 'APPROVED')}
                                            >
                                                <Check className="w-4 h-4 mr-1" /> Approve
                                            </Button>
                                        )}
                                        {salon.status !== 'REJECTED' && (
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                className="h-8"
                                                onClick={() => handleStatusUpdate(salon.id, 'REJECTED')}
                                            >
                                                <X className="w-4 h-4 mr-1" /> Reject
                                            </Button>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
