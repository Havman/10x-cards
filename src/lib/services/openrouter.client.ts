/**
 * OpenRouter API Client
 * Handles communication with OpenRouter API for AI-powered flashcard generation
 */

/**
 * Custom error classes for OpenRouter service
 */
export class OpenRouterError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly responseBody?: string
  ) {
    super(message);
    this.name = "OpenRouterError";
  }
}

export class ParseError extends Error {
  constructor(
    message: string,
    public readonly content?: string
  ) {
    super(message);
    this.name = "ParseError";
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

/**
 * Private interfaces for OpenRouter API communication
 */
interface OpenRouterMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface OpenRouterRequest {
  model: string;
  messages: OpenRouterMessage[];
  temperature?: number;
  max_tokens?: number;
  response_format?: {
    type: "json_schema";
    json_schema: {
      name: string;
      strict: boolean;
      schema: object;
    };
  };
}

interface OpenRouterResponse {
  id: string;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Public interfaces
 */
export interface ParsedFlashcard {
  front: string;
  back: string;
}

export interface OpenRouterOptions {
  model?: string;
  baseUrl?: string;
  httpReferer?: string;
  appTitle?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface OpenRouterUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  total_cost?: number;
}

export class OpenRouterClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly model: string;
  private readonly httpReferer: string;
  private readonly appTitle: string;
  private readonly temperature: number;
  private readonly maxTokens: number;

  constructor(apiKey: string, options?: OpenRouterOptions) {
    // Validate API key
    if (!apiKey || apiKey.trim() === "") {
      throw new ValidationError("OpenRouter API key is required");
    }

    this.apiKey = apiKey.trim();

    // Set configuration with defaults
    this.model = options?.model || "openai/gpt-4o-mini";
    this.baseUrl = options?.baseUrl || "https://openrouter.ai/api/v1";
    this.httpReferer = options?.httpReferer || "https://10x-cards.app";
    this.appTitle = options?.appTitle || "10x Cards";
    this.temperature = options?.temperature ?? 0.7;
    this.maxTokens = options?.maxTokens || 2000;

    // Validate temperature range
    if (this.temperature < 0.0 || this.temperature > 1.0) {
      throw new ValidationError("Temperature must be between 0.0 and 1.0", {
        provided: this.temperature,
      });
    }

    // Validate max tokens
    if (this.maxTokens <= 0) {
      throw new ValidationError("Max tokens must be positive", {
        provided: this.maxTokens,
      });
    }
  }

  /**
   * Generate flashcards from text using AI
   */
  async generateFlashcards(text: string, maxCards: number): Promise<ParsedFlashcard[]> {
    // Input validation
    const MIN_TEXT_LENGTH = 1000;
    const MAX_TEXT_LENGTH = 10000;
    const MIN_CARDS = 1;
    const MAX_CARDS = 50;

    if (!text || text.trim().length < MIN_TEXT_LENGTH) {
      throw new ValidationError(`Text must be at least ${MIN_TEXT_LENGTH} characters`, {
        provided: text?.length || 0,
        minimum: MIN_TEXT_LENGTH,
      });
    }

    if (text.length > MAX_TEXT_LENGTH) {
      throw new ValidationError(`Text must not exceed ${MAX_TEXT_LENGTH} characters`, {
        provided: text.length,
        maximum: MAX_TEXT_LENGTH,
      });
    }

    if (maxCards < MIN_CARDS || maxCards > MAX_CARDS) {
      throw new ValidationError(`maxCards must be between ${MIN_CARDS} and ${MAX_CARDS}`, {
        provided: maxCards,
        minimum: MIN_CARDS,
        maximum: MAX_CARDS,
      });
    }

    try {
      const sanitizedText = this.sanitizeText(text);
      const systemPrompt = this.buildSystemPrompt();
      const userPrompt = this.buildUserPrompt(sanitizedText, maxCards);
      const responseSchema = this.buildResponseSchema();

      const request: OpenRouterRequest = {
        model: this.model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: this.temperature,
        max_tokens: this.maxTokens,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "flashcard_generation",
            strict: true,
            schema: responseSchema,
          },
        },
      };

      const response = await this.callAPIWithRetry(request);
      return this.parseResponse(response);
    } catch (error) {
      // Re-throw custom errors as-is
      if (error instanceof OpenRouterError || error instanceof ParseError || error instanceof ValidationError) {
        throw error;
      }

      // Wrap unexpected errors
      throw new OpenRouterError(
        `Unexpected error during flashcard generation: ${error instanceof Error ? error.message : "Unknown error"}`,
        500
      );
    }
  }

