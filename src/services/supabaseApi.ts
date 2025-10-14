import { supabase } from '../lib/supabase';

export const supabaseApi = {
  // Clothes API
  async getClothes(filters?: { category?: string; search?: string; priceMin?: number; priceMax?: number }) {
    let query = supabase
      .from('clothes')
      .select(`
        *,
        designer:profiles!clothes_designer_id_fkey(
          id,
          phasion_name,
          full_name,
          avatar_url,
          location,
          bio
        )
      `)
      .eq('is_available', true)
      .order('created_at', { ascending: false });

    if (filters?.category) {
      query = query.eq('category', filters.category);
    }

    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    if (filters?.priceMin) {
      query = query.gte('price', filters.priceMin);
    }

    if (filters?.priceMax) {
      query = query.lte('price', filters.priceMax);
    }

    const { data, error } = await query;
    if (error) throw error;
    return { clothes: data || [] };
  },

  async getClothById(id: string) {
    const { data, error } = await supabase
      .from('clothes')
      .select(`
        *,
        designer:profiles!clothes_designer_id_fkey(
          id,
          phasion_name,
          full_name,
          avatar_url,
          location,
          bio,
          social_links
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async createCloth(clothData: any) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('clothes')
      .insert({
        designer_id: user.id,
        name: clothData.name,
        description: clothData.description,
        price: parseFloat(clothData.price),
        category: clothData.category,
        size: clothData.size,
        color: clothData.color,
        material: clothData.material,
        measurements: clothData.measurements,
        images: clothData.images || [],
        is_available: true
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateCloth(id: string, clothData: any) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('clothes')
      .update(clothData)
      .eq('id', id)
      .eq('designer_id', user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteCloth(id: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('clothes')
      .delete()
      .eq('id', id)
      .eq('designer_id', user.id);

    if (error) throw error;
    return { success: true };
  },

  // Designers API
  async getDesigners(filters?: { specialty?: string; location?: string }) {
    let query = supabase
      .from('profiles')
      .select(`
        *,
        clothes:clothes(count)
      `)
      .eq('role', 'designer')
      .order('created_at', { ascending: false });

    if (filters?.location) {
      query = query.ilike('location', `%${filters.location}%`);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Transform data to include clothes count
    const designers = data?.map(designer => ({
      ...designer,
      clothesCount: designer.clothes?.[0]?.count || 0
    })) || [];

    return { designers };
  },

  async getDesignerById(id: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        clothes:clothes(*)
      `)
      .eq('id', id)
      .eq('role', 'designer')
      .single();

    if (error) throw error;
    return data;
  },

  // Favorites API
  async getFavorites() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('favorites')
      .select(`
        *,
        cloth:clothes(
          *,
          designer:profiles!clothes_designer_id_fkey(
            id,
            phasion_name,
            full_name,
            avatar_url
          )
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { favorites: data || [] };
  },

  async addToFavorites(clothId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('favorites')
      .insert({
        user_id: user.id,
        cloth_id: clothId
      })
      .select()
      .single();

    if (error) {
      // Handle duplicate key constraint error
      if (error.code === '23505') {
        throw new Error('This item is already in your favorites');
      }
      throw error;
    }
    return data;
  },

  async removeFromFavorites(clothId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', user.id)
      .eq('cloth_id', clothId);

    if (error) throw error;
    return { success: true };
  },

  async isFavorited(clothId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('cloth_id', clothId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
      console.error('Error checking favorite status:', error);
      return false;
    }

    return !!data;
  },

  // Reviews API
  async getReviews(clothId: string) {
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        *,
        customer:profiles!reviews_customer_id_fkey(
          id,
          phasion_name,
          full_name,
          avatar_url
        )
      `)
      .eq('cloth_id', clothId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { reviews: data || [] };
  },

  async createReview(reviewData: any) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('reviews')
      .insert({
        cloth_id: reviewData.clothId,
        customer_id: user.id,
        designer_id: reviewData.designerId,
        rating: reviewData.rating,
        comment: reviewData.comment
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

