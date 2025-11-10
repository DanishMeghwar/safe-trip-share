import { Database } from "@/integrations/supabase/types";

type VehicleType = Database['public']['Enums']['vehicle_type'];

// Fuel consumption rates in PKR per kilometer for different vehicle types
const FUEL_RATES: Record<VehicleType, number> = {
  sedan: 8,
  suv: 12,
  hatchback: 6,
  van: 10,
  motorcycle: 4,
};

// Base maintenance and wear-tear cost per km
const MAINTENANCE_COST_PER_KM = 2;

// Driver's minimum profit margin (PKR)
const DRIVER_BASE_PROFIT = 100;

export interface FareBreakdown {
  totalFare: number;
  farePerSeat: number;
  fuelCost: number;
  maintenanceCost: number;
  driverProfit: number;
  distanceKm: number;
  passengerShare: number;
}

/**
 * Calculate fare based on distance, vehicle type, and number of passengers
 * The cost is shared among passengers, with driver getting a base profit
 */
export const calculateFare = (
  distanceKm: number,
  vehicleType: VehicleType,
  numberOfSeats: number
): FareBreakdown => {
  // Base costs
  const fuelCost = distanceKm * FUEL_RATES[vehicleType];
  const maintenanceCost = distanceKm * MAINTENANCE_COST_PER_KM;
  
  // Total trip cost (excluding driver profit)
  const tripCost = fuelCost + maintenanceCost;
  
  // Driver gets base profit plus share of trip cost savings
  const driverProfit = DRIVER_BASE_PROFIT + (tripCost * 0.15);
  
  // Total fare for the trip
  const totalFare = tripCost + driverProfit;
  
  // Split among passengers
  const farePerSeat = Math.ceil(totalFare / numberOfSeats);
  
  // Passenger's share of costs
  const passengerShare = Math.ceil(tripCost / numberOfSeats);
  
  return {
    totalFare: Math.ceil(totalFare),
    farePerSeat,
    fuelCost: Math.ceil(fuelCost),
    maintenanceCost: Math.ceil(maintenanceCost),
    driverProfit: Math.ceil(driverProfit),
    distanceKm,
    passengerShare,
  };
};

/**
 * Get a suggested fare with some flexibility for negotiation
 * Returns min, suggested, and max fare
 */
export const getSuggestedFareRange = (
  distanceKm: number,
  vehicleType: VehicleType,
  numberOfSeats: number
) => {
  const calculated = calculateFare(distanceKm, vehicleType, numberOfSeats);
  
  return {
    min: Math.ceil(calculated.farePerSeat * 0.85), // 15% below calculated
    suggested: calculated.farePerSeat,
    max: Math.ceil(calculated.farePerSeat * 1.25), // 25% above calculated
    breakdown: calculated,
  };
};
