import { ReactNode } from "react";
import { Navbar } from "@/components/layout/Navbar";

export default function ToursLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="min-h-screen">{children}</main>
    </>
  );
}
