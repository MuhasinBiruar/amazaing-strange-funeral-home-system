import axios from 'axios';

const TIMEOUT_MX = 6000 as const;

export const API = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: TIMEOUT_MX,
  withCredentials: true,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});
