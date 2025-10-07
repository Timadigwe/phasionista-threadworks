import { useState } from "react";
import { motion } from "framer-motion";
import { Heart, ShoppingBag, Star, Eye, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabaseApi } from "@/services/supabaseApi";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface ClothCardProps {
  id: string;
  styleName: string;
  price: number;
  images: string[];
  ownerName: string;
  ownerAvatar?: string;
  isAvailable: boolean;
  isFavorited?: boolean;
  rating?: number;
  reviewCount?: number;
  clothStyle: string;
  ownerId?: string;
  onFavorite?: (id: string) => void;
  onAddToCart?: (id: string) => void;
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  className?: string;
}

export const ClothCard = ({
  id,
  styleName,
  price,
  images,
  ownerName,
  ownerAvatar,
  isAvailable,
  isFavorited = false,
  rating = 0,
  reviewCount = 0,
  clothStyle,
  ownerId,
  onFavorite,
  onAddToCart,
  onView,
  onEdit,
  onDelete,
  className = "",
}: ClothCardProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isOwner = user?.id === ownerId;
  const [isFavoriting, setIsFavoriting] = useState(false);

  const handleFavorite = async () => {
    if (!user) {
      toast.error('Please log in to add favorites');
      return;
    }

    try {
      setIsFavoriting(true);
      if (isFavorited) {
        await supabaseApi.removeFromFavorites(id);
        toast.success('Removed from favorites');
      } else {
        await supabaseApi.addToFavorites(id);
        toast.success('Added to favorites');
      }
      onFavorite?.(id);
    } catch (error: any) {
      console.error('Error handling favorite:', error);
      toast.error(`Failed to ${isFavorited ? 'remove from' : 'add to'} favorites: ${error.message}`);
    } finally {
      setIsFavoriting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
      return;
    }

    try {
      await supabaseApi.deleteCloth(id);
      toast.success('Item deleted successfully!');
      onDelete?.(id);
    } catch (error: any) {
      console.error('Error deleting cloth:', error);
      toast.error(`Failed to delete item: ${error.message}`);
    }
  };

  const handleEdit = () => {
    navigate(`/edit-cloth/${id}`);
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      className={className}
    >
      <Card className="card-fashion overflow-hidden group">
        {/* Image Container */}
        <div className="relative aspect-[3/4] overflow-hidden">
          <img
            src={images[0] || "/api/placeholder/300/400"}
            alt={styleName}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          
          {/* Overlay Actions */}
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="absolute top-4 right-4 flex flex-col space-y-2">
              {!isOwner && (
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-8 w-8 p-0 rounded-full shadow-medium"
                  onClick={handleFavorite}
                  disabled={isFavoriting}
                >
                  <Heart 
                    className={`h-4 w-4 ${isFavorited ? 'fill-destructive text-destructive' : ''}`}
                  />
                </Button>
              )}
              <Button
                size="sm"
                variant="secondary"
                className="h-8 w-8 p-0 rounded-full shadow-medium"
                onClick={() => onView?.(id)}
              >
                <Eye className="h-4 w-4" />
              </Button>
              {isOwner && (
                <>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-8 w-8 p-0 rounded-full shadow-medium"
                    onClick={handleEdit}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="h-8 w-8 p-0 rounded-full shadow-medium"
                    onClick={handleDelete}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Status Badges */}
          <div className="absolute top-4 left-4 flex flex-col space-y-2">
            {!isAvailable && (
              <Badge variant="destructive" className="text-xs">
                Sold Out
              </Badge>
            )}
            <Badge variant="secondary" className="text-xs bg-black/50 text-white">
              {clothStyle}
            </Badge>
          </div>

          {/* Quick Actions Bar */}
          <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Button
              size="sm"
              className="w-full btn-hero"
              disabled={!isAvailable}
              onClick={() => navigate(`/order/${id}`)}
            >
              <ShoppingBag className="h-4 w-4 mr-2" />
              {isAvailable ? 'Order Now' : 'Unavailable'}
            </Button>
          </div>
        </div>

        <CardContent className="p-4">
          {/* Designer Info */}
          <div className="flex items-center space-x-2 mb-3">
            <Avatar className="h-6 w-6">
              <AvatarImage src={ownerAvatar} />
              <AvatarFallback className="text-xs">{ownerName.charAt(0)}</AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground font-medium">
              {ownerName}
            </span>
          </div>

          {/* Product Info */}
          <h3 
            className="font-semibold text-lg mb-2 line-clamp-2 cursor-pointer hover:text-primary transition-colors"
            onClick={() => onView?.(id)}
          >
            {styleName}
          </h3>

          {/* Rating */}
          {rating > 0 && (
            <div className="flex items-center space-x-1 mb-2">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3 w-3 ${
                      i < rating
                        ? 'fill-primary text-primary'
                        : 'fill-muted text-muted'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">
                ({reviewCount})
              </span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center justify-between">
            <span className="text-xl font-bold text-primary">
              ${price.toFixed(2)}
            </span>
            {isAvailable && (
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 hover:bg-primary hover:text-primary-foreground"
                onClick={() => navigate(`/order/${id}`)}
              >
                <ShoppingBag className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};