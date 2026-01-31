import { getSalonById } from "@/actions/salons";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, Star, User } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import Image from "next/image";

export default async function SalonDetailsPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const resolvedParams = await params;
    const salonId = parseInt(resolvedParams.id);

    if (isNaN(salonId)) notFound();

    const { success, data: salon } = await getSalonById(salonId);

    if (!success || !salon) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-background">
            <SiteHeader />

            <main>
                {/* Hero Header */}
                <div className="relative h-[40vh] md:h-[50vh] w-full bg-muted overflow-hidden">
                    <Image
                        src="https://images.unsplash.com/photo-1600948836101-f9ffda59d250?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80"
                        alt={salon.name}
                        fill
                        className="object-cover"
                        priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-end">
                        <div className="container mx-auto px-4 pb-12 text-white">
                            <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                                <div>
                                    <Badge className="bg-primary/90 hover:bg-primary mb-3">Verified Partner</Badge>
                                    <h1 className="text-4xl md:text-5xl font-bold mb-2">{salon.name}</h1>
                                    <div className="flex flex-wrap items-center gap-4 text-sm md:text-base opacity-90">
                                        <div className="flex items-center gap-1">
                                            <MapPin className="w-4 h-4" />
                                            <span>{salon.business.name}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                            <span>4.9 (128 reviews)</span>
                                        </div>
                                    </div>
                                </div>
                                <Button size="lg" className="rounded-full px-8 text-lg font-bold shadow-xl shrink-0" asChild>
                                    <Link href={`/book/${salon.id}`}>
                                        Book Appointment
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="container mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-3 gap-10">

                    {/* Left Column: Services */}
                    <div className="md:col-span-2 space-y-8">
                        <div>
                            <h2 className="text-2xl font-bold mb-6">Service Menu</h2>
                            <div className="space-y-4">
                                {salon.services.length > 0 ? (
                                    salon.services.map((service) => (
                                        <div key={service.id} className="flex justify-between items-center p-4 rounded-xl border hover:border-primary/50 hover:bg-muted/30 transition-colors group">
                                            <div>
                                                <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">{service.name}</h3>
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                                    <Clock className="w-3 h-3" />
                                                    <span>{service.duration} mins</span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-bold text-lg">${service.price}</div>
                                                <Button size="sm" variant="outline" className="mt-1 opacity-0 group-hover:opacity-100 transition-opacity" asChild>
                                                    <Link href={`/book/${salon.id}?serviceId=${service.id}`}>Book</Link>
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center p-8 bg-muted/20 rounded-lg">
                                        No services listed yet.
                                    </div>
                                )}
                            </div>
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold mb-6">Our Specialists</h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {salon.tenantUsers.filter(u => u.role !== 'CLIENT').map((staff) => (
                                    <div key={staff.id} className="p-4 rounded-xl border bg-card text-center hover:shadow-md transition-all">
                                        <div className="w-16 h-16 bg-muted rounded-full mx-auto mb-3 flex items-center justify-center">
                                            <User className="w-8 h-8 text-muted-foreground" />
                                        </div>
                                        <div className="font-medium truncate">{staff.name || 'Staff Member'}</div>
                                        <div className="text-xs text-muted-foreground">{staff.role}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Info sticky */}
                    <div className="relative">
                        <div className="sticky top-24 space-y-6">
                            <div className="p-6 rounded-2xl border bg-muted/10">
                                <h3 className="font-semibold mb-4">Opening Hours</h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Mon - Fri</span>
                                        <span>9:00 AM - 7:00 PM</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Saturday</span>
                                        <span>10:00 AM - 6:00 PM</span>
                                    </div>
                                    <div className="flex justify-between text-destructive">
                                        <span>Sunday</span>
                                        <span>Closed</span>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 rounded-2xl border bg-primary/5 border-primary/20">
                                <h3 className="font-semibold mb-2">Location</h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Running on SalonOS Platform.<br />
                                    {salon.business.name} Head Office
                                </p>
                                <Button variant="outline" className="w-full h-10 gap-2">
                                    <MapPin className="w-4 h-4" /> Get Directions
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
