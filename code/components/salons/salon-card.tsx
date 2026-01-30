"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Star, Calendar } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface SalonCardProps {
    id: number;
    name: string;
    businessName: string;
    serviceCount: number;
}

export function SalonCard({ id, name, businessName, serviceCount }: SalonCardProps) {
    return (
        <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group border-border/40">
            <div className="relative h-48 w-full bg-muted/50 overflow-hidden">
                {/* Placeholder Image - In real app, this would be location.image */}
                <Image
                    src={`https://images.unsplash.com/photo-1560066984-138dadb4c035?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80`}
                    alt={name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-2 right-2 bg-white/90 dark:bg-black/80 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                    4.9
                </div>
            </div>

            <CardHeader className="p-4">
                <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{businessName}</div>
                <CardTitle className="text-lg font-bold group-hover:text-primary transition-colors">{name}</CardTitle>
            </CardHeader>

            <CardContent className="p-4 pt-0 text-sm text-muted-foreground">
                <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span>Downtown District</span>
                </div>
                <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span>{serviceCount} Services Available</span>
                </div>
            </CardContent>

            <CardFooter className="p-4 pt-2 border-t bg-muted/10">
                <Button asChild className="w-full" variant="secondary">
                    <Link href={`/salons/${id}`}>
                        View Details
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    );
}
