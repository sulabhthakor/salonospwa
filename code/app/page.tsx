import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar, Sparkles, Star, Store, TrendingUp } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-cyan-500/30">
      <SiteHeader />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden pt-20 pb-32 md:pt-32 md:pb-48">
          {/* Background Elements */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl overflow-hidden -z-10 pointer-events-none">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-400/20 rounded-full blur-3xl animate-blob"></div>
            <div className="absolute top-20 right-1/4 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-32 left-1/2 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-blob animation-delay-4000"></div>
          </div>

          <div className="container px-4 text-center mx-auto relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 animate-fade-in border border-primary/20 backdrop-blur-sm">
              <Sparkles className="w-4 h-4" />
              <span>The Future of Salon Management</span>
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 animate-slide-up" style={{ animationDelay: "0.1s" }}>
              Elevate Your <span className="text-gradient">Salon Experience</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-slide-up" style={{ animationDelay: "0.2s" }}>
              The all-in-one platform for effortless booking, staff management, and business growth.
              Beautifully designed for professionals and clients.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: "0.3s" }}>
              <Button size="lg" className="rounded-full px-8 text-base shadow-lg shadow-primary/25 bg-gradient-brand border-0 hover:opacity-90 transition-all" asChild>
                <Link href="/salons">
                  Find a Salon <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="rounded-full px-8 text-base glass-hover" asChild>
                <Link href="/auth/register?role=OWNER">
                  List Your Business
                </Link>
              </Button>
            </div>

            {/* Mockup / Visual */}
            <div className="mt-16 md:mt-24 relative max-w-5xl mx-auto animate-slide-up" style={{ animationDelay: "0.5s" }}>
              <div className="relative rounded-xl border border-white/20 dark:border-white/10 shadow-2xl overflow-hidden glass-card p-2 md:p-4 rotate-1 hover:rotate-0 transition-all duration-700">
                <div className="aspect-[16/9] bg-muted relative rounded-lg overflow-hidden flex items-center justify-center bg-linear-to-br from-gray-100 to-gray-200 dark:from-zinc-900 dark:to-zinc-800">
                  {/* Placeholder for Product Mockup - using text for now */}
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-muted-foreground uppercase tracking-widest opacity-20">SalonOS Dashboard</h3>
                  </div>
                  {/* 
                          Ideally use generate_image to create a dashboard mockup and place it here.
                          <Image src="/mockup.png" alt="App Mockup" ... />
                        */}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES GRID */}
        <section className="py-24 bg-muted/30 dark:bg-muted/10">
          <div className="container px-4 mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight mb-4">Why Top Salons Choose Us</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                We provide the tools you need to streamline operations and delight your customers.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: Calendar,
                  title: "Smart Scheduling",
                  desc: "Effortless drag-and-drop calendar for staff and real-time online booking for clients."
                },
                {
                  icon: TrendingUp,
                  title: "Growth Analytics",
                  desc: "Deep insights into revenue, staff performance, and retention rates to help you scale."
                },
                {
                  icon: Store,
                  title: "Multi-Location Ready",
                  desc: "Manage one salon or a hundred. Centralized control for franchises and chains."
                }
              ].map((feature, i) => (
                <div key={i} className="glass-card p-8 rounded-2xl hover:translate-y-[-5px] transition-transform duration-300">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-6">
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 relative overflow-hidden">
          <div className="container px-4 mx-auto text-center relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to upgrade your business?</h2>
            <Button size="lg" className="rounded-full px-10 h-12 text-lg bg-gradient-brand shadow-xl shadow-primary/30" asChild>
              <Link href="/auth/register">Get Started Free</Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="py-10 border-t bg-muted/20">
        <div className="container px-4 mx-auto text-center text-muted-foreground text-sm">
          <p>&copy; {new Date().getFullYear()} SalonOS. Built for excellence.</p>
        </div>
      </footer>
    </div>
  );
}
