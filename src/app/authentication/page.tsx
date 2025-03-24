"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useAuth, useSignIn } from "@clerk/nextjs";
import { SignUp } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import MagoLogo from "../../../public/images/Magofinal2.png";

export default function AuthenticationPage() {
  const { userId, isLoaded } = useAuth();
  const { signIn } = useSignIn();
  const router = useRouter();
  const [showSignUp, setShowSignUp] = useState(false);

  useEffect(() => {
    console.log("Auth State:", { userId, isLoaded });
    if (isLoaded && userId) {
      router.push('/');
    }
  }, [userId, router, isLoaded]);

  if (!isLoaded) {
    console.log("Loading state...");
    return (
      <div className="min-h-screen flex items-center justify-center bg-bgCoal">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-prinFuchsia"></div>
      </div>
    );
  }

  if (userId) {
    console.log("User is authenticated, redirecting...");
    router.push('/');
    return null;
  }

  if (showSignUp) {
    console.log("Showing SignUp component");
    return (
      <div className="min-h-screen flex items-center justify-center bg-bgCoal">
        <SignUp
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "bg-[#121212] shadow-lg rounded-lg",
              headerTitle: "text-2xl font-bold text-white",
              headerSubtitle: "text-gray-400",
              socialButtonsBlockButton: "border border-gray-700 hover:bg-gray-800",
              formButtonPrimary: "bg-prinFuchsia hover:bg-prinFuchsia/80",
              footerActionLink: "text-prinFuchsia hover:text-prinFuchsia/80",
            },
          }}
          routing="path"
          path="/register"
          signInUrl="/login"
          forceRedirectUrl="/select-plan"
        />
      </div>
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://main.d2z0tkc25c5d9y.amplifyapp.com';
  const afterSignInUrl = process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL || '/';
  const afterSignUpUrl = process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL || '/select-plan';
  
  const signInRedirectUrl = `${baseUrl}${afterSignInUrl}`;
  const signUpRedirectUrl = `${baseUrl}${afterSignUpUrl}`;

  const handleSignIn = async () => {
    try {
      console.log("Starting sign in process...");
      const clerkSignInUrl = `https://welcome-goshawk-83.accounts.dev/sign-in?redirect_url=${encodeURIComponent(signInRedirectUrl)}`;
      window.location.href = clerkSignInUrl;
    } catch (error) {
      console.error("Error during sign in:", error);
    }
  };

  const handleSignUp = () => {
    console.log("handleSignUp clicked, setting showSignUp to true");
    setShowSignUp(true);
  };

  return (
    <main className="min-h-screen w-screen py-4 large:py-40 flex flex-col items-center bg-bgCoal">
      <div className="flex flex-col items-center justify-center w-full h-full mx-auto mt-24">
        <Image
          src={MagoLogo}
          alt="logo"
          width={170}
          height={243}
          className="object-contain h-[200px] w-[140px] large:h-[243] large:w-[170]"
        />
        <h1 className="text-white text-4xl font-bold mt-10">IOWI</h1>
        <div className="gray-shadow bg-[#121212] text-white flex h-14 w-[326px] large:h-[80px] large:w-[500px] p-2 items-center rounded-2xl large:rounded-3xl mt-20 font-maven text-[22px] large:text-[26px]">
          <button
            onClick={handleSignUp}
            className="w-full h-full flex justify-center items-center font-light opacity-70 cursor-pointer rounded-[14px]
              transition-all duration-150 hover:opacity-100 hover:bg-prinFuchsia"
          >
            Registrarme
          </button>
          <button
            onClick={handleSignIn}
            className="w-full h-full flex justify-center items-center font-semibold cursor-pointer border-2 border-prinFuchsia 
              transition-all duration-150 hover:bg-prinFuchsia rounded-[14px]"
          >
            Ingresar
          </button>
        </div>
      </div>
    </main>
  );
}
