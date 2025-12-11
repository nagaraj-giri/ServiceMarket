
import { Coordinates } from "./types";

// Placeholders used in initial state, can be expanded for more mock data
export const API_DELAY = 1000;

export const DUBAI_LOCALITIES = [
  "Downtown Dubai", "Business Bay", "Dubai Marina", "Jumeirah Lake Towers (JLT)",
  "Palm Jumeirah", "Deira", "Bur Dubai", "Al Barsha", "Dubai Silicon Oasis",
  "Jumeirah Village Circle (JVC)", "Mirdif", "International City", "Dubai Hills Estate",
  "Arabian Ranches", "Motor City", "Dubai Sports City", "Discovery Gardens",
  "Jumeirah Beach Residence (JBR)", "Sheikh Zayed Road", "Al Quoz", "Al Nahda",
  "Al Qusais", "Garhoud", "Dubai Festival City", "Jumeirah 1", "Jumeirah 2", "Jumeirah 3",
  "Umm Suqeim", "Al Satwa", "Al Karama", "DIFC (Dubai International Financial Centre)", 
  "City Walk", "Bluewaters Island", "Dubai Creek Harbour", "Meydan City", 
  "Al Furjan", "Remraam", "Damac Hills", "Town Square", "The Springs",
  "The Meadows", "Emirates Hills", "Jumeirah Islands", "Dubai Production City (IMPZ)",
  "Dubai Studio City", "Knowledge Park", "Dubai Internet City", "Dubai Media City"
];

// Mock Geocoding Database for Dubai
export const LOCALITY_COORDINATES: Record<string, Coordinates> = {
  "Downtown Dubai": { lat: 25.1972, lng: 55.2744 },
  "Business Bay": { lat: 25.1837, lng: 55.2666 }, // Reference Point
  "DIFC (Dubai International Financial Centre)": { lat: 25.2115, lng: 55.2819 }, // ~3.5km from Business Bay
  "Al Satwa": { lat: 25.2234, lng: 55.2750 }, // ~4.5km from Business Bay
  
  "Dubai Marina": { lat: 25.0805, lng: 55.1403 }, // ~18km from Business Bay
  "Jumeirah Lake Towers (JLT)": { lat: 25.0777, lng: 55.1512 },
  "Palm Jumeirah": { lat: 25.1124, lng: 55.1390 },
  
  "Deira": { lat: 25.2630, lng: 55.3093 }, // ~10km from Business Bay
  "Bur Dubai": { lat: 25.2532, lng: 55.3003 },
  "Al Karama": { lat: 25.2476, lng: 55.3046 },
  
  "Al Barsha": { lat: 25.1084, lng: 55.1923 }, // ~10km from Business Bay
  "Dubai Hills Estate": { lat: 25.1169, lng: 55.2538 }, // ~7.5km from Business Bay
  "Al Quoz": { lat: 25.1466, lng: 55.2435 }, // ~5km from Business Bay
  
  "Mirdif": { lat: 25.2222, lng: 55.4194 }, // ~18km
  "International City": { lat: 25.1664, lng: 55.4127 }
};

export const getCoordinates = (locality: string): Coordinates | undefined => {
  // Simple exact match or partial match lookup
  const key = Object.keys(LOCALITY_COORDINATES).find(k => 
    k.toLowerCase() === locality.toLowerCase() || 
    locality.toLowerCase().includes(k.toLowerCase()) ||
    k.toLowerCase().includes(locality.toLowerCase())
  );
  return key ? LOCALITY_COORDINATES[key] : undefined;
};
