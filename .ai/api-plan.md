# REST API Plan - AI Flashcard Generator

## 1. Resources Overview

The API is organized around the following main resources that correspond to database entities:

| Resource                | Database Table           | Description                                      |
| ----------------------- | ------------------------ | ------------------------------------------------ |
| Users                   | users                    | User accounts and authentication                 |
| Decks                   | decks                    | Flashcard deck collections                       |
| Flashcards              | flashcards               | Individual flashcard items                       |
| AI Generation           | ai_generation_logs       | AI-powered flashcard generation                  |
| Study Sessions          | study_sessions           | Spaced repetition study sessions                 |
| Flashcard Performance   | flashcard_performance    | Historical performance data for FSRS algorithm   |

## 2. API Endpoints

### 2.2. Deck Endpoints

All deck endpoints require authentication via Bearer token.

#### GET /api/decks

Retrieve all decks for the authenticated user.

**Headers:**
- `Authorization: Bearer {access_token}`

**Query Parameters:**
- `sort` (optional): Sort field - `name`, `created_at`, `updated_at` (default: `created_at`)
- `order` (optional): Sort order - `asc`, `desc` (default: `desc`)
- `limit` (optional): Number of results per page (default: 50, max: 100)
- `offset` (optional): Number of results to skip (default: 0)

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "decks": [
      {
        "id": "integer",
        "name": "string",
        "cards_count": "integer",
        "cards_due_today": "integer",
        "created_at": "timestamp",
        "updated_at": "timestamp"
      }
    ],
    "pagination": {
      "total": "integer",
      "limit": "integer",
      "offset": "integer",
      "has_more": "boolean"
    }
  }
}
```

**Error Responses:**
- **401 Unauthorized** - Missing or invalid token

#### POST /api/decks

Create a new deck.

**Headers:**
- `Authorization: Bearer {access_token}`

**Request Body:**
```json
{
  "name": "string (1-100 chars, required)"
}
```

**Success Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "deck": {
      "id": "integer",
      "name": "string",
      "cards_count": 0,
      "cards_due_today": 0,
      "created_at": "timestamp",
      "updated_at": "timestamp"
    }
  }
}
```

**Error Responses:**
- **400 Bad Request** - Invalid input
  ```json
  {
    "success": false,
    "error": {
      "code": "INVALID_INPUT",
      "message": "Deck name must be between 1 and 100 characters",
      "field": "name"
    }
  }
  ```
- **409 Conflict** - Deck name already exists for this user
  ```json
  {
    "success": false,
    "error": {
      "code": "DECK_EXISTS",
      "message": "A deck with this name already exists"
    }
  }
  ```

#### GET /api/decks/{deck_id}

Retrieve a specific deck with detailed information.

**Headers:**
- `Authorization: Bearer {access_token}`

**URL Parameters:**
- `deck_id`: Integer (required)

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "deck": {
      "id": "integer",
      "name": "string",
      "cards_count": "integer",
      "cards_due_today": "integer",
      "cards_new": "integer",
      "cards_learning": "integer",
      "created_at": "timestamp",
      "updated_at": "timestamp"
    }
  }
}
```

**Error Responses:**
- **404 Not Found** - Deck doesn't exist or doesn't belong to user

#### PATCH /api/decks/{deck_id}

Update a deck's name.

**Headers:**
- `Authorization: Bearer {access_token}`

**URL Parameters:**
- `deck_id`: Integer (required)

**Request Body:**
```json
{
  "name": "string (1-100 chars, required)"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "deck": {
      "id": "integer",
      "name": "string",
      "updated_at": "timestamp"
    }
  }
}
```

**Error Responses:**
- **400 Bad Request** - Invalid input
- **404 Not Found** - Deck doesn't exist or doesn't belong to user
- **409 Conflict** - Deck name already exists for this user

#### DELETE /api/decks/{deck_id}

Delete a deck and all associated flashcards.

**Headers:**
- `Authorization: Bearer {access_token}`

**URL Parameters:**
- `deck_id`: Integer (required)

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Deck deleted successfully"
}
```

**Error Responses:**
- **404 Not Found** - Deck doesn't exist or doesn't belong to user

