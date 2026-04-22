// src/app/layout.tsx
import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import "./globals.css";

// ← Removed Inter from next/font
// Font is now loaded via @import in globals.css

export const metadata: Metadata = {
  title: {
    default: "SocietyOS",
    template: "%s — SocietyOS",
  },
  description: "Premium housing society management platform for India.",
  keywords: ["housing society", "RWA", "management"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange={false}
        >
          {children}
          <Toaster
            position="bottom-center"
            toastOptions={{
              duration: 3500,
              style: {
                background: "rgba(44,44,46,0.95)",
                backdropFilter: "blur(20px)",
                color: "#fff",
                borderRadius: "14px",
                fontSize: "13px",
                fontWeight: "500",
                padding: "12px 16px",
                boxShadow:
                  "0 8px 32px rgba(0,0,0,0.2), 0 0 0 0.5px rgba(255,255,255,0.08)",
                letterSpacing: "-0.01em",
                border: "0.5px solid rgba(255,255,255,0.08)",
              },
              success: {
                iconTheme: {
                  primary: "#34c759",
                  secondary: "#fff",
                },
              },
              error: {
                iconTheme: {
                  primary: "#ff3b30",
                  secondary: "#fff",
                },
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
