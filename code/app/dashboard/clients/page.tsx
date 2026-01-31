"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getClients } from "@/actions/clients"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import {
    Users,
    UserPlus,
    Zap,
    Search,
    Plus,
    MoreHorizontal,
    Mail,
    Calendar,
    ArrowLeft,
    ArrowUpDown
} from "lucide-react"

export default function ClientsPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [clients, setClients] = useState<any[]>([])
    const [filteredClients, setFilteredClients] = useState<any[]>([])

    // Filters
    const [searchQuery, setSearchQuery] = useState("")
    const [sortOrder, setSortOrder] = useState<"name" | "bookings">("name")

    // Stats
    const [stats, setStats] = useState({
        total: 0,
        newThisMonth: 0,
        active: 0
    })

    useEffect(() => {
        const loadData = async () => {
            try {
                const res = await getClients()
                if (res.clients) {
                    setClients(res.clients)
                    setFilteredClients(res.clients)
                    calculateStats(res.clients)
                }
            } catch (err) {
                console.error("Failed to load clients", err)
            } finally {
                setLoading(false)
            }
        }
        loadData()
    }, [])

    useEffect(() => {
        let res = [...clients]

        // Search
        if (searchQuery) {
            const lower = searchQuery.toLowerCase()
            res = res.filter(c =>
                c.name?.toLowerCase().includes(lower) ||
                c.email?.toLowerCase().includes(lower)
            )
        }

        // Sort
        if (sortOrder === "name") {
            res.sort((a, b) => a.name.localeCompare(b.name))
        } else if (sortOrder === "bookings") {
            res.sort((a, b) => (b._count?.appointments || 0) - (a._count?.appointments || 0))
        }

        setFilteredClients(res)
    }, [searchQuery, sortOrder, clients])

    const calculateStats = (data: any[]) => {
        const now = new Date()
        const currentMonth = now.getMonth()
        const currentYear = now.getFullYear()

        const newClients = data.filter(c => {
            if (!c.createdAt) return false
            const d = new Date(c.createdAt)
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear
        }).length

        // Active = has at least 1 booking
        const activeClients = data.filter(c => (c._count?.appointments || 0) > 0).length

        setStats({
            total: data.length,
            newThisMonth: newClients,
            active: activeClients
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

    if (loading) {
        return (
            <div className="p-4 md:p-8 space-y-6 animate-pulse max-w-7xl mx-auto">
                <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-200 rounded-xl"></div>)}
                </div>
                <div className="h-12 bg-gray-200 rounded-xl w-full"></div>
                <div className="space-y-4">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-gray-200 rounded-xl"></div>)}
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
                            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Clients</h1>
                            <p className="text-sm text-muted-foreground">Manage your customer database.</p>
                        </div>
                    </div>
                    <Button onClick={() => router.push("/book")} className="w-full md:w-auto bg-primary shadow-sm">
                        <Plus className="w-4 h-4 mr-2" /> Add Client
                    </Button>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6">
                    <StatBox label="Total Clients" value={stats.total} icon={Users} color="bg-blue-50 text-blue-700" />
                    <StatBox label="New This Month" value={stats.newThisMonth} icon={UserPlus} color="bg-green-50 text-green-700" />
                    <StatBox label="Active Clients" value={stats.active} icon={Zap} color="bg-purple-50 text-purple-700" />
                </div>

                {/* Filters Toolbar */}
                <div className="sticky top-0 z-10 bg-white/95 backdrop-blur pt-2 pb-4 border-b border-gray-100 flex flex-col md:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className={`rounded-full border-slate-200 ${sortOrder === 'name' ? 'bg-slate-900 text-white border-transparent' : 'text-slate-600'}`}
                            onClick={() => setSortOrder("name")}
                        >
                            <ArrowUpDown className="w-3.5 h-3.5 mr-2" /> Name
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className={`rounded-full border-slate-200 ${sortOrder === 'bookings' ? 'bg-slate-900 text-white border-transparent' : 'text-slate-600'}`}
                            onClick={() => setSortOrder("bookings")}
                        >
                            <ArrowUpDown className="w-3.5 h-3.5 mr-2" /> Bookings
                        </Button>
                    </div>
                </div>

                {/* Clients List */}
                <div className="space-y-3">
                    {filteredClients.length === 0 ? (
                        <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                            <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                            <p className="font-semibold text-slate-900">No clients found</p>
                            <p className="text-sm text-slate-500 max-w-xs mx-auto mt-1">Try adjusting your search terms.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredClients.map(client => (
                                <div key={client.id} className="group bg-white rounded-xl border border-slate-200 shadow-sm p-4 hover:shadow-md hover:border-primary/30 transition-all duration-200 relative overflow-hidden">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-purple-100 flex items-center justify-center text-primary font-bold text-sm">
                                                {getInitials(client.name)}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-gray-900 decoration-slate-900">{client.name}</h3>
                                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                    Member since {client.createdAt ? format(new Date(client.createdAt), "MMM yyyy") : "N/A"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2 mb-4">
                                        <div className="text-sm text-slate-600 flex items-center gap-2">
                                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                                            <span className="truncate">{client.email}</span>
                                        </div>
                                        <div className="text-sm text-slate-600 flex items-center gap-2">
                                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                            <span>{client._count?.appointments || 0} Bookings</span>
                                        </div>
                                    </div>

                                    <div className="pt-3 border-t border-slate-100 flex justify-end">
                                        <Button variant="ghost" size="sm" className="h-8 text-primary hover:bg-primary/5" onClick={() => router.push(`/dashboard/clients/${client.id}`)}>
                                            View History <MoreHorizontal className="w-4 h-4 ml-1.5" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

function StatBox({ label, value, icon: Icon, color }: any) {
    return (
        <div className={`p-4 rounded-xl border border-slate-100 ${color} bg-opacity-30 flex flex-col items-start justify-center`}>
            <div className="flex items-center gap-3 mb-1">
                <div className={`p-1.5 rounded-lg bg-white/60`}>
                    <Icon className="w-4 h-4" />
                </div>
                <div className="text-xs font-medium opacity-80 uppercase tracking-wider">{label}</div>
            </div>
            <div className="text-2xl font-bold ml-1">{value}</div>
        </div>
    )
}
