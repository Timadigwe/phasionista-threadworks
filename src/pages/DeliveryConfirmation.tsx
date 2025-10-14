import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle, Package, Truck, Camera, Star, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { useParams, useNavigate } from "react-router-dom";
import { escrowService } from "@/services/escrowService";
import { toast } from "sonner";

interface OrderDetails {
  id: string;
  cloth_name: string;
  designer_name: string;
  amount: number;
  currency: string;
  status: string;
  delivery_address: string;
  special_instructions?: string;
  created_at: string;
  designer_proof?: {
    shipping_tracking?: string;
    delivery_photos?: string[];
    completion_notes?: string;
  };
}

export const DeliveryConfirmation = () => {
  const { user } = useAuth();
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirming, setIsConfirming] = useState(false);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [deliveryPhotos, setDeliveryPhotos] = useState<File[]>([]);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) return;
      
      try {
        setIsLoading(true);
        // Fetch order details from escrow service
        const orderData = await escrowService.getOrderDetails(orderId);
        setOrder(orderData);
      } catch (error: any) {
        console.error('Error fetching order:', error);
        toast.error('Failed to load order details');
        navigate('/orders');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, navigate]);

  const handleDeliveryConfirmation = async () => {
    if (!order || !user) return;

    try {
      setIsConfirming(true);
      
      // Confirm delivery and release funds
      await escrowService.confirmDelivery(order.id);
      
      // If rating and review provided, save them
      if (rating > 0) {
        // Save review (would integrate with reviews system)
        console.log('Saving review:', { rating, review });
      }

      toast.success('Delivery confirmed! Payment has been released to the designer.');
      navigate('/orders');
    } catch (error: any) {
      console.error('Error confirming delivery:', error);
      toast.error('Failed to confirm delivery. Please try again.');
    } finally {
      setIsConfirming(false);
    }
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setDeliveryPhotos(prev => [...prev, ...files]);
  };

  const removePhoto = (index: number) => {
    setDeliveryPhotos(prev => prev.filter((_, i) => i !== index));
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-background to-muted">
          <div className="container-custom py-8">
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!order) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-background to-muted">
          <div className="container-custom py-8">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-4">Order Not Found</h1>
              <p className="text-muted-foreground mb-6">The order you're looking for doesn't exist.</p>
              <Button onClick={() => navigate('/orders')}>Back to Orders</Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-background to-muted">
        <div className="container-custom py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-4xl mx-auto"
          >
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                Confirm Delivery
              </h1>
              <p className="text-xl text-muted-foreground">
                Review your order and confirm delivery to release payment
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Order Details */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Order Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-lg">{order.cloth_name}</h3>
                      <p className="text-muted-foreground">by {order.designer_name}</p>
                    </div>
                    
                    <div className="flex justify-between">
                      <span>Amount:</span>
                      <span className="font-semibold">
                        {order.amount} {order.currency}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <Badge variant="secondary">{order.status}</Badge>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium">Delivery Address:</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {order.delivery_address}
                      </p>
                    </div>
                    
                    {order.special_instructions && (
                      <div>
                        <Label className="text-sm font-medium">Special Instructions:</Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          {order.special_instructions}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Designer Proof */}
                {order.designer_proof && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Truck className="h-5 w-5" />
                        Designer Proof
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {order.designer_proof.shipping_tracking && (
                        <div>
                          <Label className="text-sm font-medium">Tracking Number:</Label>
                          <p className="text-sm text-muted-foreground mt-1">
                            {order.designer_proof.shipping_tracking}
                          </p>
                        </div>
                      )}
                      
                      {order.designer_proof.completion_notes && (
                        <div>
                          <Label className="text-sm font-medium">Completion Notes:</Label>
                          <p className="text-sm text-muted-foreground mt-1">
                            {order.designer_proof.completion_notes}
                          </p>
                        </div>
                      )}
                      
                      {order.designer_proof.delivery_photos && order.designer_proof.delivery_photos.length > 0 && (
                        <div>
                          <Label className="text-sm font-medium">Delivery Photos:</Label>
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            {order.designer_proof.delivery_photos.map((photo, index) => (
                              <img
                                key={index}
                                src={photo}
                                alt={`Delivery photo ${index + 1}`}
                                className="w-full h-24 object-cover rounded-lg"
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Confirmation Form */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5" />
                      Delivery Confirmation
                    </CardTitle>
                    <CardDescription>
                      Confirm that you have received your order in good condition
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Rating */}
                    <div>
                      <Label className="text-base font-medium">Rate Your Experience</Label>
                      <div className="flex gap-1 mt-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setRating(star)}
                            className={`p-1 ${
                              star <= rating
                                ? 'text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          >
                            <Star className="h-6 w-6 fill-current" />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Review */}
                    <div>
                      <Label htmlFor="review" className="text-base font-medium">
                        Review (Optional)
                      </Label>
                      <Textarea
                        id="review"
                        placeholder="Share your experience with this designer..."
                        value={review}
                        onChange={(e) => setReview(e.target.value)}
                        className="mt-2"
                        rows={4}
                      />
                    </div>

                    {/* Delivery Photos */}
                    <div>
                      <Label className="text-base font-medium">Delivery Photos (Optional)</Label>
                      <div className="mt-2">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handlePhotoUpload}
                          className="hidden"
                          id="delivery-photos"
                        />
                        <label
                          htmlFor="delivery-photos"
                          className="flex items-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary transition-colors"
                        >
                          <Camera className="h-5 w-5" />
                          <span>Add photos of your delivered item</span>
                        </label>
                      </div>
                      
                      {deliveryPhotos.length > 0 && (
                        <div className="grid grid-cols-2 gap-2 mt-3">
                          {deliveryPhotos.map((photo, index) => (
                            <div key={index} className="relative">
                              <img
                                src={URL.createObjectURL(photo)}
                                alt={`Delivery photo ${index + 1}`}
                                className="w-full h-24 object-cover rounded-lg"
                              />
                              <button
                                onClick={() => removePhoto(index)}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Warning */}
                    <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-amber-800">
                          Important: Once you confirm delivery, payment will be released to the designer.
                        </p>
                        <p className="text-sm text-amber-700 mt-1">
                          Make sure you have received your item in the expected condition.
                        </p>
                      </div>
                    </div>

                    {/* Confirm Button */}
                    <Button
                      onClick={handleDeliveryConfirmation}
                      disabled={isConfirming}
                      className="w-full"
                      size="lg"
                    >
                      {isConfirming ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Confirming Delivery...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Confirm Delivery & Release Payment
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};
