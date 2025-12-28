"use client"

import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export function UserNav() {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        const u = localStorage.getItem("user")
        if (u && u !== "undefined") {
            try {
                setUser(JSON.parse(u))
            } catch (e) {
                console.error("Invalid user data")
            }
        }
    }, [])

    if (!mounted) return null

    const handleLogout = () => {
        localStorage.removeItem("token")
        localStorage.removeItem("user")
        window.location.href = "/" // Force reload to clear state
    }

    if (!user) {
        return (
            <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={() => router.push("/auth/login")}>Sign In</Button>
                <Button onClick={() => router.push("/auth/register")}>Get Started</Button>
            </div>
        )
    }

    const getInitials = (name: string) => {
        return name?.charAt(0).toUpperCase() || "U"
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src="" alt={user.name} />
                        <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                            {user.email}
                        </p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                    <DropdownMenuItem onClick={() => router.push(user.role?.includes('ADMIN') ? "/admin/dashboard" : "/dashboard")}>
                        Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push("/dashboard/profile")}>
                        My Profile
                    </DropdownMenuItem>
                    {!user.role?.includes('ADMIN') && (
                        <DropdownMenuItem onClick={() => router.push("/dashboard/appointments")}>
                            My Bookings
                        </DropdownMenuItem>
                    )}
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
                    Log out
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
