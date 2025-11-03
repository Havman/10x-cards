# OpenRouter Service Implementation Plan

## 1. Service Description

The `OpenRouterClient` is a TypeScript service responsible for communicating with the OpenRouter API to generate flashcards using Large Language Models (LLMs). The service handles:

- **API Communication**: Sending structured requests to OpenRouter's chat completion endpoint
- **Prompt Engineering**: Constructing effective system and user prompts for flashcard generation
- **Response Parsing**: Extracting and validating JSON-formatted flashcards from AI responses
- **Error Handling**: Managing API failures, rate limits, and invalid responses
- **Structured Outputs**: Utilizing JSON Schema to enforce response format from the LLM

The service acts as a bridge between the application's flashcard generation needs and the OpenRouter API, abstracting away the complexities of API communication and response handling.

## 2. Constructor Description

### Purpose
Initialize the OpenRouter client with necessary configuration for API communication.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `apiKey` | `string` | Yes | OpenRouter API key for authentication |
| `options` | `OpenRouterOptions` | No | Optional configuration object |

### Options Interface

```typescript
interface OpenRouterOptions {
  model?: string;           // Default: "openai/gpt-4o-mini"
  baseUrl?: string;         // Default: "https://openrouter.ai/api/v1"
  httpReferer?: string;     // Your app's URL for OpenRouter analytics
  appTitle?: string;        // Your app's name for OpenRouter analytics
  temperature?: number;     // Default: 0.7 (0.0 to 1.0)
  maxTokens?: number;       // Default: 2000
}
```

### Constructor Implementation

```typescript
constructor(apiKey: string, options?: OpenRouterOptions) {
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('OpenRouter API key is required');
  }
  
  this.apiKey = apiKey.trim();
  this.model = options?.model || "openai/gpt-4o-mini";
  this.baseUrl = options?.baseUrl || "https://openrouter.ai/api/v1";
  this.httpReferer = options?.httpReferer || "https://10x-cards.app";
  this.appTitle = options?.appTitle || "10x Cards";
  this.temperature = options?.temperature ?? 0.7;
  this.maxTokens = options?.maxTokens || 2000;
}
```

### Validation Rules

1. API key must not be empty or whitespace-only
2. Temperature must be between 0.0 and 1.0 (if provided)
3. Max tokens must be positive (if provided)
4. Model name should follow OpenRouter's format: `provider/model-name`

## 3. Public Methods and Fields

### 3.1 `generateFlashcards(text: string, maxCards: number): Promise<ParsedFlashcard[]>`

**Purpose**: Main entry point for generating flashcards from text using AI.

**Parameters**:
- `text` (string): Source text to generate flashcards from (1000-10000 characters)
- `maxCards` (number): Maximum number of flashcards to generate (1-50)

**Returns**: Promise resolving to an array of `ParsedFlashcard` objects

**Process Flow**:
1. Sanitize input text to prevent prompt injection
2. Build system and user prompts
3. Create JSON Schema for structured response
4. Call OpenRouter API with structured output format
5. Parse and validate the response
6. Return validated flashcards

**Error Handling**:
- Throws `OpenRouterError` for API failures
- Throws `ValidationError` for invalid responses
- Throws `ParseError` for malformed JSON

**Example Usage**:
```typescript
const client = new OpenRouterClient(apiKey);
const flashcards = await client.generateFlashcards(inputText, 10);
```

### 3.2 `validateApiKey(): Promise<boolean>`

**Purpose**: Verify that the API key is valid by making a test request.

**Returns**: Promise resolving to `true` if key is valid, `false` otherwise

**Implementation**:
```typescript
async validateApiKey(): Promise<boolean> {
  try {
    await this.callAPI({
      model: this.model,
      messages: [{ role: "user", content: "test" }],
      max_tokens: 1,
    });
    return true;
  } catch (error) {
    if (error instanceof OpenRouterError && error.statusCode === 401) {
      return false;
    }
    throw error;
  }
}
```

