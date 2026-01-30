"use client"

import { useState, useEffect } from "react"
import { Check, Plus, Sparkles, Clock, Package } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { getServiceAddOns } from "@/actions/addons"

type AddOn = {
    id: number
    name: string
    price: number
    durationChange: number
    description?: string | null
    applicableServices?: { serviceId: number }[]
}

type AddOnSelectorProps = {
    serviceIds: number[]
    selectedAddOns: AddOn[]
    onAddOnsChange: (addOns: AddOn[]) => void
    className?: string
}

export function AddOnSelector({
    serviceIds,
    selectedAddOns,
    onAddOnsChange,
    className
}: AddOnSelectorProps) {
    const [addOns, setAddOns] = useState<AddOn[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (serviceIds.length === 0) {
            setAddOns([])
            setLoading(false)
            return
        }

        setLoading(true)
        getServiceAddOns(serviceIds)
            .then(res => {
                if (res.addOns) {
                    setAddOns(res.addOns as any)
                }
            })
            .catch(err => console.error("Failed to load add-ons:", err))
            .finally(() => setLoading(false))
    }, [serviceIds])

    const toggleAddOn = (addOn: AddOn) => {
        const exists = selectedAddOns.find(a => a.id === addOn.id)
        if (exists) {
            onAddOnsChange(selectedAddOns.filter(a => a.id !== addOn.id))
        } else {
            onAddOnsChange([...selectedAddOns, addOn])
        }
    }

    if (loading) {
        return (
            <div className={cn("space-y-4", className)}>
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Sparkles className="w-4 h-4 animate-pulse" />
                    <span>Loading enhancements...</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[1, 2].map(i => (
                        <div key={i} className="h-24 bg-gray-100/50 dark:bg-zinc-800/50 rounded-xl animate-pulse" />
                    ))}
                </div>
            </div>
        )
    }

    if (addOns.length === 0) {
        return null // Don't show section if no add-ons available
    }

    return (
        <div className={cn("space-y-4", className)}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-foreground">Enhance Your Experience</h3>
                        <p className="text-xs text-muted-foreground">Add extras to your treatment</p>
                    </div>
                </div>
                {selectedAddOns.length > 0 && (
                    <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                        {selectedAddOns.length} selected
                    </Badge>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {addOns.map(addOn => {
                    const isSelected = selectedAddOns.some(a => a.id === addOn.id)
                    return (
                        <div
                            key={addOn.id}
                            onClick={() => toggleAddOn(addOn)}
                            className={cn(
                                "group relative cursor-pointer rounded-xl border p-4 transition-all duration-300 hover:shadow-md",
                                "bg-white dark:bg-zinc-900 border-gray-200 dark:border-gray-800",
                                isSelected
                                    ? "border-amber-500 ring-1 ring-amber-500 bg-amber-50 dark:bg-amber-950/20"
                                    : "hover:border-amber-500/50 hover:bg-gray-50 dark:hover:bg-zinc-800"
                            )}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 space-y-1">
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-medium text-foreground group-hover:text-amber-600 transition-colors">
                                            {addOn.name}
                                        </h4>
                                        {addOn.durationChange > 0 && (
                                            <Badge variant="outline" className="text-xs font-normal">
                                                <Clock className="w-3 h-3 mr-1" />
                                                +{addOn.durationChange} min
                                            </Badge>
                                        )}
                                    </div>
                                    {addOn.description && (
                                        <p className="text-xs text-muted-foreground line-clamp-2">
                                            {addOn.description}
                                        </p>
                                    )}
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <span className="font-bold text-amber-600">+₹{addOn.price}</span>
                                    <div className={cn(
                                        "w-5 h-5 rounded-full border flex items-center justify-center transition-all",
                                        isSelected
                                            ? "bg-amber-500 border-amber-500 text-white"
                                            : "border-gray-300 dark:border-gray-600"
                                    )}>
                                        {isSelected ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3 opacity-0 group-hover:opacity-50" />}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {selectedAddOns.length > 0 && (
                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-lg p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                        <Package className="w-4 h-4 text-amber-600" />
                        <span className="text-amber-800 dark:text-amber-300">
                            Add-ons subtotal
                        </span>
                    </div>
                    <span className="font-bold text-amber-600">
                        +₹{selectedAddOns.reduce((sum, a) => sum + a.price, 0)}
                    </span>
                </div>
            )}
        </div>
    )
}
