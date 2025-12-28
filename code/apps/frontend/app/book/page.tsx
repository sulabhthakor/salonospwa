"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Check, ChevronLeft, ChevronRight, Clock, Calendar as CalendarIcon, Store } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

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
    const [selectedService, setSelectedService] = useState<Service | null>(null)
    const [date, setDate] = useState<Date | undefined>(new Date())
    const [time, setTime] = useState<string | null>(null)
    const [isBooking, setIsBooking] = useState(false)

    // Fetch Services
    useEffect(() => {
        api.get("/services").then(res => {
            setServices(res.data)
        }).catch(err => {
            console.error(err)
            toast.error("Failed to load services")
        }).finally(() => setLoading(false))
    }, [])

    const handleNext = () => setStep(s => s + 1)
    const handleBack = () => setStep(s => s - 1)

    const handleBooking = async () => {
        if (!selectedService || !date || !time) return

        setIsBooking(true)
        try {
            // Format DateTime
            const dateStr = format(date, 'yyyy-MM-dd')
            const dateTime = new Date(`${dateStr}T${time}`)

            await api.post("/appointments", {
                serviceId: selectedService.id,
                startTime: dateTime.toISOString()
            })

            toast.success("Appointment Booked!", {
                description: "We've sent you a confirmation email."
            })
            router.push("/dashboard/appointments")
        } catch (err) {
            console.error(err)
            toast.error("Booking Failed", {
                description: "Please try again later."
            })
        } finally {
            setIsBooking(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50/50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">

                {/* Header */}
                <div className="mb-10 text-center">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                        Book Appointment
                    </h1>
                    <p className="mt-2 text-lg text-muted-foreground">
                        Select a service and find a time that works for you.
                    </p>
                </div>

                {/* Wizard Component */}
                <div className="bg-background rounded-xl shadow-sm border overflow-hidden flex flex-col md:flex-row min-h-[600px]">

                    {/* Sidebar / Progress */}
                    <div className="w-full md:w-64 bg-slate-50 border-r p-6 flex flex-col gap-6">
                        <div className="flex items-center gap-2 font-bold text-lg text-primary">
                            <Store className="w-5 h-5" />
                            SalonOS
                        </div>

                        <div className="space-y-1">
                            {['Service', 'Date & Time', 'Review'].map((label, idx) => {
                                const stepNum = idx + 1
                                const isActive = step === stepNum
                                const isCompleted = step > stepNum
                                return (
                                    <div key={label} className={cn(
                                        "flex items-center gap-3 p-3 rounded-lg transition-colors text-sm font-medium",
                                        isActive ? "bg-white shadow-sm text-primary" : "text-muted-foreground",
                                        isCompleted && "text-primary/70"
                                    )}>
                                        <div className={cn(
                                            "w-6 h-6 rounded-full flex items-center justify-center text-xs border",
                                            isActive ? "border-primary bg-primary text-primary-foreground" : "border-gray-300",
                                            isCompleted && "border-primary bg-primary/20 text-primary"
                                        )}>
                                            {isCompleted ? <Check className="w-3 h-3" /> : stepNum}
                                        </div>
                                        {label}
                                    </div>
                                )
                            })}
                        </div>

                        {/* Summary Widget */}
                        {selectedService && (
                            <div className="mt-auto bg-white p-4 rounded-lg border shadow-sm text-sm space-y-3">
                                <div className="font-semibold text-foreground border-b pb-2">Booking Summary</div>
                                <div>
                                    <div className="text-muted-foreground text-xs">Service</div>
                                    <div className="font-medium text-primary">{selectedService.name}</div>
                                </div>
                                {date && time && (
                                    <div>
                                        <div className="text-muted-foreground text-xs">Date & Time</div>
                                        <div>{format(date, 'd MMM, yyyy')}</div>
                                        <div>{time}</div>
                                    </div>
                                )}
                                <div className="pt-2 border-t flex justify-between font-bold">
                                    <span>Total</span>
                                    <span>₹{selectedService.price}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Main Content Area */}
                    <div className="flex-1 p-6 md:p-10 flex flex-col">

                        {/* Step 1: Service Selection */}
                        {step === 1 && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div>
                                    <h2 className="text-2xl font-semibold">Select a Service</h2>
                                    <p className="text-muted-foreground">Choose from our list of premium treatments.</p>
                                </div>

                                {loading ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />)}
                                    </div>
                                ) : (
                                    Object.entries(services.reduce((acc, service) => {
                                        const cat = service.category || "General"
                                        if (!acc[cat]) acc[cat] = []
                                        acc[cat].push(service)
                                        return acc
                                    }, {} as Record<string, Service[]>)).map(([category, categoryServices]) => (
                                        <div key={category} className="space-y-3">
                                            <h3 className="text-lg font-semibold text-primary/80 border-b pb-1">{category}</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {categoryServices.map(service => (
                                                    <Card
                                                        key={service.id}
                                                        className={cn(
                                                            "cursor-pointer transition-all hover:border-primary hover:shadow-md",
                                                            selectedService?.id === service.id ? "border-primary ring-1 ring-primary bg-primary/5" : ""
                                                        )}
                                                        onClick={() => setSelectedService(service)}
                                                    >
                                                        <CardContent className="p-5 space-y-2">
                                                            <div className="flex justify-between items-start">
                                                                <h3 className="font-semibold text-lg">{service.name}</h3>
                                                                <Badge variant="secondary" className="font-bold">₹{service.price}</Badge>
                                                            </div>
                                                            <p className="text-sm text-muted-foreground line-clamp-2">
                                                                {service.description || "Professional salon service."}
                                                            </p>
                                                            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
                                                                <Clock className="w-3 h-3" />
                                                                {service.duration} mins
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                ))}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {/* Step 2: Date & Time */}
                        {step === 2 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div>
                                    <h2 className="text-2xl font-semibold">Choose Date & Time</h2>
                                    <p className="text-muted-foreground">Select a convenient slot for your appointment.</p>
                                </div>

                                <div className="flex flex-col lg:flex-row gap-8">
                                    <div className="border rounded-xl p-4 w-fit h-fit">
                                        <Calendar
                                            mode="single"
                                            selected={date}
                                            onSelect={setDate}
                                            className="rounded-md"
                                            disabled={(date) => date < new Date() || date < new Date("1900-01-01")}
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-medium mb-3 flex items-center gap-2">
                                            <Clock className="w-4 h-4 text-primary" />
                                            Available Slots
                                        </h3>
                                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                            {TIME_SLOTS.map(slot => (
                                                <Button
                                                    key={slot}
                                                    variant={time === slot ? "default" : "outline"}
                                                    onClick={() => setTime(slot)}
                                                    className={cn(
                                                        "w-full",
                                                        time === slot ? "bg-primary text-primary-foreground" : "hover:border-primary hover:text-primary"
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
                        {step === 3 && selectedService && (
                            <div className="max-w-lg mx-auto w-full space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="text-center space-y-2">
                                    <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                                        <CalendarIcon className="w-8 h-8" />
                                    </div>
                                    <h2 className="text-2xl font-bold">Confirm Booking</h2>
                                    <p className="text-muted-foreground">Please review your appointment details.</p>
                                </div>

                                <div className="bg-slate-50 p-6 rounded-xl border space-y-4">
                                    <div className="flex justify-between items-center pb-4 border-b">
                                        <div className="text-sm font-medium text-muted-foreground">Service</div>
                                        <div className="font-semibold">{selectedService.name}</div>
                                    </div>
                                    <div className="flex justify-between items-center pb-4 border-b">
                                        <div className="text-sm font-medium text-muted-foreground">Date</div>
                                        <div className="font-semibold flex items-center gap-2">
                                            <CalendarIcon className="w-4 h-4" />
                                            {date ? format(date, 'd MMMM, yyyy') : '-'}
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center pb-4 border-b">
                                        <div className="text-sm font-medium text-muted-foreground">Time</div>
                                        <div className="font-semibold flex items-center gap-2">
                                            <Clock className="w-4 h-4" />
                                            {time}
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center pt-2">
                                        <div className="font-bold text-lg">Total</div>
                                        <div className="font-bold text-2xl text-primary">₹{selectedService.price}</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Navigation Buttons */}
                        <div className="mt-auto pt-8 flex justify-between">
                            <Button
                                variant="ghost"
                                onClick={handleBack}
                                disabled={step === 1}
                                className={step === 1 ? "invisible" : ""}
                            >
                                <ChevronLeft className="w-4 h-4 mr-2" />
                                Back
                            </Button>

                            {step < 3 ? (
                                <Button
                                    onClick={handleNext}
                                    disabled={(step === 1 && !selectedService) || (step === 2 && (!date || !time))}
                                >
                                    Next Step
                                    <ChevronRight className="w-4 h-4 ml-2" />
                                </Button>
                            ) : (
                                <Button onClick={handleBooking} disabled={isBooking} className="min-w-[140px]">
                                    {isBooking ? "Booking..." : "Confirm Booking"}
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
