"use client";
import React, { useState } from "react";
import Image from "next/image";
import { InputAuth } from "@/components/ui";
import {
  userLoginResponseType,
  userRegisterType,
} from "@/util/type";
import { validateEmail, validatePassword } from "@/util/utils";
import Link from "next/link";
// import usersData from "../usersTest.json";
import { ModalError, ModalAlert, ModalLoading } from "@/components/ui";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { register } from "@/service/authentication";

const RegisterForm = () => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserFormData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  };

  const [isModalErrorOpen, setIsModalErrorOpen] = useState(false);
  const [isModalAlertOpen, setIsModalAlertOpen] = useState(false);
  const [titleError, setTitleError] = useState("");
  const [descriptionError, setDescriptionError] = useState("");
  const [userFormData, setUserFormData] = useState<userRegisterType>({
    email: "",
    name: "",
    password: "",
    passwordConfirm: "",
  });

  const { isPending: isLoading, mutate } = useMutation({
    mutationFn: (post: userRegisterType) => register(post),
    onSuccess: (data: userLoginResponseType) => {
      router.push(
        `/login`,
      );
    },
    onError: (error) => {
      setTitleError("Error");
      setDescriptionError(error.message);
      setIsModalErrorOpen(true);
    },
  });
  const router = useRouter();

  const handleCloseModal = () => {
    setIsModalErrorOpen(false);
    setIsModalAlertOpen(false);
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (userFormData.password !== userFormData.passwordConfirm) {
      setTitleError("Las contraseñas no coinciden");
      setDescriptionError("Asegúrese de que las contraseñas coincidan");
      setIsModalErrorOpen(true);
      return;
    }

    delete userFormData.passwordConfirm;

    mutate(userFormData);
  };

  const isButtonDisabled = () => {
    // Validar si todos los campos están llenos y si el correo electrónico y la contraseña son válidos
    return (
      userFormData.name === "" ||
      userFormData.email === "" ||
      userFormData.password === "" ||
      userFormData.passwordConfirm === "" ||
      validateEmail(userFormData.email) === false ||
      validatePassword(userFormData.password) === false ||
      validatePassword(userFormData.passwordConfirm || "") === false
    );
  };

  return (
    <div className="flex flex-col items-center justify-center w-full h-full mx-auto mt-28 large:my-auto">
      <div className="flex flex-col items-center justify-center gap-2">
        <Image
          width={100}
          height={100}
          className="h-20 w-20"
          src={"/images/monograma-clostech-logo7x7.png"}
          alt="Logo"
        />
        <h1 className="text-2xl font-bold text-gray-900">
          Crea tu cuenta Iowi para acceder a contenido exclusivo
        </h1>
      </div>
      <form onSubmit={onSubmit}>
        <div className="flex flex-col gap-y-3 w-[360px] large:w-[600px]">
          <InputAuth
            name="email"
            placeholder="Email"
            type="email"
            value={userFormData.email}
            handleChange={handleChange}
            showError={true}
            autoComplete
          />
          <InputAuth
            name="name"
            placeholder="Empresa"
            type="text"
            value={userFormData.name}
            handleChange={handleChange}
          />
          <InputAuth
            name="password"
            placeholder="Contraseña"
            type="password"
            value={userFormData.password}
            handleChange={handleChange}
            showError={true}
          />
          <InputAuth
            name="passwordConfirm"
            placeholder="Repetir contraseña"
            type="password"
            value={userFormData.passwordConfirm || ""}
            handleChange={handleChange}
            showError={true}
          />
          <div className="flex flex-col large:flex-row gap-x-4">
            <button
              type="submit"
              className={`w-full mx-auto mt-4 h-14 bg-btnFuchsiaDef btn-shadow 
            rounded-2xl text-white font-maven font-bold text-2xl
            ${
              isButtonDisabled()
                ? "opacity-50 large:hover:bg-btnFuchsiaDef"
                : "large:hover:bg-btnFuchsiaHov"
            }`}
              disabled={isButtonDisabled()}
            >
              Crear Cuenta
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                setIsModalAlertOpen(true);
              }}
              className={`w-full large:-order-1 mx-auto mt-4 h-14 border-2 border-btnFuchsiaDef  
            rounded-2xl text-white font-maven font-bold text-2xl large:hover:bg-btnFuchsiaHov`}
            >
              Atras
            </button>
          </div>
        </div>
      </form>
      <Link
        href={"/login"}
        className="text-xl font-maven font-medium mt-6 text-secSky underline cursor-pointer"
      >
        Ya tengo cuenta
      </Link>
      {isModalErrorOpen && (
        <ModalError
          description={descriptionError}
          onClose={handleCloseModal}
          title={titleError}
        />
      )}
      {isModalAlertOpen && (
        <ModalAlert
          onClose={handleCloseModal}
          onAccept={() => {
            router.push("/authentication");
          }}
          title="Volver hacia atras"
          description="¿Estás seguro de que deseas cancelar la creación de tu cuenta?"
        />
      )}

      {isLoading && <ModalLoading />}
    </div>
  );
};

export default RegisterForm;
