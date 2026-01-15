import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface RideChangeNotification {
  id: string;
  ride_id: string;
  booking_id: string;
  change_type: string;
  old_value: string | null;
  new_value: string | null;
  is_read: boolean;
  created_at: string;
  ride?: {
    from_location: string;
    to_location: string;
  };
}

export const useRideChangeNotifications = (userId?: string) => {
  const [notifications, setNotifications] = useState<RideChangeNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('ride_change_notifications')
      .select(`
        *,
        ride:rides(from_location, to_location)
      `)
      .order('created_at', { ascending: false })
      .limit(20);

    if (!error && data) {
      setNotifications(data as RideChangeNotification[]);
      setUnreadCount(data.filter((n: any) => !n.is_read).length);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchNotifications();

    if (!userId) return;

    // Real-time subscription
    const channel = supabase
      .channel(`ride-change-notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ride_change_notifications'
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchNotifications]);

  const markAsRead = async (notificationId: string) => {
    const { error } = await supabase
      .from('ride_change_notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (!error) {
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
    if (unreadIds.length === 0) return;

    const { error } = await supabase
      .from('ride_change_notifications')
      .update({ is_read: true })
      .in('id', unreadIds);

    if (!error) {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    }
  };

  return { 
    notifications, 
    loading, 
    unreadCount, 
    markAsRead, 
    markAllAsRead,
    refetch: fetchNotifications 
  };
};
