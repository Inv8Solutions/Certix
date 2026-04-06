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
  id: string;
  slug: string;
  name: string;
  dateAndVenue: string;
  scans: number;
  certs: number;
  survey: string;
};

export type AdminSettings = {
  organizationName: string;
  contactEmail: string;
  defaultTemplate: string;
  outputFormat: string;
  autoEmailOnGeneration: boolean;
  requireSurveyByDefault: boolean;
};

export type StepItem = {
  step: string;
  title: string;
};

export type SurveyQuestionType = "rating" | "text" | "multiple_choice";

export type SurveyQuestion = {
  id: string;
  type: SurveyQuestionType;
  prompt: string;
  required: boolean;
  scaleMax?: number;
  options?: string[];
};

export type CertificateNameField = {
  x: number;
  y: number;
  fontSize: number;
};
