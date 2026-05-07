import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ForgotPasswordPage from "./page";

vi.mock("@/lib/supabase/client", () => ({
  supabase: {
    auth: {
      resetPasswordForEmail: vi.fn(),
    },
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn(),
  }),
}));

describe("ForgotPasswordPage - Validation & Form Handling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render forgot password form with email field", () => {
    render(<ForgotPasswordPage />);

    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /send reset link/i })).toBeInTheDocument();
  });

  it("should validate email format", async () => {
    const user = userEvent.setup();
    render(<ForgotPasswordPage />);

    const emailInput = screen.getByPlaceholderText(/email/i);
    const submitBtn = screen.getByRole("button", { name: /send reset link/i });

    await user.type(emailInput, "invalid-email");
    await user.click(submitBtn);

    expect(await screen.findByText(/invalid email format/i)).toBeInTheDocument();
  });

  it("should call resetPasswordForEmail with correct payload", async () => {
    const user = userEvent.setup();
    const { supabase } = await import("@/lib/supabase/client");

    vi.mocked(supabase.auth.resetPasswordForEmail).mockResolvedValueOnce({
      data: {},
      error: null,
    });

    render(<ForgotPasswordPage />);

    await user.type(screen.getByPlaceholderText(/email/i), "john@example.com");
    await user.click(screen.getByRole("button", { name: /send reset link/i }));

    await waitFor(() => {
      expect(vi.mocked(supabase.auth.resetPasswordForEmail)).toHaveBeenCalledWith(
        "john@example.com",
        expect.objectContaining({
          redirectTo: expect.stringContaining("/reset-password"),
        })
      );
    });
  });

  it("should clear error when user starts typing", async () => {
    const user = userEvent.setup();
    render(<ForgotPasswordPage />);

    const emailInput = screen.getByPlaceholderText(/email/i);
    const submitBtn = screen.getByRole("button", { name: /send reset link/i });

    await user.type(emailInput, "invalid-email");
    await user.click(submitBtn);
    expect(await screen.findByText(/invalid email format/i)).toBeInTheDocument();

    await user.clear(emailInput);
    await user.type(emailInput, "valid@example.com");
    await waitFor(() => {
      expect(screen.queryByText(/invalid email format/i)).not.toBeInTheDocument();
    });
  });

  it("should disable button while loading", async () => {
    const user = userEvent.setup();
    const { supabase } = await import("@/lib/supabase/client");

    vi.mocked(supabase.auth.resetPasswordForEmail).mockImplementationOnce(
      () => new Promise(resolve => setTimeout(() => resolve({ data: {}, error: null }), 1000))
    );

    render(<ForgotPasswordPage />);

    const emailInput = screen.getByPlaceholderText(/email/i);
    const submitBtn = screen.getByRole("button", { name: /send reset link/i });

    await user.type(emailInput, "test@example.com");
    await user.click(submitBtn);

    expect(submitBtn).toBeDisabled();
  });
});

describe("ForgotPasswordPage - API Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call resetPasswordForEmail with correct payload", async () => {
    const user = userEvent.setup();
    const { supabase } = await import("@/lib/supabase/client");

    vi.mocked(supabase.auth.resetPasswordForEmail).mockResolvedValueOnce({
      data: {},
      error: null,
    });

    render(<ForgotPasswordPage />);

    await user.type(screen.getByPlaceholderText(/email/i), "john@example.com");
    await user.click(screen.getByRole("button", { name: /send reset link/i }));

    await waitFor(() => {
      expect(vi.mocked(supabase.auth.resetPasswordForEmail)).toHaveBeenCalledWith(
        "john@example.com",
        expect.objectContaining({
          redirectTo: expect.stringContaining("/reset-password"),
        })
      );
    });
  });

  it("should show success message after successful request", async () => {
    const user = userEvent.setup();
    const { supabase } = await import("@/lib/supabase/client");

    vi.mocked(supabase.auth.resetPasswordForEmail).mockResolvedValueOnce({
      data: {},
      error: null,
    });

    render(<ForgotPasswordPage />);

    await user.type(screen.getByPlaceholderText(/email/i), "john@example.com");
    await user.click(screen.getByRole("button", { name: /send reset link/i }));

    expect(await screen.findByText(/password reset email sent!/i)).toBeInTheDocument();
  });

  it("should show success message even for non-existent emails (security behavior)", async () => {
    const user = userEvent.setup();
    const { supabase } = await import("@/lib/supabase/client");

    vi.mocked(supabase.auth.resetPasswordForEmail).mockResolvedValueOnce({
      data: {},
      error: null,
    });

    render(<ForgotPasswordPage />);

    await user.type(screen.getByPlaceholderText(/email/i), "nonexistent@example.com");
    await user.click(screen.getByRole("button", { name: /send reset link/i }));

    expect(await screen.findByText(/password reset email sent!/i)).toBeInTheDocument();
  });

  it("should show link to sign in after success", async () => {
    const user = userEvent.setup();
    const { supabase } = await import("@/lib/supabase/client");

    vi.mocked(supabase.auth.resetPasswordForEmail).mockResolvedValueOnce({
      data: {},
      error: null,
    });

    render(<ForgotPasswordPage />);

    await user.type(screen.getByPlaceholderText(/email/i), "john@example.com");
    await user.click(screen.getByRole("button", { name: /send reset link/i }));

    expect(await screen.findByRole("link", { name: /back to sign in/i })).toBeInTheDocument();
  });
});
