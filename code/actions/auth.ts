'use server'

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { z } from 'zod';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret';

const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().min(1),
    role: z.enum(['CLIENT', 'STAFF', 'ADMIN', 'OWNER']).optional().default('CLIENT'),
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});

export async function register(prevState: any, formData: FormData) {
    const data = Object.fromEntries(formData.entries());
    console.log('Registering user:', data.email);

    try {
        const validated = registerSchema.parse(data);

        const existing = await prisma.user.findUnique({
            where: { email: validated.email },
        });

        if (existing) {
            return { error: 'User already exists' };
        }

        const hashedPassword = await bcrypt.hash(validated.password, 10);

        const user = await prisma.user.create({
            data: {
                email: validated.email,
                name: validated.name,
                password: hashedPassword,
                role: validated.role as any,
            },
        });

        // Create session (login immediately)
        await createSession(user);

        return { success: true, user: { id: user.id, email: user.email, name: user.name, role: user.role } };
    } catch (error) {
        console.error('Registration error:', error);
        if (error instanceof z.ZodError) {
            return { error: error.errors[0].message };
        }
        return { error: 'Something went wrong during registration' };
    }
}

export async function login(prevState: any, formData: FormData) {
    const data = Object.fromEntries(formData.entries());

    try {
        const validated = loginSchema.parse(data);

        const user = await prisma.user.findUnique({
            where: { email: validated.email },
        });

        if (!user || !(await bcrypt.compare(validated.password, user.password))) {
            return { error: 'Invalid credentials' };
        }

        await createSession(user);

        return { success: true, user: { id: user.id, email: user.email, name: user.name, role: user.role } };
    } catch (error) {
        console.error('Login error:', error);
        return { error: 'Something went wrong during login' };
    }
}

export async function logout() {
    const cookieStore = await cookies();
    cookieStore.delete('session_token');
    return { success: true };
}

async function createSession(user: any) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    const cookieStore = await cookies();
    cookieStore.set('session_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
    });
}

export async function getSession() {
    const cookieStore = await cookies();
    const token = cookieStore.get('session_token')?.value;

    if (!token) return null;

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        return decoded;
    } catch (error) {
        return null;
    }
}
