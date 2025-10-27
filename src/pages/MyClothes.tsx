import { motion } from "framer-motion";
import { Plus, Edit, Trash2, Eye, Package, TrendingUp, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabaseApi } from "@/services/supabaseApi";
import { toast } from "sonner";

export const MyClothes = () => {
  const { user } = useAuth();
  const [clothes, setClothes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadMyClothes = async () => {
      try {
        setIsLoading(true);
        const response = await supabaseApi.getClothes();
        // Filter clothes to show only user's clothes
        const myClothes = response.clothes.filter((cloth: any) => cloth.designer_id === user?.id);
        setClothes(myClothes);
      } catch (error: any) {
        console.error('Error loading my clothes:', error);
        toast.error('Failed to load your clothes');
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      loadMyClothes();
    }
  }, [user]);

  const handleDelete = async (clothId: string) => {
    if (!confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
      return;
    }

    try {
      await supabaseApi.deleteCloth(clothId);
      toast.success('Item deleted successfully!');
      // Reload clothes
      const response = await supabaseApi.getClothes();
      const myClothes = response.clothes.filter((cloth: any) => cloth.designer_id === user?.id);
      setClothes(myClothes);
    } catch (error: any) {
      console.error('Error deleting cloth:', error);
      toast.error(`Failed to delete item: ${error.message}`);
    }
  };
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="bg-gradient-to-r from-primary/10 to-secondary/10 py-12">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
          >
            <div>
              <div className="flex items-center gap-4 mb-4">
                <Button variant="ghost" size="sm" asChild className="hover:bg-muted/50">
                  <Link to="/" className="flex items-center gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Home
                  </Link>
                </Button>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                My Clothes
              </h1>
              <p className="text-xl text-muted-foreground">
                Manage your fashion creations
              </p>
            </div>
            <Button className="btn-hero">
              <Link to="/create" className="flex items-center gap-2">
                <Plus className="h-4 w-4 mr-2" />
                Add New Item
              </Link> 
            </Button>
          </motion.div>
        </div>
      </section>

      <div className="container-custom py-8">
        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          <Card>
            <CardContent className="p-6 text-center">
              <Package className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold">{clothes.length}</p>
              <p className="text-sm text-muted-foreground">Total Items</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">{clothes.filter(item => item.is_available).length}</p>
              <p className="text-sm text-muted-foreground">Available Items</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <Eye className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">{clothes.filter(item => !item.is_available).length}</p>
              <p className="text-sm text-muted-foreground">Unavailable Items</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <TrendingUp className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">${clothes.reduce((sum, item) => sum + (item.price || 0), 0).toFixed(0)}</p>
              <p className="text-sm text-muted-foreground">Total Value</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Clothes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <div className="col-span-full text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Loading your clothes...</p>
            </div>
          ) : clothes.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No clothes yet</h3>
              <p className="text-muted-foreground mb-6">Start by creating your first clothing item</p>
              <Button asChild className="btn-hero">
                <Link to="/create">
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Item
                </Link>
              </Button>
            </div>
          ) : (
            clothes.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="group hover:shadow-lg transition-all duration-300">
                <div className="relative">
                  <img
                    src={item.images?.[0] || "/api/placeholder/300/400"}
                    alt={item.name}
                    className="w-full h-64 object-cover rounded-t-lg"
                  />
                  <Badge 
                    className={`absolute top-2 left-2 ${
                      item.is_available 
                        ? "bg-green-100 text-green-800" 
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {item.is_available ? "Available" : "Unavailable"}
                  </Badge>
                  <Badge className="absolute top-2 right-2">
                    {item.category}
                  </Badge>
                </div>

                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold text-lg">{item.name}</h3>
                      <p className="text-2xl font-bold text-primary">${item.price}</p>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-center text-sm">
                      <div>
                        <p className="font-semibold">{item.category}</p>
                        <p className="text-muted-foreground">Category</p>
                      </div>
                      <div>
                        <p className="font-semibold">{item.size}</p>
                        <p className="text-muted-foreground">Size</p>
                      </div>
                      <div>
                        <p className="font-semibold">{item.color}</p>
                        <p className="text-muted-foreground">Color</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1" asChild>
                        <Link to={`/edit-cloth/${item.id}`}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Link>
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
          )}
        </div>

      </div>
    </div>
  );
};
