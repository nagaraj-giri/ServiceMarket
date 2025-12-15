
import { Coordinates } from "./types";

export const API_DELAY = 1000;

// Updated to match the design screenshot provided by the user
export const DEFAULT_SERVICE_TYPES = [
  { name: 'Visa Services', description: 'Assistance with tourist, family, employment, and visa renewal processes.', isActive: true },
  { name: 'Tours & Travels', description: 'Travel planning, tour packages, bookings, and local experiences.', isActive: true },
  { name: 'Car Lift', description: 'Daily or monthly car lift services for office and personal commuting.', isActive: true },
  { name: 'Rent a Car', description: 'Short-term and long-term car rental options for personal and business use.', isActive: true },
  { name: 'Insurance Services', description: 'Health, vehicle, travel, and life insurance solutions tailored to your needs.', isActive: true },
  { name: 'Packers & Movers', description: 'Safe and reliable packing, moving, and relocation services within and outside the city.', isActive: true },
];

// Staged Real Google Maps Data for Instant Performance
export const REAL_DUBAI_LOCATIONS = [
  { name: "Downtown Dubai", lat: 25.1972, lng: 55.2744 },
  { name: "Business Bay", lat: 25.1837, lng: 55.2666 },
  { name: "Dubai Marina", lat: 25.0805, lng: 55.1403 },
  { name: "Jumeirah Lake Towers (JLT)", lat: 25.0765, lng: 55.1483 },
  { name: "Palm Jumeirah", lat: 25.1124, lng: 55.1390 },
  { name: "Deira", lat: 25.2667, lng: 55.3167 },
  { name: "Bur Dubai", lat: 25.2532, lng: 55.3030 },
  { name: "Al Barsha 1", lat: 25.1166, lng: 55.1963 },
  { name: "Dubai Silicon Oasis", lat: 25.1264, lng: 55.3789 },
  { name: "Jumeirah Village Circle (JVC)", lat: 25.0577, lng: 55.2038 },
  { name: "Mirdif", lat: 25.2230, lng: 55.4184 },
  { name: "International City", lat: 25.1637, lng: 55.4087 },
  { name: "Dubai Hills Estate", lat: 25.1105, lng: 55.2425 },
  { name: "Arabian Ranches", lat: 25.0535, lng: 55.2535 },
  { name: "Motor City", lat: 25.0456, lng: 55.2361 },
  { name: "Dubai Sports City", lat: 25.0424, lng: 55.2185 },
  { name: "Discovery Gardens", lat: 25.0420, lng: 55.1370 },
  { name: "Jumeirah Beach Residence (JBR)", lat: 25.0789, lng: 55.1350 },
  { name: "Sheikh Zayed Road", lat: 25.2152, lng: 55.2758 },
  { name: "Al Quoz Industrial Area", lat: 25.1372, lng: 55.2497 },
  { name: "Al Nahda 1", lat: 25.2933, lng: 55.3670 },
  { name: "Al Qusais", lat: 25.2760, lng: 55.3770 },
  { name: "Garhoud", lat: 25.2443, lng: 55.3423 },
  { name: "Dubai Festival City", lat: 25.2212, lng: 55.3522 },
  { name: "Jumeirah 1", lat: 25.2272, lng: 55.2635 },
  { name: "Umm Suqeim 3", lat: 25.1394, lng: 55.1970 },
  { name: "Al Satwa", lat: 25.2222, lng: 55.2727 },
  { name: "Al Karama", lat: 25.2487, lng: 55.3000 },
  { name: "DIFC", lat: 25.2115, lng: 55.2835 },
  { name: "City Walk", lat: 25.2075, lng: 55.2625 },
  { name: "Bluewaters Island", lat: 25.0783, lng: 55.1233 },
  { name: "Dubai Creek Harbour", lat: 25.1969, lng: 55.3512 },
  { name: "Meydan City", lat: 25.1528, lng: 55.3050 },
  { name: "Al Furjan", lat: 25.0390, lng: 55.1460 },
  { name: "Remraam", lat: 25.0119, lng: 55.2458 },
  { name: "Damac Hills", lat: 25.0298, lng: 55.2323 },
  { name: "Town Square", lat: 25.0094, lng: 55.2900 },
  { name: "The Springs", lat: 25.0657, lng: 55.1783 },
  { name: "Emirates Hills", lat: 25.0694, lng: 55.1619 },
  { name: "Dubai Production City", lat: 25.0360, lng: 55.1830 },
  { name: "Dubai Studio City", lat: 25.0405, lng: 55.2447 },
  { name: "Knowledge Park", lat: 25.1017, lng: 55.1648 },
  { name: "Dubai Internet City", lat: 25.0936, lng: 55.1553 },
  { name: "Dubai Media City", lat: 25.0935, lng: 55.1522 }
];
