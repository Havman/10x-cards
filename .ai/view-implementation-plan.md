# API Endpoint Implementation Plan: POST /api/ai/generate

## 1. Endpoint Overview

This endpoint generates flashcards from user-provided text using AI (via OpenRouter). The generated flashcards are created with "draft" status, allowing users to review and accept them before they become part of their active study deck. The endpoint enforces daily generation limits (50 cards per day) to prevent abuse and manage costs.

**Key Features:**
- AI-powered flashcard generation from text
- Daily generation limit enforcement (50 cards/day)
- Draft status for AI-generated cards
- Ownership validation (user must own the deck)
- Comprehensive error handling for AI service failures

## 2. Request Details

- **HTTP Method:** POST
- **URL Structure:** `/api/ai/generate`
- **Authentication:** Required (Bearer token in Authorization header)

### Parameters

**Request Body (JSON):**

| Parameter  | Type    | Required | Constraints            | Default | Description                          |
|------------|---------|----------|------------------------|---------|--------------------------------------|
| text       | string  | Yes      | min: 50, max: 10000    | -       | Source text for generating flashcards |
| deck_id    | integer | Yes      | must exist, user owned | -       | Target deck ID for generated cards    |
| max_cards  | integer | No       | min: 1, max: 50        | 10      | Maximum number of cards to generate   |

**Headers:**
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

### Validation Schema (Zod)

```typescript
const AIGenerateRequestSchema = z.object({
  text: z.string()
    .min(ValidationConstraints.aiGeneration.textMinLength, 
      "Text must be at least 50 characters long")
    .max(ValidationConstraints.aiGeneration.textMaxLength,
      "Text must not exceed 10000 characters"),
  deck_id: z.number().int().positive("Deck ID must be a positive integer"),
  max_cards: z.number().int()
    .min(ValidationConstraints.aiGeneration.maxCardsMin)
    .max(ValidationConstraints.aiGeneration.maxCardsMax)
    .optional()
    .default(ValidationConstraints.aiGeneration.maxCardsDefault)
});
```

## 3. Used Types

### Request Types
- `AIGenerateRequest` - Input data structure

### Response Types
- `AIGenerateResponse` - Success response wrapper
- `AIGeneratedFlashcard` - Individual generated flashcard data
- `ApiErrorResponse` - Error response structure

### Database Entity Types
- `AIGenerationLogInsert` - For logging generation attempts
- `FlashcardInsert` - For creating draft flashcards
- `Deck` - For deck ownership validation

### Internal Types
```typescript
interface OpenRouterRequest {
  model: string;
  messages: Array<{
    role: 'system' | 'user';
    content: string;
  }>;
  temperature?: number;
  max_tokens?: number;
}

interface OpenRouterResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface ParsedFlashcard {
  front: string;
  back: string;
}
```

## 4. Response Details

### Success Response (201 Created)

```json
{
  "success": true,
  "data": {
    "generation_id": 123,
    "deck_id": 45,
    "flashcards": [
      {
        "id": 1001,
        "front": "What is TypeScript?",
        "back": "A typed superset of JavaScript that compiles to plain JavaScript",
        "status": "draft",
        "source": "ai"
      }
    ],
    "cards_generated": 5
  }
}
```

### Error Responses

| Status Code | Error Code             | Description                                  |
|-------------|------------------------|----------------------------------------------|
| 400         | INVALID_INPUT          | Text too short/long, invalid parameters      |
| 401         | UNAUTHORIZED           | Missing or invalid authentication token      |
| 403         | DAILY_LIMIT_EXCEEDED   | User exceeded daily generation limit         |
| 404         | NOT_FOUND              | Deck doesn't exist or doesn't belong to user |
| 503         | AI_SERVICE_ERROR       | OpenRouter API is unavailable                |
| 500         | INTERNAL_ERROR         | Database or unexpected server error          |

**Example Error Response (403 Forbidden):**
```json
{
  "success": false,
  "error": {
    "code": "DAILY_LIMIT_EXCEEDED",
    "message": "You have reached your daily AI generation limit of 50 cards. Try again tomorrow.",
    "reset_at": "2025-10-20T00:00:00Z"
  }
}
```

## 5. Data Flow

