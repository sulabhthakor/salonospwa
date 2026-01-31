"use client"

import Link from "next/link"
import { Store } from "lucide-react"
import { UserNav } from "@/components/user-nav"

export function SiteHeader() {
    return (
        <header className="sticky top-0 z-50 w-full glass border-b border-black/5 dark:border-white/5 bg-white/50 dark:bg-black/50 backdrop-blur-md">
            <div className="container flex h-16 items-center justify-between mx-auto px-4">
                <Link href="/" className="flex items-center gap-2 font-bold text-xl text-primary hover:opacity-80 transition-opacity">
                    <Store className="w-6 h-6" />
                    SalonOS
                </Link>
                <nav className="flex items-center gap-6">
                    <div className="hidden md:flex gap-6 text-sm font-medium text-muted-foreground">
                        <Link href="/" className="hover:text-primary transition-colors">Home</Link>
                        <Link href="/salons" className="hover:text-primary transition-colors">Salons</Link>
                    </div>
                    <div className="flex items-center gap-4">
                        <UserNav />
                    </div>
                </nav>
            </div>
        </header>
    )
}
