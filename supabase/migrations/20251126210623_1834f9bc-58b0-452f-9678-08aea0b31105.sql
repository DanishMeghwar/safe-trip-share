-- Add foreign key from driver_documents to profiles
ALTER TABLE driver_documents 
ADD CONSTRAINT driver_documents_driver_profile_fkey 
FOREIGN KEY (driver_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Ensure REPLICA IDENTITY is set
ALTER TABLE driver_documents REPLICA IDENTITY FULL;