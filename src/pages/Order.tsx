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
  Loader2,
  Coins,
  DollarSign,
  Wallet,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { supabaseApi } from "@/services/supabaseApi";
import { escrowService } from "@/services/escrowService";
import { useAuth } from "@/contexts/AuthContext";
import { useSolanaWallet } from "@/services/solanaWallet";
import { Transaction, Connection, PublicKey, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { createTransferInstruction, getAssociatedTokenAddress, createAssociatedTokenAccountInstruction } from "@solana/spl-token";
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
  paymentMethod: 'solana' | 'stripe';
  currency: 'SOL' | 'USDC';
}

export const Order = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { publicKey, connected, connect, disconnect, wallet } = useSolanaWallet();
  const [cloth, setCloth] = useState<ClothDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [solPrice, setSolPrice] = useState<number>(0);
  const [isLoadingPrice, setIsLoadingPrice] = useState(false);
  const [formData, setFormData] = useState<OrderFormData>({
    quantity: 1,
    deliveryAddress: '',
    specialInstructions: '',
    paymentMethod: 'solana',
    currency: 'SOL'
  });

  // Fetch SOL price
  const fetchSolPrice = async () => {
    try {
      setIsLoadingPrice(true);
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
      const data = await response.json();
      setSolPrice(data.solana.usd);
    } catch (error) {
      console.error('Error fetching SOL price:', error);
      // Fallback price if API fails
      setSolPrice(100);
    } finally {
      setIsLoadingPrice(false);
    }
  };

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
    fetchSolPrice();
  }, [id, navigate]);

  // Calculate SOL equivalent price
  const getSolPrice = () => {
    if (!cloth || solPrice === 0) return 0;
    return (cloth.price * formData.quantity) / solPrice;
  };

  // Create Solana transaction on client side
  const createSolanaTransaction = async (
    customerWallet: string,
    amount: number,
    currency: 'SOL' | 'USDC'
  ): Promise<Transaction> => {
    const connection = new Connection(import.meta.env.VITE_SOLANA_RPC_URL || 'https://api.devnet.solana.com', 'confirmed');
    const customerPubkey = new PublicKey(customerWallet);
    const vaultPubkey = new PublicKey(import.meta.env.VITE_VAULT_WALLET);
    
    if (!import.meta.env.VITE_VAULT_WALLET) {
      throw new Error('Vault wallet not configured');
    }

    const transaction = new Transaction();

    if (currency === 'SOL') {
      // SOL payment
      const lamports = Math.floor(amount * LAMPORTS_PER_SOL);
      
      console.log('SOL Transaction Details:', {
        solAmount: amount,
        lamports: lamports,
        lamportsPerSol: LAMPORTS_PER_SOL,
        customerWallet: customerPubkey.toString(),
        vaultWallet: vaultPubkey.toString()
      });
      
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: customerPubkey,
          toPubkey: vaultPubkey,
          lamports
        })
      );
    } else {
      // USDC payment
      const usdcMint = new PublicKey(import.meta.env.VITE_USDC_MINT || 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
      const customerTokenAccount = await getAssociatedTokenAddress(usdcMint, customerPubkey);
      const vaultTokenAccount = await getAssociatedTokenAddress(usdcMint, vaultPubkey);

      // Check if vault has USDC token account, create if not
      const vaultTokenAccountInfo = await connection.getAccountInfo(vaultTokenAccount);
      if (!vaultTokenAccountInfo) {
        transaction.add(
          createAssociatedTokenAccountInstruction(
            customerPubkey, // payer
            vaultTokenAccount, // ata
            vaultPubkey, // owner
            usdcMint // mint
          )
        );
      }

      // Add transfer instruction
      const usdcAmount = Math.floor(amount * 1e6); // USDC has 6 decimals
      
      console.log('USDC Transaction Details:', {
        usdcAmount: amount,
        usdcAmountWithDecimals: usdcAmount,
        customerTokenAccount: customerTokenAccount.toString(),
        vaultTokenAccount: vaultTokenAccount.toString(),
        customerWallet: customerPubkey.toString(),
        vaultWallet: vaultPubkey.toString()
      });
      
      transaction.add(
        createTransferInstruction(
          customerTokenAccount,
          vaultTokenAccount,
          customerPubkey,
          usdcAmount
        )
      );
    }

    // Get recent blockhash and set transaction properties
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = customerPubkey;

    return transaction;
  };

  const handleOrder = async () => {
    if (!cloth || !user) return;

    try {
      setIsProcessing(true);
      
      if (formData.paymentMethod === 'solana') {
        // Solana payment flow
        if (!connected || !publicKey) {
          toast.error('Please connect your Solana wallet first');
          return;
        }

        // Create escrow order
        const escrowOrder = await escrowService.createEscrowOrder({
          customer_id: user.id,
          designer_id: cloth.designer.id,
          cloth_id: cloth.id,
          amount: cloth.price * formData.quantity,
          currency: formData.currency,
          delivery_address: formData.deliveryAddress,
          special_instructions: formData.specialInstructions
        });

        // Generate payment request
        const paymentRequest = await escrowService.generatePaymentRequest(escrowOrder.id);
        
        // Calculate the correct amount based on currency
        let transactionAmount: number;
        if (paymentRequest.currency === 'SOL') {
          // Convert USD amount to SOL using current price
          transactionAmount = paymentRequest.amount / solPrice;
          console.log('SOL Payment Conversion:', {
            usdAmount: paymentRequest.amount,
            solPrice: solPrice,
            solAmount: transactionAmount,
            currency: paymentRequest.currency
          });
        } else {
          // USDC amount is the same as USD amount
          transactionAmount = paymentRequest.amount;
          console.log('USDC Payment:', {
            usdAmount: paymentRequest.amount,
            usdcAmount: transactionAmount,
            currency: paymentRequest.currency
          });
        }

        // Create transaction on client side for better wallet compatibility
        const transaction = await createSolanaTransaction(
          publicKey.toString(),
          transactionAmount,
          paymentRequest.currency
        );
        
        // Get the wallet adapter for signing
        if (!wallet?.adapter) {
          throw new Error('Wallet adapter not available');
        }

        // Debug transaction details
        console.log('Transaction details:', {
          feePayer: transaction.feePayer?.toString(),
          recentBlockhash: transaction.recentBlockhash,
          instructions: transaction.instructions.length,
          wallet: wallet.adapter.name,
          connected: wallet.adapter.connected
        });

        // Create connection for transaction
        const connection = new Connection(import.meta.env.VITE_SOLANA_RPC_URL || 'https://api.devnet.solana.com', 'confirmed');

        // Sign and send the transaction
        let signature: string;
        try {
          toast.loading('Signing transaction...', { id: 'tx-signing' });
          
          // Send transaction through wallet adapter (handles signing automatically)
          signature = await wallet.adapter.sendTransaction(transaction, connection);
          
          toast.loading('Waiting for confirmation...', { id: 'tx-signing' });
          // Wait for transaction confirmation
          const confirmation = await connection.confirmTransaction(signature, 'confirmed');
          if (confirmation.value.err) {
            throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
          }
          
          toast.dismiss('tx-signing');
          console.log('Transaction confirmed:', signature);
        } catch (txError: any) {
          toast.dismiss('tx-signing');
          console.error('Transaction error:', txError);
          
          // Handle specific wallet errors
          if (txError.name === 'WalletSendTransactionError') {
            if (txError.message?.includes('User rejected') || txError.message?.includes('cancelled')) {
              throw new Error('Transaction was cancelled by user');
            } else if (txError.message?.includes('Insufficient funds')) {
              throw new Error('Insufficient funds in wallet');
            } else if (txError.message?.includes('Unexpected error')) {
              throw new Error('Wallet connection error. Please try reconnecting your wallet.');
            } else {
              throw new Error(`Transaction failed: ${txError.message}`);
            }
          } else if (txError.message?.includes('User rejected')) {
            throw new Error('Transaction was cancelled by user');
          } else if (txError.message?.includes('Insufficient funds')) {
            throw new Error('Insufficient funds in wallet');
          } else {
            throw new Error(`Transaction failed: ${txError.message}`);
          }
        }
        
        // Confirm payment with real signature
        await escrowService.confirmPayment(escrowOrder.id, signature);
        
        toast.success('Payment successful! Your order has been placed with buyer protection.');
        navigate('/orders');
      } else {
        // Stripe payment flow (to be implemented)
        toast.info('Stripe payment integration coming soon!');
      }
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
              Complete your purchase with secure blockchain payments
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
                    <div className="text-right">
                      <div>${totalAmount.toFixed(2)} USD</div>
                      {formData.paymentMethod === 'solana' && formData.currency === 'SOL' && solPrice > 0 && (
                        <div className="text-sm text-muted-foreground font-normal">
                          ≈ {(totalAmount / solPrice).toFixed(4)} SOL
                        </div>
                      )}
                      {formData.paymentMethod === 'solana' && formData.currency === 'USDC' && (
                        <div className="text-sm text-muted-foreground font-normal">
                          ≈ ${totalAmount.toFixed(2)} USDC
                        </div>
                      )}
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
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Zap className="h-5 w-5 text-purple-500" />
                          <Coins className="h-4 w-4 text-yellow-500" />
                        </div>
                        <div>
                          <h4 className="font-medium">Solana Payment</h4>
                          <p className="text-sm text-muted-foreground">
                            Fast blockchain payment with buyer protection
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div 
                    className={`p-4 border rounded-lg cursor-not-allowed opacity-50 transition-colors ${
                      formData.paymentMethod === 'stripe' 
                        ? 'border-primary bg-primary/5' 
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 border-2 rounded-full flex items-center justify-center">
                        {formData.paymentMethod === 'stripe' && (
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-blue-500" />
                        <div>
                          <h4 className="font-medium">Stripe Payment</h4>
                          <p className="text-sm text-muted-foreground">
                            Traditional card payment - Coming soon
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Currency Selection for Solana */}
                {formData.paymentMethod === 'solana' && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-3">Select Currency</h4>
                    <div className="flex gap-3">
                      <Button
                        variant={formData.currency === 'SOL' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFormData(prev => ({ ...prev, currency: 'SOL' }))}
                        className="flex items-center gap-2"
                      >
                        <Zap className="h-4 w-4 text-purple-500" />
                        SOL
                      </Button>
                      <Button
                        variant={formData.currency === 'USDC' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFormData(prev => ({ ...prev, currency: 'USDC' }))}
                        className="flex items-center gap-2"
                      >
                        <DollarSign className="h-4 w-4" />
                        USDC
                      </Button>
                    </div>
                    {/* Price Display */}
                    {cloth && (
                      <div className="mt-4 p-3 bg-white rounded-lg border">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Total Price:</span>
                          <div className="text-right">
                            <div className="text-lg font-bold">
                              ${(cloth.price * formData.quantity).toFixed(2)} USD
                            </div>
                            {formData.currency === 'SOL' && (
                              <div className="text-sm text-muted-foreground">
                                {isLoadingPrice ? (
                                  <div className="animate-pulse bg-gray-200 h-4 w-16 rounded"></div>
                                ) : (
                                  `≈ ${getSolPrice().toFixed(4)} SOL`
                                )}
                              </div>
                            )}
                            {formData.currency === 'USDC' && (
                              <div className="text-sm text-muted-foreground">
                                ≈ ${(cloth.price * formData.quantity).toFixed(2)} USDC
                              </div>
                            )}
                          </div>
                        </div>
                        {solPrice > 0 && (
                          <div className="mt-2 text-xs text-muted-foreground">
                            SOL Price: ${solPrice.toFixed(2)} USD
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Wallet Connection Status */}
                {formData.paymentMethod === 'solana' && (
                  <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Solana Wallet</h4>
                        <p className="text-sm text-muted-foreground">
                          {connected && publicKey ? `Connected: ${publicKey.slice(0, 8)}...${publicKey.slice(-8)}` : 'Not connected'}
                        </p>
                      </div>
                      {!connected && (
                        <Button
                          size="sm"
                          onClick={async () => {
                            try {
                              await connect();
                              toast.success('Wallet connected successfully!');
                            } catch (error: any) {
                              console.error('Wallet connection failed:', error);
                              
                              // Handle specific error types
                              if (error.name === 'WalletNotSelectedError') {
                                toast.error('Please select a wallet first.');
                              } else if (error.name === 'WalletNotFoundError') {
                                toast.error('Wallet not found. Please install Phantom or Solflare wallet.');
                              } else if (error.name === 'WalletConnectionError') {
                                toast.error('Failed to connect to wallet. Please try again.');
                              } else {
                                toast.error('Failed to connect wallet. Please try again.');
                              }
                            }
                          }}
                        >
                          <Wallet className="h-4 w-4 mr-2" />
                          Connect Wallet
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900">Buyer Protection</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        Your payment is held securely until you confirm delivery.
                        Funds are automatically released to the designer only after you mark the order as delivered.
                        This protects both you and the designer.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Place Order Button */}
            <Button 
              size="lg" 
              className="w-full btn-hero"
              onClick={handleOrder}
              disabled={isProcessing || !formData.deliveryAddress.trim() || (formData.paymentMethod === 'solana' && !publicKey)}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Processing Payment...
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5 mr-2" />
                  {formData.paymentMethod === 'solana' 
                    ? formData.currency === 'SOL' 
                      ? `Pay with SOL - ${getSolPrice().toFixed(4)} SOL`
                      : `Pay with USDC - $${totalAmount.toFixed(2)} USDC`
                    : `Place Order - $${totalAmount.toFixed(2)}`
                  }
                </>
              )}
            </Button>

            {formData.paymentMethod === 'solana' && !publicKey && (
              <p className="text-sm text-amber-600 text-center mt-2">
                Please connect your Solana wallet to proceed with payment
              </p>
            )}

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
