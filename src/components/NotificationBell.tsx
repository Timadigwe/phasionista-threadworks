import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';

export const NotificationBell = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleNotificationClick = async (notificationId: string, isRead: boolean, notification: any) => {
    if (!isRead) {
      await markAsRead(notificationId);
    }
    
    // Navigate based on notification type and user role
    const navigateToOrder = (orderId: string) => {
      if (profile?.role === 'designer') {
        navigate(`/designer/orders`);
      } else {
        navigate(`/orders`);
      }
    };

    const navigateToOrderDetails = (orderId: string) => {
      if (profile?.role === 'designer') {
        navigate(`/designer/orders`);
      } else {
        navigate(`/orders`);
      }
    };

    // Handle navigation based on notification type
    switch (notification.type) {
      case 'order_placed':
      case 'order_paid':
      case 'order_shipped':
      case 'order_delivered':
      case 'order_cancelled':
        if (notification.data?.order_id) {
          navigateToOrder(notification.data.order_id);
        }
        break;
      default:
        // For other notification types, navigate to appropriate page
        if (profile?.role === 'designer') {
          navigate('/designer/orders');
        } else {
          navigate('/orders');
        }
    }
    
    setIsOpen(false);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order_placed':
        return '🛍️';
      case 'order_paid':
        return '💰';
      case 'order_shipped':
        return '📦';
      case 'order_delivered':
        return '✅';
      case 'order_cancelled':
        return '❌';
      default:
        return '🔔';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'order_placed':
        return 'text-blue-600';
      case 'order_paid':
        return 'text-green-600';
      case 'order_shipped':
        return 'text-purple-600';
      case 'order_delivered':
        return 'text-emerald-600';
      case 'order_cancelled':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-80" align="end">
        <div className="p-3 border-b">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Notifications</h4>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="text-xs"
              >
                <CheckCheck className="h-3 w-3 mr-1" />
                Mark all read
              </Button>
            )}
          </div>
        </div>
        
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              No notifications yet
            </div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className="p-3 cursor-pointer"
                onClick={() => handleNotificationClick(notification.id, notification.is_read, notification)}
              >
                <div className="flex items-start gap-3 w-full">
                  <div className="text-lg">
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h5 className={`text-sm font-medium ${getNotificationColor(notification.type)}`}>
                        {notification.title}
                      </h5>
                      {!notification.is_read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                      )}
                    </div>
                    
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {notification.message}
                    </p>
                    
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </span>
                      {notification.is_read && (
                        <Check className="h-3 w-3 text-green-500" />
                      )}
                    </div>
                  </div>
                </div>
              </DropdownMenuItem>
            ))
          )}
        </div>
        
        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2">
              <Button variant="ghost" size="sm" className="w-full text-xs">
                View all notifications
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
