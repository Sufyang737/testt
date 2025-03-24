import { API, API_TIENDANUBE } from "@/util/utils";
import axios from "axios";

export const api = axios.create({
  baseURL: API,
});

export const apiTiendanube = axios.create({
  baseURL: API_TIENDANUBE,
});


export default api;
