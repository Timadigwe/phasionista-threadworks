import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'user' | 'designer' | 'admin';
  fallback?: ReactNode;
}

export const ProtectedRoute = ({ 
  children, 
  requiredRole, 
  fallback 
}: ProtectedRouteProps) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);

  // Fetch user role from profile
  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) {
        setRoleLoading(false);
        return;
      }

      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        setUserRole(profile?.role || 'customer');
      } catch (error) {
        console.error('Error fetching user role:', error);
        setUserRole('customer');
      } finally {
        setRoleLoading(false);
      }
    };

    fetchUserRole();
  }, [user]);

  // Show loading spinner while checking authentication and role
  if (isLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based access
  if (requiredRole && userRole) {
    if (requiredRole === 'admin' && userRole !== 'admin') {
      return <Navigate to="/dashboard" replace />;
    }
    
    if (requiredRole === 'designer' && !['designer', 'admin'].includes(userRole)) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  // Render the protected content
  return <>{children}</>;
};

// Public route that redirects authenticated users
export const PublicRoute = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};