import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SignInPage from "./page";

const mockPush = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
    },
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => ({
    get: vi.fn(),
  }),
}));

describe("SignInPage - UI Display", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render sign in form with all required fields", () => {
    render(<SignInPage />);

    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });

  it("should show link to forgot password", () => {
    render(<SignInPage />);
    expect(screen.getByRole("link", { name: /forgot password/i })).toBeInTheDocument();
  });

  it("should show link to sign up", () => {
    render(<SignInPage />);
    expect(screen.getByRole("link", { name: /sign up/i })).toBeInTheDocument();
  });
});

describe("SignInPage - Validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should validate email format", async () => {
    const user = userEvent.setup();
    render(<SignInPage />);

    const emailInput = screen.getByPlaceholderText(/email/i);
    const passwordInput = screen.getByPlaceholderText(/password/i);
    const submitBtn = screen.getByRole("button", { name: /sign in/i });

    await user.type(emailInput, "invalid-email");
    await user.type(passwordInput, "password123");
    await user.click(submitBtn);

    expect(await screen.findByText(/invalid email format/i)).toBeInTheDocument();
  });

  it("should validate password length", async () => {
    const user = userEvent.setup();
    render(<SignInPage />);

    const emailInput = screen.getByPlaceholderText(/email/i);
    const passwordInput = screen.getByPlaceholderText(/password/i);
    const submitBtn = screen.getByRole("button", { name: /sign in/i });

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "12345");
    await user.click(submitBtn);

    expect(await screen.findByText(/password must be at least 6 characters/i)).toBeInTheDocument();
  });

  it("should disable button while loading", async () => {
    const user = userEvent.setup();
    const { supabase } = await import("@/lib/supabase/client");

    vi.mocked(supabase.auth.signInWithPassword).mockImplementationOnce(
      () => new Promise(resolve => setTimeout(() => resolve({ data: { user: null }, error: null }), 500))
    );

    render(<SignInPage />);

    const emailInput = screen.getByPlaceholderText(/email/i);
    const passwordInput = screen.getByPlaceholderText(/password/i);
    const submitBtn = screen.getByRole("button", { name: /sign in/i });

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "password123");
    await user.click(submitBtn);

    expect(submitBtn).toBeDisabled();
  });
});

describe("SignInPage - API Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call signInWithPassword with correct payload", async () => {
    const user = userEvent.setup();
    const { supabase } = await import("@/lib/supabase/client");

    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce({
      data: { user: { id: "test-id", email: "john@example.com", email_confirmed_at: "2026-05-06T00:00:00Z" }, session: null },
      error: null,
    });

    render(<SignInPage />);

    await user.type(screen.getByPlaceholderText(/email/i), "john@example.com");
    await user.type(screen.getByPlaceholderText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(vi.mocked(supabase.auth.signInWithPassword)).toHaveBeenCalledWith({
        email: "john@example.com",
        password: "password123",
      });
    });
  });

  it("should handle invalid credentials error", async () => {
    const user = userEvent.setup();
    const { supabase } = await import("@/lib/supabase/client");

    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce({
      data: { user: null },
      error: new Error("Invalid login credentials"),
    });

    render(<SignInPage />);

    await user.type(screen.getByPlaceholderText(/email/i), "john@example.com");
    await user.type(screen.getByPlaceholderText(/password/i), "wrongpassword");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByText(/invalid email or password/i)).toBeInTheDocument();
  });

  it("should handle unverified email error", async () => {
    const user = userEvent.setup();
    const { supabase } = await import("@/lib/supabase/client");

    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce({
      data: { user: { email_confirmed_at: null } },
      error: null,
    });

    render(<SignInPage />);

    await user.type(screen.getByPlaceholderText(/email/i), "john@example.com");
    await user.type(screen.getByPlaceholderText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByText(/please verify your email before signing in/i)).toBeInTheDocument();
  });
});
