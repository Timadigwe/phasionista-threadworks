import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Menu, X, Search, Heart, ShoppingBag, User, Bell } from "lucide-react";
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
import phasionisterLogo from "@/assets/phasionistar-logo.png";

interface HeaderProps {
  userRole?: "customer" | "designer" | "admin" | null;
}

export const Header = ({ userRole = null }: HeaderProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/clothes", label: "Clothes" },
    { href: "/designers", label: "Designers" },
    { href: "/how-it-works", label: "How It Works" },
  ];

  const userNavLinks = {
    customer: [
      { href: "/dashboard", label: "Dashboard" },
      { href: "/orders", label: "My Orders" },
      { href: "/favorites", label: "Favorites" },
    ],
    designer: [
      { href: "/dashboard", label: "Dashboard" },
      { href: "/my-clothes", label: "My Clothes" },
      { href: "/create", label: "Create" },
      { href: "/orders", label: "Orders" },
    ],
    admin: [
      { href: "/admin", label: "Admin Panel" },
      { href: "/users", label: "Users" },
      { href: "/transactions", label: "Transactions" },
    ],
  };

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
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive(link.href)
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
            
            {userRole && userNavLinks[userRole]?.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive(link.href)
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Search Bar - Desktop */}
          <div className="hidden lg:flex items-center space-x-4 flex-1 max-w-md ml-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search clothes, designers..."
                className="pl-10 pr-4 py-2 w-full"
              />
            </div>
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

            {userRole ? (
              // Authenticated User Actions
              <>
                <Button variant="ghost" size="sm" className="relative">
                  <Heart className="h-5 w-5" />
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
                    3
                  </Badge>
                </Button>
                
                <Button variant="ghost" size="sm" className="relative">
                  <ShoppingBag className="h-5 w-5" />
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
                    2
                  </Badge>
                </Button>
                
                <Button variant="ghost" size="sm" className="relative">
                  <Bell className="h-5 w-5" />
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs bg-destructive">
                    5
                  </Badge>
                </Button>

                {/* User Profile Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="/avatars/01.png" alt="@username" />
                        <AvatarFallback>JD</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuItem>
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      Sign out
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
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search clothes, designers..."
                className="pl-10 pr-4 py-2 w-full"
              />
            </div>
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
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    isActive(link.href)
                      ? "text-primary"
                      : "text-muted-foreground"
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              
              {userRole && userNavLinks[userRole]?.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    isActive(link.href)
                      ? "text-primary"
                      : "text-muted-foreground"
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              
              {!userRole && (
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
              )}
            </nav>
          </motion.div>
        )}
      </div>
    </motion.header>
  );
};