import { defineMiddleware } from "astro:middleware";

import { createSupabaseServerInstance } from "../db/supabase.client.ts";

/**
 * Public paths that don't require authentication
 * Includes both server-rendered Astro pages and API endpoints
 */
const PUBLIC_PATHS = [
  // Server-Rendered Astro Pages
  "/auth/login",
  "/auth/register",
  "/auth/reset-password",
  "/auth/update-password",
  // Auth API endpoints
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/logout",
  "/api/auth/reset-password",
  // Public pages
  "/",
];

export const onRequest = defineMiddleware(async ({ locals, cookies, url, request, redirect }, next) => {
  // Create Supabase instance with SSR support for ALL requests
  const supabase = createSupabaseServerInstance({
    cookies,
    headers: request.headers,
  });

  // Store supabase instance in locals for use in pages/API routes
  locals.supabase = supabase;

  // Get authenticated user session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Inject user into locals (null if not authenticated)
  if (user) {
    locals.user = {
      email: user.email,
      id: user.id,
    };
  } else {
    locals.user = null;
  }

  // Skip auth check for public paths
  if (PUBLIC_PATHS.includes(url.pathname)) {
    return next();
  }

  // Redirect to login for protected routes if not authenticated
  if (!user) {
    return redirect("/auth/login?redirect=" + encodeURIComponent(url.pathname));
  }

  return next();
});
