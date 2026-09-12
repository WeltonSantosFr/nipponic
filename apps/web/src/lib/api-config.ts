export const DEFAULT_LOCAL_API_URL = "http://localhost:3001";
export const DEFAULT_PROD_API_URL = "https://nipponic.onrender.com";

export function getApiUrl(): string {
  return (
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.API_URL ||
    (process.env.NODE_ENV === "production"
      ? DEFAULT_PROD_API_URL
      : DEFAULT_LOCAL_API_URL)
  );
}

export const API_URL = getApiUrl();
