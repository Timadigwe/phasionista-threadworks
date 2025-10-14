import { useState, useEffect } from 'react';
import { supabaseApi } from '@/services/supabaseApi';
import { useAuth } from '@/contexts/AuthContext';

export const useFavorites = () => {
  const { user } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  const fetchFavorites = async () => {
    if (!user) {
      setFavoriteIds(new Set());
      return;
    }

    try {
      setIsLoading(true);
      const { favorites } = await supabaseApi.getFavorites();
      const ids = new Set(favorites.map(fav => fav.cloth.id));
      setFavoriteIds(ids);
    } catch (error) {
      console.error('Error fetching favorites:', error);
      setFavoriteIds(new Set());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, [user]);

  const isFavorited = (clothId: string) => {
    return favoriteIds.has(clothId);
  };

  const addToFavorites = async (clothId: string) => {
    if (!user) return false;

    try {
      await supabaseApi.addToFavorites(clothId);
      setFavoriteIds(prev => new Set([...prev, clothId]));
      return true;
    } catch (error: any) {
      if (error.message.includes('already in your favorites')) {
        // Item is already favorited, update local state
        setFavoriteIds(prev => new Set([...prev, clothId]));
        return true;
      }
      throw error;
    }
  };

  const removeFromFavorites = async (clothId: string) => {
    if (!user) return false;

    try {
      await supabaseApi.removeFromFavorites(clothId);
      setFavoriteIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(clothId);
        return newSet;
      });
      return true;
    } catch (error) {
      throw error;
    }
  };

  return {
    favoriteIds,
    isFavorited,
    addToFavorites,
    removeFromFavorites,
    isLoading,
    refetch: fetchFavorites
  };
};
