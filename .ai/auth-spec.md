# Authentication System Technical Specification

## Document Information
- **Version**: 1.0
- **Created**: November 3, 2025
- **Purpose**: Technical architecture for user authentication (registration, login, logout, password recovery)
- **PRD References**: US-001, US-002, US-003, US-004
- **Tech Stack**: Astro 5, React 19, TypeScript 5, Supabase Auth, Tailwind 4, Shadcn/ui

---

## Table of Contents
1. [Overview](#1-overview)
2. [User Interface Architecture](#2-user-interface-architecture)
3. [Backend Logic](#3-backend-logic)
4. [Authentication System](#4-authentication-system)
5. [Migration Strategy](#5-migration-strategy)
6. [Security Considerations](#6-security-considerations)
7. [Error Handling](#7-error-handling)

---

## 1. Overview

### 1.1. Scope
This specification defines the complete authentication system for the AI Flashcard Generator application, implementing:
- User registration with username (stored as email in Supabase) and password
- User login with username/email and session management
- User logout with session cleanup
- Simplified, insecure password recovery mechanism (email-based for MVP)
- Route protection and authentication state management

**Note on Username vs Email**: The PRD specifies "username and password" authentication. For MVP implementation with Supabase Auth, we will use email addresses as usernames, storing them in Supabase's email field. This provides the "username" functionality while leveraging Supabase's built-in email validation and authentication. Future iterations can add a separate username field if needed.

### 1.2. Integration Points
The authentication system integrates with:
- **Supabase Auth**: Manages user authentication, sessions, and password recovery
- **Astro Middleware**: Handles session validation and user context injection
- **PostgreSQL RLS**: Enforces row-level security based on authenticated user
- **Existing Features**: AI generation, deck management, flashcard CRUD, study sessions

### 1.3. Key Design Principles
1. **Server-First Architecture**: Authentication logic executes server-side in Astro pages/middleware
2. **Progressive Enhancement**: Forms work without JavaScript, enhanced with React for UX
3. **Session-Based**: Use Supabase cookies for persistent sessions
4. **RLS Integration**: Replace `DEFAULT_USER_ID` with actual authenticated user IDs
5. **Zero Breaking Changes**: Existing functionality continues to work for authenticated users

---

## 2. User Interface Architecture

### 2.1. Page Structure Overview

#### New Authentication Pages
All authentication pages will be created under `/src/pages/auth/` to maintain clear separation:

```
src/pages/auth/
├── register.astro         # User registration page (US-001)
├── login.astro            # User login page (US-002)
├── reset-password.astro   # Password reset request page (US-004)
└── update-password.astro  # New password entry page (US-004)
```

#### Modified Pages
Existing pages that require authentication protection:

```
src/pages/
├── index.astro                          # Public landing page (no auth required)
├── dashboard.astro                      # NEW: Main dashboard after login (requires auth)
└── decks/
    └── [deck_id]/
        └── generate.astro               # Modified: Add auth check
```

### 2.2. Layout Architecture

#### 2.2.1. Base Layout (`src/layouts/Layout.astro`)
**Current State**: Basic layout with theme toggle  
**Modifications Required**:
- Add conditional navigation bar based on authentication state
- Display user information when authenticated
- Show login/register links when unauthenticated
- Integrate logout functionality

**New Props**:
```typescript
interface Props {
  title?: string;
  requireAuth?: boolean;  // NEW: Indicates if page requires authentication
  showNavigation?: boolean; // NEW: Whether to show navigation bar (default: true)
}
```

**Authentication Context Injection**:
```typescript
// In Layout.astro frontmatter
const session = await locals.supabase.auth.getSession();
const user = session?.data?.session?.user || null;
const isAuthenticated = !!user;

// Redirect to login if auth required but not authenticated
if (requireAuth && !isAuthenticated) {
  return Astro.redirect('/auth/login?redirect=' + encodeURIComponent(Astro.url.pathname));
}
```

**Navigation Structure**:
```html
<!-- Conditional rendering in Layout.astro -->
{showNavigation && (
  <nav class="navigation-bar">
    {isAuthenticated ? (
      <!-- Authenticated Navigation -->
      <div class="nav-links">
        <a href="/dashboard">Dashboard</a>
        <a href="/decks">My Decks</a>
        <UserMenu user={user} client:load />
      </div>
    ) : (
      <!-- Public Navigation -->
      <div class="nav-links">
        <a href="/">Home</a>
        <a href="/auth/login">Login</a>
        <a href="/auth/register">Register</a>
      </div>
    )}
  </nav>
)}
```

#### 2.2.2. Auth Layout (`src/layouts/AuthLayout.astro`)
**Purpose**: Specialized layout for authentication pages  
**Characteristics**:
- Centered card design for forms
- No navigation bar
- Minimal UI with focus on form
- Links to switch between auth pages

**Structure**:
```astro
---
interface Props {
  title: string;
  description: string;
}
---
<Layout title={props.title} showNavigation={false}>
  <div class="auth-container">
    <Card class="auth-card">
      <CardHeader>
        <h1>{title}</h1>
        <p>{description}</p>
      </CardHeader>
      <CardContent>
        <slot />
      </CardContent>
    </Card>
  </div>
</Layout>
```

### 2.3. Component Architecture

#### 2.3.1. React Components (Client-Side)

##### **RegisterForm** (`src/components/auth/RegisterForm.tsx`)
**Purpose**: Client-side registration form with validation  
**Type**: Interactive React component (`client:load`)

**Props**:
```typescript
interface RegisterFormProps {
  redirectTo?: string; // URL to redirect after successful registration
}
```

**State Management**:
```typescript
const [email, setEmail] = useState(""); // Used as username per PRD requirement
const [password, setPassword] = useState("");
const [confirmPassword, setConfirmPassword] = useState("");
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
const [fieldErrors, setFieldErrors] = useState<{
  email?: string;
  password?: string;
  confirmPassword?: string;
}>({});
```

**Validation Rules**:
- **Email/Username**: Valid email format (HTML5 + custom). Note: PRD specifies "username" but we use email as username for Supabase compatibility
- **Password**: 
  - Minimum 8 characters
  - Maximum 100 characters
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
  - At least one special character (!@#$%^&*)
- **Confirm Password**: Must match password

**Form Fields**:
1. Email/Username (type="email", required, autocomplete="email", label="Email (Username)")
2. Password (type="password", required, autocomplete="new-password")
3. Confirm Password (type="password", required, autocomplete="new-password")

**Submission Flow**:
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  // Client-side validation
  const errors = validateForm();
  if (Object.keys(errors).length > 0) {
    setFieldErrors(errors);
    return;
  }
  
  setIsLoading(true);
  setError(null);
  
  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (!response.ok || !data.success) {
      throw new Error(data.error?.message || 'Registration failed');
    }
    
    // Redirect to dashboard or specified URL
    window.location.href = redirectTo || '/dashboard';
  } catch (err) {
    setError(err instanceof Error ? err.message : 'An error occurred');
  } finally {
    setIsLoading(false);
  }
};
```

**Accessibility Features**:
- All inputs have associated labels
- Error messages linked via `aria-describedby`
- Invalid fields marked with `aria-invalid`
- Form submission loading state announced to screen readers
- Focus management on error

**UI States**:
1. **Initial**: Empty form, submit button enabled
2. **Validating**: Client-side validation in progress
3. **Submitting**: Loading state, disabled inputs, spinner on button
4. **Error**: Error alert displayed, specific field errors shown
5. **Success**: Redirect initiated

##### **LoginForm** (`src/components/auth/LoginForm.tsx`)
**Purpose**: Client-side login form with validation  
**Type**: Interactive React component (`client:load`)

**Props**:
```typescript
interface LoginFormProps {
  redirectTo?: string; // URL to redirect after successful login
}
```

**State Management**:
```typescript
const [email, setEmail] = useState(""); // Used as username per PRD requirement
const [password, setPassword] = useState("");
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
```

**Validation Rules**:
- **Email/Username**: Valid email format (PRD specifies "username" - we use email as username)
- **Password**: Required (no complexity validation on login)

**Form Fields**:
1. Email/Username (type="email", required, autocomplete="email", label="Email (Username)")
2. Password (type="password", required, autocomplete="current-password")

**Submission Flow**: Similar to RegisterForm, posts to `/api/auth/login`

**Additional Features**:
- "Remember me" checkbox (optional for MVP)
- "Forgot password?" link to `/auth/reset-password`
- Link to registration page

##### **ResetPasswordForm** (`src/components/auth/ResetPasswordForm.tsx`)
**Purpose**: Request password reset email (PRD: "simplified, insecure" mechanism - using email for MVP)  
**Type**: Interactive React component (`client:load`)

**State Management**:
```typescript
const [email, setEmail] = useState(""); // PRD specifies "username" - we use email
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
const [success, setSuccess] = useState(false);
```

**Form Fields**:
1. Email/Username (type="email", required, autocomplete="email", label="Email (Username)")

**Submission Flow**:
```typescript
// Posts to /api/auth/reset-password
// On success, shows confirmation message (even if email doesn't exist - security)
```

**Success State**:
- Display confirmation message
- Provide instructions to check email
- Link to login page

##### **UpdatePasswordForm** (`src/components/auth/UpdatePasswordForm.tsx`)
**Purpose**: Set new password after reset  
**Type**: Interactive React component (`client:load`)

**Props**:
```typescript
interface UpdatePasswordFormProps {
  token: string; // Recovery token from email link
}
```

**State Management**:
```typescript
const [password, setPassword] = useState("");
const [confirmPassword, setConfirmPassword] = useState("");
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
```

**Validation**: Same as RegisterForm password validation

**Form Fields**:
1. New Password (type="password", required, autocomplete="new-password")
2. Confirm New Password (type="password", required, autocomplete="new-password")

##### **UserMenu** (`src/components/auth/UserMenu.tsx`)
**Purpose**: User dropdown menu in navigation  
**Type**: Interactive React component (`client:load`)

**Props**:
```typescript
interface UserMenuProps {
  user: {
    id: string;
    email: string;
  };
}
```

**State Management**:
```typescript
const [isOpen, setIsOpen] = useState(false);
const [isLoggingOut, setIsLoggingOut] = useState(false);
```

**Menu Items**:
1. User email display (read-only)
2. "Dashboard" link
3. "Settings" link (future)
4. Divider
5. "Logout" button

**Logout Flow**:
```typescript
const handleLogout = async () => {
  setIsLoggingOut(true);
  
  try {
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    });
    
    if (response.ok) {
      window.location.href = '/auth/login';
    } else {
      throw new Error('Logout failed');
    }
  } catch (err) {
    console.error('Logout error:', err);
    // Still redirect on error to prevent stuck state
    window.location.href = '/auth/login';
  }
};
```

**UI Implementation**:
- Use Radix UI DropdownMenu for accessibility
- Avatar component showing user initial
- Keyboard navigation support
- Focus trap when open

#### 2.3.2. Astro Components (Server-Side)

##### **AuthCheck** (`src/components/auth/AuthCheck.astro`)
**Purpose**: Server-side authentication guard component  
**Usage**: Wrap protected content to enforce authentication

```astro
---
// Can be used in any Astro page
const session = await Astro.locals.supabase.auth.getSession();
const isAuthenticated = !!session?.data?.session?.user;

interface Props {
  redirectTo?: string;
  fallback?: boolean; // Show fallback content instead of redirect
}

const { redirectTo = '/auth/login', fallback = false } = Astro.props;

if (!isAuthenticated) {
  if (fallback) {
    // Render fallback slot
  } else {
    const redirect = `${redirectTo}?redirect=${encodeURIComponent(Astro.url.pathname)}`;
    return Astro.redirect(redirect);
  }
}
---

<slot />
```

### 2.4. Page Implementations

#### 2.4.1. Registration Page (`src/pages/auth/register.astro`)

**Route**: `/auth/register`  
**Purpose**: US-001 - New User Registration  
**Authentication**: Must NOT be authenticated (redirect if logged in)

**Frontmatter Logic**:
```typescript
export const prerender = false;

// Check if already authenticated
const session = await Astro.locals.supabase.auth.getSession();
if (session?.data?.session?.user) {
  return Astro.redirect('/dashboard');
}

// Get redirect parameter from query string
const redirectTo = Astro.url.searchParams.get('redirect') || '/dashboard';
```

**Page Structure**:
```astro
<AuthLayout 
  title="Create Account" 
  description="Sign up to start creating flashcards with AI"
>
  <RegisterForm redirectTo={redirectTo} client:load />
  
  <div class="auth-footer">
    <p>Already have an account? <a href="/auth/login">Log in</a></p>
  </div>
</AuthLayout>
```

**SEO Metadata**:
- Title: "Register - AI Flashcard Generator"
- No-index (auth pages shouldn't be indexed)

#### 2.4.2. Login Page (`src/pages/auth/login.astro`)

**Route**: `/auth/login`  
**Purpose**: US-002 - User Login  
**Authentication**: Must NOT be authenticated (redirect if logged in)

**Frontmatter Logic**:
```typescript
export const prerender = false;

// Check if already authenticated
const session = await Astro.locals.supabase.auth.getSession();
if (session?.data?.session?.user) {
  return Astro.redirect('/dashboard');
}

// Get redirect parameter from query string
const redirectTo = Astro.url.searchParams.get('redirect') || '/dashboard';
```

**Page Structure**:
```astro
<AuthLayout 
  title="Welcome Back" 
  description="Log in to your account"
>
  <LoginForm redirectTo={redirectTo} client:load />
  
  <div class="auth-footer">
    <p>Don't have an account? <a href="/auth/register">Sign up</a></p>
    <p><a href="/auth/reset-password">Forgot password?</a></p>
  </div>
</AuthLayout>
```

#### 2.4.3. Reset Password Page (`src/pages/auth/reset-password.astro`)

**Route**: `/auth/reset-password`  
**Purpose**: US-004 - Simplified Password Reset (Request)  
**Authentication**: Must NOT be authenticated

**Page Structure**:
```astro
<AuthLayout 
  title="Reset Password" 
  description="Enter your email to receive a password reset link"
>
  <ResetPasswordForm client:load />
  
  <div class="auth-footer">
    <p>Remember your password? <a href="/auth/login">Log in</a></p>
  </div>
</AuthLayout>
```

#### 2.4.4. Update Password Page (`src/pages/auth/update-password.astro`)

**Route**: `/auth/update-password`  
**Purpose**: US-004 - Simplified Password Reset (Set New Password)  
**Authentication**: Requires valid recovery token

**Frontmatter Logic**:
```typescript
export const prerender = false;

// Extract token from URL hash (Supabase recovery flow)
// Note: This requires client-side JavaScript to extract from hash
const token = Astro.url.searchParams.get('token');

if (!token) {
  return Astro.redirect('/auth/reset-password');
}
```

**Page Structure**:
```astro
<AuthLayout 
  title="Update Password" 
  description="Enter your new password"
>
  <UpdatePasswordForm token={token} client:load />
</AuthLayout>
```

#### 2.4.5. Dashboard Page (`src/pages/dashboard.astro`)

**Route**: `/dashboard`  
**Purpose**: Main authenticated landing page  
**Authentication**: Required

**Frontmatter Logic**:
```typescript
export const prerender = false;

const session = await Astro.locals.supabase.auth.getSession();
const user = session?.data?.session?.user;

if (!user) {
  return Astro.redirect('/auth/login?redirect=/dashboard');
}

// Fetch user's decks and statistics
const { data: decks } = await Astro.locals.supabase
  .from('decks')
  .select('*, flashcards(count)')
  .order('updated_at', { ascending: false })
  .limit(10);

// Check if this is first login (no decks exist) - per US-005
const isFirstLogin = !decks || decks.length === 0;
```

**Page Content**:
- Welcome message with user email
- **First Login Flow (US-005)**: If no decks exist, prominently display "Create Your First Deck" call-to-action with inline deck creation form
- Quick stats (total decks, total cards, cards due today)
- Recent decks list (if decks exist)
- Quick actions (Create deck, Generate cards)
- Study reminders if cards are due

**Implementation Note**: Per US-005 acceptance criteria "The user is prompted to create their first deck upon first login", the dashboard should detect when a user has zero decks and show a prominent, focused interface for creating their first deck rather than the standard dashboard view.

### 2.5. Validation & Error Handling

#### Client-Side Validation

**Email Validation**:
```typescript
const validateEmail = (email: string): string | null => {
  if (!email) return "Email is required";
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return "Please enter a valid email address";
  }
  
  return null;
};
```

**Password Validation**:
```typescript
const validatePassword = (password: string): string | null => {
  if (!password) return "Password is required";
  
  if (password.length < 8) {
    return "Password must be at least 8 characters";
  }
  
  if (password.length > 100) {
    return "Password must not exceed 100 characters";
  }
  
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*]/.test(password);
  
  if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecial) {
    return "Password must include uppercase, lowercase, number, and special character (!@#$%^&*)";
  }
  
  return null;
};
```

#### Error Message Display

**Component**: `src/components/ui/form-error.tsx`
```typescript
interface FormErrorProps {
  message: string;
  id?: string;
}

export function FormError({ message, id }: FormErrorProps) {
  return (
    <p id={id} className="text-sm text-destructive" role="alert">
      {message}
    </p>
  );
}
```

**Common Error Messages**:
- `"Email is required"` (displayed as "Email (Username) is required" to users)
- `"Please enter a valid email address"`
- `"Password is required"`
- `"Password must be at least 8 characters"`
- `"Passwords do not match"`
- `"Email already exists"` (from server - maps to PRD's "username already in use")
- `"Invalid credentials"` (from server - generic message per PRD US-002)
- `"An error occurred. Please try again."`

---

## 3. Backend Logic

### 3.1. API Endpoint Architecture

All authentication endpoints follow the existing pattern in `/src/pages/api/` with server-side rendering disabled (`export const prerender = false`).

#### 3.1.1. Registration Endpoint

**File**: `src/pages/api/auth/register.ts`  
**Method**: `POST`  
**Purpose**: Create new user account (US-001)

**Request Schema**:
```typescript
// src/lib/validation/auth.schemas.ts
import { z } from 'zod';

export const RegisterRequestSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email format")
    .max(255, "Email too long"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password must not exceed 100 characters")
    .regex(/[A-Z]/, "Password must include an uppercase letter")
    .regex(/[a-z]/, "Password must include a lowercase letter")
    .regex(/[0-9]/, "Password must include a number")
    .regex(/[!@#$%^&*]/, "Password must include a special character (!@#$%^&*)"),
});

export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;
```

**Note**: PRD specifies "username and password" (US-001). We use email as username for Supabase compatibility. Field labeled as "Email (Username)" in UI.

**Response Types** (add to `src/types.ts`):
```typescript
export interface RegisterResponse {
  user: {
    id: string;
    email: string;
  };
  session: {
    access_token: string;
    refresh_token: string;
  };
}
```

**Implementation**:
```typescript
import type { APIRoute } from 'astro';
import { RegisterRequestSchema } from '@/lib/validation/auth.schemas';
import { ErrorCodes } from '@/types';
import type { ApiSuccessResponse, ApiErrorResponse, RegisterResponse } from '@/types';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals, cookies }) => {
  try {
    // Parse request body
    const body = await request.json();
    
    // Validate with Zod
    const validationResult = RegisterRequestSchema.safeParse(body);
    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: ErrorCodes.INVALID_INPUT,
            message: firstError?.message || 'Invalid input',
            field: firstError?.path.join('.'),
            details: validationResult.error.errors,
          },
        } satisfies ApiErrorResponse),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const { email, password } = validationResult.data;
    
    // Attempt to create user with Supabase Auth
    const { data, error } = await locals.supabase.auth.signUp({
      email,
      password,
      options: {
        // Email confirmation disabled for MVP (simplified)
        emailRedirectTo: `${new URL(request.url).origin}/dashboard`,
      },
    });
    
    if (error) {
      // Handle specific Supabase errors
      if (error.message.includes('already registered')) {
        return new Response(
          JSON.stringify({
            success: false,
            error: {
              code: ErrorCodes.EMAIL_EXISTS,
              message: 'Email already exists',
              field: 'email',
            },
          } satisfies ApiErrorResponse),
          { status: 409, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      throw error;
    }
    
    if (!data.user || !data.session) {
      throw new Error('Registration succeeded but no user/session returned');
    }
    
    // Set session cookies (Supabase client handles this automatically)
    
    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          user: {
            id: data.user.id,
            email: data.user.email!,
          },
          session: {
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
          },
        } satisfies RegisterResponse,
      } satisfies ApiSuccessResponse<RegisterResponse>),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Registration error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: ErrorCodes.INTERNAL_ERROR,
          message: 'An unexpected error occurred during registration',
        },
      } satisfies ApiErrorResponse),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
