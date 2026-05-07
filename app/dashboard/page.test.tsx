import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DashboardPage from "./page";

// Mock the entire supabase client module to avoid initialization errors
vi.mock("@/lib/supabase/client", () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
      signOut: vi.fn(),
    },
  },
}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
  })),
}));

// Mock toast
vi.mock("@/components/ui/toaster", () => ({}));

describe("DashboardPage - User Profile & Sign Out", () => {
  const mockUser = {
    id: "test-user-id",
    email: "test@example.com",
    email_confirmed_at: "2024-01-01",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should redirect to signin if no user session", async () => {
    const { supabase } = await import("@/lib/supabase/client");
    const { useRouter } = await import("next/navigation");

    const mockPush = vi.fn();
    vi.mocked(useRouter).mockReturnValue({ push: mockPush } as any);

    vi.mocked(supabase.auth.getUser).mockResolvedValueOnce({
      data: { user: null },
    } as any);

    render(<DashboardPage />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/signin");
    });
  });

  it("should load user data on mount", async () => {
    const { supabase } = await import("@/lib/supabase/client");
    const { useRouter } = await import("next/navigation");

    const mockPush = vi.fn();
    vi.mocked(useRouter).mockReturnValue({ push: mockPush } as any);

    vi.mocked(supabase.auth.getUser).mockResolvedValueOnce({
      data: { user: mockUser },
    } as any);

    render(<DashboardPage />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/test@example.com/i)).toBeInTheDocument();
      expect(screen.getByText(/verified/i)).toBeInTheDocument();
    });
  });

  it("should show 'Not verified' when email is not confirmed", async () => {
    const { supabase } = await import("@/lib/supabase/client");
    const { useRouter } = await import("next/navigation");

    const mockPush = vi.fn();
    vi.mocked(useRouter).mockReturnValue({ push: mockPush } as any);

    vi.mocked(supabase.auth.getUser).mockResolvedValueOnce({
      data: { user: { ...mockUser, email_confirmed_at: null } },
    } as any);

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText(/not verified/i)).toBeInTheDocument();
    });
  });

  it("should sign out user and redirect to signin", async () => {
    const user = userEvent.setup();
    const { supabase } = await import("@/lib/supabase/client");
    const { useRouter } = await import("next/navigation");

    const mockPush = vi.fn();
    vi.mocked(useRouter).mockReturnValue({ push: mockPush } as any);

    vi.mocked(supabase.auth.getUser).mockResolvedValueOnce({
      data: { user: mockUser },
    } as any);

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /sign out/i })).not.toBeDisabled();
    });

    await user.click(screen.getByRole("button", { name: /sign out/i }));

    expect(supabase.auth.signOut).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith("/signin");
  });

  it("should render loading state initially", async () => {
    const { supabase } = await import("@/lib/supabase/client");
    const { useRouter } = await import("next/navigation");

    const mockPush = vi.fn();
    vi.mocked(useRouter).mockReturnValue({ push: mockPush } as any);

    vi.mocked(supabase.auth.getUser).mockResolvedValueOnce({
      data: { user: null },
    } as any);

    render(<DashboardPage />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });
});
