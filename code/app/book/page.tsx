"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Check, ChevronLeft, ChevronRight, Clock, Calendar as CalendarIcon, Store, Scissors, Settings, Plus } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { getPublicServices } from "@/actions/services"
import { createAppointment } from "@/actions/appointments"

// Types
type Service = {
    id: number
    name: string
    category?: string
    duration: number
    price: number
    description?: string
}

const TIME_SLOTS = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
    "15:00", "15:30", "16:00", "16:30", "17:00"
]

export default function BookingPage() {
    const router = useRouter()

    // State
    const [step, setStep] = useState(1)
    const [services, setServices] = useState<Service[]>([])
    const [loading, setLoading] = useState(true)

    // Selection State
    const [selectedServices, setSelectedServices] = useState<Service[]>([])
    const [date, setDate] = useState<Date | undefined>(new Date())
    const [time, setTime] = useState<string | null>(null)
    const [isBooking, setIsBooking] = useState(false)

    // Derived State
    const totalDuration = selectedServices.reduce((acc, s) => acc + s.duration, 0)
    const totalPrice = selectedServices.reduce((acc, s) => acc + s.price, 0)

    // Fetch Services
    useEffect(() => {
        getPublicServices().then(res => {
            if (res.services) {
                setServices(res.services)
            } else {
                toast.error("Failed to load services")
            }
        }).catch(err => {
            console.error(err)
            toast.error("Failed to load services")
        }).finally(() => setLoading(false))
    }, [])

    const handleNext = () => setStep(s => s + 1)
    const handleBack = () => setStep(s => s - 1)

    const toggleService = (service: Service) => {
        setSelectedServices(prev => {
            const exists = prev.find(s => s.id === service.id)
            if (exists) {
                return prev.filter(s => s.id !== service.id)
            }
            return [...prev, service]
        })
    }

    const handleBooking = async () => {
        if (selectedServices.length === 0 || !date || !time) return

        setIsBooking(true)
        try {
            // Format DateTime
            const dateStr = format(date, 'yyyy-MM-dd')
            const dateTime = new Date(`${dateStr}T${time}`)

            const res = await createAppointment({
                serviceIds: selectedServices.map(s => s.id),
                startTime: dateTime.toISOString()
            })

            if (res.error) {
                if (res.error === 'Unauthorized') {
                    toast.error("Login Required", {
                        description: "Please sign in to book an appointment.",
                        action: {
                            label: "Login",
                            onClick: () => router.push("/auth/login?redirect=/book")
                        }
                    })
                } else {
                    toast.error("Booking Failed", {
                        description: res.error || "Please try again later."
                    })
                }
                return
            }

            toast.success("Appointment Booked!", {
                description: `${selectedServices.length} services scheduled.`
            })
            router.push("/dashboard/appointments")
        } catch (err: any) {
            console.error(err)
            toast.error("Booking Failed", {
                description: "An unexpected error occurred."
            })
        } finally {
            setIsBooking(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50/50 dark:bg-black/90 py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Background Gradients */}
            <div className="fixed inset-0 -z-10 h-full w-full bg-white dark:bg-black [background:radial-gradient(125%_125%_at_50%_10%,#fff_40%,#63e_100%)] dark:[background:radial-gradient(125%_125%_at_50%_10%,#000_40%,#63e_100%)] opacity-20"></div>

            <div className="max-w-7xl mx-auto relative z-10 space-y-8">

                {/* Header & Steps */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 animate-fade-in">
                    <div className="text-center md:text-left">
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">Book Appointment</h1>
                        <p className="text-muted-foreground">Select a service and find a time.</p>
                    </div>

                    {/* Horizontal Steps */}
                    <div className="flex items-center bg-white/40 dark:bg-black/40 backdrop-blur-sm p-2 rounded-full border border-white/10 shadow-sm">
                        {['Service', 'Date & Time', 'Review'].map((label, idx) => {
                            const stepNum = idx + 1
                            const isActive = step === stepNum
                            const isCompleted = step > stepNum
                            return (
                                <div key={label} className={cn(
                                    "flex items-center gap-2 px-4 py-2 rounded-full transition-all text-sm font-medium",
                                    isActive ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground",
                                    isCompleted && "text-primary font-semibold"
                                )}>
                                    <div className={cn(
                                        "w-6 h-6 rounded-full flex items-center justify-center text-xs border",
                                        isActive ? "border-transparent" : "border-gray-300 dark:border-gray-700",
                                        isCompleted ? "bg-primary text-primary-foreground border-primary" : ""
                                    )}>
                                        {isCompleted ? <Check className="w-3 h-3" /> : stepNum}
                                    </div>
                                    <span className={cn("hidden sm:inline", !isActive && !isCompleted && "opacity-70")}>{label}</span>
                                    {idx < 2 && <ChevronRight className="w-4 h-4 ml-2 text-muted-foreground/30" />}
                                </div>
                            )
                        })}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                    {/* Left Column: Wizard Content (Big) */}
                    <div className="lg:col-span-8 space-y-6">
                        <div className="bg-white/40 dark:bg-zinc-900/50 backdrop-blur-md rounded-2xl border border-white/20 dark:border-white/10 p-6 md:p-8 shadow-sm min-h-[500px] flex flex-col">

                            {/* Step 1: Service Selection */}
                            {step === 1 && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
                                    <div className="border-b border-black/5 dark:border-white/5 pb-4">
                                        <h2 className="text-2xl font-semibold">Select Services</h2>
                                        <p className="text-muted-foreground">Choose from our exclusive treatments.</p>
                                    </div>

                                    {loading ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-gray-100/50 rounded-xl animate-pulse" />)}
                                        </div>
                                    ) : (
                                        Object.entries(services.reduce((acc, service) => {
                                            const cat = service.category || "General"
                                            if (!acc[cat]) acc[cat] = []
                                            acc[cat].push(service)
                                            return acc
                                        }, {} as Record<string, Service[]>)).map(([category, categoryServices]) => (
                                            <div key={category} className="space-y-3">
                                                <h3 className="text-lg font-semibold text-primary/80 flex items-center gap-2">
                                                    <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5">{category}</Badge>
                                                </h3>
                                                <div className="grid grid-cols-1 gap-4">
                                                    {categoryServices.map(service => {
                                                        const isSelected = selectedServices.some(s => s.id === service.id);
                                                        return (
                                                            <div
                                                                key={service.id}
                                                                className={cn(
                                                                    "group relative cursor-pointer rounded-xl border p-4 transition-all duration-300 hover:shadow-md flex justify-between items-center",
                                                                    // High contrast background and border
                                                                    "bg-white dark:bg-zinc-900 border-gray-200 dark:border-gray-800 shadow-sm",
                                                                    isSelected ? "border-primary ring-1 ring-primary bg-primary/5 shadow-primary/10" : "hover:border-primary/50 hover:bg-gray-50 dark:hover:bg-zinc-800"
                                                                )}
                                                                onClick={() => toggleService(service)}
                                                            >
                                                                <div className="flex-1">
                                                                    <div className="flex items-center gap-3 mb-1">
                                                                        <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">{service.name}</h3>
                                                                        <Badge variant="secondary" className="font-normal text-muted-foreground text-xs">{service.duration} mins</Badge>
                                                                    </div>
                                                                    <p className="text-sm text-muted-foreground line-clamp-1">
                                                                        {service.description || "Professional salon service."}
                                                                    </p>
                                                                </div>
                                                                <div className="flex flex-col items-end gap-2 pl-4">
                                                                    <div className="font-bold text-lg text-primary">₹{service.price}</div>
                                                                    <div className={cn(
                                                                        "w-6 h-6 rounded-full border flex items-center justify-center transition-all",
                                                                        isSelected ? "bg-primary border-primary text-white" : "border-gray-300 text-transparent"
                                                                    )}>
                                                                        <Check className="w-3 h-3" />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}

                            {/* Step 2: Date & Time */}
                            {step === 2 && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                                    <div className="border-b border-black/5 dark:border-white/5 pb-4">
                                        <h2 className="text-2xl font-semibold">Choose Date & Time</h2>
                                        <p className="text-muted-foreground">Schedule your appointment.</p>
                                    </div>

                                    <div className="flex flex-col xl:flex-row gap-8">
                                        <div className="mx-auto w-full max-w-[320px] shrink-0">
                                            <div className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-black/40 rounded-xl p-4 shadow-sm">
                                                <Calendar
                                                    mode="single"
                                                    selected={date}
                                                    onSelect={setDate}
                                                    className="rounded-md flex justify-center w-full"
                                                    disabled={(date) => date < new Date() || date < new Date("1900-01-01")}
                                                />
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-medium mb-4 flex items-center justify-between">
                                                <span className="flex items-center gap-2"><Clock className="w-4 h-4 text-primary" /> Available Slots</span>
                                                {date && <span className="text-sm text-muted-foreground">{format(date, 'EEEE, d MMMM')}</span>}
                                            </h3>
                                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                                                {TIME_SLOTS.map(slot => (
                                                    <Button
                                                        key={slot}
                                                        variant={time === slot ? "default" : "outline"}
                                                        onClick={() => setTime(slot)}
                                                        className={cn(
                                                            "w-full transition-all",
                                                            time === slot ? "bg-primary text-primary-foreground shadow-md scale-105" : "bg-white dark:bg-zinc-900 border-gray-200 dark:border-gray-800 hover:border-primary hover:bg-gray-50 dark:hover:bg-zinc-800 text-foreground"
                                                        )}
                                                    >
                                                        {slot}
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Step 3: Review */}
                            {step === 3 && selectedServices.length > 0 && (
                                <div className="max-w-xl mx-auto w-full space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 py-6">
                                    <div className="text-center space-y-2">
                                        <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                                            <CalendarIcon className="w-10 h-10" />
                                        </div>
                                        <h2 className="text-3xl font-bold">Ready to Book?</h2>
                                        <p className="text-muted-foreground text-lg">Please confirm your details below.</p>
                                    </div>

                                    {/* Confirmation details are now mainly in the right summary column, 
                                        so we can show a simpler confirmation message or additional notes here */}
                                    <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-4 text-sm text-blue-800 dark:text-blue-300">
                                        <p className="flex gap-2">
                                            <Store className="w-4 h-4 mt-0.5 shrink-0" />
                                            <span>
                                                Booking for <strong>Elite Salon & Spa</strong>.
                                                You will receive a confirmation email shortly after booking.
                                                Please arrive 10 minutes early.
                                            </span>
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Navigation Buttons (Desktop) */}
                            <div className="mt-auto pt-10 hidden lg:flex justify-between border-t border-black/5 dark:border-white/5">
                                <Button
                                    variant="ghost"
                                    onClick={handleBack}
                                    disabled={step === 1}
                                    className={cn("pl-0 hover:bg-transparent hover:text-primary transition-colors", step === 1 && "invisible")}
                                >
                                    <ChevronLeft className="w-4 h-4 mr-2" />
                                    Back
                                </Button>

                                {step < 3 ? (
                                    <Button
                                        onClick={handleNext}
                                        disabled={(step === 1 && selectedServices.length === 0) || (step === 2 && (!date || !time))}
                                        className="rounded-full px-8 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all font-semibold"
                                    >
                                        Next Step
                                        <ChevronRight className="w-4 h-4 ml-2" />
                                    </Button>
                                ) : (
                                    <Button onClick={handleBooking} disabled={isBooking} size="lg" className="rounded-full px-10 shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all font-bold text-lg animate-pulse">
                                        {isBooking ? "Confirming..." : "Confirm Booking"}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Summary Widget (Desktop Sticky / Mobile Hidden if floating bar exists) */}
                    <div className="hidden lg:block lg:col-span-4 space-y-6 lg:sticky lg:top-24">
                        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xl text-sm space-y-6 animate-fade-in ring-1 ring-black/5 relative overflow-hidden">
                            {/* Decorative top border */}
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-purple-500 to-pink-500"></div>

                            <div className="font-bold text-xl text-foreground flex items-center justify-between">
                                <span>Your Order</span>
                                <Badge className="bg-primary text-primary-foreground">{selectedServices.length}</Badge>
                            </div>

                            {selectedServices.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground bg-gray-50 dark:bg-zinc-800/50 rounded-lg border border-dashed border-gray-200 dark:border-gray-700">
                                    <Scissors className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                    <p>No services selected yet.</p>
                                    <p className="text-xs max-w-[150px] mx-auto mt-1 opacity-70">Choose a service from the list to get started.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                        {selectedServices.map(s => (
                                            <div key={s.id} className="flex justify-between items-start group">
                                                <div className="flex-1">
                                                    <div className="font-medium text-foreground group-hover:text-primary transition-colors">{s.name}</div>
                                                    <div className="text-xs text-muted-foreground">{s.duration} mins</div>
                                                </div>
                                                <div className="font-semibold text-foreground">₹{s.price}</div>
                                            </div>
                                        ))}
                                    </div>

                                    <Separator />

                                    {date && time ? (
                                        <div className="bg-primary/5 border border-primary/10 p-3 rounded-lg flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-white dark:bg-zinc-800 p-2 rounded-md shadow-sm">
                                                    <span className="block text-center text-xs font-bold uppercase text-primary leading-none">{format(date, 'MMM')}</span>
                                                    <span className="block text-center text-lg font-bold text-foreground leading-none">{format(date, 'd')}</span>
                                                </div>
                                                <div>
                                                    <div className="font-medium text-foreground">{format(date, 'EEEE')}</div>
                                                    <div className="text-xs text-muted-foreground">at {time}</div>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="icon" onClick={() => setStep(2)} className="h-8 w-8 opacity-50 hover:opacity-100">
                                                <Settings className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="bg-gray-50 dark:bg-zinc-800/50 p-3 rounded-lg flex items-center gap-3 opacity-60">
                                            <div className="w-10 h-10 rounded-md bg-gray-200 dark:bg-zinc-700 flex items-center justify-center">
                                                <CalendarIcon className="w-5 h-5 text-muted-foreground" />
                                            </div>
                                            <div className="text-xs">Select a date and time to continue</div>
                                        </div>
                                    )}

                                    <div className="pt-2 space-y-2">
                                        <div className="flex justify-between text-muted-foreground">
                                            <span>Duration</span>
                                            <span>{totalDuration} mins</span>
                                        </div>
                                        <div className="flex justify-between items-end pt-2 border-t border-gray-100 dark:border-gray-800">
                                            <span className="font-bold text-lg">Total</span>
                                            <span className="font-bold text-3xl text-primary">₹{totalPrice}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Help / Info Box */}
                        <div className="bg-blue-500 text-white p-5 rounded-xl shadow-lg shadow-blue-500/20 relative overflow-hidden group cursor-pointer hover:shadow-blue-500/30 transition-all">
                            <div className="absolute top-0 right-0 -mt-2 -mr-2 w-20 h-20 bg-white/20 rounded-full blur-2xl group-hover:bg-white/30 transition-all"></div>
                            <h4 className="font-bold text-lg mb-1 relative z-10">Need Help?</h4>
                            <p className="text-blue-100 text-xs relative z-10 mb-3">Call us directly to book a special package or for group bookings.</p>
                            <div className="flex items-center gap-2 font-bold text-sm bg-white/10 w-fit px-3 py-1.5 rounded-lg border border-white/20">
                                <Plus className="w-4 h-4" /> +1 (555) 012-3456
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Bottom Bar */}
            <div className="fixed bottom-0 left-0 w-full bg-white dark:bg-zinc-900 border-t border-gray-200 dark:border-gray-800 p-4 shadow-2xl lg:hidden z-50 flex items-center justify-between gap-4 safe-area-pb">
                <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">{selectedServices.length} items • {totalDuration} mins</span>
                    <span className="text-xl font-bold text-primary">₹{totalPrice}</span>
                </div>

                {step < 3 ? (
                    <Button
                        onClick={handleNext}
                        disabled={(step === 1 && selectedServices.length === 0) || (step === 2 && (!date || !time))}
                        className="rounded-full shadow-lg"
                    >
                        Next Step <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                ) : (
                    <Button
                        onClick={handleBooking}
                        disabled={isBooking}
                        className="rounded-full shadow-lg"
                    >
                        {isBooking ? "..." : "Confirm"}
                    </Button>
                )}
            </div>
            {/* Spacer for bottom bar */}
            <div className="h-20 lg:hidden"></div>
        </div>
    )
}
