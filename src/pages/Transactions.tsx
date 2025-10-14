import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Filter, Download, Eye, CheckCircle, XCircle, Clock, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface Transaction {
  id: string;
  type: string;
  amount: number;
  status: string;
  date: string;
  user: string;
  orderId: string;
  method: string;
  customer?: {
    phasion_name: string;
    email: string;
  };
  designer?: {
    phasion_name: string;
    email: string;
  };
  cloth?: {
    name: string;
    price: number;
  };
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "paid":
      return "bg-green-100 text-green-800";
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "processing":
      return "bg-blue-100 text-blue-800";
    case "failed":
      return "bg-red-100 text-red-800";
    case "cancelled":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getTypeColor = (type: string) => {
  switch (type) {
    case "payment":
      return "bg-green-100 text-green-800";
    case "refund":
      return "bg-orange-100 text-orange-800";
    case "escrow_release":
      return "bg-blue-100 text-blue-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export const Transactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setIsLoading(true);
      
      // Fetch escrow orders with related data
      const { data: ordersData, error: ordersError } = await supabase
        .from('escrow_orders')
        .select(`
          id,
          amount,
          status,
          created_at,
          payment_method,
          currency,
          vault_transaction,
          customer:profiles!escrow_orders_customer_id_fkey(phasion_name, email),
          designer:profiles!escrow_orders_designer_id_fkey(phasion_name, email),
          cloth:clothes(name, price)
        `)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Transform orders into transactions
      const transformedTransactions = (ordersData || []).map((order: any) => ({
        id: order.id,
        type: order.status === 'paid' ? 'payment' : 'pending',
        amount: order.amount,
        status: order.status,
        date: order.created_at,
        user: order.customer?.phasion_name || 'Unknown',
        orderId: order.id,
        method: order.payment_method === 'solana' ? 'Solana' : 'Stripe',
        customer: order.customer,
        designer: order.designer,
        cloth: order.cloth
      }));

      setTransactions(transformedTransactions);
    } catch (error: any) {
      console.error('Error fetching transactions:', error);
      toast.error('Failed to load transactions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTransactionAction = async (transactionId: string, action: 'approve' | 'reject') => {
    try {
      const { error } = await supabase
        .from('escrow_orders')
        .update({ 
          status: action === 'approve' ? 'paid' : 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', transactionId);

      if (error) throw error;

      toast.success(`Transaction ${action}d successfully`);
      fetchTransactions(); // Refresh data
    } catch (error: any) {
      console.error(`Error ${action}ing transaction:`, error);
      toast.error(`Failed to ${action} transaction`);
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = 
      transaction.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.orderId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || transaction.status === filterStatus;
    
    return matchesSearch && matchesStatus;
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
                Transaction Management
              </h1>
              <p className="text-xl text-muted-foreground">
                Monitor and manage all platform transactions ({transactions.length} total)
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
              <Button className="btn-hero">
                <Filter className="h-4 w-4 mr-2" />
                Analytics
              </Button>
            </div>
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
                    placeholder="Search transactions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={filterStatus === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterStatus("all")}
                >
                  All
                </Button>
                <Button
                  variant={filterStatus === "paid" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterStatus("paid")}
                >
                  Completed
                </Button>
                <Button
                  variant={filterStatus === "pending" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterStatus("pending")}
                >
                  Pending
                </Button>
                <Button
                  variant={filterStatus === "cancelled" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterStatus("cancelled")}
                >
                  Cancelled
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Transactions ({filteredTransactions.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Designer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-mono text-sm">
                        {transaction.id.substring(0, 8)}...
                      </TableCell>
                      <TableCell>
                        <Badge className={getTypeColor(transaction.type)}>
                          {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        ${transaction.amount.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(transaction.status)}>
                          {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{transaction.customer?.phasion_name || 'Unknown'}</p>
                          <p className="text-sm text-muted-foreground">{transaction.customer?.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{transaction.designer?.phasion_name || 'Unknown'}</p>
                          <p className="text-sm text-muted-foreground">{transaction.designer?.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(transaction.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {transaction.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleTransactionAction(transaction.id, 'approve')}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleTransactionAction(transaction.id, 'reject')}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
                          <Button size="sm" variant="ghost">
                            <Eye className="h-4 w-4" />
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