"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
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
import { Plus, Trash2, Search, Sparkles, Edit, Clock, DollarSign, Package } from "lucide-react"
import { toast } from "sonner"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { createAddOn, updateAddOn, deleteAddOn, getAddOns } from "@/actions/addons"
import { getServices } from "@/actions/services"
import { getInventory } from "@/actions/inventory"

const addOnSchema = z.object({
    name: z.string().min(2, "Add-on name is required"),
    description: z.string().optional(),
    price: z.coerce.number().min(0, "Price cannot be negative"),
    durationChange: z.coerce.number().optional(),
    productId: z.coerce.number().optional(),
    productQty: z.coerce.number().optional(),
})

type AddOnType = {
    id: number
    name: string
    description?: string | null
    price: number
    durationChange: number
    productId?: number | null
    productQty?: number | null
    product?: { id: number; name: string } | null
    applicableServices?: { service: { id: number; name: string } }[]
}

type Service = {
    id: number
    name: string
}

type Product = {
    id: number
    name: string
    stock: number
}

export default function AddOnsPage() {
    const [addOns, setAddOns] = useState<AddOnType[]>([])
    const [services, setServices] = useState<Service[]>([])
    const [products, setProducts] = useState<Product[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingAddOn, setEditingAddOn] = useState<AddOnType | null>(null)
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedServices, setSelectedServices] = useState<number[]>([])

    const form = useForm({
        resolver: zodResolver(addOnSchema),
        defaultValues: {
            name: "",
            description: "",
            price: 0,
            durationChange: 0,
            productId: undefined as number | undefined,
            productQty: 1,
        },
    })

    const fetchAddOns = async () => {
        try {
            const res = await getAddOns()
            if (res.addOns) {
                setAddOns(res.addOns)
            }
        } catch (error) {
            console.error(error)
            toast.error("Failed to fetch add-ons")
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

    const fetchProducts = async () => {
        try {
            const res = await getInventory()
            if (res.success && res.data) {
                setProducts(res.data)
            }
        } catch (error) {
            console.error(error)
        }
    }

    useEffect(() => {
        fetchAddOns()
        fetchServices()
        fetchProducts()
    }, [])

    const openEditDialog = (addOn: AddOnType) => {
        setEditingAddOn(addOn)
        const serviceIds = addOn.applicableServices?.map(s => s.service.id) || []
        setSelectedServices(serviceIds)
        form.reset({
            name: addOn.name,
            description: addOn.description || "",
            price: addOn.price,
            durationChange: addOn.durationChange,
            productId: addOn.productId || undefined,
            productQty: addOn.productQty || 1,
        })
        setIsDialogOpen(true)
    }

    const openCreateDialog = () => {
        setEditingAddOn(null)
        setSelectedServices([])
        form.reset({
            name: "",
            description: "",
            price: 0,
            durationChange: 0,
            productId: undefined,
            productQty: 1,
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

    const onSubmit = async (values: z.infer<typeof addOnSchema>) => {
        try {
            const data = {
                ...values,
                serviceIds: selectedServices,
            }

            if (editingAddOn) {
                const res = await updateAddOn(editingAddOn.id, data)

                if (res?.error) {
                    toast.error(res.error)
                    return
                }

                toast.success("Add-on updated successfully")
            } else {
                const res = await createAddOn(data)

                if (res?.error) {
                    toast.error(res.error)
                    return
                }

                toast.success("Add-on created successfully")
            }

            setIsDialogOpen(false)
            form.reset()
            setSelectedServices([])
            fetchAddOns()
        } catch (error) {
            console.error(error)
            toast.error("Operation failed")
        }
    }

    const handleDelete = async (id: number, name: string) => {
        if (!confirm(`Are you sure you want to delete "${name}"?`)) return
        try {
            const res = await deleteAddOn(id)
            if (res.error) {
                toast.error(res.error)
            } else {
                toast.success("Add-on deleted")
                fetchAddOns()
            }
        } catch (error) {
            toast.error("Failed to delete add-on")
        }
    }

    const filteredAddOns = addOns.filter(a =>
        a.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount)
    }

    const formatDuration = (minutes: number) => {
        if (minutes === 0) return "No change"
        const sign = minutes > 0 ? "+" : ""
        return `${sign}${minutes} min`
    }

    const totalRevenue = addOns.reduce((sum, a) => sum + a.price, 0)

    return (
        <div className="space-y-8 max-w-7xl mx-auto p-2">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900">Service Add-Ons</h2>
                    <p className="text-muted-foreground mt-1">Create upsells and enhancements for your services.</p>
                </div>
                <Button onClick={openCreateDialog} className="bg-primary hover:bg-primary/90 shadow-sm transition-all">
                    <Plus className="mr-2 h-4 w-4" /> Create Add-On
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="border shadow-sm bg-gradient-to-br from-rose-50 to-white">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Total Add-Ons</p>
                                <p className="text-3xl font-bold text-rose-600">{addOns.length}</p>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center">
                                <Sparkles className="w-6 h-6 text-rose-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border shadow-sm bg-gradient-to-br from-emerald-50 to-white">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Avg. Add-On Price</p>
                                <p className="text-3xl font-bold text-emerald-600">
                                    {addOns.length > 0 ? formatCurrency(totalRevenue / addOns.length) : '₹0'}
                                </p>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                                <DollarSign className="w-6 h-6 text-emerald-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border shadow-sm bg-gradient-to-br from-cyan-50 to-white">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">With Products</p>
                                <p className="text-3xl font-bold text-cyan-600">
                                    {addOns.filter(a => a.productId).length}
                                </p>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-cyan-100 flex items-center justify-center">
                                <Package className="w-6 h-6 text-cyan-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border shadow-sm overflow-hidden">
                <CardHeader className="bg-gray-50/50 border-b pb-4">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="space-y-1">
                            <CardTitle className="text-lg font-medium">All Add-Ons</CardTitle>
                            <CardDescription>
                                Enhance services with additional options and product upsells.
                            </CardDescription>
                        </div>
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search add-ons..."
                                className="pl-9 bg-white"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="pl-6">Add-On</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead>Duration</TableHead>
                                <TableHead>Product</TableHead>
                                <TableHead>Services</TableHead>
                                <TableHead className="w-[120px] text-right pr-6">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                                        Loading add-ons...
                                    </TableCell>
                                </TableRow>
                            ) : filteredAddOns.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-64 text-center">
                                        <div className="flex flex-col items-center justify-center space-y-3">
                                            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                                                <Sparkles className="w-6 h-6" />
                                            </div>
                                            <p className="font-medium text-lg">No add-ons found</p>
                                            <p className="text-muted-foreground max-w-sm">
                                                Create add-ons to offer service enhancements and product upsells.
                                            </p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredAddOns.map((addOn) => (
                                    <TableRow key={addOn.id} className="group hover:bg-gray-50/50 transition-colors">
                                        <TableCell className="font-medium pl-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-rose-100 to-rose-50 flex items-center justify-center">
                                                    <Sparkles className="w-5 h-5 text-rose-600" />
                                                </div>
                                                <div>
                                                    <span className="font-semibold text-gray-900">{addOn.name}</span>
                                                    {addOn.description && (
                                                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                                            {addOn.description}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="font-medium text-green-600">{formatCurrency(addOn.price)}</span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1.5">
                                                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                                                <span className={addOn.durationChange > 0 ? "text-orange-600" : "text-muted-foreground"}>
                                                    {formatDuration(addOn.durationChange)}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {addOn.product ? (
                                                <Badge variant="secondary" className="text-xs">
                                                    {addOn.product.name} × {addOn.productQty}
                                                </Badge>
                                            ) : (
                                                <span className="text-muted-foreground text-sm">—</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-muted-foreground text-sm">
                                                {addOn.applicableServices?.length || 0} services
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right pr-6">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-muted-foreground hover:text-primary"
                                                    onClick={() => openEditDialog(addOn)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-muted-foreground hover:text-red-600 hover:bg-red-50"
                                                    onClick={() => handleDelete(addOn.id, addOn.name)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingAddOn ? "Edit Add-On" : "Create New Add-On"}</DialogTitle>
                        <DialogDescription>
                            {editingAddOn
                                ? "Update the add-on details below."
                                : "Create a new service enhancement or upsell."}
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Add-On Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. Hot Stone Enhancement" {...field} />
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
                                                placeholder="Describe what this add-on includes..."
                                                className="resize-none"
                                                value={field.value || ""}
                                                onChange={field.onChange}
                                                onBlur={field.onBlur}
                                                name={field.name}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="price"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Price (₹)</FormLabel>
                                            <FormControl>
                                                <Input type="number" min={0} {...field} value={field.value as number ?? 0} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="durationChange"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Duration Change (min)</FormLabel>
                                            <FormControl>
                                                <Input type="number" placeholder="0" {...field} value={field.value as number ?? 0} />
                                            </FormControl>
                                            <FormDescription className="text-xs">
                                                Add/subtract time from service
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Product Link */}
                            <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
                                <FormLabel>Linked Product (Optional)</FormLabel>
                                <p className="text-xs text-muted-foreground">
                                    Automatically deduct inventory when this add-on is used.
                                </p>
                                <div className="grid grid-cols-2 gap-3">
                                    <FormField
                                        control={form.control}
                                        name="productId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <Select
                                                    onValueChange={(val) => field.onChange(val ? parseInt(val) : undefined)}
                                                    value={field.value?.toString()}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select product" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="">None</SelectItem>
                                                        {products.map((product) => (
                                                            <SelectItem key={product.id} value={product.id.toString()}>
                                                                {product.name} ({product.stock} in stock)
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="productQty"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <Input type="number" min={1} placeholder="Qty" {...field} value={field.value as number ?? 1} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            {/* Service Selection */}
                            <div className="space-y-2">
                                <FormLabel>Applicable Services</FormLabel>
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
                                            </label>
                                        ))
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {selectedServices.length === 0
                                        ? "Available for all services"
                                        : `${selectedServices.length} service(s) selected`}
                                </p>
                            </div>

                            <DialogFooter className="mt-4">
                                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit">
                                    {editingAddOn ? "Save Changes" : "Create Add-On"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
