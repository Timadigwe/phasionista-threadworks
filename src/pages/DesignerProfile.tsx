import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  Star, 
  MapPin, 
  Mail, 
  Globe, 
  Heart, 
  ShoppingBag,
  Calendar,
  Award,
  Users,
  Instagram,
  Twitter,
  Facebook
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { supabaseApi } from "@/services/supabaseApi";
import { toast } from "sonner";

interface Designer {
  id: string;
  email: string;
  phasion_name: string;
  full_name?: string;
  bio?: string;
  avatar_url?: string;
  location?: string;
  website?: string;
  social_links?: Record<string, string>;
  is_verified: boolean;
  created_at: string;
  clothes: Array<{
    id: string;
    name: string;
    description: string;
    price: number;
    category: string;
    size: string;
    color: string;
    images: string[];
    is_available: boolean;
    created_at: string;
  }>;
}

export const DesignerProfile = () => {
  const { id } = useParams<{ id: string }>();
  const [designer, setDesigner] = useState<Designer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDesigner = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        const data = await supabaseApi.getDesignerById(id);
        setDesigner(data);
      } catch (err: any) {
        console.error('Error fetching designer:', err);
        setError(err.message || 'Failed to load designer profile');
        toast.error('Failed to load designer profile');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDesigner();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container-custom py-8">
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading designer profile...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !designer) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container-custom py-8">
          <div className="text-center py-20">
            <div className="text-6xl mb-4">👗</div>
            <h3 className="text-xl font-semibold mb-2">Designer not found</h3>
            <p className="text-muted-foreground mb-6">
              The designer you're looking for doesn't exist or has been removed.
            </p>
            <Button asChild>
              <Link to="/designers">Back to Designers</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const availableClothes = designer.clothes.filter(cloth => cloth.is_available);
  const totalValue = availableClothes.reduce((sum, cloth) => sum + cloth.price, 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-8">
        <div className="container-custom">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/designers" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Designers
              </Link>
            </Button>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col lg:flex-row gap-8 items-start"
          >
            {/* Designer Info */}
            <div className="flex-1">
              <div className="flex items-start gap-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={designer.avatar_url} alt={designer.phasion_name} />
                  <AvatarFallback className="text-2xl">
                    {(designer.phasion_name || designer.full_name || 'D').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold">{designer.phasion_name || designer.full_name}</h1>
                    {designer.is_verified && (
                      <Badge variant="secondary" className="text-sm">
                        <Award className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-lg text-muted-foreground mb-4">
                    {designer.bio || 'Talented fashion designer creating unique pieces.'}
                  </p>
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    {designer.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {designer.location}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Joined {new Date(designer.created_at).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {availableClothes.length} items available
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button variant="outline" size="lg">
                <Heart className="h-4 w-4 mr-2" />
                Follow
              </Button>
              <Button size="lg">
                <ShoppingBag className="h-4 w-4 mr-2" />
                View Collection
              </Button>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="container-custom py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Designer Details */}
          <div className="lg:col-span-1 space-y-6">
            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Contact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="break-all">{designer.email}</span>
                </div>
                {designer.website && (
                  <div className="flex items-center gap-2 text-sm">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <a 
                      href={designer.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline break-all"
                    >
                      {designer.website}
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Social Links */}
            {designer.social_links && Object.keys(designer.social_links).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Social Media</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-3">
                    {designer.social_links.instagram && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={designer.social_links.instagram} target="_blank" rel="noopener noreferrer">
                          <Instagram className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    {designer.social_links.twitter && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={designer.social_links.twitter} target="_blank" rel="noopener noreferrer">
                          <Twitter className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    {designer.social_links.facebook && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={designer.social_links.facebook} target="_blank" rel="noopener noreferrer">
                          <Facebook className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Collection Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Items</span>
                  <span className="font-semibold">{designer.clothes.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Available</span>
                  <span className="font-semibold text-green-600">{availableClothes.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Collection Value</span>
                  <span className="font-semibold">${totalValue.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Average Price</span>
                  <span className="font-semibold">
                    ${availableClothes.length > 0 ? (totalValue / availableClothes.length).toFixed(2) : '0.00'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Designer's Clothes */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Designer's Collection</h2>
              <Badge variant="outline">{availableClothes.length} items</Badge>
            </div>

            {availableClothes.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <div className="text-6xl mb-4">👗</div>
                  <h3 className="text-lg font-semibold mb-2">No items available</h3>
                  <p className="text-muted-foreground">
                    This designer hasn't added any clothes to their collection yet.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {availableClothes.map((cloth, index) => (
                  <motion.div
                    key={cloth.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer">
                      <CardHeader className="pb-3">
                        <div className="aspect-square bg-muted rounded-lg mb-3 overflow-hidden">
                          {cloth.images && cloth.images.length > 0 ? (
                            <img 
                              src={cloth.images[0]} 
                              alt={cloth.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                              <div className="text-center">
                                <div className="text-4xl mb-2">👗</div>
                                <p className="text-sm">No image</p>
                              </div>
                            </div>
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg mb-1">{cloth.name}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">{cloth.description}</p>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-2xl font-bold text-primary">${cloth.price}</span>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm">4.5</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Badge variant="outline">{cloth.category}</Badge>
                          <Badge variant="outline">{cloth.size}</Badge>
                          <Badge variant="outline">{cloth.color}</Badge>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button size="sm" className="flex-1">
                            <Heart className="h-4 w-4 mr-2" />
                            Favorite
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1">
                            <ShoppingBag className="h-4 w-4 mr-2" />
                            Order
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
