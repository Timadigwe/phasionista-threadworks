import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Heart, ShoppingBag, Eye, Trash2, Filter, Search, ArrowLeft, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabaseApi } from "@/services/supabaseApi";
import { toast } from "sonner";

interface FavoriteItem {
  id: string;
  created_at: string;
  cloth: {
    id: string;
    name: string;
    description: string;
    price: number;
    category: string;
    size: string;
    color: string;
    images: string[];
    is_available: boolean;
    designer: {
      id: string;
      phasion_name: string;
      full_name?: string;
      avatar_url?: string;
    };
  };
}

const categories = ["All", "Evening Wear", "Business", "Casual", "Streetwear"];

export const Favorites = () => {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        setIsLoading(true);
        const { favorites: data } = await supabaseApi.getFavorites();
        setFavorites(data);
      } catch (error: any) {
        console.error('Error fetching favorites:', error);
        toast.error('Failed to load favorites');
      } finally {
        setIsLoading(false);
      }
    };

    fetchFavorites();
  }, []);

  const handleRemoveFavorite = async (clothId: string) => {
    try {
      await supabaseApi.removeFromFavorites(clothId);
      setFavorites(favorites.filter(fav => fav.cloth.id !== clothId));
      toast.success('Removed from favorites');
    } catch (error: any) {
      console.error('Error removing favorite:', error);
      toast.error('Failed to remove from favorites');
    }
  };

  const filteredFavorites = favorites.filter(favorite => {
    const cloth = favorite.cloth;
    const matchesSearch = cloth.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         cloth.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         cloth.designer.phasion_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || cloth.category === selectedCategory;
    return matchesSearch && matchesCategory && cloth.is_available;
  });
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="bg-gradient-to-r from-primary/10 to-secondary/10 py-12">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="flex justify-center mb-6">
              <Button variant="ghost" size="sm" asChild className="hover:bg-muted/50">
                <Link to="/" className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Home
                </Link>
              </Button>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              My Favorites
            </h1>
            <p className="text-xl text-muted-foreground">
              Your saved items from amazing designers
            </p>
          </motion.div>
        </div>
      </section>

      <div className="container-custom py-8">
        {/* Filters and Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search favorites..."
                className="pl-10 pr-4"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Category Filters */}
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={category === selectedCategory ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </Button>
              ))}
            </div>

            {/* Sort and Filter */}
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading favorites...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Favorites Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredFavorites.map((favorite, index) => (
                <motion.div
                  key={favorite.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="group hover:shadow-lg transition-all duration-300">
                    <div className="relative">
                      {favorite.cloth.images && favorite.cloth.images.length > 0 ? (
                        <img
                          src={favorite.cloth.images[0]}
                          alt={favorite.cloth.name}
                          className="w-full h-64 object-cover rounded-t-lg"
                        />
                      ) : (
                        <div className="w-full h-64 bg-muted rounded-t-lg flex items-center justify-center">
                          <div className="text-center text-muted-foreground">
                            <div className="text-4xl mb-2">👗</div>
                            <p className="text-sm">No image</p>
                          </div>
                        </div>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleRemoveFavorite(favorite.cloth.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Badge className="absolute top-2 left-2">
                        {favorite.cloth.category}
                      </Badge>
                    </div>

                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div>
                          <h3 className="font-semibold text-lg line-clamp-1">
                            {favorite.cloth.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={favorite.cloth.designer.avatar_url} />
                              <AvatarFallback>
                                {favorite.cloth.designer.phasion_name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-muted-foreground">
                              {favorite.cloth.designer.phasion_name}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < 4
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-muted-foreground ml-1">
                            (New Item)
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>Size: {favorite.cloth.size}</span>
                          <span>Color: {favorite.cloth.color}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-2xl font-bold">${favorite.cloth.price}</span>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" asChild>
                              <Link to={`/designer/${favorite.cloth.designer.id}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button size="sm" className="btn-hero" asChild>
                              <Link to={`/order/${favorite.cloth.id}`}>
                                <ShoppingBag className="h-4 w-4 mr-2" />
                                Order
                              </Link>
                            </Button>
                          </div>
                        </div>

                        <div className="text-xs text-muted-foreground">
                          Added on {new Date(favorite.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </>
        )}

        {/* Empty State */}
        {!isLoading && filteredFavorites.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              {favorites.length === 0 ? 'No favorites yet' : 'No items match your filters'}
            </h3>
            <p className="text-muted-foreground mb-6">
              {favorites.length === 0 
                ? 'Start exploring and add items you love to your favorites'
                : 'Try adjusting your search or filter criteria'
              }
            </p>
            <div className="flex gap-3 justify-center">
              {favorites.length === 0 ? (
                <Button className="btn-hero" asChild>
                  <Link to="/clothes">Browse Clothes</Link>
                </Button>
              ) : (
                <Button onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}>
                  Clear Filters
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};
