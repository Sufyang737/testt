'use client';

import { SignUp } from "@clerk/nextjs";

export default function RegisterPage() {
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
        afterSignUpUrl="/select-plan"
      />
    </div>
  );
}
