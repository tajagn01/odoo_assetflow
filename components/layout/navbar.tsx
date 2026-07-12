"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { NotificationBell } from "@/features/notifications/components/NotificationBell";
import { Menu, User as UserIcon, LogOut, Settings as SettingsIcon, HelpCircle } from "lucide-react";
import { useSidebarStore } from "@/store/use-sidebar-store";
import { cn } from "@/lib/utils";

interface NavbarProps {
  user: any;
}

export default function Navbar({ user }: NavbarProps) {
  const { toggle } = useSidebarStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="flex h-16 w-full items-center justify-between border-b border-zinc-200 bg-white px-4 md:px-6 select-none z-30 relative">
      {/* Mobile Toggle & Logo */}
      <div className="flex items-center space-x-3">
        <button
          onClick={toggle}
          className="flex md:hidden h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950 focus:outline-none transition-colors cursor-pointer"
          aria-label="Toggle Menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <span className="text-lg font-black text-zinc-950 md:hidden tracking-wider">
          ASSET<span className="text-zinc-500 font-medium">FLOW</span>
        </span>
      </div>

      {/* Right Actions */}
      <div className="flex items-center space-x-4 ml-auto">
        {/* Dynamic Notification Bell Indicator */}
        <NotificationBell />

        {/* User Dropdown Container */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center space-x-3 border-l border-zinc-200 pl-4 h-9 cursor-pointer focus:outline-none"
          >
            <div className="flex flex-col text-right hidden sm:block">
              <span className="text-xs font-bold text-zinc-900 leading-none">{user?.name || "System User"}</span>
              <span className="text-[10px] font-semibold text-zinc-400 mt-1 uppercase tracking-wider">
                {user?.role?.replace("_", " ") || "Guest"}
              </span>
            </div>

            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200 shadow-sm hover:border-zinc-300 overflow-hidden shrink-0">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <UserIcon className="h-4 w-4" />
              )}
            </div>
          </button>

          {/* Interactive Dropdown Card */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl border border-zinc-200 bg-white p-2 shadow-lg animate-in fade-in zoom-in-95 duration-100 z-50">
              <div className="px-3 py-2 text-xs">
                <span className="font-bold text-zinc-950 block">{user?.name}</span>
                <span className="text-[10px] text-zinc-400 block mt-0.5 truncate">{user?.email}</span>
                <span className="inline-block mt-2 px-2 py-0.5 rounded bg-zinc-100 text-[8px] font-black text-zinc-800 uppercase tracking-wider border border-zinc-200">
                  {user?.role?.replace("_", " ")}
                </span>
              </div>
              
              <div className="h-px bg-zinc-100 my-1.5" />

              <Link
                href="/dashboard/profile"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-semibold text-zinc-700 hover:bg-zinc-50 hover:text-zinc-950 transition-colors"
              >
                <UserIcon className="h-4 w-4 text-zinc-400" />
                <span>My Profile</span>
              </Link>

              <Link
                href="/dashboard/settings"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-semibold text-zinc-700 hover:bg-zinc-50 hover:text-zinc-950 transition-colors"
              >
                <SettingsIcon className="h-4 w-4 text-zinc-400" />
                <span>Account Settings</span>
              </Link>

              <button
                type="button"
                onClick={() => {
                  setDropdownOpen(false);
                  alert("AssetFlow Documentation Center is available in the resource directory. Please check AGENT.md guidelines.");
                }}
                className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-semibold text-zinc-700 hover:bg-zinc-50 hover:text-zinc-950 transition-colors text-left cursor-pointer"
              >
                <HelpCircle className="h-4 w-4 text-zinc-400" />
                <span>Help & Guides</span>
              </button>

              <div className="h-px bg-zinc-100 my-1.5" />

              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-bold text-red-600 hover:bg-red-50 transition-colors text-left cursor-pointer"
              >
                <LogOut className="h-4 w-4 text-red-500" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
