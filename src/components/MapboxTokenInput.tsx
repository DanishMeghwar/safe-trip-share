import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, ExternalLink, Check, X } from "lucide-react";

const MAPBOX_TOKEN_KEY = "shareride_mapbox_token";

interface MapboxTokenInputProps {
  onTokenChange: (token: string | null) => void;
  compact?: boolean;
}

export const useMapboxToken = () => {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(MAPBOX_TOKEN_KEY);
    if (stored) setToken(stored);
  }, []);

  const saveToken = (newToken: string) => {
    localStorage.setItem(MAPBOX_TOKEN_KEY, newToken);
    setToken(newToken);
  };

  const clearToken = () => {
    localStorage.removeItem(MAPBOX_TOKEN_KEY);
    setToken(null);
  };

  return { token, saveToken, clearToken };
};

export const MapboxTokenInput = ({ onTokenChange, compact = false }: MapboxTokenInputProps) => {
  const [inputValue, setInputValue] = useState("");
  const { token, saveToken, clearToken } = useMapboxToken();

  useEffect(() => {
    onTokenChange(token);
  }, [token, onTokenChange]);

  const handleSave = () => {
    if (inputValue.startsWith("pk.")) {
      saveToken(inputValue);
      setInputValue("");
    }
  };

  const handleClear = () => {
    clearToken();
  };

  if (token) {
    if (compact) {
      return (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Check className="w-4 h-4 text-green-500" />
          <span>Mapbox connected</span>
          <Button variant="ghost" size="sm" onClick={handleClear} className="h-6 px-2">
            <X className="w-3 h-3" />
          </Button>
        </div>
      );
    }
    return (
      <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
        <CardContent className="py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
            <Check className="w-5 h-5" />
            <span className="font-medium">Mapbox Connected</span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleClear}>
            Disconnect
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Input
          placeholder="Mapbox token (pk.xxx)"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="h-8 text-sm flex-1"
        />
        <Button size="sm" onClick={handleSave} disabled={!inputValue.startsWith("pk.")} className="h-8">
          Add
        </Button>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" />
          Enable Map View
        </CardTitle>
        <CardDescription>
          Add your Mapbox token to see rides on a map
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="mapbox-token">Mapbox Public Token</Label>
          <Input
            id="mapbox-token"
            placeholder="pk.eyJ1Ijoi..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Get your free token from{" "}
            <a
              href="https://account.mapbox.com/access-tokens/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline inline-flex items-center gap-1"
            >
              mapbox.com <ExternalLink className="w-3 h-3" />
            </a>
          </p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={!inputValue.startsWith("pk.")}
          className="w-full"
        >
          Enable Map
        </Button>
      </CardContent>
    </Card>
  );
};

export default MapboxTokenInput;
