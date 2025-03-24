import Cookies from "js-cookie";

export function saveStoreId(storeId: number, userId: string) {
  Cookies.set(`store_id_${userId}`, storeId.toString(), {
    secure: true, // Solo se envía en conexiones HTTPS
    sameSite: 'Strict', // Evita acceso desde otros dominios
    expires: 7, // Dura 7 días, ajustable según necesidad
  });
}

export function getStoreId(userId: string): number | null {
  const storeId = Cookies.get(`store_id_${userId}`);
  return storeId ? parseInt(storeId, 10) : null;
}

export function removeStoreId(userId: string) {
  Cookies.remove(`store_id_${userId}`);
}
