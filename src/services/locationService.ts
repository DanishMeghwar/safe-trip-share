import { Geolocation, Position } from '@capacitor/geolocation';
import { supabase } from '@/integrations/supabase/client';

export class LocationService {
  private watchId: string | null = null;
  private isTracking = false;

  async requestPermissions(): Promise<boolean> {
    try {
      const permission = await Geolocation.requestPermissions();
      return permission.location === 'granted';
    } catch (error) {
      console.error('Error requesting location permissions:', error);
      return false;
    }
  }

  async getCurrentPosition(): Promise<Position | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Location permission denied');
      }

      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      });
      return position;
    } catch (error) {
      console.error('Error getting current position:', error);
      return null;
    }
  }

  async startTracking(
    rideId: string,
    userId: string,
    callback?: (position: Position) => void
  ): Promise<boolean> {
    if (this.isTracking) {
      console.log('Already tracking location');
      return true;
    }

    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Location permission denied');
      }

      this.watchId = await Geolocation.watchPosition(
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        },
        async (position, error) => {
          if (error) {
            console.error('Location tracking error:', error);
            return;
          }

          if (position) {
            // Update location in database
            await this.updateLocation(rideId, userId, position);
            
            // Call callback if provided
            if (callback) {
              callback(position);
            }
          }
        }
      );

      this.isTracking = true;
      return true;
    } catch (error) {
      console.error('Error starting location tracking:', error);
      return false;
    }
  }

  async stopTracking(): Promise<void> {
    if (this.watchId) {
      await Geolocation.clearWatch({ id: this.watchId });
      this.watchId = null;
      this.isTracking = false;
    }
  }

  private async updateLocation(
    rideId: string,
    userId: string,
    position: Position
  ): Promise<void> {
    try {
      const { coords } = position;
      
      await supabase.from('live_locations').upsert(
        {
          ride_id: rideId,
          user_id: userId,
          latitude: coords.latitude,
          longitude: coords.longitude,
          speed: coords.speed || null,
          heading: coords.heading || null,
          accuracy: coords.accuracy || null,
          updated_at: new Date().toISOString()
        },
        {
          onConflict: 'ride_id,user_id'
        }
      );
    } catch (error) {
      console.error('Error updating location:', error);
    }
  }

  isCurrentlyTracking(): boolean {
    return this.isTracking;
  }
}

export const locationService = new LocationService();
