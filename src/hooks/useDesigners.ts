import { useState, useEffect } from 'react';
import { supabaseApi } from '@/services/supabaseApi';

interface DesignersFilters {
  specialty?: string;
  location?: string;
}

export const useDesigners = (filters?: DesignersFilters) => {
  const [designers, setDesigners] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDesigners = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await supabaseApi.getDesigners(filters);
      setDesigners(response.designers || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch designers');
      console.error('Error fetching designers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDesigners();
  }, [JSON.stringify(filters)]);

  const refetch = () => {
    fetchDesigners();
  };

  return {
    designers,
    isLoading,
    error,
    refetch
  };
};
