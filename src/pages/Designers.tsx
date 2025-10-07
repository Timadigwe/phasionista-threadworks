import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Star, MapPin, Filter, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useDesigners } from "@/hooks/useDesigners";
import { toast } from "sonner";

interface Designer {
  id: string;
  email: string;
  phasion_name: string;
  full_name?: string;
  bio?: string;
  avatar_url?: string;
  location?: string;
  is_verified: boolean;
  clothesCount: number;
  created_at: string;
}

export const Designers = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All');

  const specialties = ["All", "Evening Wear", "Streetwear", "Bridal", "Business", "Casual"];

  // Use custom hook for data fetching
  const { designers, isLoading, error } = useDesigners();

  const filteredDesigners = designers.filter(designer => {
    // Safe property access with fallbacks
    const name = designer.phasion_name || designer.full_name || 'Unknown';
    const specialty = designer.bio || 'General Fashion';
    
    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         specialty.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSpecialty = selectedSpecialty === 'All' || specialty.includes(selectedSpecialty);
    return matchesSearch && matchesSpecialty;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-20">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
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
              Discover Amazing{" "}
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                Designers
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Connect with talented fashion designers and bring your style vision to life
            </p>
            
            {/* Search Bar */}
            <div className="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search designers, specialties..."
                  className="pl-10 pr-4 py-3 text-lg"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button size="lg" className="px-8">
                <Search className="mr-2 h-4 w-4" />
                Search
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Filters */}
      <section className="py-8 border-b">
        <div className="container-custom">
          <div className="flex flex-wrap items-center gap-4">
            <Button 
              variant={selectedSpecialty === 'All' ? 'default' : 'outline'} 
              className="flex items-center gap-2"
              onClick={() => setSelectedSpecialty('All')}
            >
              <Filter className="h-4 w-4" />
              All Specialties
            </Button>
            {specialties.slice(1).map((specialty) => (
              <Button 
                key={specialty}
                variant={selectedSpecialty === specialty ? 'default' : 'ghost'}
                onClick={() => setSelectedSpecialty(specialty)}
              >
                {specialty}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Designers Grid */}
      <section className="py-16">
        <div className="container-custom">
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading designers...</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredDesigners.map((designer, index) => (
              <motion.div
                key={designer.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={designer.avatar_url} alt={designer.phasion_name || designer.full_name} />
                          <AvatarFallback>{(designer.phasion_name || designer.full_name || 'U').charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{designer.phasion_name || designer.full_name || 'Unknown Designer'}</h3>
                            {designer.is_verified && (
                              <Badge variant="secondary" className="text-xs">
                                Verified
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{designer.bio || 'Fashion Designer'}</p>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">4.5</span>
                      <span className="text-sm text-muted-foreground">
                        (New Designer)
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {designer.location || 'Location not specified'}
                    </div>
                    
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {designer.bio || 'Talented fashion designer creating unique pieces.'}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-primary">{designer.clothesCount || 0} items</span>
                      <Button size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity" asChild>
                        <Link to={`/designer/${designer.id}`}>
                          View Profile
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
            </div>
          )}
          
          {!isLoading && filteredDesigners.length === 0 && (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">👗</div>
              <h3 className="text-xl font-semibold mb-2">No designers found</h3>
              <p className="text-muted-foreground mb-6">
                Try adjusting your search or filter criteria
              </p>
              <Button onClick={() => { setSearchQuery(''); setSelectedSpecialty('All'); }}>
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary/10 to-secondary/10">
        <div className="container-custom text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Are you a designer?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join our community of talented designers and start showcasing your work to customers worldwide.
            </p>
            <Button size="lg" className="btn-hero">
              Become a Designer
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
};