### 3.3 Public Interfaces

```typescript
export interface ParsedFlashcard {
  front: string;
  back: string;
}

export interface OpenRouterUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  total_cost?: number; // Cost in USD
}
```

## 4. Private Methods and Fields

### 4.1 Private Fields

```typescript
private readonly apiKey: string;
private readonly baseUrl: string;
private readonly model: string;
private readonly httpReferer: string;
private readonly appTitle: string;
private readonly temperature: number;
private readonly maxTokens: number;
```

### 4.2 `buildSystemPrompt(): string`

**Purpose**: Create the system message that defines the AI's role and output format.

**Returns**: System prompt string

**Implementation Details**:
- Clearly define the AI's role as a flashcard creation expert
- Specify flashcard quality criteria (clear questions, complete answers, active recall)
- Explain the expected JSON output format
- Emphasize strict JSON-only responses (no additional text)

**Example Output**:
```
You are an expert at creating high-quality flashcards for learning and memorization.

Your task is to analyze the provided text and generate flashcards that:
- Focus on the most important concepts, facts, and relationships
- Have clear, concise questions on the front
- Provide complete, accurate answers on the back
- Avoid ambiguity or trick questions
- Use active recall principles

You must respond ONLY with valid JSON matching the provided schema.
Do not include any explanations, comments, or text outside the JSON structure.
```

### 4.3 `buildUserPrompt(text: string, maxCards: number): string`

**Purpose**: Create the user message containing the text and generation instructions.

**Parameters**:
- `text`: Sanitized input text
- `maxCards`: Maximum number of flashcards to generate

**Returns**: User prompt string

**Implementation**:
```typescript
private buildUserPrompt(text: string, maxCards: number): string {
  return `Generate up to ${maxCards} flashcards from the following text. Focus on the most important concepts and information.

Text:
${text}`;
}
```

### 4.4 `buildResponseSchema(): object`

**Purpose**: Create JSON Schema for structured LLM responses.

**Returns**: JSON Schema object for response validation

**Implementation**:
```typescript
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
              maxLength: 200
            },
            back: {
              type: "string",
              description: "The answer or explanation for the flashcard",
              minLength: 1,
              maxLength: 500
            }
          },
          required: ["front", "back"],
          additionalProperties: false
        },
        minItems: 1,
        maxItems: 50
      }
    },
    required: ["flashcards"],
    additionalProperties: false
  };
}
```

### 4.5 `sanitizeText(text: string): string`

**Purpose**: Remove or escape potentially dangerous characters to prevent prompt injection.

**Parameters**:
- `text`: Raw user input text

**Returns**: Sanitized text safe for prompt inclusion

