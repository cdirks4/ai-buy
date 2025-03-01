"use client";

import { usePrivy } from "@privy-io/react-auth";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/Button";
import Image from "next/image";

export function NavBar() {
  const { login, authenticated, user, logout } = usePrivy();
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="glass-panel">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center space-x-8">
            <Link
              href="/"
              className="flex-shrink-0 flex items-center space-x-2"
            >
              <Image
                src="/better-hd.png"
                alt="DeFi Assistant Logo"
                width={50}
                height={50}
              />
              <span className="text-xl font-bold bg-gradient-to-r from-gray-100 to-gray-400 bg-clip-text text-transparent">
                DeFi Assistant
              </span>
            </Link>

            <div className="flex space-x-4">
              <Link
                href="/"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive("/")
                    ? "text-white bg-white/10"
                    : "text-gray-300 hover:text-white hover:bg-white/5"
                }`}
              >
                Home
              </Link>
              <Link
                href="/verify"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive("/verify")
                    ? "text-white bg-white/10"
                    : "text-gray-300 hover:text-white hover:bg-white/5"
                }`}
              >
                Verify
              </Link>
              <Link
                href="/bounties"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive("/bounty")
                    ? "text-white bg-white/10"
                    : "text-gray-300 hover:text-white hover:bg-white/5"
                }`}
              >
                Bounty
              </Link>
              <Link
                href="/deploy"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive("/deploy")
                    ? "text-white bg-white/10"
                    : "text-gray-300 hover:text-white hover:bg-white/5"
                }`}
              >
                Deploy
              </Link>
            </div>
          </div>

          <div>
            {authenticated ? (
              <div className="flex items-center space-x-4">
                <span className="text-gray-400">
                  {user?.email || user?.wallet?.address?.slice(0, 6) + "..."}
                </span>
                <Button onClick={logout} variant="destructive">
                  Logout
                </Button>
              </div>
            ) : (
              <Button onClick={login} variant="default">
                Login
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
