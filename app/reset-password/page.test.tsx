import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, waitFor, act, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ResetPasswordPage from "./page";
import { supabase } from "@/lib/supabase/client";

const mockPush = vi.fn();

// Default mock: PASSWORD_RECOVERY fires immediately (valid session)
vi.mock("@/lib/supabase/client", () => ({
  supabase: {
    auth: {
      onAuthStateChange: vi.fn((callback) => {
        callback("PASSWORD_RECOVERY", null);
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      }),
      updateUser: vi.fn(),
    },
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe("ResetPasswordPage - UI Display", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(supabase.auth.onAuthStateChange).mockImplementation((callback) => {
      callback("PASSWORD_RECOVERY", null);
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });
  });

  it("should render reset password form with password fields", async () => {
    render(<ResetPasswordPage />);

    expect(await screen.findByPlaceholderText(/new password/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /reset password/i })).toBeInTheDocument();
  });
});

describe("ResetPasswordPage - Validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(supabase.auth.onAuthStateChange).mockImplementation((callback) => {
      callback("PASSWORD_RECOVERY", null);
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });
  });

  it("should validate password length - minimum 6 characters", async () => {
    const user = userEvent.setup();
    render(<ResetPasswordPage />);

    const passwordInput = await screen.findByPlaceholderText(/new password/i);
    const confirmInput = screen.getByPlaceholderText(/confirm password/i);
    const submitBtn = screen.getByRole("button", { name: /reset password/i });

    await user.type(passwordInput, "12345");
    await user.type(confirmInput, "12345");
    await user.click(submitBtn);

    expect(await screen.findByText(/password must be at least 6 characters/i)).toBeInTheDocument();
  });

  it("should validate passwords match", async () => {
    const user = userEvent.setup();
    render(<ResetPasswordPage />);

    const passwordInput = await screen.findByPlaceholderText(/new password/i);
    const confirmInput = screen.getByPlaceholderText(/confirm password/i);
    const submitBtn = screen.getByRole("button", { name: /reset password/i });

    await user.type(passwordInput, "password123");
    await user.type(confirmInput, "password456");
    await user.click(submitBtn);

    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
  });

  it("should require both password fields", async () => {
    const user = userEvent.setup();
    render(<ResetPasswordPage />);

    const submitBtn = await screen.findByRole("button", { name: /reset password/i });
    await user.click(submitBtn);

    expect(await screen.findByText(/please fill in all fields/i)).toBeInTheDocument();
  });

  it("should clear error when user starts typing", async () => {
    const user = userEvent.setup();
    render(<ResetPasswordPage />);

    const submitBtn = await screen.findByRole("button", { name: /reset password/i });
    await user.click(submitBtn);

    expect(await screen.findByText(/please fill in all fields/i)).toBeInTheDocument();

    const passwordInput = screen.getByPlaceholderText(/new password/i);
    await user.type(passwordInput, "a");

    expect(screen.queryByText(/please fill in all fields/i)).not.toBeInTheDocument();
  });

  it("should disable button while loading", async () => {
    const user = userEvent.setup();

    vi.mocked(supabase.auth.updateUser).mockImplementationOnce(
      () => new Promise(resolve => setTimeout(() => resolve({ data: { user: null }, error: null }), 1000))
    );

    render(<ResetPasswordPage />);

    const passwordInput = await screen.findByPlaceholderText(/new password/i);
    const confirmInput = screen.getByPlaceholderText(/confirm password/i);
    const submitBtn = screen.getByRole("button", { name: /reset password/i });

    await user.type(passwordInput, "newpassword123");
    await user.type(confirmInput, "newpassword123");
    await user.click(submitBtn);

    expect(submitBtn).toBeDisabled();
  });
});

