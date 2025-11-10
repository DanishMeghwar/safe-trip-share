import { useState, useEffect } from 'react';
import { supabase } from '../supabase'; // Assuming you set up your client here
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

// Define a type for the data structure you expect from the table
interface LiveDataItem {
  id: number;
  title: string;
  user_id: string; 
  // Add other columns from your table
}

const useRealtimeData = (tableName: string) => {
  const [data, setData] = useState<LiveDataItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Function to handle the initial data fetch
    const fetchData = async () => {
      setLoading(true);
      // Fetch all existing data when the component mounts
      const { data: initialData, error } = await supabase
        .from(tableName)
        .select('*');

      if (error) {
        console.error('Error fetching initial data:', error);
      }
      if (initialData) {
        setData(initialData as LiveDataItem[]);
      }
      setLoading(false);
    };

    // 2. Function to handle the real-time changes
    const handleRealtimeChange = (payload: RealtimePostgresChangesPayload<LiveDataItem>) => {
        
        // Log the change for debugging
        console.log('Realtime change received:', payload.eventType, payload.new);

        // Update the local state based on the type of database event
        setData(currentData => {
            switch (payload.eventType) {
                case 'INSERT':
                    // Add the new row to the state
                    return [...currentData, payload.new as LiveDataItem];
                case 'UPDATE':
                    // Find the row and replace it with the updated data
                    return currentData.map(item =>
                        item.id === (payload.new as LiveDataItem).id ? (payload.new as LiveDataItem) : item
                    );
                case 'DELETE':
                    // Filter out the deleted row
                    // Note: 'payload.old' contains the primary key ('id') of the deleted row
                    return currentData.filter(item =>
                        item.id !== (payload.old as { id: number }).id
                    );
                default:
                    return currentData;
            }
        });
    };

    // 3. Create and subscribe to the channel
    const channel = supabase
      .channel(`realtime-channel-${tableName}`) // Use a unique name for the channel
      .on(
        'postgres_changes', // Listen for all changes from PostgreSQL
        { event: '*', schema: 'public', table: tableName },
        handleRealtimeChange // The function to run when a change occurs
      )
      .subscribe(); // Starts the subscription

    // Execute the initial fetch
    fetchData();

    // 4. Cleanup function: runs when the component unmounts
    return () => {
      // It's crucial to remove the channel to prevent memory leaks and duplicate listeners
      supabase.removeChannel(channel);
    };
  }, [tableName]); // Re-run effect if the table name changes

  return { data, loading };
};

export default useRealtimeData;
