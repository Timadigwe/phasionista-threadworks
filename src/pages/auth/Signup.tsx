import { useState } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, UserPlus, Palette, Wallet } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { useSolanaWallet } from "@/services/solanaWallet";
import { useWallet } from '@solana/wallet-adapter-react';
import { toast } from "sonner";
import { z } from "zod";

// Validation schema
const signupSchema = z.object({
  phasionName: z.string()
    .min(3, "Phasion name must be at least 3 characters")
    .max(20, "Phasion name must be less than 20 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Phasion name can only contain letters, numbers, and underscores"),
  email: z.string()
    .email("Please enter a valid email address"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain at least one uppercase letter, one lowercase letter, and one number"),
  confirmPassword: z.string(),
  role: z.enum(["customer", "designer"]),
  acceptTerms: z.boolean().refine(val => val === true, "You must accept the terms and conditions")
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const Signup = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const { connected, publicKey, connect, validateAddress } = useSolanaWallet();
  const { select, wallets } = useWallet();
  const [formData, setFormData] = useState({
    phasionName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "customer",
    acceptTerms: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setValidationErrors({});

    // Validate form data
    try {
      signupSchema.parse(formData);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setValidationErrors(fieldErrors);
        setIsLoading(false);
        return;
      }
    }

    // Validate wallet connection is required
    if (!connected || !publicKey) {
      setError("Please connect your Solana wallet to continue");
      toast.error("Wallet connection is required");
      setIsLoading(false);
      return;
    }

    try {
      const userData = {
        phasionName: formData.phasionName,
        email: formData.email,
        password: formData.password,
        passwordConfirmed: formData.confirmPassword,
        role: formData.role,
        solanaWallet: publicKey,
      };

      const response = await signup(userData);
      toast.success(response.message || "Account created successfully! Please check your email to verify your account.");
      navigate("/login");
    } catch (error: any) {
      console.error("Signup failed:", error);
      setError(error.message || "Signup failed. Please try again.");
      toast.error("Signup failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Check if all requirements are met for signup
  const isSignupReady = formData.acceptTerms && connected && publicKey && !isLoading;

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
                className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <UserPlus className="h-8 w-8 text-primary-foreground" />
              </motion.div>
              <CardTitle className="text-2xl font-bold">Join Phasionistar</CardTitle>
              <CardDescription>
                Create your account and start your fashion journey
              </CardDescription>
            </CardHeader>

            <CardContent>
              {error && (
                <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Role Selection */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">I want to join as:</Label>
                  <RadioGroup
                    value={formData.role}
                    onValueChange={(value) => handleInputChange("role", value)}
                    className="grid grid-cols-2 gap-4"
                  >
                    <div className="flex items-center space-x-2 border rounded-lg p-3 hover:border-primary transition-colors">
                      <RadioGroupItem value="customer" id="customer" />
                      <Label htmlFor="customer" className="flex-1 cursor-pointer">
                        <div className="font-medium">Customer</div>
                        <div className="text-xs text-muted-foreground">Browse & buy</div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 border rounded-lg p-3 hover:border-primary transition-colors">
                      <RadioGroupItem value="designer" id="designer" />
                      <Label htmlFor="designer" className="flex-1 cursor-pointer">
                        <div className="font-medium flex items-center">
                          Designer <Palette className="h-3 w-3 ml-1" />
                        </div>
                        <div className="text-xs text-muted-foreground">Create & sell</div>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Form Fields */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="phasionName">Phasion Name</Label>
                    <Input
                      id="phasionName"
                      type="text"
                      placeholder="Your unique username"
                      value={formData.phasionName}
                      onChange={(e) => handleInputChange("phasionName", e.target.value)}
                      className={validationErrors.phasionName ? "border-red-500" : ""}
                      required
                    />
                    {validationErrors.phasionName && (
                      <p className="text-sm text-red-500 mt-1">{validationErrors.phasionName}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      className={validationErrors.email ? "border-red-500" : ""}
                      required
                    />
                    {validationErrors.email && (
                      <p className="text-sm text-red-500 mt-1">{validationErrors.email}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a strong password"
                        value={formData.password}
                        onChange={(e) => handleInputChange("password", e.target.value)}
                        className={validationErrors.password ? "border-red-500" : ""}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    {validationErrors.password && (
                      <p className="text-sm text-red-500 mt-1">{validationErrors.password}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm your password"
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                        className={validationErrors.confirmPassword ? "border-red-500" : ""}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    {validationErrors.confirmPassword && (
                      <p className="text-sm text-red-500 mt-1">{validationErrors.confirmPassword}</p>
                    )}
                  </div>
                </div>

                {/* Solana Wallet Connection - Required */}
                <div className="p-4 bg-muted/50 rounded-lg border border-primary/20">
                  <div className="text-center">
                    <div className="text-sm font-medium mb-2 text-primary">Connect Solana Wallet (Required)</div>
                    <div className="text-xs text-muted-foreground mb-3">
                      Your wallet is required for secure payments and escrow transactions. 
                      {(!wallets || wallets.length === 0) && (
                        <span className="block mt-1 text-amber-600">
                          Please install <a href="https://phantom.app" target="_blank" rel="noopener noreferrer" className="underline">Phantom</a> or <a href="https://solflare.com" target="_blank" rel="noopener noreferrer" className="underline">Solflare</a> wallet first.
                        </span>
                      )}
                    </div>
                    {connected ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-center space-x-2 text-sm text-green-600">
                          <Wallet className="h-4 w-4" />
                          <span>Wallet Connected</span>
                        </div>
                        <div className="text-xs text-muted-foreground font-mono">
                          {publicKey?.slice(0, 8)}...{publicKey?.slice(-8)}
                        </div>
                      </div>
                    ) : (
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                        onClick={async () => {
                          try {
                            // Check if any wallets are available
                            if (!wallets || wallets.length === 0) {
                              toast.error('No wallets detected. Please install Phantom or Solflare wallet.');
                              return;
                            }
                            
                            // Auto-select Phantom wallet if available, otherwise first wallet
                            const phantomWallet = wallets.find(w => w.adapter.name === 'Phantom');
                            const walletToSelect = phantomWallet || wallets[0];
                            if (walletToSelect) {
                              select(walletToSelect.adapter.name);
                            }
                            
                            await connect();
                            toast.success('Wallet connected successfully!');
                          } catch (error: any) {
                            console.error('Wallet connection failed:', error);
                            
                            // Handle specific error types
                            if (error.name === 'WalletNotSelectedError') {
                              toast.error('Please select a wallet first.');
                            } else if (error.name === 'WalletNotFoundError') {
                              toast.error('Wallet not found. Please install Phantom or Solflare wallet.');
                            } else if (error.name === 'WalletConnectionError') {
                              toast.error('Failed to connect to wallet. Please try again.');
                            } else {
                              toast.error('Failed to connect wallet. Please try again.');
                            }
                          }
                        }}
                      >
                        <Wallet className="mr-2 h-4 w-4" />
                        Connect Wallet
                      </Button>
                    )}
                  </div>
                </div>

                {/* Terms and Conditions */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="terms"
                    checked={formData.acceptTerms}
                    onCheckedChange={(checked) => handleInputChange("acceptTerms", checked as boolean)}
                  />
                  <Label htmlFor="terms" className="text-sm">
                    I agree to the{" "}
                    <Link to="/terms" className="text-primary hover:underline">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link to="/privacy" className="text-primary hover:underline">
                      Privacy Policy
                    </Link>
                  </Label>
                </div>

                {/* Submit Button - Only enabled when wallet is connected */}
                <Button
                  type="submit"
                  className="w-full btn-hero"
                  disabled={!isSignupReady}
                >
                  {isLoading ? "Creating Account..." : 
                   !connected ? "Connect Wallet First" : 
                   !formData.acceptTerms ? "Accept Terms First" : 
                   "Create Account"}
                </Button>
              </form>

              {/* Login Link */}
              <div className="text-center mt-6">
                <p className="text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <Link to="/login" className="text-primary hover:underline font-medium">
                    Sign in
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </Layout>
  );
};