import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Menu, X, Search, Heart, ShoppingBag, User, LogOut, Wallet, Coins, DollarSign, Wifi, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { useSolanaWallet } from "@/services/solanaWallet";
import { NotificationBell } from "@/components/NotificationBell";
import { toast } from "sonner";
import phasionisterLogo from "@/assets/phasionistar-logo.png";

interface HeaderProps {}

export const Header = ({}: HeaderProps) => {
  const { user, profile, isAuthenticated, logout, fetchProfile } = useAuth();
  const { connected, publicKey, getBalance, getUsdcBalance } = useSolanaWallet();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [solBalance, setSolBalance] = useState<number>(0);
  const [usdcBalance, setUsdcBalance] = useState<number>(0);
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);
  const location = useLocation();

  // Fetch profile when user is authenticated but profile is not loaded
  useEffect(() => {
    if (isAuthenticated && user && !profile) {
      fetchProfile();
    }
  }, [isAuthenticated, user, profile, fetchProfile]);

  // Fetch wallet balances when wallet is connected
  useEffect(() => {
    const fetchBalances = async () => {
      if (connected && publicKey) {
        setIsLoadingBalances(true);
        try {
          // Get SOL balance
          const solBal = await getBalance(publicKey);
          setSolBalance(solBal);
          
          // Get USDC balance
          const usdcBal = await getUsdcBalance(publicKey);
          setUsdcBalance(usdcBal);
        } catch (error) {
          console.error('Error fetching wallet balances:', error);
        } finally {
          setIsLoadingBalances(false);
        }
      } else {
        setSolBalance(0);
        setUsdcBalance(0);
      }
    };

    fetchBalances();
  }, [connected, publicKey, getBalance, getUsdcBalance]);

  const isActive = (path: string) => location.pathname === path;

  // Refresh wallet balances
  const refreshBalances = async () => {
    if (connected && publicKey) {
      setIsLoadingBalances(true);
      try {
        const solBal = await getBalance(publicKey);
        const usdcBal = await getUsdcBalance(publicKey);
        setSolBalance(solBal);
        setUsdcBalance(usdcBal);
        toast.success('Balances updated');
      } catch (error) {
        console.error('Error refreshing balances:', error);
        toast.error('Failed to refresh balances');
      } finally {
        setIsLoadingBalances(false);
      }
    }
  };

  // Get user data from profile
  const phasionName = profile?.phasion_name || user?.email?.split('@')[0] || 'User';
  const solanaWallet = profile?.solana_wallet;

  // Handle search functionality
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Navigate to clothes page with search query
      window.location.href = `/clothes?search=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  // Handle logout with loading state and feedback
  const handleLogout = async () => {
    console.log('Starting logout process...');
    try {
      setIsLoggingOut(true);
      console.log('Set loading state to true');
      
      console.log('Calling logout function...');
      await logout();
      console.log('Logout completed successfully');
      toast.success('Successfully signed out');
      // Close mobile menu if open
      setIsMenuOpen(false);
    } catch (error: any) {
      console.error('Logout error:', error);
      toast.error('Failed to sign out. Please try again.');
    } finally {
      console.log('Setting loading state to false');
      setIsLoggingOut(false);
    }
  };

  const navLinks = [
    { href: "/how-it-works", label: "How It Works" },
  ];

  // Add authenticated-only links
  const authenticatedNavLinks = [
    { href: "/clothes", label: "Clothes" },
    { href: "/designers", label: "Designers" },
  ];


  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border"
    >
      <div className="container-custom">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 hover-scale">
            <img src={phasionisterLogo} alt="Phasionistar" className="h-10 w-10" />
            <span className="font-bold text-xl bg-gradient-primary bg-clip-text text-transparent">
              Phasionistar
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`text-sm font-medium transition-all duration-200 hover:text-primary hover:scale-105 ${
                  isActive(link.href)
                    ? "text-primary border-b-2 border-primary pb-1"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
            
            {/* Show authenticated-only links */}
            {isAuthenticated && authenticatedNavLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`text-sm font-medium transition-all duration-200 hover:text-primary hover:scale-105 ${
                  isActive(link.href)
                    ? "text-primary border-b-2 border-primary pb-1"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
            
          </nav>

          {/* Search Bar - Desktop */}
          <div className="hidden lg:flex items-center space-x-4 flex-1 max-w-md ml-8">
            <form onSubmit={handleSearch} className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search clothes, designers..."
                className="pl-10 pr-4 py-2 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* Search Button - Mobile */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
            >
              <Search className="h-5 w-5" />
            </Button>

            {isAuthenticated && user ? (
              // Authenticated User Actions
              <>
                <Button variant="ghost" size="sm" className="relative" asChild>
                  <Link to="/favorites">
                    <Heart className="h-5 w-5" />
                  </Link>
                </Button>
                
                <Button variant="ghost" size="sm" className="relative" asChild>
                  <Link to="/orders">
                    <ShoppingBag className="h-5 w-5" />
                  </Link>
                </Button>

                {/* Notifications */}
                {isAuthenticated && (
                  <NotificationBell />
                )}

                {/* Wallet Status Indicator */}
                {connected && publicKey && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-green-600 hover:bg-green-50">
                        <Wallet className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-64" align="end">
                      <div className="p-3">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Wallet className="h-4 w-4 text-green-600" />
                            <span className="font-medium text-sm">Wallet Connected</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={refreshBalances}
                            disabled={isLoadingBalances}
                            className="h-6 w-6 p-0"
                          >
                            <RefreshCw className={`h-3 w-3 ${isLoadingBalances ? 'animate-spin' : ''}`} />
                          </Button>
                        </div>
                        
                        <div className="space-y-2">
                          {/* Network Info */}
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Wifi className="h-3 w-3" />
                            <span>Devnet</span>
                          </div>
                          
                          {/* SOL Balance */}
                          <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-2">
                              <Coins className="h-4 w-4 text-yellow-500" />
                              <span className="text-sm font-medium">SOL</span>
                            </div>
                            <div className="text-sm font-mono">
                              {isLoadingBalances ? (
                                <div className="animate-pulse bg-gray-200 h-4 w-16 rounded"></div>
                              ) : (
                                `${solBalance.toFixed(4)}`
                              )}
                            </div>
                          </div>
                          
                          {/* USDC Balance */}
                          <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-blue-500" />
                              <span className="text-sm font-medium">USDC</span>
                            </div>
                            <div className="text-sm font-mono">
                              {isLoadingBalances ? (
                                <div className="animate-pulse bg-gray-200 h-4 w-16 rounded"></div>
                              ) : (
                                `${usdcBalance.toFixed(2)}`
                              )}
                            </div>
                          </div>
                          
                          {/* Wallet Address */}
                          <div className="pt-2 border-t">
                            <div className="text-xs text-muted-foreground mb-1">Address</div>
                            <div className="text-xs font-mono bg-gray-100 p-2 rounded break-all">
                              {publicKey.slice(0, 8)}...{publicKey.slice(-8)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}

                {/* User Profile Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full hover:scale-105 transition-transform">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={profile?.avatar_url} alt={phasionName} />
                        <AvatarFallback>{phasionName?.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        <p className="font-medium">{phasionName}</p>
                        <p className="w-[200px] truncate text-sm text-muted-foreground">
                          {user?.email}
                        </p>
                        {connected && publicKey && (
                          <Badge variant="secondary" className="text-xs flex items-center gap-1 w-fit">
                            <Wallet className="h-3 w-3" />
                            Wallet Connected
                          </Badge>
                        )}
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="hover:bg-muted" asChild>
                      <Link to="/profile">
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="hover:bg-muted">
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={handleLogout} 
                      disabled={isLoggingOut}
                      className="hover:bg-destructive hover:text-destructive-foreground disabled:opacity-50"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      {isLoggingOut ? 'Signing out...' : 'Sign out'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              // Guest User Actions
              <div className="hidden md:flex items-center space-x-2">
                <Button variant="ghost" asChild>
                  <Link to="/login">Sign In</Link>
                </Button>
                <Button asChild className="btn-hero">
                  <Link to="/signup">Sign Up</Link>
                </Button>
              </div>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Search */}
        {isSearchOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden border-t border-border py-4"
          >
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search clothes, designers..."
                className="pl-10 pr-4 py-2 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
          </motion.div>
        )}

        {/* Mobile Menu */}
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-border py-4"
          >
            <nav className="flex flex-col space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`text-sm font-medium transition-all duration-200 hover:text-primary hover:scale-105 ${
                    isActive(link.href)
                      ? "text-primary border-l-4 border-primary pl-2"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              
              {/* Show authenticated-only links in mobile menu */}
              {isAuthenticated && authenticatedNavLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`text-sm font-medium transition-all duration-200 hover:text-primary hover:scale-105 ${
                    isActive(link.href)
                      ? "text-primary border-l-4 border-primary pl-2"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              
              {!isAuthenticated ? (
                <div className="flex flex-col space-y-2 pt-4 border-t border-border">
                  <Button variant="ghost" asChild>
                    <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                      Sign In
                    </Link>
                  </Button>
                  <Button asChild className="btn-hero">
                    <Link to="/signup" onClick={() => setIsMenuOpen(false)}>
                      Sign Up
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col space-y-2 pt-4 border-t border-border">
                  <Button variant="ghost" asChild>
                    <Link to="/profile" onClick={() => setIsMenuOpen(false)}>
                      Profile
                    </Link>
                  </Button>
                  <Button 
                    variant="ghost" 
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    {isLoggingOut ? 'Signing out...' : 'Sign Out'}
                  </Button>
                </div>
              )}
            </nav>
          </motion.div>
        )}
      </div>
    </motion.header>
  );
};