**Security Measures**:
1. Remove code block markers (\`\`\`)
2. Remove instruction markers ([INST], [/INST])
3. Remove role indicators (system:, assistant:, user:)
4. Limit consecutive newlines
5. Trim whitespace
6. Remove null bytes and control characters

**Implementation**:
```typescript
private sanitizeText(text: string): string {
  return text
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
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
}
```

### 4.6 `callAPI(request: OpenRouterRequest): Promise<OpenRouterResponse>`

**Purpose**: Execute HTTP request to OpenRouter API with proper headers and error handling.

**Parameters**:
- `request`: OpenRouter API request object

**Returns**: Promise resolving to OpenRouter API response

**HTTP Headers**:
```typescript
{
  "Authorization": `Bearer ${this.apiKey}`,
  "Content-Type": "application/json",
  "HTTP-Referer": this.httpReferer,
  "X-Title": this.appTitle
}
```

**Implementation**:
```typescript
private async callAPI(request: OpenRouterRequest): Promise<OpenRouterResponse> {
  const response = await fetch(`${this.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${this.apiKey}`,
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

    throw new OpenRouterError(
      errorMessage,
      response.status,
      errorBody
    );
  }

  return response.json();
}
```

### 4.7 `parseResponse(response: OpenRouterResponse): ParsedFlashcard[]`

**Purpose**: Extract and validate flashcards from the API response.

**Parameters**:
- `response`: Raw OpenRouter API response

**Returns**: Array of validated flashcards

**Validation Steps**:
1. Check that response has content
2. Extract message content from response
3. Parse JSON (with fallback for models that ignore structured output)
4. Validate each flashcard structure
5. Filter out invalid flashcards
6. Ensure at least one valid flashcard exists

**Implementation**:
```typescript
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
      throw new ParseError("No valid JSON found in response");
    }
    flashcardsData = JSON.parse(jsonMatch[0]);
  }

  if (!Array.isArray(flashcardsData.flashcards)) {
    throw new ParseError("Response does not contain flashcards array");
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
    throw new ParseError("No valid flashcards found in response");
  }

  return validFlashcards;
}
```

### 4.8 Private Interfaces

```typescript
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
```

## 5. Error Handling

### 5.1 Custom Error Classes

```typescript
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
  constructor(message: string, public readonly content?: string) {
    super(message);
    this.name = "ParseError";
  }
}

export class ValidationError extends Error {
  constructor(message: string, public readonly details?: unknown) {
    super(message);
    this.name = "ValidationError";
  }
}
```

### 5.2 Error Scenarios and Handling

| # | Scenario | Error Type | HTTP Status | Handling Strategy |
|---|----------|------------|-------------|-------------------|
| 1 | Invalid API key | `OpenRouterError` | 401 | Return clear error message, suggest checking API key configuration |
| 2 | Rate limit exceeded | `OpenRouterError` | 429 | Include retry-after header information, suggest waiting |
| 3 | Insufficient credits | `OpenRouterError` | 402 | Return payment required message with OpenRouter billing link |
| 4 | Model not available | `OpenRouterError` | 400 | Suggest alternative models, log for monitoring |
| 5 | Invalid request format | `OpenRouterError` | 400 | Log request details for debugging |
| 6 | Network timeout | `OpenRouterError` | 408/504 | Retry with exponential backoff (max 3 attempts) |
| 7 | Empty response content | `ParseError` | N/A | Log and throw error, may indicate model issue |
| 8 | Invalid JSON in response | `ParseError` | N/A | Attempt fallback parsing, log for investigation |
| 9 | No flashcards in response | `ParseError` | N/A | Return error indicating text may not be suitable for flashcards |
| 10 | All flashcards invalid | `ValidationError` | N/A | Log validation failures, suggest reviewing input text |
| 11 | Prompt injection detected | `ValidationError` | N/A | Sanitize and retry, log security event |
| 12 | Server error (5xx) | `OpenRouterError` | 500-599 | Retry with backoff, log for monitoring |

### 5.3 Error Handling Implementation

```typescript
async generateFlashcards(text: string, maxCards: number): Promise<ParsedFlashcard[]> {
  // Input validation
  if (!text || text.trim().length < 1000) {
    throw new ValidationError("Text must be at least 1000 characters");
  }
  if (maxCards < 1 || maxCards > 50) {
    throw new ValidationError("maxCards must be between 1 and 50");
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

    const response = await this.callAPI(request);
    return this.parseResponse(response);
  } catch (error) {
    // Re-throw custom errors as-is
    if (error instanceof OpenRouterError || 
        error instanceof ParseError || 
        error instanceof ValidationError) {
      throw error;
    }

    // Wrap unexpected errors
    throw new OpenRouterError(
      `Unexpected error during flashcard generation: ${error instanceof Error ? error.message : "Unknown error"}`,
      500
    );
  }
}
```

## 6. Security Considerations

### 6.1 API Key Management

| # | Security Measure | Implementation |
|---|------------------|----------------|
| 1 | Environment variables | Store API key in `.env` file, never commit to repository |
| 2 | Server-side only | Never expose API key to client-side code |
| 3 | Validation on init | Verify API key format and validity during initialization |

**Implementation**:
```typescript
// Environment configuration
const OPENROUTER_API_KEY = import.meta.env.OPENROUTER_API_KEY;

