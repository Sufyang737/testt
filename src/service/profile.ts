import { patchProfileType, userType } from "@/util/type";
import { api } from "./urlBase";

export const getProfileById = async (
  userId: string,
  token: string,
  goToAuth: () => void,
): Promise<userType> => {
  try {
    const response = await api.get(`/api/profile/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error: any) {
    if (error.response && error.response.status === 401) {
      goToAuth();
    } else {
      console.error('Error fetching profile:', error);
    }
    throw error;
  }
};

export const createProfile = async (
  userId: string,
  token: string,
): Promise<any> => {
  const response = await api.post(
    `/profile`,
    {
      user_id: userId,
      gender_id: 2,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (response.status !== 200 && response.status !== 201) {
    throw new Error(response.data.message);
  }

  return response.data;
};

export const updateProfile = async (
  userId: string,
  token: string,
  body: patchProfileType,
): Promise<any> => {
  const response = await api.patch(`/profile/${userId}`, body, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (response.status !== 200) {
    throw new Error(response.data.message);
  }

  return response.data;
};

export const updateImageProfile = async (
  userId: string,
  token: string,
  body: FormData,
): Promise<any> => {
  const response = await api.patch(`/image/profile/${userId}`, body, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data",
    },
  });
  if (response.status !== 200) {
    throw new Error(response.data.message);
  }

  return response.data;
};
