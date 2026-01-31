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
import { Plus, Trash2, Search, DoorOpen, Edit, Users, Calendar } from "lucide-react"
import { toast } from "sonner"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { createRoom, updateRoom, deleteRoom, getRooms } from "@/actions/rooms"

const ROOM_TYPES = [
    { value: "MASSAGE", label: "Massage Room", icon: "💆" },
    { value: "FACIAL", label: "Facial Room", icon: "✨" },
    { value: "COUPLE", label: "Couple Suite", icon: "💑" },
    { value: "STEAM", label: "Steam Room", icon: "♨️" },
    { value: "THERAPY", label: "Therapy Room", icon: "🧘" },
    { value: "GENERAL", label: "General Room", icon: "🚪" },
]

const roomSchema = z.object({
    name: z.string().min(2, "Name is required"),
    type: z.string().min(1, "Room type is required"),
    capacity: z.coerce.number().min(1, "Capacity must be at least 1"),
    description: z.string().optional(),
})

type Room = {
    id: number
    name: string
    type: string
    capacity: number
    description?: string | null
    isActive: boolean
}

export default function RoomsPage() {
    const [rooms, setRooms] = useState<Room[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingRoom, setEditingRoom] = useState<Room | null>(null)
    const [searchQuery, setSearchQuery] = useState("")

    const form = useForm({
        resolver: zodResolver(roomSchema),
        defaultValues: {
            name: "",
            type: "GENERAL",
            capacity: 1,
            description: "",
        },
    })

    const fetchRooms = async () => {
        try {
            const res = await getRooms()
            if (res.rooms) {
                setRooms(res.rooms)
            }
        } catch (error) {
            console.error(error)
            toast.error("Failed to fetch rooms")
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchRooms()
    }, [])

    const openEditDialog = (room: Room) => {
        setEditingRoom(room)
        form.reset({
            name: room.name,
            type: room.type,
            capacity: room.capacity,
            description: room.description || "",
        })
        setIsDialogOpen(true)
    }

    const openCreateDialog = () => {
        setEditingRoom(null)
        form.reset({
            name: "",
            type: "GENERAL",
            capacity: 1,
            description: "",
        })
        setIsDialogOpen(true)
    }

    const onSubmit = async (values: z.infer<typeof roomSchema>) => {
        try {
            if (editingRoom) {
                const res = await updateRoom(editingRoom.id, {
                    name: values.name,
                    type: values.type as any,
                    capacity: values.capacity,
                    description: values.description,
                })

                if (res?.error) {
                    toast.error(res.error)
                    return
                }

                toast.success("Room updated successfully")
            } else {
                const res = await createRoom({
                    name: values.name,
                    type: values.type as any,
                    capacity: values.capacity,
                    description: values.description,
                })

                if (res?.error) {
                    toast.error(res.error)
                    return
                }

                toast.success("Room created successfully")
            }

            setIsDialogOpen(false)
            form.reset()
            fetchRooms()
        } catch (error) {
            console.error(error)
            toast.error("Operation failed")
        }
    }

    const handleDelete = async (id: number, name: string) => {
        if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) return
        try {
            const res = await deleteRoom(id)
            if (res.error) {
                toast.error(res.error)
            } else {
                toast.success("Room deleted")
                fetchRooms()
            }
        } catch (error) {
            toast.error("Failed to delete room")
        }
    }

    const handleToggleActive = async (room: Room) => {
        try {
            const res = await updateRoom(room.id, { isActive: !room.isActive })
            if (res.error) {
                toast.error(res.error)
            } else {
                toast.success(room.isActive ? "Room deactivated" : "Room activated")
                fetchRooms()
            }
        } catch (error) {
            toast.error("Failed to update room status")
        }
    }

    const filteredRooms = rooms.filter(r =>
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.type.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const getRoomTypeInfo = (type: string) => {
        return ROOM_TYPES.find(t => t.value === type) || { value: type, label: type, icon: "🚪" }
    }

    const activeRoomsCount = rooms.filter(r => r.isActive).length
    const totalCapacity = rooms.reduce((sum, r) => sum + (r.isActive ? r.capacity : 0), 0)

    return (
        <div className="space-y-8 max-w-7xl mx-auto p-2">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900">Treatment Rooms</h2>
                    <p className="text-muted-foreground mt-1">Manage your spa rooms, suites, and treatment areas.</p>
                </div>
                <Button onClick={openCreateDialog} className="bg-primary hover:bg-primary/90 shadow-sm transition-all">
                    <Plus className="mr-2 h-4 w-4" /> Add Room
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="border shadow-sm bg-gradient-to-br from-violet-50 to-white">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Total Rooms</p>
                                <p className="text-3xl font-bold text-violet-600">{rooms.length}</p>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center">
                                <DoorOpen className="w-6 h-6 text-violet-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border shadow-sm bg-gradient-to-br from-emerald-50 to-white">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Active Rooms</p>
                                <p className="text-3xl font-bold text-emerald-600">{activeRoomsCount}</p>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                                <Calendar className="w-6 h-6 text-emerald-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border shadow-sm bg-gradient-to-br from-amber-50 to-white">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Total Capacity</p>
                                <p className="text-3xl font-bold text-amber-600">{totalCapacity}</p>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                                <Users className="w-6 h-6 text-amber-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border shadow-sm overflow-hidden">
                <CardHeader className="bg-gray-50/50 border-b pb-4">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="space-y-1">
                            <CardTitle className="text-lg font-medium">All Rooms</CardTitle>
                            <CardDescription>
                                Manage your treatment rooms and their availability.
                            </CardDescription>
                        </div>
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search rooms..."
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
                                <TableHead className="pl-6">Room</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Capacity</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="w-[120px] text-right pr-6">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                                        Loading rooms...
                                    </TableCell>
                                </TableRow>
                            ) : filteredRooms.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-64 text-center">
                                        <div className="flex flex-col items-center justify-center space-y-3">
                                            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                                                <DoorOpen className="w-6 h-6" />
                                            </div>
                                            <p className="font-medium text-lg">No rooms found</p>
                                            <p className="text-muted-foreground max-w-sm">
                                                Add treatment rooms to start managing bookings.
                                            </p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredRooms.map((room) => {
                                    const typeInfo = getRoomTypeInfo(room.type)
                                    return (
                                        <TableRow key={room.id} className="group hover:bg-gray-50/50 transition-colors">
                                            <TableCell className="font-medium pl-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-100 to-violet-50 flex items-center justify-center text-xl">
                                                        {typeInfo.icon}
                                                    </div>
                                                    <div>
                                                        <span className="font-semibold text-gray-900">{room.name}</span>
                                                        {room.description && (
                                                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                                                {room.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className="font-medium">
                                                    {typeInfo.label}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1.5">
                                                    <Users className="w-3.5 h-3.5 text-muted-foreground" />
                                                    <span>{room.capacity}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Switch
                                                    checked={room.isActive}
                                                    onCheckedChange={() => handleToggleActive(room)}
                                                />
                                            </TableCell>
                                            <TableCell className="text-right pr-6">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-muted-foreground hover:text-primary"
                                                        onClick={() => openEditDialog(room)}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-muted-foreground hover:text-red-600 hover:bg-red-50"
                                                        onClick={() => handleDelete(room.id, room.name)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{editingRoom ? "Edit Room" : "Add New Room"}</DialogTitle>
                        <DialogDescription>
                            {editingRoom
                                ? "Update the room details below."
                                : "Create a new treatment room for your spa."}
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Room Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. Serenity Suite 1" {...field} />
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
                                        <FormLabel>Room Type</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select room type" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {ROOM_TYPES.map((type) => (
                                                    <SelectItem key={type.value} value={type.value}>
                                                        <span className="flex items-center gap-2">
                                                            <span>{type.icon}</span>
                                                            <span>{type.label}</span>
                                                        </span>
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
                                name="capacity"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Capacity</FormLabel>
                                        <FormControl>
                                            <Input type="number" min={1} {...field} value={field.value as number ?? 1} />
                                        </FormControl>
                                        <FormDescription>
                                            Maximum number of clients this room can accommodate.
                                        </FormDescription>
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
                                            <Input placeholder="e.g. Equipped with heated massage table" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <DialogFooter className="mt-4">
                                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit">
                                    {editingRoom ? "Save Changes" : "Create Room"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
