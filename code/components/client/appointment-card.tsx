import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Clock, MapPin, User } from "lucide-react";
import { format } from "date-fns";

interface AppointmentCardProps {
    appointment: any; // Using any for simplicity with complex Prisma include types, but should be typed properly
}

export function AppointmentCard({ appointment }: AppointmentCardProps) {
    const isUpcoming = new Date(appointment.startTime) > new Date();
    const statusColors: Record<string, string> = {
        SCHEDULED: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
        COMPLETED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
        CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    };

    return (
        <Card className="overflow-hidden border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <Badge variant="secondary" className={`${statusColors[appointment.status] || "bg-gray-100"} border-none`}>
                                {appointment.status}
                            </Badge>
                            <span className="text-sm text-muted-foreground font-medium">
                                #{appointment.id}
                            </span>
                        </div>

                        <div>
                            <h3 className="text-xl font-bold">{appointment.service.name}</h3>
                            <div className="text-muted-foreground text-sm flex items-center gap-1 mt-1">
                                <MapPin className="w-3 h-3" />
                                {appointment.location.business.name} - {appointment.location.name}
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-4 text-sm mt-2">
                            <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-full">
                                <Calendar className="w-4 h-4 text-primary" />
                                <span className="font-medium">
                                    {format(new Date(appointment.startTime), "MMM d, yyyy")}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-full">
                                <Clock className="w-4 h-4 text-primary" />
                                <span className="font-medium">
                                    {format(new Date(appointment.startTime), "h:mm a")}
                                </span>
                                <span className="text-muted-foreground ml-1">
                                    ({appointment.duration} min)
                                </span>
                            </div>
                            <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-full">
                                <User className="w-4 h-4 text-primary" />
                                <span>{appointment.staff.name}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-end">
                        <div className="text-right">
                            <div className="text-2xl font-bold mb-2">${appointment.service.price}</div>
                            {isUpcoming && appointment.status === 'SCHEDULED' && (
                                <Button variant="outline" className="w-full md:w-auto text-destructive border-destructive/20 hover:bg-destructive/10">
                                    Cancel
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
