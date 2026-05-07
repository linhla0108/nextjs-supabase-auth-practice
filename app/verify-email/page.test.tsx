import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { supabase } from "@/lib/supabase/client";
import VerifyEmailPage from "./page";

const mockPush = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      resend: vi.fn(),
    },
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => ({
    get: vi.fn((key) => {
      if (key === "email") return "test@example.com";
      return null;
    }),
  }),
}));

describe("VerifyEmailPage - UI Display", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should show loading state initially", () => {
    vi.mocked(supabase.auth.getSession).mockImplementation(() => new Promise(() => {}));

    render(<VerifyEmailPage />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("should display verify email page with correct heading and message", async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({ data: { session: null }, error: null });

    render(<VerifyEmailPage />);

    expect(await screen.findByRole("heading", { name: /verify email/i })).toBeInTheDocument();
    expect(await screen.findByText(/we've sent a verification link to your email/i)).toBeInTheDocument();
  });

  it("should show resend button after session check passes", async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({ data: { session: null }, error: null });

    render(<VerifyEmailPage />);

    expect(await screen.findByRole("button", { name: /resend verification email/i })).toBeInTheDocument();
  });

  it("should show back to sign in button and redirect to signin when clicked", async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({ data: { session: null }, error: null });

    render(<VerifyEmailPage />);

    // Wait for session check to complete (heading appears when isValidEmail = true)
    await screen.findByRole("heading", { name: /verify email/i });

    // Now safely get the stable button reference
    const backBtn = screen.getByRole("button", { name: /back to sign in/i });
    expect(backBtn).toBeInTheDocument();
    fireEvent.click(backBtn);
    expect(mockPush).toHaveBeenCalledWith("/signin");
  });
});

describe("VerifyEmailPage - Session Handling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should redirect to dashboard if user already has a session", async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: { user: { id: "test-id" } } },
      error: null,
    });

    render(<VerifyEmailPage />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/dashboard");
    });
  });
});

describe("VerifyEmailPage - Resend Functionality", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call resend with correct parameters", async () => {
    const user = userEvent.setup();
    vi.mocked(supabase.auth.getSession).mockResolvedValue({ data: { session: null }, error: null });
    vi.mocked(supabase.auth.resend).mockResolvedValue({ data: {}, error: null });

    render(<VerifyEmailPage />);

    const resendBtn = await screen.findByRole("button", { name: /resend verification email/i });
    await user.click(resendBtn);

    await waitFor(() => {
      expect(vi.mocked(supabase.auth.resend)).toHaveBeenCalledWith({
        type: "signup",
        email: "test@example.com",
      });
    });
  });

  it("should show green success message after resend", async () => {
    const user = userEvent.setup();
    vi.mocked(supabase.auth.getSession).mockResolvedValue({ data: { session: null }, error: null });
    vi.mocked(supabase.auth.resend).mockResolvedValue({ data: {}, error: null });

    render(<VerifyEmailPage />);

    const resendBtn = await screen.findByRole("button", { name: /resend verification email/i });
    await user.click(resendBtn);

    const msg = await screen.findByText(/verification email resent/i);
    expect(msg).toBeInTheDocument();
    expect(msg.closest("div")).toHaveClass("text-green-700");
  });

  it("should hide resend button after successful send", async () => {
    const user = userEvent.setup();
    vi.mocked(supabase.auth.getSession).mockResolvedValue({ data: { session: null }, error: null });
    vi.mocked(supabase.auth.resend).mockResolvedValue({ data: {}, error: null });

    render(<VerifyEmailPage />);

    const resendBtn = await screen.findByRole("button", { name: /resend verification email/i });
    await user.click(resendBtn);

    await waitFor(() => {
      expect(screen.queryByRole("button", { name: /resend verification email/i })).not.toBeInTheDocument();
    });
  });

  it("should show red error message on resend failure", async () => {
    const user = userEvent.setup();
    vi.mocked(supabase.auth.getSession).mockResolvedValue({ data: { session: null }, error: null });
    vi.mocked(supabase.auth.resend).mockResolvedValue({
      data: {},
      error: new Error("Too many requests"),
    });

    render(<VerifyEmailPage />);

    const resendBtn = await screen.findByRole("button", { name: /resend verification email/i });
    await user.click(resendBtn);

    const msg = await screen.findByText(/too many requests/i);
    expect(msg).toBeInTheDocument();
    expect(msg.closest("div")).toHaveClass("text-red-600");
  });

  it("should show Sending... and disable button while loading", async () => {
    const user = userEvent.setup();
    vi.mocked(supabase.auth.getSession).mockResolvedValue({ data: { session: null }, error: null });
    vi.mocked(supabase.auth.resend).mockImplementationOnce(
      () => new Promise(resolve => setTimeout(() => resolve({ data: {}, error: null }), 1000))
    );

    render(<VerifyEmailPage />);

    const resendBtn = await screen.findByRole("button", { name: /resend verification email/i });
    await user.click(resendBtn);

    const sendingBtn = screen.getByRole("button", { name: /sending/i });
    expect(sendingBtn).toBeInTheDocument();
    expect(sendingBtn).toBeDisabled();
  });
});

