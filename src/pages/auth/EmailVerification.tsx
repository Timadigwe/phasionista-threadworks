import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, Mail, ArrowRight } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Layout } from "@/components/layout/Layout";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export const EmailVerification = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { resendVerification } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState("");
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        // First, check if we have a session (user might already be verified)
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          console.log('User already has session:', session.user);
          setIsVerified(true);
          toast.success("Email verified successfully!");
          setIsLoading(false);
          return;
        }

        // Get URL parameters from Supabase email verification
        const token = searchParams.get('token');
        const type = searchParams.get('type');
        const accessToken = searchParams.get('access_token');
        const refreshToken = searchParams.get('refresh_token');
        
        console.log('Verification params:', { token, type, accessToken, refreshToken });
        console.log('All search params:', Object.fromEntries(searchParams.entries()));
        
        // Try different verification methods
        if (accessToken && refreshToken) {
          // Method 1: Direct session with tokens
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });

          if (sessionError) {
            console.error('Session error:', sessionError);
            setError(sessionError.message || "Failed to verify email");
            setIsLoading(false);
            return;
          }

          if (data.user) {
            setIsVerified(true);
            toast.success("Email verified successfully!");
          }
        } else if (type === 'signup' && token) {
          // Method 2: OTP verification
          const { data, error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: 'signup'
          });

          console.log('Verification result:', { data, error: verifyError });

          if (verifyError) {
            console.error('Verification error:', verifyError);
            setError(verifyError.message || "Failed to verify email");
            setIsLoading(false);
            return;
          }

          if (data.user) {
            setIsVerified(true);
            toast.success("Email verified successfully!");
          } else {
            setError("No user data returned from verification");
          }
        } else {
          console.log('Missing required params:', { token, type, accessToken, refreshToken });
          setError("Invalid verification link - missing required parameters");
        }
      } catch (error: any) {
        console.error('Verification failed:', error);
        setError(error.message || "Verification failed");
      } finally {
        setIsLoading(false);
      }
    };

    verifyEmail();

    // Listen for auth state changes (Supabase might auto-process the verification)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session);
        if (event === 'SIGNED_IN' && session?.user) {
          setIsVerified(true);
          toast.success("Email verified successfully!");
          setIsLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [searchParams]);

  const handleResendVerification = async () => {
    setIsResending(true);
    try {
      // Try to get email from URL params first, then prompt user
      const email = searchParams.get('email') || prompt('Please enter your email address:');
      if (email) {
        await resendVerification(email);
        toast.success("Verification email sent! Please check your inbox.");
      }
    } catch (error: any) {
      console.error('Resend verification error:', error);
      toast.error(error.message || "Failed to resend verification email");
    } finally {
      setIsResending(false);
    }
  };

  if (isLoading) {
    return (
      <Layout showFooter={false}>
        <div className="min-h-screen bg-gradient-to-br from-muted/30 via-background to-muted/30 flex items-center justify-center py-12 px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md"
          >
            <Card className="card-fashion">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mail className="h-8 w-8 text-primary animate-pulse" />
                  </div>
                  <h2 className="text-xl font-semibold mb-2">Verifying your email...</h2>
                  <p className="text-muted-foreground">Please wait while we verify your email address.</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showFooter={false}>
      <div className="min-h-screen bg-gradient-to-br from-muted/30 via-background to-muted/30 flex items-center justify-center py-12 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Card className="card-fashion">
            <CardHeader className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                  isVerified 
                    ? "bg-green-100 text-green-600" 
                    : "bg-red-100 text-red-600"
                }`}
              >
                {isVerified ? (
                  <CheckCircle className="h-8 w-8" />
                ) : (
                  <XCircle className="h-8 w-8" />
                )}
              </motion.div>
              <CardTitle className="text-2xl font-bold">
                {isVerified ? "Email Verified!" : "Verification Failed"}
              </CardTitle>
              <CardDescription>
                {isVerified 
                  ? "Your email has been successfully verified. You can now sign in to your account."
                  : "We couldn't verify your email. The link may be expired or invalid."
                }
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {isVerified ? (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800">
                      🎉 Welcome to Phasionistar! Your account is now active and ready to use.
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <Button 
                      asChild 
                      className="w-full btn-hero"
                      onClick={() => navigate("/login")}
                    >
                      <Link to="/login">
                        Sign In to Your Account
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                    
                    <Button 
                      asChild 
                      variant="outline" 
                      className="w-full"
                    >
                      <Link to="/">
                        Go to Homepage
                      </Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800">
                      {error || "The verification link is invalid or has expired."}
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <Button 
                      onClick={handleResendVerification}
                      disabled={isResending}
                      className="w-full btn-hero"
                    >
                      {isResending ? "Sending..." : "Resend Verification Email"}
                    </Button>
                    
                    <Button 
                      asChild 
                      variant="outline" 
                      className="w-full"
                    >
                      <Link to="/signup">
                        Try Signing Up Again
                      </Link>
                    </Button>
                    
                    <Button 
                      asChild 
                      variant="outline" 
                      className="w-full"
                    >
                      <Link to="/login">
                        Sign In Instead
                      </Link>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </Layout>
  );
};