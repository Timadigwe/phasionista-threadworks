import { supabase } from '../lib/supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export const supabaseApi = {
  // Clothes API
  async createCloth(clothData: any) {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${SUPABASE_URL}/functions/v1/create-cloth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(clothData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create cloth');
    }

    return response.json();
  },

  async getClothes(filters?: { category?: string; ownerName?: string }) {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Not authenticated');
    }

    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.ownerName) params.append('ownerName', filters.ownerName);

    const response = await fetch(`${SUPABASE_URL}/functions/v1/get-clothes?${params}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch clothes');
    }

    return response.json();
  },

  async updateCloth(clothId: string, clothData: any) {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${SUPABASE_URL}/functions/v1/update-cloth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ id: clothId, ...clothData }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update cloth');
    }

    return response.json();
  },

  async deleteCloth(clothId: string) {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${SUPABASE_URL}/functions/v1/delete-cloth?id=${clothId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete cloth');
    }

    return response.json();
  },

  // Escrow API
  async createEscrow(escrowData: any) {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${SUPABASE_URL}/functions/v1/create-escrow`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(escrowData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create escrow');
    }

    return response.json();
  },

  async lockEscrow(escrowId: string, transactionHash: string) {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${SUPABASE_URL}/functions/v1/lock-escrow`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ escrowId, transactionHash }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to lock escrow');
    }

    return response.json();
  },

  // Designers API
  async getDesigners(filters?: { specialty?: string; location?: string }) {
    try {
      // Get designers from users table with their clothes count
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select(`
          id,
          email,
          phasion_name,
          name,
          role,
          photo,
          created_at,
          clothes:clothes(count)
        `)
        .eq('role', 'designer')
        .order('created_at', { ascending: false });

      if (usersError) {
        console.error('Users query error:', usersError);
        throw usersError;
      }

      console.log('Users data:', users);

      // Transform users to designers format
      const designers = users.map(user => ({
        id: user.id,
        name: user.phasion_name || user.name || user.email?.split('@')[0] || 'Designer',
        email: user.email,
        specialty: 'Fashion Design', // Default specialty
        rating: 4.5 + Math.random() * 0.5,
        reviews: Math.floor(Math.random() * 100) + 20,
        location: 'Global',
        avatar: user.photo || '/api/placeholder/60/60',
        verified: true,
        priceRange: '$100 - $500',
        description: 'Talented fashion designer creating unique pieces.',
        clothesCount: user.clothes?.[0]?.count || 0,
        joinDate: new Date(user.created_at).toLocaleDateString()
      }));

      // If no designers found, show some sample data
      let finalDesigners = designers;
      if (designers.length === 0) {
        console.log('No designers found, showing sample data');
        finalDesigners = [
          {
            id: 'sample-1',
            name: 'Sample Designer',
            email: 'designer@example.com',
            specialty: 'Fashion Design',
            rating: 4.5,
            reviews: 25,
            location: 'Global',
            avatar: '/api/placeholder/60/60',
            verified: true,
            priceRange: '$100 - $500',
            description: 'Talented fashion designer creating unique pieces.',
            clothesCount: 0,
            joinDate: new Date().toLocaleDateString()
          }
        ];
      }

      // Apply filters if provided
      let filteredDesigners = finalDesigners;
      if (filters?.specialty) {
        filteredDesigners = filteredDesigners.filter(d => 
          d.specialty.toLowerCase().includes(filters.specialty.toLowerCase())
        );
      }
      if (filters?.location) {
        filteredDesigners = filteredDesigners.filter(d => 
          d.location.toLowerCase().includes(filters.location.toLowerCase())
        );
      }

      console.log('Final designers:', filteredDesigners);
      return { designers: filteredDesigners };
    } catch (error) {
      console.error('Error fetching designers:', error);
      throw error;
    }
  },

  // User profile
  async getUserProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  async updateUserProfile(updates: any) {
    const { data, error } = await supabase.auth.updateUser({
      data: updates
    });
    
    if (error) throw error;
    return data;
  }
};
