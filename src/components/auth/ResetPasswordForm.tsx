/**
 * ResetPasswordForm Component
 * Request password reset email
 */

import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ResetPasswordForm() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic validation
    if (!email) {
      setError("Please enter your email address");
      return;
    }

    setIsLoading(true);

    try {
      // TODO: Replace with actual API call when backend is implemented
      // For now, just simulate a delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Placeholder for API call:
      // const response = await fetch("/api/auth/reset-password", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ email }),
      // });
      //
      // const data = await response.json();
      //
      // if (!response.ok || !data.success) {
      //   throw new Error(data.error?.message || "Failed to send reset email");
      // }

      // Show success message (even if email doesn't exist - security best practice)
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Check Your Email</CardTitle>
          <CardDescription>Password reset instructions have been sent</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTitle>✉️ Email Sent</AlertTitle>
            <AlertDescription>
              If an account exists for <strong>{email}</strong>, you will receive an email with instructions to reset
              your password.
            </AlertDescription>
          </Alert>
          <div className="text-sm text-muted-foreground space-y-2">
            <p>Please check your inbox and follow the instructions in the email.</p>
            <p>If you don&apos;t receive an email within a few minutes, please check your spam folder.</p>
          </div>
        </CardContent>
        <CardFooter>
          <a href="/auth/login" className="text-primary hover:underline text-sm font-medium">
            ← Back to login
          </a>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reset Password</CardTitle>
        <CardDescription>Enter your email to receive a password reset link</CardDescription>
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
                // Clear error on change
                if (error) setError(null);
              }}
              placeholder="your.email@example.com"
              autoComplete="email"
              required
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              We&apos;ll send you an email with instructions to reset your password.
            </p>
          </div>

          {/* Submit Button */}
          <Button type="submit" disabled={isLoading} className="w-full" size="lg">
            {isLoading ? (
              <>
                <span className="mr-2">⏳</span>
                Sending Reset Link...
              </>
            ) : (
              "Send Reset Link"
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter>
        <a href="/auth/login" className="text-primary hover:underline text-sm font-medium">
          ← Back to login
        </a>
      </CardFooter>
    </Card>
  );
}
