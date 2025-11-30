"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import {
  Mountain,
  Plus,
  LogOut,
  BarChart3,
  Menu,
  X,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

export function Navbar() {
  const { data: session } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <nav className="bg-white shadow-lg border-b border-mountain-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link
            href="/"
            className="flex items-center gap-2 text-xl font-bold text-primary-600 hover:text-primary-700 transition-colors"
            onClick={closeMobileMenu}
          >
            <Mountain className="w-8 h-8" />
            <span>MountainTracker</span>
          </Link>

          {session && (
            <>
              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center gap-4">
                <span className="text-sm text-mountain-600">
                  Welcome, {session.user.username}
                </span>
                <Link href="/tours/calendar">
                  <Button size="sm" variant="ghost">
                    <Calendar className="w-4 h-4 mr-1" />
                    Calendar
                  </Button>
                </Link>
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

              {/* Mobile Menu Button */}
              <button
                className="md:hidden p-2 rounded-md text-mountain-600 hover:text-mountain-900 hover:bg-mountain-50 transition-colors"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </>
          )}
        </div>

        {/* Mobile Navigation Menu */}
        {session && isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-mountain-200">
            <div className="flex flex-col gap-2">
              <div className="px-3 py-2 text-sm text-mountain-600 font-medium border-b border-mountain-100 mb-2">
                Welcome, {session.user.username}
              </div>
              <Link href="/tours/calendar" onClick={closeMobileMenu}>
                <Button
                  size="sm"
                  variant="ghost"
                  className="w-full justify-start"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Calendar
                </Button>
              </Link>
              <Link href="/stats" onClick={closeMobileMenu}>
                <Button
                  size="sm"
                  variant="ghost"
                  className="w-full justify-start"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Stats
                </Button>
              </Link>
              <Link href="/tours/new" onClick={closeMobileMenu}>
                <Button size="sm" className="w-full justify-start">
                  <Plus className="w-4 h-4 mr-2" />
                  New Tour
                </Button>
              </Link>
              <Button
                size="sm"
                variant="ghost"
                className="w-full justify-start"
                onClick={() => {
                  closeMobileMenu();
                  signOut({ callbackUrl: "/auth/login" });
                }}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
