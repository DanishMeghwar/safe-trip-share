-- Enable real-time for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.rides;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.vehicles;

-- Add REPLICA IDENTITY FULL for complete row data during updates
ALTER TABLE public.rides REPLICA IDENTITY FULL;
ALTER TABLE public.bookings REPLICA IDENTITY FULL;
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER TABLE public.vehicles REPLICA IDENTITY FULL;

-- Add live location tracking table for active rides
CREATE TABLE public.live_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id uuid NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  speed double precision,
  heading double precision,
  accuracy double precision,
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(ride_id, user_id)
);

ALTER TABLE public.live_locations ENABLE ROW LEVEL SECURITY;

-- Policy: Users in active rides can view live locations
CREATE POLICY "Users can view live locations for their rides"
ON public.live_locations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.rides r
    WHERE r.id = live_locations.ride_id
    AND (
      r.driver_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.bookings b
        WHERE b.ride_id = r.id AND b.passenger_id = auth.uid()
      )
    )
  )
);

-- Policy: Users can update their own location
CREATE POLICY "Users can update own location"
ON public.live_locations FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own location updates"
ON public.live_locations FOR UPDATE
USING (user_id = auth.uid());

-- Enable real-time for live locations
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_locations;
ALTER TABLE public.live_locations REPLICA IDENTITY FULL;

-- Add push notification tokens table
CREATE TABLE public.push_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token text NOT NULL,
  platform text NOT NULL CHECK (platform IN ('android', 'ios', 'web')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, token)
);

ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own tokens"
ON public.push_tokens FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Add notification preferences
CREATE TABLE public.notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  booking_updates boolean DEFAULT true,
  ride_reminders boolean DEFAULT true,
  location_sharing boolean DEFAULT true,
  chat_messages boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own preferences"
ON public.notification_preferences FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Function to update updated_at timestamp
CREATE TRIGGER update_push_tokens_updated_at
BEFORE UPDATE ON public.push_tokens
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at
BEFORE UPDATE ON public.notification_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();