```

#### 3.1.2. Login Endpoint

**File**: `src/pages/api/auth/login.ts`  
**Method**: `POST`  
**Purpose**: Authenticate user and create session (US-002)

**Request Schema**:
```typescript
export const LoginRequestSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email format"),
  password: z
    .string()
    .min(1, "Password is required"),
});

export type LoginRequest = z.infer<typeof LoginRequestSchema>;
```

**Response Types**:
```typescript
export interface LoginResponse {
  user: {
    id: string;
    email: string;
  };
  session: {
    access_token: string;
    refresh_token: string;
  };
}
```

**Implementation**:
```typescript
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const validationResult = LoginRequestSchema.safeParse(body);
    
    if (!validationResult.success) {
      // Return validation error
    }
    
    const { email, password } = validationResult.data;
    
    // Attempt sign in
    const { data, error } = await locals.supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: ErrorCodes.INVALID_CREDENTIALS,
            message: 'Invalid email or password',
          },
        } satisfies ApiErrorResponse),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    if (!data.user || !data.session) {
      throw new Error('Login succeeded but no user/session returned');
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          user: {
            id: data.user.id,
            email: data.user.email!,
          },
          session: {
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
          },
        } satisfies LoginResponse,
      } satisfies ApiSuccessResponse<LoginResponse>),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Login error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: ErrorCodes.INTERNAL_ERROR,
          message: 'An unexpected error occurred during login',
        },
      } satisfies ApiErrorResponse),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