describe("ResetPasswordPage - API Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(supabase.auth.onAuthStateChange).mockImplementation((callback) => {
      callback("PASSWORD_RECOVERY", null);
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });
  });

  it("should call updateUser with new password", async () => {
    const user = userEvent.setup();

    vi.mocked(supabase.auth.updateUser).mockResolvedValueOnce({
      data: { user: { id: "test-id", email: "john@example.com" } },
      error: null,
    });

    render(<ResetPasswordPage />);

    await user.type(await screen.findByPlaceholderText(/new password/i), "newpassword123");
    await user.type(screen.getByPlaceholderText(/confirm password/i), "newpassword123");
    await user.click(screen.getByRole("button", { name: /reset password/i }));

    await waitFor(() => {
      expect(vi.mocked(supabase.auth.updateUser)).toHaveBeenCalledWith({ password: "newpassword123" });
    });
  });

  it("should show success message after password reset", async () => {
    const user = userEvent.setup();

    vi.mocked(supabase.auth.updateUser).mockResolvedValueOnce({
      data: { user: { id: "test-id" } },
      error: null,
    });

    render(<ResetPasswordPage />);

    await user.type(await screen.findByPlaceholderText(/new password/i), "newpassword123");
    await user.type(screen.getByPlaceholderText(/confirm password/i), "newpassword123");
    await user.click(screen.getByRole("button", { name: /reset password/i }));

    expect(await screen.findByText(/password updated successfully!/i)).toBeInTheDocument();
  });

  it("should show heading 'Password Updated' after success", async () => {
    const user = userEvent.setup();

    vi.mocked(supabase.auth.updateUser).mockResolvedValueOnce({
      data: { user: { id: "test-id" } },
      error: null,
    });

    render(<ResetPasswordPage />);

    await user.type(await screen.findByPlaceholderText(/new password/i), "newpassword123");
    await user.type(screen.getByPlaceholderText(/confirm password/i), "newpassword123");
    await user.click(screen.getByRole("button", { name: /reset password/i }));

    expect(await screen.findByRole("heading", { name: /password updated/i })).toBeInTheDocument();
  });

  it("should show button to go to sign in after success", async () => {
    const user = userEvent.setup();

    vi.mocked(supabase.auth.updateUser).mockResolvedValueOnce({
      data: { user: { id: "test-id" } },
      error: null,
    });

    render(<ResetPasswordPage />);

    await user.type(await screen.findByPlaceholderText(/new password/i), "newpassword123");
    await user.type(screen.getByPlaceholderText(/confirm password/i), "newpassword123");
    await user.click(screen.getByRole("button", { name: /reset password/i }));

    expect(await screen.findByRole("button", { name: /go to sign in/i })).toBeInTheDocument();
  });

  it("should handle updateUser error", async () => {
    const user = userEvent.setup();

    vi.mocked(supabase.auth.updateUser).mockResolvedValueOnce({
      data: { user: null },
      error: new Error("Password update failed"),
    });

    render(<ResetPasswordPage />);

    await user.type(await screen.findByPlaceholderText(/new password/i), "newpassword123");
    await user.type(screen.getByPlaceholderText(/confirm password/i), "newpassword123");
    await user.click(screen.getByRole("button", { name: /reset password/i }));

    expect(await screen.findByText(/password update failed/i)).toBeInTheDocument();
  });
});

describe("ResetPasswordPage - Invalid/Expired Link", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    // No PASSWORD_RECOVERY event — simulates expired/invalid link
    vi.mocked(supabase.auth.onAuthStateChange).mockImplementation(() => {
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should show invalid link message when no PASSWORD_RECOVERY event fires", async () => {
    render(<ResetPasswordPage />);

    // Advance past the 500ms fallback timeout
    act(() => {
      vi.advanceTimersByTime(600);
    });

    expect(screen.getByText(/invalid or expired reset link/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /request new reset link/i })).toBeInTheDocument();
  });

  it("should navigate to forgot-password when request new link clicked", () => {
    render(<ResetPasswordPage />);

    act(() => {
      vi.advanceTimersByTime(600);
    });

    const btn = screen.getByRole("button", { name: /request new reset link/i });
    fireEvent.click(btn);

    expect(mockPush).toHaveBeenCalledWith("/forgot-password");
  });
});
