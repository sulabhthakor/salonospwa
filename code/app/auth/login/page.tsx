"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { login } from "@/actions/auth"

import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"

const formSchema = z.object({
    email: z.string().email({
        message: "Please enter a valid email address.",
    }),
    password: z.string().min(6, {
        message: "Password must be at least 6 characters.",
    }),
})

export default function LoginPage() {
    const router = useRouter()
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true)
        setError(null)
        try {
            const formData = new FormData()
            formData.append("email", values.email)
            formData.append("password", values.password)

            const result = await login(null, formData)

            if (result?.error) {
                setError(result.error)
                return
            }

            if (result?.success && result.user) {
                // Store user in local storage for client-side access
                localStorage.setItem("user", JSON.stringify(result.user));

                // Redirect based on role
                if (result.user.role === 'SUPER_ADMIN' || result.user.role === 'ADMIN') {
                    router.push("/admin/dashboard")
                } else {
                    router.push("/dashboard")
                }
            } else {
                setError("Login failed")
            }

        } catch (err: any) {
            console.error(err)
            setError("Something went wrong")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex flex-col gap-6 animate-fade-in">
            <div className="flex flex-col items-center text-center">
                <h1 className="text-2xl font-bold">Welcome back</h1>
                <p className="text-balance text-muted-foreground text-sm">
                    Login to your account
                </p>
            </div>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <div className="grid gap-2">
                                <FormLabel>Email</FormLabel>
                                <Input placeholder="m@example.com" {...field} />
                                <FormMessage />
                            </div>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                            <div className="grid gap-2">
                                <div className="flex items-center justify-between">
                                    <FormLabel>Password</FormLabel>
                                    <a href="#" className="text-xs text-muted-foreground hover:text-primary">Forgot?</a>
                                </div>
                                <Input type="password" placeholder="******" {...field} />
                                <FormMessage />
                            </div>
                        )}
                    />
                    {error && <div className="text-sm text-red-500 text-center">{error}</div>}
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? "Signing in..." : "Sign in"}
                    </Button>
                </form>
            </Form>
            <div className="text-center text-sm text-muted-foreground">
                Don&apos;t have an account?{" "}
                <Link href="/auth/register" className="text-primary font-medium hover:underline">
                    Sign up
                </Link>
            </div>
        </div>
    )
}
