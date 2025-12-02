/**
 * Type definitions for DTOs (Data Transfer Objects) and Command Models
 *
 * This file contains all types used for API requests and responses.
 * All DTOs are derived from database entity types defined in database.types.ts
 */

import type { Tables, TablesInsert, TablesUpdate } from "./db/database.types";

// ============================================================================
// Database Entity Types (Re-exports for convenience)
// ============================================================================

export type Deck = Tables<"decks">;
export type DeckInsert = TablesInsert<"decks">;
export type DeckUpdate = TablesUpdate<"decks">;

export type Flashcard = Tables<"flashcards">;
export type FlashcardInsert = TablesInsert<"flashcards">;
export type FlashcardUpdate = TablesUpdate<"flashcards">;

export type StudySession = Tables<"study_sessions">;
export type StudySessionInsert = TablesInsert<"study_sessions">;
export type StudySessionUpdate = TablesUpdate<"study_sessions">;

export type FlashcardPerformance = Tables<"flashcard_performance">;
export type FlashcardPerformanceInsert = TablesInsert<"flashcard_performance">;
export type FlashcardPerformanceUpdate = TablesUpdate<"flashcard_performance">;

export type AIGenerationLog = Tables<"ai_generation_logs">;
export type AIGenerationLogInsert = TablesInsert<"ai_generation_logs">;
export type AIGenerationLogUpdate = TablesUpdate<"ai_generation_logs">;

// ============================================================================
// Enums and Constants
// ============================================================================

export type FlashcardStatus = "draft" | "new" | "finalized";
export type FlashcardSource = "manual" | "ai";
export type ReviewGrade = "again" | "hard" | "good" | "easy";
export type SortOrder = "asc" | "desc";

// ============================================================================
// Common Utility Types
// ============================================================================

/**
 * Standard API success response wrapper
 */
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

/**
 * Standard API error response
 */
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    field?: string;
    details?: unknown;
  };
}

/**
 * Combined API response type
 */
export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationMeta;
}

/**
 * Common pagination query parameters
 */
export interface PaginationParams {
  limit?: number;
  offset?: number;
}

// ============================================================================
// Authentication DTOs
// ============================================================================

export interface SignUpRequest {
  email: string;
  password: string;
  username?: string;
}

export interface SignUpResponse {
  user: {
    id: string;
    email: string;
    username?: string;
  };
  access_token: string;
  refresh_token: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    username?: string;
  };
  access_token: string;
  refresh_token: string;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface RefreshTokenResponse {
  access_token: string;
  refresh_token: string;
}

// ============================================================================
// Deck DTOs
// ============================================================================

/**
 * Deck summary with computed statistics (extends base Deck entity)
 */
export interface DeckSummary extends Omit<Deck, "user_id"> {
  cards_count: number;
  cards_due_today: number;
}

/**
 * Detailed deck information with additional statistics
 */
export interface DeckDetail extends DeckSummary {
  cards_new: number;
  cards_learning: number;
}

/**
 * Request to create a new deck
 */
export interface CreateDeckRequest {
  name: string;
}

/**
 * Response after creating a deck
 */
export interface CreateDeckResponse {
  deck: DeckSummary;
}

/**
 * Request to update a deck
 */
export interface UpdateDeckRequest {
  name: string;
}

/**
 * Response after updating a deck
 */
export interface UpdateDeckResponse {
  deck: Pick<Deck, "id" | "name" | "updated_at">;
}

/**
 * Query parameters for listing decks
 */
export interface ListDecksParams extends PaginationParams {
  sort?: "name" | "created_at" | "updated_at";
  order?: SortOrder;
}

/**
 * Response for listing decks
 */
export interface ListDecksResponse {
  decks: DeckSummary[];
  pagination: PaginationMeta;
}

/**
 * Response after deleting a deck
 */
export interface DeleteDeckResponse {
  message: string;
}

// ============================================================================
// Flashcard DTOs
// ============================================================================

/**
 * Flashcard summary for listing (omits user-related fields)
 * Same as Flashcard entity, but used for semantic clarity
 */
export type FlashcardSummary = Flashcard;

/**
 * Full flashcard details (same as summary for now, but can be extended)
 */
