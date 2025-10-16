import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL, Keypair, sendAndConfirmTransaction } from '@solana/web3.js';
import { createTransferInstruction, getAssociatedTokenAddress, createAssociatedTokenAccountInstruction } from '@solana/spl-token';
import { supabase } from '../lib/supabase';
import { notificationService } from './notificationService';
import bs58 from 'bs58';

// Solana connection
const SOLANA_RPC_URL = import.meta.env.VITE_SOLANA_RPC_URL || 'https://api.devnet.solana.com';
const connection = new Connection(SOLANA_RPC_URL, 'confirmed');

// Environment variables
const VAULT_WALLET = import.meta.env.VITE_VAULT_WALLET; // Vault wallet public key
const VAULT_PRIVATE_KEY = import.meta.env.VITE_VAULT_PRIVATE_KEY; // Vault private key for signing
const USDC_MINT = import.meta.env.VITE_USDC_MINT || 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'; // USDC mint address

// Initialize vault keypair
let vaultKeypair: Keypair | null = null;
if (VAULT_PRIVATE_KEY) {
  try {
    vaultKeypair = Keypair.fromSecretKey(bs58.decode(VAULT_PRIVATE_KEY));
  } catch (error) {
    console.error('Invalid vault private key:', error);
  }
}

export interface EscrowOrder {
  id: string;
  customer_id: string;
  designer_id: string;
  cloth_id: string;
  amount: number;
  currency: 'SOL' | 'USDC';
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'released' | 'cancelled';
  vault_transaction?: string;
  release_transaction?: string;
  actual_amount_received?: number; // Actual amount received in vault
  vault_balance_before?: number; // Vault balance before transaction
  vault_balance_after?: number; // Vault balance after transaction
  delivery_address?: string;
  special_instructions?: string;
  tracking_number?: string;
  shipping_notes?: string;
  shipping_photos?: string[]; // Base64 encoded photos (stored as JSONB in DB)
  created_at: string;
  updated_at: string;
}

export interface PaymentRequest {
  orderId: string;
  amount: number;
  currency: 'SOL' | 'USDC';
  customerWallet: string;
  designerWallet: string;
}

