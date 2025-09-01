import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  "https://lziarqkobgwrzejpzlcj.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if we have valid Supabase credentials
const hasValidCredentials = supabaseUrl && supabaseAnonKey;

let supabase = null;

if (hasValidCredentials) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.log("✅ Supabase client initialized successfully");
  } catch (error) {
    console.error("❌ Failed to initialize Supabase client:", error);
    supabase = null;
  }
} else {
  console.warn(
    "⚠️ Supabase credentials not found. Please create a .env file with your Supabase credentials."
  );
  console.warn("📖 See SUPABASE_SETUP_GUIDE.md for setup instructions.");
}

// Create a mock client for development when Supabase is not available
const createMockClient = () => ({
  auth: {
    getSession: async () => {
      // Check if we have a mock session in localStorage
      const mockSession = localStorage.getItem("inkwell_mock_session");
      if (mockSession) {
        const session = JSON.parse(mockSession);
        return { data: { session }, error: null };
      }
      return { data: { session: null }, error: null };
    },
    onAuthStateChange: (callback) => {
      // Immediately call with current state
      setTimeout(() => {
        const mockSession = localStorage.getItem("inkwell_mock_session");
        if (mockSession) {
          const session = JSON.parse(mockSession);
          callback("SIGNED_IN", session);
        } else {
          callback("SIGNED_OUT", null);
        }
      }, 100);

      // Mock subscription
      return { data: { subscription: { unsubscribe: () => {} } } };
    },
    signUp: async (credentials) => {
      // Mock signup - create a mock user
      const mockUser = {
        id: "mock-user-" + Date.now(),
        email: credentials.email,
        created_at: new Date().toISOString(),
        email_confirmed_at: new Date().toISOString(),
        user_metadata: credentials.options?.data || {},
      };

      const mockSession = {
        user: mockUser,
        access_token: "mock-token",
        refresh_token: "mock-refresh-token",
      };

      localStorage.setItem("inkwell_mock_session", JSON.stringify(mockSession));
      localStorage.setItem("inkwell_mock_user", JSON.stringify(mockUser));

      return { data: { user: mockUser }, error: null };
    },
    signInWithPassword: async (credentials) => {
      // Mock signin - check if user exists or create one
      let mockUser = JSON.parse(
        localStorage.getItem("inkwell_mock_user") || "null"
      );

      if (!mockUser || mockUser.email !== credentials.email) {
        mockUser = {
          id: "mock-user-" + Date.now(),
          email: credentials.email,
          created_at: new Date().toISOString(),
          email_confirmed_at: new Date().toISOString(),
          user_metadata: {},
        };
        localStorage.setItem("inkwell_mock_user", JSON.stringify(mockUser));
      }

      const mockSession = {
        user: mockUser,
        access_token: "mock-token",
        refresh_token: "mock-refresh-token",
      };

      localStorage.setItem("inkwell_mock_session", JSON.stringify(mockSession));

      return { data: { user: mockUser }, error: null };
    },
    signOut: async () => {
      localStorage.removeItem("inkwell_mock_session");
      localStorage.removeItem("inkwell_mock_user");
      return { error: null };
    },
    resetPasswordForEmail: async () => ({
      error: null, // Mock success
    }),
    updateUser: async () => ({ error: null }),
  },
  from: () => ({
    select: () => ({
      eq: () => ({
        single: async () => ({
          data: null,
          error: { message: "Supabase not configured - using mock data" },
        }),
      }),
    }),
    insert: async () => ({
      data: null,
      error: null, // Allow mock inserts to succeed
    }),
    update: () => ({
      eq: () => ({
        select: () => ({
          single: async () => ({
            data: null,
            error: null, // Allow mock updates to succeed
          }),
        }),
      }),
    }),
    delete: () => ({
      eq: async () => ({ error: null }),
    }),
  }),
  storage: {
    from: () => ({
      upload: async () => ({ error: null }),
      getPublicUrl: () => ({
        data: { publicUrl: "https://via.placeholder.com/150" },
      }),
    }),
  },
});

// Use mock client if Supabase is not available
if (!supabase) {
  supabase = createMockClient();
  console.log("🔧 Using mock Supabase client for development");
  console.log("📝 You can sign in with any email/password combination");
}

export { supabase };

// Helper functions for common operations
export const auth = supabase.auth;
export const storage = supabase.storage;
