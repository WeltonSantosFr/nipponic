"use server";
import { cookies } from "next/headers";

export async function saveAuthCookie(token: string) {
    const cookieStore = await cookies()
  cookieStore.set("nipponic.token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
}

export async function removeAuthCookie() {
  cookieStore.delete("nipponic.token");
}
