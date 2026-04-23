// src/app/layout.tsx
import React from "react";
import Navbar from "./components/nav/Navbar";
import "./css/globals.css";
import { ReactNode } from "react";
import Footer from "./components/footer/Footer";
import AuthProvider from "../providers/AuthProvider";
import PusherProvider from "../providers/PusherProvider";
import UserProvider from "../providers/UserProvider";
import { Toaster } from 'react-hot-toast';
import ScrollToTop from "./components/utils/ScrollToTop";

export const metadata = {
  title: "COSCI Hub",
  description: "ระบบจับคู่นักศึกษาและอาจารย์กับฟรีแลนซ์",
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="th">
      <body>
        <AuthProvider>
          <UserProvider>
            <PusherProvider>
              <ScrollToTop />
              <Toaster position="top-center" />
              <Navbar />
              <div className="mt-20 w-full">
                {children}
              </div>
              <Footer/>
            </PusherProvider>
          </UserProvider>
        </AuthProvider>
      </body>
    </html>
  );
}