"use client";

import { useState } from "react";

import type { AdminEvent } from "./types";

type EventDetailTab = "stats" | "qr" | "survey" | "participants";
type SurveyMode = "builder" | "responses";

const EVENT_LINK = "https://667de8df-a0-figmaframepreview.figma.site/p/1";

function isFinderModule(row: number, col: number, startRow: number, startCol: number) {
  const localRow = row - startRow;
  const localCol = col - startCol;
  const inFinder = localRow >= 0 && localRow < 7 && localCol >= 0 && localCol < 7;

  if (!inFinder) {
    return false;
  }

  const onOuterBorder = localRow === 0 || localRow === 6 || localCol === 0 || localCol === 6;
  const onInnerSquare = localRow >= 2 && localRow <= 4 && localCol >= 2 && localCol <= 4;

  return onOuterBorder || onInnerSquare;
}

function isQrDarkModule(row: number, col: number) {
  const inAnyFinder =
    isFinderModule(row, col, 0, 0) || isFinderModule(row, col, 0, 22) || isFinderModule(row, col, 22, 0);

  if (inAnyFinder) {
    return true;
  }

  const inFinderArea =
    (row < 8 && col < 8) || (row < 8 && col > 20) || (row > 20 && col < 8) || row === 6 || col === 6;

  if (inFinderArea) {
    return false;
  }

  return (row * 17 + col * 31 + row * col) % 7 < 3;
}

function QrMock() {
  const size = 29;

  return (
    <svg viewBox="0 0 290 290" className="mx-auto h-64 w-64 bg-white p-2" role="img" aria-label="Event QR code">
      <rect width="290" height="290" fill="white" />
      {Array.from({ length: size }).map((_, row) =>
        Array.from({ length: size }).map((__, col) => {
          if (!isQrDarkModule(row, col)) {
            return null;
          }

          return <rect key={`${row}-${col}`} x={col * 10} y={row * 10} width="10" height="10" fill="black" />;
        }),
      )}
    </svg>
  );
}

type EventDetailsViewProps = {
  event: AdminEvent;
  onBack: () => void;
};

