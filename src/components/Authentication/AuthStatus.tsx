"use client";

import { useUser } from "@clerk/nextjs";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface AuthStatusProps {
  children?: React.ReactNode;
}

// Simplificamos el componente ya que la ruta raíz ahora está protegida
export default function AuthStatus({ children }: AuthStatusProps) {
  const { user, isLoaded } = useUser();
  const { isAuthenticated } = useAuth();
  const [isChecking, setIsChecking] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Si Clerk ha terminado de cargar
    if (isLoaded) {
      // Si no hay usuario en Clerk, redirigir a autenticación
      if (!user) {
        router.push("/authentication");
        return;
      }
      
      // Si hay usuario en Clerk pero no en nuestro contexto,
      // aún así mostramos el contenido y detenemos el spinner
      // El middleware ya garantiza que solo usuarios autenticados lleguen aquí
      setIsChecking(false);
    }
  }, [user, isLoaded, isAuthenticated, router]);

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

  // Si estamos en estado de carga, mostramos un spinner
  if (isChecking && !user) {
    return (
      <div className="flex items-center justify-center py-6">
        <div className="w-8 h-8 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
      </div>
    );
  }

  // Si ha pasado la verificación o hay un usuario (aún si isAuthenticated no es true todavía)
  return <>{children}</>;
} 