import { twMerge } from "tailwind-merge";
import { type ClassValue, clsx } from "clsx";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

export const validateString = (value: unknown, maxLength: number) => {
  if (!value || typeof value !== "string" || value.length > maxLength) {
    return false;
  }
  return true;
};

export const getErrorMessage = (error: unknown): string => {
  let message: string;
  if (error instanceof Error) {
    message = error.message;
  } else if (error && typeof error === "object" && "message" in error) {
    message = String(error.message);
  } else if (error && typeof error === "string") {
    message = error;
  } else {
    message = "Error al procesar la solicitud. Por favor, intenta nuevamente.";
  }
  return message;
};

export const API = process.env.NEXT_PUBLIC_APP_API;
export const API_TIENDANUBE = process.env.NEXT_PUBLIC_APP_API_TIENDANUBE;

export const goToAuth = (router: AppRouterInstance) => {
  router.push("/authentication");
};

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}


export const validateEmail = (email: string): boolean => {
  // Expresión regular para validar el formato de correo electrónico
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

export const validatePassword = (password: string): boolean => {
  // Validación de contraseña: más de 8 caracteres, al menos una mayúscula y tres números
  // const regex = /^(?=.*[A-Z])(?=.*\d.*\d.*\d).{8,}$/;
  // return regex.test(password);
  // Validación de contraseña: más de 8 caracteres
  return password.length >= 8;
};