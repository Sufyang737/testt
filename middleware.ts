import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import type { NextRequest } from "next/server";

// Rutas públicas (no requieren autenticación)
const publicRoutes = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/authentication(.*)',
  '/api/ai(.*)',
  '/api/apikeys/store(.*)',
  '/api/apikeys/validate(.*)',
  '/api/webhook/clerk(.*)'
]);

export default clerkMiddleware((auth, req: NextRequest) => {
  // Protección de rutas - solo usuarios autenticados pueden acceder a rutas no públicas
  if (!publicRoutes(req)) {
    auth.protect();
  }
});

export const config = {
  matcher: [
    // Excluir archivos estáticos y rutas internas de Next.js
    "/((?!.+\\.[\\w]+$|_next).*)",
    // Incluir todas las rutas API
    "/(api|trpc)(.*)",
  ],
}; 