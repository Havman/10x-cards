/**
 * Logout API Endpoint
 * Route: POST /api/auth/logout
 * Purpose: US-003 - User Logout
 */

import type { APIRoute } from "astro";

export const prerender = false;

export const POST: APIRoute = async ({ locals }) => {
  try {
    // Get Supabase instance from middleware
    const supabase = locals.supabase;

    // Sign out from Supabase
    const { error } = await supabase.auth.signOut();

    if (error) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message: "Failed to log out. Please try again.",
          },
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Cookies are cleared automatically by Supabase signOut
    // The next request through middleware will not find a valid session

    return new Response(
      JSON.stringify({
        success: true,
        message: "Logged out successfully",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Logout error:", err);
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          message: "An unexpected error occurred during logout",
        },
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
