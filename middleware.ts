import { NextRequest, NextResponse } from 'next/server';

// Define protected and public routes
const protectedRoutes = ['/dashboard', '/home', '/orders', '/customers', '/incidences', '/stock-planning', '/users', '/configs']; // Routes that require authentication
const adminRoutes = ['/dashboard/users', '/users', '/stock-planning']; // Routes that only admins can access
const publicRoutes = ['/login', '/signup', '/']; // Public routes

// Middleware to handle authentication and role-based authorization
export default async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Fetch the session from NextAuth API
  const response = await fetch(`${req.nextUrl.origin}/api/auth/session`, {
    headers: {
      cookie: req.headers.get('cookie') || ''
    }
  });
  const session = await response.json();

  // Check if the current route is a public route
  const isPublicRoute = publicRoutes.includes(path);

  // If the user does not have a session and is trying to access a protected route, redirect to /login
  if (!session?.user && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', req.nextUrl));
  }

  // If the user has a session and is on a public route (login or signup), redirect to /home
  if (session?.user && isPublicRoute) {
    return NextResponse.redirect(new URL('/home', req.nextUrl));
  }

  // If the route is for admins only and the user is not an admin, redirect to /home
  const isAdminRoute = adminRoutes.some(route => path.startsWith(route));
  if (isAdminRoute && session?.user?.role !== 'admin') {
    return NextResponse.redirect(new URL('/home', req.nextUrl));
  }

  // Allow the user to proceed if they are authenticated or if the route is public
  return NextResponse.next();
}

// Matcher configuration
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'], // Routes where middleware should apply, excluding static assets
};
