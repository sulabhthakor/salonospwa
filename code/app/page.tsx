"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Store } from "lucide-react";
import { useRouter } from "next/navigation";
import { UserNav } from "@/components/user-nav";

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background">
      {/* Modern Header */}
      <header className="sticky top-0 z-50 w-full glass">
        <div className="container flex h-16 items-center justify-between mx-auto px-4">
          <div className="flex items-center gap-2 font-bold text-xl text-primary">
            <Store className="w-6 h-6" />
            SalonOS
          </div>
          <nav className="flex items-center gap-6">
            <div className="hidden md:flex gap-6 text-sm font-medium text-muted-foreground">
              <a href="#" className="hover:text-primary transition-colors">Features</a>
              <a href="#" className="hover:text-primary transition-colors">Pricing</a>
              <a href="#" className="hover:text-primary transition-colors">For Business</a>
            </div>
            <div className="flex items-center gap-4">
              <UserNav />
            </div>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main>
        <div className="relative isolate pt-14 dark:bg-slate-900 overflow-hidden">
          <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
            <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-primary to-[#9089fc] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" style={{ clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)' }}></div>
          </div>

          <div className="py-24 sm:py-32 lg:pb-40">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
              <div className="mx-auto max-w-2xl text-center animate-fade-in">
                <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl mb-6">
                  Book your next <span className="text-gradient">glow up</span> today.
                </h1>
                <p className="mt-6 text-lg leading-8 text-muted-foreground animate-slide-up">
                  Discover top-rated salons, spas, and barbershops near you. Book appointments instantly with real-time confirmation.
                </p>
                <div className="mt-10 flex items-center justify-center gap-x-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                  <Button size="lg" className="h-12 px-8 text-lg rounded-full shadow-lg hover:shadow-xl transition-all" onClick={() => router.push('/book')}>
                    Book an Appointment
                  </Button>
                  <Button variant="outline" size="lg" className="h-12 px-8 text-lg rounded-full glass-hover" onClick={() => router.push('/auth/register')}>
                    List your Business
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
