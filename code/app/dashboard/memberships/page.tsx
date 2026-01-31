"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Trash2, Search, Crown, Edit, Percent, CreditCard, Users } from "lucide-react"
import { toast } from "sonner"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { createMembership, updateMembership, deleteMembership, getMemberships } from "@/actions/memberships"

const membershipSchema = z.object({
    name: z.string().min(2, "Membership name is required"),
    description: z.string().optional(),
    monthlyCredits: z.coerce.number().min(0, "Credits cannot be negative"),
    discountPercent: z.coerce.number().min(0).max(100, "Discount must be 0-100%"),
    price: z.coerce.number().min(0, "Price cannot be negative"),
    stripePriceId: z.string().optional(),
})

type MembershipType = {
    id: number
    name: string
    description?: string | null
    monthlyCredits: number
    discountPercent: number
    price: number
    stripePriceId?: string | null
    isActive: boolean
}

export default function MembershipsPage() {
    const [memberships, setMemberships] = useState<MembershipType[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingMembership, setEditingMembership] = useState<MembershipType | null>(null)
    const [searchQuery, setSearchQuery] = useState("")

    const form = useForm({
        resolver: zodResolver(membershipSchema),
        defaultValues: {
            name: "",
            description: "",
            monthlyCredits: 500,
            discountPercent: 10,
            price: 999,
            stripePriceId: "",
        },
    })

    const fetchMemberships = async () => {
        try {
            const res = await getMemberships()
            if (res.memberships) {
                setMemberships(res.memberships)
            }
        } catch (error) {
            console.error(error)
            toast.error("Failed to fetch memberships")
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchMemberships()
    }, [])

    const openEditDialog = (membership: MembershipType) => {
        setEditingMembership(membership)
        form.reset({
            name: membership.name,
            description: membership.description || "",
            monthlyCredits: membership.monthlyCredits,
            discountPercent: membership.discountPercent,
            price: membership.price,
            stripePriceId: membership.stripePriceId || "",
        })
        setIsDialogOpen(true)
    }

    const openCreateDialog = () => {
        setEditingMembership(null)
        form.reset({
            name: "",
            description: "",
            monthlyCredits: 500,
            discountPercent: 10,
            price: 999,
            stripePriceId: "",
        })
        setIsDialogOpen(true)
    }

    const onSubmit = async (values: z.infer<typeof membershipSchema>) => {
        try {
            if (editingMembership) {
                const res = await updateMembership(editingMembership.id, values)

                if (res?.error) {
                    toast.error(res.error)
                    return
                }

                toast.success("Membership updated successfully")
            } else {
                const res = await createMembership(values)

                if (res?.error) {
                    toast.error(res.error)
                    return
                }

                toast.success("Membership created successfully")
            }

            setIsDialogOpen(false)
            form.reset()
            fetchMemberships()
        } catch (error) {
            console.error(error)
            toast.error("Operation failed")
        }
    }

    const handleDelete = async (id: number, name: string) => {
        if (!confirm(`Are you sure you want to delete "${name}"? Active subscriptions will be preserved.`)) return
        try {
            const res = await deleteMembership(id)
            if (res.error) {
                toast.error(res.error)
            } else {
                toast.success("Membership deactivated")
                fetchMemberships()
            }
        } catch (error) {
            toast.error("Failed to delete membership")
        }
    }

    const filteredMemberships = memberships.filter(m =>
        m.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount)
    }

    const getTierColor = (index: number) => {
        const colors = [
            { bg: "from-slate-100 to-slate-50", icon: "text-slate-600", iconBg: "bg-slate-100" },
            { bg: "from-amber-100 to-amber-50", icon: "text-amber-600", iconBg: "bg-amber-100" },
            { bg: "from-violet-100 to-violet-50", icon: "text-violet-600", iconBg: "bg-violet-100" },
        ]
        return colors[index % colors.length]
    }

    return (
        <div className="space-y-8 max-w-7xl mx-auto p-2">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900">Memberships</h2>
                    <p className="text-muted-foreground mt-1">Create subscription plans with monthly credits and discounts.</p>
                </div>
                <Button onClick={openCreateDialog} className="bg-primary hover:bg-primary/90 shadow-sm transition-all">
                    <Plus className="mr-2 h-4 w-4" /> Create Membership
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="border shadow-sm bg-gradient-to-br from-amber-50 to-white">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Active Plans</p>
                                <p className="text-3xl font-bold text-amber-600">{memberships.length}</p>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                                <Crown className="w-6 h-6 text-amber-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border shadow-sm bg-gradient-to-br from-purple-50 to-white">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Max Discount</p>
                                <p className="text-3xl font-bold text-purple-600">
                                    {memberships.length > 0
                                        ? Math.max(...memberships.map(m => m.discountPercent))
                                        : 0}%
                                </p>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                                <Percent className="w-6 h-6 text-purple-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border shadow-sm bg-gradient-to-br from-blue-50 to-white">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Avg. Monthly Credits</p>
                                <p className="text-3xl font-bold text-blue-600">
                                    {memberships.length > 0
                                        ? formatCurrency(memberships.reduce((sum, m) => sum + m.monthlyCredits, 0) / memberships.length)
                                        : '₹0'}
                                </p>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                                <CreditCard className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Memberships Grid */}
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <CardTitle className="text-lg font-medium">Membership Plans</CardTitle>
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search memberships..."
                            className="pl-9 bg-white"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {isLoading ? (
                    <div className="text-center py-12 text-muted-foreground">Loading memberships...</div>
                ) : filteredMemberships.length === 0 ? (
                    <Card className="border shadow-sm">
                        <CardContent className="py-12">
                            <div className="flex flex-col items-center justify-center space-y-3">
                                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                                    <Crown className="w-6 h-6" />
                                </div>
                                <p className="font-medium text-lg">No memberships found</p>
                                <p className="text-muted-foreground max-w-sm text-center">
                                    Create membership plans to offer recurring subscriptions with perks.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredMemberships.map((membership, index) => {
                            const tierColor = getTierColor(index)

                            return (
                                <Card
                                    key={membership.id}
                                    className={`border shadow-sm hover:shadow-lg transition-all group bg-gradient-to-br ${tierColor.bg} relative overflow-hidden`}
                                >
                                    {/* Popular badge for highest discount */}
                                    {membership.discountPercent === Math.max(...memberships.map(m => m.discountPercent)) && memberships.length > 1 && (
                                        <div className="absolute top-0 right-0">
                                            <Badge className="rounded-none rounded-bl-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
                                                Popular
                                            </Badge>
                                        </div>
                                    )}

                                    <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between">
                                            <div className="flex gap-3">
                                                <div className={`w-10 h-10 rounded-lg ${tierColor.iconBg} flex items-center justify-center`}>
                                                    <Crown className={`w-5 h-5 ${tierColor.icon}`} />
                                                </div>
                                                <div>
                                                    <CardTitle className="text-lg">{membership.name}</CardTitle>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() => openEditDialog(membership)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 hover:text-red-600 hover:bg-red-50"
                                                    onClick={() => handleDelete(membership.id, membership.name)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                        {membership.description && (
                                            <CardDescription className="mt-2 line-clamp-2">
                                                {membership.description}
                                            </CardDescription>
                                        )}
                                    </CardHeader>
                                    <CardContent className="pt-0 space-y-4">
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-3xl font-bold text-gray-900">
                                                {formatCurrency(membership.price)}
                                            </span>
                                            <span className="text-muted-foreground">/month</span>
                                        </div>

                                        <div className="space-y-3 pt-2 border-t">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                                                    <CreditCard className="w-4 h-4 text-green-600" />
                                                </div>
                                                <div>
                                                    <p className="font-medium">{formatCurrency(membership.monthlyCredits)}</p>
                                                    <p className="text-xs text-muted-foreground">Monthly credits</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                                                    <Percent className="w-4 h-4 text-purple-600" />
                                                </div>
                                                <div>
                                                    <p className="font-medium">{membership.discountPercent}% off</p>
                                                    <p className="text-xs text-muted-foreground">On all services</p>
                                                </div>
                                            </div>
                                        </div>

                                        {membership.stripePriceId && (
                                            <Badge variant="outline" className="text-xs">
                                                <CreditCard className="w-3 h-3 mr-1" />
                                                Stripe Connected
                                            </Badge>
                                        )}
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                )}
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>{editingMembership ? "Edit Membership" : "Create New Membership"}</DialogTitle>
                        <DialogDescription>
                            {editingMembership
                                ? "Update the membership plan details."
                                : "Create a new subscription membership for your clients."}
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Membership Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. Gold Member, VIP Club" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Description (Optional)</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Describe the benefits of this membership..."
                                                className="resize-none"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="price"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Monthly Price (₹)</FormLabel>
                                        <FormControl>
                                            <Input type="number" min={0} {...field} value={field.value as number ?? 0} />
                                        </FormControl>
                                        <FormDescription>
                                            The recurring monthly fee for this membership.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="monthlyCredits"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Monthly Credits (₹)</FormLabel>
                                            <FormControl>
                                                <Input type="number" min={0} {...field} value={field.value as number ?? 0} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="discountPercent"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Discount (%)</FormLabel>
                                            <FormControl>
                                                <Input type="number" min={0} max={100} {...field} value={field.value as number ?? 0} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <FormField
                                control={form.control}
                                name="stripePriceId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Stripe Price ID (Optional)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="price_..." {...field} />
                                        </FormControl>
                                        <FormDescription>
                                            Connect to Stripe for automatic recurring billing.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <DialogFooter className="mt-4">
                                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit">
                                    {editingMembership ? "Save Changes" : "Create Membership"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
