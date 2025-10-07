import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  ShoppingBag, 
  CreditCard, 
  Shield, 
  CheckCircle,
  AlertCircle,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { supabaseApi } from "@/services/supabaseApi";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface ClothDetails {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  size: string;
  color: string;
  images: string[];
  designer: {
    id: string;
    phasion_name: string;
    full_name?: string;
    avatar_url?: string;
    solana_wallet?: string;
  };
}

interface OrderFormData {
  quantity: number;
  deliveryAddress: string;
  specialInstructions: string;
  paymentMethod: 'solana' | 'escrow';
}

export const Order = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [cloth, setCloth] = useState<ClothDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState<OrderFormData>({
    quantity: 1,
    deliveryAddress: '',
    specialInstructions: '',
    paymentMethod: 'escrow'
  });

  useEffect(() => {
    const fetchCloth = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        const data = await supabaseApi.getClothById(id);
        setCloth(data);
      } catch (err: any) {
        console.error('Error fetching cloth:', err);
        toast.error('Failed to load item details');
        navigate('/clothes');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCloth();
  }, [id, navigate]);

  const handleOrder = async () => {
    if (!cloth || !user) return;

    try {
      setIsProcessing(true);
      
      // For now, we'll create a simple order record
      // In a real implementation, this would integrate with Solana payments and escrow
      const orderData = {
        cloth_id: cloth.id,
        customer_id: user.id,
        designer_id: cloth.designer.id,
        quantity: formData.quantity,
        total_amount: cloth.price * formData.quantity,
        delivery_address: formData.deliveryAddress,
        special_instructions: formData.specialInstructions,
        payment_method: formData.paymentMethod,
        status: 'pending'
      };

      // Simulate order creation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success('Order placed successfully! You will receive a confirmation email shortly.');
      navigate('/orders');
    } catch (error: any) {
      console.error('Error placing order:', error);
      toast.error(`Failed to place order: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container-custom py-8">
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading order details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!cloth) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container-custom py-8">
          <div className="text-center py-20">
            <div className="text-6xl mb-4">👗</div>
            <h3 className="text-xl font-semibold mb-2">Item not found</h3>
            <p className="text-muted-foreground mb-6">
              The item you're looking for doesn't exist or has been removed.
            </p>
            <Button asChild>
              <button onClick={() => navigate('/clothes')}>Back to Clothes</button>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const totalAmount = cloth.price * formData.quantity;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-8">
        <div className="container-custom">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="sm" onClick={() => navigate('/clothes')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Clothes
            </Button>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Place Your Order
            </h1>
            <p className="text-xl text-muted-foreground">
              Complete your purchase with secure Solana payments
            </p>
          </motion.div>
        </div>
      </div>

      <div className="container-custom py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Details */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <div className="w-20 h-20 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                    {cloth.images && cloth.images.length > 0 ? (
                      <img 
                        src={cloth.images[0]} 
                        alt={cloth.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <div className="text-2xl">👗</div>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{cloth.name}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">{cloth.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={cloth.designer.avatar_url} />
                        <AvatarFallback>
                          {cloth.designer.phasion_name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-muted-foreground">
                        by {cloth.designer.phasion_name}
                      </span>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Price per item</span>
                    <span>${cloth.price}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Quantity</span>
                    <span>{formData.quantity}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Size</span>
                    <span>{cloth.size}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Color</span>
                    <span>{cloth.color}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span>${totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Form */}
            <Card>
              <CardHeader>
                <CardTitle>Order Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.quantity}
                    onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Delivery Address</label>
                  <textarea
                    value={formData.deliveryAddress}
                    onChange={(e) => setFormData(prev => ({ ...prev, deliveryAddress: e.target.value }))}
                    placeholder="Enter your delivery address..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary h-20 resize-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Special Instructions (Optional)</label>
                  <textarea
                    value={formData.specialInstructions}
                    onChange={(e) => setFormData(prev => ({ ...prev, specialInstructions: e.target.value }))}
                    placeholder="Any special instructions for the designer..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary h-20 resize-none"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment & Checkout */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div 
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      formData.paymentMethod === 'escrow' 
                        ? 'border-primary bg-primary/5' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setFormData(prev => ({ ...prev, paymentMethod: 'escrow' }))}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 border-2 rounded-full flex items-center justify-center">
                        {formData.paymentMethod === 'escrow' && (
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium">Escrow Payment (Recommended)</h4>
                        <p className="text-sm text-muted-foreground">
                          Secure payment held in escrow until delivery confirmation
                        </p>
                      </div>
                    </div>
                  </div>

                  <div 
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      formData.paymentMethod === 'solana' 
                        ? 'border-primary bg-primary/5' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setFormData(prev => ({ ...prev, paymentMethod: 'solana' }))}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 border-2 rounded-full flex items-center justify-center">
                        {formData.paymentMethod === 'solana' && (
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium">Direct Solana Payment</h4>
                        <p className="text-sm text-muted-foreground">
                          Direct payment to designer's Solana wallet
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900">Secure Payment</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        Your payment is protected by blockchain technology and smart contracts.
                        Funds are only released to the designer after delivery confirmation.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Designer Info */}
            <Card>
              <CardHeader>
                <CardTitle>Designer Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={cloth.designer.avatar_url} />
                    <AvatarFallback>
                      {cloth.designer.phasion_name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-semibold">{cloth.designer.phasion_name}</h4>
                    <p className="text-sm text-muted-foreground">Fashion Designer</p>
                    {cloth.designer.solana_wallet && (
                      <p className="text-xs text-muted-foreground font-mono">
                        Wallet: {cloth.designer.solana_wallet.slice(0, 8)}...{cloth.designer.solana_wallet.slice(-8)}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Place Order Button */}
            <Button 
              size="lg" 
              className="w-full btn-hero"
              onClick={handleOrder}
              disabled={isProcessing || !formData.deliveryAddress.trim()}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Processing Order...
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Place Order - ${totalAmount.toFixed(2)}
                </>
              )}
            </Button>

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                By placing this order, you agree to our terms of service and privacy policy.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
