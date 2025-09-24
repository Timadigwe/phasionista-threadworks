import { motion } from "framer-motion";
import { 
  User, 
  Search, 
  Heart, 
  CreditCard, 
  Truck, 
  Star,
  Shield,
  Clock,
  CheckCircle,
  ArrowLeft
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const steps = [
  {
    icon: User,
    title: "Create Account",
    description: "Sign up with your Solana wallet and verify your email to get started.",
    details: ["Connect your Solana wallet", "Verify your email address", "Complete your profile"]
  },
  {
    icon: Search,
    title: "Browse & Discover",
    description: "Explore our curated collection of clothes from verified designers worldwide.",
    details: ["Browse by category", "Filter by size, color, style", "Read designer profiles"]
  },
  {
    icon: Heart,
    title: "Choose & Customize",
    description: "Select your favorite pieces and work with designers for custom modifications.",
    details: ["Add to favorites", "Request customizations", "Chat with designers"]
  },
  {
    icon: CreditCard,
    title: "Secure Payment",
    description: "Pay securely using Solana blockchain with our escrow system.",
    details: ["Solana wallet integration", "Escrow protection", "Instant transactions"]
  },
  {
    icon: Truck,
    title: "Delivery & Tracking",
    description: "Track your order from creation to delivery with real-time updates.",
    details: ["Real-time tracking", "Delivery notifications", "Quality assurance"]
  },
  {
    icon: Star,
    title: "Review & Rate",
    description: "Share your experience and help other customers make informed decisions.",
    details: ["Rate your experience", "Write detailed reviews", "Help the community"]
  }
];

const features = [
  {
    icon: Shield,
    title: "Secure Escrow System",
    description: "Your payment is held safely until you receive and approve your order."
  },
  {
    icon: Clock,
    title: "Fast Processing",
    description: "Most orders are processed and shipped within 3-5 business days."
  },
  {
    icon: CheckCircle,
    title: "Quality Guarantee",
    description: "We ensure all items meet our quality standards before delivery."
  }
];

export const HowItWorks = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-20">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="flex justify-center mb-6">
              <Button variant="ghost" size="sm" asChild className="hover:bg-muted/50">
                <Link to="/" className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Home
                </Link>
              </Button>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              How{" "}
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                Phasionistar
              </span>{" "}
              Works
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              From discovery to delivery, we make fashion accessible and secure for everyone
            </p>
          </motion.div>
        </div>
      </section>

      {/* Steps Section */}
      <section className="py-20">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full group hover:shadow-lg transition-all duration-300">
                  <CardHeader className="text-center pb-4">
                    <div className="mx-auto mb-4 p-4 rounded-full bg-primary/10 w-fit">
                      <step.icon className="h-8 w-8 text-primary" />
                    </div>
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Badge variant="outline" className="text-sm">
                        Step {index + 1}
                      </Badge>
                    </div>
                    <h3 className="text-xl font-semibold">{step.title}</h3>
                  </CardHeader>
                  
                  <CardContent className="text-center space-y-4">
                    <p className="text-muted-foreground">{step.description}</p>
                    
                    <ul className="text-sm text-muted-foreground space-y-2">
                      {step.details.map((detail, detailIndex) => (
                        <li key={detailIndex} className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/50">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Why Choose Phasionistar?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              We combine cutting-edge blockchain technology with exceptional customer service
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="mx-auto mb-6 p-4 rounded-full bg-primary/10 w-fit">
                  <feature.icon className="h-12 w-12 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-4">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join thousands of satisfied customers who have discovered their perfect style with Phasionistar
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="btn-hero">
                Start Shopping
              </Button>
              <Button size="lg" variant="outline">
                Learn More
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};
