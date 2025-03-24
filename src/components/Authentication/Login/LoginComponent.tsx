"use client"
import Image from "next/image";
import React, { useState } from "react";
import {
  InputAuth,
  ModalError,
  ModalLoadingLogoClostech,
} from "@/components/ui";
import Link from "next/link";
import { userLoginType } from "@/util/type";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useMutation } from "@tanstack/react-query";
import { login } from "@/service/authentication";

export default function LoginComponent() {
  const router = useRouter();

  const [user, setUser] = useState<userLoginType>({
    email: "",
    password: "",
  });

  const { updateToken, login: loginContext } = useAuth();

  const [isModalOpen, setIsModalOpen] = useState(false);

  const { isPending: isLoading, mutate } = useMutation({
    mutationFn: (post: userLoginType) => login(post),
    onSuccess: (data) => {
      updateToken(
        data.credentials.access_token,
        data.credentials.refresh_token,
      );
      loginContext(data.user, data.credentials.access_token);
      router.push("/");
    },
    onError: () => {
      setIsModalOpen(true);
    },
  });


	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUser((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  };

	const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    user.email = user.email.toLowerCase();
    mutate(user);
  };

  return (
    <div className="flex flex-col items-center justify-center w-full h-full mx-auto mt-28 large:my-auto">
      <Image
        src={"/images/monograma-clostech-logo7x7.png"}
        alt="logo"
        width={170}
        height={243}
        className="object-contain h-[200px] w-[140px] large:h-[243px] large:w-[170px]"
      />
      <Image
        src={"/images/clostech.png"}
        alt="logo"
        width={170}
        height={243}
        className="object-contain h-[200px] w-[140px] large:h-[243px] large:w-[170px]"
      />
      <h2 className="font-maven text-white text-5xl font-bold">Bienvenido a Iowi</h2>
      <p className="text-[13px] font-maven font-thin text-white mt-2 mb-4">
        Inicia sesión para acceder a tu cuenta
      </p>
      <form onSubmit={onSubmit}>
        <div className="flex flex-col gap-y-3 w-[360px] large:w-[600px]">
          <InputAuth
            name="email"
            placeholder="Correo eletrónico"
            type="email"
            value={user.email}
            handleChange={handleChange}
            showError={false}
            autoComplete
          />
          <InputAuth
            name="password"
            placeholder="Contraseña"
            type="password"
            value={user.password}
            handleChange={handleChange}
            showError={false}
          />
        </div>
        <div className="flex flex-col large:flex-row gap-x-4">
          <button
            type="submit"
            className={`w-full mx-auto mt-4 h-14 bg-btnSkyDef btn-shadow
            rounded-2xl text-white font-maven font-bold text-2xl
            ${
              user.email === "" || user.password === ""
                ? "opacity-50 large:hover:bg-btnSkyHov"
                : "large:hover:bg-btnSkyHov"
            }`}
            disabled={user.email === "" || user.password === ""}
          >
            Iniciar Sesión
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              router.push("/authentication");
            }}
            className={`w-full large:-order-1 mx-auto mt-4 h-14 border-2 border-btnSkyDef  
            rounded-2xl text-white font-maven font-bold text-2xl large:hover:bg-btnSkyHov`}
          >
            Atras
          </button>
        </div>
      </form>
      <Link
        href={"/restore-password"}
        className="text-xl font-maven font-medium mt-6 text-secSky underline cursor-pointer"
      >
        Olvidé mi constraseña
      </Link>
      {isModalOpen && (
        <ModalError
          title={"Credenciales invalidas"}
          description={"El email o contraseñas ingresadas son invalidas"}
          onClose={() => setIsModalOpen(false)}
        />
      )}
      {isLoading && <ModalLoadingLogoClostech label="Iniciando Sesión..." />}
    </div>
  );
}