  /**
   * Build the system prompt for the AI
   */
  private buildSystemPrompt(): string {
    return `You are an expert at creating high-quality flashcards for learning and memorization.

Your task is to analyze the provided text and generate flashcards that:
- Focus on the most important concepts, facts, and relationships
- Have clear, concise questions on the front
- Provide complete, accurate answers on the back
- Avoid ambiguity or trick questions
- Use active recall principles

You must respond ONLY with valid JSON matching the provided schema.
Do not include any explanations, comments, or text outside the JSON structure.`;
  }

  /**
   * Build the user prompt with the text and constraints
   */
  private buildUserPrompt(text: string, maxCards: number): string {
    return `Generate up to ${maxCards} flashcards from the following text. Focus on the most important concepts and information.

Text:
${text}`;
  }

  /**
   * Build JSON Schema for structured output validation
   */
  private buildResponseSchema(): object {
    return {
      type: "object",
      properties: {
        flashcards: {
          type: "array",
          items: {
            type: "object",
            properties: {
              front: {
                type: "string",
                description: "The question or prompt for the flashcard",
                minLength: 1,
                maxLength: 200,
              },
              back: {
                type: "string",
                description: "The answer or explanation for the flashcard",
                minLength: 1,
                maxLength: 500,
              },
            },
            required: ["front", "back"],
            additionalProperties: false,
          },
          minItems: 1,
          maxItems: 50,
        },
      },
      required: ["flashcards"],
      additionalProperties: false,
    };
  }

  /**
   * Sanitize text to prevent prompt injection attacks
   */
  private sanitizeText(text: string): string {
    return (
      text
        .trim()
        // Remove code blocks
        .replace(/```/g, "")
        // Remove instruction markers
        .replace(/\[INST\]/gi, "")
        .replace(/\[\/INST\]/gi, "")
        .replace(/<\|im_start\|>/gi, "")
        .replace(/<\|im_end\|>/gi, "")
        // Remove role indicators
        .replace(/^(system|assistant|user):/gim, "")
        // Limit consecutive newlines
        .replace(/\n{3,}/g, "\n\n")
        // Remove null bytes and control characters (except newlines and tabs)
        // eslint-disable-next-line no-control-regex
        .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, "")
    );
  }

  /**
   * Call the OpenRouter API with error handling
   */
  private async callAPI(request: OpenRouterRequest): Promise<OpenRouterResponse> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": this.httpReferer,
        "X-Title": this.appTitle,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      let errorMessage = `OpenRouter API error: ${response.status}`;

      try {
        const errorJson = JSON.parse(errorBody);
        errorMessage = errorJson.error?.message || errorMessage;
      } catch {
        // Keep default error message if parsing fails
      }

      throw new OpenRouterError(errorMessage, response.status, errorBody);
    }

    return response.json();
  }

  /**
   * Call API with retry logic for transient failures
   */
  private async callAPIWithRetry(request: OpenRouterRequest, maxRetries = 3): Promise<OpenRouterResponse> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.callAPI(request);
      } catch (error) {
        // Don't retry on last attempt
        if (attempt === maxRetries) {
          throw error;
        }

        // Only retry on server errors (5xx) or network timeouts
        if (error instanceof OpenRouterError && error.statusCode >= 500) {
          // Exponential backoff: 2^attempt * 1000ms (2s, 4s, 8s)
          const delay = Math.pow(2, attempt) * 1000;
          await this.sleep(delay);
          continue;
        }

        // Don't retry client errors (4xx)
        throw error;
      }
    }

    // This should never be reached, but TypeScript needs it
    throw new OpenRouterError("Max retries exceeded", 500);
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Parse and validate the AI response
   */
  private parseResponse(response: OpenRouterResponse): ParsedFlashcard[] {
    const content = response.choices[0]?.message?.content;

    if (!content) {
      throw new ParseError("No content in API response");
    }

    let flashcardsData: { flashcards: ParsedFlashcard[] };

    try {
      // Try to parse as JSON (should work with structured output)
      flashcardsData = JSON.parse(content);
    } catch {
      // Fallback: Try to extract JSON object from text
      const jsonMatch = content.match(/\{[\s\S]*"flashcards"[\s\S]*\}/);
      if (!jsonMatch) {
        throw new ParseError("No valid JSON found in response", content);
      }
      try {
        flashcardsData = JSON.parse(jsonMatch[0]);
      } catch {
        throw new ParseError("Failed to parse JSON from response", content);
      }
    }

    if (!Array.isArray(flashcardsData.flashcards)) {
      throw new ParseError("Response does not contain flashcards array", content);
    }

    // Validate and filter flashcards
    const validFlashcards = flashcardsData.flashcards.filter((card) => {
      return (
        card &&
        typeof card.front === "string" &&
        typeof card.back === "string" &&
        card.front.trim().length > 0 &&
        card.back.trim().length > 0 &&
        card.front.length <= 200 &&
        card.back.length <= 500
      );
    });

    if (validFlashcards.length === 0) {
      throw new ParseError("No valid flashcards found in response", content);
    }

    return validFlashcards;
  }
}
