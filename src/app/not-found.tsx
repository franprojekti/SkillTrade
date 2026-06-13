import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "404 — Page Not Found",
};

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center relative overflow-hidden">
      <div
        className="absolute bottom-0 left-0 right-0 h-[60vh] pointer-events-none"
        style={{
          background: "linear-gradient(to top, rgba(34,197,94,0.20) 0%, rgba(34,197,94,0.07) 45%, transparent 100%)",
        }}
      />
      <h1 className="text-6xl font-extrabold text-foreground mb-3">404</h1>
      <h2 className="text-xl font-semibold text-foreground mb-8">Page not found</h2>
      <Link href="/" className={buttonVariants()}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Home
      </Link>
    </div>
  );
}
