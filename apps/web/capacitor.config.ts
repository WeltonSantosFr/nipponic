import type { CapacitorConfig } from "@capacitor/cli";

const serverUrl =
  process.env.CAPACITOR_SERVER_URL || "https://nipponic-web.vercel.app";

const config: CapacitorConfig = {
  appId: "com.nipponic.app",
  appName: "Nipponic",
  webDir: "public",
  server: {
    url: serverUrl,
    cleartext: true,
    androidScheme: "https",
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;
