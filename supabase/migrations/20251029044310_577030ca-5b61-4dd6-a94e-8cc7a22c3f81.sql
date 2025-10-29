-- Create enum types
CREATE TYPE public.user_role AS ENUM ('driver', 'passenger');
CREATE TYPE public.ride_status AS ENUM ('scheduled', 'active', 'completed', 'cancelled');
CREATE TYPE public.booking_status AS ENUM ('pending', 'confirmed', 'rejected', 'completed', 'cancelled');
CREATE TYPE public.vehicle_type AS ENUM ('sedan', 'suv', 'hatchback', 'van', 'motorcycle');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  cnic TEXT,
  is_phone_verified BOOLEAN DEFAULT false,
  is_cnic_verified BOOLEAN DEFAULT false,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create user_roles table (security best practice - separate from profiles)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role user_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Create security definer function to check user roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role user_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create vehicles table
CREATE TABLE public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  vehicle_type vehicle_type NOT NULL,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  color TEXT NOT NULL,
  plate_number TEXT NOT NULL,
  seats_available INTEGER NOT NULL CHECK (seats_available > 0 AND seats_available <= 8),
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create driver_documents table
CREATE TABLE public.driver_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  license_number TEXT NOT NULL,
  license_image_url TEXT,
  license_expiry DATE NOT NULL,
  vehicle_registration_url TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create rides table
CREATE TABLE public.rides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE NOT NULL,
  from_location TEXT NOT NULL,
  to_location TEXT NOT NULL,
  from_lat DOUBLE PRECISION,
  from_lng DOUBLE PRECISION,
  to_lat DOUBLE PRECISION,
  to_lng DOUBLE PRECISION,
  departure_time TIMESTAMP WITH TIME ZONE NOT NULL,
  available_seats INTEGER NOT NULL CHECK (available_seats >= 0),
  fare_per_seat NUMERIC(10, 2) NOT NULL CHECK (fare_per_seat >= 0),
  status ride_status DEFAULT 'scheduled',
  route_distance_km NUMERIC(10, 2),
  estimated_duration_minutes INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create bookings table
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID REFERENCES public.rides(id) ON DELETE CASCADE NOT NULL,
  passenger_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  seats_requested INTEGER NOT NULL CHECK (seats_requested > 0),
  total_fare NUMERIC(10, 2) NOT NULL CHECK (total_fare >= 0),
  status booking_status DEFAULT 'pending',
  pickup_location TEXT,
  pickup_lat DOUBLE PRECISION,
  pickup_lng DOUBLE PRECISION,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create reviews table
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
  reviewer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reviewed_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create emergency_contacts table
CREATE TABLE public.emergency_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  contact_name TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  relationship TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own roles during signup"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for vehicles
CREATE POLICY "Anyone can view verified vehicles"
  ON public.vehicles FOR SELECT
  TO authenticated
  USING (is_verified = true OR driver_id = auth.uid());

CREATE POLICY "Drivers can insert own vehicles"
  ON public.vehicles FOR INSERT
  TO authenticated
  WITH CHECK (driver_id = auth.uid() AND public.has_role(auth.uid(), 'driver'));

CREATE POLICY "Drivers can update own vehicles"
  ON public.vehicles FOR UPDATE
  TO authenticated
  USING (driver_id = auth.uid());

-- RLS Policies for driver_documents
CREATE POLICY "Drivers can view own documents"
  ON public.driver_documents FOR SELECT
  TO authenticated
  USING (driver_id = auth.uid());

CREATE POLICY "Drivers can insert own documents"
  ON public.driver_documents FOR INSERT
  TO authenticated
  WITH CHECK (driver_id = auth.uid() AND public.has_role(auth.uid(), 'driver'));

CREATE POLICY "Drivers can update own documents"
  ON public.driver_documents FOR UPDATE
  TO authenticated
  USING (driver_id = auth.uid());

-- RLS Policies for rides
CREATE POLICY "Anyone can view active rides"
  ON public.rides FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Drivers can insert own rides"
  ON public.rides FOR INSERT
  TO authenticated
  WITH CHECK (driver_id = auth.uid() AND public.has_role(auth.uid(), 'driver'));

CREATE POLICY "Drivers can update own rides"
  ON public.rides FOR UPDATE
  TO authenticated
  USING (driver_id = auth.uid());

-- RLS Policies for bookings
CREATE POLICY "Users can view own bookings"
  ON public.bookings FOR SELECT
  TO authenticated
  USING (passenger_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.rides WHERE rides.id = bookings.ride_id AND rides.driver_id = auth.uid()
  ));

CREATE POLICY "Passengers can insert bookings"
  ON public.bookings FOR INSERT
  TO authenticated
  WITH CHECK (passenger_id = auth.uid() AND public.has_role(auth.uid(), 'passenger'));

CREATE POLICY "Users can update own bookings"
  ON public.bookings FOR UPDATE
  TO authenticated
  USING (passenger_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.rides WHERE rides.id = bookings.ride_id AND rides.driver_id = auth.uid()
  ));

-- RLS Policies for reviews
CREATE POLICY "Anyone can view reviews"
  ON public.reviews FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own reviews"
  ON public.reviews FOR INSERT
  TO authenticated
  WITH CHECK (reviewer_id = auth.uid());

-- RLS Policies for emergency_contacts
CREATE POLICY "Users can manage own emergency contacts"
  ON public.emergency_contacts FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_vehicles_driver_id ON public.vehicles(driver_id);
CREATE INDEX idx_rides_driver_id ON public.rides(driver_id);
CREATE INDEX idx_rides_status ON public.rides(status);
CREATE INDEX idx_rides_departure_time ON public.rides(departure_time);
CREATE INDEX idx_bookings_ride_id ON public.bookings(ride_id);
CREATE INDEX idx_bookings_passenger_id ON public.bookings(passenger_id);
CREATE INDEX idx_reviews_reviewed_id ON public.reviews(reviewed_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON public.vehicles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_driver_documents_updated_at BEFORE UPDATE ON public.driver_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rides_updated_at BEFORE UPDATE ON public.rides
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_emergency_contacts_updated_at BEFORE UPDATE ON public.emergency_contacts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();