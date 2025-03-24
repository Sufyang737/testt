"use client";

import React, { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
// import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function IsLogged () {
  const { user, isLoaded: isUserLoaded } = useUser();
  // const { isAuthenticated } = useAuth();

  const router = useRouter();

	// console.log(isAuthenticated)
  // useEffect(() => {
  //   if (!isAuthenticated) {
  //     // Si el usuario no esta autenticado, lo redirige a la pagina de autenticación
  //     router.push("/authentication");
  //   }
  // }, [isAuthenticated, router]);

  useEffect(() => {
    if (isUserLoaded && !user) {
      // Si el usuario no esta autenticado, lo redirige a la pagina de autenticación
      router.push("/authentication");
    }
  }, [isUserLoaded, user, router]);

  return <></>;
}