---

### 2.3. Flashcard Endpoints

All flashcard endpoints require authentication via Bearer token.

#### GET /api/decks/{deck_id}/flashcards

Retrieve all flashcards in a specific deck.

**Headers:**
- `Authorization: Bearer {access_token}`

**URL Parameters:**
- `deck_id`: Integer (required)

**Query Parameters:**
- `status` (optional): Filter by status - `draft`, `new`, `finalized` (can be comma-separated)
- `sort` (optional): Sort field - `created_at`, `next_review_date` (default: `created_at`)
- `order` (optional): Sort order - `asc`, `desc` (default: `desc`)
- `limit` (optional): Number of results per page (default: 50, max: 100)
- `offset` (optional): Number of results to skip (default: 0)

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "flashcards": [
      {
        "id": "integer",
        "deck_id": "integer",
        "front": "string",
        "back": "string",
        "status": "draft|new|finalized",
        "source": "ai|manual",
        "ease_factor": "decimal",
        "interval": "integer",
        "next_review_date": "date",
        "created_at": "timestamp",
        "updated_at": "timestamp"
      }
    ],
    "pagination": {
      "total": "integer",
      "limit": "integer",
      "offset": "integer",
      "has_more": "boolean"
    }
  }
}
```

**Error Responses:**
- **404 Not Found** - Deck doesn't exist or doesn't belong to user

#### POST /api/decks/{deck_id}/flashcards

Create a new flashcard manually.

**Headers:**
- `Authorization: Bearer {access_token}`

**URL Parameters:**
- `deck_id`: Integer (required)

**Request Body:**
```json
{
  "front": "string (1-200 chars, required)",
  "back": "string (1-500 chars, required)"
}
```

**Success Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "flashcard": {
      "id": "integer",
      "deck_id": "integer",
      "front": "string",
      "back": "string",
      "status": "new",
      "source": "manual",
      "ease_factor": 2.50,
      "interval": 0,
      "next_review_date": "date",
      "created_at": "timestamp",
      "updated_at": "timestamp"
    }
  }
}
```

**Error Responses:**
- **400 Bad Request** - Invalid input
  ```json
  {
    "success": false,
    "error": {
      "code": "INVALID_INPUT",
      "message": "Front text must be between 1 and 200 characters",
      "field": "front"
    }
  }
  ```
- **404 Not Found** - Deck doesn't exist or doesn't belong to user

#### POST /api/decks/{deck_id}/flashcards/bulk

Create multiple flashcards at once.

**Headers:**
- `Authorization: Bearer {access_token}`

**URL Parameters:**
- `deck_id`: Integer (required)

**Request Body:**
```json
{
  "flashcards": [
    {
      "front": "string (1-200 chars, required)",
      "back": "string (1-500 chars, required)"
    }
  ]
}
```

**Constraints:**
- Minimum: 1 flashcard
- Maximum: 100 flashcards per request

**Success Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "flashcards": [
      {
        "id": "integer",
        "deck_id": "integer",
        "front": "string",
        "back": "string",
        "status": "new",
        "source": "manual",
        "ease_factor": 2.50,
        "interval": 0,
        "next_review_date": "date",
        "created_at": "timestamp",
        "updated_at": "timestamp"
      }
    ],
    "summary": {
      "total_created": "integer",
      "total_failed": "integer"
    }
  }
}
```

**Partial Success Response (207 Multi-Status):**
When some flashcards fail validation while others succeed:
```json
{
  "success": true,
  "data": {
    "flashcards": [
      {
        "id": "integer",
        "front": "string",
        "back": "string",
        "status": "new"
      }
    ],
    "failed": [
      {
        "index": "integer",
        "front": "string",
        "back": "string",
        "error": {
          "code": "INVALID_INPUT",
          "message": "Front text must be between 1 and 200 characters",
          "field": "front"
        }
      }
    ],
    "summary": {
      "total_created": "integer",
      "total_failed": "integer"
    }
  }
}
```

**Error Responses:**
- **400 Bad Request** - Invalid input structure
  ```json
  {
    "success": false,
    "error": {
      "code": "INVALID_INPUT",
      "message": "Request must contain between 1 and 100 flashcards",
      "field": "flashcards"
    }
  }
  ```
- **400 Bad Request** - All flashcards failed validation
  ```json
  {
    "success": false,
    "error": {
      "code": "ALL_CARDS_INVALID",
      "message": "All flashcards failed validation",
      "details": [
        {
          "index": 0,
          "error": "Front text must be between 1 and 200 characters"
        }
      ]
    }
  }
  ```
- **404 Not Found** - Deck doesn't exist or doesn't belong to user

#### GET /api/flashcards/{flashcard_id}

Retrieve a specific flashcard.

**Headers:**
- `Authorization: Bearer {access_token}`

**URL Parameters:**
- `flashcard_id`: Integer (required)

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "flashcard": {
      "id": "integer",
      "deck_id": "integer",
      "front": "string",
      "back": "string",
      "status": "draft|new|finalized",
      "source": "ai|manual",
      "ease_factor": "decimal",
      "interval": "integer",
      "next_review_date": "date",
      "created_at": "timestamp",
      "updated_at": "timestamp"
    }
  }
}
```

