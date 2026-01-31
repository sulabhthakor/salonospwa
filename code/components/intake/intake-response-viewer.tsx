"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ClipboardList, User, Calendar, Clock, FileText, CheckCircle2, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { getAppointmentIntakeResponses } from "@/actions/intake"

type FormField = {
    id: string
    type: string
    label: string
    options?: string[]
}

type IntakeResponse = {
    id: number
    submittedAt: string
    responses: Record<string, unknown>
    template: {
        id: number
        name: string
        fields: FormField[]
    }
    client?: {
        id: number
        name: string
    }
}

type IntakeResponseViewerProps = {
    appointmentId: number
    className?: string
}

export function IntakeResponseViewer({ appointmentId, className }: IntakeResponseViewerProps) {
    const [responses, setResponses] = useState<IntakeResponse[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchResponses = async () => {
            try {
                const res = await getAppointmentIntakeResponses(appointmentId)
                if (res.error) {
                    setError(res.error)
                } else if (res.responses) {
                    setResponses(res.responses as any)
                }
            } catch (err) {
                console.error(err)
                setError("Failed to load intake responses")
            } finally {
                setLoading(false)
            }
        }

        fetchResponses()
    }, [appointmentId])

    const formatValue = (field: FormField, value: unknown): string => {
        if (value === null || value === undefined || value === "") {
            return "—"
        }

        if (field.type === "checkbox") {
            return value ? "Yes" : "No"
        }

        if (field.type === "multiselect" && Array.isArray(value)) {
            return value.join(", ")
        }

        if (field.type === "date" && typeof value === "string") {
            try {
                return format(new Date(value), "MMMM d, yyyy")
            } catch {
                return value
            }
        }

        return String(value)
    }

    if (loading) {
        return (
            <Card className={cn("animate-pulse", className)}>
                <CardHeader>
                    <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-4 bg-gray-100 rounded w-1/2 mt-2"></div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-12 bg-gray-100 rounded"></div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (error) {
        return (
            <Card className={cn("border-red-200 bg-red-50", className)}>
                <CardContent className="pt-6">
                    <div className="flex items-center gap-3 text-red-600">
                        <AlertCircle className="w-5 h-5" />
                        <p>{error}</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (responses.length === 0) {
        return (
            <Card className={cn("border-dashed", className)}>
                <CardContent className="pt-6">
                    <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                            <ClipboardList className="w-6 h-6 text-gray-400" />
                        </div>
                        <p className="font-medium">No Intake Form Submitted</p>
                        <p className="text-sm mt-1">The client hasn't completed any intake forms for this appointment.</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className={cn("space-y-6", className)}>
            {responses.map((response) => (
                <Card key={response.id} className="overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-950/30 border-b">
                        <div className="flex items-start justify-between">
                            <div className="space-y-1">
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-blue-600" />
                                    {response.template.name}
                                </CardTitle>
                                <CardDescription className="flex items-center gap-4">
                                    {response.client && (
                                        <span className="flex items-center gap-1">
                                            <User className="w-3 h-3" />
                                            {response.client.name}
                                        </span>
                                    )}
                                    <span className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {format(new Date(response.submittedAt), "MMM d, yyyy")}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {format(new Date(response.submittedAt), "h:mm a")}
                                    </span>
                                </CardDescription>
                            </div>
                            <Badge className="bg-green-100 text-green-700 border-green-200">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Submitted
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="space-y-4">
                            {response.template.fields.map((field, idx) => {
                                const value = response.responses[field.id]
                                return (
                                    <div key={field.id}>
                                        <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4">
                                            <dt className="text-sm font-medium text-muted-foreground min-w-[180px] shrink-0">
                                                {field.label}
                                            </dt>
                                            <dd className="text-sm text-gray-900 font-medium">
                                                {formatValue(field, value)}
                                            </dd>
                                        </div>
                                        {idx < response.template.fields.length - 1 && (
                                            <Separator className="mt-4" />
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
