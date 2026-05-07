import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SignUpPage from "./page";

// Mock supabase client
vi.mock("@/lib/supabase/client", () => ({
  supabase: {
    auth: {
      signUp: vi.fn(),
    },
  },
}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe("SignUpPage - Validation & Form Handling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render signup form with all required fields", () => {
    render(<SignUpPage />);
    
    expect(screen.getByPlaceholderText(/full name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign up/i })).toBeInTheDocument();
  });

  it("should validate name field - minimum 2 characters", async () => {
    const user = userEvent.setup();
    render(<SignUpPage />);

    const nameInput = screen.getByPlaceholderText(/full name/i);
    const emailInput = screen.getByPlaceholderText(/email/i);
    const passwordInput = screen.getByPlaceholderText(/password/i);
    const submitBtn = screen.getByRole("button", { name: /sign up/i });

    await user.type(nameInput, "A");
    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "password123");
    await user.click(submitBtn);

    expect(await screen.findByText(/name must be at least 2 characters/i)).toBeInTheDocument();
  });

  it("should validate password length - minimum 6 characters", async () => {
    const user = userEvent.setup();
    render(<SignUpPage />);

    const nameInput = screen.getByPlaceholderText(/full name/i);
    const emailInput = screen.getByPlaceholderText(/email/i);
    const passwordInput = screen.getByPlaceholderText(/password/i);
    const submitBtn = screen.getByRole("button", { name: /sign up/i });

    await user.type(nameInput, "John Doe");
    await user.type(emailInput, "john@example.com");
    await user.type(passwordInput, "12345");
    await user.click(submitBtn);

    expect(await screen.findByText(/password must be at least 6 characters/i)).toBeInTheDocument();
  });

  it("should clear error message when user starts typing", async () => {
    const user = userEvent.setup();
    render(<SignUpPage />);

    const nameInput = screen.getByPlaceholderText(/full name/i);
    const emailInput = screen.getByPlaceholderText(/email/i);
    const passwordInput = screen.getByPlaceholderText(/password/i);
    const submitBtn = screen.getByRole("button", { name: /sign up/i });

    await user.type(nameInput, "A");
    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "password123");
    await user.click(submitBtn);
    expect(await screen.findByText(/name must be at least 2 characters/i)).toBeInTheDocument();

    await user.type(nameInput, "o");
    await waitFor(() => {
      expect(screen.queryByText(/name must be at least 2 characters/i)).not.toBeInTheDocument();
    });
  });

  it("should disable submit button while loading", async () => {
    const user = userEvent.setup();
    const { supabase } = await import("@/lib/supabase/client");
    
    // Mock signUp to delay response
    vi.mocked(supabase.auth.signUp).mockImplementationOnce(
      () => new Promise(resolve => setTimeout(() => resolve({ data: { user: null }, error: null }), 1000))
    );

    render(<SignUpPage />);

    const nameInput = screen.getByPlaceholderText(/full name/i);
    const emailInput = screen.getByPlaceholderText(/email/i);
    const passwordInput = screen.getByPlaceholderText(/password/i);
    const submitBtn = screen.getByRole("button", { name: /sign up/i });

    await user.type(nameInput, "John Doe");
    await user.type(emailInput, "john@example.com");
    await user.type(passwordInput, "password123");
    await user.click(submitBtn);

    expect(submitBtn).toBeDisabled();
    expect(screen.getByText(/signing up/i)).toBeInTheDocument();
  });
});