**Error Responses:**
- **404 Not Found** - Flashcard doesn't exist or doesn't belong to user's deck

#### PATCH /api/flashcards/{flashcard_id}

Update a flashcard's content.

**Headers:**
- `Authorization: Bearer {access_token}`

**URL Parameters:**
- `flashcard_id`: Integer (required)

**Request Body:**
```json
{
  "front": "string (1-200 chars, optional)",
  "back": "string (1-500 chars, optional)"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "flashcard": {
      "id": "integer",
      "front": "string",
      "back": "string",
      "updated_at": "timestamp"
    }
  }
}
```

**Error Responses:**
- **400 Bad Request** - Invalid input
- **404 Not Found** - Flashcard doesn't exist or doesn't belong to user's deck

#### DELETE /api/flashcards/{flashcard_id}

Delete a flashcard.

**Headers:**
- `Authorization: Bearer {access_token}`

**URL Parameters:**
- `flashcard_id`: Integer (required)

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Flashcard deleted successfully"
}
```

**Error Responses:**
- **404 Not Found** - Flashcard doesn't exist or doesn't belong to user's deck

---

### 2.4. AI Generation Endpoints

#### POST /api/ai/generate

Generate flashcards from text using AI.

**Headers:**
- `Authorization: Bearer {access_token}`

**Request Body:**
```json
{
  "text": "string (required, min 50 chars)",
  "deck_id": "integer (required)",
  "max_cards": "integer (optional, default: 10, max: 50)"
}
```

**Success Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "generation_id": "integer",
    "deck_id": "integer",
    "flashcards": [
      {
        "id": "integer",
        "front": "string",
        "back": "string",
        "status": "draft",
        "source": "ai"
      }
    ],
    "cards_generated": "integer"
  }
}
```

**Error Responses:**
- **400 Bad Request** - Invalid input
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
- **403 Forbidden** - Daily limit exceeded
  ```json
  {
    "success": false,
    "error": {
      "code": "DAILY_LIMIT_EXCEEDED",
      "message": "You have reached your daily AI generation limit. Try again tomorrow.",
      "reset_at": "timestamp"
    }
  }
  ```
- **404 Not Found** - Deck doesn't exist or doesn't belong to user
- **503 Service Unavailable** - AI service error
  ```json
  {
    "success": false,
    "error": {
      "code": "AI_SERVICE_ERROR",
      "message": "AI service is temporarily unavailable. Please try again later."
    }
  }
  ```

#### GET /api/ai/usage

Get current AI generation usage for the authenticated user.

**Headers:**
- `Authorization: Bearer {access_token}`

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "daily_limit": "integer",
    "used_today": "integer",
    "remaining": "integer",
    "reset_at": "timestamp"
  }
}
```

#### GET /api/decks/{deck_id}/flashcards/drafts

Get all draft flashcards for a deck (AI-generated, pending review).

**Headers:**
- `Authorization: Bearer {access_token}`

**URL Parameters:**
- `deck_id`: Integer (required)

**Query Parameters:**
- `limit` (optional): Number of results per page (default: 50, max: 100)
- `offset` (optional): Number of results to skip (default: 0)

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "drafts": [
      {
        "id": "integer",
        "deck_id": "integer",
        "front": "string",
        "back": "string",
        "status": "draft",
        "source": "ai",
        "created_at": "timestamp"
      }
    ],
    "pagination": {
      "total": "integer",
      "limit": "integer",
      "offset": "integer",
      "has_more": "boolean"
    }
  }
}
```

