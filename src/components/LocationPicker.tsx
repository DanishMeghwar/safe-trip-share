import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { MapPin, Search, Loader2 } from 'lucide-react';
import { searchLocation, GeocodingResult } from '@/services/geocodingService';
import LeafletMap from './LeafletMap';
import { cn } from '@/lib/utils';

interface LocationPickerProps {
  label: string;
  value: string;
  onChange: (location: string, lat: number | null, lng: number | null) => void;
  placeholder?: string;
  className?: string;
}

const LocationPicker = ({
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

  // Debounced search
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
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelect = useCallback((result: GeocodingResult) => {
    setSearchQuery(result.displayName.split(',').slice(0, 2).join(','));
    setSelectedCoords([result.lat, result.lng]);
    onChange(result.displayName.split(',').slice(0, 2).join(','), result.lat, result.lng);
    setShowResults(false);
  }, [onChange]);

  const handleMapClick = useCallback((lat: number, lng: number) => {
    setSelectedCoords([lat, lng]);
    onChange(searchQuery || `${lat.toFixed(4)}, ${lng.toFixed(4)}`, lat, lng);
  }, [searchQuery, onChange]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchQuery(newValue);
    onChange(newValue, null, null);
  };

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

      {/* Map */}
      {showMap && (
        <div className="mt-2">
          <LeafletMap
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
      )}

      {selectedCoords && (
        <p className="text-xs text-muted-foreground">
          Coordinates: {selectedCoords[0].toFixed(4)}, {selectedCoords[1].toFixed(4)}
        </p>
      )}
    </div>
  );
};

export default LocationPicker;