export type FlashcardDetail = Flashcard;

/**
 * Request to create a single flashcard manually
 */
export interface CreateFlashcardRequest {
  front: string;
  back: string;
}

/**
 * Response after creating a flashcard
 */
export interface CreateFlashcardResponse {
  flashcard: FlashcardDetail;
}

/**
 * Single flashcard in a bulk create request
 */
export interface BulkFlashcardItem {
  front: string;
  back: string;
}

/**
 * Request to create multiple flashcards at once
 */
export interface BulkCreateFlashcardsRequest {
  flashcards: BulkFlashcardItem[];
}

/**
 * Failed flashcard in bulk creation
 */
export interface BulkFlashcardError {
  index: number;
  flashcard: BulkFlashcardItem;
  error: {
    code: string;
    message: string;
    field?: string;
  };
}

/**
 * Response after bulk creating flashcards
 */
export interface BulkCreateFlashcardsResponse {
  flashcards: FlashcardDetail[];
  failed?: BulkFlashcardError[];
  summary: {
    total_created: number;
    total_failed: number;
  };
}

/**
 * Request to update a flashcard
 */
export interface UpdateFlashcardRequest {
  front?: string;
  back?: string;
}

/**
 * Response after updating a flashcard
 */
export interface UpdateFlashcardResponse {
  flashcard: Pick<Flashcard, "id" | "front" | "back" | "updated_at">;
}

/**
 * Query parameters for listing flashcards
 */
export interface ListFlashcardsParams extends PaginationParams {
  status?: string; // Can be comma-separated: "draft,new"
  sort?: "created_at" | "next_review_date";
  order?: SortOrder;
}

/**
 * Response for listing flashcards in a deck
 */
export interface ListFlashcardsResponse {
  flashcards: FlashcardSummary[];
  pagination: PaginationMeta;
}

/**
 * Response after deleting a flashcard
 */
export interface DeleteFlashcardResponse {
  message: string;
}

/**
 * Response after accepting a draft flashcard
 */
export interface AcceptDraftResponse {
  flashcard: Pick<Flashcard, "id" | "status" | "updated_at">;
}

// ============================================================================
// AI Generation DTOs
// ============================================================================

/**
 * Request to generate flashcards using AI
 */
export interface AIGenerateRequest {
  text: string;
  deck_id: number;
  max_cards?: number;
}

/**
 * AI-generated flashcard (draft status)
 */
export interface AIGeneratedFlashcard {
  id: number;
  front: string;
  back: string;
  status: "draft";
  source: "ai";
}

/**
 * Response after AI generation
 */
export interface AIGenerateResponse {
  generation_id: number;
  deck_id: number;
  flashcards: AIGeneratedFlashcard[];
  cards_generated: number;
}

/**
 * Response for AI usage information
 */
export interface AIUsageResponse {
  daily_limit: number;
  used_today: number;
  remaining: number;
  reset_at: string;
}

/**
 * Query parameters for listing draft flashcards (no additional filters needed)
 */
export type ListDraftsParams = PaginationParams;

/**
 * Response for listing draft flashcards
 */
export interface ListDraftsResponse {
  drafts: FlashcardSummary[];
  pagination: PaginationMeta;
}

// ============================================================================
// Study Session DTOs
// ============================================================================

/**
 * Card preview (without the answer)
 */
export interface CardPreview {
  id: number;
  front: string;
}

/**
 * Study session summary
 */
export interface StudySessionSummary {
  id: number;
  deck_id: number;
  started_at: string;
  cards_to_review: number;
}

/**
 * Response after starting a study session
 */
export interface StartStudySessionResponse {
  session: StudySessionSummary;
  first_card: CardPreview;
}

/**
 * Response for getting the next card in a session
 */
export interface NextCardResponse {
  card: CardPreview;
  remaining: number;
}

/**
 * Request to submit a card review
 */
export interface ReviewCardRequest {
  flashcard_id: number;
  grade: ReviewGrade;
}

/**
 * Flashcard state after review
 */
export interface ReviewedFlashcard {
  id: number;
  ease_factor: number;
  interval: number;
  next_review_date: string;
}

/**
 * Response after reviewing a card
 */
