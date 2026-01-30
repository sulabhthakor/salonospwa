import { getClientAppointments } from "@/actions/client";
import { AppointmentCard } from "@/components/client/appointment-card";
import { Button } from "@/components/ui/button";
import { Link } from "lucide-react";
import { redirect } from "next/navigation";

export default async function ClientDashboardPage() {
    const { success, data: appointments, error } = await getClientAppointments();

    if (!success) {
        // If unauthorized or error, maybe redirect to login? 
        // For now, let's assume middleware handles it, but if we get here with error, show it.
        if (error === "Unauthorized") redirect("/auth/login");
        return <div>Error loading appointments.</div>;
    }

    const safeAppointments = appointments || [];
    const upcoming = safeAppointments.filter(app => new Date(app.startTime) > new Date() && app.status !== 'CANCELLED');
    const past = safeAppointments.filter(app => new Date(app.startTime) <= new Date() || app.status === 'CANCELLED');

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Welcome back!</h1>
                    <p className="text-muted-foreground mt-1">Here's what you have scheduled.</p>
                </div>
                <Button className="rounded-full shadow-lg hover:shadow-xl transition-all" asChild>
                    <a href="/salons">Book New Appointment</a>
                </Button>
            </div>

            <div className="space-y-6">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                    <span className="w-1 h-6 bg-primary rounded-full"></span>
                    Upcoming Appointments
                </h2>

                {upcoming.length > 0 ? (
                    <div className="grid gap-4">
                        {upcoming.map(app => (
                            <AppointmentCard key={app.id} appointment={app} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-muted/20 border border-dashed rounded-xl">
                        <p className="text-muted-foreground mb-4">No upcoming appointments.</p>
                        <Button variant="outline" asChild>
                            <a href="/salons">Find a Salon</a>
                        </Button>
                    </div>
                )}
            </div>

            <div className="space-y-6 pt-6 border-t">
                <h2 className="text-xl font-semibold opacity-80">Past History</h2>
                {past.length > 0 ? (
                    <div className="grid gap-4 opacity-80 hover:opacity-100 transition-opacity">
                        {past.map(app => (
                            <AppointmentCard key={app.id} appointment={app} />
                        ))}
                    </div>
                ) : (
                    <p className="text-muted-foreground text-sm">No past appointments found.</p>
                )}
            </div>
        </div>
    );
}
