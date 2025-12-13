import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type Message = Database['public']['Tables']['messages']['Row'];

type MessageWithSender = Message & {
  sender?: { full_name: string; avatar_url: string | null } | null;
  is_read?: boolean;
};

export const useRealtimeMessages = (bookingId: string | null) => {
  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  // Mark messages as read
  const markAsRead = useCallback(async (messageIds: string[]) => {
    if (!messageIds.length) return;
    
    await supabase
      .from('messages')
      .update({ is_read: true })
      .in('id', messageIds);
  }, []);

  useEffect(() => {
    if (!bookingId) {
      setLoading(false);
      return;
    }

    // Initial fetch
    const fetchMessages = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!sender_id(full_name, avatar_url)
        `)
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: true });

      if (!error && data) {
        setMessages(data as any);
        
        // Count unread messages
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const unread = data.filter((m: any) => !m.is_read && m.sender_id !== user.id);
          setUnreadCount(unread.length);
        }
      }
      setLoading(false);
    };

    fetchMessages();

    // Set up real-time subscription for INSERT and UPDATE
    const channel = supabase
      .channel(`messages-${bookingId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `booking_id=eq.${bookingId}`
        },
        async (payload) => {
          // Fetch the full message with sender info
          const { data } = await supabase
            .from('messages')
            .select(`
              *,
              sender:profiles!sender_id(full_name, avatar_url)
            `)
            .eq('id', payload.new.id)
            .single();

          if (data) {
            setMessages((current) => [...current, data as any]);
            
            // Increment unread if not from current user
            const { data: { user } } = await supabase.auth.getUser();
            if (user && data.sender_id !== user.id) {
              setUnreadCount((prev) => prev + 1);
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `booking_id=eq.${bookingId}`
        },
        (payload) => {
          setMessages((current) =>
            current.map((msg) =>
              msg.id === payload.new.id ? { ...msg, ...payload.new } : msg
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [bookingId]);

  const sendMessage = async (message: string) => {
    if (!bookingId || !message.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('messages')
      .insert({
        booking_id: bookingId,
        sender_id: user.id,
        message: message.trim(),
        is_read: false
      });

    if (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  };

  const clearUnread = useCallback(() => {
    setUnreadCount(0);
  }, []);

  return { messages, loading, sendMessage, unreadCount, markAsRead, clearUnread };
};
