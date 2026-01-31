import { getSalons } from "@/actions/salons";
import { SalonCard } from "@/components/salons/salon-card";
import { SalonSearchBar } from "@/components/salons/search-bar";
import { SiteHeader } from "@/components/site-header";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Find Salons & Spas | SalonOS",
    description: "Browse top-rated salons, spas, and barbershops near you.",
};

export default async function SalonsPage({
    searchParams,
}: {
    searchParams?: Promise<{ query?: string }>;
}) {
    // Next.js 15+ searchParams is a Promise
    const resolvedSearchParams = await searchParams;
    const query = resolvedSearchParams?.query || "";
    const { success, data } = await getSalons({ query });
    const salons = success && data ? data : [];

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <SiteHeader />

            <main className="flex-1">
                {/* Hero / Search Section */}
                <div className="bg-muted/30 border-b py-12 md:py-20">
                    <div className="container mx-auto px-4 text-center">
                        <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4 animate-fade-in">
                            Discover Local Beauty & Wellness
                        </h1>
                        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto animate-slide-up">
                            Find and book appointments with the best professionals in your area.
                        </p>
                        <div className="flex justify-center animate-slide-up" style={{ animationDelay: "0.1s" }}>
                            <SalonSearchBar />
                        </div>
                    </div>
                </div>

                {/* Listings */}
                <div className="container mx-auto px-4 py-12">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold">
                            {query ? `Results for "${query}"` : "Featured Salons"}
                        </h2>
                        <span className="text-sm text-muted-foreground">
                            {salons.length} results
                        </span>
                    </div>

                    {salons.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {salons.map((salon) => (
                                <SalonCard
                                    key={salon.id}
                                    id={salon.id}
                                    name={salon.name}
                                    businessName={salon.business.name}
                                    serviceCount={salon._count.services}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-muted/20 rounded-xl border border-dashed">
                            <div className="text-4xl mb-4">🔍</div>
                            <h3 className="text-lg font-medium">No salons found</h3>
                            <p className="text-muted-foreground">Try adjusting your search criteria.</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