**Error Responses:**
- **404 Not Found** - Deck doesn't exist or doesn't belong to user

#### POST /api/flashcards/{flashcard_id}/accept

Accept a draft flashcard and move it to the deck.

**Headers:**
- `Authorization: Bearer {access_token}`

**URL Parameters:**
- `flashcard_id`: Integer (required)

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "flashcard": {
      "id": "integer",
      "status": "new",
      "updated_at": "timestamp"
    }
  }
}
```

**Error Responses:**
- **400 Bad Request** - Flashcard is not in draft status
  ```json
  {
    "success": false,
    "error": {
      "code": "INVALID_STATUS",
      "message": "Only draft flashcards can be accepted"
    }
  }
  ```
- **404 Not Found** - Flashcard doesn't exist or doesn't belong to user's deck

---

### 2.5. Study Session Endpoints

#### POST /api/decks/{deck_id}/study/start

Start a new study session for a deck.

**Headers:**
- `Authorization: Bearer {access_token}`

**URL Parameters:**
- `deck_id`: Integer (required)

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "session": {
      "id": "integer",
      "deck_id": "integer",
      "started_at": "timestamp",
      "cards_to_review": "integer"
    },
    "first_card": {
      "id": "integer",
      "front": "string"
    }
  }
}
```

**Error Responses:**
- **404 Not Found** - Deck doesn't exist or doesn't belong to user
- **409 Conflict** - No cards due for review
  ```json
  {
    "success": false,
    "error": {
      "code": "NO_CARDS_DUE",
      "message": "No cards are due for review in this deck",
      "next_review_at": "timestamp"
    }
  }
  ```

#### GET /api/study/sessions/{session_id}/next

Get the next card in the study session.

**Headers:**
- `Authorization: Bearer {access_token}`

**URL Parameters:**
- `session_id`: Integer (required)

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "card": {
      "id": "integer",
      "front": "string"
    },
    "remaining": "integer"
  }
}
```

**Error Responses:**
- **404 Not Found** - Session doesn't exist or doesn't belong to user
- **410 Gone** - Session completed
  ```json
  {
    "success": false,
    "error": {
      "code": "SESSION_COMPLETE",
      "message": "No more cards to review in this session"
    }
  }
  ```

#### POST /api/study/sessions/{session_id}/review

Submit a review for the current card.

**Headers:**
- `Authorization: Bearer {access_token}`

**URL Parameters:**
- `session_id`: Integer (required)

**Request Body:**
```json
{
  "flashcard_id": "integer (required)",
  "grade": "again|hard|good|easy (required)"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "flashcard": {
      "id": "integer",
      "new_ease_factor": "decimal",
      "new_interval": "integer",
      "next_review_date": "date"
    },
    "next_card": {
      "id": "integer",
      "front": "string"
    } | null,
    "session": {
      "cards_remaining": "integer"
    }
  }
}
```

**Error Responses:**
- **400 Bad Request** - Invalid grade or flashcard not in session
  ```json
  {
    "success": false,
    "error": {
      "code": "INVALID_GRADE",
      "message": "Grade must be one of: again, hard, good, easy",
      "field": "grade"
    }
  }
  ```
- **404 Not Found** - Session doesn't exist or doesn't belong to user

#### POST /api/study/sessions/{session_id}/end

End a study session.

**Headers:**
- `Authorization: Bearer {access_token}`

**URL Parameters:**
- `session_id`: Integer (required)

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "session": {
      "id": "integer",
      "deck_id": "integer",
      "started_at": "timestamp",
      "ended_at": "timestamp",
      "cards_reviewed": "integer",
      "cards_correct": "integer",
      "accuracy_rate": "decimal"
    }
  }
}
```

