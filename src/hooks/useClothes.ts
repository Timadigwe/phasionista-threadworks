import { useState, useEffect } from 'react';
import { supabaseApi } from '@/services/supabaseApi';

interface ClothesFilters {
  category?: string;
  ownerName?: string;
  search?: string;
  priceMin?: number;
  priceMax?: number;
}

export const useClothes = (filters?: ClothesFilters) => {
  const [clothes, setClothes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClothes = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await supabaseApi.getClothes(filters);
      setClothes(response.clothes || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch clothes');
      console.error('Error fetching clothes:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClothes();
  }, [JSON.stringify(filters)]);

  const refetch = () => {
    fetchClothes();
  };

  return {
    clothes,
    isLoading,
    error,
    refetch
  };
};
