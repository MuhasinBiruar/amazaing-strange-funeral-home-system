import axios from 'axios';

export const API = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_APP_URL}/api/backend`,
  timeout: 3000,
  withCredentials: true,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});
