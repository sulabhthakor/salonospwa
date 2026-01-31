import { prisma } from "@/lib/prisma";
import { getSession } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, User, Calendar, Store } from "lucide-react";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";

async function getSalonDetails(id: string) {
    const session = await getSession();
    if (!session) return null;

    const user = await prisma.user.findUnique({ where: { id: session.sub } });
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) return null;

    const salon = await prisma.business.findUnique({
        where: { id },
        include: {
            owner: { select: { id: true, name: true, email: true } },
            locations: {
                include: {
                    services: true,
                    _count: { select: { appointments: true } }
                }
            }
        }
    });

    return salon;
}

export default async function SalonDetailPage({
    params
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params;
    const salon = await getSalonDetails(id);

    if (!salon) {
        notFound();
    }

    const statusColors = {
        PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
        APPROVED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
        REJECTED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    };

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            {/* Back + Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/admin/salons">
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">{salon.name}</h1>
                        <p className="text-muted-foreground mt-1">{salon.description || "No description provided."}</p>
                    </div>
                </div>
                <Badge className={statusColors[salon.status]}>{salon.status}</Badge>
            </div>

            {/* Owner Info */}
            <Card className="bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <User className="h-5 w-5" /> Owner Information
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    <p><span className="font-medium">Name:</span> {salon.owner.name || "N/A"}</p>
                    <p><span className="font-medium">Email:</span> {salon.owner.email}</p>
                </CardContent>
            </Card>

            {/* Locations */}
            <div className="space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                    <MapPin className="h-5 w-5" /> Locations ({salon.locations.length})
                </h2>
                {salon.locations.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2">
                        {salon.locations.map((loc) => (
                            <Card key={loc.id} className="bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-base">{loc.name}</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                            <Store className="h-4 w-4" /> {loc.services.length} services
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Calendar className="h-4 w-4" /> {loc._count.appointments} bookings
                                        </span>
                                    </div>
                                    {loc.services.length > 0 && (
                                        <div className="flex flex-wrap gap-1">
                                            {loc.services.slice(0, 5).map((s) => (
                                                <Badge key={s.id} variant="secondary" className="text-xs">{s.name}</Badge>
                                            ))}
                                            {loc.services.length > 5 && (
                                                <Badge variant="outline" className="text-xs">+{loc.services.length - 5} more</Badge>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <p className="text-muted-foreground">No locations added yet.</p>
                )}
            </div>
        </div>
    );
}
