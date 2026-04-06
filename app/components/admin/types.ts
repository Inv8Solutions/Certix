export type EventForm = {
  name: string;
  date: string;
  description: string;
};

export type AdminView = "dashboard" | "events" | "builder" | "settings";

export type StatItem = {
  label: string;
  value: string;
  trend: string;
};

export type AdminEvent = {
  id: number;
  name: string;
  dateAndVenue: string;
  scans: number;
  certs: number;
  survey: string;
};

export type StepItem = {
  step: string;
  title: string;
};
