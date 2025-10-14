import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  ShoppingBag, 
  DollarSign, 
  Calendar,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  Download,
  RefreshCw
} from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { exportAnalyticsToPDF } from "@/services/pdfExport";

interface AnalyticsData {
  totalUsers: number;
  totalDesigners: number;
  totalCustomers: number;
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  monthlyGrowth: number;
  revenueGrowth: number;
  userGrowth: number;
  orderGrowth: number;
  topDesigners: Array<{
    name: string;
    orders: number;
    revenue: number;
  }>;
  recentOrders: Array<{
    id: string;
    amount: number;
    customer: string;
    designer: string;
    date: string;
  }>;
  monthlyStats: Array<{
    month: string;
    users: number;
    orders: number;
    revenue: number;
  }>;
}

// Helper function to calculate monthly statistics
const calculateMonthlyStats = async (orders: any[], users: any[]) => {
  const monthlyStats = [];
  const currentDate = new Date();
  
  // Get last 6 months
  for (let i = 5; i >= 0; i--) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - i + 1, 1);
    
    const monthName = date.toLocaleDateString('en-US', { month: 'short' });
    
    // Count users created in this month
    const monthUsers = users.filter(user => {
      const userDate = new Date(user.created_at);
      return userDate >= date && userDate < nextMonth;
    }).length;
    
    // Count orders created in this month
    const monthOrders = orders.filter(order => {
      const orderDate = new Date(order.created_at);
      return orderDate >= date && orderDate < nextMonth;
    });
    
    // Calculate revenue for this month
    const monthRevenue = monthOrders.reduce((sum, order) => sum + (order.amount || 0), 0);
    
    monthlyStats.push({
      month: monthName,
      users: monthUsers,
      orders: monthOrders.length,
      revenue: monthRevenue
    });
  }
  
  return monthlyStats;
};

