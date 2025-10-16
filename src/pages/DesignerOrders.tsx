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
  Search,
  Eye,
  Edit,
  Ship,
  X,
  Camera,
  Upload,
  Image as ImageIcon
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { escrowService, EscrowOrder } from "@/services/escrowService";
import { toast } from "sonner";

const statusConfig = {
  pending: { label: 'Pending Payment', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  paid: { label: 'Paid - Ready to Ship', color: 'bg-blue-100 text-blue-800', icon: Package },
  shipped: { label: 'Shipped', color: 'bg-purple-100 text-purple-800', icon: Truck },
  delivered: { label: 'Delivered', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  released: { label: 'Payment Released', color: 'bg-gray-100 text-gray-800', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: AlertCircle }
};

export const DesignerOrders = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<EscrowOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<EscrowOrder | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [shippingNotes, setShippingNotes] = useState('');
  const [shippingPhotos, setShippingPhotos] = useState<string[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        const designerOrders = await escrowService.getDesignerOrders(user.id);
        setOrders(designerOrders);
      } catch (error) {
        console.error('Error fetching designer orders:', error);
        toast.error('Failed to load orders');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [user]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search functionality can be implemented here
  };

  const handlePhotoUpload = async (files: FileList) => {
    setUploadingPhotos(true);
    try {
      const photoPromises = Array.from(files).map(async (file) => {
        // Convert file to base64
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const base64String = e.target?.result as string;
            resolve(base64String);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      });

      const base64Photos = await Promise.all(photoPromises);
      setShippingPhotos(prev => [...prev, ...base64Photos]);
      toast.success(`${files.length} photo(s) uploaded successfully`);
    } catch (error) {
      console.error('Error uploading photos:', error);
      toast.error('Failed to upload photos');
    } finally {
      setUploadingPhotos(false);
    }
  };

  const removePhoto = (index: number) => {
    setShippingPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string, trackingInfo?: string) => {
    try {
      setIsUpdating(true);
      
      if (newStatus === 'shipped' && trackingInfo) {
        await escrowService.updateOrderStatus(orderId, newStatus, {
          tracking_number: trackingInfo,
          shipping_notes: shippingNotes,
          shipping_photos: shippingPhotos
        });
      } else {
        await escrowService.updateOrderStatus(orderId, newStatus);
      }
      
      // Refresh orders
      const updatedOrders = await escrowService.getDesignerOrders(user?.id || '');
      setOrders(updatedOrders);
      
      toast.success(`Order status updated to ${newStatus}`);
      setSelectedOrder(null);
      setTrackingNumber('');
      setShippingNotes('');
      setShippingPhotos([]);
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         order.delivery_address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container-custom py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
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
                  <Link to="/dashboard" className="flex items-center gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Dashboard
                  </Link>
                </Button>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">My Orders</h1>
              <p className="text-xl text-muted-foreground">
                Manage your orders and track their progress
              </p>
            </div>
            <Package className="h-12 w-12 text-primary" />
          </motion.div>
        </div>
      </section>

      <div className="container-custom py-8">
        {/* Search and Filter */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search orders by ID or address..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </form>
            
            <div className="flex gap-2">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('all')}
              >
                All Orders
              </Button>
              <Button
                variant={statusFilter === 'paid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('paid')}
              >
                Ready to Ship
              </Button>
              <Button
                variant={statusFilter === 'shipped' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('shipped')}
              >
                Shipped
              </Button>
            </div>
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-6">
          {filteredOrders.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Orders Found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery || statusFilter !== 'all' 
                    ? 'No orders match your current filters.' 
                    : 'You haven\'t received any orders yet.'}
                </p>
                {!searchQuery && statusFilter === 'all' && (
                  <Button asChild>
                    <Link to="/create">Create Your First Item</Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredOrders.map((order, index) => {
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
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedOrder(order)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Manage
                          </Button>
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
                            <h4 className="font-semibold text-lg">Actions</h4>
                          </div>
                          <div className="bg-blue-50 rounded-lg p-4 space-y-3">
                            {order.status === 'paid' && (
                              <Button
                                size="sm"
                                className="w-full bg-green-600 hover:bg-green-700"
                                onClick={() => setSelectedOrder(order)}
                              >
                                <Ship className="h-4 w-4 mr-2" />
                                Mark as Shipped
                              </Button>
                            )}
                            {order.status === 'shipped' && (
                              <div className="text-center">
                                <Truck className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                                <p className="text-sm font-medium text-blue-800">
                                  Order is in transit
                                </p>
                                {order.tracking_number && (
                                  <p className="text-xs text-blue-600 mt-1">
                                    Tracking: {order.tracking_number}
                                  </p>
                                )}
                              </div>
                            )}
                            {order.status === 'delivered' && (
                              <div className="text-center">
                                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
                                <p className="text-sm font-medium text-green-800">
                                  Order delivered successfully
                                </p>
                              </div>
                            )}
                            {order.status === 'released' && (
                              <div className="text-center">
                                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
                                <p className="text-sm font-medium text-green-800">
                                  Payment released to you
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Shipping Proof Photos */}
                      {order.shipping_photos && order.shipping_photos.length > 0 && (
                        <div className="mt-6 pt-4 border-t border-muted">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                            <h4 className="font-semibold text-sm">Shipping Proof Photos</h4>
                          </div>
                          <div className="bg-orange-50 rounded-lg p-4">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                              {order.shipping_photos.map((photo, index) => (
                                <div key={index} className="relative group">
                                  <img
                                    src={photo}
                                    alt={`Shipping proof ${index + 1}`}
                                    className="w-full h-24 object-cover rounded-lg border cursor-pointer hover:opacity-80 transition-opacity"
                                    onClick={() => window.open(photo, '_blank')}
                                  />
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg flex items-center justify-center">
                                    <ImageIcon className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      {/* Order Management Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Manage Order #{selectedOrder.id.slice(0, 8)}</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setSelectedOrder(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {selectedOrder.status === 'paid' && (
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="tracking">Tracking Number *</Label>
                    <Input
                      id="tracking"
                      placeholder="Enter tracking number"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="notes">Shipping Notes</Label>
                    <Textarea
                      id="notes"
                      placeholder="Add any shipping notes or updates..."
                      value={shippingNotes}
                      onChange={(e) => setShippingNotes(e.target.value)}
                      rows={3}
                    />
                  </div>

                  {/* Photo Upload Section */}
                  <div>
                    <Label>Shipping Proof Photos *</Label>
                    <div className="mt-2">
                      <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                        <div className="text-center">
                          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground mb-2">
                            Upload photos of the packaged item or shipping receipt
                          </p>
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={(e) => e.target.files && handlePhotoUpload(e.target.files)}
                            className="hidden"
                            id="photo-upload"
                            disabled={uploadingPhotos}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => document.getElementById('photo-upload')?.click()}
                            disabled={uploadingPhotos}
                          >
                            {uploadingPhotos ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                                Uploading...
                              </>
                            ) : (
                              <>
                                <Camera className="h-4 w-4 mr-2" />
                                Upload Photos
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                      
                      {/* Display uploaded photos */}
                      {shippingPhotos.length > 0 && (
                        <div className="mt-4">
                          <p className="text-sm font-medium mb-2">Uploaded Photos ({shippingPhotos.length})</p>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {shippingPhotos.map((photo, index) => (
                              <div key={index} className="relative group">
                                <img
                                  src={photo}
                                  alt={`Shipping proof ${index + 1}`}
                                  className="w-full h-24 object-cover rounded-lg border"
                                />
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="absolute -top-2 -right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => removePhoto(index)}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleStatusUpdate(selectedOrder.id, 'shipped', trackingNumber)}
                      disabled={isUpdating || !trackingNumber.trim() || shippingPhotos.length === 0}
                      className="flex-1"
                    >
                      <Ship className="h-4 w-4 mr-2" />
                      Mark as Shipped
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedOrder(null);
                        setTrackingNumber('');
                        setShippingNotes('');
                        setShippingPhotos([]);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                  
                  {/* Validation message */}
                  {(!trackingNumber.trim() || shippingPhotos.length === 0) && (
                    <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                      <AlertCircle className="h-4 w-4 inline mr-2" />
                      Please provide both tracking number and shipping proof photos to mark as shipped.
                    </div>
                  )}
                </div>
              )}
              
              {selectedOrder.status === 'shipped' && (
                <div className="text-center">
                  <Truck className="h-12 w-12 mx-auto mb-4 text-blue-600" />
                  <h3 className="text-lg font-semibold mb-2">Order Shipped</h3>
                  <p className="text-muted-foreground mb-4">
                    This order has been shipped and is in transit.
                  </p>
                  <Button onClick={() => setSelectedOrder(null)}>
                    Close
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
