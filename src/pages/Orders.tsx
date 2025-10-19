import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Package, 
  Truck, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  ArrowLeft,
  Filter,
  Search
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { escrowService, EscrowOrder } from "@/services/escrowService";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { DisputeReportModal } from "@/components/DisputeReportModal";

const statusConfig = {
  pending: { label: 'Pending Payment', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  paid: { label: 'Paid - Processing', color: 'bg-blue-100 text-blue-800', icon: Package },
  shipped: { label: 'Shipped', color: 'bg-purple-100 text-purple-800', icon: Truck },
  delivered: { label: 'Delivered', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  released: { label: 'Completed', color: 'bg-gray-100 text-gray-800', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: AlertCircle },
  refunded: { label: 'Refunded', color: 'bg-orange-100 text-orange-800', icon: CheckCircle }
};

export const Orders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<EscrowOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [disputeModalOpen, setDisputeModalOpen] = useState(false);
  const [selectedOrderForDispute, setSelectedOrderForDispute] = useState<EscrowOrder | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        const data = await escrowService.getCustomerOrders(user.id);
        setOrders(data);
      } catch (error: any) {
        console.error('Error fetching orders:', error);
        toast.error('Failed to load orders');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [user]);

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleMarkAsDelivered = async (orderId: string) => {
    try {
      await escrowService.updateOrderStatus(orderId, 'delivered');
      setOrders(orders.map(order => 
        order.id === orderId 
          ? { ...order, status: 'delivered' as const }
          : order
      ));
      toast.success('Order marked as delivered');
    } catch (error: any) {
      console.error('Error updating order:', error);
      toast.error('Failed to update order status');
    }
  };

  const handleConfirmDelivery = async (orderId: string) => {
    try {
      // First update the order status to delivered
      await escrowService.updateOrderStatus(orderId, 'delivered');
      
      // Then release the funds to the designer
      await escrowService.releaseFunds(orderId);
      
      setOrders(orders.map(order => 
        order.id === orderId 
          ? { ...order, status: 'delivered' as const }
          : order
      ));
      toast.success('Delivery confirmed! Payment has been released to the designer.');
    } catch (error: any) {
      console.error('Error confirming delivery:', error);
      toast.error('Failed to confirm delivery');
    }
  };

  const handleRaiseAlarm = async (orderId: string) => {
    try {
      // Create a dispute/alarm record
      await escrowService.createDispute({
        order_id: orderId,
        customer_id: user?.id || '',
        reason: 'delivery_issue',
        description: 'Customer reported delivery issue - order not received',
        status: 'pending'
      });
      
      toast.success('Issue reported to admin. We will investigate and get back to you.');
    } catch (error: any) {
      console.error('Error raising alarm:', error);
      toast.error('Failed to report issue');
    }
  };

  const handleOpenDisputeModal = (order: EscrowOrder) => {
    setSelectedOrderForDispute(order);
    setDisputeModalOpen(true);
  };

  const handleCloseDisputeModal = () => {
    setDisputeModalOpen(false);
    setSelectedOrderForDispute(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="bg-gradient-to-r from-primary/10 to-secondary/10 py-12">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="flex justify-center mb-6">
              <Button variant="ghost" size="sm" asChild className="hover:bg-muted/50">
                <Link to="/dashboard" className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Dashboard
                </Link>
              </Button>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              My Orders
            </h1>
            <p className="text-xl text-muted-foreground">
              Track your orders and manage deliveries with buyer protection
            </p>
          </motion.div>
        </div>
      </section>

      <div className="container-custom py-8">
        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search orders..."
                className="pl-10 pr-4"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Status Filter */}
            <div className="flex gap-2">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('all')}
              >
                All
              </Button>
              {Object.keys(statusConfig).map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter(status)}
                >
                  {statusConfig[status as keyof typeof statusConfig].label}
                </Button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Orders List */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading orders...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredOrders.map((order, index) => {
              const statusInfo = statusConfig[order.status];
              const StatusIcon = statusInfo.icon;
              
              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="hover:shadow-xl transition-all duration-300 border-l-4 border-l-primary/20 hover:border-l-primary">
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 bg-gradient-to-br from-primary/10 to-primary/20 rounded-xl flex items-center justify-center">
                            <Package className="h-7 w-7 text-primary" />
                          </div>
                          <div className="space-y-1">
                            <CardTitle className="text-xl font-bold">Order #{order.id.slice(0, 8)}</CardTitle>
                            <p className="text-sm text-muted-foreground">
                              {new Date(order.created_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{order.amount} {order.currency}</span>
                              <span className="text-xs text-muted-foreground">•</span>
                              <span className="text-xs text-muted-foreground">{order.currency} Payment</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className={`${statusInfo.color} flex items-center gap-2 px-3 py-1.5 font-medium`}>
                            <StatusIcon className="h-4 w-4" />
                            {statusInfo.label}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Order Info */}
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-primary rounded-full"></div>
                            <h4 className="font-semibold text-lg">Order Details</h4>
                          </div>
                          <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">Amount:</span>
                              <span className="font-bold text-lg">{order.amount} {order.currency}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">Payment Method:</span>
                              <span className="font-medium">{order.currency}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">Order ID:</span>
                              <span className="font-mono text-sm bg-background px-2 py-1 rounded">{order.id.slice(0, 8)}...</span>
                            </div>
                          </div>
                        </div>

                        {/* Delivery Info */}
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <h4 className="font-semibold text-lg">Delivery</h4>
                          </div>
                          <div className="bg-green-50 rounded-lg p-4 space-y-3">
                            <div>
                              <span className="text-sm font-medium text-green-800">Delivery Address:</span>
                              <p className="text-sm mt-1 break-words text-green-700 bg-white/50 px-2 py-1 rounded">{order.delivery_address}</p>
                            </div>
                            {order.special_instructions && (
                              <div>
                                <span className="text-sm font-medium text-green-800">Special Instructions:</span>
                                <p className="text-sm mt-1 text-green-700 bg-white/50 px-2 py-1 rounded">{order.special_instructions}</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <h4 className="font-semibold text-lg">Status & Actions</h4>
                          </div>
                          <div className="bg-blue-50 rounded-lg p-4 space-y-3">
                            {order.status === 'delivered' && (
                              <div className="text-center">
                                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
                                <p className="text-sm font-medium text-green-800">
                                  Order delivered successfully
                                </p>
                                <p className="text-xs text-green-600 mt-1">
                                  Waiting for admin to release payment
                                </p>
                              </div>
                            )}
                            {order.status === 'paid' && (
                              <div className="text-center">
                                <Clock className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                                <p className="text-sm font-medium text-blue-800">
                                  Waiting for designer to ship your order
                                </p>
                              </div>
                            )}
                            {order.status === 'shipped' && (
                              <div className="space-y-3">
                                <div className="text-center">
                                  <Truck className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                                  <p className="text-sm font-medium text-blue-800">
                                    Your order is on the way
                                  </p>
                                  {order.tracking_number && (
                                    <p className="text-xs text-blue-600 mt-1">
                                      Tracking: {order.tracking_number}
                                    </p>
                                  )}
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    className="flex-1 bg-green-600 hover:bg-green-700"
                                    onClick={() => handleConfirmDelivery(order.id)}
                                  >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Confirm Delivery
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    className="flex-1"
                                    onClick={() => handleOpenDisputeModal(order)}
                                  >
                                    <AlertCircle className="h-4 w-4 mr-2" />
                                    Report Issue
                                  </Button>
                                </div>
                              </div>
                            )}
                            {order.status === 'released' && (
                              <div className="text-center">
                                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
                                <p className="text-sm font-medium text-green-800">
                                  Payment released to designer
                                </p>
                              </div>
                            )}
                            {order.status === 'refunded' && (
                              <div className="text-center">
                                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                                <p className="text-sm font-medium text-orange-800">
                                  Order refunded
                                </p>
                                <p className="text-xs text-orange-600 mt-1">
                                  Your payment has been refunded
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Transaction Info */}
                      {(order.vault_transaction || order.release_transaction) && (
                        <div className="mt-6 pt-4 border-t border-muted">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                            <h4 className="font-semibold text-sm">Blockchain Transactions</h4>
                          </div>
                          <div className="bg-purple-50 rounded-lg p-4 space-y-3">
                            {order.vault_transaction && (
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-purple-800">Payment Transaction:</span>
                                <a 
                                  href={`https://solscan.io/tx/${order.vault_transaction}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-mono text-sm bg-white/70 px-2 py-1 rounded text-purple-600 hover:text-purple-800 hover:bg-white transition-colors"
                                >
                                  {order.vault_transaction.slice(0, 16)}...
                                </a>
                              </div>
                            )}
                            {order.release_transaction && (
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-purple-800">Release Transaction:</span>
                                <a 
                                  href={`https://solscan.io/tx/${order.release_transaction}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-mono text-sm bg-white/70 px-2 py-1 rounded text-purple-600 hover:text-purple-800 hover:bg-white transition-colors"
                                >
                                  {order.release_transaction.slice(0, 16)}...
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredOrders.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              {orders.length === 0 ? 'No orders yet' : 'No orders match your filters'}
            </h3>
            <p className="text-muted-foreground mb-6">
              {orders.length === 0 
                ? 'Start shopping to see your orders here'
                : 'Try adjusting your search or filter criteria'
              }
            </p>
            <div className="flex gap-3 justify-center">
              {orders.length === 0 ? (
                <Button asChild>
                  <Link to="/clothes">Browse Clothes</Link>
                </Button>
              ) : (
                <Button onClick={() => { setSearchQuery(''); setStatusFilter('all'); }}>
                  Clear Filters
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* Dispute Report Modal */}
      <DisputeReportModal
        isOpen={disputeModalOpen}
        onClose={handleCloseDisputeModal}
        orderId={selectedOrderForDispute?.id || ''}
        orderDetails={selectedOrderForDispute ? {
          id: selectedOrderForDispute.id,
          amount: selectedOrderForDispute.amount,
          currency: selectedOrderForDispute.currency,
          status: selectedOrderForDispute.status,
          cloth_name: 'Cloth Item', // You might want to fetch this from the order data
          designer_name: 'Designer' // You might want to fetch this from the order data
        } : undefined}
      />
    </div>
  );
};