import { motion } from "framer-motion";
import { Heart, ShoppingBag, Eye, Trash2, Filter, Search, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const favorites = [
  {
    id: 1,
    name: "Elegant Evening Dress",
    designer: "Sarah Johnson",
    price: "$450",
    image: "/api/placeholder/300/400",
    category: "Evening Wear",
    size: "M",
    color: "Black",
    rating: 4.9,
    reviews: 128,
    addedDate: "2024-01-15"
  },
  {
    id: 2,
    name: "Custom Suit",
    designer: "Michael Chen",
    price: "$680",
    image: "/api/placeholder/300/400",
    category: "Business",
    size: "L",
    color: "Navy",
    rating: 4.8,
    reviews: 95,
    addedDate: "2024-01-20"
  },
  {
    id: 3,
    name: "Summer Blouse",
    designer: "Emma Rodriguez",
    price: "$120",
    image: "/api/placeholder/300/400",
    category: "Casual",
    size: "S",
    color: "White",
    rating: 4.7,
    reviews: 67,
    addedDate: "2024-01-22"
  },
  {
    id: 4,
    name: "Designer Jeans",
    designer: "David Kim",
    price: "$200",
    image: "/api/placeholder/300/400",
    category: "Casual",
    size: "M",
    color: "Blue",
    rating: 4.6,
    reviews: 89,
    addedDate: "2024-01-25"
  }
];

const categories = ["All", "Evening Wear", "Business", "Casual", "Streetwear"];

export const Favorites = () => {
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
              />
            </div>

            {/* Category Filters */}
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={category === "All" ? "default" : "outline"}
                  size="sm"
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

        {/* Favorites Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {favorites.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="group hover:shadow-lg transition-all duration-300">
                <div className="relative">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-64 object-cover rounded-t-lg"
                  />
                  <Button
                    size="sm"
                    variant="destructive"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Badge className="absolute top-2 left-2">
                    {item.category}
                  </Badge>
                </div>

                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold text-lg line-clamp-1">
                        {item.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src="/api/placeholder/24/24" />
                          <AvatarFallback>{item.designer.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-muted-foreground">
                          {item.designer}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Heart
                            key={i}
                            className={`h-4 w-4 ${
                              i < Math.floor(item.rating)
                                ? "fill-red-500 text-red-500"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-muted-foreground ml-1">
                        ({item.reviews})
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Size: {item.size}</span>
                      <span>Color: {item.color}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold">{item.price}</span>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" className="btn-hero">
                          <ShoppingBag className="h-4 w-4 mr-2" />
                          Add to Cart
                        </Button>
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground">
                      Added on {item.addedDate}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {favorites.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No favorites yet</h3>
            <p className="text-muted-foreground mb-6">
              Start exploring and add items you love to your favorites
            </p>
            <Button className="btn-hero">
              Browse Clothes
            </Button>
          </motion.div>
        )}

        {/* Load More */}
        {favorites.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mt-12"
          >
            <Button variant="outline" size="lg">
              Load More Favorites
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
};
