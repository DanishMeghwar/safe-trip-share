import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface PresenceState {
  isOnline: boolean;
  isTyping: boolean;
  userId: string;
}

export const usePresence = (channelName: string, currentUserId: string | null) => {
  const [onlineUsers, setOnlineUsers] = useState<Record<string, PresenceState>>({});
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!currentUserId || !channelName) return;

    const presenceChannel = supabase.channel(`presence-${channelName}`);

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const users: Record<string, PresenceState> = {};
        
        Object.entries(state).forEach(([key, presences]) => {
          const presence = (presences as any[])[0];
          if (presence) {
            users[presence.userId] = {
              isOnline: true,
              isTyping: presence.isTyping || false,
              userId: presence.userId
            };
          }
        });
        
        setOnlineUsers(users);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({
            userId: currentUserId,
            isTyping: false,
            online_at: new Date().toISOString()
          });
        }
      });

    setChannel(presenceChannel);

    return () => {
      supabase.removeChannel(presenceChannel);
    };
  }, [channelName, currentUserId]);

  const setTyping = useCallback(async (isTyping: boolean) => {
    if (!channel || !currentUserId) return;
    
    await channel.track({
      userId: currentUserId,
      isTyping,
      online_at: new Date().toISOString()
    });
  }, [channel, currentUserId]);

  const isUserOnline = useCallback((userId: string) => {
    return onlineUsers[userId]?.isOnline || false;
  }, [onlineUsers]);

  const isUserTyping = useCallback((userId: string) => {
    return onlineUsers[userId]?.isTyping || false;
  }, [onlineUsers]);

  return { onlineUsers, setTyping, isUserOnline, isUserTyping };
};
