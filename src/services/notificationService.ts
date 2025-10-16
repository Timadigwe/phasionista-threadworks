import { supabase } from '../lib/supabase';
import { createClient } from '@supabase/supabase-js';

// Create a service role client for notifications (bypasses RLS)
const supabaseService = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export interface Notification {
  id: string;
  user_id: string;
  type: 'order_placed' | 'order_paid' | 'order_shipped' | 'order_delivered' | 'order_cancelled' | 'payment_released';
  title: string;
  message: string;
  data?: any;
  is_read: boolean;
  created_at: string;
}

export interface OrderNotificationData {
  order_id: string;
  customer_name: string;
  cloth_name: string;
  amount: number;
  currency: string;
  delivery_address: string;
  special_instructions?: string;
}

export const notificationService = {
  // Create a new notification
  async createNotification(notification: Omit<Notification, 'id' | 'created_at'>): Promise<Notification> {
    const { data, error } = await supabaseService
      .from('notifications')
      .insert(notification)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get notifications for a user
  async getUserNotifications(userId: string): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Mark notification as read
  async markAsRead(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) throw error;
  },

  // Mark all notifications as read for a user
  async markAllAsRead(userId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;
  },

  // Get unread notification count
  async getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;
    return count || 0;
  },

  // Notify designer about new order
  async notifyDesignerNewOrder(orderData: {
    designer_id: string;
    order_id: string;
    customer_name: string;
    cloth_name: string;
    amount: number;
    currency: string;
    delivery_address: string;
    special_instructions?: string;
  }): Promise<void> {
    try {
      // Create in-app notification
      await this.createNotification({
        user_id: orderData.designer_id,
        type: 'order_placed',
        title: 'New Order Received!',
        message: `${orderData.customer_name} has placed an order for "${orderData.cloth_name}"`,
        data: {
          order_id: orderData.order_id,
          customer_name: orderData.customer_name,
          cloth_name: orderData.cloth_name,
          amount: orderData.amount,
          currency: orderData.currency,
          delivery_address: orderData.delivery_address,
          special_instructions: orderData.special_instructions
        },
        is_read: false
      });

      // Send email notification (if email service is configured)
      await this.sendEmailNotification(orderData);

      console.log(`Designer notification sent for order ${orderData.order_id}`);
    } catch (error) {
      console.error('Error sending designer notification:', error);
      throw error;
    }
  },

  // Notify designer about payment confirmation
  async notifyDesignerPaymentConfirmed(orderData: {
    designer_id: string;
    order_id: string;
    customer_name: string;
    cloth_name: string;
    amount: number;
    currency: string;
  }): Promise<void> {
    try {
      await this.createNotification({
        user_id: orderData.designer_id,
        type: 'order_paid',
        title: 'Payment Confirmed!',
        message: `Payment of ${orderData.amount} ${orderData.currency} has been confirmed for order "${orderData.cloth_name}"`,
        data: {
          order_id: orderData.order_id,
          customer_name: orderData.customer_name,
          cloth_name: orderData.cloth_name,
          amount: orderData.amount,
          currency: orderData.currency
        },
        is_read: false
      });

      console.log(`Payment confirmation notification sent for order ${orderData.order_id}`);
    } catch (error) {
      console.error('Error sending payment confirmation notification:', error);
      throw error;
    }
  },

  // Send email notification (placeholder for email service integration)
  async sendEmailNotification(orderData: {
    designer_id: string;
    order_id: string;
    customer_name: string;
    cloth_name: string;
    amount: number;
    currency: string;
    delivery_address: string;
    special_instructions?: string;
  }): Promise<void> {
    // This would integrate with an email service like SendGrid, Resend, or Supabase Edge Functions
    // For now, we'll just log the email content
    console.log('Email notification would be sent:', {
      to: 'designer@example.com', // Would get from designer profile
      subject: `New Order: ${orderData.cloth_name}`,
      body: `
        Hello Designer,
        
        You have received a new order!
        
        Order Details:
        - Customer: ${orderData.customer_name}
        - Item: ${orderData.cloth_name}
        - Amount: ${orderData.amount} ${orderData.currency}
        - Delivery Address: ${orderData.delivery_address}
        ${orderData.special_instructions ? `- Special Instructions: ${orderData.special_instructions}` : ''}
        
        Please log in to your dashboard to view full order details and update the order status.
        
        Best regards,
        Phasionista Team
      `
    });
  },

  // Notify customer about order updates
  async notifyCustomerOrderUpdate(orderData: {
    customer_id: string;
    order_id: string;
    designer_name: string;
    cloth_name: string;
    status: string;
    message: string;
  }): Promise<void> {
    try {
      await this.createNotification({
        user_id: orderData.customer_id,
        type: 'order_shipped',
        title: 'Order Update',
        message: `${orderData.designer_name} has updated your order status: ${orderData.message}`,
        data: {
          order_id: orderData.order_id,
          designer_name: orderData.designer_name,
          cloth_name: orderData.cloth_name,
          status: orderData.status
        },
        is_read: false
      });

      console.log(`Customer notification sent for order ${orderData.order_id}`);
    } catch (error) {
      console.error('Error sending customer notification:', error);
      throw error;
    }
  }
};
