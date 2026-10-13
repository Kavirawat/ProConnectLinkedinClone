import axios from 'axios';

// export const BASE_URL = 'http://localhost:9080';

export const BASE_URL =
  'https://proconnectlinkedinclone-7ieu.onrender.com' ||
  'http://localhost:9080';

export const clientServer = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});
