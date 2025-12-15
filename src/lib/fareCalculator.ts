import { Database } from "@/integrations/supabase/types";

type VehicleType = Database['public']['Enums']['vehicle_type'];

// Current fuel price in Pakistan: 270 PKR per liter
const FUEL_PRICE_PER_LITER = 270;

// Vehicle fuel efficiency (km per liter)
const VEHICLE_EFFICIENCY: Record<VehicleType, number> = {
  sedan: 17,      // ~17 km/L
  suv: 12,        // ~12 km/L
  hatchback: 20,  // ~20 km/L
  van: 10,        // ~10 km/L
  motorcycle: 40, // ~40 km/L
};

// Calculate fuel cost per km: FUEL_PRICE / EFFICIENCY
const FUEL_RATES: Record<VehicleType, number> = {
  sedan: FUEL_PRICE_PER_LITER / VEHICLE_EFFICIENCY.sedan,         // ~15.88 PKR/km
  suv: FUEL_PRICE_PER_LITER / VEHICLE_EFFICIENCY.suv,             // ~22.50 PKR/km
  hatchback: FUEL_PRICE_PER_LITER / VEHICLE_EFFICIENCY.hatchback, // ~13.50 PKR/km
  van: FUEL_PRICE_PER_LITER / VEHICLE_EFFICIENCY.van,             // ~27.00 PKR/km
  motorcycle: FUEL_PRICE_PER_LITER / VEHICLE_EFFICIENCY.motorcycle, // ~6.75 PKR/km
};

// Maintenance cost per km (tires, oil, wear-tear)
const MAINTENANCE_COST: Record<VehicleType, number> = {
  sedan: 5,
  suv: 6,
  hatchback: 4,
  van: 7,
  motorcycle: 2,
};

// Driver's minimum profit margin (PKR)
const DRIVER_BASE_PROFIT = 200;

// Driver profit percentage of trip cost
const DRIVER_PROFIT_PERCENTAGE = 0.25;

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
 * Uses realistic Pakistani fuel prices (270 PKR/L) and vehicle efficiencies
 */
export const calculateFare = (
  distanceKm: number,
  vehicleType: VehicleType,
  numberOfSeats: number
): FareBreakdown => {
  // Base costs
  const fuelCost = distanceKm * FUEL_RATES[vehicleType];
  const maintenanceCost = distanceKm * MAINTENANCE_COST[vehicleType];
  
  // Total trip cost (excluding driver profit)
  const tripCost = fuelCost + maintenanceCost;
  
  // Driver gets base profit plus percentage of trip cost
  const driverProfit = DRIVER_BASE_PROFIT + (tripCost * DRIVER_PROFIT_PERCENTAGE);
  
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
