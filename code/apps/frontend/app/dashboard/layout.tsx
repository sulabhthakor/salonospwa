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
        <div className="min-h-screen bg-gray-50/50">
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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
            <main className="container mx-auto py-6">
                {children}
            </main>
        </div>
    )
}
