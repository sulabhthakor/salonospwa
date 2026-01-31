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
import { Textarea } from "@/components/ui/textarea"
import { Plus, Trash2, Search, Award, Edit, Users, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { createSkill, updateSkill, deleteSkill, getSkills } from "@/actions/skills"

const skillSchema = z.object({
    name: z.string().min(2, "Skill name is required"),
    category: z.string().optional(),
    description: z.string().optional(),
})

type Skill = {
    id: number
    name: string
    category?: string | null
    description?: string | null
    staffSkills?: { staff: { id: string; name: string } }[]
    serviceRequirements?: { service: { id: number; name: string } }[]
}

export default function SkillsPage() {
    const [skills, setSkills] = useState<Skill[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingSkill, setEditingSkill] = useState<Skill | null>(null)
    const [searchQuery, setSearchQuery] = useState("")

    const form = useForm({
        resolver: zodResolver(skillSchema),
        defaultValues: {
            name: "",
            category: "",
            description: "",
        },
    })

    const fetchSkills = async () => {
        try {
            const res = await getSkills()
            if (res.skills) {
                setSkills(res.skills as any)
            }
        } catch (error) {
            console.error(error)
            toast.error("Failed to fetch skills")
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchSkills()
    }, [])

    const openEditDialog = (skill: Skill) => {
        setEditingSkill(skill)
        form.reset({
            name: skill.name,
            category: skill.category || "",
            description: skill.description || "",
        })
        setIsDialogOpen(true)
    }

    const openCreateDialog = () => {
        setEditingSkill(null)
        form.reset({
            name: "",
            category: "",
            description: "",
        })
        setIsDialogOpen(true)
    }

    const onSubmit = async (values: z.infer<typeof skillSchema>) => {
        try {
            if (editingSkill) {
                const res = await updateSkill(editingSkill.id, {
                    name: values.name,
                    category: values.category,
                    description: values.description,
                })

                if (res?.error) {
                    toast.error(res.error)
                    return
                }

                toast.success("Skill updated successfully")
            } else {
                const res = await createSkill({
                    name: values.name,
                    category: values.category,
                    description: values.description,
                })

                if (res?.error) {
                    toast.error(res.error)
                    return
                }

                toast.success("Skill created successfully")
            }

            setIsDialogOpen(false)
            form.reset()
            fetchSkills()
        } catch (error) {
            console.error(error)
            toast.error("Operation failed")
        }
    }

    const handleDelete = async (id: number, name: string) => {
        if (!confirm(`Are you sure you want to delete "${name}"? This will also remove it from all staff and services.`)) return
        try {
            const res = await deleteSkill(id)
            if (res.error) {
                toast.error(res.error)
            } else {
                toast.success("Skill deleted")
                fetchSkills()
            }
        } catch (error) {
            toast.error("Failed to delete skill")
        }
    }

    const filteredSkills = skills.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.category && s.category.toLowerCase().includes(searchQuery.toLowerCase()))
    )

    // Group skills by category
    const categories = [...new Set(skills.map(s => s.category || "Uncategorized"))]
    const totalStaffWithSkills = new Set(skills.flatMap(s => s.staffSkills?.map(ss => ss.staff.id) || [])).size

    return (
        <div className="space-y-8 max-w-7xl mx-auto p-2">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900">Skills & Certifications</h2>
                    <p className="text-muted-foreground mt-1">Manage staff skills and service requirements.</p>
                </div>
                <Button onClick={openCreateDialog} className="bg-primary hover:bg-primary/90 shadow-sm transition-all">
                    <Plus className="mr-2 h-4 w-4" /> Add Skill
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="border shadow-sm bg-gradient-to-br from-indigo-50 to-white">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Total Skills</p>
                                <p className="text-3xl font-bold text-indigo-600">{skills.length}</p>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                                <Award className="w-6 h-6 text-indigo-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border shadow-sm bg-gradient-to-br from-purple-50 to-white">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Categories</p>
                                <p className="text-3xl font-bold text-purple-600">{categories.length}</p>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                                <Sparkles className="w-6 h-6 text-purple-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border shadow-sm bg-gradient-to-br from-teal-50 to-white">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Skilled Staff</p>
                                <p className="text-3xl font-bold text-teal-600">{totalStaffWithSkills}</p>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center">
                                <Users className="w-6 h-6 text-teal-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border shadow-sm overflow-hidden">
                <CardHeader className="bg-gray-50/50 border-b pb-4">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="space-y-1">
                            <CardTitle className="text-lg font-medium">All Skills</CardTitle>
                            <CardDescription>
                                Define skills that staff can have and services can require.
                            </CardDescription>
                        </div>
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search skills..."
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
                                <TableHead className="pl-6">Skill</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Staff</TableHead>
                                <TableHead>Required By</TableHead>
                                <TableHead className="w-[120px] text-right pr-6">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                                        Loading skills...
                                    </TableCell>
                                </TableRow>
                            ) : filteredSkills.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-64 text-center">
                                        <div className="flex flex-col items-center justify-center space-y-3">
                                            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                                                <Award className="w-6 h-6" />
                                            </div>
                                            <p className="font-medium text-lg">No skills defined</p>
                                            <p className="text-muted-foreground max-w-sm">
                                                Create skills to track staff certifications and service requirements.
                                            </p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredSkills.map((skill) => (
                                    <TableRow key={skill.id} className="group hover:bg-gray-50/50 transition-colors">
                                        <TableCell className="font-medium pl-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-100 to-indigo-50 flex items-center justify-center">
                                                    <Award className="w-5 h-5 text-indigo-600" />
                                                </div>
                                                <div>
                                                    <span className="font-semibold text-gray-900">{skill.name}</span>
                                                    {skill.description && (
                                                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                                            {skill.description}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="font-medium">
                                                {skill.category || "General"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1.5">
                                                <Users className="w-3.5 h-3.5 text-muted-foreground" />
                                                <span>{skill.staffSkills?.length || 0} staff</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-muted-foreground">
                                                {skill.serviceRequirements?.length || 0} services
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right pr-6">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-muted-foreground hover:text-primary"
                                                    onClick={() => openEditDialog(skill)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-muted-foreground hover:text-red-600 hover:bg-red-50"
                                                    onClick={() => handleDelete(skill.id, skill.name)}
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
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{editingSkill ? "Edit Skill" : "Add New Skill"}</DialogTitle>
                        <DialogDescription>
                            {editingSkill
                                ? "Update the skill details below."
                                : "Create a new skill or certification for your staff."}
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Skill Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. Swedish Massage" {...field} />
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
                                        <FormLabel>Category (Optional)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. Massage, Facial, Wellness" {...field} />
                                        </FormControl>
                                        <FormDescription>
                                            Group similar skills together.
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
                                            <Textarea
                                                placeholder="Describe the skill or certification requirements..."
                                                className="resize-none"
                                                {...field}
                                            />
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
                                    {editingSkill ? "Save Changes" : "Create Skill"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
