import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import AuthPage from "../pages/AuthPage";
import SocialAuthCallback from "../pages/SocialAuthCallback";
import Dashboard from "../pages/Dashboard";
import ActivityLog from "../pages/ActivityLog";
import AIPredictions from "../pages/AIPredictions";
import AIInsights from "../pages/AIInsights";
import BudgetPlanner from "../pages/BudgetPlanner";
import AddEntry from "../pages/AddEntry";
import Reports from "../pages/Reports";
import Settings from "../pages/Settings";
import AIAssistant from "../pages/AIAssistant";
import { hasAuthenticatedSession } from "../utils/auth";

const ProtectedRoutes = () =>
  hasAuthenticatedSession() ? <Outlet /> : <Navigate to="/auth" replace />;

const PublicRoutes = () =>
  hasAuthenticatedSession() ? <Navigate to="/" replace /> : <Outlet />;

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth/social-callback" element={<SocialAuthCallback />} />

        <Route element={<PublicRoutes />}>
          <Route path="/auth" element={<AuthPage />} />
        </Route>

        <Route element={<ProtectedRoutes />}>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/activity-log" element={<ActivityLog />} />
            <Route path="/ai-predictions" element={<AIPredictions />} />
            <Route path="/ai-insights" element={<AIInsights />} />
            <Route path="/budget-planner" element={<BudgetPlanner />} />
            <Route path="/add-entry" element={<AddEntry />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/ai-assistant" element={<AIAssistant />} />
          </Route>
        </Route>

        <Route
          path="*"
          element={<Navigate to={hasAuthenticatedSession() ? "/" : "/auth"} replace />}
        />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
