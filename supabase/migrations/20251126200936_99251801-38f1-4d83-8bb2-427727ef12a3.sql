-- Create trigger for driver document verification notifications
DROP TRIGGER IF EXISTS notify_driver_verification ON driver_documents;

CREATE TRIGGER notify_driver_verification
  AFTER UPDATE ON driver_documents
  FOR EACH ROW
  EXECUTE FUNCTION notify_verification_status();