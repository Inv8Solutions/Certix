"use client";

import { useState } from "react";

const surveyQuestions = [
  {
    id: "rating",
    type: "rating",
    prompt: "How would you rate this event?*",
    max: 5,
  },
  {
    id: "recommendation",
    type: "single-choice",
    prompt: "Would you recommend this event?*",
    options: ["Yes", "No", "Maybe"],
  },
] as const;

export default function ParticipantLanding() {
  const event = {
    logo: "inv8",
    name: "Technopreneurship Demo Day 7",
    date: "April 7, 2026",
    location: "UC Theater",
    poweredBy: "Inv8 Studio",
  };

  const [flowStep, setFlowStep] = useState<"intro" | "details" | "survey" | "ready">("intro");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleSurveySubmit = () => {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    window.setTimeout(() => {
      setFlowStep("ready");
      setIsSubmitting(false);
    }, 1400);
  };

  if (flowStep === "ready") {
    const handleDownloadCertificate = () => {
      if (isDownloading) {
        return;
      }

      setIsDownloading(true);

      window.setTimeout(() => {
        setIsDownloading(false);
      }, 1600);
    };

    return (
      <div className="min-h-screen bg-[#f8f8f8]">
        <section className="w-full bg-gradient-to-b from-[#ff5b2e] to-[#d64820] px-6 py-8 text-center">
          <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-md bg-white">
            <span className="text-lg font-bold text-[#ff5b2e]">8</span>
          </div>
          <h1 className="text-3xl font-bold text-white">{event.logo}</h1>
          <p className="mt-1 text-sm font-medium text-white opacity-90">studio</p>

          <div className="mt-8">
            <h2 className="text-2xl font-semibold text-white">{event.name}</h2>
            <p className="mt-2 text-sm text-white opacity-90">
              {event.date} • {event.location}
            </p>
          </div>
        </section>

        <section className="mx-auto w-full max-w-md px-4 py-6 sm:px-6">
          <div className="rounded-[1.75rem] bg-white px-5 py-8 text-center shadow-[0_8px_30px_rgba(0,0,0,0.04)] ring-1 ring-black/5 sm:px-6">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-[#ff5b2e] text-5xl font-light text-white">
              ✓
            </div>

            <h3 className="mt-6 text-[1.55rem] font-medium leading-tight text-[#222]">Your Certificate is Ready!</h3>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#9a9a9a]">
              Congratulations! Your certificate has been generated and sent to your email.
            </p>

            <div className="mt-6 overflow-hidden rounded-[1.5rem] bg-white shadow-[0_8px_30px_rgba(0,0,0,0.08)] ring-1 ring-black/5">
              <div className="relative aspect-[4/3] bg-[linear-gradient(135deg,#f8fbf9_0%,#eef7f3_45%,#fdfdfd_100%)] px-4 py-4">
                <div className="absolute left-0 top-0 h-12 w-12 border-l-[12px] border-t-[12px] border-[#2e8b57]" />
                <div className="absolute right-0 top-0 h-12 w-12 border-r-[12px] border-t-[12px] border-[#0f766e]" />
                <div className="absolute bottom-0 left-0 h-12 w-12 border-b-[12px] border-l-[12px] border-[#0b2942]" />
                <div className="absolute bottom-0 right-0 h-12 w-12 border-b-[12px] border-r-[12px] border-[#2e8b57]" />

                <div className="flex h-full items-center justify-center">
                  <div className="max-w-[92%] rounded-2xl border border-[#d9e5de] bg-white/75 px-4 py-5 text-center">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#2d6a4f]">Certificate Preview</p>
                    <h4 className="mt-2 text-2xl font-semibold tracking-wide text-[#285f47]">CERTIFICATE</h4>
                    <p className="mt-1 text-xs text-[#5f7f70]">OF RECOGNITION</p>
                    <div className="mx-auto mt-4 h-px w-4/5 bg-[#c7d8cf]" />
                    <p className="mt-4 text-[10px] leading-4 text-[#547063]">
                      This preview reflects the certificate that will be generated after submission.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDownloadCertificate}
              disabled={isDownloading}
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
        </section>

        <div className="border-t border-[#e5e5e5] px-6 py-6 text-center">
          <p className="text-xs text-[#9a9a9a]">
            Powered by <span className="font-medium text-[#ff5b2e]">{event.poweredBy}</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f8f8]">
      <section className="w-full bg-gradient-to-b from-[#ff5b2e] to-[#d64820] px-6 py-8 text-center">
        <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-md bg-white">
          <span className="text-lg font-bold text-[#ff5b2e]">8</span>
        </div>
        <h1 className="text-3xl font-bold text-white">{event.logo}</h1>
        <p className="mt-1 text-sm font-medium text-white opacity-90">studio</p>

        <div className="mt-8">
          <h2 className="text-2xl font-semibold text-white">{event.name}</h2>
          <p className="mt-2 text-sm text-white opacity-90">
            {event.date} • {event.location}
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-md px-4 py-6 sm:px-6">
        {flowStep === "intro" ? (
          <div className="rounded-3xl bg-white px-5 py-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] ring-1 ring-black/5 sm:px-6 sm:py-7">
            <div className="mb-5 flex items-center gap-2">
              <span className="text-2xl">🎓</span>
              <h3 className="text-lg font-semibold text-[#252525]">Get Your Certificate</h3>
            </div>

            <p className="mb-6 text-sm leading-6 text-[#6e6e6e]">
              Thank you for attending! Fill out a short form and answer our quick survey to receive your certificate of participation.
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
                <p className="mt-2 text-sm leading-6 text-[#6e6e6e]">
                  Use the same details you want printed on your certificate.
                </p>
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
                  placeholder="Juan Dela Cruz"
                  className="w-full rounded-2xl border border-[#e4e4e4] bg-[#fbfbfb] px-4 py-3 text-sm text-[#222] outline-none placeholder:text-[#adadad] focus:border-[#ff5b2e]"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[#2a2a2a]">Email Address</span>
                <input
                  type="email"
                  placeholder="name@email.com"
                  className="w-full rounded-2xl border border-[#e4e4e4] bg-[#fbfbfb] px-4 py-3 text-sm text-[#222] outline-none placeholder:text-[#adadad] focus:border-[#ff5b2e]"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[#2a2a2a]">School / Organization</span>
                <input
                  type="text"
                  placeholder="University / Company"
                  className="w-full rounded-2xl border border-[#e4e4e4] bg-[#fbfbfb] px-4 py-3 text-sm text-[#222] outline-none placeholder:text-[#adadad] focus:border-[#ff5b2e]"
                />
              </label>
            </div>

            <div className="mt-6 rounded-3xl bg-[#fff7f4] px-4 py-4">
              <p className="text-sm font-semibold text-[#2a2a2a]">Quick survey</p>
              <p className="mt-1 text-xs leading-5 text-[#7a7a7a]">
                This helps us improve future events and certificate delivery.
              </p>

              <div className="mt-4 space-y-3">
                <div>
                  <p className="mb-2 text-sm text-[#2a2a2a]">How would you rate the event?</p>
                  <div className="flex gap-2">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <button
                        key={`rating-${index + 1}`}
                        type="button"
                        className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#eadfdc] bg-white text-lg leading-none text-[#f2b04c]"
                        aria-label={`Rate ${index + 1} star`}
                      >
                        ☆
                      </button>
                    ))}
                  </div>
                </div>

                <label className="block">
                  <span className="mb-2 block text-sm text-[#2a2a2a]">What did you find most valuable?</span>
                  <textarea
                    rows={4}
                    placeholder="Share a quick thought..."
                    className="w-full resize-none rounded-2xl border border-[#e4e4e4] bg-[#fbfbfb] px-4 py-3 text-sm text-[#222] outline-none placeholder:text-[#adadad] focus:border-[#ff5b2e]"
                  />
                </label>
              </div>
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
        ) : (
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
              <p className="mt-2 text-sm text-[#9a9a9a]">2 questions. Unlocks your certificate</p>
            </div>

            <div className="mt-6 space-y-4">
              {surveyQuestions.map((question) => {
                if (question.type === "rating") {
                  return (
                    <section key={question.id} className="rounded-2xl border border-[#dedede] bg-[#fafafa] px-4 py-4">
                      <p className="text-sm text-[#222]">{question.prompt}</p>
                      <div className="mt-3 flex gap-2">
                        {Array.from({ length: question.max }).map((_, index) => (
                          <button
                            key={`${question.id}-${index + 1}`}
                            type="button"
                            aria-label={`Rate ${index + 1} star`}
                            className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#dcdcdc] bg-white text-2xl text-[#ffb34d] shadow-[0_1px_0_rgba(0,0,0,0.02)]"
                          >
                            ☆
                          </button>
                        ))}
                      </div>
                    </section>
                  );
                }

                return (
                  <section key={question.id} className="rounded-2xl border border-[#dedede] bg-[#fafafa] px-4 py-4">
                    <p className="text-sm text-[#222]">{question.prompt}</p>
                    <div className="mt-3 space-y-3">
                      {question.options.map((option) => (
                        <button
                          key={`${question.id}-${option}`}
                          type="button"
                          className="flex w-full items-center gap-3 rounded-xl border border-[#dcdcdc] bg-white px-4 py-3 text-left text-sm text-[#2f2f2f]"
                        >
                          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-[#3d3d3d] text-[10px] leading-none text-transparent">
                            •
                          </span>
                          {option}
                        </button>
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>

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
        )}
      </section>

      <div className="border-t border-[#e5e5e5] px-6 py-6 text-center">
        <p className="text-xs text-[#9a9a9a]">
          Powered by <span className="font-medium text-[#ff5b2e]">{event.poweredBy}</span>
        </p>
      </div>
    </div>
  );
}