if (!OPENROUTER_API_KEY) {
  throw new Error("OPENROUTER_API_KEY environment variable is not set");
}

// In API endpoint only (never in client components)
const client = new OpenRouterClient(OPENROUTER_API_KEY);
```

### 6.2 Prompt Injection Prevention

| # | Attack Vector | Prevention Strategy |
|---|--------------|-------------------|
| 1 | System prompt override | Sanitize role indicators (system:, assistant:) |
| 2 | Instruction injection | Remove instruction markers ([INST], <\|im_start\|>) |
| 3 | Code execution | Remove code block markers (\`\`\`) |
| 4 | Context escape | Limit consecutive newlines |
| 5 | Control characters | Strip null bytes and control characters |

### 6.3 Input Validation

```typescript
// Validate text length (prevent excessive API costs)
const MIN_TEXT_LENGTH = 1000;
const MAX_TEXT_LENGTH = 10000;

if (text.length < MIN_TEXT_LENGTH || text.length > MAX_TEXT_LENGTH) {
  throw new ValidationError(
    `Text must be between ${MIN_TEXT_LENGTH} and ${MAX_TEXT_LENGTH} characters`
  );
}

// Validate maxCards (prevent abuse)
const MIN_CARDS = 1;
const MAX_CARDS = 50;

