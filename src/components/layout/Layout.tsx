import { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";

interface LayoutProps {
  children: ReactNode;
  userRole?: "customer" | "designer" | "admin" | null;
  showHeader?: boolean;
  showFooter?: boolean;
}

export const Layout = ({ 
  children, 
  userRole = null,
  showHeader = true,
  showFooter = true 
}: LayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col">
      {showHeader && <Header userRole={userRole} />}
      <main className="flex-1">
        {children}
      </main>
      {showFooter && <Footer />}
    </div>
  );
};