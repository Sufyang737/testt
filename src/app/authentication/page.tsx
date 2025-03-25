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
      <div className="min-h-screen flex items-center justify-center bg-bgCoal">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-prinFuchsia"></div>
      </div>
    );
  }

  if (userId) {
    router.push('/');
    return null;
  }

  return (
    <main className="min-h-screen w-full bg-bgCoal">
      <div className="container mx-auto px-4 py-8 flex flex-col items-center">
        <div className="mb-8">
          <Image
            src={MagoLogo}
            alt="logo"
            width={170}
            height={243}
            className="object-contain h-[200px] w-[140px] large:h-[243] large:w-[170]"
          />
          <h1 className="text-white text-4xl font-bold text-center mt-6">IOWI</h1>
        </div>

        <div className="w-full max-w-[500px] mx-auto">
          <div className="gray-shadow bg-[#121212] text-white flex h-14 large:h-[80px] p-2 items-center rounded-2xl large:rounded-3xl font-maven text-[22px] large:text-[26px]">
            <button
              onClick={() => router.push('/sign-up')}
              className="w-full h-full flex justify-center items-center font-light opacity-70 cursor-pointer rounded-[14px]
                transition-all duration-150 hover:opacity-100 hover:bg-prinFuchsia"
            >
              Registrarme
            </button>
            <button
              onClick={() => router.push('/sign-in')}
              className="w-full h-full flex justify-center items-center font-semibold cursor-pointer border-2 border-prinFuchsia 
                transition-all duration-150 hover:bg-prinFuchsia rounded-[14px]"
            >
              Ingresar
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
