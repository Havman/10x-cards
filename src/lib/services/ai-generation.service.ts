/**
 * AI Generation Service
 * Handles AI-powered flashcard generation with rate limiting and validation
 */

import type { SupabaseClient } from "../../db/supabase.client";
import type { AIGenerateResponse, AIGenerationLogInsert, FlashcardInsert, Flashcard } from "../../types";
import { ErrorCodes } from "../../types";
import { OpenRouterClient, type ParsedFlashcard } from "./openrouter.client";

/**
 * Custom error class for AI generation failures
 */
export class AIGenerationError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "AIGenerationError";
  }
}

/**
 * Service for managing AI flashcard generation
 */
export class AIGenerationService {
  private readonly DAILY_LIMIT = 50;
  private openRouterClient: OpenRouterClient;

  constructor(
    private readonly supabase: SupabaseClient,
    private readonly userId: string,
    openRouterApiKey: string
  ) {
    this.openRouterClient = new OpenRouterClient(openRouterApiKey);
  }

  /**
   * Check if user has exceeded their daily generation limit
   * @throws AIGenerationError if limit exceeded
   */
  async checkDailyLimit(): Promise<void> {
    // Get today's date range (start of day to end of day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Query sum of cards generated today
    const { data, error } = await this.supabase
      .from("ai_generation_logs")
      .select("cards_count")
      .eq("user_id", this.userId)
      .gte("generated_at", today.toISOString())
      .lt("generated_at", tomorrow.toISOString());

    if (error) {
      throw new AIGenerationError("Failed to check daily limit", ErrorCodes.INTERNAL_ERROR, 500, error);
    }

    // Calculate total cards generated today
    const totalToday = data?.reduce((sum: number, log: { cards_count: number }) => sum + log.cards_count, 0) || 0;

    // Check if limit exceeded
    if (totalToday >= this.DAILY_LIMIT) {
      // Calculate reset time (midnight tonight)
      const resetAt = tomorrow.toISOString();

      throw new AIGenerationError(
        `Daily generation limit of ${this.DAILY_LIMIT} cards exceeded. Limit resets at midnight.`,
        ErrorCodes.DAILY_LIMIT_EXCEEDED,
        403,
        {
          daily_limit: this.DAILY_LIMIT,
          used_today: totalToday,
          remaining: 0,
          reset_at: resetAt,
        }
      );
    }
  }

  /**
   * Verify that the deck exists and belongs to the user
   * @throws AIGenerationError if deck not found or doesn't belong to user
   */
  async verifyDeckOwnership(deckId: number): Promise<void> {
    const { data, error } = await this.supabase
      .from("decks")
      .select("id, user_id")
      .eq("id", deckId)
      .eq("user_id", this.userId)
      .single();

    if (error || !data) {
      throw new AIGenerationError("Deck not found or access denied", ErrorCodes.NOT_FOUND, 404, { deck_id: deckId });
    }
  }

  /**
   * Generate flashcards using AI
   */
  async generateFlashcards(text: string, maxCards: number): Promise<ParsedFlashcard[]> {
    try {
      return await this.openRouterClient.generateFlashcards(text, maxCards);
    } catch (error) {
      throw new AIGenerationError(
        "AI service failed to generate flashcards",
        ErrorCodes.AI_SERVICE_ERROR,
        503,
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }

  /**
   * Save generated flashcards to the database
   */
  async saveFlashcards(
    deckId: number,
    flashcards: ParsedFlashcard[]
  ): Promise<{ flashcards: Flashcard[]; generationLogId: number }> {
    // Prepare flashcard inserts
    const flashcardInserts: FlashcardInsert[] = flashcards.map((card) => ({
      deck_id: deckId,
      front: card.front,
      back: card.back,
      status: "draft",
      source: "ai",
      ease_factor: 2.5,
      interval: 0,
    }));

    // Insert flashcards
    const { data: createdFlashcards, error: flashcardsError } = await this.supabase
      .from("flashcards")
      .insert(flashcardInserts)
      .select();

    if (flashcardsError || !createdFlashcards) {
      throw new AIGenerationError("Failed to save flashcards", ErrorCodes.INTERNAL_ERROR, 500, flashcardsError);
    }

    // Log the generation
    const generationLog: AIGenerationLogInsert = {
      user_id: this.userId,
      cards_count: createdFlashcards.length,
    };

    const { data: logData, error: logError } = await this.supabase
      .from("ai_generation_logs")
      .insert(generationLog)
      .select("id")
      .single();

    if (logError || !logData) {
      // Log error but don't fail the request since flashcards were created
      // In production, this should use proper logging service
      // console.error("Failed to log generation:", logError);
    }

    return {
      flashcards: createdFlashcards,
      generationLogId: logData?.id || 0,
    };
  }

  /**
   * Main method: Generate and save flashcards
   */
  async generateAndSaveFlashcards(deckId: number, text: string, maxCards: number): Promise<AIGenerateResponse> {
    // 1. Check daily limit
    await this.checkDailyLimit();

    // 2. Verify deck ownership
    await this.verifyDeckOwnership(deckId);

    // 3. Generate flashcards using AI
    const parsedFlashcards = await this.generateFlashcards(text, maxCards);

    if (parsedFlashcards.length === 0) {
      throw new AIGenerationError(
        "AI failed to generate any valid flashcards from the provided text",
        ErrorCodes.AI_SERVICE_ERROR,
        503
      );
    }

    // 4. Save flashcards to database
    const { flashcards, generationLogId } = await this.saveFlashcards(deckId, parsedFlashcards);

    // 5. Format response
    return {
      generation_id: generationLogId,
      deck_id: deckId,
      flashcards: flashcards.map((card) => ({
        id: card.id,
        front: card.front,
        back: card.back,
        status: "draft" as const,
        source: "ai" as const,
      })),
      cards_generated: flashcards.length,
    };
  }
}
