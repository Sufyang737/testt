"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useClerk } from "@clerk/nextjs";

export default function SSOCallback() {
  const { isLoaded, isSignedIn } = useAuth();
  const { handleRedirectCallback } = useClerk();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;

    // Handle the callback
    handleRedirectCallback({
      afterSignInUrl: "/",
      afterSignUpUrl: "/",
    }).then(() => {
      if (isSignedIn) {
        router.push("/");
      } else {
        router.push("/login");
      }
    });
  }, [isLoaded, isSignedIn, router, handleRedirectCallback]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-prinFuchsia"></div>
    </div>
  );
} 