**Error Responses:**
- **404 Not Found** - Session doesn't exist or doesn't belong to user
- **409 Conflict** - Session already ended

#### GET /api/study/sessions

Get study session history for the authenticated user.

**Headers:**
- `Authorization: Bearer {access_token}`

**Query Parameters:**
- `deck_id` (optional): Filter by specific deck
- `limit` (optional): Number of results per page (default: 20, max: 100)
- `offset` (optional): Number of results to skip (default: 0)

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "sessions": [
      {
        "id": "integer",
        "deck_id": "integer",
        "deck_name": "string",
        "started_at": "timestamp",
        "ended_at": "timestamp",
        "cards_reviewed": "integer",
        "cards_correct": "integer",
        "accuracy_rate": "decimal"
      }
    ],
    "pagination": {
      "total": "integer",
      "limit": "integer",
      "offset": "integer",
      "has_more": "boolean"
    }
  }
}
```

---

### 2.6. Statistics and Analytics Endpoints

#### GET /api/decks/{deck_id}/stats

Get detailed statistics for a specific deck.

**Headers:**
- `Authorization: Bearer {access_token}`

**URL Parameters:**
- `deck_id`: Integer (required)

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "deck": {
      "id": "integer",
      "name": "string"
    },
    "cards": {
      "total": "integer",
      "new": "integer",
      "learning": "integer",
      "due_today": "integer"
    },
    "study": {
      "total_sessions": "integer",
      "total_reviews": "integer",
      "average_accuracy": "decimal",
      "last_studied_at": "timestamp"
    }
  }
}
```

**Error Responses:**
- **404 Not Found** - Deck doesn't exist or doesn't belong to user

#### GET /api/stats/overview

Get overall statistics for the authenticated user.