if (maxCards < MIN_CARDS || maxCards > MAX_CARDS) {
  throw new ValidationError(
    `maxCards must be between ${MIN_CARDS} and ${MAX_CARDS}`
  );
}
```

### 6.4 Rate Limiting

```typescript
// Application-level rate limiting (in AIGenerationService)
async checkDailyLimit(): Promise<void> {
  const DAILY_LIMIT = 50; // cards per day
  const usedToday = await this.getCardsGeneratedToday();
  
  if (usedToday >= DAILY_LIMIT) {
    throw new AIGenerationError(
      `Daily generation limit of ${DAILY_LIMIT} cards exceeded`,
      ErrorCodes.DAILY_LIMIT_EXCEEDED,
      403
    );
  }
}
```

### 6.5 Response Validation

| # | Validation Check | Purpose |
|---|-----------------|---------|
| 1 | Content exists | Prevent null/undefined responses |
| 2 | Valid JSON structure | Ensure parseable response |
| 3 | Required fields present | Verify front and back properties |
| 4 | Type checking | Ensure string types for content |
| 5 | Length constraints | Enforce max character limits |
| 6 | Non-empty content | Reject blank flashcards |

### 6.6 HTTPS Communication

All API communication must use HTTPS (enforced by OpenRouter API endpoint). Never downgrade to HTTP.

### 6.7 Error Message Sanitization

```typescript
// Don't expose sensitive details in user-facing errors
catch (error) {
  // Log full error details server-side
  console.error("OpenRouter API error:", error);
  
  // Return sanitized error to client
  throw new OpenRouterError(
    "Failed to generate flashcards. Please try again.",
    500
  );
}
```

## 7. Step-by-Step Implementation Plan

### Phase 1: Setup and Configuration

#### Step 1.1: Environment Configuration
1. Add OpenRouter API key to `.env` file:
   ```
   OPENROUTER_API_KEY=your_api_key_here
   ```
2. Update `.env.example` with placeholder:
   ```
   OPENROUTER_API_KEY=sk-or-v1-...
   ```
3. Verify `.gitignore` includes `.env`

#### Step 1.2: Create Type Definitions
1. Create interfaces file or update existing `openrouter.client.ts`
2. Define all private interfaces:
   - `OpenRouterMessage`
   - `OpenRouterRequest`
   - `OpenRouterResponse`
3. Define public interfaces:
   - `ParsedFlashcard`
   - `OpenRouterOptions`
   - `OpenRouterUsage`

#### Step 1.3: Create Error Classes
1. Define `OpenRouterError` class
2. Define `ParseError` class
3. Define `ValidationError` class
4. Export all error classes

### Phase 2: Core Service Implementation

#### Step 2.1: Constructor Implementation
1. Create class skeleton with private fields
2. Implement constructor with parameter validation
3. Add default values for optional parameters
4. Test constructor with various inputs

#### Step 2.2: Sanitization Method
1. Implement `sanitizeText()` private method
2. Add regex patterns for prompt injection prevention
3. Test with malicious inputs
4. Document security measures

#### Step 2.3: Prompt Building Methods
1. Implement `buildSystemPrompt()`:
   - Define AI role and responsibilities
   - Specify output format requirements
   - Emphasize JSON-only responses
2. Implement `buildUserPrompt()`:
   - Format text with clear instructions
   - Include maxCards constraint
   - Keep prompt concise

#### Step 2.4: JSON Schema Definition
1. Implement `buildResponseSchema()`:
   - Define flashcards array structure
   - Set property constraints (minLength, maxLength)
   - Mark required fields
   - Disable additional properties
2. Test schema with JSON Schema validator

### Phase 3: API Communication

#### Step 3.1: API Call Implementation
1. Implement `callAPI()` method:
   - Set up proper headers
   - Configure request body
   - Handle HTTP errors
   - Parse error responses
2. Add retry logic for transient failures:
   ```typescript
   async callAPIWithRetry(request: OpenRouterRequest, maxRetries = 3): Promise<OpenRouterResponse> {
     for (let attempt = 1; attempt <= maxRetries; attempt++) {
       try {
         return await this.callAPI(request);
       } catch (error) {
         if (attempt === maxRetries) throw error;
         if (error instanceof OpenRouterError && error.statusCode >= 500) {
           await this.sleep(Math.pow(2, attempt) * 1000);
           continue;
         }
         throw error;
       }
     }
   }
   ```

#### Step 3.2: Response Parsing
1. Implement `parseResponse()` method:
   - Extract content from response
   - Parse JSON with error handling
   - Add fallback parsing for non-compliant responses
   - Validate flashcard structure
   - Filter invalid entries
2. Add comprehensive logging for debugging

### Phase 4: Main Method Implementation

#### Step 4.1: Generate Flashcards Method
1. Implement `generateFlashcards()` public method:
   - Add input validation
   - Call sanitization
   - Build prompts and schema
   - Create request with structured output
   - Execute API call
   - Parse and return results
2. Add try-catch with proper error handling
3. Test with various inputs and edge cases

#### Step 4.2: Optional Utility Methods
1. Implement `validateApiKey()` for health checks
2. Consider adding `getModelInfo()` for model capabilities
3. Add `estimateTokens()` for cost estimation (if needed)

### Phase 5: Integration with Existing Service (1-2 hours)

#### Step 5.1: Update AIGenerationService
1. Update constructor to accept real API key:
   ```typescript
   constructor(
     private readonly supabase: SupabaseClient,
     private readonly userId: string,
     openRouterApiKey: string
   ) {
     this.openRouterClient = new OpenRouterClient(openRouterApiKey);
   }
   ```

#### Step 5.2: Remove Mock Implementation
1. Remove `generateMockFlashcards()` method
2. Update `generateFlashcards()` to call real API
3. Remove mock-related comments

#### Step 5.3: Update API Endpoint
1. Update `src/pages/api/ai/generate.ts`:
   - Get API key from environment
   - Pass to AIGenerationService constructor
   - Remove mock response code
   - Uncomment production implementation
2. Test full integration flow


### Phase 8: Optimization and Enhancement (Optional, 1-2 hours)

#### Step 8.1: Performance Optimization
1. Implement response caching (if appropriate)
2. Optimize token usage
3. Add request batching (if needed)

#### Step 8.2: Feature Enhancements
1. Support multiple models
2. Add temperature adjustment per request
3. Implement streaming responses (if supported)
4. Add progress callbacks for long operations

## Implementation Checklist

Use this checklist to track progress:

- [ ] Environment configuration (.env, .env.example)
- [ ] Type definitions created
- [ ] Error classes implemented
- [ ] Constructor with validation
- [ ] sanitizeText() method
- [ ] buildSystemPrompt() method
- [ ] buildUserPrompt() method
- [ ] buildResponseSchema() method
- [ ] callAPI() method with error handling
- [ ] parseResponse() method with validation
- [ ] generateFlashcards() main method
- [ ] Integration with AIGenerationService
- [ ] API endpoint updated

## Model Configuration Examples

### Example 1: Using OpenAI GPT-4 (Higher Quality)

```typescript
const client = new OpenRouterClient(apiKey, {
  model: "openai/gpt-4o",
  temperature: 0.7,
  maxTokens: 3000,
  httpReferer: "https://10x-cards.app",
  appTitle: "10x Cards"
});
```

### Example 2: Using Anthropic Claude (Cost-Effective)

```typescript
const client = new OpenRouterClient(apiKey, {
  model: "anthropic/claude-3-haiku",
  temperature: 0.8,
  maxTokens: 2000
});
```

### Example 3: Using Google Gemini (Free Tier)

```typescript
const client = new OpenRouterClient(apiKey, {
  model: "google/gemini-flash-1.5",
  temperature: 0.7,
  maxTokens: 2000
});
```

## Response Format Configuration

### Correct response_format Implementation

The `response_format` parameter must follow OpenRouter's structured output specification:

```typescript
{
  type: "json_schema",
  json_schema: {
    name: "flashcard_generation",      // Schema identifier
    strict: true,                       // Enforce strict schema adherence
    schema: {                           // The actual JSON Schema
      type: "object",
      properties: {
        flashcards: {
          type: "array",
          items: {
            type: "object",
            properties: {
              front: { type: "string" },
              back: { type: "string" }
            },
            required: ["front", "back"],
            additionalProperties: false
          }
        }
      },
      required: ["flashcards"],
      additionalProperties: false
    }
  }
}
```

### Key Points for response_format:

1. **Type**: Must be `"json_schema"` for structured outputs
2. **Schema Name**: Descriptive identifier for the schema
3. **Strict Mode**: Set to `true` to enforce exact schema compliance
4. **Schema Object**: Complete JSON Schema definition
5. **Additional Properties**: Set to `false` to prevent extra fields
6. **Required Fields**: Explicitly list all mandatory fields

### Benefits of Structured Output:

1. **Guaranteed Format**: LLM must respond in exact JSON format
2. **No Parsing Errors**: Eliminates need for regex extraction
3. **Type Safety**: Schema validates data types automatically
4. **Reduced Tokens**: AI doesn't add explanatory text
5. **Better Quality**: Forces AI to follow structure precisely


## Success Criteria

The implementation is complete when:

1. ✅ Service generates valid flashcards from text input
2. ✅ All error scenarios are handled gracefully
3. ✅ Input sanitization prevents prompt injection
4. ✅ API key is properly secured
5. ✅ Response validation filters invalid flashcards
8. ✅ No mock data remains in production code

## Additional Resources

- [OpenRouter API Documentation](https://openrouter.ai/docs)
- [OpenRouter Models List](https://openrouter.ai/models)
- [JSON Schema Documentation](https://json-schema.org/)
- [Prompt Engineering Guide](https://www.promptingguide.ai/)
- [OWASP Prompt Injection Prevention](https://owasp.org/www-project-prompt-injection/)
