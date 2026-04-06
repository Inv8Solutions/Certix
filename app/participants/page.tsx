"use client";

import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

import { db } from "../../lib/firebase";
import type { CertificateNameField, SurveyQuestion } from "../components/admin/types";

type FlowStep = "intro" | "details" | "survey" | "ready";

type EventConfig = {
  id: string;
  slug: string;
  name: string;
  date: string;
  venue: string;
  participantUrl: string;
  templateImageUrl: string;
  certificateNameField: CertificateNameField;
  surveyQuestions: SurveyQuestion[];
  scans: number;
  certsIssued: number;
  surveyResponses: number;
};

const LOCAL_EVENTS_KEY = "certix-local-events";

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

function loadImageFromSource(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    if (!source.startsWith("data:") && !source.startsWith("blob:")) {
      image.crossOrigin = "anonymous";
    }
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Failed to load template image."));
    image.src = source;
  });
}

function resolveTemplateImageUrl(raw: Record<string, unknown>) {
  const fromTemplateObject = raw.template as { imageUrl?: unknown; url?: unknown } | undefined;
  const candidates = [
    raw.templateImageUrl,
    raw.templateUrl,
    raw.certificateTemplateUrl,
    fromTemplateObject?.imageUrl,
    fromTemplateObject?.url,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate;
    }
  }

  return "";
}

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("Failed to convert certificate for upload."));
    };
    reader.onerror = () => reject(new Error("Failed to read generated certificate."));
    reader.readAsDataURL(blob);
  });
}

async function buildCertificateBlob(
  participantName: string,
  templateImageUrl: string,
  nameField: CertificateNameField,
) {
  const canvas = document.createElement("canvas");
  canvas.width = 1600;
  canvas.height = 1200;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Could not initialize canvas context.");
  }

  if (templateImageUrl) {
    const image = await loadImageFromSource(templateImageUrl);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
  } else {
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
  }

  const renderX = (nameField.x / 100) * canvas.width;
  const renderY = (nameField.y / 100) * canvas.height;
  const renderFontSize = Math.max(24, nameField.fontSize * 2);

  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = `700 ${renderFontSize}px Arial`;
  context.lineWidth = Math.max(2, renderFontSize * 0.12);
  context.strokeStyle = "rgba(255,255,255,0.9)";
  context.fillStyle = "#1e2a24";
  context.strokeText(participantName, renderX, renderY);
  context.fillText(participantName, renderX, renderY);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Failed to render certificate image."));
        return;
      }

      resolve(blob);
    }, "image/png");
  });
}

