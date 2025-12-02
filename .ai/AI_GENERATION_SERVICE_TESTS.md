# AI Generation Service - Comprehensive Unit Tests

## Overview

This document describes the comprehensive unit test suite created for the AI Generation Service, following Vitest best practices and covering all key business rules and edge cases.

## Test Coverage

### Total Tests: **29 test cases** across 5 main areas

---

## 1. Daily Limit Enforcement (8 tests)

### Business Rule
- Users can generate maximum 50 flashcards per day
- Limit resets at midnight (00:00:00 UTC)
- Tracks usage across all generation sessions

### Test Cases

#### ✅ Happy Path Tests
1. **User with 0 cards today** - Should allow generation
2. **User under limit (25/50)** - Should allow generation  
3. **User at 49/50 cards** - Should allow generation (one below limit)

#### ❌ Error Cases
4. **User exactly at limit (50/50)** - Should reject with `DAILY_LIMIT_EXCEEDED`
5. **User over limit (75/50)** - Should reject with error details
6. **Database query fails** - Should throw `INTERNAL_ERROR`

#### 🔍 Edge Cases
7. **Midnight boundary test** - Reset time calculation at 23:59:00
8. **Date range query verification** - Ensures correct UTC date range

### Key Assertions
```typescript
- Error code: ErrorCodes.DAILY_LIMIT_EXCEEDED
- Status code: 403
- Error details include: daily_limit, used_today, remaining, reset_at
- Reset time is midnight next day (00:00:00 UTC)
```

---

## 2. Deck Ownership Verification (4 tests)

### Business Rule
- Users can only generate flashcards for decks they own
- Row Level Security (RLS) policies enforced at database level
- Returns 404 for non-existent or unauthorized decks

### Test Cases

#### ✅ Happy Path
1. **Deck exists and belongs to user** - Should pass verification

#### ❌ Error Cases
2. **Deck does not exist** - Should reject with `NOT_FOUND` (404)
3. **Deck belongs to different user** - RLS filters out data, returns 404
4. **Query parameter verification** - Ensures correct user_id and deck_id filtering

### Key Assertions
```typescript
- Error code: ErrorCodes.NOT_FOUND
- Status code: 404
- Error details include: deck_id
- Query filters by both deck.id AND deck.user_id
```

---

## 3. AI Flashcard Generation (3 tests)

### Business Rule
- Integrates with OpenRouter API for AI-powered generation
- Handles API failures gracefully
- Returns structured ParsedFlashcard array

### Test Cases

#### ✅ Happy Path
1. **Successful generation** - Returns array of flashcards with correct structure

#### ❌ Error Cases
2. **OpenRouter API throws Error** - Wraps in `AI_SERVICE_ERROR` (503)
3. **Non-Error exceptions** - Handles unknown error types gracefully

### Key Assertions
```typescript
- Error code: ErrorCodes.AI_SERVICE_ERROR
- Status code: 503
- Error message: "AI service failed to generate flashcards"
- Error details contain original error message
```

---

## 4. Save Flashcards (5 tests)

### Business Rule
- Saves generated flashcards to database with proper defaults
- Creates generation log for tracking
- Uses FSRS default values: ease_factor=2.5, interval=0
- All cards start as "draft" status with "ai" source

### Test Cases

#### ✅ Happy Path
1. **Save flashcards successfully** - Returns flashcards with IDs and log ID
2. **FSRS defaults verification** - Ensures correct ease_factor and interval

#### ❌ Error Cases
3. **Flashcard insert fails** - Throws `INTERNAL_ERROR` (500)
4. **Generation log fails** - Continues execution, returns logId=0

#### 🔍 Edge Cases
5. **Empty flashcard array** - Handles gracefully, logs 0 cards

### Key Assertions
```typescript
- Default values: status="draft", source="ai", ease_factor=2.5, interval=0
- Log insert failure doesn't fail entire operation
- Returns: { flashcards: Flashcard[], generationLogId: number }
```

---

## 5. Full Workflow Integration (6 tests)

### Business Rule
- Complete end-to-end generation process
- **Order of operations:**
  1. Check daily limit
  2. Verify deck ownership
  3. Generate flashcards with AI
  4. Save to database
  5. Log generation

- **Fail-fast**: Stop at first error

### Test Cases

#### ✅ Happy Path
1. **Complete workflow** - All steps succeed, returns AIGenerateResponse with inline snapshot

#### ❌ Error Cases - Fail Fast
2. **Daily limit exceeded** - Stops immediately, doesn't call AI
3. **Deck ownership fails** - Stops before AI generation
4. **AI returns empty array** - Throws `AI_SERVICE_ERROR`
5. **Database save fails** - Throws after AI generation (transaction-like)

#### 🔍 Inline Snapshot Test
6. **Response structure verification** - Uses `toMatchInlineSnapshot()` for type-safe assertions

### Key Assertions
```typescript
interface AIGenerateResponse {
  generation_id: number;
  deck_id: number;
  flashcards: Array<{
    id: number;
    front: string;
    back: string;
    status: "draft";
    source: "ai";
  }>;
  cards_generated: number;
}
```

