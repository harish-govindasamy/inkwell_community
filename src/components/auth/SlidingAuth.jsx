import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/SupabaseAuthContext";
import { useToast } from "../ToastProvider";
import LoadingSpinner from "../LoadingSpinner";
import {
  PenTool,
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  ArrowRight,
  Github,
  Chrome,
  Facebook,
  Linkedin,
} from "lucide-react";

const SlidingAuth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showDevBypass, setShowDevBypass] = useState(false);

  const { signIn, signUp, user, loading: authLoading } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/home";

  // Show development bypass after 10 seconds in development mode
  useEffect(() => {
    if (import.meta.env.MODE === "development") {
      const timer = setTimeout(() => {
        setShowDevBypass(true);
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, []);

  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  // Show loading state while auth is initializing
  if (authLoading) {
    return (
      <LoadingSpinner
        fullScreen
        text="Initializing authentication..."
        timeout={8000}
        onTimeout={() => setShowDevBypass(true)}
      />
    );
  }

  const handleDevBypass = () => {
    // Create a mock user for development
    const mockUser = {
      id: "dev-user-" + Date.now(),
      email: "dev@localhost.com",
      user_metadata: { full_name: "Development User" },
    };

    // Store in localStorage for persistence
    localStorage.setItem(
      "inkwell_mock_session",
      JSON.stringify({
        user: mockUser,
        access_token: "dev-token",
      })
    );

    // Reload to trigger auth state change
    window.location.reload();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (isSignUp && !formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (isSignUp && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      let result;
      if (isSignUp) {
        result = await signUp(formData.email, formData.password, formData.name);
        if (result.error) {
          throw new Error(result.error);
        }
        toast.success(
          "Account created successfully! Please check your email to verify your account."
        );
      } else {
        result = await signIn(formData.email, formData.password);
        if (result.error) {
          throw new Error(result.error);
        }
        toast.success("Welcome back! Signed in successfully.");
        navigate(from, { replace: true });
      }
    } catch (error) {
      console.error("Auth error:", error);
      const errorMessage = error.message || "An unexpected error occurred";
      setErrors({ general: errorMessage });
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setFormData({
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    });
    setErrors({});
  };

  return (
    <div
      className="min-h-screen flex flex-col justify-center items-center p-4"
      style={{
        fontFamily: "'Montserrat', sans-serif",
        background: "#f6f5f7",
        backgroundImage: `url('https://images.unsplash.com/photo-1500993855538-c6a99f437aa7?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1920&q=80')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
      }}
    >
      {/* Development bypass button */}
      {showDevBypass && import.meta.env.MODE === "development" && (
        <div className="fixed top-4 left-4 z-50">
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded-lg shadow-lg">
            <div className="text-sm mb-2">
              <strong>Development Mode:</strong> Authentication seems slow
            </div>
            <button
              onClick={handleDevBypass}
              className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600"
            >
              Continue as Dev User
            </button>
          </div>
        </div>
      )}

      <div
        className={`container relative overflow-hidden transition-all duration-700 ease-in-out ${
          isSignUp ? "right-panel-active" : ""
        }`}
        style={{
          borderRadius: "10px",
          boxShadow:
            "0 14px 28px rgba(0, 0, 0, 0.25), 0 10px 10px rgba(0, 0, 0, 0.22)",
          width: "768px",
          maxWidth: "100%",
          minHeight: "480px",
          opacity: 0.95,
        }}
      >
        {/* Sign Up Form Container */}
        <div
          className={`form-container sign-up-container absolute top-0 h-full transition-all duration-700 ease-in-out`}
          style={{
            left: 0,
            width: "50%",
            zIndex: isSignUp ? 5 : 1,
            opacity: isSignUp ? 1 : 0,
            transform: isSignUp ? "translateX(100%)" : "translateX(0)",
          }}
        >
          <form
            onSubmit={handleSubmit}
            className="flex flex-col justify-between items-center text-center h-full py-8 overflow-hidden"
            style={{
              background: "rgba(45, 52, 54, 1.0)",
              padding: "20px 50px",
              maxHeight: "100%",
            }}
          >
            <div className="flex-shrink-0">
              <h1
                className="font-bold m-0 mb-4"
                style={{ color: "beige", fontSize: "24px" }}
              >
                Create Account
              </h1>

              <div className="flex justify-center space-x-2 mb-4">
                <button
                  type="button"
                  className="flex items-center justify-center rounded-full transition-colors hover:bg-white/10"
                  style={{
                    border: "1px solid #ddd",
                    width: "35px",
                    height: "35px",
                    margin: "0 3px",
                  }}
                >
                  <Facebook className="w-4 h-4 text-white" />
                </button>
                <button
                  type="button"
                  className="flex items-center justify-center rounded-full transition-colors hover:bg-white/10"
                  style={{
                    border: "1px solid #ddd",
                    width: "35px",
                    height: "35px",
                    margin: "0 3px",
                  }}
                >
                  <Github className="w-4 h-4 text-white" />
                </button>
                <button
                  type="button"
                  className="flex items-center justify-center rounded-full transition-colors hover:bg-white/10"
                  style={{
                    border: "1px solid #ddd",
                    width: "35px",
                    height: "35px",
                    margin: "0 3px",
                  }}
                >
                  <Linkedin className="w-4 h-4 text-white" />
                </button>
              </div>

              <span
                className="mb-4 block"
                style={{
                  fontSize: "11px",
                  color: "beige",
                }}
              >
                or use your email for registration
              </span>
            </div>

            <div className="flex-1 w-full flex flex-col justify-center">
              {errors.general && (
                <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-3 py-1 rounded-lg mb-3 text-xs">
                  {errors.general}
                </div>
              )}

              <div className="space-y-3 w-full flex flex-col items-center">
                <div className="w-full flex flex-col items-center">
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Name"
                    className="outline-none transition-all duration-500 focus:border-orange-400"
                    style={{
                      width: "220px",
                      textAlign: "center",
                      background: "transparent",
                      border: "none",
                      borderBottom: "1px solid #fff",
                      fontFamily: "'Montserrat', sans-serif",
                      fontSize: "14px",
                      fontWeight: "bold",
                      padding: "8px 0",
                      color: "#fff",
                    }}
                  />
                  {errors.name && (
                    <p className="text-red-400 text-xs mt-1 h-4 leading-4">
                      {errors.name}
                    </p>
                  )}
                  {!errors.name && <div className="h-4"></div>}
                </div>

                <div className="w-full flex flex-col items-center">
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Email"
                    className="outline-none transition-all duration-500 focus:border-orange-400"
                    style={{
                      width: "220px",
                      textAlign: "center",
                      background: "transparent",
                      border: "none",
                      borderBottom: "1px solid #fff",
                      fontFamily: "'Montserrat', sans-serif",
                      fontSize: "14px",
                      fontWeight: "bold",
                      padding: "8px 0",
                      color: "#fff",
                    }}
                  />
                  {errors.email && (
                    <p className="text-red-400 text-xs mt-1 h-4 leading-4">
                      {errors.email}
                    </p>
                  )}
                  {!errors.email && <div className="h-4"></div>}
                </div>

                <div className="w-full flex flex-col items-center">
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Password"
                    className="outline-none transition-all duration-500 focus:border-orange-400"
                    style={{
                      width: "220px",
                      textAlign: "center",
                      background: "transparent",
                      border: "none",
                      borderBottom: "1px solid #fff",
                      fontFamily: "'Montserrat', sans-serif",
                      fontSize: "14px",
                      fontWeight: "bold",
                      padding: "8px 0",
                      color: "#fff",
                    }}
                  />
                  {errors.password && (
                    <p className="text-red-400 text-xs mt-1 h-4 leading-4">
                      {errors.password}
                    </p>
                  )}
                  {!errors.password && <div className="h-4"></div>}
                </div>

                <div className="w-full flex flex-col items-center">
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Confirm Password"
                    className="outline-none transition-all duration-500 focus:border-orange-400"
                    style={{
                      width: "220px",
                      textAlign: "center",
                      background: "transparent",
                      border: "none",
                      borderBottom: "1px solid #fff",
                      fontFamily: "'Montserrat', sans-serif",
                      fontSize: "14px",
                      fontWeight: "bold",
                      padding: "8px 0",
                      color: "#fff",
                    }}
                  />
                  {errors.confirmPassword && (
                    <p className="text-red-400 text-xs mt-1 h-4 leading-4">
                      {errors.confirmPassword}
                    </p>
                  )}
                  {!errors.confirmPassword && <div className="h-4"></div>}
                </div>
              </div>
            </div>

            <div className="flex-shrink-0">
              <button
                type="submit"
                disabled={isLoading}
                className="text-white font-bold uppercase transition-transform duration-75 ease-in active:scale-95 focus:outline-none hover:shadow-lg"
                style={{
                  borderRadius: "20px",
                  border: "1px solid #ff4b2b",
                  background: "#ff4b2b",
                  fontSize: "11px",
                  padding: "10px 35px",
                  letterSpacing: "1px",
                  opacity: isLoading ? 0.5 : 1,
                }}
              >
                {isLoading ? "Creating..." : "Sign Up"}
              </button>
            </div>
          </form>
        </div>

        {/* Sign In Form Container */}
        <div
          className={`form-container sign-in-container absolute top-0 h-full transition-all duration-700 ease-in-out`}
          style={{
            left: 0,
            width: "50%",
            zIndex: 2,
            transform: isSignUp ? "translateX(100%)" : "translateX(0)",
          }}
        >
          <form
            onSubmit={handleSubmit}
            className="flex flex-col justify-between items-center text-center h-full py-8 overflow-hidden"
            style={{
              background: "rgba(45, 52, 54, 1.0)",
              padding: "30px 50px",
              maxHeight: "100%",
            }}
          >
            <div className="flex-shrink-0">
              <h1
                className="font-bold m-0 mb-6"
                style={{ color: "beige", fontSize: "28px" }}
              >
                Sign in
              </h1>

              <div className="flex space-x-2 mb-6">
                <button
                  type="button"
                  className="flex items-center justify-center rounded-full transition-colors hover:bg-white/10"
                  style={{
                    border: "1px solid #ddd",
                    width: "40px",
                    height: "40px",
                    margin: "0 5px",
                  }}
                >
                  <Facebook className="w-5 h-5 text-white" />
                </button>
                <button
                  type="button"
                  className="flex items-center justify-center rounded-full transition-colors hover:bg-white/10"
                  style={{
                    border: "1px solid #ddd",
                    width: "40px",
                    height: "40px",
                    margin: "0 5px",
                  }}
                >
                  <Github className="w-5 h-5 text-white" />
                </button>
                <button
                  type="button"
                  className="flex items-center justify-center rounded-full transition-colors hover:bg-white/10"
                  style={{
                    border: "1px solid #ddd",
                    width: "40px",
                    height: "40px",
                    margin: "0 5px",
                  }}
                >
                  <Linkedin className="w-5 h-5 text-white" />
                </button>
              </div>

              <span
                className="mb-6 block"
                style={{
                  fontSize: "12px",
                  color: "beige",
                }}
              >
                or use your account
              </span>
            </div>

            <div className="flex-1 w-full flex flex-col justify-center">
              {errors.general && (
                <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-2 rounded-lg mb-4 text-sm">
                  {errors.general}
                </div>
              )}

              <div className="space-y-6 w-full flex flex-col items-center">
                <div className="w-full flex flex-col items-center">
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Email"
                    className="outline-none transition-all duration-500 focus:border-orange-400"
                    style={{
                      width: "240px",
                      textAlign: "center",
                      background: "transparent",
                      border: "none",
                      borderBottom: "1px solid #fff",
                      fontFamily: "'Montserrat', sans-serif",
                      fontSize: "16px",
                      fontWeight: "bold",
                      padding: "10px 0",
                      color: "#fff",
                    }}
                  />
                  {errors.email && (
                    <p className="text-red-400 text-xs mt-2 h-4 leading-4">
                      {errors.email}
                    </p>
                  )}
                  {!errors.email && <div className="h-4"></div>}
                </div>

                <div className="w-full flex flex-col items-center">
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Password"
                    className="outline-none transition-all duration-500 focus:border-orange-400"
                    style={{
                      width: "240px",
                      textAlign: "center",
                      background: "transparent",
                      border: "none",
                      borderBottom: "1px solid #fff",
                      fontFamily: "'Montserrat', sans-serif",
                      fontSize: "16px",
                      fontWeight: "bold",
                      padding: "10px 0",
                      color: "#fff",
                    }}
                  />
                  {errors.password && (
                    <p className="text-red-400 text-xs mt-2 h-4 leading-4">
                      {errors.password}
                    </p>
                  )}
                  {!errors.password && <div className="h-4"></div>}
                </div>
              </div>
            </div>

            <div className="flex-shrink-0">
              <button
                type="submit"
                disabled={isLoading}
                className="text-white font-bold uppercase transition-transform duration-75 ease-in active:scale-95 focus:outline-none hover:shadow-lg"
                style={{
                  borderRadius: "20px",
                  border: "1px solid #ff4b2b",
                  background: "#ff4b2b",
                  fontSize: "12px",
                  padding: "12px 45px",
                  letterSpacing: "1px",
                  opacity: isLoading ? 0.5 : 1,
                }}
              >
                {isLoading ? "Signing In..." : "Sign In"}
              </button>
            </div>
          </form>
        </div>

        {/* Overlay Container */}
        <div
          className={`overlay-container absolute top-0 h-full overflow-hidden transition-transform duration-700 ease-in-out`}
          style={{
            left: "50%",
            width: "50%",
            zIndex: 100,
            transform: isSignUp ? "translateX(-100%)" : "translateX(0)",
          }}
        >
          <div
            className={`overlay absolute h-full transition-transform duration-700 ease-in-out text-white`}
            style={{
              background: "linear-gradient(to right, #ff4b2b, #ff416c)",
              left: "-100%",
              width: "200%",
              transform: isSignUp ? "translateX(50%)" : "translateX(0)",
            }}
          >
            {/* Welcome Back Panel (Left) */}
            <div
              className={`overlay-panel overlay-left absolute top-0 flex flex-col justify-center items-center text-center h-full transition-transform duration-700 ease-in-out`}
              style={{
                padding: "0 40px",
                width: "50%",
                transform: isSignUp ? "translateX(0)" : "translateX(-20%)",
              }}
            >
              <h1 className="font-bold m-0" style={{ color: "white" }}>
                Welcome Back!
              </h1>
              <p
                className="font-bold leading-5 tracking-wide my-5"
                style={{
                  fontSize: "14px",
                  lineHeight: "20px",
                  letterSpacing: "0.5px",
                  margin: "20px 0 30px",
                }}
              >
                To keep connected with us please login with your personal info
              </p>
              <button
                onClick={toggleMode}
                className="font-bold uppercase transition-transform duration-75 ease-in active:scale-95 focus:outline-none hover:bg-white hover:text-red-500"
                style={{
                  borderRadius: "20px",
                  border: "1px solid #fff",
                  background: "transparent",
                  borderColor: "#fff",
                  color: "#fff",
                  fontSize: "12px",
                  padding: "12px 45px",
                  letterSpacing: "1px",
                }}
              >
                Sign In
              </button>
            </div>

            {/* Hello Friend Panel (Right) */}
            <div
              className={`overlay-panel overlay-right absolute top-0 flex flex-col justify-center items-center text-center h-full transition-transform duration-700 ease-in-out`}
              style={{
                right: 0,
                padding: "0 40px",
                width: "50%",
                transform: isSignUp ? "translateX(20%)" : "translateX(0)",
              }}
            >
              <h1 className="font-bold m-0" style={{ color: "white" }}>
                Hello, Friend!
              </h1>
              <p
                className="font-bold leading-5 tracking-wide my-5"
                style={{
                  fontSize: "14px",
                  lineHeight: "20px",
                  letterSpacing: "0.5px",
                  margin: "20px 0 30px",
                }}
              >
                Enter your personal details and start journey with us
              </p>
              <button
                onClick={toggleMode}
                className="font-bold uppercase transition-transform duration-75 ease-in active:scale-95 focus:outline-none hover:bg-white hover:text-red-500"
                style={{
                  borderRadius: "20px",
                  border: "1px solid #fff",
                  background: "transparent",
                  borderColor: "#fff",
                  color: "#fff",
                  fontSize: "12px",
                  padding: "12px 45px",
                  letterSpacing: "1px",
                }}
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SlidingAuth;
