"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { UserNav } from "@/components/user-nav"; // Added Import
import { LayoutDashboard, Store, Users, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()
    const router = useRouter()

    const sidebarItems = [
        {
            title: "Overview",
            href: "/admin/dashboard",
            icon: LayoutDashboard,
        },
        {
            title: "Salons",
            href: "/admin/salons",
            icon: Store,
        },
        {
            title: "Users",
            href: "/admin/users",
            icon: Users,
        },
    ]

    const handleSignOut = () => {
        localStorage.removeItem("token")
        localStorage.removeItem("user")
        router.push("/auth/login")
    }

    return (
        <div className="flex h-screen bg-gray-50/50">
            {/* Sidebar */}
            <div className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col shadow-sm">
                <div className="p-6 border-b border-sidebar-border">
                    <div className="flex items-center gap-2 font-semibold text-sidebar-primary-foreground bg-primary px-3 py-1.5 rounded-lg w-fit">
                        <Store className="w-4 h-4" />
                        <span className="text-white">SalonOS</span>
                    </div>
                </div>
                <nav className="flex-1 p-4 space-y-1">
                    {sidebarItems.map((item) => {
                        const Icon = item.icon
                        const isActive = pathname === item.href
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${isActive
                                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                                    }`}
                            >
                                <Icon className="w-5 h-5" />
                                {item.title}
                            </Link>
                        )
                    })}
                </nav>
                <div className="p-4 border-t border-sidebar-border">
                    <Button
                        variant="ghost"
                        className="w-full justify-start text-muted-foreground hover:text-red-600 hover:bg-red-50"
                        onClick={handleSignOut}
                    >
                        <LogOut className="w-5 h-5 mr-3" />
                        Sign Out
                    </Button>
                </div>
            </div>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto bg-gray-50/50">
                <header className="flex h-16 items-center justify-end border-b bg-background px-6 shadow-sm">
                    <UserNav />
                </header>
                <div className="p-8 max-w-7xl mx-auto space-y-6">
                    {children}
                </div>
            </main>
        </div>
    )
}
