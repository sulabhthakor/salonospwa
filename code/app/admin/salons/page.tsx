"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Check, X, Building2, Search, Filter, ArrowLeft } from "lucide-react"
import { getAdminSalons, updateSalonStatus } from "@/actions/admin"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { format } from "date-fns"
import { toast } from "sonner"

export default function SalonsPage() {
    const [salons, setSalons] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState<string>("ALL")

    const fetchSalons = async () => {
        try {
            const res = await getAdminSalons()
            if ('salons' in res && res.salons) setSalons(res.salons)
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
                toast.success(`Salon ${status === 'APPROVED' ? 'Approved' : 'Rejected'}`)
                fetchSalons()
            } else {
                const errorMsg = 'error' in res ? res.error : "Failed";
                toast.error(errorMsg)
            }
        } catch (err) {
            toast.error("Failed to update status")
        }
    }

    const filteredSalons = salons.filter(salon => {
        const matchesSearch = salon.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            salon.owner?.email?.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesStatus = statusFilter === "ALL" || salon.status === statusFilter
        return matchesSearch && matchesStatus
    })

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'APPROVED':
                return <Badge className="bg-green-600 hover:bg-green-700">Approved</Badge>
            case 'REJECTED':
                return <Badge variant="destructive">Rejected</Badge>
            case 'PENDING':
            default:
                return <Badge className="bg-yellow-500 hover:bg-yellow-600">Pending</Badge>
        }
    }

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            {/* Back + Header */}
            <div className="flex items-center gap-4">
                <Link href="/admin/dashboard">
                    <Button variant="ghost" size="icon" className="rounded-full">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Salons Management</h1>
                    <p className="text-muted-foreground mt-1">Review and manage salon registrations.</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name or owner email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-white dark:bg-zinc-900"
                    />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-[180px] bg-white dark:bg-zinc-900">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">All Statuses</SelectItem>
                        <SelectItem value="PENDING">Pending</SelectItem>
                        <SelectItem value="APPROVED">Approved</SelectItem>
                        <SelectItem value="REJECTED">Rejected</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Loading State */}
            {isLoading ? (
                <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Card key={i} className="bg-white dark:bg-zinc-900">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-4">
                                    <Skeleton className="h-12 w-12 rounded-full" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-4 w-32" />
                                        <Skeleton className="h-3 w-48" />
                                    </div>
                                    <Skeleton className="h-8 w-20" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : filteredSalons.length === 0 ? (
                <Card className="p-12 bg-white dark:bg-zinc-900">
                    <div className="text-center text-muted-foreground">
                        <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <h3 className="text-lg font-semibold mb-1">No salons found</h3>
                        <p className="text-sm">Try adjusting your search or filter criteria.</p>
                    </div>
                </Card>
            ) : (
                /* Cards View (Mobile-First) */
                <div className="space-y-4">
                    {filteredSalons.map((salon) => (
                        <Card key={salon.id} className="overflow-hidden bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800">
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-full bg-primary/10">
                                            <Building2 className="w-5 h-5 text-primary" />
                                        </div>
                                        <div>
                                            <Link href={`/admin/salons/${salon.id}`} className="hover:underline">
                                                <CardTitle className="text-base">{salon.name}</CardTitle>
                                            </Link>
                                            <p className="text-sm text-muted-foreground">{salon.owner?.name}</p>
                                        </div>
                                    </div>
                                    {getStatusBadge(salon.status)}
                                </div>
                            </CardHeader>
                            <CardContent className="pt-0 space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Email</span>
                                    <span className="font-medium">{salon.owner?.email}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Locations</span>
                                    <span className="font-medium">{salon._count?.locations || 0}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Registered</span>
                                    <span className="font-medium">{format(new Date(salon.createdAt), 'PP')}</span>
                                </div>
                                <div className="flex gap-2 pt-2">
                                    {salon.status !== 'APPROVED' && (
                                        <Button
                                            size="sm"
                                            className="flex-1 bg-green-600 hover:bg-green-700"
                                            onClick={() => handleStatusUpdate(salon.id, 'APPROVED')}
                                        >
                                            <Check className="w-4 h-4 mr-1" /> Approve
                                        </Button>
                                    )}
                                    {salon.status !== 'REJECTED' && (
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            className="flex-1"
                                            onClick={() => handleStatusUpdate(salon.id, 'REJECTED')}
                                        >
                                            <X className="w-4 h-4 mr-1" /> Reject
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
