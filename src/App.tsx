import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { SolanaWalletProvider } from "./services/solanaWallet";
import ErrorBoundary from "./components/ErrorBoundary";
import { ProtectedRoute, PublicRoute } from "./components/auth/ProtectedRoute";
import { AdminRoute } from "./components/auth/AdminRoute";
import { Layout } from "./components/layout/Layout";
import { AdminLayout } from "./components/layout/AdminLayout";

// Public pages
import { Home } from "./pages/Home";
import { Login } from "./pages/auth/Login";
import { Signup } from "./pages/auth/Signup";
import { EmailVerification } from "./pages/auth/EmailVerification";
import { ClothesGallery } from "./pages/ClothesGallery";
import { Designers } from "./pages/Designers";
import { DesignerProfile } from "./pages/DesignerProfile";
import { HowItWorks } from "./pages/HowItWorks";

// Protected pages
import { Dashboard } from "./pages/Dashboard";
import { Orders } from "./pages/Orders";
import { Favorites } from "./pages/Favorites";
import { MyClothes } from "./pages/MyClothes";
import { Create } from "./pages/Create";
import { EditCloth } from "./pages/EditCloth";
import { Profile } from "./pages/Profile";
import { Order } from "./pages/Order";
import { Measurements } from "./pages/Measurements";
import { DeliveryConfirmation } from "./pages/DeliveryConfirmation";

// Admin pages
import { Admin } from "./pages/Admin";
import { Users } from "./pages/Users";
import { Transactions } from "./pages/Transactions";
import { Analytics } from "./pages/Analytics";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <SolanaWalletProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ErrorBoundary>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Layout><Home /></Layout>} />
                <Route path="/how-it-works" element={<Layout><HowItWorks /></Layout>} />
                
                {/* Auth Routes (redirect if authenticated) */}
                <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
                <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
                <Route path="/verify-email" element={<EmailVerification />} />
                
                {/* Protected Routes */}
                <Route path="/clothes" element={
                  <ProtectedRoute>
                    <Layout><ClothesGallery /></Layout>
                  </ProtectedRoute>
                } />
                <Route path="/designers" element={
                  <ProtectedRoute>
                    <Layout><Designers /></Layout>
                  </ProtectedRoute>
                } />
                <Route path="/designer/:id" element={
                  <ProtectedRoute>
                    <Layout><DesignerProfile /></Layout>
                  </ProtectedRoute>
                } />
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
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <Layout><Profile /></Layout>
                  </ProtectedRoute>
                } />
                <Route path="/order/:id" element={
                  <ProtectedRoute>
                    <Layout><Order /></Layout>
                  </ProtectedRoute>
                } />
                <Route path="/measurements" element={
                  <ProtectedRoute>
                    <Layout><Measurements /></Layout>
                  </ProtectedRoute>
                } />
                <Route path="/delivery-confirmation/:orderId" element={
                  <ProtectedRoute>
                    <Layout><DeliveryConfirmation /></Layout>
                  </ProtectedRoute>
                } />
                
                {/* Admin Routes */}
                <Route path="/admin" element={
                  <AdminRoute>
                    <AdminLayout><Admin /></AdminLayout>
                  </AdminRoute>
                } />
                <Route path="/users" element={
                  <AdminRoute>
                    <AdminLayout><Users /></AdminLayout>
                  </AdminRoute>
                } />
                <Route path="/transactions" element={
                  <AdminRoute>
                    <AdminLayout><Transactions /></AdminLayout>
                  </AdminRoute>
                } />
                <Route path="/analytics" element={
                  <AdminRoute>
                    <AdminLayout><Analytics /></AdminLayout>
                  </AdminRoute>
                } />
                
                {/* 404 Route */}
                <Route path="*" element={<Layout><NotFound /></Layout>} />
              </Routes>
            </ErrorBoundary>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </SolanaWalletProvider>
  </QueryClientProvider>
);

export default App;