### High-Level Flow
1. **Request Reception** → Astro API endpoint receives POST request
2. **Authentication** → Middleware validates JWT token from Authorization header
3. **Input Validation** → Zod schema validates request body
4. **Ownership Check** → Verify deck exists and belongs to authenticated user
5. **Rate Limit Check** → Check daily generation limit (via service)
6. **AI Generation** → Call OpenRouter API with formatted prompt (via service)
7. **Response Parsing** → Parse AI response into flashcard format
8. **Database Operations** → Create draft flashcards and log generation
9. **Response** → Return created flashcards to client

### Detailed Data Flow

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ POST /api/ai/generate
       │ {text, deck_id, max_cards}
       ▼
┌─────────────────────────────────────────┐
│  Astro Middleware (src/middleware)      │
│  - Validate JWT token                   │
│  - Attach user to context.locals        │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  API Handler (src/pages/api/ai/        │
│              generate.ts)               │
│  - Validate input with Zod              │
│  - Extract user from context.locals     │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  Deck Validation                        │
│  - Query deck by ID                     │
│  - Verify user_id matches auth user     │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  AI Generation Service                  │
│  (src/lib/services/                     │
│   ai-generation.service.ts)             │
│                                         │
│  1. checkDailyLimit(user_id)           │
│     - Query ai_generation_logs          │
│     - Sum cards_count for today         │
│     - Throw if >= 50                    │
│                                         │
│  2. generateFlashcards(text, max_cards) │
│     - Build OpenRouter prompt           │
│     - Call OpenRouter API               │
│     - Parse JSON response               │
│     - Validate flashcard format         │
│                                         │
│  3. saveFlashcards(deck_id, cards)     │
│     - Insert flashcards (draft status)  │
│     - Insert generation log             │
│     - Return created flashcards         │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  Response Formatting                    │
│  - Map to AIGenerateResponse            │
│  - Return 201 Created                   │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────┐
│   Client    │
└─────────────┘
```

### Database Interactions

1. **Deck Validation Query:**
   ```sql
   SELECT id, user_id, name 
   FROM decks 
   WHERE id = $1
   ```

2. **Daily Limit Check Query:**
   ```sql
   SELECT COALESCE(SUM(cards_count), 0) as total_today
   FROM ai_generation_logs
   WHERE user_id = $1 
     AND DATE(generated_at) = CURRENT_DATE
   ```

3. **Insert Flashcards:**
   ```sql
   INSERT INTO flashcards (deck_id, front, back, status, source)
   VALUES ($1, $2, $3, 'draft', 'ai')
   RETURNING *
   ```

4. **Log Generation:**
   ```sql
   INSERT INTO ai_generation_logs (user_id, cards_count)
   VALUES ($1, $2)
   RETURNING id
   ```

## 6. Security Considerations

### Authentication & Authorization
- **Token Validation:** JWT token verified by Astro middleware before request reaches handler
- **User Context:** User ID extracted from validated token and attached to `context.locals`
- **Ownership Verification:** Deck must belong to authenticated user (check `deck.user_id === user.id`)
- **RLS Policies:** Leverage Supabase RLS to enforce data access at database level

### Input Validation & Sanitization
- **Schema Validation:** Use Zod to validate all input parameters
- **Text Length Limits:** Enforce min 50 chars, max 10000 chars to prevent abuse
- **Max Cards Limit:** Cap at 50 cards per request to control costs
- **Prompt Injection Prevention:** Sanitize text input before sending to AI
  - Strip/escape special characters that could manipulate AI behavior
  - Consider using a whitelist approach for allowed characters

### Rate Limiting
- **Daily Limit:** 50 cards per user per day (enforced via `ai_generation_logs` table)
- **Limit Check:** Query sum of `cards_count` for current date before generating
- **Reset Time:** Daily limits reset at midnight (include `reset_at` in error response)

### API Key Security
- **Environment Variables:** Store OpenRouter API key in environment variables
- **Never Expose:** Ensure API key never sent to client or logged
- **Key Rotation:** Support easy key rotation without code changes

### Data Protection
- **No Sensitive Data Logging:** Avoid logging user input text or generated flashcards
- **Error Messages:** Generic error messages to prevent information disclosure
- **HTTPS Only:** Ensure endpoint only accessible via HTTPS in production

## 7. Error Handling

### Error Hierarchy

```typescript
class AIGenerationError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public statusCode: number,
    public field?: string,
    public metadata?: Record<string, any>
  ) {
    super(message);
    this.name = 'AIGenerationError';
  }
}
```

### Specific Error Scenarios

#### 1. Invalid Input (400 Bad Request)
**Trigger:** Validation fails
**Response:**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_INPUT",
    "message": "Text must be at least 50 characters long",
    "field": "text"
  }
}
```
**Handling:** Catch Zod validation errors, map to structured error response

