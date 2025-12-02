# UI Architecture Diagram - Authentication Module and Main Components

<mermaid_diagram>

```mermaid
flowchart TD
    subgraph "Public Pages"
        IndexPage[index.astro<br/>Home Page]
        LoginPage[auth/login.astro<br/>Login]
        RegisterPage[auth/register.astro<br/>Registration]
        ResetPwdPage[auth/reset-password.astro<br/>Password Reset]
        UpdatePwdPage[auth/update-password.astro<br/>New Password]
    end

    subgraph "Protected Pages"
        DashboardPage[dashboard.astro<br/>Main Dashboard]
        GeneratePage[decks/deck_id/generate.astro<br/>Flashcard Generation]
    end

    subgraph "Layouts"
        MainLayout[Layout.astro<br/>Main Layout]
        AuthLayoutComp[AuthLayout.astro<br/>Auth Layout]
    end

    subgraph "Middleware and Protection"
        Middleware[middleware/index.ts<br/>Session Verification]
        AuthCheck[AuthCheck.astro<br/>Component Guard]
    end

    subgraph "React Components - Authentication"
        RegisterForm[RegisterForm.tsx<br/>Registration Form]
        LoginForm[LoginForm.tsx<br/>Login Form]
        ResetForm[ResetPasswordForm.tsx<br/>Password Reset]
        UpdateForm[UpdatePasswordForm.tsx<br/>New Password]
        UserMenu[UserMenu.tsx<br/>User Menu]
    end

    subgraph "React Components - Functionality"
        AIGenForm[AIGenerationForm.tsx<br/>AI Generation]
        FlashcardGrid[FlashcardGrid.tsx<br/>Flashcard Grid]
        ThemeToggle[ThemeToggle.tsx<br/>Theme Toggle]
    end

    subgraph "Shadcn UI Components"
        UIComponents[Button, Card, Input<br/>Label, Textarea<br/>Alert, Avatar]
    end

    subgraph "API Endpoints - Authentication"
        RegisterAPI[/api/auth/register.ts<br/>Registration API]
        LoginAPI[/api/auth/login.ts<br/>Login API]
        LogoutAPI[/api/auth/logout.ts<br/>Logout API]
        ResetAPI[/api/auth/reset-password.ts<br/>Password Reset API]
        UpdateAPI[/api/auth/update-password.ts<br/>Password Update API]
    end

    subgraph "API Endpoints - Functionality"
        GenerateAPI[/api/ai/generate.ts<br/>Flashcard Generation]
        UsageAPI[/api/ai/usage.ts<br/>Usage Limits]
    end

    subgraph "Service Layer"
        AIService[ai-generation.service.ts<br/>AI Generation Service]
        OpenRouterClient[openrouter.client.ts<br/>OpenRouter Client]
    end

    subgraph "Validation Layer"
        AuthSchemas[auth.schemas.ts<br/>Auth Schemas]
        AISchemas[ai-generation.schemas.ts<br/>AI Schemas]
    end

    subgraph "Database and Auth"
        SupabaseClient[supabase.client.ts<br/>Supabase Client]
        SupabaseAuth[Supabase Auth<br/>Session Management]
        PostgreSQL[(PostgreSQL<br/>Database)]
    end

    IndexPage --> MainLayout
    DashboardPage --> MainLayout
    GeneratePage --> MainLayout
    
    LoginPage --> AuthLayoutComp
    RegisterPage --> AuthLayoutComp
    ResetPwdPage --> AuthLayoutComp
    UpdatePwdPage --> AuthLayoutComp
    
    AuthLayoutComp --> MainLayout
    
    Middleware -->|Verifies session| SupabaseAuth
    Middleware -->|Injects context| MainLayout
    
    MainLayout -->|Requires auth| AuthCheck
    MainLayout -->|Displays| UserMenu
    MainLayout -->|Displays| ThemeToggle
    
    RegisterPage -->|Renders| RegisterForm
    LoginPage -->|Renders| LoginForm
    ResetPwdPage -->|Renders| ResetForm
    UpdatePwdPage -->|Renders| UpdateForm
    
    DashboardPage -->|First deck| AuthCheck
    GeneratePage -->|Renders| AIGenForm
    GeneratePage -->|Renders| FlashcardGrid
    
    RegisterForm -->|POST| RegisterAPI
    LoginForm -->|POST| LoginAPI
    UserMenu -->|POST| LogoutAPI
    ResetForm -->|POST| ResetAPI
    UpdateForm -->|POST| UpdateAPI
    
    AIGenForm -->|POST| GenerateAPI
    AIGenForm -->|GET| UsageAPI
    
    RegisterAPI -->|Validation| AuthSchemas
    LoginAPI -->|Validation| AuthSchemas
    ResetAPI -->|Validation| AuthSchemas
    UpdateAPI -->|Validation| AuthSchemas
    
    GenerateAPI -->|Validation| AISchemas
    GenerateAPI -->|Uses| AIService
    
    AIService -->|Calls| OpenRouterClient
    AIService -->|Saves| SupabaseClient
    
    RegisterAPI --> SupabaseAuth
    LoginAPI --> SupabaseAuth
    LogoutAPI --> SupabaseAuth
    ResetAPI --> SupabaseAuth
    UpdateAPI --> SupabaseAuth
    
    SupabaseClient --> PostgreSQL
    SupabaseAuth --> PostgreSQL
    
    RegisterForm -.->|Uses| UIComponents
    LoginForm -.->|Uses| UIComponents
    ResetForm -.->|Uses| UIComponents
    UpdateForm -.->|Uses| UIComponents
    UserMenu -.->|Uses| UIComponents
    AIGenForm -.->|Uses| UIComponents
    FlashcardGrid -.->|Uses| UIComponents
    
    classDef newComponent fill:#4ade80,stroke:#22c55e,stroke-width:2px;
    classDef existingComponent fill:#60a5fa,stroke:#3b82f6,stroke-width:2px;
    classDef modifiedComponent fill:#fbbf24,stroke:#f59e0b,stroke-width:2px;
    classDef infrastructure fill:#a78bfa,stroke:#8b5cf6,stroke-width:2px;
    
    class RegisterPage,LoginPage,ResetPwdPage,UpdatePwdPage,DashboardPage,AuthLayoutComp newComponent;
    class RegisterForm,LoginForm,ResetForm,UpdateForm,UserMenu,AuthCheck newComponent;
    class RegisterAPI,LoginAPI,LogoutAPI,ResetAPI,UpdateAPI newComponent;
    class AuthSchemas newComponent;
    
    class IndexPage,GeneratePage,AIGenForm,FlashcardGrid,ThemeToggle,Welcome existingComponent;
    class GenerateAPI,UsageAPI,AIService,OpenRouterClient,AISchemas existingComponent;
    
    class MainLayout,Middleware,SupabaseClient modifiedComponent;
    
    class SupabaseAuth,PostgreSQL,UIComponents infrastructure;
```

