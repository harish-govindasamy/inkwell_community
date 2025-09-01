import { createBrowserRouter, Navigate } from "react-router-dom";
import React from "react";
import ErrorBoundary from "../components/ErrorBoundary";

// Components
import Test from "../test/Test";
import CardList from "../card/CardList";
import AllPosts from "../components/AllPosts";
import Home from "../components/Home";
import PostView from "../components/PostView";
import SlidingAuth from "../components/auth/SlidingAuth";
import Dashboard from "../components/Dashboard";
import CreatePost from "../components/CreatePost";
import Profile from "../components/Profile";
import Settings from "../components/Settings";
import Layout from "../components/Layout";
import ProtectedRoute from "../components/ProtectedRoute";

const router = createBrowserRouter([
  // Public routes - Home page accessible without authentication
  {
    path: "/",
    element: (
      <ErrorBoundary>
        <Layout>
          <Home />
        </Layout>
      </ErrorBoundary>
    ),
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/home",
    element: (
      <ErrorBoundary>
        <Layout>
          <Home />
        </Layout>
      </ErrorBoundary>
    ),
    errorElement: <ErrorBoundary />,
  },
  // Authentication routes
  {
    path: "/auth",
    element: <SlidingAuth />,
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/login",
    element: <SlidingAuth />,
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/signup",
    element: <SlidingAuth />,
    errorElement: <ErrorBoundary />,
  },
  // Protected routes - Only available after sign-in
  {
    path: "/dashboard",
    element: (
      <ErrorBoundary>
        <ProtectedRoute>
          <Layout>
            <Dashboard />
          </Layout>
        </ProtectedRoute>
      </ErrorBoundary>
    ),
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/create",
    element: (
      <ErrorBoundary>
        <ProtectedRoute>
          <Layout>
            <CreatePost />
          </Layout>
        </ProtectedRoute>
      </ErrorBoundary>
    ),
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/posts",
    element: (
      <ErrorBoundary>
        <ProtectedRoute>
          <Layout>
            <AllPosts />
          </Layout>
        </ProtectedRoute>
      </ErrorBoundary>
    ),
    errorElement: <ErrorBoundary />,
  },
  // Other protected routes
  {
    path: "/edit/:id",
    element: (
      <ErrorBoundary>
        <ProtectedRoute>
          <Layout>
            <CreatePost isEdit />
          </Layout>
        </ProtectedRoute>
      </ErrorBoundary>
    ),
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/post/:id",
    element: (
      <ErrorBoundary>
        <ProtectedRoute>
          <Layout>
            <PostView />
          </Layout>
        </ProtectedRoute>
      </ErrorBoundary>
    ),
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/profile",
    element: (
      <ErrorBoundary>
        <ProtectedRoute>
          <Layout>
            <Profile />
          </Layout>
        </ProtectedRoute>
      </ErrorBoundary>
    ),
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/settings",
    element: (
      <ErrorBoundary>
        <ProtectedRoute>
          <Layout>
            <Settings />
          </Layout>
        </ProtectedRoute>
      </ErrorBoundary>
    ),
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/cards",
    element: (
      <ErrorBoundary>
        <ProtectedRoute>
          <Layout>
            <CardList />
          </Layout>
        </ProtectedRoute>
      </ErrorBoundary>
    ),
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/test",
    element: <Test />,
    errorElement: <ErrorBoundary />,
  },
  {
    path: "*",
    element: (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
          <p className="text-gray-600 mb-6">Page not found</p>
          <Navigate to="/" replace />
        </div>
      </div>
    ),
    errorElement: <ErrorBoundary />,
  },
]);

export default router;
