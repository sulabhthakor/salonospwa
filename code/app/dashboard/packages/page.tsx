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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Trash2, Search, Gift, Edit, Package, DollarSign, Clock } from "lucide-react"
import { toast } from "sonner"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { createPackage, updatePackage, deletePackage, getPackages } from "@/actions/packages"
import { getServices } from "@/actions/services"

const PACKAGE_TYPES = [
    { value: "SESSION_BASED", label: "Session Based", description: "Fixed number of sessions" },
    { value: "VALUE_BASED", label: "Value Based", description: "Credit balance to use on services" },
]

const packageSchema = z.object({
    name: z.string().min(2, "Package name is required"),
    description: z.string().optional(),
    type: z.string().min(1, "Package type is required"),
    totalValue: z.coerce.number().min(1, "Total value must be at least 1"),
    price: z.coerce.number().min(0, "Price cannot be negative"),
    expiryDays: z.coerce.number().optional(),
    serviceIds: z.array(z.number()).optional(),
})

type PackageType = {
    id: number
    name: string
    description?: string | null
    type: string
    totalValue: number
    price: number
    expiryDays?: number | null
    isActive: boolean
    services?: { service: { id: number; name: string } }[]
}

type Service = {
    id: number
    name: string
    price: number
}

export default function PackagesPage() {
    const [packages, setPackages] = useState<PackageType[]>([])
    const [services, setServices] = useState<Service[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingPackage, setEditingPackage] = useState<PackageType | null>(null)
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedServices, setSelectedServices] = useState<number[]>([])

    const form = useForm({
        resolver: zodResolver(packageSchema),
        defaultValues: {
            name: "",
            description: "",
            type: "SESSION_BASED",
            totalValue: 5,
            price: 0,
            expiryDays: 90,
            serviceIds: [],
        },
    })

    const fetchPackages = async () => {
        try {
            const res = await getPackages()
            if (res.packages) {
                setPackages(res.packages)
            }
        } catch (error) {
            console.error(error)
            toast.error("Failed to fetch packages")
        } finally {
            setIsLoading(false)
        }
    }

    const fetchServices = async () => {
        try {
            const res = await getServices()
            if (res.services) {
                setServices(res.services)
            }
        } catch (error) {
            console.error(error)
        }
    }

    useEffect(() => {
        fetchPackages()
        fetchServices()
    }, [])

    const openEditDialog = (pkg: PackageType) => {
        setEditingPackage(pkg)
        const serviceIds = pkg.services?.map(s => s.service.id) || []
        setSelectedServices(serviceIds)
        form.reset({
            name: pkg.name,
            description: pkg.description || "",
            type: pkg.type,
            totalValue: pkg.totalValue,
            price: pkg.price,
            expiryDays: pkg.expiryDays || undefined,
            serviceIds: serviceIds,
        })
        setIsDialogOpen(true)
    }

    const openCreateDialog = () => {
        setEditingPackage(null)
        setSelectedServices([])
        form.reset({
            name: "",
            description: "",
            type: "SESSION_BASED",
            totalValue: 5,
            price: 0,
            expiryDays: 90,
            serviceIds: [],
        })
        setIsDialogOpen(true)
    }

    const toggleService = (serviceId: number) => {
        setSelectedServices(prev =>
            prev.includes(serviceId)
                ? prev.filter(id => id !== serviceId)
                : [...prev, serviceId]
        )
    }

    const onSubmit = async (values: z.infer<typeof packageSchema>) => {
        try {
            const data = {
                ...values,
                serviceIds: selectedServices,
                type: values.type as "SESSION_BASED" | "VALUE_BASED",
            }

            if (editingPackage) {
                const res = await updatePackage(editingPackage.id, data)

                if (res?.error) {
                    toast.error(res.error)
                    return
                }

                toast.success("Package updated successfully")
            } else {
                const res = await createPackage(data)

                if (res?.error) {
                    toast.error(res.error)
                    return
                }

                toast.success("Package created successfully")
            }

            setIsDialogOpen(false)
            form.reset()
            setSelectedServices([])
            fetchPackages()
        } catch (error) {
            console.error(error)
            toast.error("Operation failed")
        }
    }

    const handleDelete = async (id: number, name: string) => {
        if (!confirm(`Are you sure you want to delete "${name}"? Existing client packages will be preserved.`)) return
        try {
            const res = await deletePackage(id)
            if (res.error) {
                toast.error(res.error)
            } else {
                toast.success("Package deactivated")
                fetchPackages()
            }
        } catch (error) {
            toast.error("Failed to delete package")
        }
    }

    const filteredPackages = packages.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.type.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const getPackageTypeInfo = (type: string) => {
        return PACKAGE_TYPES.find(t => t.value === type) || { value: type, label: type }
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount)
    }

    const totalRevenue = packages.reduce((sum, p) => sum + p.price, 0)

    return (
        <div className="space-y-8 max-w-7xl mx-auto p-2">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900">Service Packages</h2>
                    <p className="text-muted-foreground mt-1">Create bundles and prepaid packages for clients.</p>
                </div>
                <Button onClick={openCreateDialog} className="bg-primary hover:bg-primary/90 shadow-sm transition-all">
                    <Plus className="mr-2 h-4 w-4" /> Create Package
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="border shadow-sm bg-gradient-to-br from-pink-50 to-white">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Active Packages</p>
                                <p className="text-3xl font-bold text-pink-600">{packages.length}</p>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center">
                                <Gift className="w-6 h-6 text-pink-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border shadow-sm bg-gradient-to-br from-green-50 to-white">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Avg. Package Value</p>
                                <p className="text-3xl font-bold text-green-600">
                                    {packages.length > 0 ? formatCurrency(totalRevenue / packages.length) : '₹0'}
                                </p>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                                <DollarSign className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border shadow-sm bg-gradient-to-br from-blue-50 to-white">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Linked Services</p>
                                <p className="text-3xl font-bold text-blue-600">
                                    {new Set(packages.flatMap(p => p.services?.map(s => s.service.id) || [])).size}
                                </p>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                                <Package className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Packages Grid */}
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <CardTitle className="text-lg font-medium">All Packages</CardTitle>
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search packages..."
                            className="pl-9 bg-white"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {isLoading ? (
                    <div className="text-center py-12 text-muted-foreground">Loading packages...</div>
                ) : filteredPackages.length === 0 ? (
                    <Card className="border shadow-sm">
                        <CardContent className="py-12">
                            <div className="flex flex-col items-center justify-center space-y-3">
                                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                                    <Gift className="w-6 h-6" />
                                </div>
                                <p className="font-medium text-lg">No packages found</p>
                                <p className="text-muted-foreground max-w-sm text-center">
                                    Create service packages to offer bundled deals to your clients.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredPackages.map((pkg) => {
                            const typeInfo = getPackageTypeInfo(pkg.type)
                            const savings = pkg.totalValue - pkg.price
                            const savingsPercent = pkg.totalValue > 0 ? Math.round((savings / pkg.totalValue) * 100) : 0

                            return (
                                <Card key={pkg.id} className="border shadow-sm hover:shadow-md transition-shadow group">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between">
                                            <div className="flex gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-100 to-pink-50 flex items-center justify-center">
                                                    <Gift className="w-5 h-5 text-pink-600" />
                                                </div>
                                                <div>
                                                    <CardTitle className="text-base">{pkg.name}</CardTitle>
                                                    <Badge variant="outline" className="mt-1 text-xs">
                                                        {typeInfo.label}
                                                    </Badge>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() => openEditDialog(pkg)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 hover:text-red-600 hover:bg-red-50"
                                                    onClick={() => handleDelete(pkg.id, pkg.name)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                        {pkg.description && (
                                            <CardDescription className="mt-2 line-clamp-2">
                                                {pkg.description}
                                            </CardDescription>
                                        )}
                                    </CardHeader>
                                    <CardContent className="pt-0 space-y-3">
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-2xl font-bold text-gray-900">
                                                {formatCurrency(pkg.price)}
                                            </span>
                                            {savings > 0 && (
                                                <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                                                    Save {savingsPercent}%
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="text-sm text-muted-foreground space-y-1">
                                            <div className="flex items-center gap-2">
                                                <Package className="w-3.5 h-3.5" />
                                                <span>
                                                    {pkg.type === "SESSION_BASED"
                                                        ? `${pkg.totalValue} sessions`
                                                        : `${formatCurrency(pkg.totalValue)} credit`}
                                                </span>
                                            </div>
                                            {pkg.expiryDays && (
                                                <div className="flex items-center gap-2">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    <span>Valid for {pkg.expiryDays} days</span>
                                                </div>
                                            )}
                                        </div>
                                        {pkg.services && pkg.services.length > 0 && (
                                            <div className="pt-2 border-t">
                                                <p className="text-xs text-muted-foreground mb-2">Includes:</p>
                                                <div className="flex flex-wrap gap-1">
                                                    {pkg.services.slice(0, 3).map(s => (
                                                        <Badge key={s.service.id} variant="secondary" className="text-xs">
                                                            {s.service.name}
                                                        </Badge>
                                                    ))}
                                                    {pkg.services.length > 3 && (
                                                        <Badge variant="secondary" className="text-xs">
                                                            +{pkg.services.length - 3} more
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                )}
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingPackage ? "Edit Package" : "Create New Package"}</DialogTitle>
                        <DialogDescription>
                            {editingPackage
                                ? "Update the package details below."
                                : "Create a new service package for your clients."}
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Package Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. Relaxation Bundle" {...field} />
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
                                                placeholder="Describe what's included in this package..."
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
                                name="type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Package Type</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select type" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {PACKAGE_TYPES.map((type) => (
                                                    <SelectItem key={type.value} value={type.value}>
                                                        <div>
                                                            <span className="font-medium">{type.label}</span>
                                                            <span className="text-xs text-muted-foreground ml-2">
                                                                - {type.description}
                                                            </span>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="totalValue"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                {form.watch("type") === "SESSION_BASED" ? "Sessions" : "Credit Value (₹)"}
                                            </FormLabel>
                                            <FormControl>
                                                <Input type="number" min={1} {...field} value={field.value as number ?? 1} />
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
                                            <FormLabel>Selling Price (₹)</FormLabel>
                                            <FormControl>
                                                <Input type="number" min={0} {...field} value={field.value as number ?? 0} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <FormField
                                control={form.control}
                                name="expiryDays"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Expiry (Days)</FormLabel>
                                        <FormControl>
                                            <Input type="number" min={0} placeholder="Leave empty for no expiry" {...field} value={field.value as number ?? ''} />
                                        </FormControl>
                                        <FormDescription>
                                            Days until package expires after purchase. Leave empty for no expiry.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Service Selection */}
                            <div className="space-y-2">
                                <FormLabel>Included Services</FormLabel>
                                <div className="border rounded-md p-3 max-h-40 overflow-y-auto space-y-2">
                                    {services.length === 0 ? (
                                        <p className="text-sm text-muted-foreground">No services available</p>
                                    ) : (
                                        services.map((service) => (
                                            <label
                                                key={service.id}
                                                className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50 cursor-pointer"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedServices.includes(service.id)}
                                                    onChange={() => toggleService(service.id)}
                                                    className="rounded"
                                                />
                                                <span className="flex-1">{service.name}</span>
                                                <span className="text-sm text-muted-foreground">
                                                    {formatCurrency(service.price)}
                                                </span>
                                            </label>
                                        ))
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {selectedServices.length} service(s) selected
                                </p>
                            </div>

                            <DialogFooter className="mt-4">
                                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit">
                                    {editingPackage ? "Save Changes" : "Create Package"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
