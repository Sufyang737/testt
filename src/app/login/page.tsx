"use client";

import { SignIn } from "@clerk/nextjs";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <SignIn 
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "bg-white shadow-lg rounded-lg",
            headerTitle: "text-2xl font-bold text-gray-800",
            headerSubtitle: "text-gray-600",
            socialButtonsBlockButton: "border border-gray-300 hover:bg-gray-50",
            formButtonPrimary: "bg-prinFuchsia hover:bg-prinFuchsia/80",
            footerActionLink: "text-prinFuchsia hover:text-prinFuchsia/80",
          },
        }}
      />
    </div>
  );
}
