import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret';

// Helper to verify token using jose (Edge compatible)
async function verifyAuth(token: string) {
    try {
        const verified = await jwtVerify(
            token,
            new TextEncoder().encode(JWT_SECRET)
        );
        return verified.payload as { role: string };
    } catch (err) {
        return null;
    }
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const token = request.cookies.get('session_token')?.value;

    // 1. Define Protected Paths
    const isAdminRoute = pathname.startsWith('/admin');
    const isStaffRoute = pathname.startsWith('/staff');
    const isDashboardRoute = pathname.startsWith('/dashboard');

    // 2. No token check for protected routes
    if ((isAdminRoute || isStaffRoute || isDashboardRoute) && !token) {
        const loginUrl = new URL('/auth/login', request.url);
        loginUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(loginUrl);
    }

    // 3. Role-based Access Control
    if (token) {
        const payload = await verifyAuth(token);

        if (!payload) {
            // Invalid token
            const response = NextResponse.redirect(new URL('/auth/login', request.url));
            response.cookies.delete('session_token');
            return response;
        }

        const role = payload.role;

        // Admin Routes: Require ADMIN, SUPER_ADMIN, or OWNER
        if (isAdminRoute) {
            if (!['ADMIN', 'SUPER_ADMIN', 'OWNER'].includes(role)) {
                // Redirect unauthorized users to their appropriate dashboard
                if (role === 'STAFF') return NextResponse.redirect(new URL('/staff/calendar', request.url));
                return NextResponse.redirect(new URL('/dashboard', request.url));
            }
        }

        // Staff Routes: Require STAFF, OWNER, or ADMIN
        if (isStaffRoute) {
            if (!['STAFF', 'OWNER', 'ADMIN', 'SUPER_ADMIN'].includes(role)) {
                return NextResponse.redirect(new URL('/dashboard', request.url));
            }
        }

        // Dashboard Routes: Generally accessible to logged-in users?
        // Or should we restrict /dashboard to CLIENT only? 
        // For now, let's allow all logged-in users to access /dashboard, 
        // but maybe specialized roles should be redirected to their specific portals if they try to hit the generic one?
        // Current logic: If I am STAFF, and I go to /dashboard, do I see client view? 
        // Let's keep it open for now, assuming /dashboard is "My Account" for everyone.
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/dashboard/:path*',
        '/admin/:path*',
        '/staff/:path*',
    ],
};
