import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { JetBrains_Mono } from "next/font/google";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme-provider";
import { cookies } from "next/headers";
import { jwtDecode } from "jwt-decode";
import { AuthProvider, UserPayload } from "@/contexts/AuthContext";
import { NotesProvider } from "@/contexts/NotesContext";
import { FlashCardsProvider } from "@/contexts/FlashCardsContext";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "Nipponic",
  description: "Learn Japanese with ease",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const token = cookieStore.get("nipponic.token")?.value;

  let initialUser: UserPayload | null = null;

  if (token) {
    try {
      initialUser = jwtDecode(token);
    } catch {}
  }

  return (
    <html
      lang="en"
      className={cn("font-mono", jetbrainsMono.variable)}
      suppressHydrationWarning
    >
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <AuthProvider initialUser={initialUser}>
          <NotesProvider>
            <FlashCardsProvider>
              <ThemeProvider
                attribute="class"
                defaultTheme="dark"
                enableSystem={false}
              >
                {children}
              </ThemeProvider>
            </FlashCardsProvider>
          </NotesProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
