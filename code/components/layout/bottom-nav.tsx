"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { 
    Home, 
    Calendar, 
    Users, 
    Scissors, 
    Settings, 
    User, 
    Heart, 
    Store, 
    LogIn 
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
    label: string;
    href: string;
    icon: any;
};

export function BottomNav() {
    const pathname = usePathname();
    const [userRole, setUserRole] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const u = localStorage.getItem("user");
        if (u && u !== "undefined") {
            try {
                const parsedUser = JSON.parse(u);
                setUserRole(parsedUser.role);
            } catch (e) {
                console.error("Invalid user data in BottomNav");
            }
        }
    }, []);

    // Also listen for changes to local storage if user logs in/out in the same session
    useEffect(() => {
        const handleStorageChange = () => {
             const u = localStorage.getItem("user");
             if (u && u !== "undefined") {
                 try {
                     const parsedUser = JSON.parse(u);
                     setUserRole(parsedUser.role);
                 } catch (e) {
                     setUserRole(null);
                 }
             } else {
                 setUserRole(null);
             }
        };
        window.addEventListener("storage", handleStorageChange);
        return () => window.removeEventListener("storage", handleStorageChange);
    }, []);

    if (!mounted) return null;

    let items: NavItem[] = [];

    // Define tab sets based on role
    if (userRole === "OWNER") {
        items = [
            { label: "Home", href: "/dashboard", icon: Home },
            { label: "Calendar", href: "/dashboard/appointments", icon: Calendar },
            { label: "Clients", href: "/dashboard/clients", icon: Users },
            { label: "Services", href: "/dashboard/services", icon: Scissors },
            { label: "Settings", href: "/dashboard/onboarding", icon: Settings },
        ];
    } else if (userRole === "STAFF") {
        items = [
            { label: "Home", href: "/staff/dashboard", icon: Home },
            { label: "Calendar", href: "/staff/calendar", icon: Calendar },
            { label: "Clients", href: "/staff/clients", icon: Users },
            { label: "Profile", href: "/staff/profile", icon: User },
        ];
    } else if (userRole === "CLIENT") {
        items = [
            { label: "Home", href: "/client/dashboard", icon: Home },
            { label: "Book", href: "/salons", icon: Store },
            { label: "Memberships", href: "/client/memberships", icon: Heart },
            { label: "Settings", href: "/client/settings", icon: Settings },
        ];
    } else if (userRole === "ADMIN" || userRole === "SUPER_ADMIN") {
        return null; // Don't show mobile nav for admins
    } else {
        // Public
        items = [
            { label: "Home", href: "/", icon: Home },
            { label: "Salons", href: "/salons", icon: Store },
            { label: "Sign In", href: "/auth/login", icon: LogIn },
        ];
    }

    // Hide if we're on a deep booking page that shouldn't show public nav
    // For now, let's keep it visible on public pages, except maybe if it conflicts with something else
    // But the design says it's global. Let's just render it.

    return (
        <div className="fixed bottom-0 inset-x-0 z-50 lg:hidden glass border-t border-black/5 dark:border-white/5 pb-safe pb-4">
            <nav className="flex items-center justify-around h-16 px-2">
                {items.map((item) => {
                    const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                    const Icon = item.icon;
                    return (
                        <Link 
                            key={item.href} 
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center w-full h-full space-y-1 transition-all active:scale-95",
                                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <div className="relative flex items-center justify-center h-7 w-7">
                                <Icon className={cn("w-5 h-5 transition-transform", isActive && "scale-110")} />
                                {isActive && (
                                    <span className="absolute -bottom-2 w-1 h-1 rounded-full bg-primary" />
                                )}
                            </div>
                            <span className={cn("text-[10px] font-medium transition-colors", isActive && "font-bold")}>
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
