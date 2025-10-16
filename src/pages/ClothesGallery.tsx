import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Filter, Grid, List, SlidersHorizontal, ArrowLeft, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { useClothes } from "@/hooks/useClothes";
import { useFavorites } from "@/hooks/useFavorites";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ClothCard } from "@/components/ui/ClothCard";
import { Layout } from "@/components/layout/Layout";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import featuredCloth1 from "@/assets/featured-cloth1.jpg";
import featuredCloth2 from "@/assets/featured-cloth2.jpg";

export const ClothesGallery = () => {
  const { user, isAuthenticated } = useAuth();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("featured");
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);

  // Use custom hook for data fetching
  const { clothes: allClothes, isLoading, error } = useClothes();
  const { isFavorited, addToFavorites, removeFromFavorites } = useFavorites();

  // Check if user is a designer
  const isDesigner = user?.user_metadata?.role === 'designer';

  // Debug: Log the raw clothes data
  console.log('Raw clothes data from API:', allClothes);

  // Transform clothes data for display
  const transformedClothes = allClothes.map(cloth => ({
    id: cloth.id,
    styleName: cloth.name,
    price: cloth.price,
    images: cloth.images && cloth.images.length > 0 ? cloth.images : ['/api/placeholder/300/400'],
    ownerName: cloth.designer?.phasion_name || cloth.designer?.full_name || 'Designer',
    ownerAvatar: cloth.designer?.avatar_url || "/api/placeholder/32/32",
    ownerId: cloth.designer_id,
    isAvailable: cloth.is_available,
    rating: 4.5 + Math.random() * 0.5, // Mock rating for now
    reviewCount: Math.floor(Math.random() * 50) + 10,
    clothStyle: cloth.category,
    isFavorited: false,
    category: cloth.category?.toLowerCase() || 'clothing',
    size: cloth.size,
    color: cloth.color,
    measurements: cloth.measurements,
    description: cloth.description,
    designer: cloth.designer
  }));

  // Filter clothes based on search and filters
  const filteredClothes = transformedClothes.filter(cloth => {
    const matchesSearch = searchQuery === '' || 
      cloth.styleName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cloth.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cloth.clothStyle.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategories.length === 0 || 
      selectedCategories.includes(cloth.category);
    
    const matchesSize = selectedSizes.length === 0 || 
      selectedSizes.includes(cloth.size);
    
    const matchesColor = selectedColors.length === 0 || 
      selectedColors.includes(cloth.color?.toLowerCase());
    
    const matchesPrice = cloth.price >= priceRange[0] && cloth.price <= priceRange[1];
    
    return matchesSearch && matchesCategory && matchesSize && matchesColor && matchesPrice;
  });

  const categories = [
    { id: "dresses", label: "Dresses", count: 234 },
    { id: "tops", label: "Tops", count: 156 },
    { id: "pants", label: "Pants", count: 89 },
    { id: "sets", label: "Sets", count: 67 },
    { id: "accessories", label: "Accessories", count: 45 },
  ];

  const sizes = ["XS", "S", "M", "L", "XL", "XXL"];
  const colors = [
    { name: "black", color: "#000000" },
    { name: "white", color: "#FFFFFF" },
    { name: "beige", color: "#F5F5DC" },
    { name: "navy", color: "#000080" },
    { name: "red", color: "#FF0000" },
    { name: "blue", color: "#0000FF" },
  ];

  const handleCategoryChange = (categoryId: string, checked: boolean) => {
    if (checked) {
      setSelectedCategories([...selectedCategories, categoryId]);
    } else {
      setSelectedCategories(selectedCategories.filter(id => id !== categoryId));
    }
  };

  const handleSizeChange = (size: string, checked: boolean) => {
    if (checked) {
      setSelectedSizes([...selectedSizes, size]);
    } else {
      setSelectedSizes(selectedSizes.filter(s => s !== size));
    }
  };

  const handleColorChange = (color: string, checked: boolean) => {
    if (checked) {
      setSelectedColors([...selectedColors, color]);
    } else {
      setSelectedColors(selectedColors.filter(c => c !== color));
    }
  };

  const FilterSidebar = () => (
    <div className="space-y-6">
      {/* Price Range */}
      <div>
        <h3 className="font-semibold mb-4">Price Range</h3>
        <div className="space-y-4">
          <Slider
            value={priceRange}
            onValueChange={setPriceRange}
            max={1000}
            step={10}
            className="w-full"
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>${priceRange[0]}</span>
            <span>${priceRange[1]}</span>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div>
        <h3 className="font-semibold mb-4">Categories</h3>
        <div className="space-y-3">
          {categories.map((category) => (
            <div key={category.id} className="flex items-center space-x-2">
              <Checkbox
                id={category.id}
                checked={selectedCategories.includes(category.id)}
                onCheckedChange={(checked) => handleCategoryChange(category.id, checked as boolean)}
              />
              <label
                htmlFor={category.id}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1 cursor-pointer"
              >
                {category.label}
              </label>
              <Badge variant="secondary" className="text-xs">
                {category.count}
              </Badge>
            </div>
          ))}
        </div>
      </div>

      {/* Sizes */}
      <div>
        <h3 className="font-semibold mb-4">Sizes</h3>
        <div className="grid grid-cols-3 gap-2">
          {sizes.map((size) => (
            <div key={size} className="flex items-center space-x-2">
              <Checkbox
                id={size}
                checked={selectedSizes.includes(size)}
                onCheckedChange={(checked) => handleSizeChange(size, checked as boolean)}
              />
              <label
                htmlFor={size}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                {size}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Colors */}
      <div>
        <h3 className="font-semibold mb-4">Colors</h3>
        <div className="grid grid-cols-3 gap-3">
          {colors.map((color) => (
            <div key={color.name} className="flex items-center space-x-2">
              <Checkbox
                id={color.name}
                checked={selectedColors.includes(color.name)}
                onCheckedChange={(checked) => handleColorChange(color.name, checked as boolean)}
              />
              <label
                htmlFor={color.name}
                className="flex items-center space-x-2 cursor-pointer"
              >
                <div
                  className="w-4 h-4 rounded-full border border-border"
                  style={{ backgroundColor: color.color }}
                />
                <span className="text-sm capitalize">{color.name}</span>
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="container-custom py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" size="sm" asChild className="hover:bg-muted/50">
              <Link to="/dashboard" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Link>
            </Button>
          </div>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-4">Fashion Gallery</h1>
              <p className="text-lg text-muted-foreground">
                Discover unique pieces from talented designers worldwide
              </p>
            </div>
            {isAuthenticated && isDesigner && (
              <Button asChild className="btn-hero">
                <Link to="/create" className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Create New Item
                </Link>
              </Button>
            )}
          </div>
        </motion.div>

        {/* Search and Controls */}
        <div className="flex flex-col lg:flex-row gap-4 mb-8">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search clothes, designers, styles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Sort */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="featured">Featured</SelectItem>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
              <SelectItem value="rating">Rating</SelectItem>
              <SelectItem value="popular">Most Popular</SelectItem>
            </SelectContent>
          </Select>

          {/* View Mode */}
          <div className="flex border rounded-lg p-1">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="px-3"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="px-3"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          {/* Mobile Filter */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="lg:hidden">
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
                <SheetDescription>
                  Refine your search with filters
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6">
                <FilterSidebar />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <div className="flex gap-8">
          {/* Desktop Sidebar */}
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="hidden lg:block w-80 shrink-0"
          >
            <Card className="card-fashion p-6 sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">Filters</h2>
                <Button variant="ghost" size="sm">Clear All</Button>
              </div>
              <FilterSidebar />
            </Card>
          </motion.aside>

          {/* Main Content */}
          <motion.main
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1"
          >
            {/* Results Header */}
            <div className="flex justify-between items-center mb-6">
              <p className="text-muted-foreground">
                {isLoading ? "Loading..." : `Showing ${filteredClothes.length} results`}
              </p>
              <div className="flex gap-2">
                {selectedCategories.map((categoryId) => {
                  const category = categories.find(c => c.id === categoryId);
                  return (
                    <Badge key={categoryId} variant="secondary" className="cursor-pointer">
                      {category?.label}
                      <button
                        onClick={() => handleCategoryChange(categoryId, false)}
                        className="ml-1 hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  );
                })}
              </div>
            </div>

            {/* Clothes Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, index) => (
                  <div key={index} className="animate-pulse">
                    <div className="bg-muted rounded-lg h-64 mb-4"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-4 bg-muted rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : allClothes.length > 0 ? (
              <div className={
                viewMode === "grid"
                  ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6"
                  : "space-y-6"
              }>
                {filteredClothes.map((cloth, index) => (
                  <motion.div
                    key={cloth.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <ClothCard 
                      {...cloth}
                      isFavorited={isFavorited(cloth.id)}
                      onFavorite={async (clothId) => {
                        try {
                          if (isFavorited(clothId)) {
                            await removeFromFavorites(clothId);
                            toast.success('Removed from favorites');
                          } else {
                            await addToFavorites(clothId);
                            toast.success('Added to favorites');
                          }
                        } catch (error: any) {
                          if (error.message.includes('already in your favorites')) {
                            toast.info('This item is already in your favorites');
                          } else {
                            toast.error(`Failed to ${isFavorited(clothId) ? 'remove from' : 'add to'} favorites: ${error.message}`);
                          }
                        }
                      }}
                      className={viewMode === "list" ? "flex" : ""}
                    />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">No clothes found</p>
                <p className="text-muted-foreground">Try adjusting your filters or search terms</p>
              </div>
            )}

            {/* Load More */}
            <div className="text-center mt-12">
              <Button size="lg" variant="outline">
                Load More
              </Button>
            </div>
          </motion.main>
          
            {/* Empty State */}
            {!isLoading && filteredClothes.length === 0 && (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">👗</div>
                <h3 className="text-xl font-semibold mb-2">No clothes found</h3>
                <p className="text-muted-foreground mb-6">
                  {isAuthenticated && isDesigner 
                    ? "Be the first to create an item!" 
                    : "Try adjusting your search or filter criteria"
                  }
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  {isAuthenticated && isDesigner && (
                    <Button asChild className="btn-hero">
                      <Link to="/create" className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Create First Item
                      </Link>
                    </Button>
                  )}
                  <Button variant="outline" onClick={() => {
                    setSearchQuery('');
                    setSelectedCategories([]);
                    setSelectedSizes([]);
                    setSelectedColors([]);
                    setPriceRange([0, 1000]);
                  }}>
                    Clear Filters
                  </Button>
                </div>
              </div>
            )}
        </div>
      </div>
      
      {/* Floating Action Button for Mobile */}
      {isAuthenticated && isDesigner && (
        <div className="fixed bottom-6 right-6 z-50 md:hidden">
          <Button asChild size="lg" className="rounded-full shadow-lg btn-hero">
            <Link to="/create" className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              <span className="hidden sm:inline">Create</span>
            </Link>
          </Button>
        </div>
      )}
    </>
  );
};