import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Instagram, Twitter, Facebook, Mail, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import phasionisterLogo from "@/assets/phasionistar-logo.png";

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    platform: [
      { href: "/clothes", label: "Browse Clothes" },
      { href: "/designers", label: "Find Designers" },
      { href: "/how-it-works", label: "How It Works" },
      { href: "/pricing", label: "Pricing" },
    ],
    support: [
      { href: "/help", label: "Help Center" },
      { href: "/contact", label: "Contact Us" },
      { href: "/faq", label: "FAQ" },
      { href: "/shipping", label: "Shipping Info" },
    ],
    company: [
      { href: "/about", label: "About Us" },
      { href: "/careers", label: "Careers" },
      { href: "/press", label: "Press" },
      { href: "/blog", label: "Blog" },
    ],
    legal: [
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/terms", label: "Terms of Service" },
      { href: "/cookies", label: "Cookie Policy" },
      { href: "/returns", label: "Returns Policy" },
    ],
  };

  const socialLinks = [
    { href: "https://instagram.com", icon: Instagram, label: "Instagram" },
    { href: "https://twitter.com", icon: Twitter, label: "Twitter" },
    { href: "https://facebook.com", icon: Facebook, label: "Facebook" },
  ];

  return (
    <footer className="bg-secondary text-secondary-foreground">
      {/* Newsletter Section */}
      <div className="border-b border-secondary-light">
        <div className="container-custom py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto text-center"
          >
            <h3 className="text-2xl font-bold mb-4">Stay in the Loop</h3>
            <p className="text-secondary-foreground/80 mb-6">
              Get the latest fashion trends, designer spotlights, and exclusive offers delivered to your inbox.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <Input
                type="email"
                placeholder="Enter your email"
                className="flex-1 bg-background text-foreground"
              />
              <Button className="btn-hero">
                Subscribe
              </Button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center space-x-2 mb-4">
              <img src={phasionisterLogo} alt="Phasionistar" className="h-10 w-10" />
              <span className="font-bold text-xl">Phasionistar</span>
            </Link>
            <p className="text-secondary-foreground/80 mb-6 max-w-md">
              Connecting fashion designers with customers worldwide. Discover unique pieces, 
              support independent creators, and express your style.
            </p>
            
            {/* Contact Info */}
            <div className="space-y-2 text-sm text-secondary-foreground/80">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                <span>123 Fashion Street, Style City, SC 12345</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4" />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4" />
                <span>hello@phasionistar.com</span>
              </div>
            </div>
          </div>

          {/* Platform Links */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Platform</h4>
            <ul className="space-y-2">
              {footerLinks.platform.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-secondary-foreground/80 hover:text-secondary-foreground transition-colors fashion-link"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Support</h4>
            <ul className="space-y-2">
              {footerLinks.support.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-secondary-foreground/80 hover:text-secondary-foreground transition-colors fashion-link"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Company</h4>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-secondary-foreground/80 hover:text-secondary-foreground transition-colors fashion-link"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Legal</h4>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-secondary-foreground/80 hover:text-secondary-foreground transition-colors fashion-link"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-secondary-light">
        <div className="container-custom py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-sm text-secondary-foreground/80">
              © {currentYear} Phasionistar. All rights reserved.
            </p>
            
            {/* Social Links */}
            <div className="flex items-center space-x-4">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.href}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-secondary-foreground/80 hover:text-secondary-foreground transition-colors hover-scale"
                    aria-label={social.label}
                  >
                    <Icon className="h-5 w-5" />
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};