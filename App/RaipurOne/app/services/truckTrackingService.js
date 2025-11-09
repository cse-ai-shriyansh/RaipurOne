import { isSupabaseConfigured, supabase, TABLES } from './supabase';

/**
 * Truck Tracking Service
 * Handles real-time truck location tracking, distance calculations, and ETA estimates
 */

// Average speed of garbage truck in km/h (conservative estimate)
const AVERAGE_TRUCK_SPEED_KMH = 20;

// Haversine formula to calculate distance between two coordinates
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance; // Returns distance in kilometers
};

const toRad = (degrees) => {
  return degrees * (Math.PI / 180);
};

/**
 * Calculate estimated time of arrival in minutes
 * @param {number} distanceKm - Distance in kilometers
 * @param {number} speedKmh - Speed in km/h (default: 20)
 * @returns {number} ETA in minutes
 */
const calculateETAMinutes = (distanceKm, speedKmh = AVERAGE_TRUCK_SPEED_KMH) => {
  const hours = distanceKm / speedKmh;
  const minutes = Math.ceil(hours * 60);
  return minutes;
};

/**
 * Mock truck data for offline/demo mode
 */
const MOCK_TRUCKS = [
  {
    id: 'mock-1',
    truck_number: 'RG-01-1234',
    driver_name: 'Ramesh Kumar',
    driver_phone: '9876543210',
    current_latitude: 21.2514,
    current_longitude: 81.6296,
    status: 'available',
    zone: 'Civil Lines',
    last_updated: new Date().toISOString()
  },
  {
    id: 'mock-2',
    truck_number: 'RG-01-5678',
    driver_name: 'Suresh Patel',
    driver_phone: '9876543211',
    current_latitude: 21.2379,
    current_longitude: 81.6337,
    status: 'available',
    zone: 'Pandri',
    last_updated: new Date().toISOString()
  },
  {
    id: 'mock-3',
    truck_number: 'RG-01-9012',
    driver_name: 'Mahesh Verma',
    driver_phone: '9876543212',
    current_latitude: 21.2167,
    current_longitude: 81.6335,
    status: 'busy',
    zone: 'Shankar Nagar',
    last_updated: new Date().toISOString()
  },
  {
    id: 'mock-4',
    truck_number: 'RG-01-3456',
    driver_name: 'Dinesh Singh',
    driver_phone: '9876543213',
    current_latitude: 21.2711,
    current_longitude: 81.6051,
    status: 'available',
    zone: 'Devendra Nagar',
    last_updated: new Date().toISOString()
  },
  {
    id: 'mock-5',
    truck_number: 'RG-01-7890',
    driver_name: 'Rajesh Yadav',
    driver_phone: '9876543214',
    current_latitude: 21.1959,
    current_longitude: 81.6871,
    status: 'available',
    zone: 'Mowa',
    last_updated: new Date().toISOString()
  }
];

class TruckTrackingService {
  constructor() {
    this.realtimeSubscription = null;
  }

  /**
   * Get all trucks from database
   */
  async getAllTrucks() {
    if (!isSupabaseConfigured) {
      console.log('Using mock truck data (Supabase not configured)');
      return MOCK_TRUCKS;
    }

    try {
      const { data, error } = await supabase
        .from(TABLES.KACHRA_GADI_TRUCKS)
        .select('*')
        .order('truck_number');

      if (error) {
        console.error('Error fetching trucks:', error);
        return MOCK_TRUCKS;
      }

      return data || [];
    } catch (err) {
      console.error('Exception fetching trucks:', err);
      return MOCK_TRUCKS;
    }
  }

  /**
   * Get only available trucks
   */
  async getAvailableTrucks() {
    const allTrucks = await this.getAllTrucks();
    return allTrucks.filter(truck => truck.status === 'available');
  }

  /**
   * Get trucks within a certain radius
   * @param {number} userLat - User's latitude
   * @param {number} userLng - User's longitude
   * @param {number} radiusKm - Search radius in kilometers
   */
  async getNearbyTrucks(userLat, userLng, radiusKm = 10) {
    const allTrucks = await this.getAllTrucks();
    
    const trucksWithDistance = allTrucks.map(truck => {
      const distance = calculateDistance(
        userLat,
        userLng,
        truck.current_latitude,
        truck.current_longitude
      );
      
      return {
        ...truck,
        distance: distance,
        distanceText: distance < 1 
          ? `${Math.round(distance * 1000)} m` 
          : `${distance.toFixed(1)} km`
      };
    });

    // Filter by radius
    const nearbyTrucks = trucksWithDistance.filter(
      truck => truck.distance <= radiusKm
    );

    // Sort by distance (closest first)
    nearbyTrucks.sort((a, b) => a.distance - b.distance);

    return nearbyTrucks;
  }

