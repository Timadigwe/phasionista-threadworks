import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Palette, Users, Zap, Star, TrendingUp, Shield, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FashionCarousel } from "@/components/ui/FashionCarousel";
// Removed ClothCard, useClothes, useDesigners imports since we removed featured clothes section
import { toast } from "sonner";
import heroBanner from "@/assets/hero-banner.jpg";
import featuredDesign1 from "@/assets/featured-design1.jpg";

export const Home = () => {
  // Newsletter state
  const [email, setEmail] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);

  const carouselItems = [
    {
      id: "1",
      title: "Discover Unique Fashion",
      subtitle: "Connect with talented designers and find one-of-a-kind pieces",
      image: heroBanner,
      link: "/signup"
    },
    {
      id: "2", 
      title: "Designer Spotlight",
      subtitle: "Featured creators pushing fashion boundaries",
      image: featuredDesign1,
      link: "/signup"
    }
  ];

  // Removed featuredClothes transformation since we removed the featured clothes section

  const howItWorksSteps = [
    {
      icon: Users,
      title: "Browse & Discover",
      description: "Explore unique designs from talented creators worldwide"
    },
    {
      icon: Palette,
      title: "Connect & Customize",
      description: "Work directly with designers to perfect your vision"
    },
    {
      icon: Zap,
      title: "Secure Payment",
      description: "Safe transactions with our escrow system and Solana integration"
    }
  ];

  const testimonials = [
    {
      id: "1",
      name: "Sarah Johnson",
      role: "Fashion Enthusiast",
      content: "I found the most amazing custom dress here. The designer was incredible to work with!",
      rating: 5,
      avatar: "/api/placeholder/64/64"
    },
    {
      id: "2", 
      name: "Marcus Chen",
      role: "Independent Designer",
      content: "Phasionistar helped me reach customers I never could have found on my own.",
      rating: 5,
      avatar: "/api/placeholder/64/64"
    },
    {
      id: "3",
      name: "Emma Rodriguez", 
      role: "Style Influencer",
      content: "The quality and uniqueness of pieces here is unmatched. Highly recommend!",
      rating: 5,
      avatar: "/api/placeholder/64/64"
    }
  ];

  const stats = [
    { label: "Active Designers", value: "2,500+", icon: Users },
    { label: "Happy Customers", value: "15,000+", icon: Star },
    { label: "Unique Pieces", value: "50,000+", icon: Palette },
    { label: "Growth Rate", value: "300%", icon: TrendingUp }
  ];

  const handleNewsletterSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }
    
    setIsSubscribing(true);
    try {
      // Simulate API call - replace with actual newsletter subscription
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Successfully subscribed to our newsletter!');
      setEmail('');
    } catch (error) {
      toast.error('Failed to subscribe. Please try again.');
    } finally {
      setIsSubscribing(false);
    }
  };

  return (
    <>
      {/* Hero Section with Carousel */}
      <section className="relative">
        <FashionCarousel 
          items={carouselItems}
          className="h-screen max-h-[800px]"
        />
        
        {/* Floating CTA - Right Side */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1, duration: 0.6 }}
          className="absolute bottom-8  md:right-8 z-10 max-w-xs"
        >
          {/* Subtle background for better visibility */}
          <div className="absolute inset-0 bg-black/10 backdrop-blur-sm rounded-2xl -z-10"></div>
          <div className="flex flex-col gap-3 md:gap-4 p-4">
            <Button 
              size="lg" 
              className="btn-hero shadow-xl hover:shadow-2xl transition-all duration-300 text-sm md:text-base px-6 py-3"
              asChild
            >
              <a href="/signup">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5" />
              </a>
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="shadow-xl hover:shadow-2xl backdrop-blur-sm bg-white/10 border-white/30 text-white hover:bg-white/20 hover:border-white/40 transition-all duration-300 text-sm md:text-base px-6 py-3"
              asChild
            >
              <a href="/signup">
                Join as Designer
              </a>
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-muted/30">
        <div className="container-custom">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mb-4">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-3xl font-bold text-primary mb-2">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>


      {/* How It Works Section */}
      <section className="section-padding bg-muted/30">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge variant="secondary" className="mb-4">Process</Badge>
            <h2 className="text-section-title mb-4">How Phasionistar Works</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Simple steps to connect with designers and get your perfect piece
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {howItWorksSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.2 }}
                  className="text-center relative"
                >
                  {/* Step Number */}
                  <div className="absolute -top-4 -left-4 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>
                  
                  <Card className="card-fashion p-8 h-full">
                    <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-6">
                      <Icon className="h-8 w-8 text-primary-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold mb-4">{step.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="section-padding">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge variant="secondary" className="mb-4">Testimonials</Badge>
            <h2 className="text-section-title mb-4">What Our Community Says</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Hear from designers and customers who love Phasionistar
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="card-fashion p-6 h-full">
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                    ))}
                  </div>
                  <blockquote className="text-lg mb-6 leading-relaxed">
                    "{testimonial.content}"
                  </blockquote>
                  <div className="flex items-center">
                    <img
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      className="w-12 h-12 rounded-full mr-4"
                    />
                    <div>
                      <div className="font-semibold">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="section-padding bg-muted/30">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-6">
              <Mail className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Stay in the Loop</h2>
            <p className="text-xl text-muted-foreground mb-8">
              Get the latest fashion trends, designer spotlights, and exclusive offers delivered to your inbox.
            </p>
            
            <form onSubmit={handleNewsletterSubscribe} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1"
                required
              />
              <Button 
                type="submit" 
                disabled={isSubscribing}
                className="btn-hero whitespace-nowrap"
              >
                {isSubscribing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Subscribing...
                  </>
                ) : (
                  'Subscribe'
                )}
              </Button>
            </form>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding bg-gradient-hero text-white">
        <div className="container-custom text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-full mb-6">
              <Shield className="h-8 w-8" />
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Transform Your Style?
            </h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
              Join thousands of fashion lovers discovering unique pieces from talented designers worldwide.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-white text-primary hover:bg-white/90 shadow-lg" asChild>
                <a href="/signup">
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </a>
              </Button>
              <Button size="lg"  className="border-white text-white hover:bg-white hover:text-primary shadow-lg" asChild>
                <a href="/signup">Join as Designer</a>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
};