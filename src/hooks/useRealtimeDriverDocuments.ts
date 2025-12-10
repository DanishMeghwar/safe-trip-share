import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { RealtimeChannel } from '@supabase/supabase-js';

type DriverDocument = Database['public']['Tables']['driver_documents']['Row'];

type DriverDocumentWithProfile = DriverDocument & {
  driver?: { full_name: string; phone: string; id: string } | null;
};

export const useRealtimeDriverDocuments = () => {
  const [documents, setDocuments] = useState<DriverDocumentWithProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let channel: RealtimeChannel;

    // Initial fetch - using simpler join syntax
    const fetchDocuments = async () => {
      setLoading(true);
      try {
        console.log('[DriverDocs] Fetching documents...');
        
        const { data, error } = await supabase
          .from('driver_documents')
          .select(`
            *,
            driver:profiles(id, full_name, phone)
          `)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('[DriverDocs] Error fetching:', error);
        } else {
          console.log('[DriverDocs] Fetched:', data?.length || 0, 'documents');
          setDocuments((data as DriverDocumentWithProfile[]) || []);
        }
      } catch (err) {
        console.error('[DriverDocs] Unexpected error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();

    // Set up real-time subscription
    channel = supabase
      .channel('driver_documents_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'driver_documents'
        },
        async (payload) => {
          console.log('Realtime event received:', payload.eventType);
          
          if (payload.eventType === 'INSERT') {
            console.log('[DriverDocs] INSERT event received');
            const { data, error } = await supabase
              .from('driver_documents')
              .select(`*, driver:profiles(id, full_name, phone)`)
              .eq('id', payload.new.id)
              .single();
            
            if (!error && data) {
              setDocuments((current) => [data as DriverDocumentWithProfile, ...current]);
            }
          } else if (payload.eventType === 'UPDATE') {
            console.log('[DriverDocs] UPDATE event received');
            const { data, error } = await supabase
              .from('driver_documents')
              .select(`*, driver:profiles(id, full_name, phone)`)
              .eq('id', payload.new.id)
              .single();
            
            if (!error && data) {
              setDocuments((current) =>
                current.map((doc) =>
                  doc.id === payload.old.id ? (data as DriverDocumentWithProfile) : doc
                )
              );
            }
          } else if (payload.eventType === 'DELETE') {
            setDocuments((current) =>
              current.filter((doc) => doc.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  return { documents, loading };
};
