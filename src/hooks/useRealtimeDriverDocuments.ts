import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type DriverDocument = Database['public']['Tables']['driver_documents']['Row'];

type DriverDocumentWithProfile = DriverDocument & {
  driver?: { full_name: string; phone: string; email?: string } | null;
};

export const useRealtimeDriverDocuments = () => {
  const [documents, setDocuments] = useState<DriverDocumentWithProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial fetch
    const fetchDocuments = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('driver_documents')
        .select(`
          *,
          driver:profiles!driver_id(full_name, phone)
        `)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setDocuments(data as any);
      }
      setLoading(false);
    };

    fetchDocuments();

    // Set up real-time subscription
    const channel = supabase
      .channel('driver-documents-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'driver_documents'
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            // Fetch the full document with driver data
            const { data } = await supabase
              .from('driver_documents')
              .select(`
                *,
                driver:profiles!driver_id(full_name, phone)
              `)
              .eq('id', payload.new.id)
              .single();
            
            if (data) {
              setDocuments((current) => [data as any, ...current]);
            }
          } else if (payload.eventType === 'UPDATE') {
            // Fetch updated document with full data
            const { data } = await supabase
              .from('driver_documents')
              .select(`
                *,
                driver:profiles!driver_id(full_name, phone)
              `)
              .eq('id', payload.new.id)
              .single();
            
            if (data) {
              setDocuments((current) =>
                current.map((doc) =>
                  doc.id === payload.old.id ? (data as any) : doc
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
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { documents, loading };
};
