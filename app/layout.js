import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/header";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${inter.className}`}>
          {/*Header*/}
          <Header />

          <main className="pt-24 min-h-screen">{children}</main>
          <Toaster richColors />

          {/*footer */}

          <footer className="bg-blue-50 py-8 mt-10">
            <div className="container mx-auto px-4 text-center">
              <p>Made with 🦥 by Dinesh R</p>
            </div>
          </footer>
        </body>
      </html>
    </ClerkProvider>
  );
}