export default function EventDetailsView({ event, onBack }: EventDetailsViewProps) {
  const [activeTab, setActiveTab] = useState<EventDetailTab>("stats");
  const [surveyMode, setSurveyMode] = useState<SurveyMode>("builder");
  const [copied, setCopied] = useState(false);

  const tabClass = (isActive: boolean) =>
    isActive
      ? "inline-flex items-center rounded-full bg-[#141519] px-6 py-3 text-sm font-medium text-white"
      : "inline-flex items-center rounded-full bg-[#f1f1f1] px-6 py-3 text-sm text-[#2f2f2f]";

  const handleCopy = async () => {
    if (typeof navigator === "undefined" || !navigator.clipboard) {
      return;
    }

    await navigator.clipboard.writeText(EVENT_LINK);
    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 1200);
  };

  return (
    <section className="mt-4">
      <button
        type="button"
        onClick={onBack}
        className="mb-2 inline-flex items-center text-3xl leading-none text-[#4e4e4e]"
        aria-label="Back to events"
      >
        &larr;
      </button>

      <div>
        <h2 className="text-[2.2rem] font-medium leading-tight text-[#222]">{event.name}</h2>
        <p className="mt-1 text-[1.3rem] text-[#666]">{event.dateAndVenue}</p>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setActiveTab("stats")}
          className={tabClass(activeTab === "stats")}
        >
          Event Statistics
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("qr")}
          className={tabClass(activeTab === "qr")}
        >
          QR Code
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab("survey");
            setSurveyMode("builder");
          }}
          className={tabClass(activeTab === "survey")}
        >
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
            <p className="mt-2 text-6xl font-medium leading-none text-[#252525]">1,847</p>
            <span className="mt-8 inline-block rounded-full bg-[#d7f0e6] px-3 py-1 text-xs font-medium text-[#1f8f67]">
              +25 this week
            </span>
          </article>

          <article className="rounded-3xl bg-[#f5f5f5] p-6">
            <p className="text-[1.25rem] text-[#6b6b6b]">QR Code Scans</p>
            <p className="mt-2 text-6xl font-medium leading-none text-[#252525]">2,401</p>
            <span className="mt-8 inline-block rounded-full bg-[#d7f0e6] px-3 py-1 text-xs font-medium text-[#1f8f67]">
              +32 this week
            </span>
          </article>

          <article className="rounded-3xl bg-[#f5f5f5] p-6">
            <p className="text-[1.25rem] text-[#6b6b6b]">Survey Response Rate</p>
            <p className="mt-2 text-6xl font-medium leading-none text-[#252525]">91%</p>
            <span className="mt-8 inline-block rounded-full bg-[#d7f0e6] px-3 py-1 text-xs font-medium text-[#1f8f67]">
              +3% vs last month
            </span>
          </article>
        </div>
      ) : null}

      {activeTab === "qr" ? (
        <div className="mt-6 w-full max-w-140 rounded-3xl bg-[#f5f5f5] p-8">
          <h3 className="text-center text-[2rem] font-medium text-[#232323]">Event QR Code</h3>
          <p className="mt-1 text-center text-sm text-[#6f6f6f]">Share this with participants to start the certificate flow</p>

          <div className="mt-5">
            <QrMock />
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              className="rounded-full bg-[#ff5b2e] px-7 py-3 text-sm font-medium text-white"
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
            {EVENT_LINK}
          </div>
        </div>
      ) : null}

      {activeTab === "survey" ? (
        <section className="mt-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-[2rem] font-medium leading-tight text-[#232323]">Survey</h3>
              <p className="text-sm text-[#6f6f6f]">5 questions - 0 responses - 0% completion rate</p>
            </div>

            <div className="rounded-full bg-[#ececec] p-1 text-sm">
              <button
                type="button"
                onClick={() => setSurveyMode("builder")}
                className={`rounded-full px-5 py-2 text-[#2f2f2f] ${surveyMode === "builder" ? "bg-white" : "bg-transparent"}`}
              >
                Builder
              </button>
              <button
                type="button"
                onClick={() => setSurveyMode("responses")}
                className={`rounded-full px-5 py-2 text-[#2f2f2f] ${surveyMode === "responses" ? "bg-white" : "bg-transparent"}`}
              >
                Responses
              </button>
            </div>
          </div>

          {surveyMode === "builder" ? (
            <>
              <div className="space-y-4">
                <article className="rounded-3xl border border-[#e6e6e6] bg-[#f4f4f4] px-5 py-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="rounded-full bg-[#ffe7e3] px-3 py-1 text-xs font-medium text-[#ff5b2e]">Question 1</span>
                    <span className="text-base text-[#c1c1c1]">🗑</span>
                  </div>
                  <p className="text-[2rem] leading-tight text-[#282828]">How would you rate this event overall?</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <button
                        key={`survey-rating-${index + 1}`}
                        type="button"
                        className="h-10 w-10 rounded-xl border border-[#dfdfdf] bg-[#f8f8f8] text-xl leading-none text-[#f2b04c]"
                        aria-label={`Rate ${index + 1} star`}
                      >
                        ☆
                      </button>
                    ))}
                  </div>
                </article>

                <article className="rounded-3xl border border-[#e6e6e6] bg-[#f4f4f4] px-5 py-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="rounded-full bg-[#ffe7e3] px-3 py-1 text-xs font-medium text-[#ff5b2e]">Question 2</span>
                    <span className="text-base text-[#c1c1c1]">🗑</span>
                  </div>
                  <p className="text-[2rem] leading-tight text-[#282828]">What did you find most valuable about this event?</p>
                  <div className="mt-3 rounded-xl border border-[#dddddd] bg-[#f9f9f9] px-4 py-3 text-sm text-[#a1a1a1]">
                    Participant&apos;s answer...
                  </div>
                </article>

                <article className="rounded-3xl border border-[#e6e6e6] bg-[#f4f4f4] px-5 py-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="rounded-full bg-[#ffe7e3] px-3 py-1 text-xs font-medium text-[#ff5b2e]">Question 3</span>
                    <span className="text-base text-[#c1c1c1]">🗑</span>
                  </div>
                  <p className="text-[2rem] leading-tight text-[#282828]">How did you hear about this event?</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full border border-[#d8d8d8] bg-[#f8f8f8] px-4 py-2 text-xs text-[#7f7f7f]">Social Media</span>
                    <span className="rounded-full border border-[#d8d8d8] bg-[#f8f8f8] px-4 py-2 text-xs text-[#7f7f7f]">Friend</span>
                    <span className="rounded-full border border-[#d8d8d8] bg-[#f8f8f8] px-4 py-2 text-xs text-[#7f7f7f]">Email/Newsletter</span>
                    <span className="rounded-full border border-[#d8d8d8] bg-[#f8f8f8] px-4 py-2 text-xs text-[#7f7f7f]">Others</span>
                  </div>
                </article>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  className="rounded-full border border-[#d9d9d9] bg-[#f7f7f7] px-5 py-2 text-sm text-[#2d2d2d]"
                >
                  + Rating Scale
                </button>
                <button
                  type="button"
                  className="rounded-full border border-[#d9d9d9] bg-[#f7f7f7] px-5 py-2 text-sm text-[#2d2d2d]"
                >
                  + Text Answer
                </button>
                <button
                  type="button"
                  className="rounded-full border border-[#d9d9d9] bg-[#f7f7f7] px-5 py-2 text-sm text-[#2d2d2d]"
                >
                  + Multiple Choice
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                <article className="rounded-2xl bg-[#f5f5f5] p-5">
                  <p className="text-sm text-[#6b6b6b]">Certificates Issued</p>
                  <p className="mt-1 text-5xl font-medium leading-none text-[#252525]">130</p>
                  <span className="mt-5 inline-block rounded-full bg-[#d7f0e6] px-3 py-1 text-xs font-medium text-[#1f8f67]">
                    +25 this week
                  </span>
                </article>
                <article className="rounded-2xl bg-[#f5f5f5] p-5">
                  <p className="text-sm text-[#6b6b6b]">QR Code Scans</p>
                  <p className="mt-1 text-5xl font-medium leading-none text-[#252525]">141</p>
                  <span className="mt-5 inline-block rounded-full bg-[#d7f0e6] px-3 py-1 text-xs font-medium text-[#1f8f67]">
                    +32 this week
                  </span>
                </article>
                <article className="rounded-2xl bg-[#f5f5f5] p-5">
                  <p className="text-sm text-[#6b6b6b]">Survey Response Rate</p>
                  <p className="mt-1 text-5xl font-medium leading-none text-[#252525]">85%</p>
                  <span className="mt-5 inline-block rounded-full bg-[#d7f0e6] px-3 py-1 text-xs font-medium text-[#1f8f67]">
                    +3% today
                  </span>
                </article>
              </div>

              <div className="space-y-4">
                <article className="rounded-3xl border border-[#e6e6e6] bg-[#f4f4f4] px-5 py-4">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="rounded-full bg-[#ffe7e3] px-3 py-1 text-xs font-medium text-[#ff5b2e]">Question 1</span>
                    <span className="text-xs text-[#ff7b64]">130 responses</span>
                  </div>
                  <p className="text-[1.95rem] leading-tight text-[#282828]">How would you rate this event overall?</p>
                  <div className="mt-3 flex items-center gap-2 text-[#f2b04c]">
                    <span className="text-3xl">★ ★ ★ ★ ★</span>
                    <span className="text-xl font-medium">5.0</span>
                  </div>
                </article>

                <article className="rounded-3xl border border-[#e6e6e6] bg-[#f4f4f4] px-5 py-4">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="rounded-full bg-[#ffe7e3] px-3 py-1 text-xs font-medium text-[#ff5b2e]">Question 2</span>
                    <span className="text-xs text-[#ff7b64]">130 responses</span>
                  </div>
                  <p className="text-[1.95rem] leading-tight text-[#282828]">What did you find most valuable about this event?</p>

                  <div className="mt-3 space-y-2">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <div key={`resp-${index + 1}`} className="rounded-xl border border-[#dddddd] bg-[#f9f9f9] px-4 py-3">
                        <div className="mb-1 flex items-center justify-between">
                          <p className="text-sm font-medium text-[#2f2f2f]">Maria Santons</p>
                          <p className="text-xs text-[#8d8d8d]">12:22 PM</p>
                        </div>
                        <p className="text-xs text-[#8a8a8a]">
                          The hands-on workshop sessions were incredibly valuable. I especially loved the live
                          prototyping exercise - it made everything click.
                        </p>
                      </div>
                    ))}
                  </div>
                </article>

                <article className="rounded-3xl border border-[#e6e6e6] bg-[#f4f4f4] px-5 py-4">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="rounded-full bg-[#ffe7e3] px-3 py-1 text-xs font-medium text-[#ff5b2e]">Question 3</span>
                    <span className="text-xs text-[#ff7b64]">130 responses</span>
                  </div>
                  <p className="text-[1.95rem] leading-tight text-[#282828]">How did you hear about this event?</p>

                  <div className="mt-4 space-y-4">
                    <div>
                      <div className="mb-1 flex items-center justify-between text-sm text-[#4a4a4a]">
                        <span>Social Media</span>
                        <span>100 - 50%</span>
                      </div>
                      <div className="h-4 rounded-full bg-[#ededed]">
                        <div className="h-4 w-1/2 rounded-full bg-[#1ea573]" />
                      </div>
                    </div>

                    <div>
                      <div className="mb-1 flex items-center justify-between text-sm text-[#4a4a4a]">
                        <span>Friend</span>
                        <span>100 - 50%</span>
                      </div>
                      <div className="h-4 rounded-full bg-[#ededed]">
                        <div className="h-4 w-1/2 rounded-full bg-[#2a67ce]" />
                      </div>
                    </div>

                    <div>
                      <div className="mb-1 flex items-center justify-between text-sm text-[#4a4a4a]">
                        <span>Email/Newsletter</span>
                        <span>100 - 50%</span>
                      </div>
                      <div className="h-4 rounded-full bg-[#ededed]">
                        <div className="h-4 w-1/2 rounded-full bg-[#e6902f]" />
                      </div>
                    </div>
                  </div>
                </article>
              </div>
            </>
          )}
        </section>
      ) : null}

      {activeTab === "participants" ? (
        <section className="mt-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-[2rem] font-medium leading-tight text-[#232323]">Participants</h3>
              <p className="text-sm text-[#6f6f6f]">150 registered - 100 certificates downloaded</p>
            </div>

            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full bg-[#ececec] px-6 py-3 text-sm font-medium text-[#2f2f2f]"
            >
              Export
            </button>
          </div>

          <div className="overflow-hidden rounded-3xl border border-[#e2e2e2] bg-[#f2f2f2]">
            <div className="grid grid-cols-[1.1fr_1.1fr_0.9fr_0.9fr_0.9fr] border-b border-[#e0e0e0] px-6 py-4 text-sm uppercase tracking-wide text-[#6b6b6b]">
              <p>Name</p>
              <p>Email</p>
              <p>Certificate</p>
              <p>Scanned at</p>
              <p>Actions</p>
            </div>

            {Array.from({ length: 6 }).map((_, index) => (
              <article
                key={`participant-${index + 1}`}
                className="grid grid-cols-[1.1fr_1.1fr_0.9fr_0.9fr_0.9fr] items-center border-b border-[#e6e6e6] px-6 py-3 last:border-b-0"
              >
                <div>
                  <p className="text-[1.6rem] leading-tight text-[#252525]">Juan Dela Cruz</p>
                  <p className="mt-1 text-sm text-[#7a7a7a]">CITCS</p>
                </div>

                <p className="text-[1.4rem] text-[#676767]">jdc02@email.com</p>

                <div>
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#cfeadf] text-base font-bold text-[#1c9168]">
                    v
                  </span>
                </div>

                <p className="text-[1.35rem] text-[#676767]">03/20/26, 10:00AM</p>

                <div>
                  <button
                    type="button"
                    className="rounded-full bg-[#ffe9e4] px-4 py-1.5 text-sm font-medium text-[#ff5b2e]"
                  >
                    Download
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </section>
  );
}