**Headers:**
- `Authorization: Bearer {access_token}`

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "decks": {
      "total": "integer"
    },
    "cards": {
      "total": "integer",
      "due_today": "integer"
    },
    "study": {
      "total_sessions": "integer",
      "total_reviews": "integer",
      "average_accuracy": "decimal",
      "current_streak_days": "integer"
    },
    "ai": {
      "cards_generated_total": "integer",
      "daily_limit": "integer",
      "used_today": "integer"
    }
  }
}
```

---

## 3. Authentication and Authorization

### 3.1. Authentication Mechanism

The API uses **JWT (JSON Web Token) based authentication** provided by Supabase Auth.

#### Token Types

1. **Access Token**: Short-lived token (1 hour) used for API requests
2. **Refresh Token**: Long-lived token (30 days) used to obtain new access tokens

#### Implementation Details

- All protected endpoints require the `Authorization` header with a Bearer token:
  ```
  Authorization: Bearer {access_token}
  ```

- Tokens are obtained through the `/api/auth/login` and `/api/auth/signup` endpoints

- Access tokens automatically expire after 1 hour. Clients should:
  1. Check for 401 Unauthorized responses
  2. Use the refresh token to obtain a new access token via `/api/auth/refresh`
  3. Retry the original request with the new token

- Refresh tokens are stored securely and should be transmitted only over HTTPS

### 3.2. Authorization via Row-Level Security (RLS)

Authorization is implemented using **Supabase Row-Level Security (RLS)** policies at the database level:

#### User Isolation
- Each user can only access their own data
- RLS policies automatically filter queries to return only rows where `user_id` matches `auth.uid()`
- No additional authorization checks needed in the API layer for basic CRUD operations

#### Ownership Chain
For nested resources (e.g., flashcards within decks):
- RLS policies verify ownership through JOIN conditions
- Example: Users can only access flashcards from decks they own
- This is enforced at the database level, preventing unauthorized access

#### Security Benefits
- Protection against SQL injection
- Automatic enforcement across all database queries
- Consistent authorization logic
- No risk of authorization bypass in application code

---

## 4. Validation and Business Logic

### 4.1. Input Validation Rules

All endpoints validate input using **Zod schemas** before processing. Validation rules are derived from database constraints and business requirements.

#### User Validation
```typescript
{
  username: z.string()
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username must not exceed 50 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, underscores, and hyphens"),
  
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password must not exceed 100 characters")
}
```

#### Deck Validation
```typescript
{
  name: z.string()
    .min(1, "Deck name is required")
    .max(100, "Deck name must not exceed 100 characters")
    .trim()
}
```

#### Flashcard Validation
```typescript
{
  front: z.string()
    .min(1, "Front text is required")
    .max(200, "Front text must not exceed 200 characters")
    .trim(),
  
  back: z.string()
    .min(1, "Back text is required")
    .max(500, "Back text must not exceed 500 characters")
    .trim()
}
```

#### Bulk Flashcard Validation
```typescript
{
  flashcards: z.array(
    z.object({
      front: z.string()
        .min(1, "Front text is required")
        .max(200, "Front text must not exceed 200 characters")
        .trim(),
      
      back: z.string()
        .min(1, "Back text is required")
        .max(500, "Back text must not exceed 500 characters")
        .trim()
    })
  )
  .min(1, "Must provide at least 1 flashcard")
  .max(100, "Cannot create more than 100 flashcards at once")
}
```

#### AI Generation Validation
```typescript
{
  text: z.string()
    .min(50, "Text must be at least 50 characters for meaningful flashcard generation")
    .max(10000, "Text must not exceed 10,000 characters"),
  
  deck_id: z.number()
    .int("Deck ID must be an integer")
    .positive("Deck ID must be positive"),
  
  max_cards: z.number()
    .int("Max cards must be an integer")
    .min(1, "Must generate at least 1 card")
    .max(50, "Cannot generate more than 50 cards at once")
    .optional()
    .default(10)
}
```

#### Study Session Validation
```typescript
{
  grade: z.enum(['again', 'hard', 'good', 'easy'], {
    errorMap: () => ({ message: "Grade must be one of: again, hard, good, easy" })
  })
}
```

#### Pagination Validation
```typescript
{
  limit: z.number()
    .int()
    .min(1, "Limit must be at least 1")
    .max(100, "Limit cannot exceed 100")
    .optional()
    .default(50),
  
  offset: z.number()
    .int()
    .min(0, "Offset must be non-negative")
    .optional()
    .default(0)
}
```

### 4.2. Business Logic Implementation

#### Spaced Repetition Algorithm (FSRS)

The FSRS algorithm is implemented server-side and triggered during study sessions:

**On Card Review (POST /api/study/sessions/{session_id}/review):**

1. **Retrieve current FSRS parameters** from the flashcard:
   - `ease_factor` (difficulty multiplier)
   - `interval` (days since last review)

2. **Calculate new parameters based on grade:**
   - **Again (1)**: Reset to beginning, set interval to 0-1 day
   - **Hard (2)**: Reduce ease factor, increase interval slightly
   - **Good (3)**: Maintain ease factor, increase interval normally
   - **Easy (4)**: Increase ease factor, increase interval significantly

3. **Update flashcard record:**
   ```sql
   UPDATE flashcards SET
     ease_factor = calculated_ease_factor,
     interval = calculated_interval,
     next_review_date = CURRENT_DATE + calculated_interval,
     status = 'finalized',
     updated_at = CURRENT_TIMESTAMP
   WHERE id = flashcard_id
   ```

4. **Record performance history:**
   ```sql
   INSERT INTO flashcard_performance (
     flashcard_id, study_session_id, grade,
     previous_ease_factor, previous_interval,
     new_ease_factor, new_interval
   ) VALUES (...)
   ```

**Implementation Reference:**
- Use `ts-fsrs` library for algorithm calculations
- Default ease factor: 2.50
- Minimum ease factor: 1.30
- Maximum ease factor: 4.00

#### AI Daily Limit Enforcement

**On AI Generation Request (POST /api/ai/generate):**

1. **Query usage for current day:**
   ```sql
   SELECT COUNT(*) as requests_today
   FROM ai_generation_logs
   WHERE user_id = auth.uid()
   AND generated_at >= CURRENT_DATE
   AND generated_at < CURRENT_DATE + INTERVAL '1 day'
   ```

2. **Check against limit:**
   - Default limit: 10 requests per day
   - If `requests_today >= limit`, return 403 Forbidden

3. **If within limit, proceed and log:**
   ```sql
   INSERT INTO ai_generation_logs (user_id, cards_count)
   VALUES (auth.uid(), number_of_cards_generated)
   ```

4. **Return reset time in error response:**
   ```json
   {
     "reset_at": "CURRENT_DATE + INTERVAL '1 day' at midnight UTC"
   }
   ```

#### Draft Flashcard Workflow

**AI Generation Flow:**

1. AI generates flashcards → Status: `draft`, Source: `ai`
2. User reviews drafts via `GET /api/decks/{deck_id}/flashcards/drafts`
3. For each draft, user can:
   - **Accept**: `POST /api/flashcards/{id}/accept` → Status changes to `new`
   - **Edit**: `PATCH /api/flashcards/{id}` → Remains `draft` until accepted
   - **Delete**: `DELETE /api/flashcards/{id}` → Permanently removed

**Status Transitions:**
```
draft → new (via accept)
draft → deleted (via delete)
new → finalized (first study review)
```

**Business Rules:**
- Only `draft` status flashcards can be accepted
- Draft flashcards are not included in study sessions
- Draft flashcards do not count toward deck statistics until accepted

#### Deck Deletion Cascade

**On Deck Deletion (DELETE /api/decks/{deck_id}):**

Database CASCADE rules automatically handle:
1. Delete all flashcards in the deck
2. Delete all study sessions for the deck
3. Delete all flashcard performance records (via session deletion)

**User Confirmation:**
- Frontend must implement confirmation dialog
- API returns the count of items to be deleted:
  ```json
  {
    "warning": {
      "flashcards_count": "integer",
      "sessions_count": "integer"
    }
  }
  ```

#### Study Session Management

**Session Lifecycle:**

1. **Start** (`POST /api/decks/{deck_id}/study/start`):
   - Query flashcards where `next_review_date <= CURRENT_DATE` and `status != 'draft'`
   - Create session record with `started_at` timestamp
   - Return first card to review

2. **Review Loop** (`POST /api/study/sessions/{session_id}/review`):
   - Update flashcard FSRS parameters
   - Increment `cards_reviewed` counter
   - If grade is 'good' or 'easy', increment `cards_correct`
   - Fetch next due card or indicate session complete

3. **End** (`POST /api/study/sessions/{session_id}/end`):
   - Set `ended_at` timestamp
   - Calculate final statistics (accuracy rate)
   - Return session summary

**Session Validation:**
- Only one active session per deck per user
- Session expires after 24 hours of inactivity
- Cannot review the same card twice in one session

#### Unique Deck Names Per User

**On Deck Creation/Update:**

Database constraint ensures uniqueness:
```sql
CONSTRAINT UNIQUE(user_id, name)
```

**API Behavior:**
- Check is performed automatically by database
- Return 409 Conflict if violation occurs
- Error message: "A deck with this name already exists"

#### Card Due Today Calculation

**Computed in real-time for GET /api/decks:**

```sql
SELECT 
  d.*,
  COUNT(f.id) as cards_count,
  COUNT(CASE WHEN f.next_review_date <= CURRENT_DATE 
    AND f.status != 'draft' THEN 1 END) as cards_due_today
