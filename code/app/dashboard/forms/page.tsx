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
import { Plus, Trash2, Search, FileText, Edit, GripVertical, X, ClipboardList, Users } from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    createIntakeFormTemplate,
    updateIntakeFormTemplate,
    deleteIntakeFormTemplate,
    getIntakeFormTemplates,
} from "@/actions/intake"

// Field types for intake forms
const FIELD_TYPES = [
    { value: "text", label: "Short Text", icon: "📝" },
    { value: "textarea", label: "Long Text", icon: "📄" },
    { value: "select", label: "Dropdown", icon: "📋" },
    { value: "multiselect", label: "Multi-Select", icon: "☑️" },
    { value: "checkbox", label: "Checkbox", icon: "✅" },
    { value: "date", label: "Date", icon: "📅" },
    { value: "number", label: "Number", icon: "🔢" },
]

type FormField = {
    id: string
    type: string
    label: string
    placeholder?: string
    options?: string[]
    required: boolean
}

type FormTemplate = {
    id: number
    name: string
    fields: FormField[]
    isActive: boolean
}

export default function FormsPage() {
    const [templates, setTemplates] = useState<FormTemplate[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingTemplate, setEditingTemplate] = useState<FormTemplate | null>(null)
    const [searchQuery, setSearchQuery] = useState("")

    // Form State
    const [formName, setFormName] = useState("")
    const [formFields, setFormFields] = useState<FormField[]>([])

    const fetchTemplates = async () => {
        try {
            const res = await getIntakeFormTemplates()
            if (res.templates) {
                setTemplates(res.templates as any)
            }
        } catch (error) {
            console.error(error)
            toast.error("Failed to fetch form templates")
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchTemplates()
    }, [])

    const openEditDialog = (template: FormTemplate) => {
        setEditingTemplate(template)
        setFormName(template.name)
        setFormFields(template.fields || [])
        setIsDialogOpen(true)
    }

    const openCreateDialog = () => {
        setEditingTemplate(null)
        setFormName("")
        setFormFields([
            { id: crypto.randomUUID(), type: "text", label: "Full Name", required: true },
            { id: crypto.randomUUID(), type: "date", label: "Date of Birth", required: false },
        ])
        setIsDialogOpen(true)
    }

    const addField = () => {
        setFormFields([
            ...formFields,
            { id: crypto.randomUUID(), type: "text", label: "", required: false }
        ])
    }

    const updateField = (id: string, updates: Partial<FormField>) => {
        setFormFields(formFields.map(f => f.id === id ? { ...f, ...updates } : f))
    }

    const removeField = (id: string) => {
        setFormFields(formFields.filter(f => f.id !== id))
    }

    const handleSubmit = async () => {
        if (!formName.trim()) {
            toast.error("Form name is required")
            return
        }
        if (formFields.length === 0) {
            toast.error("Add at least one field")
            return
        }
        if (formFields.some(f => !f.label.trim())) {
            toast.error("All fields must have labels")
            return
        }

        try {
            if (editingTemplate) {
                const res = await updateIntakeFormTemplate(editingTemplate.id, {
                    name: formName,
                    fields: formFields as any,
                })

                if (res?.error) {
                    toast.error(res.error)
                    return
                }

                toast.success("Form template updated")
            } else {
                const res = await createIntakeFormTemplate({
                    name: formName,
                    fields: formFields as any,
                })

                if (res?.error) {
                    toast.error(res.error)
                    return
                }

                toast.success("Form template created")
            }

            setIsDialogOpen(false)
            fetchTemplates()
        } catch (error) {
            console.error(error)
            toast.error("Operation failed")
        }
    }

    const handleDelete = async (id: number, name: string) => {
        if (!confirm(`Are you sure you want to delete "${name}"? Existing responses will be preserved.`)) return
        try {
            const res = await deleteIntakeFormTemplate(id)
            if (res.error) {
                toast.error(res.error)
            } else {
                toast.success("Form template deleted")
                fetchTemplates()
            }
        } catch {
            toast.error("Failed to delete template")
        }
    }

    const handleToggleActive = async (template: FormTemplate) => {
        try {
            const res = await updateIntakeFormTemplate(template.id, { isActive: !template.isActive })
            if (res.error) {
                toast.error(res.error)
            } else {
                toast.success(template.isActive ? "Form deactivated" : "Form activated")
                fetchTemplates()
            }
        } catch {
            toast.error("Failed to update status")
        }
    }

    const filteredTemplates = templates.filter(t =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const fieldTypeLabel = (type: string) => {
        return FIELD_TYPES.find(t => t.value === type)?.label || type
    }

    return (
        <div className="space-y-8 max-w-7xl mx-auto p-2">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900">Intake Forms</h2>
                    <p className="text-muted-foreground mt-1">Create consultation and health forms for clients.</p>
                </div>
                <Button onClick={openCreateDialog} className="bg-primary hover:bg-primary/90 shadow-sm transition-all">
                    <Plus className="mr-2 h-4 w-4" /> Create Form
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="border shadow-sm bg-gradient-to-br from-blue-50 to-white">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Total Forms</p>
                                <p className="text-3xl font-bold text-blue-600">{templates.length}</p>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                                <FileText className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border shadow-sm bg-gradient-to-br from-green-50 to-white">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Active Forms</p>
                                <p className="text-3xl font-bold text-green-600">{templates.filter(t => t.isActive).length}</p>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                                <ClipboardList className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border shadow-sm bg-gradient-to-br from-purple-50 to-white">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Total Fields</p>
                                <p className="text-3xl font-bold text-purple-600">
                                    {templates.reduce((sum, t) => sum + (t.fields?.length || 0), 0)}
                                </p>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                                <Users className="w-6 h-6 text-purple-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border shadow-sm overflow-hidden">
                <CardHeader className="bg-gray-50/50 border-b pb-4">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="space-y-1">
                            <CardTitle className="text-lg font-medium">All Form Templates</CardTitle>
                            <CardDescription>
                                Manage intake forms for health history, allergies, and preferences.
                            </CardDescription>
                        </div>
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search forms..."
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
                                <TableHead className="pl-6">Form Name</TableHead>
                                <TableHead>Fields</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="w-[120px] text-right pr-6">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                                        Loading forms...
                                    </TableCell>
                                </TableRow>
                            ) : filteredTemplates.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-64 text-center">
                                        <div className="flex flex-col items-center justify-center space-y-3">
                                            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                                                <FileText className="w-6 h-6" />
                                            </div>
                                            <p className="font-medium text-lg">No intake forms yet</p>
                                            <p className="text-muted-foreground max-w-sm">
                                                Create intake forms to collect client health information.
                                            </p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredTemplates.map((template) => (
                                    <TableRow key={template.id} className="group hover:bg-gray-50/50 transition-colors">
                                        <TableCell className="font-medium pl-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center">
                                                    <FileText className="w-5 h-5 text-blue-600" />
                                                </div>
                                                <div>
                                                    <span className="font-semibold text-gray-900">{template.name}</span>
                                                    <p className="text-xs text-muted-foreground">
                                                        {template.fields?.slice(0, 3).map(f => f.label).join(", ")}
                                                        {(template.fields?.length || 0) > 3 && "..."}
                                                    </p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className="font-medium">
                                                {template.fields?.length || 0} fields
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Switch
                                                checked={template.isActive}
                                                onCheckedChange={() => handleToggleActive(template)}
                                            />
                                        </TableCell>
                                        <TableCell className="text-right pr-6">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-muted-foreground hover:text-primary"
                                                    onClick={() => openEditDialog(template)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-muted-foreground hover:text-red-600 hover:bg-red-50"
                                                    onClick={() => handleDelete(template.id, template.name)}
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

            {/* Form Builder Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingTemplate ? "Edit Form" : "Create New Form"}</DialogTitle>
                        <DialogDescription>
                            {editingTemplate
                                ? "Update the form fields below."
                                : "Design your intake form with the fields below."}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 pt-4">
                        {/* Form Name */}
                        <div className="space-y-2">
                            <Label htmlFor="formName">Form Name</Label>
                            <Input
                                id="formName"
                                placeholder="e.g. New Client Health Form"
                                value={formName}
                                onChange={(e) => setFormName(e.target.value)}
                            />
                        </div>

                        {/* Fields Builder */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label>Form Fields</Label>
                                <Button type="button" variant="outline" size="sm" onClick={addField}>
                                    <Plus className="w-4 h-4 mr-1" /> Add Field
                                </Button>
                            </div>

                            <div className="space-y-3">
                                {formFields.map((field, idx) => (
                                    <div
                                        key={field.id}
                                        className="flex items-start gap-3 p-4 border rounded-lg bg-gray-50/50"
                                    >
                                        <div className="text-muted-foreground cursor-move">
                                            <GripVertical className="w-4 h-4" />
                                        </div>

                                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            {/* Field Type */}
                                            <Select
                                                value={field.type}
                                                onValueChange={(v) => updateField(field.id, { type: v })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {FIELD_TYPES.map((type) => (
                                                        <SelectItem key={type.value} value={type.value}>
                                                            <span className="flex items-center gap-2">
                                                                <span>{type.icon}</span>
                                                                <span>{type.label}</span>
                                                            </span>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>

                                            {/* Field Label */}
                                            <Input
                                                placeholder="Label"
                                                value={field.label}
                                                onChange={(e) => updateField(field.id, { label: e.target.value })}
                                                className="sm:col-span-2"
                                            />

                                            {/* Required Toggle */}
                                            <div className="flex items-center gap-2 sm:col-span-3">
                                                <Switch
                                                    id={`required-${field.id}`}
                                                    checked={field.required}
                                                    onCheckedChange={(v) => updateField(field.id, { required: v })}
                                                />
                                                <Label htmlFor={`required-${field.id}`} className="text-sm">Required</Label>

                                                {/* Options for select/multiselect */}
                                                {(field.type === "select" || field.type === "multiselect") && (
                                                    <Input
                                                        placeholder="Options (comma-separated)"
                                                        value={field.options?.join(", ") || ""}
                                                        onChange={(e) => updateField(field.id, {
                                                            options: e.target.value.split(",").map(s => s.trim()).filter(Boolean)
                                                        })}
                                                        className="flex-1 ml-4"
                                                    />
                                                )}
                                            </div>
                                        </div>

                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="text-muted-foreground hover:text-red-600"
                                            onClick={() => removeField(field.id)}
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}

                                {formFields.length === 0 && (
                                    <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
                                        No fields added yet. Click "Add Field" to start.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="mt-6">
                        <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSubmit}>
                            {editingTemplate ? "Save Changes" : "Create Form"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
