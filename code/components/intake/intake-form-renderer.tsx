"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { Loader2, ClipboardCheck, AlertCircle } from "lucide-react"
import { submitIntakeResponse } from "@/actions/intake"

type FormField = {
    id: string
    type: string
    label: string
    placeholder?: string
    options?: string[]
    required: boolean
}

type IntakeFormProps = {
    templateId: number
    templateName: string
    fields: FormField[]
    clientId: number
    appointmentId?: number
    onSuccess?: () => void
    className?: string
}

export function IntakeFormRenderer({
    templateId,
    templateName,
    fields,
    clientId,
    appointmentId,
    onSuccess,
    className
}: IntakeFormProps) {
    const [responses, setResponses] = useState<Record<string, unknown>>({})
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSubmitted, setIsSubmitted] = useState(false)
    const [errors, setErrors] = useState<Record<string, string>>({})

    const updateResponse = (fieldId: string, value: unknown) => {
        setResponses(prev => ({ ...prev, [fieldId]: value }))
        // Clear error when user starts typing
        if (errors[fieldId]) {
            setErrors(prev => {
                const next = { ...prev }
                delete next[fieldId]
                return next
            })
        }
    }

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {}

        fields.forEach(field => {
            if (field.required) {
                const value = responses[field.id]
                if (value === undefined || value === null || value === "" ||
                    (Array.isArray(value) && value.length === 0)) {
                    newErrors[field.id] = `${field.label} is required`
                }
            }
        })

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async () => {
        if (!validate()) {
            toast.error("Please fill in all required fields")
            return
        }

        setIsSubmitting(true)
        try {
            const res = await submitIntakeResponse({
                templateId,
                clientId,
                appointmentId,
                responses
            })

            if (res.error) {
                toast.error(res.error)
                return
            }

            setIsSubmitted(true)
            toast.success("Form submitted successfully!")
            onSuccess?.()
        } catch (error) {
            console.error(error)
            toast.error("Failed to submit form")
        } finally {
            setIsSubmitting(false)
        }
    }

    if (isSubmitted) {
        return (
            <div className={cn("flex flex-col items-center justify-center p-8 text-center", className)}>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 animate-bounce">
                    <ClipboardCheck className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Thank You!</h3>
                <p className="text-muted-foreground mt-2 max-w-md">
                    Your {templateName} has been submitted successfully.
                </p>
            </div>
        )
    }

    return (
        <div className={cn("space-y-6", className)}>
            <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight">{templateName}</h2>
                <p className="text-muted-foreground">
                    Please fill out the form below. Fields marked with <span className="text-red-500">*</span> are required.
                </p>
            </div>

            <div className="space-y-5">
                {fields.map(field => (
                    <div key={field.id} className="space-y-2">
                        <Label htmlFor={field.id} className="flex items-center gap-1">
                            {field.label}
                            {field.required && <span className="text-red-500">*</span>}
                        </Label>

                        {/* Text Input */}
                        {field.type === "text" && (
                            <Input
                                id={field.id}
                                placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                                value={(responses[field.id] as string) || ""}
                                onChange={(e) => updateResponse(field.id, e.target.value)}
                                className={cn(errors[field.id] && "border-red-500 focus-visible:ring-red-500")}
                            />
                        )}

                        {/* Textarea */}
                        {field.type === "textarea" && (
                            <Textarea
                                id={field.id}
                                placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                                value={(responses[field.id] as string) || ""}
                                onChange={(e) => updateResponse(field.id, e.target.value)}
                                rows={4}
                                className={cn(errors[field.id] && "border-red-500 focus-visible:ring-red-500")}
                            />
                        )}

                        {/* Number */}
                        {field.type === "number" && (
                            <Input
                                id={field.id}
                                type="number"
                                placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                                value={(responses[field.id] as string) || ""}
                                onChange={(e) => updateResponse(field.id, e.target.value)}
                                className={cn(errors[field.id] && "border-red-500 focus-visible:ring-red-500")}
                            />
                        )}

                        {/* Date */}
                        {field.type === "date" && (
                            <Input
                                id={field.id}
                                type="date"
                                value={(responses[field.id] as string) || ""}
                                onChange={(e) => updateResponse(field.id, e.target.value)}
                                className={cn(errors[field.id] && "border-red-500 focus-visible:ring-red-500")}
                            />
                        )}

                        {/* Checkbox */}
                        {field.type === "checkbox" && (
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id={field.id}
                                    checked={(responses[field.id] as boolean) || false}
                                    onCheckedChange={(v: boolean | 'indeterminate') => updateResponse(field.id, v)}
                                />
                                <Label htmlFor={field.id} className="text-sm font-normal cursor-pointer">
                                    {field.placeholder || "Yes, I confirm"}
                                </Label>
                            </div>
                        )}

                        {/* Select */}
                        {field.type === "select" && field.options && (
                            <Select
                                value={(responses[field.id] as string) || ""}
                                onValueChange={(v) => updateResponse(field.id, v)}
                            >
                                <SelectTrigger className={cn(errors[field.id] && "border-red-500 focus:ring-red-500")}>
                                    <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
                                </SelectTrigger>
                                <SelectContent>
                                    {field.options.map((option) => (
                                        <SelectItem key={option} value={option}>
                                            {option}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}

                        {/* Multi-select (as checkboxes) */}
                        {field.type === "multiselect" && field.options && (
                            <div className="flex flex-wrap gap-4 pt-1">
                                {field.options.map((option) => {
                                    const selected = ((responses[field.id] as string[]) || []).includes(option)
                                    return (
                                        <div key={option} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`${field.id}-${option}`}
                                                checked={selected}
                                                onCheckedChange={(checked: boolean | 'indeterminate') => {
                                                    const current = (responses[field.id] as string[]) || []
                                                    if (checked === true) {
                                                        updateResponse(field.id, [...current, option])
                                                    } else {
                                                        updateResponse(field.id, current.filter(v => v !== option))
                                                    }
                                                }}
                                            />
                                            <Label htmlFor={`${field.id}-${option}`} className="text-sm font-normal cursor-pointer">
                                                {option}
                                            </Label>
                                        </div>
                                    )
                                })}
                            </div>
                        )}

                        {/* Error Message */}
                        {errors[field.id] && (
                            <p className="text-sm text-red-500 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                {errors[field.id]}
                            </p>
                        )}
                    </div>
                ))}
            </div>

            <div className="pt-4">
                <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="w-full sm:w-auto"
                    size="lg"
                >
                    {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {isSubmitting ? "Submitting..." : "Submit Form"}
                </Button>
            </div>
        </div>
    )
}