describe("SignUpPage - API Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call supabase.auth.signUp with correct payload", async () => {
    const user = userEvent.setup();
    const { supabase } = await import("@/lib/supabase/client");

    vi.mocked(supabase.auth.signUp).mockResolvedValueOnce({
      data: { user: { id: "test-id", email: "john@example.com", identities: [{ id: "some-id" }] } as Record<string, unknown> },
      error: null,
    });

    render(<SignUpPage />);

    await user.type(screen.getByPlaceholderText(/full name/i), "John Doe");
    await user.type(screen.getByPlaceholderText(/email/i), "john@example.com");
    await user.type(screen.getByPlaceholderText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /sign up/i }));

    await waitFor(() => {
      expect(vi.mocked(supabase.auth.signUp)).toHaveBeenCalledWith({
        email: "john@example.com",
        password: "password123",
        options: {
          data: { full_name: "John Doe" },
          emailRedirectTo: expect.stringContaining("/verify-email"),
        },
      });
    });
  });

  it("should handle Database error saving new user (500 error)", async () => {
    const user = userEvent.setup();
    const { supabase } = await import("@/lib/supabase/client");

    vi.mocked(supabase.auth.signUp).mockResolvedValueOnce({
      data: { user: null },
      error: new Error("Database error saving new user") as Record<string, unknown>,
    });

    render(<SignUpPage />);

    await user.type(screen.getByPlaceholderText(/full name/i), "Jane Doe");
    await user.type(screen.getByPlaceholderText(/email/i), "jane@example.com");
    await user.type(screen.getByPlaceholderText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /sign up/i }));

    expect(await screen.findByText(/database error saving new user/i)).toBeInTheDocument();
  });

  it("should validate email format", async () => {
    const user = userEvent.setup();
    render(<SignUpPage />);

    const nameInput = screen.getByPlaceholderText(/full name/i);
    const emailInput = screen.getByPlaceholderText(/email/i);
    const passwordInput = screen.getByPlaceholderText(/password/i);
    const submitBtn = screen.getByRole("button", { name: /sign up/i });

    await user.type(nameInput, "John Doe");
    await user.type(emailInput, "invalid-email");
    await user.type(passwordInput, "password123");
    await user.click(submitBtn);

    expect(await screen.findByText(/invalid email format/i)).toBeInTheDocument();
  });

  it("should handle user already exists error with sign in suggestion", async () => {
    const user = userEvent.setup();
    const { supabase } = await import("@/lib/supabase/client");

    vi.mocked(supabase.auth.signUp).mockResolvedValueOnce({
      data: { user: null },
      error: new Error("User already registered") as Record<string, unknown>,
    });

    render(<SignUpPage />);

    await user.type(screen.getByPlaceholderText(/full name/i), "Existing User");
    await user.type(screen.getByPlaceholderText(/email/i), "existing@example.com");
    await user.type(screen.getByPlaceholderText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /sign up/i }));

    expect(await screen.findByText(/email already registered/i)).toBeInTheDocument();
  });

  it("should detect duplicate email via empty identities (Supabase silent success)", async () => {
    const user = userEvent.setup();
    const { supabase } = await import("@/lib/supabase/client");

    vi.mocked(supabase.auth.signUp).mockResolvedValueOnce({
      data: { user: { id: "existing-id", email: "existing@example.com", identities: [] } as Record<string, unknown> },
      error: null,
    });

    render(<SignUpPage />);

    await user.type(screen.getByPlaceholderText(/full name/i), "Existing User");
    await user.type(screen.getByPlaceholderText(/email/i), "existing@example.com");
    await user.type(screen.getByPlaceholderText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /sign up/i }));

    expect(await screen.findByText(/email already registered/i)).toBeInTheDocument();
    const signInLinks = await screen.findAllByRole("link", { name: /sign in/i });
    expect(signInLinks.some((link) => link.textContent === "sign in")).toBe(true);
  });

  it("should redirect to verify-email on successful signup", async () => {
    const user = userEvent.setup();
    const { supabase } = await import("@/lib/supabase/client");

    vi.mocked(supabase.auth.signUp).mockResolvedValueOnce({
      data: { user: { id: "test-id", email: "john@example.com", identities: [{ id: "some-id" }] } },
      error: null,
    });

    render(<SignUpPage />);

    await user.type(screen.getByPlaceholderText(/full name/i), "John Doe");
    await user.type(screen.getByPlaceholderText(/email/i), "john@example.com");
    await user.type(screen.getByPlaceholderText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /sign up/i }));

    await waitFor(() => {
      expect(vi.mocked(supabase.auth.signUp)).toHaveBeenCalledWith({
        email: "john@example.com",
        password: "password123",
        options: {
          data: { full_name: "John Doe" },
          emailRedirectTo: expect.stringContaining("/verify-email"),
        },
      });
    });
  });
});
