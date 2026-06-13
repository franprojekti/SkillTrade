import { AuthShell } from "@/components/auth/auth-shell";

export const metadata = {
  robots: { index: false, follow: false },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {/* Bottom green gradient — wide, very soft */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[60vh] pointer-events-none"
        style={{
          background: "linear-gradient(to top, rgba(34,197,94,0.20) 0%, rgba(34,197,94,0.07) 45%, transparent 100%)",
        }}
      />
      <AuthShell>{children}</AuthShell>
    </div>
  );
}
