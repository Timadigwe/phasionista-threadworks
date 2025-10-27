import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { 
  ShoppingBag, 
  Heart, 
  Eye, 
  TrendingUp,
  DollarSign,
  Package,
  Clock,
  CheckCircle,
  AlertCircle,
  Shield,
  Ruler
} from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface DashboardStats {
  totalOrders: number;
  totalFavorites: number;
  totalSpent: number;
  profileViews: number;
  // Designer-specific stats
  totalSales?: number;
  totalRevenue?: number;
  totalItems?: number;
  pendingOrders?: number;
}

interface RecentOrder {
  id: string;
  item: string;
  designer: string;
  status: string;
  date: string;
  amount: string;
  currency?: string;
}

// Customer-specific quick actions
const customerQuickActions = [
  {
    title: "Browse New Items",
    description: "Discover the latest fashion trends",
    icon: Package,
    href: "/clothes"
  },
  {
    title: "Find Designers",
    description: "Connect with talented designers",
    icon: TrendingUp,
    href: "/designers"
  },
  {
    title: "Body Measurements",
    description: "Add your measurements for perfect fit",
    icon: Ruler,
    href: "/measurements"
  },
  {
    title: "Track Orders",
    description: "Monitor your current orders",
    icon: Clock,
    href: "/orders"
  },
  {
    title: "KYC Verification",
    description: "Complete identity verification",
    icon: Shield,
    href: "/kyc-verification"
  }
];

// Designer-specific quick actions
const designerQuickActions = [
  {
    title: "Create New Item",
    description: "Add a new clothing item",
    icon: Package,
    href: "/create"
  },
  {
    title: "Manage Inventory",
    description: "View and edit your clothing items",
    icon: TrendingUp,
    href: "/my-clothes"
  },
  {
    title: "View Orders",
    description: "Track orders from customers",
    icon: Clock,
    href: "/orders"
  },
  {
    title: "KYC Verification",
    description: "Complete identity verification",
    icon: Shield,
    href: "/kyc-verification"
  }
];