function ParticipantLandingContent() {
  const searchParams = useSearchParams();
  const eventSlug = searchParams.get("event") || "";

  const [flowStep, setFlowStep] = useState<FlowStep>("intro");
  const [isLoadingEvent, setIsLoadingEvent] = useState(true);
  const [error, setError] = useState("");
  const [eventConfig, setEventConfig] = useState<EventConfig | null>(null);

  const [participantName, setParticipantName] = useState("");
  const [participantEmail, setParticipantEmail] = useState("");
  const [participantOrganization, setParticipantOrganization] = useState("");
  const [answers, setAnswers] = useState<Record<string, string | number>>({});

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [generatedCertificateUrl, setGeneratedCertificateUrl] = useState<string | null>(null);
  const [uploadedCertificateUrl, setUploadedCertificateUrl] = useState<string | null>(null);

  const displayDateVenue = useMemo(() => {
    if (!eventConfig) {
      return "";
    }

    return [eventConfig.date, eventConfig.venue].filter(Boolean).join(" • ");
  }, [eventConfig]);

  useEffect(() => {
    return () => {
      if (generatedCertificateUrl) {
        window.URL.revokeObjectURL(generatedCertificateUrl);
      }
    };
  }, [generatedCertificateUrl]);

  useEffect(() => {
    if (!eventSlug) {
      setError("Missing event identifier in QR link.");
      setIsLoadingEvent(false);
      return;
    }

    const loadFromLocalFallback = () => {
      const serialized = window.localStorage.getItem(LOCAL_EVENTS_KEY);

      if (!serialized) {
        return false;
      }

      const localEvents = JSON.parse(serialized) as Record<string, unknown>;
      const raw = localEvents[eventSlug] as Record<string, unknown> | undefined;

      if (!raw) {
        return false;
      }

      const fallbackNameField = (raw.certificateField as { name?: CertificateNameField } | undefined)?.name;

      setEventConfig({
        id: eventSlug,
        slug: eventSlug,
        name: typeof raw.name === "string" ? raw.name : "Untitled Event",
        date: typeof raw.date === "string" ? raw.date : "",
        venue: typeof raw.venue === "string" ? raw.venue : "",
        participantUrl:
          typeof raw.participantUrl === "string" ? raw.participantUrl : `/participants?event=${eventSlug}`,
        templateImageUrl: resolveTemplateImageUrl(raw),
        certificateNameField: {
          x: toNumber(fallbackNameField?.x) || 50,
          y: toNumber(fallbackNameField?.y) || 48,
          fontSize: toNumber(fallbackNameField?.fontSize) || 24,
        },
        surveyQuestions: Array.isArray(raw.surveyQuestions) ? (raw.surveyQuestions as SurveyQuestion[]) : [],
        scans: toNumber(raw.scans),
        certsIssued: toNumber(raw.certsIssued),
        surveyResponses: toNumber(raw.surveyResponses),
      });

      setError("Firestore is blocked. Running local draft mode.");
      return true;
    };

    const loadEvent = async () => {
      setIsLoadingEvent(true);
      setError("");

      try {
        const snapshot = await getDocs(query(collection(db, "events"), where("slug", "==", eventSlug), limit(1)));

        if (snapshot.empty) {
          const loaded = loadFromLocalFallback();

          if (!loaded) {
            setError("Event not found.");
          }

          return;
        }

        const docSnapshot = snapshot.docs[0];
        const raw = docSnapshot.data();
        const nameField = (raw.certificateField as { name?: CertificateNameField } | undefined)?.name;

        const nextEvent: EventConfig = {
          id: docSnapshot.id,
          slug: typeof raw.slug === "string" && raw.slug ? raw.slug : eventSlug,
          name: typeof raw.name === "string" ? raw.name : "Untitled Event",
          date: typeof raw.date === "string" ? raw.date : "",
          venue: typeof raw.venue === "string" ? raw.venue : "",
          participantUrl:
            typeof raw.participantUrl === "string" && raw.participantUrl
              ? raw.participantUrl
              : `/participants?event=${eventSlug}`,
          templateImageUrl: resolveTemplateImageUrl(raw),
          certificateNameField: {
            x: toNumber(nameField?.x) || 50,
            y: toNumber(nameField?.y) || 48,
            fontSize: toNumber(nameField?.fontSize) || 24,
          },
          surveyQuestions: Array.isArray(raw.surveyQuestions) ? (raw.surveyQuestions as SurveyQuestion[]) : [],
          scans: toNumber(raw.scans),
          certsIssued: toNumber(raw.certsIssued),
          surveyResponses: toNumber(raw.surveyResponses),
        };

        setEventConfig(nextEvent);

        await runTransaction(db, async (transaction) => {
          const eventRef = doc(db, "events", docSnapshot.id);
          const current = await transaction.get(eventRef);
          const currentScans = toNumber(current.data()?.scans);
          transaction.update(eventRef, { scans: currentScans + 1 });
        });

        setEventConfig((current) => (current ? { ...current, scans: current.scans + 1 } : current));
      } catch (loadError) {
        const loaded = loadFromLocalFallback();

        if (!loaded) {
          setError("Failed to load event from Firestore.");
        }
      } finally {
        setIsLoadingEvent(false);
      }
    };

    void loadEvent();
  }, [eventSlug]);

  const handleSurveySubmit = async () => {
    if (!eventConfig || isSubmitting) {
      return;
    }

    if (!participantName.trim()) {
      setError("Please provide your full name before continuing.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const certificateBlob = await buildCertificateBlob(
        participantName.trim(),
        eventConfig.templateImageUrl,
        eventConfig.certificateNameField,
      );

      if (generatedCertificateUrl) {
        window.URL.revokeObjectURL(generatedCertificateUrl);
      }

      const nextCertificateUrl = window.URL.createObjectURL(certificateBlob);
      setGeneratedCertificateUrl(nextCertificateUrl);

      let cloudinaryCertificateUrl = "";
      let cloudinaryPublicId = "";

      try {
        const imageData = await blobToDataUrl(certificateBlob);
        const uploadResponse = await fetch("/api/certificates/upload", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            imageData,
            eventSlug: eventConfig.slug,
            participantName: participantName.trim(),
          }),
        });

        if (!uploadResponse.ok) {
          throw new Error("Cloud upload failed.");
        }

        const uploadResult = (await uploadResponse.json()) as {
          secureUrl?: unknown;
          publicId?: unknown;
        };

        cloudinaryCertificateUrl =
          typeof uploadResult.secureUrl === "string" ? uploadResult.secureUrl : "";
        cloudinaryPublicId = typeof uploadResult.publicId === "string" ? uploadResult.publicId : "";
      } catch (uploadError) {
        setError("Certificate generated, but cloud save failed. You can still download it now.");
      }

      setUploadedCertificateUrl(cloudinaryCertificateUrl || null);

      if (eventConfig.id !== eventConfig.slug) {
        await addDoc(collection(db, "events", eventConfig.id, "responses"), {
          name: participantName.trim(),
          email: participantEmail.trim(),
          organization: participantOrganization.trim(),
          answers,
          certificateUrl: cloudinaryCertificateUrl,
          certificatePublicId: cloudinaryPublicId,
          createdAt: serverTimestamp(),
        });

        await runTransaction(db, async (transaction) => {
          const eventRef = doc(db, "events", eventConfig.id);
          const current = await transaction.get(eventRef);

          const currentScans = toNumber(current.data()?.scans);
          const currentCerts = toNumber(current.data()?.certsIssued);
          const currentResponses = toNumber(current.data()?.surveyResponses);

          const nextCerts = currentCerts + 1;
          const nextResponses = currentResponses + 1;
          const nextRate = currentScans > 0 ? Math.round((nextResponses / currentScans) * 100) : 0;

          transaction.update(eventRef, {
            certsIssued: nextCerts,
            surveyResponses: nextResponses,
            surveyResponseRate: nextRate,
          });
        });
      }

      setFlowStep("ready");
    } catch (submitError) {
      setError("Failed to prepare certificate. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadCertificate = () => {
    if (!generatedCertificateUrl || isDownloading || !eventConfig) {
      return;
    }

    setIsDownloading(true);

    const link = document.createElement("a");
    link.href = generatedCertificateUrl;
    link.download = `${eventConfig.slug || "certificate"}-${participantName || "participant"}.png`;
    link.click();

    window.setTimeout(() => {
      setIsDownloading(false);
    }, 600);
  };

  if (isLoadingEvent) {
    return <main className="min-h-screen bg-[#f8f8f8] px-6 py-10 text-sm text-[#666]">Loading event...</main>;
  }

  if (!eventConfig) {
    return (
      <main className="min-h-screen bg-[#f8f8f8] px-6 py-10 text-sm text-[#bb4430]">
        {error || "This event link is invalid."}
      </main>
    );
  }

  const surveyQuestions = eventConfig.surveyQuestions;

  const renderSurveyQuestion = (question: SurveyQuestion) => {
    if (question.type === "rating") {
      const selected = toNumber(answers[question.id]);
      const scale = question.scaleMax || 5;

      return (
        <section key={question.id} className="rounded-2xl border border-[#dedede] bg-[#fafafa] px-4 py-4">
          <p className="text-sm text-[#222]">{question.prompt}</p>
          <div className="mt-3 flex gap-2">
            {Array.from({ length: scale }).map((_, index) => {
              const rating = index + 1;
              const isActive = rating <= selected;

              return (
                <button
                  key={`${question.id}-${rating}`}
                  type="button"
                  onClick={() => setAnswers((current) => ({ ...current, [question.id]: rating }))}
                  aria-label={`Rate ${rating} star`}
                  className={`flex h-12 w-12 items-center justify-center rounded-xl border bg-white text-2xl shadow-[0_1px_0_rgba(0,0,0,0.02)] ${
                    isActive ? "border-[#ffb34d] text-[#ffb34d]" : "border-[#dcdcdc] text-[#d0d0d0]"
                  }`}
                >
                  ★
                </button>
              );
            })}
          </div>
        </section>
      );
    }

    if (question.type === "multiple_choice") {
      const selected = String(answers[question.id] || "");

      return (
        <section key={question.id} className="rounded-2xl border border-[#dedede] bg-[#fafafa] px-4 py-4">
          <p className="text-sm text-[#222]">{question.prompt}</p>
          <div className="mt-3 space-y-3">
            {(question.options || []).map((option) => {
              const isActive = selected === option;

              return (
                <button
                  key={`${question.id}-${option}`}
                  type="button"
                  onClick={() => setAnswers((current) => ({ ...current, [question.id]: option }))}
                  className={`flex w-full items-center gap-3 rounded-xl border bg-white px-4 py-3 text-left text-sm text-[#2f2f2f] ${
                    isActive ? "border-[#ff5b2e]" : "border-[#dcdcdc]"
                  }`}
                >
                  <span
                    className={`inline-flex h-5 w-5 items-center justify-center rounded-full border text-[10px] leading-none ${
                      isActive ? "border-[#ff5b2e] text-[#ff5b2e]" : "border-[#3d3d3d] text-transparent"
                    }`}
                  >
                    •
                  </span>
                  {option}
                </button>
              );
            })}
          </div>
        </section>
      );
    }

    return (
      <section key={question.id} className="rounded-2xl border border-[#dedede] bg-[#fafafa] px-4 py-4">
        <p className="text-sm text-[#222]">{question.prompt}</p>
        <textarea
          rows={4}
          value={String(answers[question.id] || "")}
          onChange={(event) => setAnswers((current) => ({ ...current, [question.id]: event.target.value }))}
          placeholder="Share your response..."
          className="mt-3 w-full resize-none rounded-2xl border border-[#e4e4e4] bg-[#fbfbfb] px-4 py-3 text-sm text-[#222] outline-none placeholder:text-[#adadad] focus:border-[#ff5b2e]"
        />
      </section>
    );
  };

  return (
    <div className="min-h-screen bg-[#f8f8f8]">
      <section className="w-full bg-gradient-to-b from-[#ff5b2e] to-[#d64820] px-6 py-8 text-center">
        <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-md bg-white">
          <span className="text-lg font-bold text-[#ff5b2e]">8</span>
        </div>
        <h1 className="text-3xl font-bold text-white">certix</h1>
        <p className="mt-1 text-sm font-medium text-white opacity-90">studio</p>

        <div className="mt-8">
          <h2 className="text-2xl font-semibold text-white">{eventConfig.name}</h2>
          <p className="mt-2 text-sm text-white opacity-90">{displayDateVenue}</p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-md px-4 py-6 sm:px-6">
        {error ? <p className="mb-3 text-sm text-[#bb4430]">{error}</p> : null}

        {flowStep === "intro" ? (
          <div className="rounded-3xl bg-white px-5 py-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] ring-1 ring-black/5 sm:px-6 sm:py-7">
            <div className="mb-5 flex items-center gap-2">
              <span className="text-2xl">🎓</span>
              <h3 className="text-lg font-semibold text-[#252525]">Get Your Certificate</h3>
            </div>

            <p className="mb-6 text-sm leading-6 text-[#6e6e6e]">
              Fill out your details and complete the survey to generate your certificate.
            </p>

            <div className="mb-7 space-y-3">
              <div className="flex items-start gap-3">
                <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#ffe8e1] text-sm font-semibold text-[#ff5b2e]">
                  1
                </span>
                <p className="pt-0.5 text-sm text-[#2a2a2a]">Fill in your details</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#ffe8e1] text-sm font-semibold text-[#ff5b2e]">
                  2
                </span>
                <p className="pt-0.5 text-sm text-[#2a2a2a]">Complete the survey</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#ffe8e1] text-sm font-semibold text-[#ff5b2e]">
                  3
                </span>
                <p className="pt-0.5 text-sm text-[#2a2a2a]">Download your certificate instantly</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setFlowStep("details")}
              className="mb-4 flex w-full items-center justify-center gap-3 rounded-full bg-[#ff5b2e] px-6 py-4 text-base font-semibold text-white transition-all active:scale-[0.99]"
            >
              Get My Certificate
              <span aria-hidden="true" className="text-xl leading-none">
                →
              </span>
            </button>

            <p className="text-center text-xs text-[#9a9a9a]">Takes less than 2 minutes</p>
          </div>
        ) : flowStep === "details" ? (
          <div className="rounded-3xl bg-white px-5 py-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] ring-1 ring-black/5 sm:px-6 sm:py-7">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#ff5b2e]">Step 1 of 2</p>
                <h3 className="mt-2 text-2xl font-semibold text-[#252525]">Tell us who you are</h3>
                <p className="mt-2 text-sm leading-6 text-[#6e6e6e]">Use the same details you want printed on your certificate.</p>
              </div>
              <button
                type="button"
                onClick={() => setFlowStep("intro")}
                className="rounded-full bg-[#f2f2f2] px-3 py-2 text-xs font-medium text-[#555]"
              >
                Back
              </button>
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[#2a2a2a]">Full Name</span>
                <input
                  type="text"
                  value={participantName}
                  onChange={(event) => setParticipantName(event.target.value)}
                  placeholder="Juan Dela Cruz"
                  className="w-full rounded-2xl border border-[#e4e4e4] bg-[#fbfbfb] px-4 py-3 text-sm text-[#222] outline-none placeholder:text-[#adadad] focus:border-[#ff5b2e]"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[#2a2a2a]">Email Address</span>
                <input
                  type="email"
                  value={participantEmail}
                  onChange={(event) => setParticipantEmail(event.target.value)}
                  placeholder="name@email.com"
                  className="w-full rounded-2xl border border-[#e4e4e4] bg-[#fbfbfb] px-4 py-3 text-sm text-[#222] outline-none placeholder:text-[#adadad] focus:border-[#ff5b2e]"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[#2a2a2a]">School / Organization</span>
                <input
                  type="text"
                  value={participantOrganization}
                  onChange={(event) => setParticipantOrganization(event.target.value)}
                  placeholder="University / Company"
                  className="w-full rounded-2xl border border-[#e4e4e4] bg-[#fbfbfb] px-4 py-3 text-sm text-[#222] outline-none placeholder:text-[#adadad] focus:border-[#ff5b2e]"
                />
              </label>
            </div>

            <button
              type="button"
              onClick={() => setFlowStep("survey")}
              className="mt-6 flex w-full items-center justify-center gap-3 rounded-full bg-[#ff5b2e] px-6 py-4 text-base font-semibold text-white transition-all active:scale-[0.99]"
            >
              Continue to Survey
              <span aria-hidden="true" className="text-xl leading-none">
                →
              </span>
            </button>
          </div>
        ) : flowStep === "survey" ? (
          <div className="rounded-[1.75rem] bg-white px-4 py-4 shadow-[0_8px_30px_rgba(0,0,0,0.04)] ring-1 ring-black/5 sm:px-5 sm:py-5">
            <button
              type="button"
              onClick={() => setFlowStep("details")}
              className="inline-flex items-center gap-2 text-sm text-[#8a8a8a]"
            >
              <span aria-hidden="true" className="text-2xl leading-none">
                ←
              </span>
              Back
            </button>

            <div className="mt-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#ff5b2e]">Step 2 of 2</p>
              <h3 className="mt-3 text-2xl font-semibold text-[#252525]">Quick Survey</h3>
              <p className="mt-2 text-sm text-[#9a9a9a]">
                {surveyQuestions.length} question{surveyQuestions.length === 1 ? "" : "s"}. Unlocks your certificate
              </p>
            </div>

            <div className="mt-6 space-y-4">{surveyQuestions.map(renderSurveyQuestion)}</div>

            <button
              type="button"
              onClick={handleSurveySubmit}
              disabled={isSubmitting}
              aria-busy={isSubmitting}
              className="mt-6 flex w-full items-center justify-center gap-3 rounded-full bg-[#ff5b2e] px-6 py-4 text-base font-semibold text-white transition-all active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-80"
            >
              {isSubmitting ? (
                <>
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />
                  Generating Certificate...
                </>
              ) : (
                <>
                  Submit &amp; Get Certificate
                  <span aria-hidden="true" className="text-xl leading-none">
                    →
                  </span>
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="rounded-[1.75rem] bg-white px-5 py-8 text-center shadow-[0_8px_30px_rgba(0,0,0,0.04)] ring-1 ring-black/5 sm:px-6">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-[#ff5b2e] text-5xl font-light text-white">
              ✓
            </div>

            <h3 className="mt-6 text-[1.55rem] font-medium leading-tight text-[#222]">Your Certificate is Ready!</h3>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#9a9a9a]">
              Your certificate is generated using the template and text placement from event setup.
            </p>

            {uploadedCertificateUrl ? (
              <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-[#6f6f6f]">
                Saved to cloud successfully.
              </p>
            ) : null}

            <div className="mt-6 overflow-hidden rounded-[1.5rem] bg-white shadow-[0_8px_30px_rgba(0,0,0,0.08)] ring-1 ring-black/5">
              <div className="relative aspect-[4/3] bg-[#f2f2f2]">
                {generatedCertificateUrl ? (
                  <img src={generatedCertificateUrl} alt="Generated certificate preview" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-[#7a7a7a]">Preparing preview...</div>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={handleDownloadCertificate}
              disabled={isDownloading || !generatedCertificateUrl}
              aria-busy={isDownloading}
              className="mt-6 flex w-full items-center justify-center gap-3 rounded-full bg-[#ff5b2e] px-6 py-4 text-base font-semibold text-white transition-all active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-80"
            >
              {isDownloading ? (
                <>
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />
                  Preparing Download...
                </>
              ) : (
                <>
                  <span aria-hidden="true" className="text-base leading-none">
                    ⤓
                  </span>
                  Download Certificate
                </>
              )}
            </button>

            <button
              type="button"
              className="mt-3 flex w-full items-center justify-center rounded-full bg-[#f2f2f2] px-6 py-4 text-base font-semibold text-[#b2b2b2]"
            >
              Resend to Email
            </button>
          </div>
        )}
      </section>

      <div className="border-t border-[#e5e5e5] px-6 py-6 text-center">
        <p className="text-xs text-[#9a9a9a]">
          Powered by <span className="font-medium text-[#ff5b2e]">Certix Studio</span>
        </p>
      </div>
    </div>
  );
}

export default function ParticipantLanding() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#f8f8f8] px-6 py-10 text-sm text-[#666]">Loading event...</main>}>
      <ParticipantLandingContent />
    </Suspense>
  );
}
