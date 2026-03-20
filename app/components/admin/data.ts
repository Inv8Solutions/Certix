import type { AdminEvent, StatItem, StepItem } from "./types";

export const stats: StatItem[] = [
  { label: "Total Events", value: "14", trend: "+2 this month" },
  { label: "Certificates Issued", value: "1,847", trend: "+25 this week" },
  { label: "QR Code Scans", value: "2,401", trend: "+32 this week" },
  { label: "Survey Response Rate", value: "91%", trend: "+3% vs last month" },
];

export const allEvents: AdminEvent[] = [
  { id: 1, name: "Technopreneurship Demo Day 7", dateAndVenue: "April 7, 2026 - UC Theater", scans: 103, certs: 87, survey: "85%" },
  { id: 2, name: "Technopreneurship Demo Day 7", dateAndVenue: "April 7, 2026 - UC Theater", scans: 103, certs: 87, survey: "85%" },
  { id: 3, name: "Technopreneurship Demo Day 7", dateAndVenue: "April 7, 2026 - UC Theater", scans: 103, certs: 87, survey: "85%" },
  { id: 4, name: "Technopreneurship Demo Day 7", dateAndVenue: "April 7, 2026 - UC Theater", scans: 103, certs: 87, survey: "85%" },
];

export const builderSteps: StepItem[] = [
  { step: "STEP 1", title: "Event Details" },
  { step: "STEP 2", title: "Certificate Template" },
  { step: "STEP 3", title: "Field Mapping" },
  { step: "STEP 4", title: "Survey Builder" },
];
