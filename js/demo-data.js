/**
 * Shared frontend demo property data for Bharat Bhumi.
 *
 * Single source of truth used by both the Dashboard (SAMPLE_PROPERTIES)
 * and My Properties (fallback when the parcels API is unavailable/empty),
 * so both pages always show the SAME 3 demo properties.
 *
 * Display strings (ulpin/type/location/area/status) match the Dashboard
 * exactly. Extra fields (ownerName/lastUpdated) are used by My Properties.
 */
export const DEMO_PROPERTIES = [
  {
    ulpin: "ULP-892-441-A",
    type: "Agricultural",
    location: "Plot 42, North Sector, District A",
    area: "2.4 Hectares",
    status: "Verified",
    lastUpdated: "Oct 12, 2024",
    ownerName: "Rajesh Kumar"
  },
  {
    ulpin: "ULP-110-398-B",
    type: "Residential",
    location: "Block C, Metro Layout, District B",
    area: "1200 Sq. Ft.",
    status: "Verified",
    lastUpdated: "Sep 28, 2024",
    ownerName: "Priya Sharma"
  },
  {
    ulpin: "Pending ID...",
    type: "Commercial",
    location: "Plot 5, Market Road, District A",
    area: "0.5 Hectares",
    status: "Under Review",
    lastUpdated: "Oct 15, 2024",
    ownerName: "Amit Patel"
  }
];