#### 2. Unauthorized (401 Unauthorized)
**Trigger:** Missing or invalid JWT token
**Response:**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```
**Handling:** Middleware returns 401 before request reaches handler

#### 3. Daily Limit Exceeded (403 Forbidden)
**Trigger:** User has generated 50+ cards today
**Response:**
```json
{
  "success": false,
  "error": {
    "code": "DAILY_LIMIT_EXCEEDED",
    "message": "You have reached your daily AI generation limit of 50 cards. Try again tomorrow.",
    "reset_at": "2025-10-20T00:00:00Z"
  }
}
```
**Handling:** Service checks limit before AI call, throws specific error

#### 4. Deck Not Found (404 Not Found)
**Trigger:** Deck doesn't exist or doesn't belong to user
**Response:**
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Deck not found or access denied"
  }
}
```
**Handling:** Query deck with user_id filter, return 404 if no results

#### 5. AI Service Error (503 Service Unavailable)
**Trigger:** OpenRouter API timeout, rate limit, or error
**Response:**
```json
{
  "success": false,
  "error": {
    "code": "AI_SERVICE_ERROR",
    "message": "AI service is temporarily unavailable. Please try again later."
  }
}
```
**Handling:** 
- Implement retry logic (3 attempts with exponential backoff)
- Log error details for monitoring
- Return generic message to user

#### 6. Internal Server Error (500 Internal Error)
**Trigger:** Database errors, unexpected exceptions
**Response:**
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred. Please try again."
  }
}
```
**Handling:**
- Log full error stack trace
- Return generic message to user
- Monitor and alert on 500 errors

### Error Logging Strategy
```typescript
// Log errors with context but protect sensitive data
logger.error('AI generation failed', {
  user_id: user.id,
  deck_id: deck_id,
  error_code: error.code,
  error_message: error.message,
  // DO NOT log: text content, API keys
});
```

## 8. Performance Considerations

### Potential Bottlenecks
1. **OpenRouter API Latency:** AI generation can take 5-15 seconds
2. **Database Writes:** Bulk inserting flashcards with individual INSERTs
3. **Daily Limit Query:** Aggregating all generation logs for the day

### Optimization Strategies

#### 1. Async/Non-Blocking Operations
- Use async/await for all I/O operations
- Don't block on non-critical operations

#### 2. Database Optimization
- **Batch Inserts:** Use single query with multiple values for flashcard creation
  ```typescript
  supabase.from('flashcards').insert(flashcardsArray)
  ```
- **Index Usage:** Ensure `idx_ai_generation_logs_user_date` is used for limit checks
- **Connection Pooling:** Leverage Supabase connection pooling

#### 3. Caching Daily Limit
- Consider caching daily card count in Redis/memory
- Invalidate cache at midnight or on generation
- Reduces database queries for limit checks

#### 4. AI Request Optimization
- **Streaming Response:** Consider streaming flashcards as they're generated
- **Model Selection:** Use faster/cheaper models for simple content
- **Prompt Optimization:** Minimize token usage in prompts

#### 5. Timeout Handling
- Set reasonable timeout for OpenRouter API (30 seconds)
- Fail fast if AI service is unresponsive
- Allow user to retry with backoff

### Performance Targets
- **P95 Response Time:** < 10 seconds (including AI generation)
- **P99 Response Time:** < 20 seconds
- **Success Rate:** > 99% (excluding AI service failures)
- **Database Query Time:** < 100ms per query

## 9. Implementation Steps

### Step 1: Create AI Generation Service

**File:** `src/lib/services/ai-generation.service.ts`

**Tasks:**
1. Create service class with dependency injection for Supabase client
2. Implement `checkDailyLimit(userId: string): Promise<void>`
   - Query `ai_generation_logs` for today's total
   - Throw `AIGenerationError` with code `DAILY_LIMIT_EXCEEDED` if >= 50
   - Include `reset_at` timestamp in error metadata
3. Implement `generateFlashcards(text: string, maxCards: number): Promise<ParsedFlashcard[]>`
   - Build system prompt and user prompt for OpenRouter
   - Call OpenRouter API with retry logic (3 attempts, exponential backoff)
   - Parse JSON response from AI
   - Validate flashcard format (must have front and back)
   - Handle AI service errors gracefully
4. Implement `saveFlashcards(deckId: number, userId: string, flashcards: ParsedFlashcard[]): Promise<Flashcard[]>`
   - Insert flashcards with `status: 'draft'` and `source: 'ai'`
   - Insert generation log with `cards_count`
   - Use transaction to ensure atomicity
   - Return created flashcards
5. Implement `generateAndSaveFlashcards(userId: string, deckId: number, text: string, maxCards: number): Promise<AIGenerateResponse>`
   - Orchestrate the full flow
   - Call checkDailyLimit, generateFlashcards, saveFlashcards in sequence
   - Handle errors at each step
   - Return formatted response

**Dependencies:**
```typescript
import { SupabaseClient } from '@/db/supabase.client';
import type { FlashcardInsert, AIGenerationLogInsert, AIGenerateResponse } from '@/types';
```

### Step 2: Create OpenRouter Client/Helper

**File:** `src/lib/services/openrouter.client.ts`

**Tasks:**
1. Create `OpenRouterClient` class
2. Implement `generateFlashcards(text: string, maxCards: number): Promise<string>`
   - Build request payload with model, messages, temperature
   - Set appropriate headers (Authorization, HTTP-Referer, X-Title)
   - Make HTTP POST request to OpenRouter API
   - Handle rate limits, timeouts, and errors
   - Return raw AI response (JSON string)
3. Implement retry logic with exponential backoff
4. Add request/response logging for debugging
5. Implement timeout handling (30s default)

**Configuration:**
```typescript
const OPENROUTER_CONFIG = {
  apiKey: import.meta.env.OPENROUTER_API_KEY,
  baseUrl: 'https://openrouter.ai/api/v1',
  model: 'openai/gpt-4-turbo-preview', // Configurable
  temperature: 0.7,
  timeout: 30000, // 30 seconds
  maxRetries: 3,
};
```

**Prompt Template:**
```typescript
const SYSTEM_PROMPT = `You are a flashcard generator. Generate educational flashcards from the provided text. Each flashcard should have a clear question (front) and a concise answer (back). Return ONLY a JSON array of flashcards with this structure: [{"front": "question", "back": "answer"}]. Generate up to {maxCards} flashcards.`;
```

### Step 3: Create Validation Schemas

**File:** `src/lib/schemas/ai-generation.schema.ts`

**Tasks:**
1. Create Zod schema for `AIGenerateRequest`
2. Export schema and inferred TypeScript type
3. Add custom error messages for each validation rule
4. Ensure validation matches `ValidationConstraints` from types.ts

```typescript
import { z } from 'zod';
import { ValidationConstraints } from '@/types';

