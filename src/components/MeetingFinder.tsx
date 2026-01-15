import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { 
  MapPin, Clock, Calendar, Search, Loader2, Navigation, 
  ExternalLink, Users, Filter, X, Globe 
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
  'MED': 'Meditation',
  'DR': 'Daily Reflections',
  'B': 'Book Study',
  'TR': 'Tradition Study',
  'LS': 'Living Sober',
  'AS': 'American Sign Language',
};

// Region/Feed configuration
type Fellowship = 'AA' | 'Al-Anon' | 'ACA' | 'NA' | 'CoDA' | 'Refuge Recovery' | 'Families Anonymous' | 'EDA' | 'All';

interface RegionFeed {
  name: string;
  feedUrl: string;
  type: 'sheets' | 'central-query' | 'tsml';
  description?: string;
}

interface RegionGroup {
  label: string;
  regions: RegionFeed[];
  fellowship: Fellowship;
}

const FELLOWSHIPS: { value: Fellowship; label: string }[] = [
  { value: 'All', label: 'All Fellowships' },
  { value: 'AA', label: 'Alcoholics Anonymous (AA)' },
  { value: 'Al-Anon', label: 'Al-Anon / Alateen' },
  { value: 'NA', label: 'Narcotics Anonymous (NA)' },
  { value: 'ACA', label: 'Adult Children of Alcoholics (ACA)' },
  { value: 'CoDA', label: 'Co-Dependents Anonymous (CoDA)' },
  { value: 'Refuge Recovery', label: 'Refuge Recovery' },
  { value: 'Families Anonymous', label: 'Families Anonymous' },
  { value: 'EDA', label: 'Eating Disorders Anonymous (EDA)' },
];