</mermaid_diagram>

## Legend

**Colors:**
- 🟢 **Green** - New components required by authentication module
- 🔵 **Blue** - Existing components (no changes)
- 🟡 **Yellow** - Existing components requiring updates
- 🟣 **Purple** - Infrastructure and external libraries

## Architecture Description

### Main Pages (Astro)

**Public Pages:**
- `index.astro` - Home page accessible without authentication
- `auth/login.astro` - Login page (US-002)
- `auth/register.astro` - Registration page (US-001)
- `auth/reset-password.astro` - Password reset request (US-004)
- `auth/update-password.astro` - New password setup (US-004)

**Protected Pages:**
- `dashboard.astro` - Main dashboard after login, first deck creation prompt (US-005)
- `decks/[deck_id]/generate.astro` - AI flashcard generation (requires authentication)

### Layouts

- `Layout.astro` - Main layout with conditional navigation (authenticated/unauthenticated)
- `AuthLayout.astro` - Specialized layout for authentication pages (minimalist)

### Middleware and Protection

- `middleware/index.ts` - Verifies Supabase session, injects user context
- `AuthCheck.astro` - Server-side component for protecting sections requiring authentication

### React Components (Client-Side)

**Authentication:**
- `RegisterForm.tsx` - Registration form with validation (email as username, password)
- `LoginForm.tsx` - Login form
- `ResetPasswordForm.tsx` - Password reset link request
- `UpdatePasswordForm.tsx` - New password setup
- `UserMenu.tsx` - Dropdown menu with logout option

