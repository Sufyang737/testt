import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import type { NextRequest } from "next/server";

// Rutas públicas (no requieren autenticación)
const publicRoutes = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/authentication(.*)',
  '/api/ai(.*)',
  '/api/apikeys/store(.*)',
  '/api/apikeys/validate(.*)',
  '/api/webhook/clerk(.*)'
]);

// Rutas que requieren autenticación explícitamente (incluyendo la ruta principal)
const protectedRoutes = createRouteMatcher([
  '/select-plan(.*)',
  '/whatsapp(.*)',
  '/business-profile(.*)',
  '/dashboard(.*)', // Proteger todas las rutas del dashboard
  '/api(?!/webhook/clerk|/ai|/apikeys/store|/apikeys/validate)(.*)', // Proteger APIs excepto webhook y algunas específicas
]);

export default clerkMiddleware((auth, req: NextRequest) => {
  const path = req.nextUrl.pathname;
  
  // Si la ruta está en la lista de rutas públicas, permitir acceso sin autenticación
  if (publicRoutes(req)) {
    return;
  }
  
  // Si no está en la lista de rutas públicas, requiere autenticación
  auth.protect();
});

export const config = {
  matcher: [
    // Excluir archivos estáticos y rutas internas de Next.js
    "/((?!.+\\.[\\w]+$|_next).*)",
    // Incluir todas las rutas API
    "/(api|trpc)(.*)",
  ],
}; 