const REGION_GROUPS: RegionGroup[] = [
  {
    label: 'AA Online Meetings (Worldwide)',
    fellowship: 'AA',
    regions: [
      {
        name: 'OIAA Online Meetings',
        feedUrl: 'https://central-query.apps.code4recovery.org/api/v1/meetings',
        type: 'central-query',
        description: 'Online Intergroup - 2000+ online meetings worldwide',
      },
    ],
  },
  // AA State Groups
  { label: 'Alabama', fellowship: 'AA', regions: [
    { name: 'Birmingham', feedUrl: 'https://birminghamaa.org/wp-admin/admin-ajax.php?action=meetings', type: 'tsml' },
    { name: 'Mobile', feedUrl: 'https://mobileareaintergroupaa.com/wp-admin/admin-ajax.php?action=meetings', type: 'tsml' },
  ]},
  { label: 'Alaska', fellowship: 'AA', regions: [
    { name: 'Anchorage', feedUrl: 'https://anchorageaa.org/wp-admin/admin-ajax.php?action=meetings', type: 'tsml' },
  ]},
  { label: 'Arizona', fellowship: 'AA', regions: [
    { name: 'Phoenix', feedUrl: 'https://www.aaphoenix.org/wp-admin/admin-ajax.php?action=meetings', type: 'tsml' },
    { name: 'Tucson', feedUrl: 'https://www.aatucson.org/wp-admin/admin-ajax.php?action=meetings', type: 'tsml' },
    { name: 'Scottsdale', feedUrl: 'https://eastvalleyaa.org/wp-admin/admin-ajax.php?action=meetings', type: 'tsml' },
  ]},
  { label: 'Arkansas', fellowship: 'AA', regions: [
    { name: 'Little Rock', feedUrl: 'https://arkansascentraloffice.org/wp-admin/admin-ajax.php?action=meetings', type: 'tsml' },
  ]},
  { label: 'California', fellowship: 'AA', regions: [
    { name: 'Los Angeles (Central Office)', feedUrl: 'https://aala.org/wp-admin/admin-ajax.php?action=meetings', type: 'tsml' },
    { name: 'San Francisco & Marin', feedUrl: 'https://aasfmarin.org/wp-admin/admin-ajax.php?action=meetings', type: 'tsml' },
    { name: 'San Diego', feedUrl: 'https://aasandiego.org/wp-admin/admin-ajax.php?action=meetings', type: 'tsml' },
    { name: 'San Jose / Santa Clara County', feedUrl: 'https://sheets.code4recovery.org/storage/12Ga8uwMG4WJ8pZ_SEU7vNETp_aQZ-2yNVsYDFqIwHyE.json', type: 'sheets' },
    { name: 'Central Coast (SLO)', feedUrl: 'https://www.sloaa.org/wp-admin/admin-ajax.php?action=meetings', type: 'tsml' },
    { name: 'Orange County', feedUrl: 'https://oc-aa.org/wp-admin/admin-ajax.php?action=meetings', type: 'tsml' },
    { name: 'Sacramento', feedUrl: 'https://www.aasacramento.org/wp-admin/admin-ajax.php?action=meetings', type: 'tsml' },
    { name: 'Inland Empire', feedUrl: 'https://riversidecentraloffice.org/wp-admin/admin-ajax.php?action=meetings', type: 'tsml' },
    { name: 'Santa Barbara', feedUrl: 'https://www.santabarbaraaa.com/wp-admin/admin-ajax.php?action=meetings', type: 'tsml' },
    { name: 'Fresno', feedUrl: 'https://www.fresnoaa.org/wp-admin/admin-ajax.php?action=meetings', type: 'tsml' },
    { name: 'East Bay', feedUrl: 'https://eastbayaa.org/wp-admin/admin-ajax.php?action=meetings', type: 'tsml' },
    { name: 'South Bay', feedUrl: 'https://www.southbayaa.org/wp-admin/admin-ajax.php?action=meetings', type: 'tsml' },
    { name: 'Monterey Bay', feedUrl: 'https://montereyaa.org/wp-admin/admin-ajax.php?action=meetings', type: 'tsml' },
  ]},
  { label: 'Colorado', fellowship: 'AA', regions: [
    { name: 'Denver', feedUrl: 'https://daccaa.org/wp-admin/admin-ajax.php?action=meetings', type: 'tsml' },
    { name: 'Colorado Springs', feedUrl: 'https://coloradospringsaa.org/wp-admin/admin-ajax.php?action=meetings', type: 'tsml' },
    { name: 'Boulder', feedUrl: 'https://www.bouldercountyaa.org/wp-admin/admin-ajax.php?action=meetings', type: 'tsml' },
  ]},
  { label: 'Connecticut', fellowship: 'AA', regions: [
    { name: 'Connecticut', feedUrl: 'https://www.ct-aa.org/wp-admin/admin-ajax.php?action=meetings', type: 'tsml' },
  ]},
  { label: 'Delaware', fellowship: 'AA', regions: [
    { name: 'Delaware', feedUrl: 'https://delawareaa.org/wp-admin/admin-ajax.php?action=meetings', type: 'tsml' },
  ]},
  { label: 'Florida', fellowship: 'AA', regions: [
    { name: 'Central Florida (Orlando)', feedUrl: 'https://cflintergroup.org/wp-admin/admin-ajax.php?action=meetings', type: 'tsml' },
    { name: 'Tallahassee', feedUrl: 'https://intergroup5.org/wp-admin/admin-ajax.php?action=meetings', type: 'tsml' },
    { name: 'Miami', feedUrl: 'https://aamiamidade.org/wp-admin/admin-ajax.php?action=meetings', type: 'tsml' },
    { name: 'Tampa Bay', feedUrl: 'https://aatampabay.org/wp-admin/admin-ajax.php?action=meetings', type: 'tsml' },
    { name: 'Jacksonville', feedUrl: 'https://neflaa.org/wp-admin/admin-ajax.php?action=meetings', type: 'tsml' },
    { name: 'Fort Lauderdale / Broward', feedUrl: 'https://aabroward.org/wp-admin/admin-ajax.php?action=meetings', type: 'tsml' },
    { name: 'Palm Beach', feedUrl: 'https://aapalmbeach.org/wp-admin/admin-ajax.php?action=meetings', type: 'tsml' },
    { name: 'St. Lucie', feedUrl: 'https://aastlucieintergroup.com/wp-admin/admin-ajax.php?action=meetings', type: 'tsml' },
    { name: 'Sarasota', feedUrl: 'https://aasrq.org/wp-admin/admin-ajax.php?action=meetings', type: 'tsml' },
  ]},
  { label: 'Georgia', fellowship: 'AA', regions: [
    { name: 'Atlanta', feedUrl: 'https://atlantaaa.org/wp-admin/admin-ajax.php?action=meetings', type: 'tsml' },
    { name: 'Savannah', feedUrl: 'https://www.savannahaa.com/wp-admin/admin-ajax.php?action=meetings', type: 'tsml' },
  ]},
  { label: 'Hawaii', fellowship: 'AA', regions: [
    { name: 'Hawaii (Oahu)', feedUrl: 'https://oahucentraloffice.com/wp-admin/admin-ajax.php?action=meetings', type: 'tsml' },
    { name: 'Maui', feedUrl: 'https://www.aamaui.org/wp-admin/admin-ajax.php?action=meetings', type: 'tsml' },
  ]},
  { label: 'Idaho', fellowship: 'AA', regions: [
    { name: 'Boise', feedUrl: 'https://boiseaa.org/wp-admin/admin-ajax.php?action=meetings', type: 'tsml' },
  ]},
  { label: 'Illinois', fellowship: 'AA', regions: [
    { name: 'Chicago', feedUrl: 'https://chicagoaa.org/wp-admin/admin-ajax.php?action=meetings', type: 'tsml' },
    { name: 'Springfield', feedUrl: 'https://aa-springfield-il.org/wp-admin/admin-ajax.php?action=meetings', type: 'tsml' },
  ]},
  { label: 'Indiana', fellowship: 'AA', regions: [
    { name: 'Indianapolis', feedUrl: 'https://indyaa.org/wp-admin/admin-ajax.php?action=meetings', type: 'tsml' },
  ]},
  { label: 'Iowa', fellowship: 'AA', regions: [
    { name: 'Des Moines', feedUrl: 'https://www.iowacityaa.org/wp-admin/admin-ajax.php?action=meetings', type: 'tsml' },
  ]},
  { label: 'Kansas', fellowship: 'AA', regions: [
    { name: 'Kansas City', feedUrl: 'https://www.kc-aa.org/wp-admin/admin-ajax.php?action=meetings', type: 'tsml' },
    { name: 'Wichita', feedUrl: 'https://www.aawichita.org/wp-admin/admin-ajax.php?action=meetings', type: 'tsml' },
  ]},
  { label: 'Kentucky', fellowship: 'AA', regions: [
    { name: 'Louisville', feedUrl: 'https://louisvilleaa.org/wp-admin/admin-ajax.php?action=meetings', type: 'tsml' },
    { name: 'Lexington', feedUrl: 'https://www.lexingtonaa.org/wp-admin/admin-ajax.php?action=meetings', type: 'tsml' },
  ]},
  { label: 'Louisiana', fellowship: 'AA', regions: [
    { name: 'New Orleans', feedUrl: 'https://neworleansaa.org/wp-admin/admin-ajax.php?action=meetings', type: 'tsml' },
    { name: 'Baton Rouge', feedUrl: 'https://www.brintergroup.org/wp-admin/admin-ajax.php?action=meetings', type: 'tsml' },
  ]},
  { label: 'Maine', fellowship: 'AA', regions: [
    { name: 'Maine', feedUrl: 'https://csoaamaine.org/wp-admin/admin-ajax.php?action=meetings', type: 'tsml' },
  ]},
  { label: 'Maryland', fellowship: 'AA', regions: [
    { name: 'Baltimore', feedUrl: 'https://baltimoreaa.org/wp-admin/admin-ajax.php?action=meetings', type: 'tsml' },
  ]},
  { label: 'Massachusetts', fellowship: 'AA', regions: [
    { name: 'Boston', feedUrl: 'https://aaboston.org/wp-admin/admin-ajax.php?action=meetings', type: 'tsml' },
    { name: 'Western MA', feedUrl: 'https://westernmassaa.org/wp-admin/admin-ajax.php?action=meetings', type: 'tsml' },
    { name: 'Cape Cod', feedUrl: 'https://capecodaa.net/wp-admin/admin-ajax.php?action=meetings', type: 'tsml' },
  ]},
  { label: 'Michigan', fellowship: 'AA', regions: [
    { name: 'Detroit', feedUrl: 'https://detroitaa.org/wp-admin/admin-ajax.php?action=meetings', type: 'tsml' },
    { name: 'Grand Rapids', feedUrl: 'https://www.grandrapidsaa.org/wp-admin/admin-ajax.php?action=meetings', type: 'tsml' },
    { name: 'Ann Arbor', feedUrl: 'https://www.annarboraa.org/wp-admin/admin-ajax.php?action=meetings', type: 'tsml' },
  ]},
  { label: 'Minnesota', fellowship: 'AA', regions: [
    { name: 'Minneapolis / St. Paul', feedUrl: 'https://aaminneapolis.org/wp-admin/admin-ajax.php?action=meetings', type: 'tsml' },
  ]},
  { label: 'Mississippi', fellowship: 'AA', regions: [
    { name: 'Mississippi', feedUrl: 'https://msareaaa.org/wp-admin/admin-ajax.php?action=meetings', type: 'tsml' },
  ]},
  { label: 'Missouri', fellowship: 'AA', regions: [
    { name: 'St. Louis', feedUrl: 'https://aastl.org/wp-admin/admin-ajax.php?action=meetings', type: 'tsml' },
    { name: 'Kansas City', feedUrl: 'https://www.kc-aa.org/wp-admin/admin-ajax.php?action=meetings', type: 'tsml' },
  ]},
  { label: 'Montana', fellowship: 'AA', regions: [
    { name: 'Montana', feedUrl: 'https://www.aamontana.org/wp-admin/admin-ajax.php?action=meetings', type: 'tsml' },
  ]},
  { label: 'Nebraska', fellowship: 'AA', regions: [
    { name: 'Omaha', feedUrl: 'https://omahacentraloffice.org/wp-admin/admin-ajax.php?action=meetings', type: 'tsml' },
  ]},
  { label: 'Nevada', fellowship: 'AA', regions: [
    { name: 'Las Vegas', feedUrl: 'https://lvcentraloffice.org/wp-admin/admin-ajax.php?action=meetings', type: 'tsml' },
    { name: 'Reno', feedUrl: 'https://www.nnig.org/wp-admin/admin-ajax.php?action=meetings', type: 'tsml' },
  ]},
  { label: 'New Hampshire', fellowship: 'AA', regions: [
    { name: 'New Hampshire', feedUrl: 'https://nhaa.net/wp-admin/admin-ajax.php?action=meetings', type: 'tsml' },
  ]},
  { label: 'New Jersey', fellowship: 'AA', regions: [
    { name: 'New Jersey', feedUrl: 'https://nnjaa.org/wp-admin/admin-ajax.php?action=meetings', type: 'tsml' },
    { name: 'Central Jersey', feedUrl: 'https://www.aacentralnj.org/wp-admin/admin-ajax.php?action=meetings', type: 'tsml' },
  ]},
  { label: 'New Mexico', fellowship: 'AA', regions: [
    { name: 'Albuquerque', feedUrl: 'https://albuquerqueaa.org/wp-admin/admin-ajax.php?action=meetings', type: 'tsml' },
    { name: 'Santa Fe', feedUrl: 'https://santafeaa.org/wp-admin/admin-ajax.php?action=meetings', type: 'tsml' },
  ]},
  { label: 'New York', fellowship: 'AA', regions: [
    { name: 'New York City', feedUrl: 'https://www.nyintergroup.org/wp-admin/admin-ajax.php?action=meetings', type: 'tsml' },
    { name: 'Long Island', feedUrl: 'https://www.nassauaa.org/wp-admin/admin-ajax.php?action=meetings', type: 'tsml' },
    { name: 'Buffalo', feedUrl: 'https://buffaloaany.org/wp-admin/admin-ajax.php?action=meetings', type: 'tsml' },
    { name: 'Rochester', feedUrl: 'https://rochester-ny-aa.org/wp-admin/admin-ajax.php?action=meetings', type: 'tsml' },
    { name: 'Syracuse', feedUrl: 'https://aasyracuse.org/wp-admin/admin-ajax.php?action=meetings', type: 'tsml' },
    { name: 'Westchester', feedUrl: 'https://aawestchester.org/wp-admin/admin-ajax.php?action=meetings', type: 'tsml' },
  ]},
  { label: 'North Carolina', fellowship: 'AA', regions: [
    { name: 'Charlotte', feedUrl: 'https://charlotteaa.org/wp-admin/admin-ajax.php?action=meetings', type: 'tsml' },
    { name: 'Raleigh', feedUrl: 'https://www.raleighaa.com/wp-admin/admin-ajax.php?action=meetings', type: 'tsml' },
    { name: 'Triangle (Durham/Chapel Hill)', feedUrl: 'https://www.triangleaa.org/wp-admin/admin-ajax.php?action=meetings', type: 'tsml' },
  ]},
  { label: 'North Dakota', fellowship: 'AA', regions: [
    { name: 'Fargo', feedUrl: 'https://fmaa.net/wp-admin/admin-ajax.php?action=meetings', type: 'tsml' },
  ]},
  { label: 'Ohio', fellowship: 'AA', regions: [
    { name: 'Cleveland', feedUrl: 'https://www.clevelandaa.org/wp-admin/admin-ajax.php?action=meetings', type: 'tsml' },
    { name: 'Columbus', feedUrl: 'https://aacentralohio.org/wp-admin/admin-ajax.php?action=meetings', type: 'tsml' },
    { name: 'Cincinnati', feedUrl: 'https://aacincinnati.org/wp-admin/admin-ajax.php?action=meetings', type: 'tsml' },
    { name: 'Dayton', feedUrl: 'https://daytonaa.org/wp-admin/admin-ajax.php?action=meetings', type: 'tsml' },
  ]},
  { label: 'Oklahoma', fellowship: 'AA', regions: [
    { name: 'Oklahoma City', feedUrl: 'https://okcaa.org/wp-admin/admin-ajax.php?action=meetings', type: 'tsml' },
    { name: 'Tulsa', feedUrl: 'https://tulsaaa.org/wp-admin/admin-ajax.php?action=meetings', type: 'tsml' },
  ]},
  { label: 'Oregon', fellowship: 'AA', regions: [
    { name: 'Portland', feedUrl: 'https://pdxaa.org/wp-admin/admin-ajax.php?action=meetings', type: 'tsml' },
    { name: 'Central Oregon (Bend)', feedUrl: 'https://www.coigaa.org/wp-admin/admin-ajax.php?action=meetings', type: 'tsml' },
    { name: 'Eugene/Springfield', feedUrl: 'https://www.eug-aa.org/wp-admin/admin-ajax.php?action=meetings', type: 'tsml' },
  ]},
  { label: 'Pennsylvania', fellowship: 'AA', regions: [
    { name: 'Philadelphia', feedUrl: 'https://aasepia.org/wp-admin/admin-ajax.php?action=meetings', type: 'tsml' },
    { name: 'Pittsburgh', feedUrl: 'https://aapittsburgh.org/wp-admin/admin-ajax.php?action=meetings', type: 'tsml' },
    { name: 'Allentown / Lehigh Valley', feedUrl: 'https://www.aalehighvalley.org/wp-admin/admin-ajax.php?action=meetings', type: 'tsml' },
  ]},
  { label: 'Rhode Island', fellowship: 'AA', regions: [
    { name: 'Rhode Island', feedUrl: 'https://aainri.org/wp-admin/admin-ajax.php?action=meetings', type: 'tsml' },
  ]},
  { label: 'South Carolina', fellowship: 'AA', regions: [
    { name: 'Charleston', feedUrl: 'https://www.charlestonaa.org/wp-admin/admin-ajax.php?action=meetings', type: 'tsml' },
    { name: 'Columbia', feedUrl: 'https://midlandsintergroup.org/wp-admin/admin-ajax.php?action=meetings', type: 'tsml' },
  ]},
  { label: 'South Dakota', fellowship: 'AA', regions: [
    { name: 'Sioux Falls', feedUrl: 'https://www.siouxfallsaa.org/wp-admin/admin-ajax.php?action=meetings', type: 'tsml' },
  ]},
  { label: 'Tennessee', fellowship: 'AA', regions: [
    { name: 'Nashville', feedUrl: 'https://www.aanashville.org/wp-admin/admin-ajax.php?action=meetings', type: 'tsml' },
    { name: 'Memphis', feedUrl: 'https://memphisaa.org/wp-admin/admin-ajax.php?action=meetings', type: 'tsml' },
    { name: 'Knoxville', feedUrl: 'https://www.knoxvilleaa.org/wp-admin/admin-ajax.php?action=meetings', type: 'tsml' },
  ]},
  { label: 'Texas', fellowship: 'AA', regions: [
    { name: 'Houston', feedUrl: 'https://aahouston.org/wp-admin/admin-ajax.php?action=meetings', type: 'tsml' },
    { name: 'Dallas', feedUrl: 'https://aadallas.org/wp-admin/admin-ajax.php?action=meetings', type: 'tsml' },
    { name: 'Austin', feedUrl: 'https://austinaa.org/wp-admin/admin-ajax.php?action=meetings', type: 'tsml' },
    { name: 'San Antonio', feedUrl: 'https://aasanantonio.org/wp-admin/admin-ajax.php?action=meetings', type: 'tsml' },
    { name: 'Fort Worth', feedUrl: 'https://aa-tarrant.org/wp-admin/admin-ajax.php?action=meetings', type: 'tsml' },
    { name: 'El Paso', feedUrl: 'https://www.aaelpaso.org/wp-admin/admin-ajax.php?action=meetings', type: 'tsml' },
  ]},
  { label: 'Utah', fellowship: 'AA', regions: [
    { name: 'Salt Lake City', feedUrl: 'https://slcentraloffice.org/wp-admin/admin-ajax.php?action=meetings', type: 'tsml' },
  ]},
  { label: 'Vermont', fellowship: 'AA', regions: [
    { name: 'Vermont', feedUrl: 'https://www.aavt.org/wp-admin/admin-ajax.php?action=meetings', type: 'tsml' },
  ]},
  { label: 'Virginia', fellowship: 'AA', regions: [
    { name: 'Northern Virginia', feedUrl: 'https://nvintergroup.org/wp-admin/admin-ajax.php?action=meetings', type: 'tsml' },
    { name: 'Richmond', feedUrl: 'https://aarichmond.org/wp-admin/admin-ajax.php?action=meetings', type: 'tsml' },
    { name: 'Virginia Beach', feedUrl: 'https://www.tidewaterintergroup.org/wp-admin/admin-ajax.php?action=meetings', type: 'tsml' },
  ]},
  { label: 'Washington', fellowship: 'AA', regions: [
    { name: 'Seattle', feedUrl: 'https://seattleaa.org/wp-admin/admin-ajax.php?action=meetings', type: 'tsml' },
    { name: 'Spokane', feedUrl: 'https://aaspokane.org/wp-admin/admin-ajax.php?action=meetings', type: 'tsml' },
    { name: 'Tacoma', feedUrl: 'https://www.piercecountyaa.org/wp-admin/admin-ajax.php?action=meetings', type: 'tsml' },
  ]},
  { label: 'Washington D.C.', fellowship: 'AA', regions: [
    { name: 'Washington D.C.', feedUrl: 'https://aa-dc.org/wp-admin/admin-ajax.php?action=meetings', type: 'tsml' },
  ]},
  { label: 'West Virginia', fellowship: 'AA', regions: [
    { name: 'Charleston', feedUrl: 'https://aawv.org/wp-admin/admin-ajax.php?action=meetings', type: 'tsml' },
  ]},
  { label: 'Wisconsin', fellowship: 'AA', regions: [
    { name: 'Milwaukee', feedUrl: 'https://aa-wi.org/wp-admin/admin-ajax.php?action=meetings', type: 'tsml' },
    { name: 'Madison', feedUrl: 'https://aamadisonwi.org/wp-admin/admin-ajax.php?action=meetings', type: 'tsml' },
  ]},
  { label: 'Wyoming', fellowship: 'AA', regions: [
    { name: 'Wyoming', feedUrl: 'https://wyomingaa.org/wp-admin/admin-ajax.php?action=meetings', type: 'tsml' },
  ]},
];