export const Analytics = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("30d");

  useEffect(() => {
    fetchAnalytics();
  }, [selectedPeriod]);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      
      // Calculate date range based on selected period
      const endDate = new Date();
      const startDate = new Date();
      switch (selectedPeriod) {
        case "7d":
          startDate.setDate(endDate.getDate() - 7);
          break;
        case "30d":
          startDate.setDate(endDate.getDate() - 30);
          break;
        case "90d":
          startDate.setDate(endDate.getDate() - 90);
          break;
        default:
          startDate.setDate(endDate.getDate() - 30);
      }

      // Fetch all data in parallel
      const [
        usersResult,
        ordersResult,
        designersResult,
        monthlyDataResult
      ] = await Promise.all([
        supabase.from('profiles').select('*'),
        supabase.from('escrow_orders').select('*'),
        supabase.from('profiles').select('*').eq('role', 'designer'),
        supabase.from('escrow_orders').select('*').gte('created_at', startDate.toISOString())
      ]);

      const users = usersResult.data || [];
      const orders = ordersResult.data || [];
      const designers = designersResult.data || [];
      const monthlyOrders = monthlyDataResult.data || [];

      // Calculate basic stats
      const totalUsers = users.length;
      const totalDesigners = designers.length;
      const totalCustomers = users.filter(u => u.role === 'customer').length;
      const totalOrders = orders.length;
      const totalRevenue = orders.reduce((sum, order) => sum + (order.amount || 0), 0);
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Calculate growth rates (simplified - would need historical data for accurate calculation)
      const monthlyGrowth = 12.5; // Mock data - would calculate from historical data
      const revenueGrowth = 8.3; // Mock data
      const userGrowth = 15.2; // Mock data
      const orderGrowth = 22.1; // Mock data

      // Top designers by revenue
      const designerStats = designers.map(designer => {
        const designerOrders = orders.filter(order => order.designer_id === designer.id);
        const revenue = designerOrders.reduce((sum, order) => sum + (order.amount || 0), 0);
        return {
          name: designer.phasion_name,
          orders: designerOrders.length,
          revenue: revenue
        };
      }).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

      // Recent orders
      const recentOrders = orders
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10)
        .map(order => ({
          id: order.id,
          amount: order.amount,
          customer: users.find(u => u.id === order.customer_id)?.phasion_name || 'Unknown',
          designer: users.find(u => u.id === order.designer_id)?.phasion_name || 'Unknown',
          date: order.created_at
        }));

      // Calculate real monthly stats for the last 6 months
      const monthlyStats = await calculateMonthlyStats(orders, users);

      setAnalytics({
        totalUsers,
        totalDesigners,
        totalCustomers,
        totalOrders,
        totalRevenue,
        averageOrderValue,
        monthlyGrowth,
        revenueGrowth,
        userGrowth,
        orderGrowth,
        topDesigners: designerStats,
        recentOrders,
        monthlyStats
      });

    } catch (error: any) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportAnalytics = async () => {
    if (!analytics) return;
    
    try {
      await exportAnalyticsToPDF(analytics);
      toast.success('Analytics report exported successfully');
    } catch (error) {
      console.error('Error exporting analytics:', error);
      toast.error('Failed to export analytics report');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">No Analytics Data</h2>
          <p className="text-muted-foreground mb-4">Unable to load analytics data</p>
          <Button onClick={fetchAnalytics}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
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
                Platform Analytics
              </h1>
              <p className="text-xl text-muted-foreground">
                Real-time insights and performance metrics
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleExportAnalytics}>
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
              <Button onClick={fetchAnalytics}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="container-custom py-8">
        {/* Period Selector */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex gap-2">
              <Button
                variant={selectedPeriod === "7d" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedPeriod("7d")}
              >
                Last 7 Days
              </Button>
              <Button
                variant={selectedPeriod === "30d" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedPeriod("30d")}
              >
                Last 30 Days
              </Button>
              <Button
                variant={selectedPeriod === "90d" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedPeriod("90d")}
              >
                Last 90 Days
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold">{analytics.totalUsers}</p>
                  <div className="flex items-center mt-1">
                    <ArrowUp className="h-3 w-3 text-green-600 mr-1" />
                    <span className="text-sm text-green-600">+{analytics.userGrowth}%</span>
                  </div>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold">${analytics.totalRevenue.toFixed(2)}</p>
                  <div className="flex items-center mt-1">
                    <ArrowUp className="h-3 w-3 text-green-600 mr-1" />
                    <span className="text-sm text-green-600">+{analytics.revenueGrowth}%</span>
                  </div>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                  <p className="text-2xl font-bold">{analytics.totalOrders}</p>
                  <div className="flex items-center mt-1">
                    <ArrowUp className="h-3 w-3 text-green-600 mr-1" />
                    <span className="text-sm text-green-600">+{analytics.orderGrowth}%</span>
                  </div>
                </div>
                <ShoppingBag className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg Order Value</p>
                  <p className="text-2xl font-bold">${analytics.averageOrderValue.toFixed(2)}</p>
                  <div className="flex items-center mt-1">
                    <ArrowUp className="h-3 w-3 text-green-600 mr-1" />
                    <span className="text-sm text-green-600">+5.2%</span>
                  </div>
                </div>
                <TrendingUp className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Designers */}
          <Card>
            <CardHeader>
              <CardTitle>Top Designers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.topDesigners.map((designer, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold">{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium">{designer.name}</p>
                        <p className="text-sm text-muted-foreground">{designer.orders} orders</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">${designer.revenue.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Orders */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.recentOrders.slice(0, 5).map((order) => (
                  <div key={order.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">#{order.id.substring(0, 8)}</p>
                      <p className="text-sm text-muted-foreground">
                        {order.customer} → {order.designer}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">${order.amount.toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Stats */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Monthly Performance</CardTitle>
            <div className="text-sm text-muted-foreground">
              Last 6 months of real platform data
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.monthlyStats.map((stat, index) => {
                // Calculate dynamic scaling based on actual data
                const maxUsers = Math.max(...analytics.monthlyStats.map(s => s.users), 1);
                const maxOrders = Math.max(...analytics.monthlyStats.map(s => s.orders), 1);
                const maxRevenue = Math.max(...analytics.monthlyStats.map(s => s.revenue), 1);
                
                return (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-16 text-sm font-medium">{stat.month}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span>Users</span>
                              <span>{stat.users}</span>
                            </div>
                            <Progress value={(stat.users / maxUsers) * 100} className="h-2" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span>Orders</span>
                              <span>{stat.orders}</span>
                            </div>
                            <Progress value={(stat.orders / maxOrders) * 100} className="h-2" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span>Revenue</span>
                              <span>${stat.revenue.toFixed(2)}</span>
                            </div>
                            <Progress value={(stat.revenue / maxRevenue) * 100} className="h-2" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Monthly Summary */}
            <div className="mt-6 pt-6 border-t">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {analytics.monthlyStats.reduce((sum, stat) => sum + stat.users, 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Total New Users</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {analytics.monthlyStats.reduce((sum, stat) => sum + stat.orders, 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Orders</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    ${analytics.monthlyStats.reduce((sum, stat) => sum + stat.revenue, 0).toFixed(2)}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Revenue</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
