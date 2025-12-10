-- 1. Fare validation trigger to prevent client-side manipulation
CREATE OR REPLACE FUNCTION public.validate_booking_fare()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ride_fare_per_seat numeric;
BEGIN
  -- Get the ride's fare per seat
  SELECT fare_per_seat INTO ride_fare_per_seat
  FROM public.rides
  WHERE id = NEW.ride_id;
  
  -- Validate total fare matches seats * fare_per_seat
  IF NEW.total_fare != NEW.seats_requested * ride_fare_per_seat THEN
    RAISE EXCEPTION 'Invalid fare: expected %, got %', 
      NEW.seats_requested * ride_fare_per_seat, NEW.total_fare;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Attach trigger to bookings
DROP TRIGGER IF EXISTS validate_booking_fare_trigger ON public.bookings;
CREATE TRIGGER validate_booking_fare_trigger
  BEFORE INSERT OR UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_booking_fare();

-- 2. Attach verification notification trigger to driver_documents
DROP TRIGGER IF EXISTS notify_driver_verification ON public.driver_documents;
CREATE TRIGGER notify_driver_verification
  AFTER UPDATE ON public.driver_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_verification_status();

-- 3. Location cleanup trigger - delete old locations when ride completes
CREATE OR REPLACE FUNCTION public.cleanup_ride_locations()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- When ride is completed or cancelled, delete live locations
  IF NEW.status IN ('completed', 'cancelled') AND OLD.status NOT IN ('completed', 'cancelled') THEN
    DELETE FROM public.live_locations WHERE ride_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS cleanup_ride_locations_trigger ON public.rides;
CREATE TRIGGER cleanup_ride_locations_trigger
  AFTER UPDATE ON public.rides
  FOR EACH ROW
  EXECUTE FUNCTION public.cleanup_ride_locations();

-- 4. Enable realtime for driver_documents (already set)
ALTER TABLE driver_documents REPLICA IDENTITY FULL;