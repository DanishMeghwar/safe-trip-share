import { useState, useEffect, useCallback, memo, lazy, Suspense } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, Search, Loader2 } from 'lucide-react';
import { searchLocation, GeocodingResult, reverseGeocode } from '@/services/geocodingService';
import { cn } from '@/lib/utils';

// Lazy load map for better performance
const MapboxMap = lazy(() => import('./MapboxMap'));

interface LocationPickerProps {
  label: string;
  value: string;
  onChange: (location: string, lat: number | null, lng: number | null) => void;
  placeholder?: string;
  className?: string;
}

const LocationPicker = memo(({
  label,
  value,
  onChange,
  placeholder = 'Enter location',
  className,
}: LocationPickerProps) => {
  const [searchQuery, setSearchQuery] = useState(value);
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedCoords, setSelectedCoords] = useState<[number, number] | null>(null);
  const [showMap, setShowMap] = useState(false);

  // Debounced search with longer delay for better performance
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length >= 3) {
        setIsSearching(true);
        const searchResults = await searchLocation(searchQuery);
        setResults(searchResults);
        setShowResults(searchResults.length > 0);
        setIsSearching(false);
      } else {
        setResults([]);
        setShowResults(false);
      }
    }, 800); // Increased debounce for better performance

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelect = useCallback((result: GeocodingResult) => {
    const shortName = result.displayName.split(',').slice(0, 2).join(',');
    setSearchQuery(shortName);
    setSelectedCoords([result.lat, result.lng]);
    onChange(shortName, result.lat, result.lng);
    setShowResults(false);
  }, [onChange]);

  const handleMapClick = useCallback(async (lat: number, lng: number) => {
    setSelectedCoords([lat, lng]);
    // Reverse geocode to get location name
    const locationName = await reverseGeocode(lat, lng);
    const shortName = locationName.split(',').slice(0, 2).join(',');
    setSearchQuery(shortName);
    onChange(shortName, lat, lng);
  }, [onChange]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchQuery(newValue);
    onChange(newValue, null, null);
  }, [onChange]);

  return (
    <div className={cn('space-y-2', className)}>
      <Label className="flex items-center gap-2">
        <MapPin className="w-4 h-4 text-primary" />
        {label}
      </Label>
      
      <div className="relative">
        <div className="relative">
          <Input
            value={searchQuery}
            onChange={handleInputChange}
            placeholder={placeholder}
            className="pr-10"
            onFocus={() => results.length > 0 && setShowResults(true)}
          />
          {isSearching ? (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
          ) : (
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          )}
        </div>

        {/* Search Results Dropdown */}
        {showResults && (
          <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
            {results.map((result, index) => (
              <button
                key={index}
                type="button"
                className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-start gap-2"
                onClick={() => handleSelect(result)}
              >
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary" />
                <span className="line-clamp-2">{result.displayName}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map Toggle */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setShowMap(!showMap)}
        className="w-full"
      >
        <MapPin className="w-4 h-4 mr-2" />
        {showMap ? 'Hide Map' : 'Pick on Map'}
      </Button>

      {/* Lazy loaded Map */}
      {showMap && (
        <Suspense fallback={<Skeleton className="h-[200px] w-full rounded-lg" />}>
          <div className="mt-2">
            <MapboxMap
              center={selectedCoords || [30.3753, 69.3451]}
              zoom={selectedCoords ? 14 : 6}
              markers={selectedCoords ? [{ id: 'selected', lat: selectedCoords[0], lng: selectedCoords[1], type: 'pickup' }] : []}
              onMapClick={handleMapClick}
              className="h-[200px]"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Click on the map to select a location
            </p>
          </div>
        </Suspense>
      )}

      {selectedCoords && (
        <p className="text-xs text-muted-foreground">
          📍 {selectedCoords[0].toFixed(4)}, {selectedCoords[1].toFixed(4)}
        </p>
      )}
    </div>
  );
});

LocationPicker.displayName = 'LocationPicker';

export default LocationPicker;
