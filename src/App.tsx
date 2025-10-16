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
import { LandingLayout } from "./components/layout/LandingLayout";
import { UserLayout } from "./components/layout/UserLayout";
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
import { DesignerOrders } from "./pages/DesignerOrders";
import { Favorites } from "./pages/Favorites";
import { MyClothes } from "./pages/MyClothes";
import { Create } from "./pages/Create";
import { EditCloth } from "./pages/EditCloth";
import { Profile } from "./pages/Profile";
import { Order } from "./pages/Order";
import { Measurements } from "./pages/Measurements";
import { DeliveryConfirmation } from "./pages/DeliveryConfirmation";
import { KYCVerification } from "./pages/KYCVerification";

// Admin pages
import { Admin } from "./pages/Admin";
import { Users } from "./pages/Users";
import { Transactions } from "./pages/Transactions";
import { Analytics } from "./pages/Analytics";
import { AdminKYCReview } from "./pages/AdminKYCReview";

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
                {/* Landing Page Routes (Public) */}
                <Route path="/" element={<LandingLayout><Home /></LandingLayout>} />
                <Route path="/how-it-works" element={<LandingLayout><HowItWorks /></LandingLayout>} />
                
                {/* Auth Routes (Public) */}
                <Route path="/login" element={
                  <PublicRoute>
                    <LandingLayout><Login /></LandingLayout>
                  </PublicRoute>
                } />
                <Route path="/signup" element={
                  <PublicRoute>
                    <LandingLayout><Signup /></LandingLayout>
                  </PublicRoute>
                } />
                <Route path="/verify-email" element={
                  <PublicRoute>
                    <LandingLayout><EmailVerification /></LandingLayout>
                  </PublicRoute>
                } />
                
                {/* User Routes (Protected with UserLayout) */}
                <Route path="/clothes" element={
                  <ProtectedRoute>
                    <UserLayout><ClothesGallery /></UserLayout>
                  </ProtectedRoute>
                } />
                <Route path="/designers" element={
                  <ProtectedRoute>
                    <UserLayout><Designers /></UserLayout>
                  </ProtectedRoute>
                } />
                <Route path="/designer/:id" element={
                  <ProtectedRoute>
                    <UserLayout><DesignerProfile /></UserLayout>
                  </ProtectedRoute>
                } />
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <UserLayout><Dashboard /></UserLayout>
                  </ProtectedRoute>
                } />
                <Route path="/orders" element={
                  <ProtectedRoute>
                    <UserLayout><Orders /></UserLayout>
                  </ProtectedRoute>
                } />
                <Route path="/designer/orders" element={
                  <ProtectedRoute requiredRole="designer">
                    <UserLayout><DesignerOrders /></UserLayout>
                  </ProtectedRoute>
                } />
                <Route path="/favorites" element={
                  <ProtectedRoute>
                    <UserLayout><Favorites /></UserLayout>
                  </ProtectedRoute>
                } />
                <Route path="/my-clothes" element={
                  <ProtectedRoute>
                    <UserLayout><MyClothes /></UserLayout>
                  </ProtectedRoute>
                } />
                <Route path="/create" element={
                  <ProtectedRoute requiredRole="designer">
                    <UserLayout><Create /></UserLayout>
                  </ProtectedRoute>
                } />
                <Route path="/edit-cloth/:id" element={
                  <ProtectedRoute requiredRole="designer">
                    <UserLayout><EditCloth /></UserLayout>
                  </ProtectedRoute>
                } />
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <UserLayout><Profile /></UserLayout>
                  </ProtectedRoute>
                } />
                <Route path="/order/:id" element={
                  <ProtectedRoute>
                    <UserLayout><Order /></UserLayout>
                  </ProtectedRoute>
                } />
                <Route path="/measurements" element={
                  <ProtectedRoute>
                    <UserLayout><Measurements /></UserLayout>
                  </ProtectedRoute>
                } />
                <Route path="/delivery-confirmation/:orderId" element={
                  <ProtectedRoute>
                    <UserLayout><DeliveryConfirmation /></UserLayout>
                  </ProtectedRoute>
                } />
                <Route path="/kyc-verification" element={
                  <ProtectedRoute>
                    <UserLayout><KYCVerification /></UserLayout>
                  </ProtectedRoute>
                } />
                
                {/* Admin Routes (Protected with AdminLayout) */}
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
                <Route path="/admin/kyc-review" element={
                  <AdminRoute>
                    <AdminLayout><AdminKYCReview /></AdminLayout>
                  </AdminRoute>
                } />
                
                {/* 404 Route */}
                <Route path="*" element={<LandingLayout><NotFound /></LandingLayout>} />
              </Routes>
            </ErrorBoundary>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </SolanaWalletProvider>
  </QueryClientProvider>
);

export default App;
