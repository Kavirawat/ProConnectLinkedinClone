import axios from "axios";

export const BASE_URL = "https://proconnectlinkedinclone-7ieu.onrender.com";

export const clientServer = axios.create({
  baseURL: BASE_URL,
});

