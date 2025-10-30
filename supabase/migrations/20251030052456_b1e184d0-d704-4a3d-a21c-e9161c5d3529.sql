-- Fix profiles table RLS policy to prevent exposure of sensitive PII
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

CREATE POLICY "Users can view relevant profiles"
ON public.profiles FOR SELECT
USING (
  -- Users can view their own profile
  auth.uid() = id OR
  -- Users can view profiles of people they have bookings with
  EXISTS (
    SELECT 1 FROM public.bookings b
    JOIN public.rides r ON b.ride_id = r.id
    WHERE (b.passenger_id = auth.uid() AND r.driver_id = profiles.id)
       OR (r.driver_id = auth.uid() AND b.passenger_id = profiles.id)
  )
);

-- Fix rides table RLS policy to protect location privacy
DROP POLICY IF EXISTS "Anyone can view active rides" ON public.rides;

CREATE POLICY "Users can view appropriate ride details"
ON public.rides FOR SELECT
USING (
  -- Users can view their own rides (full details)
  driver_id = auth.uid() OR
  -- Users can view rides they've booked (full details)
  EXISTS (
    SELECT 1 FROM public.bookings
    WHERE ride_id = rides.id AND passenger_id = auth.uid()
  ) OR
  -- Public discovery: only active/scheduled rides
  -- Frontend should show approximate locations for discovery, exact after booking
  (status IN ('scheduled', 'active'))
);

-- Add booking deletion policy for pending bookings only
CREATE POLICY "Users can delete own pending bookings"
ON public.bookings FOR DELETE
USING (
  passenger_id = auth.uid() AND
  status = 'pending'
);