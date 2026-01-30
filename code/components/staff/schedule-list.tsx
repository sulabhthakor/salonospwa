"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, XCircle, Clock, User, Phone } from "lucide-react";
import { format } from "date-fns";
import { updateAppointmentStatus } from "@/actions/staff-portal";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface ScheduleListProps {
    appointments: any[];
}

export function ScheduleList({ appointments }: ScheduleListProps) {
    const router = useRouter();

    const handleStatusUpdate = async (id: number, status: "COMPLETED" | "CANCELLED") => {
        const res = await updateAppointmentStatus(id, status);
        if (res.success) {
            toast.success(`Appointment marked as ${status.toLowerCase()}`);
            router.refresh();
        } else {
            toast.error(res.error || "Failed to update status");
        }
    };

    if (appointments.length === 0) {
        return (
            <div className="text-center py-20 bg-muted/20 rounded-xl border border-dashed">
                <p className="text-muted-foreground">No appointments scheduled for this day.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {appointments.map((app) => (
                <Card key={app.id} className="overflow-hidden border-l-4 border-l-primary hover:shadow-md transition-all">
                    <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                        {/* Time & Details */}
                        <div className="flex gap-4">
                            <div className="flex flex-col items-center justify-center bg-muted/30 px-4 py-2 rounded-lg min-w-[5rem]">
                                <span className="text-lg font-bold text-primary">
                                    {format(new Date(app.startTime), "h:mm a")}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    {app.service.duration} min
                                </span>
                            </div>

                            <div>
                                <h3 className="font-bold text-lg">{app.client?.name || "Unknown Client"}</h3>
                                <div className="text-sm text-muted-foreground flex items-center gap-2 mb-1">
                                    <span className="font-medium text-foreground">{app.service.name}</span>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                    {app.client?.phone && (
                                        <div className="flex items-center gap-1">
                                            <Phone className="w-3 h-3" />
                                            {app.client.phone}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Actions / Status */}
                        <div className="w-full sm:w-auto flex items-center justify-end gap-2">
                            {app.status === "SCHEDULED" ? (
                                <>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-destructive border-destructive/20 hover:bg-destructive/10"
                                        onClick={() => handleStatusUpdate(app.id, "CANCELLED")}
                                    >
                                        <XCircle className="w-4 h-4 mr-1" />
                                        Cancel
                                    </Button>
                                    <Button
                                        size="sm"
                                        className="bg-green-600 hover:bg-green-700"
                                        onClick={() => handleStatusUpdate(app.id, "COMPLETED")}
                                    >
                                        <CheckCircle className="w-4 h-4 mr-1" />
                                        Complete
                                    </Button>
                                </>
                            ) : (
                                <Badge variant="secondary" className={`
                                    ${app.status === 'COMPLETED' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : ''}
                                    ${app.status === 'CANCELLED' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : ''}
                                `}>
                                    {app.status}
                                </Badge>
                            )}
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
