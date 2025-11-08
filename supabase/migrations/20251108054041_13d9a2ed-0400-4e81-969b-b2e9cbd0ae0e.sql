-- Create storage buckets for document verification
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('driver-licenses', 'driver-licenses', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']),
  ('cnic-documents', 'cnic-documents', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']),
  ('vehicle-registrations', 'vehicle-registrations', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- RLS policies for driver-licenses bucket
CREATE POLICY "Drivers can upload own license images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'driver-licenses' AND
  auth.uid()::text = (storage.foldername(name))[1] AND
  public.has_role(auth.uid(), 'driver'::user_role)
);

CREATE POLICY "Drivers can view own license images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'driver-licenses' AND
  (auth.uid()::text = (storage.foldername(name))[1] OR
   public.has_role(auth.uid(), 'admin'::user_role))
);

CREATE POLICY "Admins can view all license images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'driver-licenses' AND
  public.has_role(auth.uid(), 'admin'::user_role)
);

-- RLS policies for cnic-documents bucket
CREATE POLICY "Users can upload own CNIC documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'cnic-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view own CNIC documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'cnic-documents' AND
  (auth.uid()::text = (storage.foldername(name))[1] OR
   public.has_role(auth.uid(), 'admin'::user_role))
);

-- RLS policies for vehicle-registrations bucket
CREATE POLICY "Drivers can upload own vehicle registration"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'vehicle-registrations' AND
  auth.uid()::text = (storage.foldername(name))[1] AND
  public.has_role(auth.uid(), 'driver'::user_role)
);

CREATE POLICY "Drivers can view own vehicle registration"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'vehicle-registrations' AND
  (auth.uid()::text = (storage.foldername(name))[1] OR
   public.has_role(auth.uid(), 'admin'::user_role))
);

-- Create notifications table for verification updates
CREATE TABLE IF NOT EXISTS public.verification_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL CHECK (type IN ('success', 'error', 'info', 'warning')),
  read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.verification_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
ON public.verification_notifications
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
ON public.verification_notifications
FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Admins can insert notifications"
ON public.verification_notifications
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'::user_role));

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.verification_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.verification_notifications(read);

-- Create function to send verification notification
CREATE OR REPLACE FUNCTION public.notify_verification_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only send notification if verification status changed
  IF NEW.is_verified IS DISTINCT FROM OLD.is_verified THEN
    INSERT INTO public.verification_notifications (user_id, title, message, type)
    VALUES (
      NEW.driver_id,
      CASE 
        WHEN NEW.is_verified THEN 'Documents Verified ✓'
        ELSE 'Documents Need Review'
      END,
      CASE
        WHEN NEW.is_verified THEN 'Your driver documents have been verified successfully. You can now create rides.'
        ELSE 'Your documents require additional review. Please check the verification page for details.'
      END,
      CASE
        WHEN NEW.is_verified THEN 'success'
        ELSE 'warning'
      END
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger to send notification when driver documents are verified
CREATE TRIGGER notify_driver_verification
AFTER UPDATE ON public.driver_documents
FOR EACH ROW
EXECUTE FUNCTION public.notify_verification_status();

-- Update profiles table to add CNIC document URL
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cnic_document_url text;