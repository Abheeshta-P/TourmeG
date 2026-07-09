export const SERVER_URL =
  import.meta.env.VITE_SERVER_URL !== undefined ? import.meta.env.VITE_SERVER_URL : "http://localhost:8080";

export const API_ENDPOINTS = {
  CALCULATE_ROUTE: `${SERVER_URL}/api/route/calculate`,
};
