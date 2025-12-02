import { vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Mock Supabase client for unit tests
 * Provides mock implementations of commonly used Supabase methods
 */
export const createMockSupabaseClient = (): Partial<SupabaseClient> => {
  return {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: null },
        error: null,
      }),
      getUser: vi.fn().mockResolvedValue({
        data: { user: null },
        error: null,
      }),
      signInWithPassword: vi.fn().mockResolvedValue({
        data: { user: null, session: null },
        error: null,
      }),
      signUp: vi.fn().mockResolvedValue({
        data: { user: null, session: null },
        error: null,
      }),
      signOut: vi.fn().mockResolvedValue({
        error: null,
      }),
      resetPasswordForEmail: vi.fn().mockResolvedValue({
        data: {},
        error: null,
      }),
      updateUser: vi.fn().mockResolvedValue({
        data: { user: null },
        error: null,
      }),
    } as any,
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({
      data: null,
      error: null,
    }),
    maybeSingle: vi.fn().mockResolvedValue({
      data: null,
      error: null,
    }),
  } as any;
};

/**
 * Mock user session for authenticated tests
 */
export const mockUserSession = {
  access_token: "mock-access-token",
  refresh_token: "mock-refresh-token",
  expires_in: 3600,
  token_type: "bearer",
  user: {
    id: "test-user-id",
    email: "test@example.com",
    aud: "authenticated",
    role: "authenticated",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    app_metadata: {},
    user_metadata: {},
  },
};

/**
 * Mock authenticated Supabase client
 */
export const createMockAuthenticatedSupabaseClient = (): Partial<SupabaseClient> => {
  const mockClient = createMockSupabaseClient();

  // Override auth methods to return authenticated session
  mockClient.auth = {
    ...mockClient.auth,
    getSession: vi.fn().mockResolvedValue({
      data: { session: mockUserSession },
      error: null,
    }),
    getUser: vi.fn().mockResolvedValue({
      data: { user: mockUserSession.user },
      error: null,
    }),
  } as any;

  return mockClient;
};
