"use client"

import { UserNav } from "@/components/user-nav";
import Link from "next/link";
import { Store } from "lucide-react";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-gray-50/50 dark:bg-black/90">
            {/* Background Gradients */}
            <div className="fixed inset-0 -z-10 h-full w-full bg-white dark:bg-black [background:radial-gradient(125%_125%_at_50%_10%,#fff_40%,#63e_100%)] dark:[background:radial-gradient(125%_125%_at_50%_10%,#000_40%,#63e_100%)] opacity-20"></div>

            <header className="sticky top-0 z-50 w-full glass">
                <div className="container flex h-16 items-center justify-between mx-auto px-4">
                    <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl text-primary">
                        <Store className="w-6 h-6" />
                        SalonOS
                    </Link>
                    <div className="flex items-center gap-4">
                        <UserNav />
                    </div>
                </div>
            </header>
            <main className="container mx-auto py-6 animate-fade-in">
                {children}
            </main>
        </div>
    )
}
