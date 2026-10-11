import type { Metadata } from "next";
import { Shell } from "@/components/shell";
import "@/src/style.css";
import "@/src/refinements.css";
import "./app.css";
export const metadata: Metadata = {
  title: "Groww Path · Your money, your pace",
  description: "Personal financial priorities, goals and learning.",
};
export const dynamic = "force-dynamic";
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
