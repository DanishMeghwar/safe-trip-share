-- Create SECURITY DEFINER functions to break circular RLS dependencies

-- Function to check if user is the driver for a specific ride
CREATE OR REPLACE FUNCTION public.user_is_driver_for_ride(_ride_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.rides
    WHERE id = _ride_id AND driver_id = _user_id
  )
$$;

-- Function to check if user has a booking for a specific ride
CREATE OR REPLACE FUNCTION public.user_has_booking_for_ride(_ride_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.bookings
    WHERE ride_id = _ride_id AND passenger_id = _user_id
  )
$$;

-- Drop existing policies with circular dependencies
DROP POLICY IF EXISTS "Users can view own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can update own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can view appropriate ride details" ON public.rides;

-- Recreate bookings policies using SECURITY DEFINER functions
CREATE POLICY "Users can view own bookings"
ON public.bookings
FOR SELECT
USING (
  passenger_id = auth.uid() OR
  public.user_is_driver_for_ride(ride_id, auth.uid())
);

CREATE POLICY "Users can update own bookings"
ON public.bookings
FOR UPDATE
USING (
  passenger_id = auth.uid() OR
  public.user_is_driver_for_ride(ride_id, auth.uid())
);

-- Recreate rides policy using SECURITY DEFINER function
CREATE POLICY "Users can view appropriate ride details"
ON public.rides
FOR SELECT
USING (
  driver_id = auth.uid() OR
  public.user_has_booking_for_ride(id, auth.uid()) OR
  status IN ('scheduled', 'active')
);