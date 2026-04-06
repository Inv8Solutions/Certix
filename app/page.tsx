"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { addDoc, collection, getDocs, limit, query, serverTimestamp } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

import AdminHeader from "./components/admin/AdminHeader";
import { builderSteps } from "./components/admin/data";
import DashboardView from "./components/admin/DashboardView";
import type {
  AdminEvent,
  AdminSettings,
  AdminView,
  CertificateNameField,
  EventForm,
  StatItem,
  SurveyQuestion,
  SurveyQuestionType,
} from "./components/admin/types";
import { db, storage } from "../lib/firebase";

const EventsView = dynamic(() => import("./components/admin/EventsView"), {
  loading: () => <section className="mt-14 rounded-3xl bg-[#f2f2f2] p-8 text-[#7b7b7b]">Loading events...</section>,
});

const BuilderView = dynamic(() => import("./components/admin/BuilderView"), {
  loading: () => <section className="rounded-3xl bg-[#f1f1f1] p-8 text-[#7b7b7b]">Loading builder...</section>,
});

const SettingsView = dynamic(() => import("./components/admin/SettingsView"), {
  loading: () => <section className="rounded-3xl bg-[#f1f1f1] p-8 text-[#7b7b7b]">Loading settings...</section>,
});

const ADMIN_ACCESS_KEY = "certix-admin-auth";
const LOCAL_EVENTS_KEY = "certix-local-events";

function createQuestion(type: SurveyQuestionType): SurveyQuestion {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  if (type === "rating") {
    return {
      id,
      type,
      prompt: "How would you rate this event?",
      required: true,
      scaleMax: 5,
    };
  }

  if (type === "multiple_choice") {
    return {
      id,
      type,
      prompt: "Select one option",
      required: true,
      options: ["Option 1", "Option 2", "Option 3"],
    };
  }

  return {
    id,
    type,
    prompt: "Share your feedback",
    required: true,
  };
}

function toNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function toPercent(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number.parseFloat(value.replace("%", ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function buildStats(events: AdminEvent[]): StatItem[] {
  const totalEvents = events.length;
  const totalCerts = events.reduce((sum, event) => sum + event.certs, 0);
  const totalScans = events.reduce((sum, event) => sum + event.scans, 0);
  const avgSurvey =
    totalEvents === 0
      ? 0
      : Math.round(
          events.reduce((sum, event) => sum + toPercent(event.survey), 0) / totalEvents,
        );

  return [
    { label: "Total Events", value: String(totalEvents), trend: `${totalEvents} in Firestore` },
    { label: "Certificates Issued", value: String(totalCerts), trend: `${totalCerts} total issued` },
    { label: "QR Code Scans", value: String(totalScans), trend: `${totalScans} total scans` },
    { label: "Survey Response Rate", value: `${avgSurvey}%`, trend: `${avgSurvey}% average` },
  ];
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(new Error("Failed to read template file."));
    reader.readAsDataURL(file);
  });
}

export default function Home() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [accessCode, setAccessCode] = useState("");
  const [accessError, setAccessError] = useState("");
  const [dataError, setDataError] = useState("");
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [activeView, setActiveView] = useState<AdminView>("dashboard");
  const [currentStep, setCurrentStep] = useState(1);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [stats, setStats] = useState<StatItem[]>(buildStats([]));
  const [allEvents, setAllEvents] = useState<AdminEvent[]>([]);
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [formData, setFormData] = useState<EventForm>({
    name: "",
    date: "",
    description: "",
  });
  const [nameField, setNameField] = useState<CertificateNameField>({ x: 50, y: 48, fontSize: 24 });
  const [selectedTemplateName, setSelectedTemplateName] = useState("");
  const [selectedTemplateFile, setSelectedTemplateFile] = useState<File | null>(null);
  const [selectedTemplatePreviewUrl, setSelectedTemplatePreviewUrl] = useState<string | null>(null);
  const [surveyQuestions, setSurveyQuestions] = useState<SurveyQuestion[]>([]);

  useEffect(() => {
    const storedAccess = window.localStorage.getItem(ADMIN_ACCESS_KEY);
    setIsAuthenticated(storedAccess === "true");
    setIsHydrated(true);
  }, []);

  const loadFirestoreData = async () => {
    setIsLoadingData(true);
    setDataError("");

    try {
      const settingsSnapshot = await getDocs(query(collection(db, "settings"), limit(1)));

      if (!settingsSnapshot.empty) {
        const raw = settingsSnapshot.docs[0].data();
        setSettings({
          organizationName: typeof raw.organizationName === "string" ? raw.organizationName : "",
          contactEmail: typeof raw.contactEmail === "string" ? raw.contactEmail : "",
          defaultTemplate: typeof raw.defaultTemplate === "string" ? raw.defaultTemplate : "",
          outputFormat: typeof raw.outputFormat === "string" ? raw.outputFormat : "",
          autoEmailOnGeneration: Boolean(raw.autoEmailOnGeneration),
          requireSurveyByDefault: Boolean(raw.requireSurveyByDefault),
        });
      } else {
        setSettings(null);
      }

      const eventsSnapshot = await getDocs(collection(db, "events"));
      const firestoreEvents: AdminEvent[] = eventsSnapshot.docs.map((doc) => {
        const raw = doc.data();
        const date = typeof raw.date === "string" ? raw.date : "";
        const venue = typeof raw.venue === "string" ? raw.venue : "";
        const dateAndVenue = [date, venue].filter(Boolean).join(" - ");
        const surveyRate = toPercent(raw.surveyResponseRate);

        return {
          id: doc.id,
          slug: typeof raw.slug === "string" && raw.slug.trim() ? raw.slug : doc.id,
          name: typeof raw.name === "string" && raw.name.trim() ? raw.name : doc.id,
          dateAndVenue: dateAndVenue || "No schedule provided",
          scans: toNumber(raw.scans),
          certs: toNumber(raw.certsIssued),
          survey: `${surveyRate}%`,
        };
      });

      setAllEvents(firestoreEvents);
      setStats(buildStats(firestoreEvents));
    } catch (error) {
      setAllEvents([]);
      setSettings(null);
      setStats(buildStats([]));
      setDataError("Failed to load Firestore data. Check your Firebase rules and connection.");
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    if (!isHydrated || !isAuthenticated) {
      return;
    }

    void loadFirestoreData();
  }, [isHydrated, isAuthenticated]);

  useEffect(() => {
    return () => {
      if (selectedTemplatePreviewUrl) {
        window.URL.revokeObjectURL(selectedTemplatePreviewUrl);
      }
    };
  }, [selectedTemplatePreviewUrl]);

  const handleLogin = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (accessCode.trim() !== "certix2026") {
      setAccessError("Invalid access code.");
      return;
    }

    window.localStorage.setItem(ADMIN_ACCESS_KEY, "true");
    setIsAuthenticated(true);
    setAccessError("");
  };

  const handleLogout = () => {
    window.localStorage.removeItem(ADMIN_ACCESS_KEY);
    setIsAuthenticated(false);
    setAccessCode("");
    setAccessError("");
    setDataError("");
    setActiveView("dashboard");
    setCurrentStep(1);
  };

  const handleOpenBuilder = () => {
    setActiveView("builder");
    setCurrentStep(1);
  };

  const handleContinue = async () => {
    if (currentStep === 4) {
      if (isCreatingEvent) {
        return;
      }

      setIsCreatingEvent(true);
      let uploadedTemplateImageUrl = "";

      try {
        const eventName = formData.name.trim() || "Untitled Event";
        const eventSlug = slugify(eventName) || `event-${Date.now()}`;

        if (selectedTemplateFile && selectedTemplateFile.type.startsWith("image/")) {
          const safeName = selectedTemplateFile.name.replace(/[^a-zA-Z0-9_.-]/g, "-");
          const templateRef = ref(storage, `events/${eventSlug}/templates/${Date.now()}-${safeName}`);
          await uploadBytes(templateRef, selectedTemplateFile);
          uploadedTemplateImageUrl = await getDownloadURL(templateRef);
        }

        const eventPayload = {
          slug: eventSlug,
          name: eventName,
          date: formData.date.trim(),
          venue: "",
          description: formData.description.trim(),
          scans: 0,
          certsIssued: 0,
          surveyResponseRate: 0,
          surveyResponses: 0,
          templateName: selectedTemplateName,
          templateImageUrl: uploadedTemplateImageUrl,
          participantUrl: `/participants?event=${eventSlug}`,
          certificateField: {
            name: {
              x: nameField.x,
              y: nameField.y,
              fontSize: nameField.fontSize,
            },
          },
          surveyQuestions: surveyQuestions.map((question) => ({
            id: question.id,
            type: question.type,
            prompt: question.prompt,
            required: question.required,
            scaleMax: question.scaleMax ?? null,
            options: question.options ?? [],
          })),
          createdAt: serverTimestamp(),
        };

        await addDoc(collection(db, "events"), eventPayload);

        setFormData({
          name: "",
          date: "",
          description: "",
        });
        setSelectedTemplateName("");
        setSelectedTemplateFile(null);
        setSelectedTemplatePreviewUrl(null);
        setNameField({ x: 50, y: 48, fontSize: 24 });
        setSurveyQuestions([]);
        await loadFirestoreData();
        router.push(`/events/${eventSlug}`);
      } catch (error) {
        const eventName = formData.name.trim() || "Untitled Event";
        const eventSlug = slugify(eventName) || `event-${Date.now()}`;

        const localFallbackPayload = {
          slug: eventSlug,
          name: eventName,
          date: formData.date.trim(),
          venue: "",
          scans: 0,
          certsIssued: 0,
          surveyResponseRate: 0,
          surveyResponses: 0,
          templateName: selectedTemplateName,
          templateImageUrl:
            uploadedTemplateImageUrl ||
            (selectedTemplateFile && selectedTemplateFile.type.startsWith("image/")
              ? await fileToDataUrl(selectedTemplateFile)
              : ""),
          participantUrl: `/participants?event=${eventSlug}`,
          certificateField: {
            name: {
              x: nameField.x,
              y: nameField.y,
              fontSize: nameField.fontSize,
            },
          },
          surveyQuestions,
        };

        const serialized = window.localStorage.getItem(LOCAL_EVENTS_KEY);
        const localEvents = serialized ? (JSON.parse(serialized) as Record<string, unknown>) : {};
        localEvents[eventSlug] = localFallbackPayload;
        window.localStorage.setItem(LOCAL_EVENTS_KEY, JSON.stringify(localEvents));

        const message = error instanceof Error ? error.message : String(error);
        setDataError(
          message.includes("ERR_BLOCKED_BY_CLIENT") || message.toLowerCase().includes("failed to fetch")
            ? "Firestore is blocked by your browser extension. Showing a local draft event."
            : "Failed to create event in Firestore. Showing a local draft event.",
        );

        router.push(`/events/${eventSlug}`);
      } finally {
        setIsCreatingEvent(false);
      }

      return;
    }

    setCurrentStep((step) => step + 1);
  };

  const handleTemplateUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (selectedTemplatePreviewUrl) {
      window.URL.revokeObjectURL(selectedTemplatePreviewUrl);
    }

    setSelectedTemplateName(file.name);
    setSelectedTemplateFile(file);

    if (file.type.startsWith("image/")) {
      setSelectedTemplatePreviewUrl(window.URL.createObjectURL(file));
      return;
    }

    setSelectedTemplatePreviewUrl(null);
  };

  const handleAddQuestion = (type: SurveyQuestionType) => {
    setSurveyQuestions((current) => [...current, createQuestion(type)]);
  };

  const handleRemoveQuestion = (questionId: string) => {
    setSurveyQuestions((current) => current.filter((question) => question.id !== questionId));
  };

  const handleQuestionPromptChange = (questionId: string, prompt: string) => {
    setSurveyQuestions((current) =>
      current.map((question) => (question.id === questionId ? { ...question, prompt } : question)),
    );
  };

  const handleQuestionOptionChange = (questionId: string, optionIndex: number, value: string) => {
    setSurveyQuestions((current) =>
      current.map((question) => {
        if (question.id !== questionId || !question.options) {
          return question;
        }

        return {
          ...question,
          options: question.options.map((option, index) => (index === optionIndex ? value : option)),
        };
      }),
    );
  };

  const handleAddOption = (questionId: string) => {
    setSurveyQuestions((current) =>
      current.map((question) => {
        if (question.id !== questionId || !question.options) {
          return question;
        }

        return {
          ...question,
          options: [...question.options, `Option ${question.options.length + 1}`],
        };
      }),
    );
  };

  if (!isHydrated) {
    return (
      <main className="min-h-screen bg-[#ececec] px-6 py-10 text-[#202020] md:px-10">
        <div className="mx-auto flex min-h-[60vh] w-full max-w-md items-center justify-center text-sm text-[#7b7b7b]">
          Loading access screen...
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top,#ffe8df_0%,#f3f3f3_42%,#ececec_100%)] px-6 py-10 text-[#202020] md:px-10">
        <div className="mx-auto flex min-h-screen w-full max-w-md items-center">
          <form
            onSubmit={handleLogin}
            className="w-full rounded-[2rem] bg-white px-6 py-8 shadow-[0_20px_70px_rgba(255,91,46,0.08)] ring-1 ring-black/5"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#ff5b2e] text-xl font-bold text-white">
                C
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#ff5b2e]">Certix</p>
                <h1 className="text-2xl font-semibold text-[#1f1f1f]">Admin Login</h1>
              </div>
            </div>

            <p className="mt-4 text-sm leading-6 text-[#6e6e6e]">
              Enter the access code to open the admin workspace.
            </p>

            <div className="mt-6 space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[#2a2a2a]">Access Code</span>
                <input
                  type="password"
                  value={accessCode}
                  onChange={(event) => setAccessCode(event.target.value)}
                  placeholder="Enter access code"
                  className="w-full rounded-2xl border border-[#dfdfdf] bg-[#fbfbfb] px-4 py-3 text-sm outline-none placeholder:text-[#b0b0b0] focus:border-[#ff5b2e]"
                />
              </label>

              {accessError ? <p className="text-sm text-[#d53f3f]">{accessError}</p> : null}

              <button
                type="submit"
                className="flex w-full items-center justify-center rounded-full bg-[#ff5b2e] px-6 py-4 text-base font-semibold text-white transition-all active:scale-[0.99]"
              >
                Unlock Dashboard
              </button>
            </div>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#ececec] px-6 py-10 text-[#202020] md:px-10">
      <div className="mx-auto w-full max-w-6xl">
        {dataError ? (
          <div className="mb-4 rounded-2xl bg-[#ffe9e3] px-4 py-3 text-sm text-[#a5422a]">{dataError}</div>
        ) : null}

        {isLoadingData ? (
          <div className="mb-4 rounded-2xl bg-[#f5f5f5] px-4 py-3 text-sm text-[#6e6e6e]">Loading Firestore data...</div>
        ) : null}

        <AdminHeader
          activeView={activeView}
          onDashboard={() => setActiveView("dashboard")}
          onEvents={() => setActiveView("events")}
          onSettings={() => setActiveView("settings")}
          onAddEvent={handleOpenBuilder}
          onLogout={handleLogout}
        />

        {activeView === "dashboard" ? (
          <DashboardView
            stats={stats}
            organizationName={settings?.organizationName || "Admin"}
            onOpenBuilder={handleOpenBuilder}
          />
        ) : null}

        {activeView === "events" ? (
          <EventsView
            events={allEvents}
            onSelectEvent={(event) => {
              router.push(`/events/${event.slug}`);
            }}
          />
        ) : null}

        {activeView === "builder" ? (
          <BuilderView
            currentStep={currentStep}
            steps={builderSteps}
            formData={formData}
            selectedTemplateName={selectedTemplateName}
            selectedTemplatePreviewUrl={selectedTemplatePreviewUrl}
            nameField={nameField}
            surveyQuestions={surveyQuestions}
            onNameChange={(value) => setFormData((prev) => ({ ...prev, name: value }))}
            onDateChange={(value) => setFormData((prev) => ({ ...prev, date: value }))}
            onDescriptionChange={(value) => setFormData((prev) => ({ ...prev, description: value }))}
            onTemplateUpload={handleTemplateUpload}
            onAddQuestion={handleAddQuestion}
            onRemoveQuestion={handleRemoveQuestion}
            onQuestionPromptChange={handleQuestionPromptChange}
            onQuestionOptionChange={handleQuestionOptionChange}
            onAddOption={handleAddOption}
            onNameFieldChange={setNameField}
            isCreatingEvent={isCreatingEvent}
            onContinue={handleContinue}
          />
        ) : null}

        {activeView === "settings" ? (
          <SettingsView settings={settings} />
        ) : null}
      </div>
    </main>
  );
}
