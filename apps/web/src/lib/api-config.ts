export const DEFAULT_LOCAL_API_URL = "http://localhost:3001";
export const DEFAULT_PROD_API_URL = "https://nipponic.onrender.com";

export function getApiUrl(): string {
  // On server side (Server Actions, SSR, etc.), prefer internal API_URL (e.g. http://api:3001 in Docker)
  if (typeof window === "undefined") {
    return (
      process.env.API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      (process.env.NODE_ENV === "production"
        ? DEFAULT_PROD_API_URL
        : DEFAULT_LOCAL_API_URL)
    );
  }

  // On client side (browser), prefer NEXT_PUBLIC_API_URL
  return (
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.API_URL ||
    (process.env.NODE_ENV === "production"
      ? DEFAULT_PROD_API_URL
      : DEFAULT_LOCAL_API_URL)
  );
}

export const API_URL = getApiUrl();