export const AIGenerateRequestSchema = z.object({
  text: z.string()
    .min(ValidationConstraints.aiGeneration.textMinLength, {
      message: 'Text must be at least 50 characters long'
    })
    .max(ValidationConstraints.aiGeneration.textMaxLength, {
      message: 'Text must not exceed 10000 characters'
    }),
  deck_id: z.number().int().positive({
    message: 'Deck ID must be a positive integer'
  }),
  max_cards: z.number().int()
    .min(ValidationConstraints.aiGeneration.maxCardsMin, {
      message: 'Must generate at least 1 card'
    })
    .max(ValidationConstraints.aiGeneration.maxCardsMax, {
      message: 'Cannot generate more than 50 cards'
    })
    .optional()
    .default(ValidationConstraints.aiGeneration.maxCardsDefault)
});

export type AIGenerateRequestInput = z.infer<typeof AIGenerateRequestSchema>;
```

### Step 4: Create API Endpoint Handler

**File:** `src/pages/api/ai/generate.ts`

**Tasks:**
1. Set `export const prerender = false` for SSR
2. Implement `POST` handler function
3. Extract authenticated user from `context.locals.user`
4. Extract Supabase client from `context.locals.supabase`
5. Parse and validate request body using Zod schema
6. Verify deck ownership:
   ```typescript
   const { data: deck } = await supabase
     .from('decks')
     .select('id, user_id')
     .eq('id', deck_id)
     .single();
   
   if (!deck || deck.user_id !== user.id) {
     return new Response(JSON.stringify({
       success: false,
       error: {
         code: 'NOT_FOUND',
         message: 'Deck not found or access denied'
       }
     }), { status: 404 });
   }
   ```
7. Initialize AI generation service
8. Call `generateAndSaveFlashcards` method
9. Format and return success response (201 Created)
10. Implement comprehensive error handling for all error types
11. Map errors to appropriate HTTP status codes and error responses

**Error Handling Structure:**
```typescript
try {
  // Main logic
} catch (error) {
  if (error instanceof z.ZodError) {
    return new Response(JSON.stringify({
      success: false,
      error: {
        code: 'INVALID_INPUT',
        message: error.errors[0].message,
        field: error.errors[0].path.join('.')
      }
    }), { status: 400 });
  }
  
  if (error instanceof AIGenerationError) {
    return new Response(JSON.stringify({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        ...error.metadata
      }
    }), { status: error.statusCode });
  }
  
  // Log unexpected errors
  console.error('Unexpected error in AI generation:', error);
  
  return new Response(JSON.stringify({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred'
    }
  }), { status: 500 });
}
```

### Step 5: Update Environment Variables

**Files:** `.env`, `.env.example`

**Tasks:**
1. Add `OPENROUTER_API_KEY` to environment variables
2. Document required environment variables in `.env.example`
3. Update documentation with setup instructions

```bash
# .env.example
OPENROUTER_API_KEY=your_openrouter_api_key_here
```

### Step 6: Create Unit Tests

**File:** `src/lib/services/__tests__/ai-generation.service.test.ts`

**Tasks:**
1. Test `checkDailyLimit` with various scenarios:
   - User under limit (should pass)
   - User at limit (should throw)
   - User over limit (should throw)
   - New user with no history (should pass)
2. Test `generateFlashcards`:
   - Valid AI response (should parse correctly)
   - Invalid JSON response (should handle error)
   - API timeout (should retry and fail gracefully)
   - API error response (should throw AI_SERVICE_ERROR)
3. Test `saveFlashcards`:
   - Successful save (should return created flashcards)
   - Database error (should throw)
4. Mock Supabase client and OpenRouter client
5. Use test fixtures for consistent test data

### Step 7: Create Integration Tests

**File:** `src/pages/api/ai/__tests__/generate.test.ts`

**Tasks:**
1. Test full endpoint with authenticated requests
2. Test scenarios:
   - Successful generation (201)
   - Invalid input (400)
   - Unauthorized request (401)
   - Daily limit exceeded (403)
   - Deck not found (404)
   - Deck ownership violation (404)
   - AI service error (503)
3. Use test database with fixtures
4. Mock OpenRouter API calls

### Step 8: Add Monitoring and Logging

**Tasks:**
1. Add structured logging for:
   - AI generation requests (without sensitive data)
   - Daily limit violations
   - AI service errors
   - Performance metrics (response time)
2. Set up alerts for:
   - High error rate (>5%)
   - Slow response times (>20s)
   - AI service failures
3. Track metrics:
   - Cards generated per day
   - Average generation time
   - Success rate
   - Error rate by type

**Example Logging:**
```typescript
logger.info('AI generation started', {
  user_id: user.id,
  deck_id: deck_id,
  max_cards: max_cards,
  text_length: text.length
});