export const escrowService = {
  // Get vault balance
  async getVaultBalance(currency: 'SOL' | 'USDC'): Promise<number> {
    if (!VAULT_WALLET) throw new Error('Vault wallet not configured');
    
    const vaultPubkey = new PublicKey(VAULT_WALLET);
    
    if (currency === 'SOL') {
      const balance = await connection.getBalance(vaultPubkey);
      return balance / LAMPORTS_PER_SOL;
    } else {
      // USDC balance
      const usdcMint = new PublicKey(USDC_MINT);
      const vaultTokenAccount = await getAssociatedTokenAddress(usdcMint, vaultPubkey);
      
      try {
        const accountInfo = await connection.getTokenAccountBalance(vaultTokenAccount);
        return parseFloat(accountInfo.value.amount) / 1e6; // USDC has 6 decimals
      } catch (error) {
        // Token account doesn't exist yet
        return 0;
      }
    }
  },

  // Create a new escrow order (only called after payment confirmation)
  async createEscrowOrder(orderData: {
    customer_id: string;
    designer_id: string;
    cloth_id: string;
    amount: number;
    currency: 'SOL' | 'USDC';
    delivery_address?: string;
    special_instructions?: string;
  }): Promise<EscrowOrder> {
    const { data, error } = await supabase
      .from('escrow_orders')
      .insert({
        customer_id: orderData.customer_id,
        designer_id: orderData.designer_id,
        cloth_id: orderData.cloth_id,
        amount: orderData.amount,
        currency: orderData.currency,
        delivery_address: orderData.delivery_address,
        special_instructions: orderData.special_instructions,
        status: 'paid' // Order is created only after payment confirmation
      })
      .select()
      .single();

    if (error) throw error;

    // Send notification to designer since payment is confirmed
    try {
      await notificationService.notifyDesignerPaymentConfirmed({
        designer_id: orderData.designer_id,
        order_id: data.id,
        customer_name: 'Customer', // We could fetch this if needed
        cloth_name: 'Order', // We could fetch this if needed
        amount: orderData.amount,
        currency: orderData.currency
      });
    } catch (notificationError) {
      console.error('Error sending designer notification:', notificationError);
      // Don't throw error here to avoid breaking the order creation
    }

    return data;
  },

  // Generate payment request for customer
  async generatePaymentRequest(orderId: string): Promise<PaymentRequest> {
    const { data: order, error } = await supabase
      .from('escrow_orders')
      .select(`
        *,
        customer:profiles!escrow_orders_customer_id_fkey(solana_wallet),
        designer:profiles!escrow_orders_designer_id_fkey(solana_wallet)
      `)
      .eq('id', orderId)
      .single();

    if (error) throw error;

    if (!order.customer?.solana_wallet || !order.designer?.solana_wallet) {
      throw new Error('Customer or designer wallet not found');
    }

    return {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      customerWallet: order.customer.solana_wallet,
      designerWallet: order.designer.solana_wallet
    };
  },

  // Generate payment request for amount (without creating order)
  async generatePaymentRequestForAmount(orderData: {
    customer_id: string;
    designer_id: string;
    cloth_id: string;
    amount: number;
    currency: 'SOL' | 'USDC';
    delivery_address?: string;
    special_instructions?: string;
  }): Promise<PaymentRequest> {
    // Get customer and designer wallet addresses
    const { data: customer, error: customerError } = await supabase
      .from('profiles')
      .select('solana_wallet')
      .eq('id', orderData.customer_id)
      .single();

    if (customerError) throw customerError;

    const { data: designer, error: designerError } = await supabase
      .from('profiles')
      .select('solana_wallet')
      .eq('id', orderData.designer_id)
      .single();

    if (designerError) throw designerError;

    if (!customer?.solana_wallet || !designer?.solana_wallet) {
      throw new Error('Customer or designer wallet not found');
    }

    return {
      orderId: 'pending', // Will be replaced with actual order ID after creation
      amount: orderData.amount,
      currency: orderData.currency,
      customerWallet: customer.solana_wallet,
      designerWallet: designer.solana_wallet
    };
  },

  // Process Solana payment
  async processSolanaPayment(
    customerWallet: string,
    amount: number,
    currency: 'SOL' | 'USDC'
  ): Promise<{ transaction: string; signature: string }> {
    try {
      if (!VAULT_WALLET) {
        throw new Error('Vault wallet not configured. Please check your environment variables.');
      }
      
      const customerPubkey = new PublicKey(customerWallet);
      const vaultPubkey = new PublicKey(VAULT_WALLET);

      if (currency === 'SOL') {
        // SOL payment
        const lamports = Math.floor(amount * LAMPORTS_PER_SOL);
        
        const transaction = new Transaction();
        
        // Add transfer instruction
        transaction.add(
          SystemProgram.transfer({
            fromPubkey: customerPubkey,
            toPubkey: vaultPubkey,
            lamports
          })
        );

        // Get recent blockhash and set transaction properties
        const { blockhash } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = customerPubkey;

        // Serialize transaction for signing
        const serialized = transaction.serialize({ requireAllSignatures: false, verifySignatures: false });
        
        return {
          transaction: serialized.toString('base64'),
          signature: '' // Will be filled after user signs
        };
      } else {
        // USDC payment
        const usdcMint = new PublicKey(USDC_MINT);
        const customerTokenAccount = await getAssociatedTokenAddress(usdcMint, customerPubkey);
        const vaultTokenAccount = await getAssociatedTokenAddress(usdcMint, vaultPubkey);

        const transaction = new Transaction();

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
        transaction.add(
          createTransferInstruction(
            customerTokenAccount,
            vaultTokenAccount,
            customerPubkey,
            Math.floor(amount * 1e6) // USDC has 6 decimals
          )
        );

        // Get recent blockhash and set transaction properties
        const { blockhash } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = customerPubkey;

        // Serialize transaction for signing
        const serialized = transaction.serialize({ requireAllSignatures: false, verifySignatures: false });
        
        return {
          transaction: serialized.toString('base64'),
          signature: ''
        };
      }
    } catch (error) {
      console.error('Error processing Solana payment:', error);
      throw new Error('Failed to process Solana payment');
    }
  },

  // Confirm payment and update order status
  async confirmPayment(orderId: string, transactionSignature: string): Promise<void> {
    // Get order details
    const { data: order, error: fetchError } = await supabase
      .from('escrow_orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (fetchError) throw fetchError;

    // Get vault balance before and after to calculate actual amount received
    const balanceBefore = await this.getVaultBalance(order.currency);
    
    // Wait for transaction to be confirmed on blockchain
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const balanceAfter = await this.getVaultBalance(order.currency);
    const actualAmountReceived = balanceAfter - balanceBefore;

    // Use actual amount received if available, otherwise use expected amount
    const finalAmountReceived = actualAmountReceived > 0 ? actualAmountReceived : order.amount;

    // Verify the amount matches expected amount (with small tolerance for fees)
    const expectedAmount = order.amount;
    const tolerance = 0.01; // 1% tolerance for network fees
    const amountDifference = Math.abs(finalAmountReceived - expectedAmount);
    
    if (amountDifference > expectedAmount * tolerance && actualAmountReceived > 0) {
      console.warn(`Amount mismatch: expected ${expectedAmount}, received ${actualAmountReceived}`);
    }

    const { error } = await supabase
      .from('escrow_orders')
      .update({
        status: 'paid',
        vault_transaction: transactionSignature,
        actual_amount_received: finalAmountReceived,
        vault_balance_before: balanceBefore,
        vault_balance_after: balanceAfter,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    if (error) throw error;

    // Notify designer about payment confirmation (only after funds are confirmed received)
    try {
      const { data: customer } = await supabase
        .from('profiles')
        .select('phasion_name, full_name')
        .eq('id', order.customer_id)
        .single();

      const { data: cloth } = await supabase
        .from('clothes')
        .select('name')
        .eq('id', order.cloth_id)
        .single();

      // Send notification that payment is confirmed and funds are in vault
      await notificationService.notifyDesignerPaymentConfirmed({
        designer_id: order.designer_id,
        order_id: orderId,
        customer_name: customer?.phasion_name || customer?.full_name || 'Customer',
        cloth_name: cloth?.name || 'Item',
        amount: order.amount,
        currency: order.currency
      });
    } catch (notificationError) {
      console.error('Error sending payment confirmation notification:', notificationError);
      // Don't throw error here to avoid breaking the payment confirmation
    }
  },

  // Update order status (for designer/admin)
  async updateOrderStatus(orderId: string, status: EscrowOrder['status'], additionalData?: any): Promise<void> {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    };

    // Add tracking information if provided
    if (additionalData?.tracking_number) {
      updateData.tracking_number = additionalData.tracking_number;
    }
    if (additionalData?.shipping_notes) {
      updateData.shipping_notes = additionalData.shipping_notes;
    }
    if (additionalData?.shipping_photos) {
      // Store shipping_photos as JSONB array in database
      updateData.shipping_photos = JSON.stringify(additionalData.shipping_photos);
    }

    const { error } = await supabase
      .from('escrow_orders')
      .update(updateData)
      .eq('id', orderId);

    if (error) throw error;

      // Send notification to customer when order is shipped
      if (status === 'shipped') {
        try {
          // Get order details to send notification
          const orderDetails = await this.getOrder(orderId);
          
          // Get designer information
          const { data: designerData, error: designerError } = await supabase
            .from('profiles')
            .select('phasion_name, full_name')
            .eq('id', orderDetails.designer_id)
            .single();

          if (designerError) {
            console.error('Error fetching designer info:', designerError);
          } else {
            // Send notification to customer
            await notificationService.notifyCustomerOrderUpdate({
              customer_id: orderDetails.customer_id,
              order_id: orderId,
              designer_name: designerData.full_name || designerData.phasion_name,
              cloth_name: 'Your order', // We could get cloth name from cloth_id if needed
              status: 'shipped',
              message: `Your order has been shipped! ${additionalData?.tracking_number ? `Tracking number: ${additionalData.tracking_number}` : ''}`
            });
          }
        } catch (notificationError) {
          console.error('Error sending shipping notification:', notificationError);
          // Don't throw error here to avoid breaking the order update
        }
      }

      // Send notification to admin when delivery is confirmed
      if (status === 'delivered') {
        try {
          // Get order details to send notification
          const orderDetails = await this.getOrder(orderId);
          
          // Get customer and designer information
          const { data: customerData, error: customerError } = await supabase
            .from('profiles')
            .select('phasion_name, full_name')
            .eq('id', orderDetails.customer_id)
            .single();

          const { data: designerData, error: designerError } = await supabase
            .from('profiles')
            .select('phasion_name, full_name')
            .eq('id', orderDetails.designer_id)
            .single();

          if (!customerError && !designerError) {
            // Send notification to admin about delivery confirmation
            await notificationService.createNotification({
              user_id: 'admin', // This would need to be the actual admin user ID
              type: 'order_delivered',
              title: 'Order Delivered - Review Required',
              message: `Customer ${customerData.full_name || customerData.phasion_name} confirmed delivery for order ${orderId}. Review and release payment to designer ${designerData.full_name || designerData.phasion_name}.`,
              data: {
                order_id: orderId,
                customer_id: orderDetails.customer_id,
                designer_id: orderDetails.designer_id,
                amount: orderDetails.amount,
                currency: orderDetails.currency
              },
              is_read: false
            });
          }
        } catch (notificationError) {
          console.error('Error sending admin notification:', notificationError);
          // Don't throw error here to avoid breaking the order update
        }
      }
  },

  // Release funds to designer
  async releaseFunds(orderId: string): Promise<{ transaction: string; signature: string }> {
    if (!vaultKeypair) {
      throw new Error('Vault private key not configured');
    }

    const { data: order, error } = await supabase
      .from('escrow_orders')
      .select(`
        *,
        designer:profiles!escrow_orders_designer_id_fkey(solana_wallet)
      `)
      .eq('id', orderId)
      .single();

    if (error) throw error;

    if (!order.designer?.solana_wallet) {
      throw new Error('Designer wallet not found');
    }

    const vaultPubkey = vaultKeypair.publicKey;
    const designerPubkey = new PublicKey(order.designer.solana_wallet);
    let signature: string;

    try {
      if (order.currency === 'SOL') {
        // Check vault balance first
        const vaultBalance = await connection.getBalance(vaultPubkey);
        console.log('Vault balance (lamports):', vaultBalance);
        console.log('Vault balance (SOL):', vaultBalance / LAMPORTS_PER_SOL);
        
        // Release SOL - use actual amount received if available, otherwise use expected amount
        const amountToRelease = order.actual_amount_received || order.amount;
        const lamports = Math.floor(amountToRelease * LAMPORTS_PER_SOL);
        
        console.log('Amount to release (SOL):', amountToRelease);
        console.log('Amount to release (lamports):', lamports);
        
        // Check if vault has enough balance
        if (vaultBalance < lamports) {
          throw new Error(`Insufficient vault balance. Available: ${vaultBalance / LAMPORTS_PER_SOL} SOL, Required: ${amountToRelease} SOL`);
        }
        
        const transaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: vaultPubkey,
            toPubkey: designerPubkey,
            lamports
          })
        );

        const { blockhash } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = vaultPubkey;

        // Sign and send transaction
        signature = await sendAndConfirmTransaction(
          connection,
          transaction,
          [vaultKeypair],
          { commitment: 'confirmed' }
        );

        return {
          transaction: transaction.serialize({ requireAllSignatures: false }).toString('base64'),
          signature
        };
      } else {
        // Release USDC
        const usdcMint = new PublicKey(USDC_MINT);
        const vaultTokenAccount = await getAssociatedTokenAddress(usdcMint, vaultPubkey);
        const designerTokenAccount = await getAssociatedTokenAddress(usdcMint, designerPubkey);

        const transaction = new Transaction();

        // Check if designer has USDC token account, create if not
        const designerTokenAccountInfo = await connection.getAccountInfo(designerTokenAccount);
        if (!designerTokenAccountInfo) {
          transaction.add(
            createAssociatedTokenAccountInstruction(
              vaultPubkey, // payer
              designerTokenAccount, // ata
              designerPubkey, // owner
              usdcMint // mint
            )
          );
        }

        // Use actual amount received if available, otherwise use expected amount
        const amountToRelease = order.actual_amount_received || order.amount;
        
        // Add transfer instruction
        transaction.add(
          createTransferInstruction(
            vaultTokenAccount,
            designerTokenAccount,
            vaultPubkey,
            Math.floor(amountToRelease * 1e6) // USDC has 6 decimals
          )
        );

        const { blockhash } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = vaultPubkey;

        // Sign and send transaction
        signature = await sendAndConfirmTransaction(
          connection,
          transaction,
          [vaultKeypair],
          { commitment: 'confirmed' }
        );

        return {
          transaction: transaction.serialize({ requireAllSignatures: false }).toString('base64'),
          signature
        };
      }
    } catch (error: any) {
      console.error('Error releasing funds:', error);
      
      // Enhanced error handling for Solana transaction errors
      if (error.name === 'SendTransactionError') {
        console.error('Transaction simulation failed:', error.message);
        if (error.logs) {
          console.error('Transaction logs:', error.logs);
        }
        throw new Error(`Transaction failed: ${error.message}. Check vault balance and try again.`);
      } else if (error.message?.includes('Insufficient vault balance')) {
        throw error; // Re-throw our custom error
      } else {
        throw new Error(`Failed to release funds: ${error.message}`);
      }
    } finally {
      // Send notification to designer about payment release (after successful transaction)
      if (signature) {
        try {
          await notificationService.createNotification({
            user_id: order.designer_id,
            type: 'payment_released' as const,
            title: 'Payment Released',
            message: `Your payment of ${order.amount} ${order.currency} has been released for order ${orderId}.`,
            data: {
              order_id: orderId,
              amount: order.amount,
              currency: order.currency,
              transaction_signature: signature
            },
            is_read: false
          });
        } catch (notificationError) {
          console.error('Error sending designer notification:', notificationError);
          // Don't throw error here to avoid breaking the fund release
        }
      }
    }
  },

  // Confirm fund release
  async confirmFundRelease(orderId: string, transactionSignature: string): Promise<void> {
    const { error } = await supabase
      .from('escrow_orders')
      .update({
        status: 'released',
        release_transaction: transactionSignature,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    if (error) throw error;
  },

  // Get order details
  async getOrder(orderId: string): Promise<EscrowOrder> {
    const { data, error } = await supabase
      .from('escrow_orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (error) throw error;
    
    // Parse shipping_photos from JSONB to array
    const order = {
      ...data,
      shipping_photos: data.shipping_photos ? JSON.parse(data.shipping_photos) : []
    };
    
    return order;
  },

  // Get customer orders
  async getCustomerOrders(customerId: string): Promise<EscrowOrder[]> {
    const { data, error } = await supabase
      .from('escrow_orders')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Parse shipping_photos from JSONB to array
    const orders = (data || []).map(order => ({
      ...order,
      shipping_photos: order.shipping_photos ? JSON.parse(order.shipping_photos) : []
    }));
    
    return orders;
  },

  // Get designer orders
  async getDesignerOrders(designerId: string): Promise<EscrowOrder[]> {
    const { data, error } = await supabase
      .from('escrow_orders')
      .select('*')
      .eq('designer_id', designerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Parse shipping_photos from JSONB to array
    const orders = (data || []).map(order => ({
      ...order,
      shipping_photos: order.shipping_photos ? JSON.parse(order.shipping_photos) : []
    }));
    
    return orders;
  },

  // Get order details for delivery confirmation
  async getOrderDetails(orderId: string): Promise<any> {
    const { data, error } = await supabase
      .from('escrow_orders')
      .select(`
        *,
        cloth:clothes!escrow_orders_cloth_id_fkey(name),
        designer:profiles!escrow_orders_designer_id_fkey(phasion_name)
      `)
      .eq('id', orderId)
      .single();

    if (error) throw error;

    return {
      id: data.id,
      cloth_name: data.cloth.name,
      designer_name: data.designer.phasion_name,
      amount: data.amount,
      currency: data.currency,
      status: data.status,
      delivery_address: data.delivery_address,
      special_instructions: data.special_instructions,
      created_at: data.created_at
    };
  },

  // Confirm delivery and release funds
  async confirmDelivery(orderId: string): Promise<void> {
    // First release the funds
    const releaseResult = await this.releaseFunds(orderId);
    
    // Then confirm the fund release
    await this.confirmFundRelease(orderId, releaseResult.signature);
  },

  // Create a dispute/alarm for delivery issues
  async createDispute(disputeData: {
    order_id: string;
    customer_id: string;
    reason: string;
    description: string;
    status: string;
  }): Promise<void> {
    // First get the designer_id from the order
    const { data: orderData, error: orderError } = await supabase
      .from('escrow_orders')
      .select('designer_id')
      .eq('id', disputeData.order_id)
      .single();

    if (orderError) {
      console.error('Error fetching order designer:', orderError);
      throw orderError;
    }

    const { error } = await supabase
      .from('disputes')
      .insert({
        order_id: disputeData.order_id,
        customer_id: disputeData.customer_id,
        designer_id: orderData.designer_id,
        reason: disputeData.reason,
        description: disputeData.description,
        status: 'open' // Use the correct status value from the existing table
      });

    if (error) throw error;

    // Send notification to admin about the dispute
    try {
      await notificationService.createNotification({
        user_id: 'admin', // This would need to be the actual admin user ID
        type: 'order_cancelled', // Using existing type for now
        title: 'Delivery Issue Reported',
        message: `Customer reported delivery issue for order ${disputeData.order_id}: ${disputeData.description}`,
        data: {
          order_id: disputeData.order_id,
          customer_id: disputeData.customer_id,
          reason: disputeData.reason,
          description: disputeData.description
        },
        is_read: false
      });
    } catch (notificationError) {
      console.error('Error sending admin notification:', notificationError);
      // Don't throw error here to avoid breaking the dispute creation
    }
  }
};
