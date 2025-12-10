-- Enable real-time for rides and live_locations tables
ALTER TABLE rides REPLICA IDENTITY FULL;
ALTER TABLE live_locations REPLICA IDENTITY FULL;

-- Add tables to realtime publication (ignore errors if already exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'rides'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE rides;
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'live_locations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE live_locations;
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;