FROM decks d
LEFT JOIN flashcards f ON f.deck_id = d.id
WHERE d.user_id = auth.uid()
GROUP BY d.id
```

#### First-Time User Experience

**On First Login (GET /api/decks):**
- If user has no decks (count = 0), return:
  ```json
  {
    "success": true,
    "data": {
      "decks": [],
      "first_time_user": true,
      "suggestion": "Create your first deck to get started"
    }
  }
  ```

**Frontend Behavior:**
- Show onboarding flow
- Prompt user to create first deck
- Offer tour of features

---

## 5. Error Handling Standards

### 5.1. Error Response Format

All error responses follow a consistent structure:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "field": "field_name (optional, for validation errors)",
    "details": {} (optional, for additional context)
  }
}
```

### 5.2. Standard HTTP Status Codes

- **200 OK**: Successful GET, PATCH, POST (non-creation), DELETE
- **201 Created**: Successful POST (resource creation)
- **400 Bad Request**: Invalid input, validation error
- **401 Unauthorized**: Missing or invalid authentication token
- **403 Forbidden**: Authenticated but not authorized (e.g., rate limit)
- **404 Not Found**: Resource does not exist
- **409 Conflict**: Resource conflict (e.g., duplicate name)
- **410 Gone**: Resource existed but is no longer available
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: Unexpected server error
- **503 Service Unavailable**: External service (AI) unavailable