**Functionality:**
- `AIGenerationForm.tsx` - Flashcard generation from text
- `FlashcardGrid.tsx` - Display generated flashcards
- `ThemeToggle.tsx` - Light/dark theme toggle

### API Endpoints

**Authentication:**
- `/api/auth/register.ts` - User registration (US-001)
- `/api/auth/login.ts` - User login (US-002)
- `/api/auth/logout.ts` - User logout (US-003)
- `/api/auth/reset-password.ts` - Send email with reset link (US-004)
- `/api/auth/update-password.ts` - Update password after reset (US-004)

**Functionality:**
- `/api/ai/generate.ts` - AI flashcard generation (modified - uses authenticated user)
- `/api/ai/usage.ts` - Check AI usage limits

### Validation Layer

- `auth.schemas.ts` - Zod schemas for authentication data validation (email/username, password)
- `ai-generation.schemas.ts` - Zod schemas for flashcard generation

### Service Layer

- `ai-generation.service.ts` - Flashcard generation business logic
- `openrouter.client.ts` - OpenRouter API client for AI

### Database

- `supabase.client.ts` - Supabase client (modified - handles authenticated clients)
- `Supabase Auth` - Session and authentication management
- `PostgreSQL` - Database with RLS (Row Level Security)

## Key Changes in Existing Components

### Layout.astro
- Added conditional navigation (authenticated vs unauthenticated)
- Integration of `UserMenu` component
- Support for `requireAuth` and `showNavigation` props

### middleware/index.ts
- Supabase session verification from cookies
- User context injection into `locals`
- Redirects for protected routes
- Token refresh

### supabase.client.ts
- Removed usage of `DEFAULT_USER_ID`
- `createSupabaseClient()` function with access token support
- Distinction between authenticated client and admin

## Data Flow

**Registration (US-001):**
1. User → RegisterForm (email as username, password)
2. RegisterForm → POST /api/auth/register
3. API → auth.schemas.ts (validation)
4. API → Supabase Auth (create user)
5. Supabase Auth → PostgreSQL
6. Middleware → Set session cookies
7. Redirect → Dashboard

**Login (US-002):**
1. User → LoginForm (email as username, password)
2. LoginForm → POST /api/auth/login
3. API → auth.schemas.ts (validation)
4. API → Supabase Auth (verification)
5. Middleware → Set session cookies
6. Redirect → Dashboard

**Logout (US-003):**
1. UserMenu → POST /api/auth/logout
2. API → Supabase Auth (end session)
3. Middleware → Clear cookies
4. Redirect → Login

**Password Reset (US-004):**
1. ResetPasswordForm → POST /api/auth/reset-password (email as username)
2. API → Supabase Auth (send email)
3. Email → Link with token
4. UpdatePasswordForm → POST /api/auth/update-password
5. API → Supabase Auth (update password)

**Flashcard Generation:**
1. AIGenerationForm → POST /api/ai/generate
2. API → Middleware (verify session, get user_id)
3. API → ai-generation.schemas.ts (validation)
4. API → AIGenerationService
5. Service → OpenRouterClient (AI)
6. Service → Supabase Client (save with user_id)
7. PostgreSQL → RLS (verify ownership)

## Security

- **RLS (Row Level Security):** Automatic data filtering by `user_id`
- **HttpOnly Cookies:** XSS prevention
- **Server-Side Validation:** All data validated by Zod on server
- **Middleware Protection:** Automatic redirects for unauthorized users
- **Session Management:** Automatic token refresh by Supabase
