"use client"

import { Users, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

type GroupSizeSelectorProps = {
    value: number
    onChange: (size: number) => void
    maxSize?: number
    className?: string
}

export function GroupSizeSelector({
    value,
    onChange,
    maxSize = 5,
    className
}: GroupSizeSelectorProps) {

    return (
        <div className={cn("flex flex-col gap-3", className)}>
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                        <Users className="w-4 h-4 text-primary" />
                        Group Size
                    </h3>
                    <p className="text-xs text-muted-foreground">
                        Booking for how many people?
                    </p>
                </div>
                <div className="flex items-center bg-gray-100 dark:bg-zinc-800 rounded-lg p-1">
                    {[1, 2, 3, 4, 5].slice(0, maxSize).map((size) => (
                        <Button
                            key={size}
                            variant="ghost"
                            size="sm"
                            onClick={() => onChange(size)}
                            className={cn(
                                "col-span-1 h-8 w-10 text-xs transition-all rounded-md",
                                value === size
                                    ? "bg-white dark:bg-zinc-700 text-primary shadow-sm font-bold"
                                    : "text-muted-foreground hover:bg-gray-200 dark:hover:bg-zinc-700"
                            )}
                        >
                            {size}
                        </Button>
                    ))}
                </div>
            </div>

            {value > 1 && (
                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/50 p-3 rounded-lg text-xs text-blue-800 dark:text-blue-300 flex gap-2 items-start">
                    <User className="w-4 h-4 shrink-0 mt-0.5" />
                    <p>
                        You are booking for <strong>{value} guests</strong>.
                        We will find time slots where {value} specialists are available simultaneously.
                    </p>
                </div>
            )}
        </div>
    )
}