### 5.3. Common Error Codes

- `INVALID_INPUT`: Validation error
- `INVALID_CREDENTIALS`: Authentication failure
- `UNAUTHORIZED`: Missing authentication
- `FORBIDDEN`: Authorization failure
- `NOT_FOUND`: Resource not found
- `USERNAME_EXISTS`: Duplicate username
- `DECK_EXISTS`: Duplicate deck name
- `DAILY_LIMIT_EXCEEDED`: AI generation limit reached
- `NO_CARDS_DUE`: No cards available for study
- `SESSION_COMPLETE`: Study session finished
- `INVALID_STATUS`: Invalid state transition
- `AI_SERVICE_ERROR`: External AI service failure
- `INTERNAL_ERROR`: Unexpected server error

---

## 6. Rate Limiting

### 6.1. Global Rate Limits

Applied per IP address or authenticated user (whichever is more restrictive):

- **Authentication endpoints**: 5 requests per minute
- **AI generation endpoint**: 10 requests per day (business rule)
- **All other endpoints**: 100 requests per minute

### 6.2. Rate Limit Headers

All responses include rate limit information:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1634567890
```

### 6.3. Rate Limit Exceeded Response

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later.",
    "reset_at": "timestamp"
  }
}
```

---

## 7. API Versioning

Currently, the API is version 1 and does not require version prefix in URLs. When breaking changes are introduced, the API will adopt URL-based versioning:

- Current: `/api/decks`
- Future: `/api/v2/decks`

Version 1 will be maintained for at least 6 months after v2 release.

---

## 8. Implementation Notes

### 8.1. Technology Stack Integration

- **Astro**: API routes are implemented as Astro endpoints in `src/pages/api/`
- **Supabase Client**: Access via `context.locals.supabase` in route handlers
- **TypeScript**: All request/response types defined in `src/types.ts`
- **Zod**: Input validation schemas defined per endpoint
- **ts-fsrs**: Spaced repetition algorithm calculations

### 8.2. CORS Configuration

For development:
```typescript
{
  origin: ['http://localhost:4321', 'http://localhost:3000'],
  credentials: true
}
```

For production:
```typescript
{
  origin: process.env.ALLOWED_ORIGINS?.split(',') || [],
  credentials: true
}
```

### 8.3. Middleware Requirements

All API routes use Astro middleware for:
1. CORS headers
2. Authentication token validation
3. User context injection into `locals`
4. Request logging
5. Error handling wrapper

### 8.4. Database Access Pattern

```typescript
// In Astro API routes
export const prerender = false;

export async function GET(context: APIContext) {
  const supabase = context.locals.supabase;
  const user = context.locals.user;
  
  // RLS automatically filters by user
  const { data, error } = await supabase
    .from('decks')
    .select('*');
  
  // Handle response
}
```

---

## 9. Future Enhancements (Out of Scope for MVP)

The following features are not included in the MVP but are planned for future releases:

1. **Bulk Operations**: Import/export flashcards from CSV, JSON
2. **Deck Sharing**: Share decks with other users (read-only or collaborative)
3. **Tags and Categories**: Organize flashcards with tags
4. **Images and Rich Media**: Support for images in flashcards
5. **Advanced Statistics**: Charts, progress tracking, learning analytics
6. **Mobile Apps**: Native iOS and Android applications
7. **Offline Mode**: Progressive Web App with offline capabilities
8. **Custom FSRS Settings**: Per-deck algorithm customization
9. **Deck Templates**: Pre-made decks for common subjects
10. **Social Features**: Leaderboards, study groups, achievements

---

## 10. API Documentation

Interactive API documentation will be available at `/api/docs` using Swagger/OpenAPI specification once implemented.
