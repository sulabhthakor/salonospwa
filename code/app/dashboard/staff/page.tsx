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
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Plus, Trash2, Search, User, Mail, ShieldAlert } from "lucide-react"
import { toast } from "sonner"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { createStaffMember, getStaffMembers, deleteStaffMember, updateStaffMember, resetStaffPassword } from "@/actions/staff"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Pencil, KeyRound, Clock } from "lucide-react"
import { AvailabilityScheduler } from "@/components/dashboard/availability-scheduler"
import { MultiSelect } from "@/components/ui/multi-select"

const staffSchema = z.object({
    name: z.string().min(2, "Name is required"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
})

export default function StaffPage() {
    const [staff, setStaff] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")

    const [editingStaff, setEditingStaff] = useState<any>(null)
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false)
    const [isAvailabilityOpen, setIsAvailabilityOpen] = useState(false)
    const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null)
    const [newPassword, setNewPassword] = useState("")

    const [skills, setSkills] = useState<{ label: string, value: string }[]>([])
    const [selectedSkills, setSelectedSkills] = useState<string[]>([])

    const form = useForm({
        resolver: zodResolver(staffSchema),
        defaultValues: {
            name: "",
            email: "",
            password: "",
        },
    })

    const editForm = useForm({
        defaultValues: {
            name: "",
            email: "",
            skillIds: [] as number[]
        }
    })

    useEffect(() => {
        const loadSkills = async () => {
            const { getSkills } = await import("@/actions/services")
            const res = await getSkills()
            if (res.skills) {
                setSkills(res.skills.map((s: any) => ({ label: s.name, value: s.id.toString() })))
            }
        }
        loadSkills()
    }, [])

    useEffect(() => {
        if (editingStaff) {
            editForm.reset({
                name: editingStaff.name,
                email: editingStaff.email,
                skillIds: editingStaff.staffSkills?.map((ss: any) => ss.skillId) || []
            })
            // Set initial selected skills for UI
            setSelectedSkills(editingStaff.staffSkills?.map((ss: any) => ss.skillId.toString()) || [])
        }
    }, [editingStaff, editForm])

    const fetchStaff = async () => {
        try {
            const res = await getStaffMembers()
            if (res.staff) {
                setStaff(res.staff)
            }
        } catch (error) {
            console.error(error)
            toast.error("Failed to fetch staff")
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchStaff()
    }, [])

    const onSubmit = async (values: any) => {
        try {
            const res = await createStaffMember(values)

            if (res?.error) {
                toast.error(res.error)
                return
            }

            if (res?.success) {
                toast.success("Staff member added successfully")
                setIsDialogOpen(false)
                form.reset()
                fetchStaff()
            }
        } catch (error) {
            console.error(error)
            toast.error("Operation failed")
        }
    }

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to remove ${name}? This action cannot be undone.`)) return
        try {
            const res = await deleteStaffMember(id)
            if (res.error) {
                toast.error(res.error)
            } else {
                toast.success("Staff member removed")
                fetchStaff()
            }
        } catch (error) {
            toast.error("Failed to remove staff")
        }
    }

    const handleEditSubmit = async (values: any) => {
        if (!editingStaff) return;
        try {
            const res = await updateStaffMember(editingStaff.id, values);
            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success("Staff member updated");
                setIsEditOpen(false);
                setEditingStaff(null);
                fetchStaff();
            }
        } catch (error) {
            toast.error("Failed to update staff");
        }
    };

    const handleResetPassword = async () => {
        if (!selectedStaffId || !newPassword || newPassword.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }

        try {
            const res = await resetStaffPassword(selectedStaffId, newPassword);
            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success("Password reset successfully");
                setIsResetPasswordOpen(false);
                setSelectedStaffId(null);
                setNewPassword("");
            }
        } catch (error) {
            toast.error("Failed to reset password");
        }
    };

    const filteredStaff = staff.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const getInitials = (name: string) => name?.substring(0, 2).toUpperCase() || "SM"

    return (
        <div className="space-y-8 max-w-7xl mx-auto p-2">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900">Team Management</h2>
                    <p className="text-muted-foreground mt-1">Manage your staff members, stylists, and assistants.</p>
                </div>
                <Button onClick={() => setIsDialogOpen(true)} className="bg-primary hover:bg-primary/90 shadow-sm transition-all">
                    <Plus className="mr-2 h-4 w-4" /> Add Staff Member
                </Button>
            </div>

            <Card className="border shadow-sm overflow-hidden">
                <CardHeader className="bg-gray-50/50 border-b pb-4">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="space-y-1">
                            <CardTitle className="text-lg font-medium">All Staff</CardTitle>
                            <CardDescription>
                                You have {staff.length} active team members.
                            </CardDescription>
                        </div>
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name or email..."
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
                                <TableHead className="pl-6">Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead className="w-[100px] text-right pr-6">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                                        Loading your team...
                                    </TableCell>
                                </TableRow>
                            ) : filteredStaff.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-64 text-center">
                                        <div className="flex flex-col items-center justify-center space-y-3">
                                            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                                                <User className="w-6 h-6" />
                                            </div>
                                            <p className="font-medium text-lg">No staff members found</p>
                                            <p className="text-muted-foreground max-w-sm">
                                                Add your employees to start assigning appointments.
                                            </p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredStaff.map((member) => (
                                    <TableRow key={member.id} className="group hover:bg-gray-50/50 transition-colors">
                                        <TableCell className="font-medium pl-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-9 w-9 border">
                                                    <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">
                                                        {getInitials(member.name)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span className="font-semibold text-gray-900">{member.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            <div className="flex items-center gap-2">
                                                <Mail className="w-3.5 h-3.5" />
                                                {member.email}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className="font-medium">
                                                {member.role}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right pr-6">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-muted-foreground hover:text-red-600 hover:bg-red-50"
                                                onClick={() => handleDelete(member.id, member.name)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-muted-foreground hover:text-blue-600 hover:bg-blue-50 ml-1"
                                                onClick={() => {
                                                    setEditingStaff(member);
                                                    setIsEditOpen(true);
                                                }}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-muted-foreground hover:text-green-600 hover:bg-green-50 ml-1"
                                                onClick={() => {
                                                    setSelectedStaffId(member.id);
                                                    setIsAvailabilityOpen(true);
                                                }}
                                                title="Manage Availability"
                                            >
                                                <Clock className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-muted-foreground hover:text-yellow-600 hover:bg-yellow-50 ml-1"
                                                onClick={() => {
                                                    setSelectedStaffId(member.id);
                                                    setIsResetPasswordOpen(true);
                                                }}
                                            >
                                                <KeyRound className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Add New Staff Member</DialogTitle>
                        <DialogDescription>
                            Create an account for your employee. They will be able to log in with these credentials.
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Full Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="John Doe" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email Address</FormLabel>
                                        <FormControl>
                                            <Input placeholder="john@example.com" type="email" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Initial Password</FormLabel>
                                        <FormControl>
                                            <Input placeholder="********" type="password" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="bg-yellow-50 p-3 rounded-md flex gap-2 text-yellow-800 text-xs mt-2">
                                <ShieldAlert className="w-4 h-4 shrink-0" />
                                <p>Ensure you share the password securely with your staff member. They can change it later.</p>
                            </div>

                            <DialogFooter className="mt-4">
                                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                                <Button type="submit">Create Account</Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Edit Staff Member</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Full Name</label>
                            <Input
                                value={editForm.watch("name")}
                                onChange={(e) => editForm.setValue("name", e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Email Address</label>
                            <Input
                                value={editForm.watch("email")}
                                onChange={(e) => editForm.setValue("email", e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Assigned Skills</label>
                            <MultiSelect
                                options={skills}
                                selected={selectedSkills}
                                onChange={(val) => {
                                    setSelectedSkills(val)
                                    editForm.setValue("skillIds", val.map(v => Number(v)))
                                }}
                                placeholder="Select skills..."
                            />
                        </div>
                        <DialogFooter className="mt-4">
                            <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                            <Button onClick={() => handleEditSubmit(editForm.getValues())}>Save Changes</Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={isResetPasswordOpen} onOpenChange={setIsResetPasswordOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Reset Password</DialogTitle>
                        <DialogDescription>
                            Enter a new password for this staff member.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">New Password</label>
                            <Input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="******"
                            />
                        </div>
                        <DialogFooter className="mt-4">
                            <Button type="button" variant="outline" onClick={() => setIsResetPasswordOpen(false)}>Cancel</Button>
                            <Button onClick={handleResetPassword}>Reset Password</Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={isAvailabilityOpen} onOpenChange={setIsAvailabilityOpen}>
                <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Manage Availability</DialogTitle>
                        <DialogDescription>
                            Set working hours for this staff member.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedStaffId && (
                        <AvailabilityScheduler
                            staffId={selectedStaffId}
                            onClose={() => setIsAvailabilityOpen(false)}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
