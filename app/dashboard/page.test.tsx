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
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
    })),
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
    user_metadata: { full_name: "Test User", username: "testuser" },
  };

  const mockProfile = {
    id: "test-user-id",
    full_name: "Test User",
    username: "testuser",
    avatar_url: null,
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

  it("should load user and profile data on mount", async () => {
    const { supabase } = await import("@/lib/supabase/client");
    const { useRouter } = await import("next/navigation");

    const mockPush = vi.fn();
    vi.mocked(useRouter).mockReturnValue({ push: mockPush } as any);

    vi.mocked(supabase.auth.getUser).mockResolvedValueOnce({
      data: { user: mockUser },
    } as any);

    // Setup proper chain mock for profile query
    const mockSingle = vi.fn().mockResolvedValueOnce({
      data: mockProfile,
      error: null,
    });

    const mockEq = vi.fn().mockReturnValueOnce({
      single: mockSingle,
    });

    const mockSelect = vi.fn().mockReturnValueOnce({
      eq: mockEq,
    });

    vi.mocked(supabase.from).mockReturnValueOnce({
      select: mockSelect,
    } as any);

    render(<DashboardPage />);

    // Loading state
    expect(screen.getByText(/loading/i)).toBeInTheDocument();

    // After loading, show profile data
    await waitFor(() => {
      expect(screen.getByText(/test@example.com/i)).toBeInTheDocument();
      expect(screen.getByText(/Test User/i)).toBeInTheDocument();
      expect(screen.getByText(/testuser/i)).toBeInTheDocument();
      expect(screen.getByText(/đã xác thực/i)).toBeInTheDocument();
    });
  });

  it("should handle profile not found gracefully", async () => {
    const { supabase } = await import("@/lib/supabase/client");
    const { useRouter } = await import("next/navigation");

    const mockPush = vi.fn();
    vi.mocked(useRouter).mockReturnValue({ push: mockPush } as any);

    vi.mocked(supabase.auth.getUser).mockResolvedValueOnce({
      data: { user: mockUser },
    } as any);

    // Profile returns null
    const mockSingle = vi.fn().mockResolvedValueOnce({
      data: null,
      error: null,
    });

    const mockEq = vi.fn().mockReturnValueOnce({
      single: mockSingle,
    });

    const mockSelect = vi.fn().mockReturnValueOnce({
      eq: mockEq,
    });

    vi.mocked(supabase.from).mockReturnValueOnce({
      select: mockSelect,
    } as any);

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText(/test@example.com/i)).toBeInTheDocument();
      expect(screen.getAllByText(/chưa cập nhật/i).length).toBeGreaterThan(0);
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

    // Setup proper chain mock for profile query
    const mockSingle = vi.fn().mockResolvedValueOnce({
      data: mockProfile,
      error: null,
    });

    const mockEq = vi.fn().mockReturnValueOnce({
      single: mockSingle,
    });

    const mockSelect = vi.fn().mockReturnValueOnce({
      eq: mockEq,
    });

    vi.mocked(supabase.from).mockReturnValueOnce({
      select: mockSelect,
    } as any);

    render(<DashboardPage />);

    // Wait for page to load
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

    // Should show loading
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });
});
