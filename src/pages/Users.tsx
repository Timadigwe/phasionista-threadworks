import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Filter, MoreHorizontal, Ban, CheckCircle, AlertTriangle, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface User {
  id: string;
  phasion_name: string;
  full_name?: string;
  email: string;
  role: 'customer' | 'designer' | 'admin';
  is_verified: boolean;
  kyc_status?: 'pending' | 'approved' | 'rejected' | 'under_review';
  created_at: string;
  avatar_url?: string;
  orders_count?: number;
  revenue?: number;
}

const getStatusColor = (isVerified: boolean, kycStatus?: string) => {
  if (!isVerified) return "bg-red-100 text-red-800";
  if (kycStatus === 'pending') return "bg-yellow-100 text-yellow-800";
  if (kycStatus === 'approved') return "bg-green-100 text-green-800";
  if (kycStatus === 'rejected') return "bg-red-100 text-red-800";
  return "bg-gray-100 text-gray-800";
};

const getRoleColor = (role: string) => {
  switch (role) {
    case "designer":
      return "bg-purple-100 text-purple-800";
    case "customer":
      return "bg-blue-100 text-blue-800";
    case "admin":
      return "bg-orange-100 text-orange-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getStatusText = (isVerified: boolean, kycStatus?: string) => {
  if (!isVerified) return "Unverified";
  if (kycStatus === 'pending') return "KYC Pending";
  if (kycStatus === 'approved') return "Verified";
  if (kycStatus === 'rejected') return "KYC Rejected";
  return "Active";
};

export const Users = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      
      // Fetch users with their order statistics
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select(`
          id,
          phasion_name,
          full_name,
          email,
          role,
          is_verified,
          kyc_status,
          created_at,
          avatar_url
        `)
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;

      // Get order statistics for each user
      const usersWithStats = await Promise.all(
        (usersData || []).map(async (user) => {
          try {
            const { data: ordersData } = await supabase
              .from('escrow_orders')
              .select('amount')
              .eq('customer_id', user.id);

            const ordersCount = ordersData?.length || 0;
            const revenue = ordersData?.reduce((sum, order) => sum + (order.amount || 0), 0) || 0;

            return {
              ...user,
              orders_count: ordersCount,
              revenue: revenue
            };
          } catch (error) {
            console.error(`Error fetching stats for user ${user.id}:`, error);
            return {
              ...user,
              orders_count: 0,
              revenue: 0
            };
          }
        })
      );

      setUsers(usersWithStats);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserAction = async (userId: string, action: 'verify' | 'suspend' | 'activate') => {
    try {
      let updateData: any = {};
      
      switch (action) {
        case 'verify':
          updateData = { is_verified: true };
          break;
        case 'suspend':
          updateData = { is_verified: false };
          break;
        case 'activate':
          updateData = { is_verified: true };
          break;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId);

      if (error) throw error;

      toast.success(`User ${action}d successfully`);
      fetchUsers(); // Refresh data
    } catch (error: any) {
      console.error(`Error ${action}ing user:`, error);
      toast.error(`Failed to ${action} user`);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.phasion_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.full_name && user.full_name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    
    return matchesSearch && matchesRole;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

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
                  <Link to="/admin" className="flex items-center gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Admin
                  </Link>
                </Button>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                User Management
              </h1>
              <p className="text-xl text-muted-foreground">
                Manage users, roles, and permissions ({users.length} total users)
              </p>
            </div>
            <Button className="btn-hero">
              Add New User
            </Button>
          </motion.div>
        </div>
      </section>

      <div className="container-custom py-8">
        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={filterRole === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterRole("all")}
                >
                  All
                </Button>
                <Button
                  variant={filterRole === "customer" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterRole("customer")}
                >
                  Customers
                </Button>
                <Button
                  variant={filterRole === "designer" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterRole("designer")}
                >
                  Designers
                </Button>
                <Button
                  variant={filterRole === "admin" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterRole("admin")}
                >
                  Admins
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Users ({filteredUsers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Orders</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={user.avatar_url} />
                            <AvatarFallback>
                              {user.phasion_name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{user.phasion_name}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getRoleColor(user.role)}>
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(user.is_verified, user.kyc_status)}>
                          {getStatusText(user.is_verified, user.kyc_status)}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.orders_count || 0}</TableCell>
                      <TableCell>${(user.revenue || 0).toFixed(2)}</TableCell>
                      <TableCell>
                        {new Date(user.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {!user.is_verified ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUserAction(user.id, 'verify')}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Verify
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUserAction(user.id, 'suspend')}
                            >
                              <Ban className="h-4 w-4 mr-1" />
                              Suspend
                            </Button>
                          )}
                          <Button size="sm" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};