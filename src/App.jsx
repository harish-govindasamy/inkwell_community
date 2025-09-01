import { RouterProvider } from "react-router-dom";
import { AuthProvider } from "./context/SupabaseAuthContext";
import { ToastProvider } from "./components/ToastProvider";
import ErrorBoundary from "./components/ErrorBoundary";
import router from "./routes/Routes";
import SupabaseStatus from "./components/SupabaseStatus";
import "./App.css";

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <SupabaseStatus />
          <RouterProvider router={router} />
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
