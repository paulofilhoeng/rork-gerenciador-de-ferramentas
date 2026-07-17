import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/Layout";
import { DataProvider } from "@/lib/store";
import { AuthProvider, useAuth } from "@/lib/auth";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Tools from "./pages/Tools";
import ToolDetail from "./pages/ToolDetail";
import Companies, { CompanyDetail } from "./pages/Companies";
import Sites, { SiteDetail } from "./pages/Sites";
import Employees, { EmployeeDetail } from "./pages/Employees";
import Users from "./pages/Users";
import MovementTypes from "./pages/MovementTypes";
import BulkImport from "./pages/BulkImport";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children, adminOnly }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { user, loading, isAdmin, profile } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-app-bg">
        <Loader2 size={32} className="animate-spin text-app-accent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (profile && !profile.active) {
    return <Login />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <Layout>{children}</Layout>;
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-app-bg">
        <Loader2 size={32} className="animate-spin text-app-accent" />
      </div>
    );
  }

  if (!user) {
    return (
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <DataProvider>
        <Routes>
          <Route path="/login" element={<Navigate to="/" replace />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/ferramentas" element={<ProtectedRoute><Tools /></ProtectedRoute>} />
          <Route path="/ferramentas/:id" element={<ProtectedRoute><ToolDetail /></ProtectedRoute>} />
          <Route path="/locadoras" element={<ProtectedRoute><Companies /></ProtectedRoute>} />
          <Route path="/locadoras/:id" element={<ProtectedRoute><CompanyDetail /></ProtectedRoute>} />
          <Route path="/obras" element={<ProtectedRoute><Sites /></ProtectedRoute>} />
          <Route path="/obras/:id" element={<ProtectedRoute><SiteDetail /></ProtectedRoute>} />
          <Route path="/funcionarios" element={<ProtectedRoute><Employees /></ProtectedRoute>} />
          <Route path="/funcionarios/:id" element={<ProtectedRoute><EmployeeDetail /></ProtectedRoute>} />
          <Route path="/relatorios" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
          <Route path="/usuarios" element={<ProtectedRoute adminOnly><Users /></ProtectedRoute>} />
          <Route path="/tipos-movimentacao" element={<ProtectedRoute adminOnly><MovementTypes /></ProtectedRoute>} />
          <Route path="/importacao" element={<ProtectedRoute adminOnly><BulkImport /></ProtectedRoute>} />
          <Route path="/ajustes" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </DataProvider>
    </BrowserRouter>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster theme="dark" />
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
