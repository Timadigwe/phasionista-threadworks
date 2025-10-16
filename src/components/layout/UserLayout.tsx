import { ReactNode, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ShoppingBag, 
  Heart,
  User, 
  LogOut,
  Menu,
  X,
  Search,
  Wallet,
  Coins,
  DollarSign,
  Wifi,
  RefreshCw,
  Package
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { useSolanaWallet } from '@/services/solanaWallet';
import { NotificationBell } from '@/components/NotificationBell';
import { toast } from 'sonner';
import phasionisterLogo from '@/assets/phasionistar-logo.png';

interface UserLayoutProps {
  children: ReactNode;
}

// Customer navigation items
const customerNavItems = [
  {
    name: 'Browse',
    href: '/clothes',
    icon: ShoppingBag,
    description: 'Browse clothing'
  },
  {
    name: 'Designers',
    href: '/designers',
    icon: User,
    description: 'Find designers'
  }
];

// Designer navigation items
const designerNavItems = [
  {
    name: 'My Items',
    href: '/my-clothes',
    icon: ShoppingBag,
    description: 'Manage your items'
  },
  {
    name: 'Orders',
    href: '/designer/orders',
    icon: Package,
    description: 'Manage orders'
  },
  {
    name: 'Create',
    href: '/create',
    icon: User,
    description: 'Add new items'
  }
];

export const UserLayout = ({ children }: UserLayoutProps) => {
  const { user, profile, logout, fetchProfile } = useAuth();
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
    if (user && !profile) {
      fetchProfile();
    }
  }, [user, profile, fetchProfile]);

  // Fetch wallet balances when wallet is connected
  useEffect(() => {
    const fetchBalances = async () => {
      if (connected && publicKey) {
        setIsLoadingBalances(true);
        try {
          const solBal = await getBalance(publicKey);
          setSolBalance(solBal);
          
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

  // Handle search functionality
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/clothes?search=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      toast.success('Successfully signed out');
      setIsMenuOpen(false);
    } catch (error: any) {
      console.error('Logout error:', error);
      toast.error('Failed to sign out. Please try again.');
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* User Header */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border"
      >
        <div className="container-custom">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link to="/dashboard" className="flex items-center space-x-2 hover-scale">
              <img src={phasionisterLogo} alt="Phasionistar" className="h-10 w-10" />
              <span className="font-bold text-xl bg-gradient-primary bg-clip-text text-transparent">
                Phasionistar
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              {(profile?.role === 'designer' ? designerNavItems : customerNavItems).map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`text-sm font-medium transition-all duration-200 hover:text-primary hover:scale-105 ${
                      isActive
                        ? "text-primary border-b-2 border-primary pb-1"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {item.name}
                  </Link>
                );
              })}
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

              {/* User Actions */}
              {profile?.role !== 'designer' && (
                <Button variant="ghost" size="sm" className="relative" asChild>
                  <Link to="/favorites">
                    <Heart className="h-5 w-5" />
                  </Link>
                </Button>
              )}
              {profile?.role !== 'designer' && (
              <Button variant="ghost" size="sm" className="relative" asChild>
                <Link to="/orders">
                  <ShoppingBag className="h-5 w-5" />
                </Link>
              </Button>
              )}             
              {/* Notifications */}
              <NotificationBell />

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
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Wifi className="h-3 w-3" />
                          <span>Devnet</span>
                        </div>
                        
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
                {(profile?.role === 'designer' ? designerNavItems : customerNavItems).map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`text-sm font-medium transition-all duration-200 hover:text-primary hover:scale-105 ${
                      location.pathname === item.href
                        ? "text-primary border-l-4 border-primary pl-2"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
                
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
              </nav>
            </motion.div>
          )}
        </div>
      </motion.header>

      {/* User Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Mobile Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <div className="flex justify-around">
          {(profile?.role === 'designer' ? designerNavItems : customerNavItems).map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'text-primary bg-primary/10'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};
