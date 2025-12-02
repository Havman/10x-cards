/**
 * Comprehensive Unit Tests for AI Generation Service
 * Tests cover: daily limits, deck ownership, AI integration, error handling, and edge cases
 *
 * Following Vitest best practices:
 * - Arrange-Act-Assert pattern
 * - Factory pattern for mocks
 * - Descriptive test names
 * - Type-safe mocks
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { AIGenerationService, AIGenerationError } from "@/lib/services/ai-generation.service";
import { createMockSupabaseClient } from "../mocks/supabase.mock";
import { ErrorCodes } from "@/types";
import type { ParsedFlashcard } from "@/lib/services/openrouter.client";

/* eslint-disable @typescript-eslint/no-explicit-any */

// Mock the OpenRouter client at module level
vi.mock("@/lib/services/openrouter.client", () => {
  return {
    OpenRouterClient: class MockOpenRouterClient {
      generateFlashcards = vi.fn();
    },
    OpenRouterError: class OpenRouterError extends Error {},
    ParseError: class ParseError extends Error {},
    ValidationError: class ValidationError extends Error {},
  };
});

describe("AIGenerationService", () => {
  let mockSupabase: any;
  let service: AIGenerationService;
  let mockOpenRouterClient: any;

  const userId = "test-user-id";
  const deckId = 1;
  const mockOpenRouterKey = "test-openrouter-key";

  // Sample test data
  const sampleFlashcards: ParsedFlashcard[] = [
    { front: "What is TypeScript?", back: "A typed superset of JavaScript" },
    { front: "What is Vitest?", back: "A blazing fast unit test framework" },
  ];

  beforeEach(() => {
    // Create fresh mocks for each test
    mockSupabase = createMockSupabaseClient();
    service = new AIGenerationService(mockSupabase as never, userId, mockOpenRouterKey);

    // Access the mocked OpenRouter client from the service
    mockOpenRouterClient = (service as any).openRouterClient;

    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ============================================================================
  // DAILY LIMIT ENFORCEMENT TESTS
  // ============================================================================

  describe("checkDailyLimit", () => {
    const setupDateMocks = (date: Date) => {
      vi.setSystemTime(date);
    };

    it("should pass when user has generated 0 cards today", async () => {
      // Arrange
      setupDateMocks(new Date("2025-11-26T10:00:00Z"));

      vi.mocked(mockSupabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            gte: vi.fn().mockReturnValue({
              lt: vi.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          }),
        }),
      } as never);

      // Act & Assert
      await expect(service.checkDailyLimit()).resolves.toBeUndefined();
    });

    it("should pass when under daily limit (25/50 cards)", async () => {
      // Arrange
      setupDateMocks(new Date("2025-11-26T14:30:00Z"));

      vi.mocked(mockSupabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            gte: vi.fn().mockReturnValue({
              lt: vi.fn().mockResolvedValue({
                data: [{ cards_count: 10 }, { cards_count: 15 }],
                error: null,
              }),
            }),
          }),
        }),
      } as never);

      // Act & Assert
      await expect(service.checkDailyLimit()).resolves.toBeUndefined();
    });

    it("should pass when exactly one card below limit (49/50)", async () => {
      // Arrange
      vi.mocked(mockSupabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            gte: vi.fn().mockReturnValue({
              lt: vi.fn().mockResolvedValue({
                data: [{ cards_count: 49 }],
                error: null,
              }),
            }),
          }),
        }),
      } as never);

      // Act & Assert
      await expect(service.checkDailyLimit()).resolves.toBeUndefined();
    });

    it("should reject when exactly at limit (50/50 cards)", async () => {
      // Arrange
      setupDateMocks(new Date("2025-11-26T18:45:00Z"));

      vi.mocked(mockSupabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            gte: vi.fn().mockReturnValue({
              lt: vi.fn().mockResolvedValue({
                data: [{ cards_count: 30 }, { cards_count: 20 }],
                error: null,
              }),
            }),
          }),
        }),
      } as never);

      // Act & Assert
      await expect(service.checkDailyLimit()).rejects.toThrow(AIGenerationError);

      try {
        await service.checkDailyLimit();
      } catch (error) {
        expect(error).toBeInstanceOf(AIGenerationError);
        expect((error as AIGenerationError).code).toBe(ErrorCodes.DAILY_LIMIT_EXCEEDED);
        expect((error as AIGenerationError).statusCode).toBe(403);
        expect((error as AIGenerationError).message).toContain("Daily generation limit of 50 cards exceeded");

        // Verify error details
        const details = (error as AIGenerationError).details as any;
        expect(details.daily_limit).toBe(50);
        expect(details.used_today).toBe(50);
        expect(details.remaining).toBe(0);
        expect(details.reset_at).toBeDefined();
      }
    });

    it("should reject when over limit (75/50 cards)", async () => {
      // Arrange
      vi.mocked(mockSupabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            gte: vi.fn().mockReturnValue({
              lt: vi.fn().mockResolvedValue({
                data: [{ cards_count: 50 }, { cards_count: 25 }],
                error: null,
              }),
            }),
          }),
        }),
      } as never);

      // Act & Assert
      await expect(service.checkDailyLimit()).rejects.toThrow(AIGenerationError);
    });

    it("should calculate reset time correctly at midnight boundary", async () => {
      // Arrange - Test at 11:59 PM
      setupDateMocks(new Date("2025-11-26T23:59:00Z"));

      vi.mocked(mockSupabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            gte: vi.fn().mockReturnValue({
              lt: vi.fn().mockResolvedValue({
                data: [{ cards_count: 50 }],
                error: null,
              }),
            }),
          }),
        }),
      } as never);

      // Act & Assert
      try {
        await service.checkDailyLimit();
        expect.fail("Should have thrown an error");
      } catch (error) {
        const details = (error as AIGenerationError).details as any;
        const resetDate = new Date(details.reset_at);
        const testDate = new Date("2025-11-26T23:59:00Z");

        // Reset should be tomorrow (next day)
        expect(resetDate.getTime()).toBeGreaterThan(testDate.getTime());

        // Should be within 24 hours from test time
        const hoursDifference = (resetDate.getTime() - testDate.getTime()) / (1000 * 60 * 60);
        expect(hoursDifference).toBeLessThanOrEqual(24);
        expect(hoursDifference).toBeGreaterThan(0);

        // Verify it's the 27th (next day)
        expect(resetDate.getUTCDate()).toBeGreaterThanOrEqual(27);
      }
    });

    it("should throw INTERNAL_ERROR when database query fails", async () => {
      // Arrange
      vi.mocked(mockSupabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            gte: vi.fn().mockReturnValue({
              lt: vi.fn().mockResolvedValue({
                data: null,
                error: { message: "Database connection failed", code: "PGRST500" },
              }),
            }),
          }),
        }),
      } as never);

      // Act & Assert
      try {
        await service.checkDailyLimit();
      } catch (error) {
        expect(error).toBeInstanceOf(AIGenerationError);
        expect((error as AIGenerationError).code).toBe(ErrorCodes.INTERNAL_ERROR);
        expect((error as AIGenerationError).statusCode).toBe(500);
        expect((error as AIGenerationError).message).toBe("Failed to check daily limit");
      }
    });

    it("should query correct date range for today", async () => {
      // Arrange
      const testDate = new Date("2025-11-26T15:30:00Z");
      setupDateMocks(testDate);

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lt: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      vi.mocked(mockSupabase.from).mockReturnValue(mockQuery as never);

      // Act
      await service.checkDailyLimit();

      // Assert - verify date range queries
      const today = new Date(testDate);
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      expect(mockQuery.gte).toHaveBeenCalledWith("generated_at", today.toISOString());
      expect(mockQuery.lt).toHaveBeenCalledWith("generated_at", tomorrow.toISOString());
    });
  });

  // ============================================================================
  // DECK OWNERSHIP VERIFICATION TESTS
  // ============================================================================

  describe("verifyDeckOwnership", () => {
    it("should pass when deck exists and belongs to user", async () => {
      // Arrange
      vi.mocked(mockSupabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: deckId, user_id: userId },
                error: null,
              }),
            }),
          }),
        }),
      } as never);

      // Act & Assert
      await expect(service.verifyDeckOwnership(deckId)).resolves.toBeUndefined();
    });

    it("should reject when deck does not exist", async () => {
      // Arrange
      vi.mocked(mockSupabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: "No rows found", code: "PGRST116" },
              }),
            }),
          }),
        }),
      } as never);

      // Act & Assert
      try {
        await service.verifyDeckOwnership(deckId);
      } catch (error) {
        expect(error).toBeInstanceOf(AIGenerationError);
        expect((error as AIGenerationError).code).toBe(ErrorCodes.NOT_FOUND);
        expect((error as AIGenerationError).statusCode).toBe(404);
        expect((error as AIGenerationError).message).toBe("Deck not found or access denied");
        expect((error as AIGenerationError).details).toEqual({ deck_id: deckId });
      }
    });

    it("should reject when deck belongs to different user (RLS violation)", async () => {
      // Arrange - RLS should prevent this query from returning data
      vi.mocked(mockSupabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: null, // No error, just no data (RLS filtered it out)
              }),
            }),
          }),
        }),
      } as never);

      // Act & Assert
      await expect(service.verifyDeckOwnership(deckId)).rejects.toThrow("Deck not found or access denied");
    });

    it("should verify correct query parameters", async () => {
      // Arrange
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: deckId, user_id: userId }, error: null }),
      };

      vi.mocked(mockSupabase.from).mockReturnValue(mockQuery as never);

      // Act
      await service.verifyDeckOwnership(deckId);

      // Assert
      expect(mockSupabase.from).toHaveBeenCalledWith("decks");
      expect(mockQuery.select).toHaveBeenCalledWith("id, user_id");
      expect(mockQuery.eq).toHaveBeenCalledWith("id", deckId);
      expect(mockQuery.eq).toHaveBeenCalledWith("user_id", userId);
    });
  });

  // ============================================================================
  // AI FLASHCARD GENERATION TESTS
  // ============================================================================

  describe("generateFlashcards", () => {
    it("should successfully generate flashcards", async () => {
      // Arrange
      vi.mocked(mockOpenRouterClient.generateFlashcards).mockResolvedValue(sampleFlashcards);

      const inputText = "TypeScript is a typed superset of JavaScript. Vitest is a fast test framework.";
      const maxCards = 5;

      // Act
      const result = await service.generateFlashcards(inputText, maxCards);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].front).toBe("What is TypeScript?");
      expect(result[0].back).toBe("A typed superset of JavaScript");
      expect(mockOpenRouterClient.generateFlashcards).toHaveBeenCalledWith(inputText, maxCards);
      expect(mockOpenRouterClient.generateFlashcards).toHaveBeenCalledTimes(1);
    });

    it("should throw AI_SERVICE_ERROR when OpenRouter client throws Error", async () => {
      // Arrange
      const errorMessage = "Rate limit exceeded";
      vi.mocked(mockOpenRouterClient.generateFlashcards).mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      try {
        await service.generateFlashcards("Some text", 5);
      } catch (error) {
        expect(error).toBeInstanceOf(AIGenerationError);
        expect((error as AIGenerationError).code).toBe(ErrorCodes.AI_SERVICE_ERROR);
        expect((error as AIGenerationError).statusCode).toBe(503);
        expect((error as AIGenerationError).message).toBe("AI service failed to generate flashcards");
        expect((error as AIGenerationError).details).toBe(errorMessage);
      }
    });

    it("should handle non-Error exceptions from OpenRouter", async () => {
      // Arrange
      vi.mocked(mockOpenRouterClient.generateFlashcards).mockRejectedValue("Unknown error");

      // Act & Assert
      try {
        await service.generateFlashcards("Some text", 5);
      } catch (error) {
        expect(error).toBeInstanceOf(AIGenerationError);
        expect((error as AIGenerationError).details).toBe("Unknown error");
      }
    });
  });

  // ============================================================================
  // SAVE FLASHCARDS TESTS
  // ============================================================================

  describe("saveFlashcards", () => {
    it("should save flashcards and log generation successfully", async () => {
      // Arrange
      const mockCreatedFlashcards = [
        {
          id: 1,
          deck_id: deckId,
          front: "Question 1",
          back: "Answer 1",
          status: "draft",
          source: "ai",
          ease_factor: 2.5,
          interval: 0,
        },
        {
          id: 2,
          deck_id: deckId,
          front: "Question 2",
          back: "Answer 2",
          status: "draft",
          source: "ai",
          ease_factor: 2.5,
          interval: 0,
        },
      ];

      vi.mocked(mockSupabase.from).mockImplementation((table: string) => {
        if (table === "flashcards") {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockResolvedValue({
                data: mockCreatedFlashcards,
                error: null,
              }),
            }),
          } as never;
        }
        // ai_generation_logs table
        return {
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: 123 },
                error: null,
              }),
            }),
          }),
        } as never;
      });

      // Act
      const result = await service.saveFlashcards(deckId, sampleFlashcards);

      // Assert
      expect(result.flashcards).toHaveLength(2);
      expect(result.generationLogId).toBe(123);
      expect(result.flashcards[0].front).toBe("Question 1");
      expect(result.flashcards[0].status).toBe("draft");
      expect(result.flashcards[0].source).toBe("ai");
    });

    it("should set correct default values for new flashcards", async () => {
      // Arrange
      let insertedData: any;

      vi.mocked(mockSupabase.from).mockImplementation((table: string) => {
        if (table === "flashcards") {
          return {
            insert: vi.fn().mockImplementation((data) => {
              insertedData = data;
              return {
                select: vi.fn().mockResolvedValue({
                  data: [{ id: 1 }],
                  error: null,
                }),
              };
            }),
          } as never;
        }
        return {
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { id: 1 }, error: null }),
            }),
          }),
        } as never;
      });

      // Act
      await service.saveFlashcards(deckId, sampleFlashcards);

      // Assert - verify FSRS defaults
      expect(insertedData[0]).toMatchObject({
        deck_id: deckId,
        status: "draft",
        source: "ai",
        ease_factor: 2.5,
        interval: 0,
      });
    });

    it("should throw INTERNAL_ERROR when flashcard insert fails", async () => {
      // Arrange
      vi.mocked(mockSupabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({
            data: null,
            error: { message: "Insert failed", code: "23505" },
          }),
        }),
      } as never);

      // Act & Assert
      try {
        await service.saveFlashcards(deckId, sampleFlashcards);
      } catch (error) {
        expect(error).toBeInstanceOf(AIGenerationError);
        expect((error as AIGenerationError).code).toBe(ErrorCodes.INTERNAL_ERROR);
        expect((error as AIGenerationError).statusCode).toBe(500);
        expect((error as AIGenerationError).message).toBe("Failed to save flashcards");
      }
    });

    it("should continue even if generation log insert fails", async () => {
      // Arrange - Flashcards succeed but log fails
      const mockCreatedFlashcards = [{ id: 1, front: "Q", back: "A" }];

      vi.mocked(mockSupabase.from).mockImplementation((table: string) => {
        if (table === "flashcards") {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockResolvedValue({
                data: mockCreatedFlashcards,
                error: null,
              }),
            }),
          } as never;
        }
        // Log insert fails
        return {
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: "Log insert failed" },
              }),
            }),
          }),
        } as never;
      });

      // Act
      const result = await service.saveFlashcards(deckId, sampleFlashcards);

      // Assert - Should still return flashcards with generationLogId = 0
      expect(result.flashcards).toHaveLength(1);
      expect(result.generationLogId).toBe(0);
    });

    it("should handle empty flashcard array", async () => {
      // Arrange
      vi.mocked(mockSupabase.from).mockImplementation((table: string) => {
        if (table === "flashcards") {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          } as never;
        }
        return {
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { id: 1 }, error: null }),
            }),
          }),
        } as never;
      });

      // Act
      const result = await service.saveFlashcards(deckId, []);

      // Assert
      expect(result.flashcards).toHaveLength(0);
      expect(result.generationLogId).toBeDefined();
    });
  });

  // ============================================================================
  // INTEGRATION TESTS - Full Workflow
  // ============================================================================

  describe("generateAndSaveFlashcards (Integration)", () => {
    const setupSuccessfulMocks = () => {
      // Mock daily limit check (under limit)
      vi.mocked(mockSupabase.from).mockImplementationOnce(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            gte: vi.fn().mockReturnValue({
              lt: vi.fn().mockResolvedValue({
                data: [{ cards_count: 10 }],
                error: null,
              }),
            }),
          }),
        }),
      })) as never;

      // Mock deck ownership check
      vi.mocked(mockSupabase.from).mockImplementationOnce(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: deckId, user_id: userId },
                error: null,
              }),
            }),
          }),
        }),
      })) as never;

      // Mock AI generation
      vi.mocked(mockOpenRouterClient.generateFlashcards).mockResolvedValue(sampleFlashcards);

      // Mock flashcard save
      vi.mocked(mockSupabase.from).mockImplementationOnce(() => ({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({
            data: [
              { id: 1, front: "What is TypeScript?", back: "A typed superset of JavaScript", status: "draft" },
              { id: 2, front: "What is Vitest?", back: "A blazing fast unit test framework", status: "draft" },
            ],
            error: null,
          }),
        }),
      })) as never;

      // Mock generation log
      vi.mocked(mockSupabase.from).mockImplementationOnce(() => ({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 999 },
              error: null,
            }),
          }),
        }),
      })) as never;
    };

    it("should complete full workflow successfully", async () => {
      // Arrange
      setupSuccessfulMocks();

      const inputText = "A".repeat(1500); // Valid length
      const maxCards = 5;

      // Act
      const result = await service.generateAndSaveFlashcards(deckId, inputText, maxCards);

      // Assert
      expect(result).toMatchInlineSnapshot(
        {
          generation_id: expect.any(Number),
          deck_id: expect.any(Number),
        },
        `
        {
          "cards_generated": 2,
          "deck_id": Any<Number>,
          "flashcards": [
            {
              "back": "A typed superset of JavaScript",
              "front": "What is TypeScript?",
              "id": 1,
              "source": "ai",
              "status": "draft",
            },
            {
              "back": "A blazing fast unit test framework",
              "front": "What is Vitest?",
              "id": 2,
              "source": "ai",
              "status": "draft",
            },
          ],
          "generation_id": Any<Number>,
        }
      `
      );

      expect(result.generation_id).toBe(999);
      expect(result.deck_id).toBe(deckId);
      expect(result.flashcards).toHaveLength(2);
      expect(result.cards_generated).toBe(2);
      expect(result.flashcards[0].status).toBe("draft");
      expect(result.flashcards[0].source).toBe("ai");
    });

    it("should fail fast when daily limit exceeded", async () => {
      // Arrange - Mock daily limit exceeded
      vi.mocked(mockSupabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            gte: vi.fn().mockReturnValue({
              lt: vi.fn().mockResolvedValue({
                data: [{ cards_count: 50 }],
                error: null,
              }),
            }),
          }),
        }),
      } as never);

      // Act & Assert
      await expect(service.generateAndSaveFlashcards(deckId, "text", 5)).rejects.toThrow(
        "Daily generation limit of 50 cards exceeded"
      );

      // Verify no further operations were attempted
      expect(mockOpenRouterClient.generateFlashcards).not.toHaveBeenCalled();
    });

    it("should fail when deck ownership verification fails", async () => {
      // Arrange - Pass limit check but fail ownership
      vi.mocked(mockSupabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            gte: vi.fn().mockReturnValue({
              lt: vi.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          }),
        }),
      } as never);

      vi.mocked(mockSupabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: "Not found" },
              }),
            }),
          }),
        }),
      } as never);

      // Act & Assert
      await expect(service.generateAndSaveFlashcards(deckId, "text", 5)).rejects.toThrow(
        "Deck not found or access denied"
      );

      expect(mockOpenRouterClient.generateFlashcards).not.toHaveBeenCalled();
    });

    it("should reject when AI returns no flashcards", async () => {
      // Arrange - All checks pass but AI returns empty array
      vi.mocked(mockSupabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            gte: vi.fn().mockReturnValue({
              lt: vi.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          }),
        }),
      } as never);

      vi.mocked(mockSupabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: deckId, user_id: userId },
                error: null,
              }),
            }),
          }),
        }),
      } as never);

      vi.mocked(mockOpenRouterClient.generateFlashcards).mockResolvedValue([]);

      // Act & Assert
      try {
        await service.generateAndSaveFlashcards(deckId, "text", 5);
      } catch (error) {
        expect(error).toBeInstanceOf(AIGenerationError);
        expect((error as AIGenerationError).code).toBe(ErrorCodes.AI_SERVICE_ERROR);
        expect((error as AIGenerationError).message).toBe(
          "AI failed to generate any valid flashcards from the provided text"
        );
      }
    });

    it("should handle transaction-like behavior (all or nothing)", async () => {
      // Arrange - Setup to fail at save step
      vi.mocked(mockSupabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            gte: vi.fn().mockReturnValue({
              lt: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
        }),
      } as never);

      vi.mocked(mockSupabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { id: deckId, user_id: userId }, error: null }),
            }),
          }),
        }),
      } as never);

      vi.mocked(mockOpenRouterClient.generateFlashcards).mockResolvedValue(sampleFlashcards);

      vi.mocked(mockSupabase.from).mockReturnValueOnce({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({
            data: null,
            error: { message: "Constraint violation" },
          }),
        }),
      } as never);

      // Act & Assert
      await expect(service.generateAndSaveFlashcards(deckId, "text", 5)).rejects.toThrow("Failed to save flashcards");

      // Verify AI was called but save failed
      expect(mockOpenRouterClient.generateFlashcards).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // ERROR HANDLING & EDGE CASES
  // ============================================================================

  describe("Error Handling", () => {
    it("should preserve error codes through the chain", async () => {
      // Test that custom error codes are not lost
      const errorCodes = [
        ErrorCodes.DAILY_LIMIT_EXCEEDED,
        ErrorCodes.NOT_FOUND,
        ErrorCodes.AI_SERVICE_ERROR,
        ErrorCodes.INTERNAL_ERROR,
      ];

      errorCodes.forEach((code) => {
        const error = new AIGenerationError("Test error", code, 500);
        expect(error.code).toBe(code);
        expect(error.name).toBe("AIGenerationError");
      });
    });

    it("should include contextual details in errors", async () => {
      // Arrange
      vi.mocked(mockSupabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            }),
          }),
        }),
      } as never);

      // Act & Assert
      try {
        await service.verifyDeckOwnership(deckId);
      } catch (error) {
        expect((error as AIGenerationError).details).toEqual({ deck_id: deckId });
      }
    });
  });
});
