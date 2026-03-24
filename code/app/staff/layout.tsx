"use client";

import Link from "next/link";
import { UserNav } from "@/components/user-nav";
import { Briefcase } from "lucide-react";
import { BottomNav } from "@/components/layout/bottom-nav";

export default function StaffLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-gray-50/50 dark:bg-black/90">
            {/* Background Gradients */}
            <div className="fixed inset-0 -z-10 h-full w-full bg-white dark:bg-black [background:radial-gradient(125%_125%_at_50%_10%,#fff_40%,#22c55e_100%)] dark:[background:radial-gradient(125%_125%_at_50%_10%,#000_40%,#22c55e_100%)] opacity-20"></div>

            <header className="sticky top-0 z-50 w-full glass">
                <div className="container flex h-16 items-center justify-between mx-auto px-4">
                    <Link href="/staff/dashboard" className="flex items-center gap-2 font-bold text-xl text-primary">
                        <Briefcase className="w-6 h-6" />
                        SalonOS <span className="text-xs font-normal bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full ml-1">Staff</span>
                    </Link>
                    <div className="flex items-center gap-4">
                        <UserNav />
                    </div>
                </div>
            </header>
            <main className="container mx-auto py-6 px-4 animate-fade-in pb-20 lg:pb-0">
                {children}
            </main>
            <BottomNav />
        </div>
    );
}