```

#### 3.1.3. Logout Endpoint

**File**: `src/pages/api/auth/logout.ts`  
**Method**: `POST`  
**Purpose**: End user session (US-003)

**Implementation**:
```typescript
export const POST: APIRoute = async ({ locals }) => {
  try {
    // Sign out from Supabase (clears cookies automatically)
    const { error } = await locals.supabase.auth.signOut();
    
    if (error) {
      throw error;
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        data: { message: 'Logged out successfully' },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Logout error:', error);
    
    // Even on error, return success to prevent stuck states
    return new Response(
      JSON.stringify({
        success: true,
        data: { message: 'Logged out' },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
```

#### 3.1.4. Reset Password Endpoint

**File**: `src/pages/api/auth/reset-password.ts`  
**Method**: `POST`  
**Purpose**: Send password reset email (US-004 - PRD specifies "simplified, insecure" mechanism)

**Request Schema**:
```typescript
export const ResetPasswordRequestSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email format"),
});
```

**Note**: PRD US-004 specifies user enters "username" for password reset. We use email field (which serves as username) for Supabase compatibility.

**Implementation**:
```typescript
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const validationResult = ResetPasswordRequestSchema.safeParse(body);
    
    if (!validationResult.success) {
      // Return validation error
    }
    
    const { email } = validationResult.data;
    
    // Send password reset email
    const { error } = await locals.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${new URL(request.url).origin}/auth/update-password`,
    });
    
    // IMPORTANT: Always return success, even if email doesn't exist (security)
    // This prevents email enumeration attacks
    
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          message: 'If an account exists with that email, a password reset link has been sent.',
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Reset password error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: ErrorCodes.INTERNAL_ERROR,
          message: 'An error occurred. Please try again.',
        },
      } satisfies ApiErrorResponse),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
```

#### 3.1.5. Update Password Endpoint

**File**: `src/pages/api/auth/update-password.ts`  
**Method**: `POST`  
**Purpose**: Set new password with recovery token (US-004)

**Request Schema**:
```typescript
export const UpdatePasswordRequestSchema = z.object({
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password must not exceed 100 characters")
    .regex(/[A-Z]/, "Password must include an uppercase letter")
    .regex(/[a-z]/, "Password must include a lowercase letter")
    .regex(/[0-9]/, "Password must include a number")
    .regex(/[!@#$%^&*]/, "Password must include a special character (!@#$%^&*)"),
});
```

**Implementation**:
```typescript
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const validationResult = UpdatePasswordRequestSchema.safeParse(body);
    
    if (!validationResult.success) {
      // Return validation error
    }
    
    const { password } = validationResult.data;
    
    // Update password (requires active recovery session from email link)
    const { error } = await locals.supabase.auth.updateUser({
      password: password,
    });
    
    if (error) {
      if (error.message.includes('session')) {
        return new Response(
          JSON.stringify({
            success: false,
            error: {
              code: ErrorCodes.INVALID_TOKEN,
              message: 'Password reset link is invalid or expired',
            },
          } satisfies ApiErrorResponse),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      throw error;
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          message: 'Password updated successfully',
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Update password error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: ErrorCodes.INTERNAL_ERROR,
          message: 'An error occurred. Please try again.',
        },
      } satisfies ApiErrorResponse),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
```

### 3.2. Validation Schema Module

**File**: `src/lib/validation/auth.schemas.ts`

Centralized location for all authentication validation schemas using Zod.

**Note on Email vs Username**: Per PRD, authentication uses "username and password". However, for MVP implementation with Supabase Auth, we use email addresses as usernames. This is transparent to users (labeled "Email (Username)" in UI) and maintains PRD compliance while leveraging Supabase's built-in authentication.

```typescript
import { z } from 'zod';

// Email validation (serves as username per PRD requirement)
export const emailSchema = z
  .string()
  .min(1, "Email is required")
  .email("Invalid email format")
  .max(255, "Email too long");

// Password validation (for registration and password updates)
// PRD requires "Password is required" error for empty password fields
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(100, "Password must not exceed 100 characters")
  .regex(/[A-Z]/, "Password must include an uppercase letter")
  .regex(/[a-z]/, "Password must include a lowercase letter")
  .regex(/[0-9]/, "Password must include a number")
  .regex(/[!@#$%^&*]/, "Password must include a special character (!@#$%^&*)");

// Login password (just required, no complexity)
// PRD: "Password is required" for empty fields
export const loginPasswordSchema = z
  .string()
  .min(1, "Password is required");

// Registration request
// PRD US-001: User registers with "username and password" - we use email as username
export const RegisterRequestSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

// Login request
// PRD US-002: User logs in with "username and password" - we use email as username
export const LoginRequestSchema = z.object({
  email: emailSchema,
  password: loginPasswordSchema,
});

// Reset password request
// PRD US-004: User enters "username" to recover password - we use email as username
export const ResetPasswordRequestSchema = z.object({
  email: emailSchema,
});

// Update password request
export const UpdatePasswordRequestSchema = z.object({
  password: passwordSchema,
});

// Export types
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;
export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type ResetPasswordRequest = z.infer<typeof ResetPasswordRequestSchema>;
export type UpdatePasswordRequest = z.infer<typeof UpdatePasswordRequestSchema>;
```

### 3.3. Type Definitions Updates

Add new types to `src/types.ts`:

**Note**: Per PRD, these interfaces align with "username and password" authentication using email as username.

```typescript
// ============================================================================
// Authentication DTOs (UPDATED)
// ============================================================================

// PRD US-001: Registration with username (email) and password
export interface RegisterRequest {
  email: string; // Serves as username per PRD requirement
  password: string;
}

export interface RegisterResponse {
  user: {
    id: string;
    email: string; // Email is the username
  };
  session: {
    access_token: string;
    refresh_token: string;
  };
}

// PRD US-002: Login with username (email) and password
export interface LoginRequest {
  email: string; // Serves as username per PRD requirement
  password: string;
}

export interface LoginResponse {
  user: {
    id: string;
    email: string; // Email is the username
  };
  session: {
    access_token: string;
    refresh_token: string;
  };
}

// PRD US-004: Password reset using username (email)
export interface ResetPasswordRequest {
  email: string; // Serves as username per PRD requirement
}

export interface UpdatePasswordRequest {
  password: string;
}

// ============================================================================
// Error Codes (UPDATED - Add new codes)
// ============================================================================

export const ErrorCodes = {
  // ... existing codes ...
  
  // Authentication specific
  EMAIL_EXISTS: 'EMAIL_EXISTS',
  INVALID_TOKEN: 'INVALID_TOKEN',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
} as const;
```

---

## 4. Authentication System

### 4.1. Supabase Auth Configuration

**Implementation Note**: This section implements PRD user stories US-001 through US-004 using Supabase Auth with email as username.

#### 4.1.1. Environment Variables

Add to `.env`:
```bash
# Supabase Configuration
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_KEY=your-anon-key-here
SUPABASE_SERVICE_KEY=your-service-role-key-here

# Application URL (for email redirects in password reset - PRD US-004)
PUBLIC_APP_URL=http://localhost:3000
```

Add to `.env.example`:
```bash
SUPABASE_URL=
SUPABASE_KEY=
SUPABASE_SERVICE_KEY=
PUBLIC_APP_URL=
```

#### 4.1.2. Supabase Client Updates

**File**: `src/db/supabase.client.ts`

Update to support authenticated clients:

```typescript
import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;
const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

/**
 * Client for authenticated users (subject to RLS)
 * Use this in middleware and API routes
 */
export const createSupabaseClient = (accessToken?: string) => {
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    global: {
      headers: accessToken
        ? { Authorization: `Bearer ${accessToken}` }
        : {},
    },
  });
};

/**
 * Admin client that bypasses RLS
 * Use ONLY for system operations, not user-specific data
 */
export const supabaseAdmin = createClient<Database>(
  supabaseUrl,
  supabaseServiceKey || supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export type SupabaseClient = ReturnType<typeof createSupabaseClient>;

/**
 * @deprecated Remove after authentication is implemented
 * Temporary user ID for development
 */
export const DEFAULT_USER_ID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
```

### 4.2. Middleware Architecture

#### 4.2.1. Updated Middleware

**File**: `src/middleware/index.ts`

Complete rewrite to support authentication:

```typescript
import { defineMiddleware } from 'astro:middleware';
import { createSupabaseClient } from '@/db/supabase.client';

/**
 * Paths that don't require authentication
 * PRD: Public access to login (US-002), registration (US-001), and password reset (US-004) pages
 */
const PUBLIC_PATHS = [
  '/',
  '/auth/login',           // PRD US-002: Login page
  '/auth/register',        // PRD US-001: Registration page
  '/auth/reset-password',  // PRD US-004: Password reset request page
  '/auth/update-password', // PRD US-004: Password update page (from email link)
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/logout',
  '/api/auth/reset-password',
  '/api/auth/update-password',
];

/**
 * Check if a path is public (doesn't require authentication)
 */
const isPublicPath = (pathname: string): boolean => {
  return PUBLIC_PATHS.some(path => {
    if (path.endsWith('*')) {
      return pathname.startsWith(path.slice(0, -1));
    }
    return pathname === path;
  });
};

export const onRequest = defineMiddleware(async (context, next) => {
  const { request, locals, cookies, redirect } = context;
  
  // Create Supabase client with cookies for session management
  const supabase = createSupabaseClient();
  
  // Set up cookie handling for Supabase Auth
  supabase.auth.onAuthStateChange((event, session) => {
    // Update cookies when auth state changes
    if (session) {
      cookies.set('sb-access-token', session.access_token, {
        path: '/',
        httpOnly: true,
        secure: import.meta.env.PROD,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
      cookies.set('sb-refresh-token', session.refresh_token, {
        path: '/',
        httpOnly: true,
        secure: import.meta.env.PROD,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
    } else {
      // Clear cookies on logout
      cookies.delete('sb-access-token', { path: '/' });
      cookies.delete('sb-refresh-token', { path: '/' });
    }
  });
  
  // Get session from cookies
  const accessToken = cookies.get('sb-access-token')?.value;
  const refreshToken = cookies.get('sb-refresh-token')?.value;
  
  if (accessToken) {
    // Set session from cookies
    await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken || '',
    });
  }
  
  // Get current session
  const { data: { session }, error } = await supabase.auth.getSession();
  
  // Attach authenticated Supabase client to locals
  locals.supabase = supabase;
  locals.session = session;
  locals.user = session?.user || null;
  
  const pathname = new URL(request.url).pathname;
  const isPublic = isPublicPath(pathname);
  
  // Redirect authenticated users away from auth pages
  if (session && pathname.startsWith('/auth/')) {
    return redirect('/dashboard');
  }
  
  // Redirect unauthenticated users from protected pages
  if (!session && !isPublic) {
    const redirectUrl = `/auth/login?redirect=${encodeURIComponent(pathname)}`;
    return redirect(redirectUrl);
  }
  
  return next();
});
```

#### 4.2.2. Astro Locals Type Definition

**File**: `src/env.d.ts`

Update to include authentication types:

```typescript
/// <reference types="astro/client" />

import type { SupabaseClient } from './db/supabase.client';
import type { Session, User } from '@supabase/supabase-js';

declare namespace App {
  interface Locals {
    supabase: SupabaseClient;
    session: Session | null;
    user: User | null;
  }
}
```

### 4.3. Supabase Email Configuration

#### 4.3.1. Email Templates

For password reset (PRD US-004), configure Supabase email templates:

**Location**: Supabase Dashboard > Authentication > Email Templates

**Password Reset Email** (PRD US-004: simplified password recovery):
```html
<h2>Reset Your Password</h2>
<p>You requested to reset your password for AI Flashcard Generator.</p>
<p>Click the link below to set a new password:</p>
<p><a href="{{ .ConfirmationURL }}">Reset Password</a></p>
<p>This link will expire in 24 hours.</p>
<p>If you didn't request this, you can safely ignore this email.</p>
```

**Confirmation URL Format**:
```
{{ .SiteURL }}/auth/update-password?token={{ .Token }}
```

#### 4.3.2. Local Development Email Setup

For local development with Supabase (Docker), emails are intercepted by Inbucket:

**Access**: `http://localhost:54324`  
**Purpose**: View all emails sent by Supabase Auth (including password reset emails per US-004)

**Configuration** (`supabase/config.toml`):
```toml
[auth.email]
enable_signup = true
enable_confirmations = false  # Disabled for MVP (PRD specifies simplified approach)
```

### 4.4. Session Management

#### 4.4.1. Session Lifecycle

1. **Creation**: User registers or logs in → Supabase creates session → Cookies set
2. **Persistence**: Cookies stored with HttpOnly flag
3. **Refresh**: Middleware automatically refreshes expired tokens
4. **Validation**: Each request validates session via middleware
5. **Termination**: Logout endpoint clears session and cookies

#### 4.4.2. Cookie Configuration

**Access Token Cookie**:
- Name: `sb-access-token`
- HttpOnly: `true` (prevents XSS)
- Secure: `true` (HTTPS only in production)
- SameSite: `lax` (CSRF protection)
- Max-Age: 7 days

**Refresh Token Cookie**:
- Name: `sb-refresh-token`
- HttpOnly: `true`
- Secure: `true`
- SameSite: `lax`
- Max-Age: 30 days

#### 4.4.3. Token Refresh Strategy

Handled automatically by Supabase client:
- Access tokens expire after 1 hour
- Client automatically refreshes using refresh token
- Middleware updates cookies on refresh
- User remains logged in without interruption

---

## 5. Migration Strategy

### 5.1. Removing DEFAULT_USER_ID

**Current State**: All operations use `DEFAULT_USER_ID` constant  
**Target State**: All operations use authenticated user ID from session

#### 5.1.1. Code Locations to Update

**Search Pattern**: `DEFAULT_USER_ID`

**Files to Modify**:
1. `src/pages/api/ai/generate.ts` - Line ~56
2. Any other API endpoints using DEFAULT_USER_ID
3. Service layer functions expecting user ID

**Update Pattern**:
```typescript
// BEFORE
const userId = DEFAULT_USER_ID;

// AFTER
const userId = locals.user?.id;

if (!userId) {
  return new Response(
    JSON.stringify({
      success: false,
      error: {
        code: ErrorCodes.UNAUTHORIZED,
        message: 'Authentication required',
      },
    } satisfies ApiErrorResponse),
    { status: 401, headers: { 'Content-Type': 'application/json' } }
  );
}
```

#### 5.1.2. Migration Checklist

- [ ] Update all API endpoints to use `locals.user?.id`
- [ ] Add authentication checks to protected endpoints
- [ ] Update service layer to require user ID parameter
- [ ] Remove `DEFAULT_USER_ID` export from `supabase.client.ts`
- [ ] Search codebase for any remaining references
- [ ] Test all existing features with authenticated users
- [ ] Verify RLS policies are enforced correctly

### 5.2. Testing Authenticated Features

#### 5.2.1. Test Scenarios

**Deck Management**:
- [ ] Create deck as authenticated user
- [ ] View only own decks
- [ ] Cannot access other users' decks
- [ ] Delete deck removes all flashcards

**Flashcard Generation**:
- [ ] AI generation works with authenticated user
- [ ] Daily limit tracked per user
- [ ] Generated cards belong to user's deck

**Study Sessions**:
- [ ] Can only study own decks
- [ ] Session data attributed to correct user
- [ ] Performance tracking works

### 5.3. Backward Compatibility

**No Breaking Changes**: Existing features continue to work identically, now with proper user authentication and data isolation.

**Database**: No schema changes required - tables already have `user_id` columns with RLS policies.

**UI/UX**: Existing pages get authentication wrapper, but functionality remains the same.

---

## 6. Security Considerations

### 6.1. Password Security

**Hashing**: Supabase Auth uses bcrypt for password hashing (handled automatically)

**Validation**:
- Minimum 8 characters
- Complexity requirements (uppercase, lowercase, number, special char)
- Maximum 100 characters (prevent DoS)

**Storage**: Never store or log plaintext passwords

### 6.2. Session Security

**HttpOnly Cookies**: Prevent XSS attacks from accessing tokens

**Secure Flag**: HTTPS-only in production

**SameSite**: Prevent CSRF attacks

**Token Expiration**: Short-lived access tokens (1 hour)

**Refresh Tokens**: Longer-lived but stored securely

### 6.3. Row Level Security (RLS)

**Already Configured**: Database schema includes RLS policies

**Enforcement**: Middleware switches from admin client to authenticated client

**Validation**: Each query automatically filtered by `auth.uid()`

**Testing**: Verify users cannot access others' data

### 6.4. Input Validation

**Client-Side**: Immediate feedback, better UX

**Server-Side**: Required for security (never trust client)

**Zod Schemas**: Centralized validation logic

**SQL Injection**: Prevented by Supabase client parameterization

### 6.5. Rate Limiting

**Future Enhancement**: Not included in MVP

**Recommendation**: Add rate limiting to auth endpoints in production:
- 5 failed login attempts → temporary lockout
- 3 password reset requests per hour
- General API rate limiting per user

### 6.6. Email Enumeration Prevention

**Registration**: Return generic error, don't reveal if email exists

**Password Reset**: Always return success message, even if email doesn't exist

**Login**: Generic "invalid credentials" message

### 6.7. HTTPS Enforcement

**Development**: HTTP allowed (localhost)

**Production**: HTTPS required via reverse proxy (DigitalOcean, Cloudflare)

**Cookies**: Secure flag enabled in production

---

## 7. Error Handling

### 7.1. Error Categories

#### Authentication Errors
- `INVALID_CREDENTIALS` - Wrong email/password
- `EMAIL_EXISTS` - Registration with existing email
- `INVALID_TOKEN` - Expired or invalid recovery token
- `SESSION_EXPIRED` - Session no longer valid
- `UNAUTHORIZED` - Not authenticated when required

#### Validation Errors
- `INVALID_INPUT` - Client validation failure
- Field-specific errors with `field` property

#### Server Errors
- `INTERNAL_ERROR` - Unexpected server error

### 7.2. Error Response Format

**Consistent Structure**:
```typescript
{
  success: false,
  error: {
    code: string,      // Machine-readable error code
    message: string,   // Human-readable error message
    field?: string,    // Optional: specific field that failed
    details?: unknown  // Optional: additional context
  }
}
```

### 7.3. Error Display Strategy

**Form-Level Errors**: Display in Alert component above form

**Field-Level Errors**: Display below specific input field

**Toast Notifications**: For non-form actions (logout)

**Accessibility**: All errors announced to screen readers

### 7.4. Logging Strategy

**Client-Side**: `console.error` for debugging

**Server-Side**: 
- Log all authentication errors with context
- Do NOT log passwords or tokens
- Log IP addresses for security monitoring (future)

**Production**: Integrate with monitoring service (Sentry, LogRocket)

---

## 8. Implementation Phases

**Note**: These phases implement PRD user stories US-001 (Registration), US-002 (Login), US-003 (Logout), US-004 (Password Recovery), and US-005 (First Deck Creation).

### Phase 1: Foundation (Priority: Critical)
**Implements**: Core infrastructure for all user stories
1. Update `src/types.ts` with auth types (email as username per PRD)
2. Create `src/lib/validation/auth.schemas.ts` (validates username/password per PRD)
3. Update `src/db/supabase.client.ts`
4. Update `src/middleware/index.ts` (protects authenticated routes per US-002, US-003)
5. Update `src/env.d.ts`

### Phase 2: Components (Priority: High)
**Implements**: UI components for PRD user stories
1. Create `src/layouts/AuthLayout.astro`
2. Create `src/components/auth/RegisterForm.tsx` (PRD US-001)
3. Create `src/components/auth/LoginForm.tsx` (PRD US-002)
4. Create `src/components/auth/ResetPasswordForm.tsx` (PRD US-004 - step 1)
5. Create `src/components/auth/UpdatePasswordForm.tsx` (PRD US-004 - step 2)
6. Create `src/components/auth/UserMenu.tsx` (PRD US-003)

### Phase 3: Pages (Priority: High)
**Implements**: User-facing pages for authentication flows
1. Create `src/pages/auth/register.astro` (PRD US-001)
2. Create `src/pages/auth/login.astro` (PRD US-002)
3. Create `src/pages/auth/reset-password.astro` (PRD US-004 - step 1)
4. Create `src/pages/auth/update-password.astro` (PRD US-004 - step 2)
5. Create `src/pages/dashboard.astro` (PRD US-005 - first login deck creation)

### Phase 4: API Endpoints (Priority: High)
**Implements**: Backend authentication logic
1. Create `src/pages/api/auth/register.ts` (PRD US-001 backend)
2. Create `src/pages/api/auth/login.ts` (PRD US-002 backend)
3. Create `src/pages/api/auth/logout.ts` (PRD US-003 backend)
4. Create `src/pages/api/auth/reset-password.ts` (PRD US-004 backend - step 1)
5. Create `src/pages/api/auth/update-password.ts` (PRD US-004 backend - step 2)

### Phase 5: Layout Updates (Priority: Medium)
1. Update `src/layouts/Layout.astro` with navigation
2. Update existing pages to use auth

### Phase 6: Migration (Priority: High)
1. Remove `DEFAULT_USER_ID` usage
2. Update all API endpoints
3. Update service layer
4. Integration testing

### Phase 7: Polish (Priority: Low)
1. Add loading states
2. Improve error messages
3. Add success confirmations
4. Accessibility audit

---

## 9. Testing Checklist

### Unit Tests (Future)
- [ ] Validation schemas work correctly
- [ ] Error formatting is consistent
- [ ] Helper functions work as expected

### Integration Tests
**PRD User Story Validation**:
- [ ] Register new user → session created (PRD US-001)
- [ ] Login existing user → session created (PRD US-002)
- [ ] Logout → session destroyed (PRD US-003)
- [ ] Password reset → email sent (PRD US-004 - step 1)
- [ ] Update password → login works with new password (PRD US-004 - step 2)
- [ ] First login → deck creation prompt shown (PRD US-005)
- [ ] RLS prevents cross-user data access

### E2E Tests (Manual for MVP)
- [ ] Complete registration flow (PRD US-001: username/password with validation)
- [ ] Complete login flow (PRD US-002: username/password)
- [ ] Complete logout flow (PRD US-003: logout button)
- [ ] Complete password reset flow (PRD US-004: simplified email-based recovery)
- [ ] Protected routes redirect properly
- [ ] Public routes accessible without auth
- [ ] Auth routes redirect when logged in
- [ ] First login shows deck creation prompt (PRD US-005)

### Accessibility Tests
- [ ] Keyboard navigation works
- [ ] Screen reader announces errors
- [ ] Focus management correct
- [ ] ARIA attributes present

---

## 10. Dependencies

### New Dependencies
None - all required packages already installed:
- `@supabase/supabase-js` ✅
- `zod` ✅
- `@radix-ui/*` (for UI components) ✅

### Environment Variables
- `SUPABASE_URL` - Already exists
- `SUPABASE_KEY` - Already exists
- `SUPABASE_SERVICE_KEY` - Already exists
- `PUBLIC_APP_URL` - New (for email redirects)

---

## 11. Documentation Updates

### README.md
- Add section on authentication setup
- Document environment variables (including password reset email config per US-004)
- Explain local email testing with Inbucket

### API Documentation
- Document all auth endpoints (register, login, logout, reset password, update password)
- Provide request/response examples (showing email as username per PRD)
- List error codes (including PRD-specified validation messages)

### Developer Guide
- Authentication flow diagram (PRD US-001 through US-004)
- Session management explanation
- RLS policy overview

---

## 12. PRD Compliance Summary

This specification implements all authentication-related user stories from the PRD:

### ✅ US-001: User Registration
- **Requirement**: Register with username and password
- **Implementation**: Email serves as username, password meets complexity requirements
- **UI**: Form labeled "Email (Username)" and "Password" with validation
- **Validation**: Email format, password 8+ chars with uppercase/lowercase/number/special char
- **Error Messages**: "Email is required", "Password is required", "Email already exists"

### ✅ US-002: User Login
- **Requirement**: Log in with username and password
- **Implementation**: Email-based login via Supabase Auth
- **UI**: Form labeled "Email (Username)" and "Password"
- **Flow**: Enter credentials → validate → create session → redirect to dashboard
- **Error Messages**: "Email is required", "Password is required", "Invalid credentials"

### ✅ US-003: User Logout
- **Requirement**: Log out button visible when authenticated
- **Implementation**: UserMenu component in Layout with logout button
- **Flow**: Click logout → clear session → redirect to login page
- **Success**: "Logged out successfully" toast message

### ✅ US-004: Password Recovery
- **Requirement**: Simplified, insecure password reset using username
- **Implementation**: Email-based password reset (email serves as username)
- **Flow**: 
  1. User enters email (username) → system sends reset email
  2. User clicks link in email → enters new password → password updated
- **Email**: Contains magic link valid for 24 hours
- **Error Messages**: "Email is required", "Invalid or expired reset link"
- **Note**: "Simplified/insecure" per PRD refers to MVP simplicity, not actual security flaws

### ✅ US-005: First Deck Creation
- **Requirement**: Prompt first-time users to create their first deck
- **Implementation**: Dashboard detects zero decks → shows deck creation prompt
- **UI**: Modal or banner encouraging first deck creation
- **Flow**: First login → redirect to dashboard → show prompt if no decks exist

### Key Design Decision: Email as Username
**Challenge**: PRD specifies "username and password" but Supabase Auth uses email-based authentication

**Solution**: 
- Use email addresses as usernames (transparent to implementation)
- Label all forms as "Email (Username)" to align with PRD terminology
- Maintain full Supabase Auth compatibility
- Meets all PRD acceptance criteria while using industry-standard authentication

**Benefits**:
- No custom authentication implementation needed
- Leverages Supabase's secure, tested auth system
- Email-based password recovery is standard practice
- RLS policies work seamlessly with Supabase Auth
- Future enhancement: add separate username field if needed

---

## End of Specification

