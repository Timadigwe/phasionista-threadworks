import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Users, 
  ShoppingBag, 
  DollarSign, 
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  BarChart3,
  Shield,
  FileText,
  Settings,
  Eye,
  Package,
  CreditCard,
  MessageSquare,
  Flag,
  Calendar,
  Download,
  Filter,
  Search,
  MoreHorizontal
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { exportToPDF } from "@/services/pdfExport";
import { escrowService } from "@/services/escrowService";

interface AdminStats {
  totalUsers: number;
  totalDesigners: number;
  totalAllUsers: number;
  totalOrders: number;
  totalRevenue: number;
  activeDisputes: number;
  escrowBalance: number;
  vaultBalanceSOL: number;
  vaultBalanceUSDC: number;
  monthlyGrowth: number;
}


interface Order {
  id: string;
  customer_name: string;
  designer_name: string;
  cloth_name: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
  delivery_address: string;
  cloth?: {
    name: string;
  };
  customer?: {
    phasion_name: string;
    full_name: string;
  };
  designer?: {
    phasion_name: string;
    full_name: string;
  };
}

interface Dispute {
  id: string;
  order_id: string;
  customer_name: string;
  designer_name: string;
  reason: string;
  description: string;
  status: string;
  created_at: string;
  resolution_notes?: string;
  order?: {
    customer?: {
      phasion_name: string;
      full_name: string;
    };
    designer?: {
      phasion_name: string;
      full_name: string;
    };
  };
}

