import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { 
  MapPin, Clock, Calendar, Search, Loader2, Navigation, 
  ExternalLink, Users, Filter, X 
} from 'lucide-react';

interface Meeting {
  name: string;
  slug: string;
  day?: number;
  time?: string;
  end_time?: string;
  location?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  types?: string[];
  notes?: string;
  url?: string;
  conference_url?: string;
  conference_phone?: string;
  latitude?: number;
  longitude?: number;
  distance?: number;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const MEETING_TYPES: Record<string, string> = {
  'O': 'Open',
  'C': 'Closed',
  'M': 'Men',
  'W': 'Women',
  'LGBTQ': 'LGBTQ+',
  'X': 'Wheelchair Access',
  'ONL': 'Online',
  'TC': 'Telephone',
  'BE': 'Beginner',
  'S': 'Speaker',
  'D': 'Discussion',
  'ST': 'Step Study',
  'BB': 'Big Book',
  'Y': 'Young People',
  'H': 'Hybrid',
};

const PROGRAM_FEEDS: Record<string, string> = {
  'AA Online Meetings': 'https://sheets.code4recovery.org/storage/12Ga8uwMG4WJ8pZ_SEU7vNETp_aQZ-2yNVsYDFqIwHyE.json',
  'NA Online Meetings': 'https://sheets.code4recovery.org/storage/1kOvlREHpvhYwWmKHbx8T7RVByRlPYaJ0X0loafxX4Ko.json',
};

export const MeetingFinder = () => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [filteredMeetings, setFilteredMeetings] = useState<Meeting[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDay, setSelectedDay] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedProgram, setSelectedProgram] = useState<string>('AA Online Meetings');
  const [showFilters, setShowFilters] = useState(false);

  // Load meetings when program changes
  useEffect(() => {
    if (selectedProgram) {
      fetchMeetings();
    }
  }, [selectedProgram]);

  // Apply filters when any filter or meetings change
  useEffect(() => {
    applyFilters();
  }, [meetings, searchQuery, selectedDay, selectedType, userLocation]);

  const fetchMeetings = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const feedUrl = PROGRAM_FEEDS[selectedProgram];
      if (!feedUrl) {
        setMeetings([]);
        return;
      }

      const { data, error: fnError } = await supabase.functions.invoke('fetch-meetings', {
        body: { feedUrl },
      });

      if (fnError) throw fnError;

      const meetingsData = data?.meetings || [];
      setMeetings(meetingsData);
    } catch (err) {
      console.error('Error fetching meetings:', err);
      setError('Failed to load meetings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getUserLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setIsLocating(false);
      },
      (err) => {
        console.error('Geolocation error:', err);
        setError('Unable to get your location. Please enable location services.');
        setIsLocating(false);
      }
    );
  };

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const applyFilters = () => {
    let result = [...meetings];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (m) =>
          m.name?.toLowerCase().includes(query) ||
          m.location?.toLowerCase().includes(query) ||
          m.city?.toLowerCase().includes(query) ||
          m.address?.toLowerCase().includes(query)
      );
    }

    // Day filter
    if (selectedDay) {
      const dayIndex = DAYS.indexOf(selectedDay);
      result = result.filter((m) => m.day === dayIndex);
    }

    // Type filter
    if (selectedType) {
      result = result.filter((m) => m.types?.includes(selectedType));
    }

    // Calculate distance and sort if user location is available
    if (userLocation) {
      result = result
        .filter((m) => m.latitude && m.longitude)
        .map((m) => ({
          ...m,
          distance: calculateDistance(
            userLocation.lat,
            userLocation.lng,
            m.latitude!,
            m.longitude!
          ),
        }))
        .sort((a, b) => (a.distance || 0) - (b.distance || 0));
    }

    setFilteredMeetings(result.slice(0, 50)); // Limit to 50 results
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedDay('');
    setSelectedType('');
    setUserLocation(null);
  };

  const formatTime = (time: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const getMeetingTypeLabels = (types: string[]) => {
    return types
      .map((t) => MEETING_TYPES[t] || t)
      .filter(Boolean)
      .slice(0, 4);
  };

  const hasActiveFilters = searchQuery || selectedDay || selectedType || userLocation;

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-display flex items-center gap-2">
            <MapPin className="h-6 w-6 text-primary" />
            Find a Meeting
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-1" />
            Filters
            {hasActiveFilters && (
              <Badge variant="default" className="ml-2 h-5 w-5 p-0 flex items-center justify-center">
                !
              </Badge>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search and Location */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, city, or address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            onClick={getUserLocation}
            disabled={isLocating}
          >
            {isLocating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Navigation className="h-4 w-4 mr-1" />
                Near Me
              </>
            )}
          </Button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-4 bg-secondary/30 rounded-lg">
            <Select value={selectedProgram} onValueChange={setSelectedProgram}>
              <SelectTrigger>
                <SelectValue placeholder="Select program" />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(PROGRAM_FEEDS).map((program) => (
                  <SelectItem key={program} value={program}>
                    {program}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedDay || "all"} onValueChange={(val) => setSelectedDay(val === "all" ? "" : val)}>
              <SelectTrigger>
                <SelectValue placeholder="Any day" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any day</SelectItem>
                {DAYS.map((day) => (
                  <SelectItem key={day} value={day}>
                    {day}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedType || "all"} onValueChange={(val) => setSelectedType(val === "all" ? "" : val)}>
              <SelectTrigger>
                <SelectValue placeholder="Any type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any type</SelectItem>
                {Object.entries(MEETING_TYPES).map(([code, label]) => (
                  <SelectItem key={code} value={code}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="col-span-full">
                <X className="h-4 w-4 mr-1" />
                Clear all filters
              </Button>
            )}
          </div>
        )}

        {/* Location indicator */}
        {userLocation && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Navigation className="h-4 w-4 text-primary" />
            <span>Showing meetings sorted by distance from your location</span>
            <Button variant="ghost" size="sm" onClick={() => setUserLocation(null)}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="text-destructive text-sm p-3 bg-destructive/10 rounded-lg">
            {error}
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Results */}
        {!isLoading && (
          <>
            <div className="text-sm text-muted-foreground">
              {filteredMeetings.length > 0 
                ? `Showing ${filteredMeetings.length} meeting${filteredMeetings.length !== 1 ? 's' : ''}`
                : meetings.length > 0 
                  ? 'No meetings match your filters'
                  : 'Select a program to find meetings'}
            </div>

            <ScrollArea className="h-[400px]">
              <div className="space-y-3 pr-4">
                {filteredMeetings.map((meeting, index) => (
                  <div
                    key={meeting.slug || index}
                    className="p-4 border border-border rounded-lg hover:bg-secondary/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-foreground truncate">
                          {meeting.name}
                        </h4>
                        
                        <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                          {meeting.day !== undefined && meeting.time && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              {DAYS[meeting.day]} {formatTime(meeting.time)}
                              {meeting.end_time && ` - ${formatTime(meeting.end_time)}`}
                            </span>
                          )}
                          
                          {meeting.distance !== undefined && (
                            <span className="flex items-center gap-1 text-primary">
                              <Navigation className="h-3.5 w-3.5" />
                              {meeting.distance.toFixed(1)} mi
                            </span>
                          )}
                        </div>

                        {(meeting.address || meeting.city) && (
                          <div className="flex items-start gap-1 mt-1 text-sm text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                            <span>
                              {[meeting.address, meeting.city, meeting.state]
                                .filter(Boolean)
                                .join(', ')}
                            </span>
                          </div>
                        )}

                        {meeting.location && (
                          <div className="text-sm text-muted-foreground mt-1">
                            <Users className="h-3.5 w-3.5 inline mr-1" />
                            {meeting.location}
                          </div>
                        )}

                        {meeting.types && meeting.types.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {getMeetingTypeLabels(meeting.types).map((type) => (
                              <Badge key={type} variant="secondary" className="text-xs">
                                {type}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-1">
                        {meeting.conference_url && (
                          <Button
                            size="sm"
                            variant="outline"
                            asChild
                          >
                            <a href={meeting.conference_url} target="_blank" rel="noopener noreferrer">
                              Join Online
                              <ExternalLink className="h-3 w-3 ml-1" />
                            </a>
                          </Button>
                        )}
                        {meeting.url && (
                          <Button
                            size="sm"
                            variant="ghost"
                            asChild
                          >
                            <a href={meeting.url} target="_blank" rel="noopener noreferrer">
                              Details
                              <ExternalLink className="h-3 w-3 ml-1" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </>
        )}

        {/* Attribution */}
        <p className="text-xs text-muted-foreground text-center pt-2">
          Meeting data provided by{' '}
          <a 
            href="https://code4recovery.org" 
            target="_blank" 
            rel="noopener noreferrer"
            className="underline hover:text-primary"
          >
            Code for Recovery
          </a>
        </p>
      </CardContent>
    </Card>
  );
};

export default MeetingFinder;
