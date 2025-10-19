/**
 * OpenRouter API Client
 * Handles communication with OpenRouter API for AI-powered flashcard generation
 * Currently using mock data for development
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
}

interface OpenRouterResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}

export interface ParsedFlashcard {
  front: string;
  back: string;
}

export class OpenRouterClient {
  private readonly apiKey: string;
  private readonly baseUrl = "https://openrouter.ai/api/v1";
  // TODO: Make model configurable
  private readonly model = "openai/gpt-3.5-turbo";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Generate flashcards from text using AI
   * Currently returns mock data for development
   */
  async generateFlashcards(text: string, maxCards: number): Promise<ParsedFlashcard[]> {
    // Build the prompt (used in production)
    // const systemPrompt = this.buildSystemPrompt();
    // const userPrompt = this.buildUserPrompt(text, maxCards);

    // Mock implementation - return fake flashcards based on the text
    // In production, this would call the actual OpenRouter API
    return this.generateMockFlashcards(text, maxCards);

    /* Production implementation would look like this:
    const request: OpenRouterRequest = {
      model: this.model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    };

    const response = await this.callAPI(request);
    return this.parseResponse(response);
    */
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

Return ONLY a JSON array of flashcards in this exact format:
[
  {
    "front": "Question or prompt",
    "back": "Complete answer or explanation"
  }
]

Do not include any other text, explanations, or formatting outside the JSON array.`;
  }

  /**
   * Build the user prompt with the text and constraints
   */
  private buildUserPrompt(text: string, maxCards: number): string {
    // Sanitize text to prevent prompt injection
    const sanitizedText = this.sanitizeText(text);

    return `Generate up to ${maxCards} flashcards from the following text:

${sanitizedText}

Remember: Return ONLY the JSON array, nothing else.`;
  }

  /**
   * Sanitize text to prevent prompt injection attacks
   */
  private sanitizeText(text: string): string {
    // Remove or escape characters that could manipulate AI behavior
    // This is a basic implementation - can be enhanced based on testing
    return (
      text
        .trim()
        // Remove potential system prompt injections
        .replace(/```/g, "")
        .replace(/\[INST\]/gi, "")
        .replace(/\[\/INST\]/gi, "")
        .replace(/system:/gi, "")
        .replace(/assistant:/gi, "")
        // Limit consecutive newlines
        .replace(/\n{3,}/g, "\n\n")
    );
  }

  /**
   * Generate mock flashcards for development/testing
   * This simulates what the AI would return
   */
  private generateMockFlashcards(text: string, maxCards: number): ParsedFlashcard[] {
    // Extract some words from the text to make it seem contextual
    const words = text.split(/\s+/).filter((w) => w.length > 4);
    const uniqueWords = [...new Set(words)].slice(0, maxCards);

    return uniqueWords.map((word) => ({
      front: `What is the concept related to "${word}"?`,
      back: `This is an AI-generated explanation about ${word}. In the context provided, ${word} represents an important concept that helps understand the subject matter.`,
    }));
  }

  /**
   * Call the OpenRouter API (not implemented in mock version)
   */
  private async callAPI(request: OpenRouterRequest): Promise<OpenRouterResponse> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://10x-cards.app", // Replace with actual domain
        "X-Title": "10x Cards",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Parse and validate the AI response
   */
  private parseResponse(response: OpenRouterResponse): ParsedFlashcard[] {
    const content = response.choices[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    try {
      // Extract JSON from the response (AI might add extra text)
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error("No JSON array found in response");
      }

      const flashcards = JSON.parse(jsonMatch[0]) as ParsedFlashcard[];

      // Validate each flashcard
      return flashcards.filter((card) => {
        return (
          card &&
          typeof card.front === "string" &&
          typeof card.back === "string" &&
          card.front.length > 0 &&
          card.back.length > 0
        );
      });
    } catch (error) {
      throw new Error(`Failed to parse AI response: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }
}
