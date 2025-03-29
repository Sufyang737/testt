"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoaded: isUserLoaded } = useUser();
  const { isAuthenticated } = useAuth();
  const [isChecking, setIsChecking] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Lista de rutas públicas que no necesitan autenticación
  const publicRoutes = ['/sign-in', '/sign-up', '/authentication'];

  useEffect(() => {
    // Revisa si la ruta actual es pública
    const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(`${route}/`));

    // Si es una ruta pública, no redireccionamos
    if (isPublicRoute) {
      setIsChecking(false);
      return;
    }

    // Para todas las demás rutas, verificamos la autenticación
    if (isUserLoaded) {
      if (!user) {
        // Si el usuario no está autenticado con Clerk, redirigir a autenticación
        router.push("/authentication");
      } else {
        // Si hay usuario en Clerk, aceptamos que está autenticado
        // y detenemos el spinner de carga
        // El middleware ya garantiza protección a nivel de servidor
        setIsChecking(false);
      }
    }
  }, [isUserLoaded, user, router, pathname, publicRoutes]);

  // Timeout para evitar el spinner infinito (5 segundos máximo)
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isChecking) {
        console.log("Forzando finalización de carga por timeout");
        setIsChecking(false);
      }
    }, 5000);
    
    return () => clearTimeout(timeout);
  }, [isChecking]);

  // Muestra un estado de carga mientras se verifica la autenticación
  if (isChecking && !publicRoutes.some(route => pathname === route || pathname.startsWith(`${route}/`)) && !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-t-4 border-blue-500 border-solid rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-lg">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  // Si ha pasado la verificación o es una ruta pública, muestra los children
  return <>{children}</>;
} 