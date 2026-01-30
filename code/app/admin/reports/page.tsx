"use client";

import Link from "next/link";
import { getAnalytics } from "@/actions/reports";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import { DollarSign, TrendingUp, Users, ArrowLeft } from "lucide-react";

export default function ReportsPage() {
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function load() {
            const res = await getAnalytics();
            if (res.success) {
                setData(res.data);
            } else {
                toast.error("Failed to load analytics");
            }
            setIsLoading(false);
        }
        load();
    }, []);

    if (isLoading) return <div className="p-8 text-center">Loading analytics...</div>;
    if (!data) return <div className="p-8 text-center text-red-500">Error loading data.</div>;

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
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Analytics & Reports</h1>
                    <p className="text-muted-foreground mt-1">Track platform performance.</p>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card className="bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Revenue</CardTitle>
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                            <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">₹{data.totalRevenue.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">Platform earnings</p>
                    </CardContent>
                </Card>
                <Card className="bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Appointments</CardTitle>
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                            <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">{data.totalAppointments}</div>
                        <p className="text-xs text-muted-foreground">Completed bookings</p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Grid */}
            <div className="grid gap-4 md:grid-cols-2">

                {/* Revenue Chart */}
                <Card className="col-span-2 lg:col-span-1">
                    <CardHeader>
                        <CardTitle>Revenue (Last 30 Days)</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data.revenueChartData}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                <XAxis
                                    dataKey="date"
                                    tickFormatter={(str) => {
                                        const date = new Date(str);
                                        return `${date.getDate()}/${date.getMonth() + 1}`;
                                    }}
                                    fontSize={12}
                                />
                                <YAxis fontSize={12} tickFormatter={(value) => `$${value}`} />
                                <Tooltip
                                    contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                                    formatter={(value: any) => [`$${value}`, "Revenue"]}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="amount"
                                    stroke="#0d9488"
                                    strokeWidth={3}
                                    dot={false}
                                    activeDot={{ r: 6 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Top Services Chart */}
                <Card className="col-span-2 lg:col-span-1">
                    <CardHeader>
                        <CardTitle>Top Services</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.topServices} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" opacity={0.3} horizontal={false} />
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    width={100}
                                    tick={{ fontSize: 12 }}
                                />
                                <Tooltip cursor={{ fill: 'transparent' }} />
                                <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
