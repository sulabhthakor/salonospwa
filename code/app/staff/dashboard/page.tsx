import { getStaffDailySchedule } from "@/actions/staff-portal";
import { ScheduleList } from "@/components/staff/schedule-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Users, User, Calendar } from "lucide-react";
import Link from "next/link";
import { format, addDays, subDays } from "date-fns";

export default async function StaffDashboardPage({
    searchParams,
}: {
    searchParams?: Promise<{ date?: string }>; // Next.js 15
}) {
    const resolvedParams = await searchParams;
    const dateStr = resolvedParams?.date || new Date().toISOString().split('T')[0];
    const currentDate = new Date(dateStr);

    // Validate date
    if (isNaN(currentDate.getTime())) {
        return <div>Invalid date</div>;
    }

    const { success, data: appointments, error } = await getStaffDailySchedule(dateStr);

    const prevDay = format(subDays(currentDate, 1), 'yyyy-MM-dd');
    const nextDay = format(addDays(currentDate, 1), 'yyyy-MM-dd');
    const isToday = dateStr === new Date().toISOString().split('T')[0];

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">My Schedule</h1>
                    <p className="text-muted-foreground mt-1">Manage your appointments and efficiency.</p>
                </div>

                {/* Date Navigation */}
                <div className="flex items-center bg-white dark:bg-zinc-900 border rounded-lg shadow-sm p-1">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href={`/staff/dashboard?date=${prevDay}`}>
                            <ChevronLeft className="w-4 h-4" />
                        </Link>
                    </Button>
                    <div className="px-4 font-medium min-w-[9rem] text-center">
                        {isToday ? "Today" : format(currentDate, "EEE, MMM d")}
                    </div>
                    <Button variant="ghost" size="icon" asChild>
                        <Link href={`/staff/dashboard?date=${nextDay}`}>
                            <ChevronRight className="w-4 h-4" />
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Total</CardTitle>
                        <div className="p-2 bg-primary/10 rounded-full">
                            <Calendar className="h-4 w-4 text-primary" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">
                            {appointments?.filter((a: any) => a.status === 'SCHEDULED' || a.status === 'COMPLETED').length || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">Appointments</p>
                    </CardContent>
                </Card>
                <Card className="bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Done</CardTitle>
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                            <Calendar className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {appointments?.filter((a: any) => a.status === 'COMPLETED').length || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">Completed</p>
                    </CardContent>
                </Card>
                <Card className="bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Pending</CardTitle>
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                            <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {appointments?.filter((a: any) => a.status === 'SCHEDULED').length || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">Upcoming</p>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-3">
                <Link href="/staff/clients">
                    <Button variant="outline" className="bg-white dark:bg-zinc-900 gap-2">
                        <Users className="w-4 h-4" /> My Clients
                    </Button>
                </Link>
                <Link href="/staff/profile">
                    <Button variant="outline" className="bg-white dark:bg-zinc-900 gap-2">
                        <User className="w-4 h-4" /> My Profile
                    </Button>
                </Link>
            </div>

            {/* Schedule List */}
            <ScheduleList appointments={appointments || []} />
        </div>
    );
}
