import {
  credentialsType,
  newPasswordType,
  userLoginResponseType,
  userLoginType,
  // userRegisterResponseType,
  userRegisterType,
} from "@/util/type";
import { api } from "./urlBase";

export const register = async (
  body: userRegisterType,
): Promise<userLoginResponseType> => {
  const responseRegister = await api.post("/auth/register", body, {
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (responseRegister.status !== 201) {
    throw new Error(responseRegister.data.message);
  }

  return responseRegister.data;
};

export const login = async (
  body: userLoginType,
): Promise<userLoginResponseType> => {
  const response = await api.post("/auth/login", body, {
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (response.status !== 200) {
    throw new Error(response.data.message);
  }

  return response.data;
};

export const refreshTokenReq = async (
  refreshToken: string,
): Promise<credentialsType> => {
  const response = await api.post("/auth/refresh-token", undefined, {
    headers: {
      refresh_token: refreshToken,
    },
  });
  if (response.status !== 200) {
  }

  return response.data;
};

export const newPassword = async (
  body: newPasswordType,
  reset: string,
): Promise<any> => {
  const response = await api.post("/auth/new-password", body, {
    headers: {
      "Content-Type": "application/json",
      reset: reset,
    },
  });
  if (response.status !== 200) {
    throw new Error(response.data.message);
  }

  return response.data;
};

// export const recoveryPassword = async (email: string): Promise<any> => {
//   const response = await api.post(
//     "/auth/recovery-password",
//     { email },
//     {
//       headers: {
//         "Content-Type": "application/json",
//       },
//     },
//   );
//   if (response.status !== 200) {
//     throw new Error(response.data.message);
//   }

//   return response.data;
// };
