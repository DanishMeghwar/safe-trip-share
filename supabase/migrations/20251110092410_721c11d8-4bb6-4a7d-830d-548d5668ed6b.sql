-- Create messages table for booking chats
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_messages_booking_id ON public.messages(booking_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view messages for bookings they're involved in (as driver or passenger)
CREATE POLICY "Users can view messages for their bookings"
  ON public.messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      JOIN public.rides r ON b.ride_id = r.id
      WHERE b.id = messages.booking_id
      AND (b.passenger_id = auth.uid() OR r.driver_id = auth.uid())
    )
  );

-- Policy: Users can send messages to bookings they're involved in
CREATE POLICY "Users can send messages to their bookings"
  ON public.messages
  FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.bookings b
      JOIN public.rides r ON b.ride_id = r.id
      WHERE b.id = messages.booking_id
      AND (b.passenger_id = auth.uid() OR r.driver_id = auth.uid())
    )
  );

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;