// Flatten for easy lookup
const ALL_REGIONS = REGION_GROUPS.flatMap(g => g.regions.map(r => ({ ...r, fellowship: g.fellowship })));

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
  const [selectedFellowship, setSelectedFellowship] = useState<Fellowship>('All');
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  // Filter region groups based on selected fellowship
  const filteredRegionGroups = selectedFellowship === 'All' 
    ? REGION_GROUPS 
    : REGION_GROUPS.filter(g => g.fellowship === selectedFellowship);

  // Clear region when fellowship changes (unless it's AA)
  useEffect(() => {
    if (selectedFellowship !== 'AA' && selectedFellowship !== 'All') {
      setSelectedRegion('');
      setMeetings([]);
      setFilteredMeetings([]);
    }
  }, [selectedFellowship]);

  // Load meetings when region changes - only for AA fellowship
  useEffect(() => {
    if (selectedRegion && (selectedFellowship === 'AA' || selectedFellowship === 'All')) {
      const region = ALL_REGIONS.find(r => r.name === selectedRegion);
      if (region && region.fellowship === 'AA') {
        fetchMeetings();
      }
    }
  }, [selectedRegion, selectedFellowship]);

  // Apply filters when any filter or meetings change
  useEffect(() => {
    applyFilters();
  }, [meetings, searchQuery, selectedDay, selectedType, userLocation]);

  const fetchMeetings = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const region = ALL_REGIONS.find(r => r.name === selectedRegion);
      if (!region) {
        setMeetings([]);
        return;
      }

      const { data, error: fnError } = await supabase.functions.invoke('fetch-meetings', {
        body: { 
          feedUrl: region.feedUrl,
          feedType: region.type,
        },
      });

      if (fnError) throw fnError;

      const meetingsData = data?.meetings || [];
      setMeetings(meetingsData);
    } catch (err) {
      console.error('Error fetching meetings:', err);
      setError('Failed to load meetings. This region may be temporarily unavailable. Please try another region.');
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
          m.state?.toLowerCase().includes(query) ||
          m.postal_code?.toLowerCase().includes(query) ||
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

    setFilteredMeetings(result.slice(0, 100)); // Limit to 100 results
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

  const currentRegion = ALL_REGIONS.find(r => r.name === selectedRegion);
  const isOnlineRegion = currentRegion?.type === 'central-query';

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-lg sm:text-2xl font-display flex items-center gap-2">
            <MapPin className="h-5 w-5 sm:h-6 sm:w-6 text-primary shrink-0" />
            <span className="hidden sm:inline">Find a Meeting</span>
            <span className="sm:hidden">Meetings</span>
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="shrink-0"
          >
            <Filter className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">Filters</span>
            {hasActiveFilters && (
              <Badge variant="default" className="ml-1 sm:ml-2 h-4 w-4 sm:h-5 sm:w-5 p-0 flex items-center justify-center text-[10px] sm:text-xs">
                !
              </Badge>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Fellowship Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
            <Users className="h-4 w-4" />
            Fellowship
          </label>
          <Select value={selectedFellowship} onValueChange={(val) => setSelectedFellowship(val as Fellowship)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select fellowship" />
            </SelectTrigger>
            <SelectContent>
              {FELLOWSHIPS.map((f) => (
                <SelectItem key={f.value} value={f.value}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Region Selector - Only shown for AA fellowship */}
        {selectedFellowship === 'AA' && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <Globe className="h-4 w-4" />
              Select Region
            </label>
            <p className="text-xs text-muted-foreground mb-1">
              {isOnlineRegion 
                ? "Online meetings are worldwide - search by meeting name" 
                : "Search by name, city, state, or zip code"}
            </p>
            <Select value={selectedRegion} onValueChange={setSelectedRegion}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a region" />
              </SelectTrigger>
              <SelectContent>
                {filteredRegionGroups.map((group) => (
                  <SelectGroup key={group.label}>
                    <SelectLabel className="font-semibold text-primary">{group.label}</SelectLabel>
                    {group.regions.map((region) => (
                      <SelectItem key={region.name} value={region.name}>
                        {region.name}
                        {region.description && (
                          <span className="text-xs text-muted-foreground ml-2">
                            ({region.description})
                          </span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Al-Anon External Link */}
        {selectedFellowship === 'Al-Anon' && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="py-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1">
                  <h4 className="font-medium text-foreground text-sm sm:text-base">Al-Anon Meeting Finder</h4>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Al-Anon and Alateen meetings are available through the official Al-Anon Family Groups website.
                  </p>
                </div>
                <Button asChild variant="outline" size="sm" className="w-full sm:w-auto shrink-0">
                  <a
                    href="https://al-anon.org/al-anon-meetings/find-an-al-anon-meeting/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span className="sm:hidden">Find Meetings</span>
                    <span className="hidden sm:inline">Find Al-Anon Meetings</span>
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ACA External Link */}
        {selectedFellowship === 'ACA' && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="py-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1">
                  <h4 className="font-medium text-foreground text-sm sm:text-base">ACA Meeting Finder</h4>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    ACA meetings are available through the official Adult Children of Alcoholics website.
                  </p>
                </div>
                <Button asChild variant="outline" size="sm" className="w-full sm:w-auto shrink-0">
                  <a
                    href="https://adultchildren.org/meeting-search/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Find ACA Meetings
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* NA External Link */}
        {selectedFellowship === 'NA' && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="py-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1">
                  <h4 className="font-medium text-foreground text-sm sm:text-base">NA Meeting Finder</h4>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Narcotics Anonymous meetings are available through the official NA World Services website.
                  </p>
                </div>
                <Button asChild variant="outline" size="sm" className="w-full sm:w-auto shrink-0">
                  <a
                    href="https://na.org/meetingsearch/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Find NA Meetings
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* CoDA External Link */}
        {selectedFellowship === 'CoDA' && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="py-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1">
                  <h4 className="font-medium text-foreground text-sm sm:text-base">CoDA Meeting Finder</h4>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Co-Dependents Anonymous meetings are available through the official CoDA website.
                  </p>
                </div>
                <Button asChild variant="outline" size="sm" className="w-full sm:w-auto shrink-0">
                  <a
                    href="https://coda.org/find-a-meeting/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Find CoDA Meetings
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Refuge Recovery External Link */}
        {selectedFellowship === 'Refuge Recovery' && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="py-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1">
                  <h4 className="font-medium text-foreground text-sm sm:text-base">Refuge Recovery Meeting Finder</h4>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Refuge Recovery offers Buddhist-inspired recovery meetings.
                  </p>
                </div>
                <Button asChild variant="outline" size="sm" className="w-full sm:w-auto shrink-0">
                  <a
                    href="https://refugerecoverymeetings.org/meetings"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Find Meetings
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Families Anonymous External Link */}
        {selectedFellowship === 'Families Anonymous' && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="py-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1">
                  <h4 className="font-medium text-foreground text-sm sm:text-base">Families Anonymous Meeting Finder</h4>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Families Anonymous supports families affected by addiction.
                  </p>
                </div>
                <Button asChild variant="outline" size="sm" className="w-full sm:w-auto shrink-0">
                  <a
                    href="https://familiesanonymous.org/meetings/meeting-directories/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Find FA Meetings
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Eating Disorders Anonymous External Link */}
        {selectedFellowship === 'EDA' && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="py-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1">
                  <h4 className="font-medium text-foreground text-sm sm:text-base">Eating Disorders Anonymous Meeting Finder</h4>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    EDA is a fellowship for recovering from eating disorders.
                  </p>
                </div>
                <Button asChild variant="outline" size="sm" className="w-full sm:w-auto shrink-0">
                  <a
                    href="https://eatingdisordersanonymous.org/meetings/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Find EDA Meetings
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

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
          {!isOnlineRegion && (
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
          )}
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-4 bg-secondary/30 rounded-lg">
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
                ? `Showing ${filteredMeetings.length} meeting${filteredMeetings.length !== 1 ? 's' : ''}${meetings.length > 100 ? ` of ${meetings.length} total` : ''}`
                : meetings.length > 0 
                  ? 'No meetings match your filters'
                  : 'Select a region to find meetings'}
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

                        {meeting.location && !meeting.conference_url && (
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
          {isOnlineRegion && (
            <>
              {' & '}
              <a 
                href="https://aa-intergroup.org" 
                target="_blank" 
                rel="noopener noreferrer"
                className="underline hover:text-primary"
              >
                Online Intergroup of AA
              </a>
            </>
          )}
        </p>
      </CardContent>
    </Card>
  );
};

export default MeetingFinder;
