"use client";

import { collection, getDocs, limit, query, where } from "firebase/firestore";
import { useParams, useRouter } from "next/navigation";
import QRCode from "qrcode";
import { useEffect, useMemo, useState } from "react";

import { db } from "../../../lib/firebase";
import type { SurveyQuestion } from "../../components/admin/types";

type EventRecord = {
  slug: string;
  name: string;
  date: string;
  venue: string;
  scans: number;
  certsIssued: number;
  surveyResponseRate: number;
  participantUrl: string;
  surveyQuestions: SurveyQuestion[];
};

type EventTab = "stats" | "qr" | "survey" | "participants";

const ADMIN_ACCESS_KEY = "certix-admin-auth";
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

export default function EventPage() {
  const params = useParams<{ eventSlug: string }>();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<EventTab>("stats");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [eventData, setEventData] = useState<EventRecord | null>(null);

  const eventSlug = useMemo(() => {
    const raw = params?.eventSlug;
    return typeof raw === "string" ? raw : "";
  }, [params]);

  const loadLocalFallbackEvent = () => {
    const serialized = window.localStorage.getItem(LOCAL_EVENTS_KEY);

    if (!serialized) {
      return false;
    }

    const localEvents = JSON.parse(serialized) as Record<string, EventRecord>;
    const localEvent = localEvents[eventSlug];

    if (!localEvent) {
      return false;
    }

    setEventData({
      slug: localEvent.slug || eventSlug,
      name: localEvent.name || "Untitled Event",
      date: localEvent.date || "",
      venue: localEvent.venue || "",
      scans: toNumber(localEvent.scans),
      certsIssued: toNumber(localEvent.certsIssued),
      surveyResponseRate: toNumber(localEvent.surveyResponseRate),
      participantUrl: localEvent.participantUrl || `/participants?event=${eventSlug}`,
      surveyQuestions: Array.isArray(localEvent.surveyQuestions) ? localEvent.surveyQuestions : [],
    });

    setWarning("Firestore is blocked. Showing a local draft event.");
    return true;
  };

  useEffect(() => {
    const hasAccess = window.localStorage.getItem(ADMIN_ACCESS_KEY) === "true";

    if (!hasAccess) {
      router.replace("/");
    }
  }, [router]);

  useEffect(() => {
    if (!eventSlug) {
      return;
    }

    const loadEvent = async () => {
      setIsLoading(true);
      setError("");
      setWarning("");

      try {
        const snapshot = await getDocs(query(collection(db, "events"), where("slug", "==", eventSlug), limit(1)));

        if (snapshot.empty) {
          const loadedFallback = loadLocalFallbackEvent();

          if (!loadedFallback) {
            setEventData(null);
            setError("Event not found.");
          }

          return;
        }

        const raw = snapshot.docs[0].data();

        setEventData({
          slug: typeof raw.slug === "string" ? raw.slug : eventSlug,
          name: typeof raw.name === "string" ? raw.name : "Untitled Event",
          date: typeof raw.date === "string" ? raw.date : "",
          venue: typeof raw.venue === "string" ? raw.venue : "",
          scans: toNumber(raw.scans),
          certsIssued: toNumber(raw.certsIssued),
          surveyResponseRate: toNumber(raw.surveyResponseRate),
          participantUrl:
            typeof raw.participantUrl === "string" && raw.participantUrl
              ? raw.participantUrl
              : `/participants?event=${eventSlug}`,
          surveyQuestions: Array.isArray(raw.surveyQuestions) ? (raw.surveyQuestions as SurveyQuestion[]) : [],
        });
      } catch (loadError) {
        const loadedFallback = loadLocalFallbackEvent();

        if (!loadedFallback) {
          setError("Failed to load event data from Firestore.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    void loadEvent();
  }, [eventSlug]);

  useEffect(() => {
    if (!eventData) {
      return;
    }

    const participantUrl = eventData.participantUrl.startsWith("http")
      ? eventData.participantUrl
      : `${window.location.origin}${eventData.participantUrl}`;

    void QRCode.toDataURL(participantUrl, {
      width: 300,
      margin: 1,
      color: {
        dark: "#111111",
        light: "#ffffff",
      },
    }).then(setQrDataUrl);
  }, [eventData]);

  const handleCopy = async () => {
    if (!eventData || !navigator.clipboard) {
      return;
    }

    const participantUrl = eventData.participantUrl.startsWith("http")
      ? eventData.participantUrl
      : `${window.location.origin}${eventData.participantUrl}`;

    await navigator.clipboard.writeText(participantUrl);
    setCopied(true);

    window.setTimeout(() => {
      setCopied(false);
    }, 1000);
  };

  const tabClass = (isActive: boolean) =>
    isActive
      ? "inline-flex items-center rounded-full bg-[#141519] px-6 py-3 text-sm font-medium text-white"
      : "inline-flex items-center rounded-full bg-[#f1f1f1] px-6 py-3 text-sm text-[#2f2f2f]";

  return (
    <main className="min-h-screen bg-[#ececec] px-6 py-10 text-[#202020] md:px-10">
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-7 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#ff5b2e] text-sm font-semibold text-[#ff5b2e]">
              C
            </span>
            <span className="text-[2rem] font-bold leading-none text-[#ff5b2e]">Certix</span>
          </div>

          <nav className="rounded-full bg-[#dfdfdf] p-1.5">
            <ul className="flex items-center gap-1 text-sm">
              <li>
                <button type="button" onClick={() => router.push("/")} className="rounded-full px-6 py-2 text-[#202020]">
                  Dashboard
                </button>
              </li>
              <li>
                <button type="button" className="rounded-full bg-[#ff5b2e] px-6 py-2 font-medium text-white">
                  Events
                </button>
              </li>
              <li>
                <button type="button" onClick={() => router.push("/")} className="rounded-full px-6 py-2 text-[#202020]">
                  Settings
                </button>
              </li>
              <li>
                <button type="button" onClick={() => router.push("/")} className="rounded-full bg-[#d5d5d5] px-6 py-2 text-[#202020]">
                  Add Event
                </button>
              </li>
            </ul>
          </nav>

          <button type="button" className="h-11 w-11 rounded-full bg-[#bdbdbd] ring-4 ring-[#e5e5e5]" />
        </header>

        <button
          type="button"
          onClick={() => router.push("/")}
          className="mb-2 inline-flex items-center text-3xl leading-none text-[#4e4e4e]"
          aria-label="Back to events"
        >
          &larr;
        </button>

        {isLoading ? <p className="text-[#6f6f6f]">Loading event...</p> : null}
        {error ? <p className="text-[#bb4430]">{error}</p> : null}
        {warning ? <p className="text-[#a06d24]">{warning}</p> : null}

        {!isLoading && eventData ? (
          <>
            <div>
              <h2 className="text-[2.2rem] font-medium leading-tight text-[#222]">{eventData.name}</h2>
              <p className="mt-1 text-[1.3rem] text-[#666]">
                {[eventData.date, eventData.venue].filter(Boolean).join(" • ") || "No schedule provided"}
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <button type="button" onClick={() => setActiveTab("stats")} className={tabClass(activeTab === "stats")}>
                Event Statistics
              </button>
              <button type="button" onClick={() => setActiveTab("qr")} className={tabClass(activeTab === "qr")}>
                QR Code
              </button>
              <button type="button" onClick={() => setActiveTab("survey")} className={tabClass(activeTab === "survey")}>
                Survey Form
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("participants")}
                className={tabClass(activeTab === "participants")}
              >
                Participants
              </button>
            </div>

            {activeTab === "stats" ? (
              <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                <article className="rounded-3xl bg-[#f5f5f5] p-6">
                  <p className="text-[1.25rem] text-[#6b6b6b]">Certificates Issued</p>
                  <p className="mt-2 text-6xl font-medium leading-none text-[#252525]">{eventData.certsIssued}</p>
                  <span className="mt-8 inline-block rounded-full bg-[#d7f0e6] px-3 py-1 text-xs font-medium text-[#1f8f67]">
                    Event total
                  </span>
                </article>

                <article className="rounded-3xl bg-[#f5f5f5] p-6">
                  <p className="text-[1.25rem] text-[#6b6b6b]">QR Code Scans</p>
                  <p className="mt-2 text-6xl font-medium leading-none text-[#252525]">{eventData.scans}</p>
                  <span className="mt-8 inline-block rounded-full bg-[#d7f0e6] px-3 py-1 text-xs font-medium text-[#1f8f67]">
                    Event total
                  </span>
                </article>

                <article className="rounded-3xl bg-[#f5f5f5] p-6">
                  <p className="text-[1.25rem] text-[#6b6b6b]">Survey Response Rate</p>
                  <p className="mt-2 text-6xl font-medium leading-none text-[#252525]">{eventData.surveyResponseRate}%</p>
                  <span className="mt-8 inline-block rounded-full bg-[#d7f0e6] px-3 py-1 text-xs font-medium text-[#1f8f67]">
                    Event total
                  </span>
                </article>
              </div>
            ) : null}

            {activeTab === "qr" ? (
              <section className="mt-6 w-full max-w-140 rounded-3xl bg-[#f5f5f5] p-8">
                <h3 className="text-center text-[2rem] font-medium text-[#232323]">Event QR Code</h3>
                <p className="mt-1 text-center text-sm text-[#6f6f6f]">Share this with participants to start the certificate flow</p>

                <div className="mt-5 flex justify-center">
                  {qrDataUrl ? (
                    <img src={qrDataUrl} alt="Event QR code" className="h-64 w-64 bg-white p-2" />
                  ) : (
                    <div className="flex h-64 w-64 items-center justify-center bg-white text-sm text-[#6f6f6f]">Generating QR...</div>
                  )}
                </div>

                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <button
                    type="button"
                    className="rounded-full bg-[#ff5b2e] px-7 py-3 text-sm font-medium text-white"
                    onClick={() => {
                      if (!qrDataUrl) {
                        return;
                      }

                      const link = document.createElement("a");
                      link.href = qrDataUrl;
                      link.download = `${eventData.slug}-qr.png`;
                      link.click();
                    }}
                  >
                    Download QR
                  </button>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="rounded-full border border-[#8e8e8e] px-7 py-3 text-sm font-medium text-[#2f2f2f]"
                  >
                    {copied ? "Copied" : "Copy Link"}
                  </button>
                </div>

                <div className="mt-4 rounded-2xl border border-[#dedede] bg-[#f1f1f1] px-4 py-3 text-sm text-[#8b8b8b]">
                  {eventData.participantUrl.startsWith("http")
                    ? eventData.participantUrl
                    : `${window.location.origin}${eventData.participantUrl}`}
                </div>
              </section>
            ) : null}

            {activeTab === "survey" ? (
              <section className="mt-6 space-y-3">
                {eventData.surveyQuestions.length === 0 ? (
                  <div className="rounded-2xl bg-[#f5f5f5] px-5 py-6 text-[#6f6f6f]">No survey questions configured for this event.</div>
                ) : (
                  eventData.surveyQuestions.map((question, index) => (
                    <article key={question.id} className="rounded-2xl bg-[#f5f5f5] px-5 py-5">
                      <p className="text-xs uppercase tracking-wide text-[#989898]">Question {index + 1}</p>
                      <p className="mt-2 text-lg text-[#2d2d2d]">{question.prompt}</p>
                      <p className="mt-1 text-xs text-[#8a8a8a]">Type: {question.type}</p>
                    </article>
                  ))
                )}
              </section>
            ) : null}

            {activeTab === "participants" ? (
              <section className="mt-6 rounded-2xl bg-[#f5f5f5] px-5 py-6 text-[#6f6f6f]">
                No participants yet for this event.
              </section>
            ) : null}
          </>
        ) : null}
      </div>
    </main>
  );
}