export const Dashboard = () => {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    totalFavorites: 0,
    totalSpent: 0,
    profileViews: 0
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      
      if (profile?.role === 'designer') {
        // Designer-specific data fetching
        await fetchDesignerData();
      } else {
        // Customer-specific data fetching
        await fetchCustomerData();
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCustomerData = async () => {
      // Fetch user's orders
      const { data: orders, error: ordersError } = await supabase
        .from('escrow_orders')
        .select(`
          id,
          status,
          amount,
          currency,
          created_at,
          clothes!inner(
            name,
            profiles!inner(phasion_name)
          )
        `)
        .eq('customer_id', user?.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (ordersError) throw ordersError;

    // Fetch user's favorites
    const { data: favorites, error: favoritesError } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', user?.id);

    if (favoritesError) throw favoritesError;

    // Calculate total spent from completed orders only
    const totalSpent = orders?.reduce((sum, order) => {
      // Only count orders that are delivered (completed)
      if (order.status === 'delivered') {
        return sum + (order.amount || 0);
      }
      return sum;
    }, 0) || 0;

    // Format recent orders
    const formattedOrders: RecentOrder[] = orders?.map(order => {
      const cloth = Array.isArray(order.clothes) ? order.clothes[0] : order.clothes;
      const designer = Array.isArray(cloth?.profiles) ? cloth.profiles[0] : cloth?.profiles;
      
      return {
        id: order.id,
        item: cloth?.name || 'Unknown Item',
        designer: designer?.phasion_name || 'Unknown Designer',
        status: order.status === 'paid' ? 'In Progress' : 
                order.status === 'delivered' ? 'Delivered' : 
                order.status === 'shipped' ? 'Shipped' : 'Pending',
        date: new Date(order.created_at).toLocaleDateString(),
        amount: order.currency === 'SOL' 
          ? `${order.amount || 0} SOL`
          : order.currency === 'USDC'
          ? `$${order.amount || 0} USDC`
          : `$${order.amount || 0}`,
        currency: order.currency
      };
    }) || [];

    setStats({
      totalOrders: orders?.length || 0,
      totalFavorites: favorites?.length || 0,
      totalSpent,
      profileViews: 0 // This would need to be tracked separately
    });

    setRecentOrders(formattedOrders);
  };

  const fetchDesignerData = async () => {
    // Fetch designer's completed sales (delivered or released orders only)
    const { data: orders, error: ordersError } = await supabase
      .from('escrow_orders')
      .select(`
        id,
        status,
        amount,
        currency,
        created_at,
        clothes!inner(
          name,
          profiles!inner(phasion_name)
        )
      `)
      .eq('designer_id', user?.id)
      .in('status', ['delivered', 'released'])
      .order('created_at', { ascending: false })
      .limit(5);

    if (ordersError) {
      console.error('Error fetching designer orders:', ordersError);
      throw ordersError;
    }

    // Fetch designer's items
    const { data: items, error: itemsError } = await supabase
      .from('clothes')
      .select('id')
      .eq('designer_id', user?.id);

    if (itemsError) throw itemsError;

    // Calculate total revenue from completed sales (delivered and released)
    const totalRevenue = orders?.reduce((sum, order) => {
      if (order.status === 'delivered' || order.status === 'released') {
        return sum + (order.amount || 0);
      }
      return sum;
    }, 0) || 0;

    // Count pending orders (separate query for pending orders)
    const { data: pendingOrdersData, error: pendingError } = await supabase
      .from('escrow_orders')
      .select('id')
      .eq('designer_id', user?.id)
      .in('status', ['paid', 'shipped']);

    if (pendingError) throw pendingError;
    const pendingOrders = pendingOrdersData?.length || 0;

    // Format recent orders for designer view
    const formattedOrders: RecentOrder[] = orders?.map(order => {
      const cloth = Array.isArray(order.clothes) ? order.clothes[0] : order.clothes;
      const designer = Array.isArray(cloth?.profiles) ? cloth.profiles[0] : cloth?.profiles;
      
      return {
        id: order.id,
        item: cloth?.name || 'Unknown Item',
        designer: designer?.phasion_name || 'Unknown Designer',
        status: order.status === 'delivered' ? 'Completed' : 
                order.status === 'released' ? 'Payment Released' : 'Completed',
        date: new Date(order.created_at).toLocaleDateString(),
        amount: order.currency === 'SOL' 
          ? `${order.amount || 0} SOL`
          : order.currency === 'USDC'
          ? `$${order.amount || 0} USDC`
          : `$${order.amount || 0}`,
        currency: order.currency
      };
    }) || [];

    setStats({
      totalOrders: orders?.length || 0,
      totalFavorites: 0, // Not relevant for designers
      totalSpent: 0, // Not relevant for designers
      profileViews: 0,
      totalSales: orders?.length || 0,
      totalRevenue,
      totalItems: items?.length || 0,
      pendingOrders
    });

    setRecentOrders(formattedOrders);
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
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                Welcome back, {profile?.phasion_name || user?.email?.split('@')[0] || "User"}!
              </h1>
              <p className="text-muted-foreground">
                {profile?.role === 'designer' 
                  ? "Here's your designer dashboard with sales and inventory insights"
                  : "Here's what's happening with your account"
                }
              </p>
              
              {/* KYC Status */}
              <div className="mt-4">
                {profile?.kyc_status === 'approved' ? (
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Identity Verified
                  </Badge>
                ) : profile?.kyc_status === 'pending' ? (
                  <Badge className="bg-yellow-100 text-yellow-800">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    KYC Pending Review
                  </Badge>
                ) : profile?.kyc_status === 'rejected' ? (
                  <Badge className="bg-red-100 text-red-800">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    KYC Rejected - Please Resubmit
                  </Badge>
                ) : profile?.kyc_status === 'under_review' ? (
                  <Badge className="bg-blue-100 text-blue-800">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    KYC Under Review
                  </Badge>
                ) : (
                  <Badge className="bg-orange-100 text-orange-800">
                    <Shield className="h-3 w-3 mr-1" />
                    Complete KYC Verification
                  </Badge>
                )}
              </div>
            </div>
            {profile?.role !== 'designer' && (
              <Button className="btn-hero" asChild>
                <Link to="/clothes">
                  Browse New Items
                </Link>
              </Button>
            )}
          </motion.div>
        </div>
      </section>

      <div className="container-custom py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {profile?.role === 'designer' ? (
                // Designer-specific stats
                <>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">
                              Total Sales
                            </p>
                            <p className="text-2xl font-bold">{stats.totalSales || 0}</p>
                            <p className="text-xs text-muted-foreground">Items sold</p>
                          </div>
                          <div className="p-3 rounded-full bg-muted">
                            <ShoppingBag className="h-6 w-6 text-blue-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">
                              Total Revenue
                            </p>
                            <p className="text-2xl font-bold">${(stats.totalRevenue || 0).toFixed(2)}</p>
                            <p className="text-xs text-muted-foreground">Earnings</p>
                          </div>
                          <div className="p-3 rounded-full bg-muted">
                            <DollarSign className="h-6 w-6 text-green-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">
                              Inventory Items
                            </p>
                            <p className="text-2xl font-bold">{stats.totalItems || 0}</p>
                            <p className="text-xs text-muted-foreground">In catalog</p>
                          </div>
                          <div className="p-3 rounded-full bg-muted">
                            <Package className="h-6 w-6 text-purple-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">
                              Pending Orders
                            </p>
                            <p className="text-2xl font-bold">{stats.pendingOrders || 0}</p>
                            <p className="text-xs text-muted-foreground">Awaiting fulfillment</p>
                          </div>
                          <div className="p-3 rounded-full bg-muted">
                            <Clock className="h-6 w-6 text-orange-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </>
              ) : (
                // Customer-specific stats
                <>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">
                              Total Orders
                            </p>
                            <p className="text-2xl font-bold">{stats.totalOrders}</p>
                            <p className="text-xs text-muted-foreground">All time</p>
                          </div>
                          <div className="p-3 rounded-full bg-muted">
                            <ShoppingBag className="h-6 w-6 text-blue-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">
                              Favorites
                            </p>
                            <p className="text-2xl font-bold">{stats.totalFavorites}</p>
                            <p className="text-xs text-muted-foreground">Saved items</p>
                          </div>
                          <div className="p-3 rounded-full bg-muted">
                            <Heart className="h-6 w-6 text-red-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">
                              Profile Views
                            </p>
                            <p className="text-2xl font-bold">{stats.profileViews}</p>
                            <p className="text-xs text-muted-foreground">This month</p>
                          </div>
                          <div className="p-3 rounded-full bg-muted">
                            <Eye className="h-6 w-6 text-green-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">
                              Total Spent
                            </p>
                            <p className="text-2xl font-bold">${stats.totalSpent.toFixed(2)}</p>
                            <p className="text-xs text-muted-foreground">Completed orders</p>
                          </div>
                          <div className="p-3 rounded-full bg-muted">
                            <DollarSign className="h-6 w-6 text-purple-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </>
              )}
            </div>

            {/* KYC Verification Card */}
            {(!profile?.kyc_status || profile.kyc_status !== 'approved') && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="border-orange-200 bg-orange-50">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-full bg-orange-100">
                          <Shield className="h-6 w-6 text-orange-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-orange-900">Complete KYC Verification</h3>
                          <p className="text-sm text-orange-700">
                            Verify your identity to access all platform features and make secure transactions
                          </p>
                        </div>
                      </div>
                      <Button asChild className="bg-orange-600 hover:bg-orange-700">
                        <Link to="/kyc-verification">
                          <Shield className="h-4 w-4 mr-2" />
                          Start Verification
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Body Measurements Card - Only for customers */}
            {profile?.role !== 'designer' && (!profile?.body_measurements || profile.body_measurements === '') && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-full bg-blue-100">
                          <Ruler className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-blue-900">Complete Body Measurements</h3>
                          <p className="text-sm text-blue-700">
                            Add your body measurements for perfect fit recommendations and personalized clothing suggestions
                          </p>
                        </div>
                      </div>
                      <Button asChild className="bg-blue-600 hover:bg-blue-700">
                        <Link to="/measurements">
                          <Ruler className="h-4 w-4 mr-2" />
                          Add Measurements
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Recent Orders/Activity */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5" />
                    {profile?.role === 'designer' ? 'Recent Sales' : 'Recent Orders'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="p-4 border rounded-lg animate-pulse">
                          <div className="flex items-start gap-4">
                            <div className="w-16 h-16 bg-muted rounded-lg"></div>
                            <div className="flex-1">
                              <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
                              <div className="h-3 bg-muted rounded w-1/2 mb-2"></div>
                              <div className="h-3 bg-muted rounded w-1/4"></div>
                            </div>
                            <div className="text-right">
                              <div className="h-4 bg-muted rounded w-16 mb-2"></div>
                              <div className="h-8 bg-muted rounded w-20"></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : recentOrders.length > 0 ? (
                    <div className="space-y-4">
                      {recentOrders.map((order) => (
                        <div key={order.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => window.location.href = '/designer/orders'}>
                          <div className="flex items-start gap-4">
                            <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                              <Package className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium">{order.item}</h4>
                                <Badge 
                                  variant={
                                    order.status === "Completed" ? "default" :
                                    order.status === "Payment Released" ? "default" :
                                    order.status === "Delivered" ? "default" :
                                    order.status === "In Progress" ? "secondary" : "outline"
                                  }
                                >
                                  {order.status}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-1">
                                {profile?.role === 'designer' ? `Customer: ${order.designer}` : `Designer: ${order.designer}`}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Order Date: {order.date}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-lg">{order.amount}</p>
                              <p className="text-xs text-muted-foreground">Click to view details</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <ShoppingBag className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-semibold mb-2">
                        {profile?.role === 'designer' ? 'No sales yet' : 'No orders yet'}
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        {profile?.role === 'designer' 
                          ? 'Create and list items to start making sales'
                          : 'Start shopping to see your orders here'
                        }
                      </p>
                      <Button asChild>
                        <Link to={profile?.role === 'designer' ? '/create' : '/clothes'}>
                          {profile?.role === 'designer' ? 'Create Item' : 'Browse Items'}
                        </Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(profile?.role === 'designer' ? designerQuickActions : customerQuickActions).map((action) => (
                    <Button
                      key={action.title}
                      variant="ghost"
                      className="w-full justify-start h-auto p-4"
                      asChild
                    >
                      <a href={action.href}>
                        <div className="flex items-center gap-3">
                          <action.icon className="h-5 w-5 text-primary" />
                          <div className="text-left">
                            <p className="font-medium">{action.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {action.description}
                            </p>
                          </div>
                        </div>
                      </a>
                    </Button>
                  ))}
                </CardContent>
              </Card>
            </motion.div>

            {/* Account Status */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Account Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Email Verified</span>
                    <Badge 
                      variant={user?.email_confirmed_at ? "default" : "secondary"}
                      className={user?.email_confirmed_at ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}
                    >
                      {user?.email_confirmed_at ? "Verified" : "Pending"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">KYC Status</span>
                    <Badge 
                      variant={
                        profile?.kyc_status === 'approved' ? "default" :
                        profile?.kyc_status === 'pending' ? "secondary" :
                        profile?.kyc_status === 'rejected' ? "destructive" : "outline"
                      }
                      className={
                        profile?.kyc_status === 'approved' ? "bg-green-100 text-green-800" :
                        profile?.kyc_status === 'pending' ? "bg-yellow-100 text-yellow-800" :
                        profile?.kyc_status === 'rejected' ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-800"
                      }
                    >
                      {profile?.kyc_status === 'approved' ? "Verified" :
                       profile?.kyc_status === 'pending' ? "Pending" :
                       profile?.kyc_status === 'rejected' ? "Rejected" : "Not Started"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Body Measurements</span>
                    <Badge 
                      variant={profile?.body_measurements ? "default" : "secondary"}
                      className={profile?.body_measurements ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}
                    >
                      {profile?.body_measurements ? "Completed" : "Not Added"}
                    </Badge>
                  </div>
                  <div className="pt-2">
                    <p className="text-sm text-muted-foreground mb-2">
                      Profile Completion
                    </p>
                    <Progress 
                      value={
                        (profile?.full_name ? 20 : 0) +
                        (profile?.bio ? 20 : 0) +
                        (profile?.avatar_url ? 20 : 0) +
                        (profile?.kyc_status === 'approved' ? 20 : 0) +
                        (profile?.body_measurements ? 20 : 0)
                      } 
                      className="h-2" 
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {Math.round(
                        (profile?.full_name ? 20 : 0) +
                        (profile?.bio ? 20 : 0) +
                        (profile?.avatar_url ? 20 : 0) +
                        (profile?.kyc_status === 'approved' ? 20 : 0) +
                        (profile?.body_measurements ? 20 : 0)
                      )}% complete
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};
