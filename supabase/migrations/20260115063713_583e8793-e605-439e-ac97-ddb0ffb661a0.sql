-- Add round trip support to rides table
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS is_round_trip boolean DEFAULT false;
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS return_time timestamp with time zone;

-- Create ride change notifications table
CREATE TABLE IF NOT EXISTS public.ride_change_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id uuid REFERENCES public.rides(id) ON DELETE CASCADE NOT NULL,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
  change_type text NOT NULL,
  old_value text,
  new_value text,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ride_change_notifications ENABLE ROW LEVEL SECURITY;

-- Passengers can view their own notifications
CREATE POLICY "Passengers can view own ride notifications"
  ON public.ride_change_notifications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings 
      WHERE bookings.id = ride_change_notifications.booking_id 
      AND bookings.passenger_id = auth.uid()
    )
  );

-- Drivers can insert notifications for their rides
CREATE POLICY "Drivers can insert ride notifications"
  ON public.ride_change_notifications FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.rides 
      WHERE rides.id = ride_change_notifications.ride_id 
      AND rides.driver_id = auth.uid()
    )
  );

-- Users can mark their notifications as read
CREATE POLICY "Users can update own notifications"
  ON public.ride_change_notifications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings 
      WHERE bookings.id = ride_change_notifications.booking_id 
      AND bookings.passenger_id = auth.uid()
    )
  );

-- Enable realtime for ride change notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.ride_change_notifications;