  /**
   * Find the nearest available truck
   * @param {number} userLat - User's latitude
   * @param {number} userLng - User's longitude
   */
  async findNearestTruck(userLat, userLng) {
    const availableTrucks = await this.getAvailableTrucks();
    
    if (availableTrucks.length === 0) {
      return null;
    }

    let nearestTruck = null;
    let minDistance = Infinity;

    availableTrucks.forEach(truck => {
      const distance = calculateDistance(
        userLat,
        userLng,
        truck.current_latitude,
        truck.current_longitude
      );

      if (distance < minDistance) {
        minDistance = distance;
        nearestTruck = {
          ...truck,
          distance: distance,
          distanceText: distance < 1 
            ? `${Math.round(distance * 1000)} m` 
            : `${distance.toFixed(1)} km`,
          eta: calculateETAMinutes(distance),
          etaText: this.formatETA(calculateETAMinutes(distance))
        };
      }
    });

    return nearestTruck;
  }

  /**
   * Calculate ETA between two points
   * @param {number} fromLat - Starting latitude
   * @param {number} fromLng - Starting longitude
   * @param {number} toLat - Destination latitude
   * @param {number} toLng - Destination longitude
   */
  calculateETA(fromLat, fromLng, toLat, toLng) {
    const distance = calculateDistance(fromLat, fromLng, toLat, toLng);
    const etaMinutes = calculateETAMinutes(distance);
    
    return {
      distance: distance,
      distanceText: distance < 1 
        ? `${Math.round(distance * 1000)} m` 
        : `${distance.toFixed(1)} km`,
      eta: etaMinutes,
      etaText: this.formatETA(etaMinutes)
    };
  }

  /**
   * Format ETA minutes into readable text
   */
  formatETA(minutes) {
    if (minutes < 1) return 'Less than 1 min';
    if (minutes < 60) return `${minutes} min`;
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (mins === 0) return `${hours} hr`;
    return `${hours} hr ${mins} min`;
  }

  /**
   * Subscribe to real-time truck location updates
   * @param {Function} callback - Called with updated trucks array
   */
  subscribeToTruckUpdates(callback) {
    if (!isSupabaseConfigured) {
      console.log('Real-time updates not available (Supabase not configured)');
      return () => {}; // Return empty unsubscribe function
    }

    try {
      this.realtimeSubscription = supabase
        .channel('trucks-channel')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: TABLES.KACHRA_GADI_TRUCKS
          },
          async (payload) => {
            console.log('Truck update received:', payload);
            // Fetch fresh data and notify callback
            const trucks = await this.getAllTrucks();
            callback(trucks);
          }
        )
        .subscribe();

      // Return unsubscribe function
      return () => {
        if (this.realtimeSubscription) {
          supabase.removeChannel(this.realtimeSubscription);
          this.realtimeSubscription = null;
        }
      };
    } catch (err) {
      console.error('Error setting up real-time subscription:', err);
      return () => {};
    }
  }

  /**
   * Update truck location (for driver app or admin)
   * @param {string} truckId - Truck UUID
   * @param {number} latitude - New latitude
   * @param {number} longitude - New longitude
   * @param {string} status - Truck status (optional)
   */
  async updateTruckLocation(truckId, latitude, longitude, status = null) {
    if (!isSupabaseConfigured) {
      console.log('Cannot update truck location (Supabase not configured)');
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      const updates = {
        current_latitude: latitude,
        current_longitude: longitude,
        last_updated: new Date().toISOString()
      };

      if (status) {
        updates.status = status;
      }

      const { data, error } = await supabase
        .from(TABLES.KACHRA_GADI_TRUCKS)
        .update(updates)
        .eq('id', truckId)
        .select();

      if (error) {
        console.error('Error updating truck location:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (err) {
      console.error('Exception updating truck location:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Assign truck to a request
   * @param {string} requestId - Request UUID
   * @param {string} truckId - Truck UUID
   */
  async assignTruckToRequest(requestId, truckId) {
    if (!isSupabaseConfigured) {
      console.log('Cannot assign truck (Supabase not configured)');
      return { success: false };
    }

    try {
      // Update request with assigned truck
      const { error: requestError } = await supabase
        .from(TABLES.KACHRA_GADI)
        .update({ assigned_truck_id: truckId })
        .eq('id', requestId);

      if (requestError) throw requestError;

      // Update truck status to busy
      const { error: truckError } = await supabase
        .from(TABLES.KACHRA_GADI_TRUCKS)
        .update({ status: 'busy' })
        .eq('id', truckId);

      if (truckError) throw truckError;

      return { success: true };
    } catch (err) {
      console.error('Error assigning truck:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Get truck by ID
   */
  async getTruckById(truckId) {
    if (!isSupabaseConfigured) {
      return MOCK_TRUCKS.find(t => t.id === truckId) || null;
    }

    try {
      const { data, error } = await supabase
        .from(TABLES.KACHRA_GADI_TRUCKS)
        .select('*')
        .eq('id', truckId)
        .single();

      if (error) {
        console.error('Error fetching truck:', error);
        return null;
      }

      return data;
    } catch (err) {
      console.error('Exception fetching truck:', err);
      return null;
    }
  }
}

// Export singleton instance
const truckTrackingService = new TruckTrackingService();
export default truckTrackingService;
