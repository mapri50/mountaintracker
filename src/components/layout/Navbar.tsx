"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Mountain, Plus, LogOut, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function Navbar() {
  const { data: session } = useSession();

  return (
    <nav className="bg-white shadow-lg border-b border-mountain-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link
            href="/"
            className="flex items-center gap-2 text-xl font-bold text-primary-600 hover:text-primary-700 transition-colors"
          >
            <Mountain className="w-8 h-8" />
            <span>MountainTracker</span>
          </Link>

          {session && (
            <div className="flex items-center gap-4">
              <span className="text-sm text-mountain-600">
                Welcome, {session.user.username}
              </span>
              <Link href="/stats">
                <Button size="sm" variant="ghost">
                  <BarChart3 className="w-4 h-4 mr-1" />
                  Stats
                </Button>
              </Link>
              <Link href="/tours/new">
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-1" />
                  New Tour
                </Button>
              </Link>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => signOut({ callbackUrl: "/auth/login" })}
              >
                <LogOut className="w-4 h-4 mr-1" />
                Logout
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