export interface ReviewCardResponse {
  flashcard: ReviewedFlashcard;
  next_card: CardPreview | null;
  session: {
    cards_remaining: number;
  };
}

/**
 * Completed study session with statistics
 */
export interface CompletedStudySession extends Omit<StudySession, "user_id"> {
  accuracy_rate: number;
}

/**
 * Response after ending a study session
 */
export interface EndStudySessionResponse {
  session: CompletedStudySession;
}

/**
 * Study session in history list
 */
export interface StudySessionHistoryItem extends Omit<StudySession, "user_id"> {
  deck_name?: string;
}

/**
 * Query parameters for study session history
 */
export interface ListStudySessionsParams extends PaginationParams {
  deck_id?: number;
}

/**
 * Response for study session history
 */
export interface ListStudySessionsResponse {
  sessions: StudySessionHistoryItem[];
  pagination: PaginationMeta;
}

// ============================================================================
// Statistics DTOs
// ============================================================================

/**
 * Card statistics breakdown
 */
export interface CardStats {
  total: number;
  new: number;
  learning: number;
  due_today: number;
}

/**
 * Study statistics
 */
export interface StudyStats {
  total_sessions: number;
  total_cards_reviewed: number;
  average_accuracy: number;
  last_studied_at: string | null;
}

/**
 * Response for deck-specific statistics
 */
export interface DeckStatsResponse {
  deck: {
    id: number;
    name: string;
  };
  cards: CardStats;
  study: StudyStats;
}

/**
 * AI generation statistics
 */
export interface AIStats {
  cards_generated_total: number;
  daily_limit: number;
  used_today: number;
}

/**
 * Response for overall user statistics
 */
export interface OverviewStatsResponse {
  decks: {
    total: number;
  };
  cards: {
    total: number;
    due_today: number;
  };
  study: {
    total_sessions: number;
    total_cards_reviewed: number;
    current_streak_days: number;
  };
  ai: AIStats;
}

// ============================================================================
// Validation Schemas (for use with Zod)
// ============================================================================

/**
 * Validation constraints extracted from API plan
 */
export const ValidationConstraints = {
  username: {
    minLength: 3,
    maxLength: 50,
    pattern: /^[a-zA-Z0-9_-]+$/,
  },
  password: {
    minLength: 8,
    maxLength: 100,
  },
  deck: {
    nameMinLength: 1,
    nameMaxLength: 100,
  },
  flashcard: {
    frontMinLength: 1,
    frontMaxLength: 200,
    backMinLength: 1,
    backMaxLength: 500,
  },
  bulkFlashcards: {
    minCount: 1,
    maxCount: 100,
  },
  aiGeneration: {
    textMinLength: 1000,
    textMaxLength: 10000,
    maxCardsMin: 1,
    maxCardsMax: 50,
    maxCardsDefault: 10,
  },
  pagination: {
    limitMin: 1,
    limitMax: 100,
    limitDefault: 50,
    offsetMin: 0,
    offsetDefault: 0,
  },
  fsrs: {
    defaultEaseFactor: 2.5,
    minEaseFactor: 1.3,
    maxEaseFactor: 4.0,
    defaultInterval: 0,
  },
} as const;

// ============================================================================
// Error Codes (from API plan)
// ============================================================================

export const ErrorCodes = {
  // Validation
  INVALID_INPUT: "INVALID_INPUT",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  INVALID_STATUS: "INVALID_STATUS",
  INVALID_GRADE: "INVALID_GRADE",

  // Authorization
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",

  // Not Found
  NOT_FOUND: "NOT_FOUND",

  // Conflicts
  USERNAME_EXISTS: "USERNAME_EXISTS",
  DECK_EXISTS: "DECK_EXISTS",

  // Business Logic
  DAILY_LIMIT_EXCEEDED: "DAILY_LIMIT_EXCEEDED",
  NO_CARDS_DUE: "NO_CARDS_DUE",
  SESSION_COMPLETE: "SESSION_COMPLETE",
  ALL_CARDS_INVALID: "ALL_CARDS_INVALID",

  // External Services
  AI_SERVICE_ERROR: "AI_SERVICE_ERROR",

  // Rate Limiting
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",

  // Server Errors
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];
