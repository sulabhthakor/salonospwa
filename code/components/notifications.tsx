"use client"

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Bell, Inbox } from "lucide-react"

export function Notifications() {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative w-9 h-9">
                    <Bell className="h-4 w-4" />
                    {/* Notification Badge - uncomment when there are notifications */}
                    {/* <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span> */}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <div className="p-4">
                    <h3 className="font-semibold text-sm mb-4">Notifications</h3>
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                        <Inbox className="h-10 w-10 mb-3 opacity-50" />
                        <p className="text-sm font-medium">No notifications</p>
                        <p className="text-xs">You're all caught up!</p>
                    </div>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
