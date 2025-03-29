"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import MagoLogo from "../../../public/images/Magofinal2.png";

export default function AuthenticationPage() {
  const { userId, isLoaded } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && userId) {
      router.push('/');
    }
  }, [userId, router, isLoaded]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bgLight">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (userId) {
    router.push('/');
    return null;
  }

  return (
    <main className="min-h-screen w-full bg-gradient-to-b from-bgLight via-bgLightAlt to-white overflow-hidden relative">
      {/* Elementos decorativos de fondo */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
        <div className="absolute top-[10%] left-[5%] w-96 h-96 bg-primary/5 rounded-full filter blur-3xl opacity-30"></div>
        <div className="absolute bottom-[10%] right-[5%] w-96 h-96 bg-secondary/5 rounded-full filter blur-3xl opacity-30"></div>
        <div className="absolute top-[40%] right-[15%] w-64 h-64 bg-primary/5 rounded-full filter blur-2xl"></div>
        <div className="absolute bottom-[30%] left-[15%] w-64 h-64 bg-secondary/5 rounded-full filter blur-2xl"></div>
      </div>
      
      <div className="container mx-auto px-4 py-12 flex flex-col items-center relative z-10">
        <div className="mb-10 transform transition-all duration-500 hover:scale-105">
          <Image
            src={MagoLogo}
            alt="logo"
            width={180}
            height={250}
            className="object-contain h-[200px] w-[140px] large:h-[250px] large:w-[180px] drop-shadow-lg"
          />
          <h1 className="text-gray-800 text-4xl font-bold text-center mt-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">IOWI</h1>
        </div>

        <div className="w-full max-w-[500px] mx-auto backdrop-blur-md bg-white/80 p-8 rounded-3xl shadow-lg border border-gray-200/30">
          <div className="bg-gray-50 backdrop-blur-sm text-gray-800 flex h-16 large:h-[80px] p-2 items-center rounded-2xl large:rounded-3xl font-maven text-[22px] large:text-[26px] shadow-inner">
            <button
              onClick={() => router.push('/sign-up')}
              className="w-full h-full flex justify-center items-center font-light opacity-80 cursor-pointer rounded-[14px]
                transition-all duration-300 hover:opacity-100 hover:bg-primary hover:text-white hover:shadow-md"
            >
              Registrarme
            </button>
            <button
              onClick={() => router.push('/sign-in')}
              className="w-full h-full flex justify-center items-center font-semibold cursor-pointer border-2 border-primary text-primary
                transition-all duration-300 hover:bg-primary hover:text-white rounded-[14px] shadow-sm hover:shadow-lg"
            >
              Ingresar
            </button>
          </div>
          <p className="text-gray-500 text-center mt-6 text-sm">
            Inicia sesión o regístrate para acceder a todas las funcionalidades
          </p>
        </div>
      </div>
    </main>
  );
}
