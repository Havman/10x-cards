/**
 * GET /api/ai/usage
 * Get current AI usage and limits for the authenticated user
 */

import type { APIRoute } from "astro";

import { DEFAULT_USER_ID } from "../../../db/supabase.client";
import type { ApiErrorResponse, ApiSuccessResponse, AIUsageResponse } from "../../../types";
import { ErrorCodes } from "../../../types";

export const prerender = false;

const DAILY_LIMIT = 50;

export const GET: APIRoute = async ({ locals }) => {
  try {
    // Get Supabase client from middleware
    const supabase = locals.supabase;

    if (!supabase) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: ErrorCodes.INTERNAL_ERROR,
            message: "Database client not available",
          },
        } satisfies ApiErrorResponse),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Use DEFAULT_USER_ID until authentication is implemented
    const userId = DEFAULT_USER_ID;

    // Get today's date range (start of day to end of day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Query sum of cards generated today
    const { data, error } = await supabase
      .from("ai_generation_logs")
      .select("cards_count")
      .eq("user_id", userId)
      .gte("generated_at", today.toISOString())
      .lt("generated_at", tomorrow.toISOString());

    if (error) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: ErrorCodes.INTERNAL_ERROR,
            message: "Failed to fetch usage data",
            details: error,
          },
        } satisfies ApiErrorResponse),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Calculate total cards generated today
    const usedToday = data?.reduce((sum: number, log: { cards_count: number }) => sum + log.cards_count, 0) || 0;

    // Calculate remaining
    const remaining = Math.max(0, DAILY_LIMIT - usedToday);

    // Calculate reset time (midnight tonight)
    const resetAt = tomorrow.toISOString();

    // Return usage information
    const response: AIUsageResponse = {
      daily_limit: DAILY_LIMIT,
      used_today: usedToday,
      remaining,
      reset_at: resetAt,
    };

    return new Response(
      JSON.stringify({
        success: true,
        data: response,
      } satisfies ApiSuccessResponse<AIUsageResponse>),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    // Handle unexpected errors
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: ErrorCodes.INTERNAL_ERROR,
          message: "An unexpected error occurred",
          details: error instanceof Error ? error.message : "Unknown error",
        },
      } satisfies ApiErrorResponse),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
