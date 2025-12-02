/**
 * UpdatePasswordForm Component
 * Set new password after reset
 */

import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface UpdatePasswordFormProps {
  token: string;
}

interface FieldErrors {
  password?: string;
  confirmPassword?: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function UpdatePasswordForm({ token }: UpdatePasswordFormProps) {
  // Note: token will be used when backend API is implemented
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  // Password validation (same as RegisterForm)
  const validatePassword = (password: string): string | undefined => {
    if (!password) {
      return "Password is required";
    }
    if (password.length < 8) {
      return "Password must be at least 8 characters";
    }
    if (!/[A-Z]/.test(password)) {
      return "Password must contain at least one uppercase letter";
    }
    if (!/[a-z]/.test(password)) {
      return "Password must contain at least one lowercase letter";
    }
    if (!/[0-9]/.test(password)) {
      return "Password must contain at least one number";
    }
    if (!/[!@#$%^&*]/.test(password)) {
      return "Password must contain at least one special character (!@#$%^&*)";
    }
    return undefined;
  };

  // Confirm password validation
  const validateConfirmPassword = (confirmPassword: string, password: string): string | undefined => {
    if (!confirmPassword) {
      return "Please confirm your password";
    }
    if (confirmPassword !== password) {
      return "Passwords do not match";
    }
    return undefined;
  };

  // Validate all fields
  const validateForm = (): boolean => {
    const errors: FieldErrors = {
      password: validatePassword(password),
      confirmPassword: validateConfirmPassword(confirmPassword, password),
    };

    setFieldErrors(errors);
    return !errors.password && !errors.confirmPassword;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    // Client-side validation
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // TODO: Replace with actual API call when backend is implemented
      // For now, just simulate a delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Placeholder for API call:
      // const response = await fetch("/api/auth/update-password", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ token, password }),
      // });
      //
      // const data = await response.json();
      //
      // if (!response.ok || !data.success) {
      //   throw new Error(data.error?.message || "Failed to update password");
      // }

      // Redirect to login on success
      window.location.href = "/auth/login?message=password-updated";
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Set New Password</CardTitle>
        <CardDescription>Enter your new password below</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Password Field */}
          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <Input
              type="password"
              id="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldErrors.password) {
                  setFieldErrors((prev) => ({ ...prev, password: undefined }));
                }
              }}
              onBlur={() => {
                const passwordError = validatePassword(password);
                if (passwordError) {
                  setFieldErrors((prev) => ({ ...prev, password: passwordError }));
                }
              }}
              placeholder="••••••••"
              autoComplete="new-password"
              required
              aria-invalid={!!fieldErrors.password}
              aria-describedby={fieldErrors.password ? "password-error" : "password-help"}
              disabled={isLoading}
            />
            {fieldErrors.password ? (
              <p id="password-error" className="text-sm text-destructive" role="alert">
                {fieldErrors.password}
              </p>
            ) : (
              <p id="password-help" className="text-xs text-muted-foreground">
                Minimum 8 characters, with uppercase, lowercase, number, and special character (!@#$%^&*)
              </p>
            )}
          </div>

          {/* Confirm Password Field */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (fieldErrors.confirmPassword) {
                  setFieldErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                }
              }}
              onBlur={() => {
                const confirmError = validateConfirmPassword(confirmPassword, password);
                if (confirmError) {
                  setFieldErrors((prev) => ({ ...prev, confirmPassword: confirmError }));
                }
              }}
              placeholder="••••••••"
              autoComplete="new-password"
              required
              aria-invalid={!!fieldErrors.confirmPassword}
              aria-describedby={fieldErrors.confirmPassword ? "confirm-password-error" : undefined}
              disabled={isLoading}
            />
            {fieldErrors.confirmPassword && (
              <p id="confirm-password-error" className="text-sm text-destructive" role="alert">
                {fieldErrors.confirmPassword}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <Button type="submit" disabled={isLoading} className="w-full" size="lg">
            {isLoading ? (
              <>
                <span className="mr-2">⏳</span>
                Updating Password...
              </>
            ) : (
              "Update Password"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
