"use client"

import { useState, useEffect } from "react"
import { Availability, updateStaffAvailability, getStaffAvailability } from "@/actions/availability-settings"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Loader2, Copy } from "lucide-react"
import { cn } from "@/lib/utils"

const DB_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
// We want to display Monday first
const DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0]

// Generate time slots every 30 mins
const TIME_SLOTS = []
for (let i = 0; i < 24; i++) {
    for (let j = 0; j < 60; j += 30) {
        const hour = i.toString().padStart(2, '0')
        const min = j.toString().padStart(2, '0')
        TIME_SLOTS.push(`${hour}:${min}`)
    }
}
// Add 23:59 as end of day option
TIME_SLOTS.push("23:59")

interface AvailabilitySchedulerProps {
    staffId: string
    onClose?: () => void
}

export function AvailabilityScheduler({ staffId, onClose }: AvailabilitySchedulerProps) {
    const [schedule, setSchedule] = useState<Availability[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        loadAvailability()
    }, [staffId])

    const loadAvailability = async () => {
        setLoading(true)
        const res = await getStaffAvailability(staffId)
        if (res.availability) {
            setSchedule(res.availability)
        } else {
            toast.error(res.error || "Failed to load schedule")
        }
        setLoading(false)
    }

    const handleUpdate = (dayOfWeek: number, field: keyof Availability, value: any) => {
        setSchedule(prev => prev.map(day => {
            if (day.dayOfWeek === dayOfWeek) {
                return { ...day, [field]: value }
            }
            return day
        }))
    }

    const copyToAll = (sourceDay: number) => {
        const source = schedule.find(d => d.dayOfWeek === sourceDay)
        if (!source) return

        setSchedule(prev => prev.map(day =>
            day.dayOfWeek === sourceDay ? day : {
                ...day,
                startTime: source.startTime,
                endTime: source.endTime,
                isWorking: source.isWorking
            }
        ))
        toast.success("Copied schedule to all days")
    }

    const handleSave = async () => {
        setSaving(true)
        const res = await updateStaffAvailability(staffId, schedule)
        setSaving(false)

        if (res.success) {
            toast.success("Availability updated successfully")
            if (onClose) onClose()
        } else {
            toast.error(res.error || "Failed to save")
        }
    }

    if (loading) {
        return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
    }

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                {DISPLAY_ORDER.map(dayIndex => {
                    const dayData = schedule.find(d => d.dayOfWeek === dayIndex)
                    if (!dayData) return null

                    return (
                        <div key={dayIndex} className={cn(
                            "grid grid-cols-12 gap-2 items-center p-3 rounded-lg border",
                            dayData.isWorking ? "bg-card" : "bg-muted/50 opacity-70"
                        )}>
                            <div className="col-span-3 font-medium flex items-center gap-2">
                                <Switch
                                    checked={dayData.isWorking}
                                    onCheckedChange={(c) => handleUpdate(dayIndex, 'isWorking', c)}
                                />
                                <span>{DB_DAYS[dayIndex]}</span>
                            </div>

                            {dayData.isWorking ? (
                                <>
                                    <div className="col-span-4">
                                        <Select
                                            value={dayData.startTime}
                                            onValueChange={(v) => handleUpdate(dayIndex, 'startTime', v)}
                                        >
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {TIME_SLOTS.map(t => (
                                                    <SelectItem key={`start-${t}`} value={t}>{t}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="col-span-1 text-center text-muted-foreground">-</div>
                                    <div className="col-span-4">
                                        <Select
                                            value={dayData.endTime}
                                            onValueChange={(v) => handleUpdate(dayIndex, 'endTime', v)}
                                        >
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {TIME_SLOTS.map(t => (
                                                    <SelectItem key={`end-${t}`} value={t}>{t}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </>
                            ) : (
                                <div className="col-span-9 text-center text-muted-foreground text-sm italic">
                                    Not Working
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            <div className="flex justify-between items-center pt-4 border-t">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToAll(1)} // Copy Monday
                    title="Copy Monday's schedule to all days"
                >
                    <Copy className="w-4 h-4 mr-2" /> Copy Mon to All
                </Button>

                <div className="flex gap-2">
                    {onClose && <Button variant="outline" onClick={onClose}>Cancel</Button>}
                    <Button onClick={handleSave} disabled={saving}>
                        {saving && <Loader2 className="animate-spin w-4 h-4 mr-2" />}
                        Save Changes
                    </Button>
                </div>
            </div>
        </div>
    )
}
