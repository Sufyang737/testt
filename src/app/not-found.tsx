import Image from "next/image";
import Link from "next/link";
import React from "react";

export default function Page() {
  return (
    <main className=" mx-4 relative overflow-hidden">
      <div
        className="absolute w-[587px] h-[566px] large:w-[1000px] large:left-[83px] -top-12 large:top-[18px] large:h-[1051px] bg-cover bg-center z-10"
        style={{
          backgroundImage: `url('/images/profile/image.png')`,
          backgroundRepeat: "no-repeat",
        }}
      ></div>
      <div className="flex flex-col gap-y-4 gap-x-24 large:flex-row justify-center items-center h-screen w-full relative z-50">
        <Image
          src={"/images/monograma-clostech-logo7x7.png"}
          alt="logo"
          width={255}
          height={369}
          className="object-contain h-[200px] w-[140px] large:h-[369px] large:w-[255px]"
        />
        <div className="flex flex-col gap-y-2">
          <h2 className="text-txtWhite text-2xl text-center large:text-4xl large:text-left">
            Error 404
          </h2>
          <p className="text-txtWhite text-lg text-center large:text-xl large:text-left">
            No pudimos encontrar lo que estabas buscando
          </p>
          <Link
            href={"/"}
            className="text-btnSkyDef text-lg text-center py-2 large:text-xl large:text-left"
          >
            Volver a la Home
          </Link>
        </div>
      </div>
    </main>
  );
};