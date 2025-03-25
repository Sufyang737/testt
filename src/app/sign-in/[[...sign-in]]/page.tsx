"use client";

import { SignIn } from "@clerk/nextjs";
import Image from "next/image";
import MagoLogo from "../../../../public/images/Magofinal2.png";

export default function Page() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-bgCoal">
      <div className="mb-8">
        <Image
          src={MagoLogo}
          alt="logo"
          width={170}
          height={243}
          className="object-contain h-[140px] w-[100px] large:h-[243] large:w-[170]"
        />
        <h1 className="text-white text-3xl font-bold text-center mt-4">IOWI</h1>
      </div>
      <SignIn
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "bg-[#121212] shadow-lg rounded-lg p-8",
            headerTitle: "text-2xl font-bold text-white",
            headerSubtitle: "text-gray-400",
            socialButtonsBlockButton: "border border-gray-700 hover:bg-gray-800 text-white",
            formButtonPrimary: "bg-prinFuchsia hover:bg-prinFuchsia/80 text-white",
            footerActionLink: "text-prinFuchsia hover:text-prinFuchsia/80",
            formFieldInput: "bg-gray-800 border-gray-700 text-white",
            formFieldLabel: "text-gray-300",
            dividerLine: "bg-gray-700",
            dividerText: "text-gray-400",
            formFieldInputShowPasswordButton: "text-gray-400",
            identityPreviewText: "text-white",
            identityPreviewEditButton: "text-prinFuchsia hover:text-prinFuchsia/80",
            formFieldSuccess: "text-green-500",
            formFieldError: "text-red-500",
            formFieldInputGroup: "bg-gray-800 border-gray-700"
          }
        }}
        redirectUrl="/"
        afterSignInUrl="/"
        signUpUrl="/sign-up"
      />
    </main>
  );
} 