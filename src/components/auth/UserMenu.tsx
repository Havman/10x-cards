/**
 * UserMenu Component
 * Displays user information and logout button in navigation
 */

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";

interface UserMenuProps {
  user: {
    email: string | undefined;
    id: string;
  };
}

export default function UserMenu({ user }: UserMenuProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Get user initial for avatar
  const userInitial = user.email ? user.email.charAt(0).toUpperCase() : "U";

  // Logout handler with useCallback to prevent unnecessary re-renders
  const handleLogout = useCallback(async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || "Logout failed");
      }

      // Redirect to login page after successful logout
      window.location.href = "/auth/login";
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Logout error:", error);
      alert(error instanceof Error ? error.message : "Failed to logout");
      setIsLoggingOut(false);
    }
  }, [isLoggingOut]);

  return (
    <div className="flex items-center gap-4">
      {/* User Info */}
      <div className="flex items-center gap-3">
        <Avatar className="h-8 w-8 bg-primary text-primary-foreground flex items-center justify-center">
          <span className="text-sm font-semibold">{userInitial}</span>
        </Avatar>
        <div className="hidden sm:block">
          <p className="text-sm font-medium leading-none">{user.email}</p>
        </div>
      </div>

      {/* Logout Button */}
      <Button variant="outline" size="sm" onClick={handleLogout} disabled={isLoggingOut} aria-label="Log out">
        {isLoggingOut ? "Logging out..." : "Logout"}
      </Button>
    </div>
  );
}
