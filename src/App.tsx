import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { SolanaWalletProvider } from "./services/solanaWallet";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ProtectedRoute, PublicRoute } from "./components/auth/ProtectedRoute";
import { Layout } from "./components/layout/Layout";

// Public pages
import { Home } from "./pages/Home";
import { Login } from "./pages/auth/Login";
import { Signup } from "./pages/auth/Signup";
import { EmailVerification } from "./pages/auth/EmailVerification";
import { ClothesGallery } from "./pages/ClothesGallery";
import { Designers } from "./pages/Designers";
import { HowItWorks } from "./pages/HowItWorks";

// Protected pages
import { Dashboard } from "./pages/Dashboard";
import { Orders } from "./pages/Orders";
import { Favorites } from "./pages/Favorites";
import { MyClothes } from "./pages/MyClothes";
import { Create } from "./pages/Create";
import { EditCloth } from "./pages/EditCloth";

// Admin pages
import { Admin } from "./pages/Admin";
import { Users } from "./pages/Users";
import { Transactions } from "./pages/Transactions";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <SolanaWalletProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Layout><Home /></Layout>} />
                <Route path="/clothes" element={<Layout><ClothesGallery /></Layout>} />
                <Route path="/designers" element={<Layout><Designers /></Layout>} />
                <Route path="/how-it-works" element={<Layout><HowItWorks /></Layout>} />
                
                {/* Auth Routes (redirect if authenticated) */}
                <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
                <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
                <Route path="/verify-email" element={<EmailVerification />} />
                
                {/* Protected Routes */}
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <Layout><Dashboard /></Layout>
                  </ProtectedRoute>
                } />
                <Route path="/orders" element={
                  <ProtectedRoute>
                    <Layout><Orders /></Layout>
                  </ProtectedRoute>
                } />
                <Route path="/favorites" element={
                  <ProtectedRoute>
                    <Layout><Favorites /></Layout>
                  </ProtectedRoute>
                } />
                <Route path="/my-clothes" element={
                  <ProtectedRoute>
                    <Layout><MyClothes /></Layout>
                  </ProtectedRoute>
                } />
                <Route path="/create" element={
                  <ProtectedRoute requiredRole="designer">
                    <Layout><Create /></Layout>
                  </ProtectedRoute>
                } />
                <Route path="/edit-cloth/:id" element={
                  <ProtectedRoute requiredRole="designer">
                    <Layout><EditCloth /></Layout>
                  </ProtectedRoute>
                } />
                
                {/* Admin Routes */}
                <Route path="/admin" element={
                  <ProtectedRoute requiredRole="admin">
                    <Layout><Admin /></Layout>
                  </ProtectedRoute>
                } />
                <Route path="/users" element={
                  <ProtectedRoute requiredRole="admin">
                    <Layout><Users /></Layout>
                  </ProtectedRoute>
                } />
                <Route path="/transactions" element={
                  <ProtectedRoute requiredRole="admin">
                    <Layout><Transactions /></Layout>
                  </ProtectedRoute>
                } />
                
                {/* 404 Route */}
                <Route path="*" element={<Layout><NotFound /></Layout>} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </SolanaWalletProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
