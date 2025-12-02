/**
 * Registration API Endpoint
 * Route: POST /api/auth/register
 * Purpose: Create new user account (US-001)
 */

import type { APIRoute } from "astro";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Parse request body
    const { email, password } = await request.json();

    // Validate input
    if (!email || !password) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message: "Email and password are required",
          },
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Server-side password validation
    if (password.length < 8) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message: "Password must be at least 8 characters long",
          },
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get Supabase instance from middleware (already has cookie context)
    const supabase = locals.supabase;

    // Attempt to create new user with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      // Handle specific Supabase errors
      let errorMessage = "Registration failed";

      if (error.message.includes("already registered")) {
        errorMessage = "An account with this email already exists";
      } else if (error.message.includes("invalid email")) {
        errorMessage = "Please provide a valid email address";
      } else if (error.message.includes("password")) {
        errorMessage = "Password does not meet requirements";
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message: errorMessage,
          },
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Check if email confirmation is required
    const session = data.session;
    const requiresEmailConfirmation = !session && data.user;

    // Success response
    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: data.user?.id,
          email: data.user?.email,
        },
        requiresEmailConfirmation,
        message: requiresEmailConfirmation
          ? "Account created! Please check your email to confirm your account."
          : "Account created successfully!",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    // Catch-all for unexpected errors
    // eslint-disable-next-line no-console
    console.error("Registration error:", err);
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          message: "An unexpected error occurred",
        },
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
