/**
 * RegisterForm Component
 * Client-side registration form with validation
 */

import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface RegisterFormProps {
  redirectTo?: string;
}

interface FieldErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export default function RegisterForm({ redirectTo = "/dashboard" }: RegisterFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  // Email validation
  const validateEmail = (email: string): string | undefined => {
    if (!email) {
      return "Email is required";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return "Please enter a valid email address";
    }
    return undefined;
  };

  // Password validation
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
      email: validateEmail(email),
      password: validatePassword(password),
      confirmPassword: validateConfirmPassword(confirmPassword, password),
    };

    setFieldErrors(errors);
    return !errors.email && !errors.password && !errors.confirmPassword;
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
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || "Registration failed");
      }

      // If email confirmation is required, show message and redirect to login
      if (data.requiresEmailConfirmation) {
        // Could show a success message here before redirecting
        alert(data.message);
        window.location.href = "/auth/login";
      } else {
        // Auto-login successful, redirect to dashboard
        window.location.href = redirectTo;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Account</CardTitle>
        <CardDescription>Sign up to start creating flashcards with AI</CardDescription>
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

          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email">Email (Username)</Label>
            <Input
              type="email"
              id="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                // Clear field error on change
                if (fieldErrors.email) {
                  setFieldErrors((prev) => ({ ...prev, email: undefined }));
                }
              }}
              onBlur={() => {
                const emailError = validateEmail(email);
                if (emailError) {
                  setFieldErrors((prev) => ({ ...prev, email: emailError }));
                }
              }}
              placeholder="your.email@example.com"
              autoComplete="email"
              required
              aria-invalid={!!fieldErrors.email}
              aria-describedby={fieldErrors.email ? "email-error" : undefined}
              disabled={isLoading}
            />
            {fieldErrors.email && (
              <p id="email-error" className="text-sm text-destructive" role="alert">
                {fieldErrors.email}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
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
            <Label htmlFor="confirmPassword">Confirm Password</Label>
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
                Creating Account...
              </>
            ) : (
              "Create Account"
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        <div className="text-sm text-center text-muted-foreground">
          Already have an account?{" "}
          <a href="/auth/login" className="text-primary hover:underline font-medium">
            Log in
          </a>
        </div>
      </CardFooter>
    </Card>
  );
}
