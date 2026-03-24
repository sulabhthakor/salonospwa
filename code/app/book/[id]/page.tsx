"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Check, ChevronLeft, ChevronRight, Clock, Calendar as CalendarIcon, Store, Scissors, Settings, Plus, User, CreditCard } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { getSalonById } from "@/actions/salons"

import { createAppointment } from "@/actions/appointments"
import { createPaymentIntent } from "@/actions/payments"

import { loadStripe } from "@stripe/stripe-js"
import { Elements } from "@stripe/react-stripe-js"
import { CheckoutForm } from "@/components/booking/checkout-form"
import { AddOnSelector } from "@/components/booking/addon-selector"
import { GroupSizeSelector } from "@/components/booking/group-size-selector"
import { getAvailableSlots } from "@/actions/availability"
import { SiteHeader } from "@/components/site-header"

// Initialize Stripe outside component
const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder';
const stripePromise = loadStripe(stripeKey);

if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    console.warn("Stripe Publishable Key is missing. Payments will not work.");
}

// Types
type Service = {
    id: number
    name: string
    category?: string
    duration: number
    price: number
    description?: string
}

type AddOn = {
    id: number
    name: string
    price: number
    durationChange: number
    applicableServices?: { serviceId: number }[]
}

export default function BookingPage() {
    const router = useRouter()
    const params = useParams()
    const searchParams = useSearchParams()
    const salonId = params.id ? parseInt(params.id as string) : null

    // State
    const [step, setStep] = useState(1)
    const [services, setServices] = useState<Service[]>([])
    const [staffMembers, setStaffMembers] = useState<{ id: string, name: string | null, role: string }[]>([])
    const [loading, setLoading] = useState(true)
    const [salonName, setSalonName] = useState<string>("")

    // Selection State
    const [selectedServices, setSelectedServices] = useState<Service[]>([])
    const [selectedAddOns, setSelectedAddOns] = useState<AddOn[]>([])
    const [guests, setGuests] = useState(1)
    const [selectedStaff, setSelectedStaff] = useState<string | null>(null) // null = 'Any Professional'
    const [date, setDate] = useState<Date | undefined>(new Date())
    const [time, setTime] = useState<string | null>(null)
    const [isBooking, setIsBooking] = useState(false)
    const [clientSecret, setClientSecret] = useState<string | null>(null)
    const [availableSlots, setAvailableSlots] = useState<{ time: string, available: boolean }[]>([])
    const [slotsLoading, setSlotsLoading] = useState(false)

    // Derived State
    const addOnDuration = selectedAddOns.reduce((acc, a) => acc + a.durationChange, 0)
    const addOnPrice = selectedAddOns.reduce((acc, a) => acc + a.price, 0)
    const totalDuration = selectedServices.reduce((acc, s) => acc + s.duration, 0) + addOnDuration
    const totalPrice = (selectedServices.reduce((acc, s) => acc + s.price, 0) + addOnPrice) * guests

    useEffect(() => {
        if (!salonId || isNaN(salonId)) {
            toast.error("Invalid salon ID")
            setLoading(false)
            return
        }

        getSalonById(salonId)
            .then((res) => {
                if (res.success && res.data) {
                    setServices(res.data.services.map(s => ({
                        id: s.id,
                        name: s.name,
                        category: s.category || "General",
                        duration: s.duration,
                        price: s.price,
                        // description: s.description -- Field not in DB yet
                    })))

                    setStaffMembers(res.data.tenantUsers
                        .filter(u => u.role !== 'CLIENT')
                        .map(u => ({
                            id: u.id,
                            name: u.name,
                            role: u.role
                        }))
                    )

                    setSalonName(res.data.name)
                } else {
                    toast.error("Failed to load salon details")
                }
            })
            .catch(err => {
                console.error(err)
                toast.error("Error loading salon details")
            })
            .finally(() => setLoading(false))
    }, [salonId])

    useEffect(() => {
        if (date && selectedServices.length > 0) {
            setSlotsLoading(true)
            getAvailableSlots({
                serviceIds: selectedServices.map(s => s.id),
                addOnIds: selectedServices.map(s => {
                    // Find add-ons applicable to this service
                    return selectedAddOns
                        .filter(a => a.applicableServices?.some(as => as.serviceId === s.id))
                        .map(a => a.id)
                }),
                date: date,
                staffId: selectedStaff || undefined,
                guests: guests
            }).then(res => {
                if (res.slots) {
                    setAvailableSlots(res.slots)
                } else {
                    setAvailableSlots([])
                }
            }).finally(() => setSlotsLoading(false))
        } else {
            setAvailableSlots([])
        }
    }, [date, selectedServices, selectedStaff, guests, selectedAddOns])

    // Pre-select service from URL
    useEffect(() => {
        const serviceIdParam = searchParams.get('serviceId')
        if (serviceIdParam && services.length > 0) {
            const serviceId = parseInt(serviceIdParam)
            if (!isNaN(serviceId)) {
                const serviceToSelect = services.find(s => s.id === serviceId)
                if (serviceToSelect) {
                    // Check if already selected to avoid infinite loop or duplicates if strict mode
                    setSelectedServices(prev => {
                        if (prev.some(s => s.id === serviceToSelect.id)) return prev
                        return [...prev, serviceToSelect]
                    })
                }
            }
        }
    }, [searchParams, services])

    // Payment Method State
    const [paymentMethod, setPaymentMethod] = useState<'online' | 'venue'>('online')

    const handleNext = () => {
        if (step === 4 && paymentMethod === 'venue') {
            handleBooking()
        } else {
            setStep(s => s + 1)
        }
    }
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

    const handleBooking = async (paymentIntentId?: string) => {
        if (selectedServices.length === 0 || !date || !time) return

        // If we are on Review Step (4) and choosing online payment, initiate Payment Step (5)
        if (step === 4 && paymentMethod === 'online' && !paymentIntentId) {
            // Check if paymentIntentId is a string, because onClick defaults to Event object
            // Logic moved to handleNext
            setLoading(true)
            const res = await createPaymentIntent(totalPrice)
            setLoading(false)
            if (res.clientSecret) {
                setClientSecret(res.clientSecret)
                setStep(5)
            } else {
                toast.error("Payment Error", { description: "Could not initiate payment." })
            }
            return
        }

        setIsBooking(true)
        try {
            // Format DateTime
            const dateStr = format(date, 'yyyy-MM-dd')
            const dateTime = new Date(`${dateStr}T${time}`)

            const res = await createAppointment({
                serviceIds: selectedServices.map(s => s.id),
                addOnIds: selectedServices.map(s => {
                    // Find add-ons applicable to this service
                    return selectedAddOns
                        .filter(a => a.applicableServices?.some(as => as.serviceId === s.id))
                        .map(a => a.id)
                }),
                startTime: dateTime.toISOString(),
                staffId: selectedStaff || undefined,
                paymentIntentId: typeof paymentIntentId === 'string' ? paymentIntentId : undefined
            })

            if (res.error) {
                if (res.error === 'Unauthorized') {
                    toast.error("Login Required", {
                        description: "Please sign in to book an appointment.",
                        action: {
                            label: "Login",
                            onClick: () => router.push(`/auth/login?redirect=/book/${salonId}`)
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
        } catch (err: unknown) {
            console.error(err)
            toast.error("Booking Failed", {
                description: "An unexpected error occurred."
            })
        } finally {
            setIsBooking(false)
        }
    }

    // Category State
    const [activeCategory, setActiveCategory] = useState<string>("All")

    // Filtered Services
    const categories = ["All", ...Array.from(new Set(services.map(s => s.category || "General")))]
    const filteredServices = activeCategory === "All"
        ? services
        : services.filter(s => (s.category || "General") === activeCategory)

    // Grouping for "All" view
    const groupedServices = filteredServices.reduce((acc, service) => {
        const cat = service.category || "General"
        if (!acc[cat]) acc[cat] = []
        acc[cat].push(service)
        return acc
    }, {} as Record<string, Service[]>)

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>
    }

    if (!salonId || isNaN(salonId)) {
        return <div className="min-h-screen flex items-center justify-center">Invalid Salon ID</div>
    }

    return (
        <div className="min-h-screen bg-gray-50/50 dark:bg-black/90 relative overflow-hidden">
            <SiteHeader />

            <main className="py-8 px-4 sm:px-6 lg:px-8">
                {/* Background Gradients */}
                <div className="fixed inset-0 -z-10 h-full w-full bg-white dark:bg-black [background:radial-gradient(125%_125%_at_50%_10%,#fff_40%,#63e_100%)] dark:[background:radial-gradient(125%_125%_at_50%_10%,#000_40%,#63e_100%)] opacity-20"></div>

                <div className="max-w-7xl mx-auto relative z-10 space-y-8">

                    {/* Header & Steps */}
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 animate-fade-in">
                        <div className="text-center md:text-left">
                            <h1 className="text-3xl font-bold tracking-tight text-foreground">
                                Book Appointment <span className="text-primary block text-lg font-normal mt-1">{salonName}</span>
                            </h1>
                            <p className="text-muted-foreground">Select a service and find a time.</p>
                        </div>

                        {/* Horizontal Steps */}
                        <div className="flex items-center bg-white/40 dark:bg-black/40 backdrop-blur-sm p-2 rounded-full border border-white/10 shadow-sm overflow-x-auto">
                            {['Service', 'Specialist', 'Date & Time', 'Review', paymentMethod === 'online' ? 'Payment' : 'Confirm'].map((label, idx) => {
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
                                        {idx < 4 && <ChevronRight className="w-4 h-4 ml-2 text-muted-foreground/30" />}
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
                                    <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-500">
                                        <div className="border-b border-black/5 dark:border-white/5 pb-4">
                                            <h2 className="text-2xl font-semibold">Select Services</h2>
                                            <p className="text-muted-foreground">Choose from our exclusive treatments.</p>
                                        </div>

                                        <GroupSizeSelector
                                            value={guests}
                                            onChange={setGuests}
                                            className="bg-white dark:bg-zinc-900/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800"
                                        />

                                        {/* Horizontal Category Scroll */}
                                        {!loading && (
                                            <div className="flex items-center gap-3 overflow-x-auto pb-4 pt-2 -mx-2 px-2 custom-scrollbar snap-x">
                                                {categories.map(cat => (
                                                    <button
                                                        key={cat}
                                                        onClick={() => setActiveCategory(cat)}
                                                        className={cn(
                                                            "whitespace-nowrap px-5 py-2 rounded-full text-sm font-semibold transition-all shadow-sm snap-start shrink-0",
                                                            activeCategory === cat
                                                                ? "bg-black text-white dark:bg-white dark:text-black shadow-md ring-2 ring-offset-2 ring-black dark:ring-white dark:ring-offset-zinc-900"
                                                                : "bg-white dark:bg-zinc-800 text-muted-foreground hover:bg-gray-100 dark:hover:bg-zinc-700 border border-gray-200 dark:border-gray-700"
                                                        )}
                                                    >
                                                        {cat}
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {loading ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-gray-100/50 rounded-xl animate-pulse" />)}
                                            </div>
                                        ) : (
                                            Object.entries(groupedServices).map(([category, categoryServices]) => (
                                                <div key={category} className="space-y-3">
                                                    <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                                                        {category}
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

                                        {/* Add-On Selection */}
                                        {selectedServices.length > 0 && (
                                            <div className="pt-6 border-t border-black/5 dark:border-white/5">
                                                <AddOnSelector
                                                    serviceIds={selectedServices.map(s => s.id)}
                                                    selectedAddOns={selectedAddOns}
                                                    onAddOnsChange={setSelectedAddOns}
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Step 2: Staff Selection */}
                                {step === 2 && (
                                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                                        <div className="border-b border-black/5 dark:border-white/5 pb-4">
                                            <h2 className="text-2xl font-semibold">Select Specialist</h2>
                                            <p className="text-muted-foreground">Choose a professional or let us assign the best available.</p>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                            <div
                                                onClick={() => setSelectedStaff(null)}
                                                className={cn(
                                                    "cursor-pointer rounded-xl border p-4 flex items-center gap-4 transition-all hover:bg-gray-50 dark:hover:bg-zinc-800",
                                                    selectedStaff === null ? "border-primary ring-1 ring-primary bg-primary/5" : "border-gray-200 dark:border-gray-800"
                                                )}
                                            >
                                                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                                    <Store className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold">Any Professional</h3>
                                                    <p className="text-xs text-muted-foreground">Maximum availability</p>
                                                </div>
                                                {selectedStaff === null && <Check className="ml-auto w-5 h-5 text-primary" />}
                                            </div>

                                            {staffMembers.map(staff => (
                                                <div
                                                    key={staff.id}
                                                    onClick={() => setSelectedStaff(staff.id)}
                                                    className={cn(
                                                        "cursor-pointer rounded-xl border p-4 flex items-center gap-4 transition-all hover:bg-gray-50 dark:hover:bg-zinc-800",
                                                        selectedStaff === staff.id ? "border-primary ring-1 ring-primary bg-primary/5" : "border-gray-200 dark:border-gray-800"
                                                    )}
                                                >
                                                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                                                        <User className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold">{staff.name}</h3>
                                                        <p className="text-xs text-muted-foreground">{staff.role}</p>
                                                    </div>
                                                    {selectedStaff === staff.id && <Check className="ml-auto w-5 h-5 text-primary" />}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Step 3: Date & Time */}
                                {step === 3 && (
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
                                                        disabled={(date) => {
                                                            const today = new Date();
                                                            today.setHours(0, 0, 0, 0);
                                                            return date < today || date < new Date("1900-01-01");
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-medium mb-4 flex items-center justify-between">
                                                    <span className="flex items-center gap-2"><Clock className="w-4 h-4 text-primary" /> Available Slots</span>
                                                    {date && <span className="text-sm text-muted-foreground">{format(date, 'EEEE, d MMMM')}</span>}
                                                </h3>
                                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                                                    {slotsLoading ? (
                                                        <div className="col-span-full py-8 text-center text-muted-foreground animate-pulse">
                                                            Checking availability...
                                                        </div>
                                                    ) : availableSlots.length === 0 ? (
                                                        <div className="col-span-full py-8 text-center text-muted-foreground">
                                                            No slots available for this date.
                                                        </div>
                                                    ) : (
                                                        availableSlots.map(slot => (
                                                            <Button
                                                                key={slot.time}
                                                                variant={time === slot.time ? "default" : "outline"}
                                                                onClick={() => setTime(slot.time)}
                                                                disabled={!slot.available}
                                                                className={cn(
                                                                    "w-full transition-all",
                                                                    time === slot.time ? "bg-primary text-primary-foreground shadow-md scale-105" : "bg-white dark:bg-zinc-900 border-gray-200 dark:border-gray-800 hover:border-primary hover:bg-gray-50 dark:hover:bg-zinc-800 text-foreground",
                                                                    !slot.available && "opacity-50 cursor-not-allowed bg-gray-100 hover:bg-gray-100 dark:bg-zinc-800"
                                                                )}
                                                            >
                                                                {slot.time}
                                                            </Button>
                                                        ))
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Step 4: Review & Payment Selection */}
                                {step === 4 && selectedServices.length > 0 && (
                                    <div className="max-w-xl mx-auto w-full space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 py-6">
                                        <div className="text-center space-y-2">
                                            <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                                                <CalendarIcon className="w-10 h-10" />
                                            </div>
                                            <h2 className="text-3xl font-bold">Ready to Book?</h2>
                                            <p className="text-muted-foreground text-lg">Select a payment method to confirm.</p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div
                                                onClick={() => setPaymentMethod('online')}
                                                className={cn(
                                                    "cursor-pointer rounded-xl border p-4 flex flex-col items-center gap-3 transition-all hover:bg-gray-50 dark:hover:bg-zinc-800 text-center",
                                                    paymentMethod === 'online' ? "border-primary ring-1 ring-primary bg-primary/5" : "border-gray-200 dark:border-gray-800"
                                                )}
                                            >
                                                <CreditCard className="w-8 h-8 text-primary" />
                                                <div className="font-bold">Pay Online</div>
                                                <div className="text-xs text-muted-foreground">Secure payment via Stripe</div>
                                            </div>
                                            <div
                                                onClick={() => setPaymentMethod('venue')}
                                                className={cn(
                                                    "cursor-pointer rounded-xl border p-4 flex flex-col items-center gap-3 transition-all hover:bg-gray-50 dark:hover:bg-zinc-800 text-center",
                                                    paymentMethod === 'venue' ? "border-primary ring-1 ring-primary bg-primary/5" : "border-gray-200 dark:border-gray-800"
                                                )}
                                            >
                                                <Store className="w-8 h-8 text-primary" />
                                                <div className="font-bold">Pay at Venue</div>
                                                <div className="text-xs text-muted-foreground">Pay after service at location</div>
                                            </div>
                                        </div>

                                        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-4 text-sm text-blue-800 dark:text-blue-300">
                                            <p className="flex gap-2">
                                                <Store className="w-4 h-4 mt-0.5 shrink-0" />
                                                <span>
                                                    Booking for <strong>{salonName}</strong>.
                                                    You will receive a confirmation email shortly after booking.
                                                    Please arrive 10 minutes early.
                                                </span>
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Step 5: Payment (Only if Online) */}
                                {step === 5 && clientSecret && (
                                    <div className="max-w-xl mx-auto w-full space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 py-6">
                                        <div className="text-center space-y-2 mb-6">
                                            <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                                                <CreditCard className="w-8 h-8" />
                                            </div>
                                            <h2 className="text-2xl font-bold">Secure Payment</h2>
                                            <p className="text-muted-foreground">Complete your booking by paying securely.</p>
                                        </div>

                                        <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
                                            <CheckoutForm amount={totalPrice} onSuccess={(pid) => handleBooking(pid)} />
                                        </Elements>
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

                                    {step < 4 ? (
                                        <Button
                                            onClick={handleNext}
                                            disabled={
                                                (step === 1 && selectedServices.length === 0) ||
                                                (step === 3 && (!date || !time))
                                            }
                                            className="rounded-full px-8 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all font-semibold"
                                        >
                                            Next Step
                                            <ChevronRight className="w-4 h-4 ml-2" />
                                        </Button>
                                    ) : (
                                        step === 4 && paymentMethod === 'venue' ? (
                                            <Button onClick={() => handleBooking()} disabled={isBooking} size="lg" className="rounded-full px-10 shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all font-bold text-lg animate-pulse">
                                                {isBooking ? "Booking..." : "Confirm Booking"}
                                            </Button>
                                        ) : step === 4 ? (
                                            <Button onClick={handleNext} size="lg" className="rounded-full px-10 shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all font-bold text-lg">
                                                Proceed to Payment
                                            </Button>
                                        ) : (
                                            /* Hidden because CheckoutForm handles submit, but keeping just in case */
                                            <div />
                                        )
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Summary Widget */}
                        <div className="hidden lg:block lg:col-span-4 space-y-6 lg:sticky lg:top-24">
                            <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xl text-sm space-y-6 animate-fade-in ring-1 ring-black/5 relative overflow-hidden">
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
                                                <Button variant="ghost" size="icon" onClick={() => setStep(3)} className="h-8 w-8 opacity-50 hover:opacity-100">
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
                <div className="fixed bottom-0 left-0 w-full bg-white dark:bg-zinc-900 border-t border-gray-200 dark:border-gray-800 p-4 shadow-2xl lg:hidden z-40 flex items-center justify-between gap-4 pb-safe">
                    <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">{selectedServices.length} items • {totalDuration} mins</span>
                        <span className="text-xl font-bold text-primary">₹{totalPrice}</span>
                    </div>

                    {step < 4 ? (
                        <Button
                            onClick={handleNext}
                            disabled={(step === 1 && selectedServices.length === 0) || (step === 3 && (!date || !time))}
                            className="rounded-full shadow-lg"
                        >
                            Next Step <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                    ) : (
                        <Button
                            onClick={() => handleBooking()}
                            disabled={isBooking}
                            className="rounded-full shadow-lg"
                        >
                            {isBooking ? "..." : (step === 4 ? "Proceed" : "Loading...")}
                        </Button>
                    )}
                </div>
                {/* Spacer for bottom bar */}
                <div className="h-20 lg:hidden"></div>
            </main>
        </div>
    )
}
