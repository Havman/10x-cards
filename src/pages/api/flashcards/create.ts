/**
 * API Endpoint: POST /api/flashcards/create
 * Creates a new flashcard in the database
 */

import type { APIRoute } from "astro";
import { z } from "zod";
import { supabaseAdmin, DEFAULT_USER_ID } from "@/db/supabase.client";
import type { ApiSuccessResponse, ApiErrorResponse } from "@/types";

// Request validation schema
const CreateFlashcardSchema = z.object({
  deck_id: z.number().int().positive(),
  front: z.string().min(1).max(200),
  back: z.string().min(1).max(500),
  source: z.enum(["ai", "manual"]).default("ai"),
});

interface CreateFlashcardResponse {
  flashcard_id: number;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    // Parse request body
    const body = await request.json();

    // Validate request data
    const validationResult = CreateFlashcardSchema.safeParse(body);
    if (!validationResult.success) {
      const response: ApiErrorResponse = {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid request data",
          details: validationResult.error.errors,
        },
      };
      return new Response(JSON.stringify(response), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { deck_id, front, back, source } = validationResult.data;

    // Verify the deck exists and belongs to the user
    const { data: deck, error: deckError } = await supabaseAdmin
      .from("decks")
      .select("id")
      .eq("id", deck_id)
      .eq("user_id", DEFAULT_USER_ID)
      .single();

    if (deckError || !deck) {
      const response: ApiErrorResponse = {
        success: false,
        error: {
          code: "DECK_NOT_FOUND",
          message: "Deck not found or you don't have permission to add flashcards to it",
        },
      };
      return new Response(JSON.stringify(response), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Insert the flashcard
    const { data: flashcard, error: insertError } = await supabaseAdmin
      .from("flashcards")
      .insert({
        deck_id,
        front,
        back,
        source,
        status: "new", // Default status for accepted AI-generated cards
        ease_factor: 2.5, // Default FSRS ease factor
        interval: 0, // Default interval for new cards
        next_review_date: new Date().toISOString().split("T")[0], // Today's date
      })
      .select("id")
      .single();

    if (insertError || !flashcard) {
      const response: ApiErrorResponse = {
        success: false,
        error: {
          code: "DATABASE_ERROR",
          message: "Failed to create flashcard",
          details: insertError,
        },
      };
      return new Response(JSON.stringify(response), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Return success response
    const response: ApiSuccessResponse<CreateFlashcardResponse> = {
      success: true,
      data: {
        flashcard_id: flashcard.id,
      },
    };

    return new Response(JSON.stringify(response), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    const response: ApiErrorResponse = {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred",
      },
    };
    return new Response(JSON.stringify(response), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
