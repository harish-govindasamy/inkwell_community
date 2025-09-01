import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { supabase } from "../lib/supabase";

// Create the auth context
const AuthContext = createContext({});

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);

  const fetchUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error && !error.message.includes("Supabase not configured")) {
        throw error;
      }

      if (data) {
        setProfile(data);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error.message);
      // Don't throw error, just continue without profile
    }
  };

  const getInitialSession = useCallback(async () => {
    try {
      console.log("Getting initial session...");

      // First, check if we have a valid Supabase client
      if (!supabase || !supabase.auth) {
        console.warn("Supabase client not available, skipping session check");
        setLoading(false);
        setAuthInitialized(true);
        return;
      }

      // Set a shorter timeout for the session check
      const sessionPromise = supabase.auth.getSession();
      const timeoutPromise = new Promise(
        (_, reject) =>
          setTimeout(() => reject(new Error("Session timeout")), 3000) // Reduced to 3 seconds
      );

      const result = await Promise.race([sessionPromise, timeoutPromise]);

      if (result?.data?.session?.user) {
        console.log("User session found:", result.data.session.user.email);
        setUser(result.data.session.user);
        // Don't wait for profile fetch, do it in background
        fetchUserProfile(result.data.session.user.id).catch(console.warn);
      } else {
        console.log("No user session found");
      }
    } catch (error) {
      console.error("Error getting initial session:", error.message);
      // Don't throw error, just continue
    } finally {
      setLoading(false);
      setAuthInitialized(true);
    }
  }, []);

  useEffect(() => {
    // Set a fallback timeout - if auth doesn't initialize in 5 seconds, proceed anyway
    const fallbackTimeout = setTimeout(() => {
      if (!authInitialized) {
        console.warn(
          "Auth initialization fallback timeout - proceeding without auth"
        );
        setLoading(false);
        setAuthInitialized(true);
      }
    }, 5000); // Reduced to 5 seconds

    // Get initial session
    getInitialSession();

    // Listen for auth changes with error handling
    let subscription = null;

    try {
      if (supabase?.auth?.onAuthStateChange) {
        const {
          data: { subscription: authSubscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
          console.log(
            "Auth state changed:",
            event,
            session?.user?.email || "no user"
          );

          if (session?.user) {
            setUser(session.user);
            // Background profile fetch
            fetchUserProfile(session.user.id).catch(console.warn);
          } else {
            setUser(null);
            setProfile(null);
          }

          // Always set loading to false after auth state change
          setLoading(false);
        });

        subscription = authSubscription;
      }
    } catch (error) {
      console.error("Error setting up auth listener:", error);
      setLoading(false);
      setAuthInitialized(true);
    }

    return () => {
      clearTimeout(fallbackTimeout);
      if (subscription?.unsubscribe) {
        subscription.unsubscribe();
      }
    };
  }, [getInitialSession, authInitialized]);

  const signUp = async (email, password, fullName) => {
    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) throw error;

      return { user: data.user, error: null };
    } catch (error) {
      console.error("Signup error:", error.message);

      // Show helpful message for Supabase configuration issues
      if (error.message.includes("Supabase not configured")) {
        return {
          user: null,
          error:
            "Supabase is not configured. Please check SUPABASE_SETUP_GUIDE.md for setup instructions.",
        };
      }

      return { user: null, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email, password) => {
    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      return { user: data.user, error: null };
    } catch (error) {
      console.error("Signin error:", error.message);

      // Show helpful message for Supabase configuration issues
      if (error.message.includes("Supabase not configured")) {
        return {
          user: null,
          error:
            "Supabase is not configured. Please check SUPABASE_SETUP_GUIDE.md for setup instructions.",
        };
      }

      return { user: null, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);

      // Clear local state first
      setUser(null);
      setProfile(null);

      // Then attempt to sign out from Supabase
      const { error } = await supabase.auth.signOut();

      // Don't throw error for session missing - user is already logged out
      if (error && !error.message.includes("Auth session missing")) {
        console.error("Signout error:", error.message);
        throw error;
      }

      if (error) {
        console.warn("Signout warning:", error.message);
      }
    } catch (error) {
      console.error("Signout error:", error.message);
      // Don't re-throw - user state is already cleared
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error("Reset password error:", error.message);
      return { error: error.message };
    }
  };

  const updatePassword = async (newPassword) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error("Update password error:", error.message);
      return { error: error.message };
    }
  };

  const updateProfile = async (updates) => {
    try {
      setLoading(true);

      const { data: profileData, error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", user.id)
        .select()
        .single();

      if (error) throw error;

      setProfile(profileData);
      return { data: profileData, error: null };
    } catch (error) {
      console.error("Update profile error:", error.message);
      return { data: null, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const uploadAvatar = async (file) => {
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      const { error } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { upsert: true });

      if (error) throw error;

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(fileName);

      // Update profile with new avatar URL
      await updateProfile({ avatar_url: publicUrl });

      return { url: publicUrl, error: null };
    } catch (error) {
      console.error("Upload avatar error:", error.message);
      return { url: null, error: error.message };
    }
  };

  // Legacy methods for backward compatibility
  const login = signIn;
  const logout = signOut;
  const signup = async (name, email, password) => {
    return await signUp(email, password, name);
  };

  const value = {
    user,
    profile,
    loading,
    authInitialized,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    uploadAvatar,
    // Legacy methods
    login,
    logout,
    signup,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
