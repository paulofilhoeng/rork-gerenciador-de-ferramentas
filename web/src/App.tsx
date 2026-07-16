import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/Layout";
import { DataProvider } from "@/lib/store";

import Dashboard from "./pages/Dashboard";
import Tools from "./pages/Tools";
import ToolDetail from "./pages/ToolDetail";
import Companies, { CompanyDetail } from "./pages/Companies";
import Sites, { SiteDetail } from "./pages/Sites";
import Employees, { EmployeeDetail } from "./pages/Employees";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster theme="dark" />
      <DataProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/ferramentas" element={<Tools />} />
              <Route path="/ferramentas/:id" element={<ToolDetail />} />
              <Route path="/locadoras" element={<Companies />} />
              <Route path="/locadoras/:id" element={<CompanyDetail />} />
              <Route path="/obras" element={<Sites />} />
              <Route path="/obras/:id" element={<SiteDetail />} />
              <Route path="/funcionarios" element={<Employees />} />
              <Route path="/funcionarios/:id" element={<EmployeeDetail />} />
              <Route path="/ajustes" element={<Settings />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </DataProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
