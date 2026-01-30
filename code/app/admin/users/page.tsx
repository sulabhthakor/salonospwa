"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { getAdminUsers, toggleUserStatus } from "@/actions/admin"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { format } from "date-fns"
import { Search, Filter, Users, User, ArrowLeft } from "lucide-react"
import { toast } from "sonner"

export default function UsersPage() {
    const [users, setUsers] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [roleFilter, setRoleFilter] = useState<string>("ALL")

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await getAdminUsers()
                if ('users' in res && res.users) setUsers(res.users)
            } catch (err) {
                console.error("Failed to fetch users", err)
            } finally {
                setIsLoading(false)
            }
        }
        fetchUsers()
    }, [])

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesRole = roleFilter === "ALL" || user.role === roleFilter
        return matchesSearch && matchesRole
    })

    const getRoleBadge = (role: string) => {
        const variants: Record<string, { bg: string; text: string }> = {
            SUPER_ADMIN: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400" },
            ADMIN: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-400" },
            OWNER: { bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-700 dark:text-purple-400" },
            STAFF: { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-400" },
            CLIENT: { bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-700 dark:text-gray-400" },
        }
        const style = variants[role] || variants.CLIENT
        return (
            <Badge variant="outline" className={`${style.bg} ${style.text} border-0 font-medium`}>
                {role}
            </Badge>
        )
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
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Users Management</h1>
                    <p className="text-muted-foreground mt-1">View and manage all registered users.</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-white dark:bg-zinc-900"
                    />
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-full sm:w-[180px] bg-white dark:bg-zinc-900">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Filter by role" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">All Roles</SelectItem>
                        <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                        <SelectItem value="OWNER">Owner</SelectItem>
                        <SelectItem value="STAFF">Staff</SelectItem>
                        <SelectItem value="CLIENT">Client</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Loading State */}
            {isLoading ? (
                <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Card key={i} className="bg-white dark:bg-zinc-900">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-4">
                                    <Skeleton className="h-10 w-10 rounded-full" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-4 w-32" />
                                        <Skeleton className="h-3 w-48" />
                                    </div>
                                    <Skeleton className="h-6 w-16" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : filteredUsers.length === 0 ? (
                <Card className="p-12 bg-white dark:bg-zinc-900">
                    <div className="text-center text-muted-foreground">
                        <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <h3 className="text-lg font-semibold mb-1">No users found</h3>
                        <p className="text-sm">Try adjusting your search or filter criteria.</p>
                    </div>
                </Card>
            ) : (
                <>
                    {/* Cards View */}
                    <div className="space-y-3">
                        {filteredUsers.map((user) => (
                            <Card key={user.id} className={`bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 ${user.isActive === false ? 'opacity-60' : ''}`}>
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                <User className="h-5 w-5 text-primary" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-900 dark:text-white">{user.name}</p>
                                                <p className="text-sm text-muted-foreground">{user.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {getRoleBadge(user.role)}
                                            {user.isActive === false && <Badge variant="destructive" className="text-xs">Disabled</Badge>}
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between mt-3">
                                        <span className="text-sm text-muted-foreground">Joined {format(new Date(user.createdAt), 'd MMM yyyy')}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-muted-foreground">{user.isActive !== false ? 'Active' : 'Disabled'}</span>
                                            <Switch
                                                checked={user.isActive !== false}
                                                onCheckedChange={async () => {
                                                    const res = await toggleUserStatus(user.id)
                                                    if ('success' in res && res.success) {
                                                        toast.success(res.isActive ? 'User enabled' : 'User disabled')
                                                        setUsers(users.map(u => u.id === user.id ? { ...u, isActive: res.isActive } : u))
                                                    } else {
                                                        toast.error('Failed to update user status')
                                                    }
                                                }}
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Summary */}
                    <p className="text-sm text-muted-foreground text-center">
                        Showing {filteredUsers.length} of {users.length} users
                    </p>
                </>
            )}
        </div>
    )
}