---

## 6. Error Handling & Edge Cases (3 tests)

### Test Cases
1. **Error code preservation** - Custom error codes not lost through chain
2. **Contextual error details** - Errors include relevant context (deck_id, etc.)
3. **Type safety** - All errors are AIGenerationError instances

---

## Vitest Best Practices Applied

### ✅ 1. Arrange-Act-Assert Pattern
Every test follows clear AAA structure:
```typescript
// Arrange
setupDateMocks(new Date("2025-11-26T10:00:00Z"));
vi.mocked(mockSupabase.from).mockReturnValue(...)

// Act
const result = await service.checkDailyLimit();

// Assert
expect(result).toBe(...);
```

### ✅ 2. vi.mock() Factory Pattern
Module-level mocking with factory:
```typescript
vi.mock("@/lib/services/openrouter.client", () => ({
  OpenRouterClient: vi.fn().mockImplementation(() => ({
    generateFlashcards: vi.fn(),
  })),
}));
```

### ✅ 3. Setup Files
Global mocks in `setup.ts`:
- Environment variables
- Browser APIs (ResizeObserver, IntersectionObserver)
- Window.matchMedia

### ✅ 4. Inline Snapshots
Type-safe assertions with visual diffs:
```typescript
expect(result).toMatchInlineSnapshot(
  {
    generation_id: expect.any(Number),
    deck_id: expect.any(Number),
  },
  `{ "cards_generated": 2, ... }`
);
```

### ✅ 5. beforeEach/afterEach
Clean slate for each test:
```typescript
beforeEach(() => {
  mockSupabase = createMockSupabaseClient();
  vi.clearAllMocks();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});
```

### ✅ 6. Fake Timers
Deterministic date handling:
```typescript
vi.useFakeTimers();
vi.setSystemTime(new Date("2025-11-26T10:00:00Z"));
```

### ✅ 7. Type-Safe Mocks
Preserve type signatures:
```typescript
mockSupabase = createMockSupabaseClient();
service = new AIGenerationService(mockSupabase as never, userId, apiKey);
```

### ✅ 8. Descriptive Test Names
Clear intent from test name:
- "should pass when user has generated 0 cards today"
- "should reject when exactly at limit (50/50 cards)"
- "should calculate reset time correctly at midnight boundary"

---

## Test Execution

### Run All Tests
```bash
npm test                    # Watch mode
npm run test:run            # Run once
npm run test:ui             # Visual UI
```

### Run Specific Tests
```bash
npm test -- -t "checkDailyLimit"          # Filter by name
npm test -- ai-generation.service.test.ts  # Specific file
```

### Coverage
```bash
npm run test:coverage       # Generate coverage report
```

### Watch Mode Workflow
```bash
npm test -- --watch         # Auto-run on changes
npm test -- -t "daily"      # Focus on specific tests
```

---

## Business Rules Verified

### ✅ Daily Limit (50 cards/day)
- Exact limit enforcement
- Midnight reset calculation
- Error details with reset time

### ✅ Deck Ownership
- RLS policy respect
- 404 for unauthorized access
- User-specific filtering

### ✅ AI Integration
- OpenRouter client error wrapping
- Graceful failure handling
- Type-safe flashcard parsing

### ✅ Database Operations
- FSRS default values
- Transaction-like behavior
- Logging resilience

### ✅ Workflow Orchestration
- Fail-fast on errors
- Step-by-step validation
- Complete response structure

---

## Edge Cases Covered

1. **Midnight boundary** - Date calculations at 23:59:59
2. **Exactly at limit** - 50/50 cards (boundary condition)
3. **One below limit** - 49/50 cards (should pass)
4. **Empty AI response** - AI returns []
5. **Empty flashcard save** - Saving [] cards
6. **Log failure** - Generation log fails but cards saved
7. **RLS filtering** - Database returns no data (not error)
8. **Non-Error exceptions** - Unknown error types from AI

---

## Mock Strategy

### Supabase Client Mock
```typescript
createMockSupabaseClient() - Returns partial Supabase client
- Chainable query builders (from().select().eq()...)
- Configurable return values per test
- Error simulation support
```

### OpenRouter Client Mock
```typescript
vi.mock() at module level
- Factory pattern for clean instantiation
- mockImplementation() for test-specific behavior
- Preserves class structure
```

---

## Next Steps

1. **Add Performance Tests**
   - Test with large flashcard arrays (50 cards)
   - Verify timeout handling

2. **Add Validation Tests**
   - OpenRouter client input validation
   - Text length limits (1000-10000 chars)
   - maxCards bounds (1-50)

3. **Add Concurrency Tests**
   - Multiple simultaneous generations
   - Race condition handling

4. **Add Integration Tests**
   - Real OpenRouter API calls (marked as integration)
   - Real Supabase database (test database)

---

## Coverage Goals

- **Target**: 95% code coverage
- **Current focus**: Business logic (services)
- **Lines to cover**: All error paths, edge cases, happy paths

---

**Test Suite Status**: ✅ Complete - 29 comprehensive tests
**Ready for**: Code review, CI/CD integration, production deployment
