-- Enable realtime for driver_documents table
ALTER PUBLICATION supabase_realtime ADD TABLE driver_documents;

-- Ensure profiles table has email column visible for admin queries
-- Update the RLS policy for driver documents to ensure admins can fetch with profile joins
DROP POLICY IF EXISTS "Admins can view all driver documents" ON driver_documents;

CREATE POLICY "Admins can view all driver documents"
ON driver_documents
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Ensure profiles can be queried by admins for driver document verification
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

CREATE POLICY "Admins can view all profiles"
ON profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = id 
  OR EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
  OR EXISTS (
    SELECT 1
    FROM bookings b
    JOIN rides r ON b.ride_id = r.id
    WHERE (
      (b.passenger_id = auth.uid() AND r.driver_id = profiles.id)
      OR (r.driver_id = auth.uid() AND b.passenger_id = profiles.id)
    )
  )
);