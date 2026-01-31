"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Mail, MessageSquare, Send, ArrowLeft } from "lucide-react";

export default function MarketingPage() {
    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            {/* Back + Header */}
            <div className="flex items-center gap-4">
                <Link href="/admin/dashboard">
                    <Button variant="ghost" size="icon" className="rounded-full">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Marketing</h1>
                    <p className="text-muted-foreground mt-1">Engage your clients with campaigns and offers.</p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800">
                    <CardHeader>
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mb-4">
                            <Mail className="w-6 h-6" />
                        </div>
                        <CardTitle>Email Campaign</CardTitle>
                        <CardDescription>Send newsletters and specific offers to your client list.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="bg-muted p-4 rounded-lg text-sm text-muted-foreground">
                                <p className="font-semibold mb-1">Preview:</p>
                                <p>Hello [Client Name], don't miss our summer special...</p>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full gap-2">
                            <Send className="w-4 h-4" /> Create Campaign
                        </Button>
                    </CardFooter>
                </Card>

                <Card className="bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800">
                    <CardHeader>
                        <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mb-4">
                            <MessageSquare className="w-6 h-6" />
                        </div>
                        <CardTitle>SMS Blast</CardTitle>
                        <CardDescription>Reach customers instantly with text message promotions.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div>
                                <Input placeholder="Enter message..." className="bg-white dark:bg-zinc-800" />
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button variant="outline" className="w-full">
                            Coming Soon
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
