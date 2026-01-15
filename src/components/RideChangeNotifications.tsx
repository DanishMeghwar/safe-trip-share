import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, Clock, Wallet, MapPin, Check } from "lucide-react";
import { useRideChangeNotifications } from "@/hooks/useRideChangeNotifications";
import { formatDistanceToNow } from "date-fns";

const RideChangeNotifications = () => {
  const [userId, setUserId] = useState<string>();
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead, loading } = useRideChangeNotifications(userId);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
    };
    getUser();
  }, []);

  const getChangeIcon = (changeType: string) => {
    switch (changeType) {
      case 'time_change':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'fare_change':
        return <Wallet className="w-4 h-4 text-green-500" />;
      case 'cancelled':
        return <MapPin className="w-4 h-4 text-red-500" />;
      default:
        return <Bell className="w-4 h-4 text-primary" />;
    }
  };

  const getChangeMessage = (notification: any) => {
    switch (notification.change_type) {
      case 'time_change':
        return `Departure time changed from ${notification.old_value} to ${notification.new_value}`;
      case 'fare_change':
        return `Fare changed from ${notification.old_value} to ${notification.new_value}`;
      case 'cancelled':
        return 'Ride has been cancelled';
      default:
        return 'Ride details updated';
    }
  };

  if (!userId) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-primary-foreground">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-500"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Ride Updates</span>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              <Check className="w-3 h-3 mr-1" />
              Mark all read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {loading ? (
          <div className="p-4 text-center text-muted-foreground">
            Loading...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            No ride updates
          </div>
        ) : (
          notifications.slice(0, 10).map((notification) => (
            <DropdownMenuItem 
              key={notification.id}
              className={`flex items-start gap-3 p-3 cursor-pointer ${!notification.is_read ? 'bg-primary/5' : ''}`}
              onClick={() => {
                markAsRead(notification.id);
                navigate(`/booking/${notification.booking_id}`);
              }}
            >
              {getChangeIcon(notification.change_type)}
              <div className="flex-1 min-w-0">
                {notification.ride && (
                  <p className="text-xs font-medium truncate">
                    {notification.ride.from_location} → {notification.ride.to_location}
                  </p>
                )}
                <p className="text-sm text-muted-foreground">
                  {getChangeMessage(notification)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                </p>
              </div>
              {!notification.is_read && (
                <div className="w-2 h-2 bg-primary rounded-full mt-1" />
              )}
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default RideChangeNotifications;
