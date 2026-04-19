import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppSidebar from "@/components/AppSidebar";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Relatorio from "./pages/Relatorio";
import Cadastros from "./pages/Cadastros";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Admin from "./pages/Admin";
import Estatisticas from "./pages/Estatisticas";
import UpdateModal from "@/components/UpdateModal"
import Updates from "./pages/Updates"

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter>
      <UpdateModal />
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <main className="flex-1 p-6 overflow-auto">
            <Routes>
              <Route path="/updates" element={<Updates />} />
              <Route path="/" element={<Relatorio />} />
              <Route path="/login" element={<Login />} />
              <Route
                path="/cadastros"
                element={
                  <ProtectedRoute>
                    <Cadastros />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/configuracoes"
                element={
                  <ProtectedRoute>
                    <Cadastros />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <Admin />
                  </ProtectedRoute>
                }
              />
              {/* <Route
                path="/estatisticas"
                element={
                  <ProtectedRoute>
                    <Estatisticas />
                  </ProtectedRoute>
                }
              /> */}
              <Route path="/estatisticas" element={<Estatisticas />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
