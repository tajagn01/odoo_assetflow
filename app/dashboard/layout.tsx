import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/layout/sidebar";
import Navbar from "@/components/layout/navbar";
import CommandPalette from "@/components/layout/CommandPalette";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen w-full bg-zinc-50 overflow-hidden font-sans select-none antialiased">
      {/* Sidebar Navigation */}
      <Sidebar role={session.user.role} />

      {/* Main Layout Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header Navigation */}
        <Navbar user={session.user} />

        {/* Scrolling Workspace Area */}
        <main className="flex-1 overflow-y-auto bg-zinc-50 p-4 md:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-[1400px]">
            {children}
          </div>
        </main>
      </div>

      {/* Global Keyboard command palette (⌘+K / Ctrl+K) */}
      <CommandPalette role={session.user.role} />
    </div>
  );
}
