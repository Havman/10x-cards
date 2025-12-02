import { vi } from "vitest";

/**
 * Mock OpenRouter API response for flashcard generation
 */
export const mockFlashcardGenerationResponse = {
  id: "gen-123456789",
  model: "openai/gpt-4-turbo",
  choices: [
    {
      message: {
        role: "assistant",
        content: JSON.stringify({
          flashcards: [
            {
              front: "What is TypeScript?",
              back: "TypeScript is a strongly typed programming language that builds on JavaScript.",
            },
            {
              front: "What is Astro?",
              back: "Astro is a modern static site builder that delivers lightning-fast performance.",
            },
          ],
        }),
      },
      finish_reason: "stop",
    },
  ],
  usage: {
    prompt_tokens: 100,
    completion_tokens: 50,
    total_tokens: 150,
  },
};

/**
 * Mock OpenRouter client for unit tests
 */
export const createMockOpenRouterClient = () => {
  return {
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue(mockFlashcardGenerationResponse),
      },
    },
  };
};

/**
 * Mock OpenRouter error response
 */
export const mockOpenRouterError = {
  error: {
    message: "Rate limit exceeded",
    type: "rate_limit_error",
    code: "rate_limit_exceeded",
  },
};

/**
 * Mock OpenRouter client that throws an error
 */
export const createMockOpenRouterClientWithError = () => {
  return {
    chat: {
      completions: {
        create: vi.fn().mockRejectedValue(new Error("OpenRouter API error")),
      },
    },
  };
};
