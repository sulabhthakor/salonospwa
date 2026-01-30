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
import { Input } from "@/components/ui/input"
import { Plus, MoreHorizontal, Pencil, Trash2, Search, Scissors, Clock } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { createService, updateService, deleteService, getServices } from "@/actions/services"
import { MultiSelect } from "@/components/ui/multi-select"

const serviceSchema = z.object({
    name: z.string().min(1, "Name is required"),
    category: z.string().optional(),
    duration: z.coerce.number().min(1, "Duration must be at least 1 min"),
    price: z.coerce.number().min(0, "Price cannot be negative"),
    skillIds: z.array(z.string().or(z.number())).optional()
})

export default function ServicesPage() {
    const [services, setServices] = useState<any[]>([])
    const [skills, setSkills] = useState<{ label: string, value: string }[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingService, setEditingService] = useState<any>(null)
    const [searchQuery, setSearchQuery] = useState("")

    const form = useForm({
        resolver: zodResolver(serviceSchema),
        defaultValues: {
            name: "",
            category: "",
            duration: 30,
            price: 0,
            skillIds: [] as number[]
        },
    })

    const fetchServices = async () => {
        try {
            const res = await getServices()
            if (res.services) {
                setServices(res.services)
            }
        } catch (error) {
            console.error(error)
            toast.error("Failed to fetch services")
        } finally {
            setIsLoading(false)
        }
    }

    const fetchSkills = async () => {
        try {
            const { getSkills } = await import("@/actions/services")
            const res = await getSkills()
            if (res.skills) {
                setSkills(res.skills.map((s: any) => ({ label: s.name, value: s.id.toString() })))
            }
        } catch (error) {
            console.error(error)
        }
    }

    useEffect(() => {
        fetchServices()
        fetchSkills()
    }, [])

    const onSubmit = async (values: any) => {
        try {
            // Convert skillIds back to numbers if needed, though they stored as array in form
            // MultiSelect usually deals with strings, so ensure conversion
            const payload = {
                ...values,
                skillIds: values.skillIds.map((id: string | number) => Number(id))
            }

            let res
            if (editingService) {
                res = await updateService(editingService.id, payload)
            } else {
                res = await createService(payload)
            }

            if (res?.error) {
                toast.error(res.error)
                return
            }

            if (res?.success) {
                toast.success(editingService ? "Service updated" : "Service added successfully")
                setIsDialogOpen(false)
                setEditingService(null)
                form.reset({ name: "", duration: 30, price: 0, skillIds: [] })
                fetchServices()
            }
        } catch (error) {
            console.error(error)
            toast.error("Operation failed")
        }
    }

    const startEdit = (service: any) => {
        setEditingService(service)
        form.reset({
            name: service.name,
            category: service.category || "",
            duration: service.duration,
            price: service.price,
            skillIds: service.skillRequirements?.map((sr: any) => sr.skillId.toString()) || []
        })
        setIsDialogOpen(true)
    }

    const startCreate = () => {
        setEditingService(null)
        form.reset({ name: "", category: "", duration: 30, price: 0, skillIds: [] })
        setIsDialogOpen(true)
    }

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this service?")) return
        try {
            const res = await deleteService(id)
            if (res.error) {
                toast.error(res.error)
            } else {
                toast.success("Service deleted")
                fetchServices()
            }
        } catch (error) {
            toast.error("Failed to delete service")
        }
    }

    const filteredServices = services.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="space-y-8 max-w-7xl mx-auto p-2">

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900">Service Menu</h2>
                    <p className="text-muted-foreground mt-1">Manage the treatments and prices visible to your clients.</p>
                </div>
                <Button onClick={startCreate} className="bg-primary hover:bg-primary/90 shadow-sm transition-all">
                    <Plus className="mr-2 h-4 w-4" /> Add New Service
                </Button>
            </div>

            <Card className="border shadow-sm overflow-hidden">
                <CardHeader className="bg-gray-50/50 border-b pb-4">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="space-y-1">
                            <CardTitle className="text-lg font-medium">All Services</CardTitle>
                            <CardDescription>
                                You have {services.length} active services.
                            </CardDescription>
                        </div>
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search services..."
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
                                <TableHead className="pl-6 w-[40%]">Service Name</TableHead>
                                <TableHead>Duration</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead className="w-[100px] text-right pr-6">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                                        Loading your menu...
                                    </TableCell>
                                </TableRow>
                            ) : filteredServices.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-64 text-center">
                                        <div className="flex flex-col items-center justify-center space-y-3">
                                            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                                                <Scissors className="w-6 h-6" />
                                            </div>
                                            <p className="font-medium text-lg">No services found</p>
                                            <p className="text-muted-foreground max-w-sm">
                                                {searchQuery ? "Try adjusting your search terms." : "Get started by adding your first service to the menu."}
                                            </p>
                                            {!searchQuery && (
                                                <Button onClick={startCreate} variant="outline" className="mt-2">
                                                    Add Service
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredServices.map((service) => (
                                    <TableRow key={service.id} className="group hover:bg-gray-50/50 transition-colors">
                                        <TableCell className="font-medium pl-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                                                    {service.name.charAt(0)}
                                                </div>
                                                {service.name}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="bg-white font-normal flex w-fit gap-1 items-center">
                                                <Clock className="w-3 h-3 text-muted-foreground" />
                                                {service.duration} min
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-bold text-gray-900">
                                            ₹{service.price}
                                        </TableCell>
                                        <TableCell className="text-right pr-6">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <span className="sr-only">Open menu</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={() => startEdit(service)}>
                                                        <Pencil className="mr-2 h-4 w-4" /> Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleDelete(service.id)} className="text-red-600 focus:text-red-600">
                                                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>{editingService ? "Edit Service" : "Add New Service"}</DialogTitle>
                        <DialogDescription>
                            {editingService ? "Update the details below." : "Fill in the details to add a new service to your menu."}
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Service Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. Premium Haircut" className="h-10" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="category"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Category</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. Hair, Spa, Nail" className="h-10" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="skillIds"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Required Skills</FormLabel>
                                        <FormControl>
                                            <MultiSelect
                                                options={skills}
                                                selected={field.value?.map((v: any) => v.toString()) || []}
                                                onChange={(val) => field.onChange(val)}
                                                placeholder="Select skills required..."
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="duration"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Duration (min)</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                    <Input type="number" className="pl-9 h-10" {...field} value={(field.value as number) || 0} onChange={(e) => field.onChange(e.target.valueAsNumber)} />
                                                </div>
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
                                            <FormLabel>Price (₹)</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-3 text-muted-foreground font-bold text-sm">₹</span>
                                                    <Input type="number" className="pl-8 h-10" {...field} value={(field.value as number) || 0} onChange={(e) => field.onChange(e.target.valueAsNumber)} />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <DialogFooter className="gap-2 sm:gap-0">
                                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                                <Button type="submit">{editingService ? "Save Changes" : "Create Service"}</Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
