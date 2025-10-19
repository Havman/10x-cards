import { defineMiddleware } from "astro:middleware";

import { supabaseAdmin } from "../db/supabase.client.ts";

export const onRequest = defineMiddleware((context, next) => {
  // Use admin client to bypass RLS until authentication is implemented
  context.locals.supabase = supabaseAdmin;
  return next();
});