export const Admin = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalDesigners: 0,
    totalAllUsers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    activeDisputes: 0,
    escrowBalance: 0,
    vaultBalanceSOL: 0,
    vaultBalanceUSDC: 0,
    monthlyGrowth: 0
  });
  const [orders, setOrders] = useState<Order[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    fetchAdminData();
    fetchVaultBalances();
  }, []);

  const fetchVaultBalances = async () => {
    try {
      const [solBalance, usdcBalance] = await Promise.all([
        escrowService.getVaultBalance('SOL'),
        escrowService.getVaultBalance('USDC')
      ]);
      
      setStats(prev => ({
        ...prev,
        vaultBalanceSOL: solBalance,
        vaultBalanceUSDC: usdcBalance
      }));
    } catch (error) {
      console.error('Error fetching vault balances:', error);
    }
  };

  const fetchAdminData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch stats
      const [usersResult, ordersResult, disputesResult] = await Promise.all([
        supabase.from('profiles').select('id, role, is_verified'),
        supabase.from('escrow_orders').select('*'),
        supabase.from('disputes').select('*').eq('status', 'open')
      ]);

      // Calculate stats
      const users = usersResult.data || [];
      const orders = ordersResult.data || [];
      const activeDisputes = disputesResult.data || [];

      const totalUsers = users.filter(u => u.role === 'customer').length;
      const totalDesigners = users.filter(u => u.role === 'designer').length;
      const totalAllUsers = users.length; // Total users (customers + designers + admins)
      const totalOrders = orders.length;
      const totalRevenue = orders.reduce((sum, order) => sum + (order.amount || 0), 0);
      const escrowBalance = orders
        .filter(order => order.status === 'paid')
        .reduce((sum, order) => sum + (order.amount || 0), 0);

      setStats({
        totalUsers,
        totalDesigners,
        totalAllUsers,
        totalOrders,
        totalRevenue,
        activeDisputes: activeDisputes.length,
        escrowBalance,
        vaultBalanceSOL: 0, // Will be updated by fetchVaultBalances
        vaultBalanceUSDC: 0, // Will be updated by fetchVaultBalances
        monthlyGrowth: 12.5 // Mock data - would calculate from historical data
      });


      // Fetch recent orders
      const { data: ordersData } = await supabase
        .from('escrow_orders')
        .select(`
          *,
          customer:profiles!escrow_orders_customer_id_fkey(phasion_name, full_name),
          designer:profiles!escrow_orders_designer_id_fkey(phasion_name, full_name),
          cloth:clothes!escrow_orders_cloth_id_fkey(name)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      setOrders(ordersData || []);

      // Fetch disputes (handle case where table doesn't exist yet)
      try {
        const { data: disputesData } = await supabase
          .from('disputes')
          .select(`
            *,
            order:escrow_orders!disputes_order_id_fkey(
              customer:profiles!escrow_orders_customer_id_fkey(phasion_name, full_name),
              designer:profiles!escrow_orders_designer_id_fkey(phasion_name, full_name)
            )
          `)
          .order('created_at', { ascending: false });

        setDisputes(disputesData || []);
      } catch (disputesError: any) {
        console.log('Disputes table not found, using empty array:', disputesError.message);
        setDisputes([]);
      }

    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast.error('Failed to load admin data');
    } finally {
      setIsLoading(false);
    }
  };


  const handleDisputeResolution = async (disputeId: string, resolution: string, decision: 'customer' | 'designer') => {
    try {
      // Get dispute details to access order information
      const { data: dispute, error: disputeError } = await supabase
        .from('disputes')
        .select(`
          *,
          order:escrow_orders!disputes_order_id_fkey(
            id,
            status,
            amount,
            currency,
            customer_id,
            designer_id
          )
        `)
        .eq('id', disputeId)
        .single();

      if (disputeError) throw disputeError;

      if (decision === 'customer') {
        // Refund customer
        try {
          await escrowService.refundCustomer(
            dispute.order.id, 
            `Dispute resolved in favor of customer: ${resolution}`,
            user?.id || 'admin'
          );
          toast.success('Dispute resolved: Customer refunded successfully');
        } catch (refundError: any) {
          console.error('Error refunding customer:', refundError);
          toast.error(`Failed to refund customer: ${refundError.message}`);
          return; // Don't update dispute status if refund failed
        }
      } else if (decision === 'designer') {
        // Release funds to designer
        try {
          await escrowService.releaseFunds(dispute.order.id);
          toast.success('Dispute resolved: Funds released to designer');
        } catch (releaseError: any) {
          console.error('Error releasing funds to designer:', releaseError);
          toast.error(`Failed to release funds: ${releaseError.message}`);
          return; // Don't update dispute status if release failed
        }
      }

      // Update dispute status
      const { error } = await supabase
        .from('disputes')
        .update({
          status: 'resolved',
          resolution_notes: resolution,
          resolved_by: user?.id,
          resolved_at: new Date().toISOString()
        })
        .eq('id', disputeId);

      if (error) throw error;

      toast.success('Dispute resolved successfully');
      fetchAdminData(); // Refresh data
    } catch (error: any) {
      console.error('Error resolving dispute:', error);
      toast.error('Failed to resolve dispute');
    }
  };

  const handleExportReport = async () => {
    try {
      // Fetch all data for export
      const [usersResult, transactionsResult] = await Promise.all([
        supabase.from('profiles').select('*'),
        supabase.from('escrow_orders').select(`
          *,
          customer:profiles!escrow_orders_customer_id_fkey(phasion_name, email),
          designer:profiles!escrow_orders_designer_id_fkey(phasion_name, email)
        `)
      ]);

      const users = usersResult.data || [];
      const transactions = transactionsResult.data || [];

      // Transform data for export
      const exportData = {
        users: users.map(user => ({
          ...user,
          orders_count: transactions.filter(t => t.customer_id === user.id).length,
          revenue: transactions
            .filter(t => t.customer_id === user.id)
            .reduce((sum, t) => sum + (t.amount || 0), 0)
        })),
        transactions: transactions.map(t => ({
          id: t.id,
          type: t.status === 'paid' ? 'payment' : 'pending',
          amount: t.amount,
          status: t.status,
          date: t.created_at,
          user: t.customer?.phasion_name || 'Unknown',
          orderId: t.id,
          method: t.currency === 'SOL' ? 'Solana' : 'USDC',
          currency: t.currency,
          customer: t.customer,
          designer: t.designer
        })),
        stats: {
          ...stats,
          vaultBalanceSOL: stats.vaultBalanceSOL,
          vaultBalanceUSDC: stats.vaultBalanceUSDC
        }
      };

      await exportToPDF(exportData);
      toast.success('Report exported successfully');
    } catch (error: any) {
      console.error('Error exporting report:', error);
      toast.error('Failed to export report');
    }
  };


  const getOrderStatusColor = (status: string) => {
  switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'shipped': return 'bg-blue-100 text-blue-800';
      case 'delivered': return 'bg-purple-100 text-purple-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Admin Dashboard Header */}
      <section className="bg-gradient-to-r from-primary/10 to-secondary/10 py-8">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
          >
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                Admin Dashboard
              </h1>
              <p className="text-xl text-muted-foreground">
                Platform Management & Monitoring
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex items-center gap-2" onClick={handleExportReport}>
                <Download className="h-4 w-4" />
                Export Report
              </Button>
              <Button className="btn-hero" asChild>
                <Link to="/analytics">
              <BarChart3 className="h-4 w-4 mr-2" />
                  Analytics
                </Link>
            </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="container-custom py-8">
          {/* Stats Overview */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
                >
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                    <p className="text-2xl font-bold">{stats.totalAllUsers}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
                <div className="mt-2">
                  <Badge variant="secondary">+{stats.monthlyGrowth}% this month</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Designers</p>
                    <p className="text-2xl font-bold">{stats.totalDesigners}</p>
                  </div>
                  <Shield className="h-8 w-8 text-green-600" />
                </div>
                <div className="mt-2">
                  <Badge variant="secondary">Active</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                    <p className="text-2xl font-bold">{stats.totalOrders}</p>
                  </div>
                  <ShoppingBag className="h-8 w-8 text-purple-600" />
                </div>
                <div className="mt-2">
                  <Badge variant="secondary">${stats.totalRevenue.toLocaleString()} revenue</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Vault Balance</p>
                    <div className="space-y-1">
                      <p className="text-lg font-bold text-blue-600">
                        {stats.vaultBalanceSOL.toFixed(4)} SOL
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {stats.vaultBalanceUSDC.toFixed(2)} USDC
                      </p>
                    </div>
                  </div>
                  <CreditCard className="h-8 w-8 text-orange-600" />
                </div>
                <div className="mt-2">
                  <Badge variant="secondary">Protected funds</Badge>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Main Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="orders">Order Management</TabsTrigger>
              <TabsTrigger value="disputes">Disputes</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Orders */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Recent Orders
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {orders.slice(0, 5).map((order) => (
                        <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{order.cloth?.name || 'Unknown Item'}</p>
                            <p className="text-sm text-muted-foreground">
                              {order.customer?.phasion_name || order.customer?.full_name} → {order.designer?.phasion_name || order.designer?.full_name}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge className={getOrderStatusColor(order.status)}>
                              {order.status}
                            </Badge>
                            <p className="text-sm font-medium">${order.amount} {order.currency}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Pending Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      Pending Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">

                      <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Flag className="h-5 w-5 text-red-600" />
                          <div>
                            <p className="font-medium">Active Disputes</p>
                            <p className="text-sm text-muted-foreground">{stats.activeDisputes} open</p>
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setActiveTab("disputes")}
                        >
                          Resolve
                        </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
            </div>
            </TabsContent>


            {/* Order Management Tab */}
            <TabsContent value="orders" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Order Management</CardTitle>
                  <CardDescription>
                    Monitor and manage all platform orders
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">{order.cloth?.name || 'Unknown Item'}</p>
                          <p className="text-sm text-muted-foreground">
                            Order #{order.id.slice(0, 8)} • {new Date(order.created_at).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {order.customer?.phasion_name} → {order.designer?.phasion_name}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge className={getOrderStatusColor(order.status)}>
                            {order.status}
                          </Badge>
                          <p className="text-sm font-medium">${order.amount} {order.currency}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Disputes Tab */}
            <TabsContent value="disputes" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Dispute Resolution</CardTitle>
                  <CardDescription>
                    Resolve conflicts between users and designers
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {disputes.map((dispute) => (
                      <div key={dispute.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="font-medium">Dispute #{dispute.id.slice(0, 8)}</p>
                            <p className="text-sm text-muted-foreground">
                              {dispute.order?.customer?.phasion_name} vs {dispute.order?.designer?.phasion_name}
                            </p>
                          </div>
                          <Badge variant="destructive">Open</Badge>
                        </div>
                        <p className="text-sm mb-3">{dispute.reason}</p>
                        <p className="text-xs text-muted-foreground mb-3">
                          Description: {dispute.description}
                        </p>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4 mr-1" />
                            Review Details
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => handleDisputeResolution(dispute.id, 'Resolved in favor of customer', 'customer')}
                          >
                            <DollarSign className="h-4 w-4 mr-1" />
                            Refund Customer
                          </Button>
                          <Button 
                            size="sm" 
                            variant="default"
                            onClick={() => handleDisputeResolution(dispute.id, 'Resolved in favor of designer', 'designer')}
                          >
                            <Package className="h-4 w-4 mr-1" />
                            Release to Designer
                          </Button>
                        </div>
                  </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
          </Tabs>
      </div>
    </div>
  );
};