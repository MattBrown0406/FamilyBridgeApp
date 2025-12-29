import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { MapPin, Loader2, Navigation } from 'lucide-react';

export interface LocationData {
  latitude: number;
  longitude: number;
  address: string | null;
}

interface LocationCaptureProps {
  onLocationCaptured?: (location: LocationData) => void;
  showCapturedState?: boolean;
  buttonLabel?: string;
  buttonLoadingLabel?: string;
  className?: string;
}

export const LocationCapture = ({
  onLocationCaptured,
  showCapturedState = true,
  buttonLabel = 'Capture My Location',
  buttonLoadingLabel = 'Getting location...',
  className = '',
}: LocationCaptureProps) => {
  const { toast } = useToast();
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const getLocation = () => {
    setIsGettingLocation(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      setIsGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setLatitude(lat);
        setLongitude(lng);

        // Try to get address from coordinates using reverse geocoding
        let fetchedAddress: string | null = null;
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
          );
          const data = await response.json();
          if (data.display_name) {
            fetchedAddress = data.display_name;
            setAddress(fetchedAddress);
          }
        } catch (error) {
          console.log('Could not fetch address:', error);
        }

        setIsGettingLocation(false);
        toast({
          title: 'Location captured',
          description: 'Your current location has been recorded.',
        });

        onLocationCaptured?.({
          latitude: lat,
          longitude: lng,
          address: fetchedAddress,
        });
      },
      (error) => {
        setIsGettingLocation(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError('Please allow location access to continue');
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError('Location information is unavailable');
            break;
          case error.TIMEOUT:
            setLocationError('Location request timed out');
            break;
          default:
            setLocationError('An unknown error occurred');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const clearLocation = () => {
    setLatitude(null);
    setLongitude(null);
    setAddress(null);
  };

  const hasLocation = latitude !== null && longitude !== null;

  return (
    <div className={`space-y-2 ${className}`}>
      {showCapturedState && hasLocation ? (
        <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg">
          <MapPin className="h-5 w-5 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-primary">Location captured</p>
            <p className="text-xs text-muted-foreground truncate">
              {address || `${latitude?.toFixed(6)}, ${longitude?.toFixed(6)}`}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={getLocation}
          >
            Update
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          onClick={getLocation}
          disabled={isGettingLocation}
          className="w-full"
        >
          {isGettingLocation ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              {buttonLoadingLabel}
            </>
          ) : (
            <>
              <Navigation className="h-4 w-4 mr-2" />
              {buttonLabel}
            </>
          )}
        </Button>
      )}
      {locationError && (
        <p className="text-sm text-destructive">{locationError}</p>
      )}
    </div>
  );
};

// Export helper hook for components that need more control
export const useLocationCapture = () => {
  const { toast } = useToast();
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const getLocation = (): Promise<LocationData> => {
    return new Promise((resolve, reject) => {
      setIsGettingLocation(true);
      setLocationError(null);

      if (!navigator.geolocation) {
        const error = 'Geolocation is not supported by your browser';
        setLocationError(error);
        setIsGettingLocation(false);
        reject(new Error(error));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setLatitude(lat);
          setLongitude(lng);

          // Try to get address from coordinates
          let fetchedAddress: string | null = null;
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
            );
            const data = await response.json();
            if (data.display_name) {
              fetchedAddress = data.display_name;
              setAddress(fetchedAddress);
            }
          } catch (error) {
            console.log('Could not fetch address:', error);
          }

          setIsGettingLocation(false);
          toast({
            title: 'Location captured',
            description: 'Your current location has been recorded.',
          });

          resolve({
            latitude: lat,
            longitude: lng,
            address: fetchedAddress,
          });
        },
        (error) => {
          setIsGettingLocation(false);
          let errorMessage = 'An unknown error occurred';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Please allow location access to continue';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information is unavailable';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out';
              break;
          }
          setLocationError(errorMessage);
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  };

  const clearLocation = () => {
    setLatitude(null);
    setLongitude(null);
    setAddress(null);
    setLocationError(null);
  };

  return {
    latitude,
    longitude,
    address,
    isGettingLocation,
    locationError,
    getLocation,
    clearLocation,
    hasLocation: latitude !== null && longitude !== null,
  };
};
