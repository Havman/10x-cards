/**
 * POST /api/ai/generate
 * Generate flashcards from text using AI
 */

import type { APIRoute } from "astro";
import { z } from "zod";

import { DEFAULT_USER_ID } from "../../../db/supabase.client";
import { AIGenerationService, AIGenerationError } from "../../../lib/services/ai-generation.service";
import { AIGenerateRequestSchema } from "../../../lib/validation/ai-generation.schemas";
import type { ApiErrorResponse, ApiSuccessResponse, AIGenerateResponse } from "../../../types";
import { ErrorCodes } from "../../../types";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
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

    // Parse and validate request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: ErrorCodes.INVALID_INPUT,
            message: "Invalid JSON in request body",
          },
        } satisfies ApiErrorResponse),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Validate input with Zod
    const validationResult = AIGenerateRequestSchema.safeParse(body);

    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: ErrorCodes.INVALID_INPUT,
            message: firstError?.message || "Invalid input",
            field: firstError?.path.join("."),
            details: validationResult.error.errors,
          },
        } satisfies ApiErrorResponse),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { text, deck_id, max_cards = 10 } = validationResult.data;

    // Use DEFAULT_USER_ID until authentication is implemented
    const userId = DEFAULT_USER_ID;

    // Create service instance
    const aiService = new AIGenerationService(supabase, userId);

    // Generate and save flashcards
    const result: AIGenerateResponse = await aiService.generateAndSaveFlashcards(deck_id, text, max_cards);

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        data: result,
      } satisfies ApiSuccessResponse<AIGenerateResponse>),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    // Handle AIGenerationError
    if (error instanceof AIGenerationError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: error.code,
            message: error.message,
            details: error.details,
          },
        } satisfies ApiErrorResponse),
        {
          status: error.statusCode,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Handle Zod validation errors (shouldn't happen if we validated above)
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: ErrorCodes.INVALID_INPUT,
            message: "Validation failed",
            details: error.errors,
          },
        } satisfies ApiErrorResponse),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Handle unexpected errors
    // In production, log this error to monitoring service
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
