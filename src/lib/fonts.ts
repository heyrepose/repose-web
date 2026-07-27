import localFont from "next/font/local";
import { Sarina } from "next/font/google";

export const aileron = localFont({
  src: [
    {
      path: "../fonts/Aileron-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../fonts/Aileron-SemiBold.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../fonts/Aileron-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-aileron",
  display: "swap",
  fallback: ["DM Sans", "system-ui", "sans-serif"],
});

export const sarina = Sarina({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-sarina",
  display: "swap",
});