logger.info('AI generation completed', {
  user_id: user.id,
  deck_id: deck_id,
  cards_generated: flashcards.length,
  duration: Date.now() - startTime
});
```

### Step 9: Update Documentation

**Files:** `README.md`, API documentation

**Tasks:**
1. Document the new endpoint in API documentation
2. Add usage examples
3. Document error codes and responses
4. Add setup instructions for OpenRouter API key
5. Document daily limits and rate limiting

### Step 10: Manual Testing Checklist

Before deployment, manually test:
- [ ] Generate flashcards with valid input
- [ ] Test with text at min/max length boundaries
- [ ] Test with max_cards at boundaries (1, 50)
- [ ] Test daily limit enforcement (generate 50+ cards)
- [ ] Test with non-existent deck
- [ ] Test with deck owned by another user
- [ ] Test without authentication token
- [ ] Test with invalid authentication token
- [ ] Test with malformed JSON body
- [ ] Test AI service timeout handling
- [ ] Verify flashcards are created with 'draft' status
- [ ] Verify generation is logged in ai_generation_logs
- [ ] Verify daily limit resets at midnight

---

## Implementation Checklist

- [ ] Step 1: Create AI Generation Service
- [ ] Step 2: Create OpenRouter Client/Helper
- [ ] Step 3: Create Validation Schemas
- [ ] Step 4: Create API Endpoint Handler
- [ ] Step 5: Update Environment Variables
- [ ] Step 6: Create Unit Tests
- [ ] Step 7: Create Integration Tests
- [ ] Step 8: Add Monitoring and Logging
- [ ] Step 9: Update Documentation
- [ ] Step 10: Manual Testing Checklist
