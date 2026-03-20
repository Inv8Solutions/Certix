import type { ChangeEvent } from "react";

import type { EventForm, StepItem } from "./types";

type BuilderViewProps = {
  currentStep: number;
  steps: StepItem[];
  formData: EventForm;
  selectedTemplateName: string;
  onNameChange: (value: string) => void;
  onDateChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onTemplateUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  onContinue: () => void;
};

export default function BuilderView({
  currentStep,
  steps,
  formData,
  selectedTemplateName,
  onNameChange,
  onDateChange,
  onDescriptionChange,
  onTemplateUpload,
  onContinue,
}: BuilderViewProps) {
  return (
    <>
      <section className="mb-4 rounded-2xl bg-[#f1f1f1] px-3 py-3 sm:px-5">
        <ol className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((item, index) => {
            const stepNumber = index + 1;
            const isActive = stepNumber <= currentStep;

            return (
              <li key={item.title} className="flex items-center gap-3 rounded-xl px-3 py-2">
                <span
                  className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                    isActive ? "bg-[#ff5b2e] text-white" : "bg-[#e5e5e5] text-[#666]"
                  }`}
                >
                  {stepNumber}
                </span>
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-[#8a8a8a]">{item.step}</p>
                  <p className="text-sm text-[#2a2a2a]">{item.title}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="rounded-2xl bg-[#f1f1f1] px-4 py-6 sm:px-8 sm:py-7">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-semibold text-[#252525]">
              {currentStep === 1
                ? "Event Details"
                : currentStep === 2
                  ? "Certificate Template"
                  : currentStep === 3
                    ? "Field Mapping"
                    : "Survey Builder"}
            </h2>
            <p className="mt-1 text-sm text-[#6e6e6e]">
              {currentStep === 1
                ? "Basic information about your event."
                : currentStep === 2
                  ? "Upload your certificate design. PNG, JPG, or PDF supported."
                  : currentStep === 3
                    ? "Define what info to collect and where it appears on the certificate."
                    : "Collect feedback from participants"}
            </p>
          </div>
          <button
            type="button"
            onClick={onContinue}
            className="inline-flex items-center gap-2 rounded-full bg-[#15161b] px-7 py-3 text-sm font-medium text-white"
          >
            {currentStep === 4 ? "Create Event" : "Continue"}
            <span aria-hidden="true" className="text-base leading-none">
              -&gt;
            </span>
          </button>
        </div>

        {currentStep === 1 ? (
          <form className="space-y-4" onSubmit={(event) => event.preventDefault()}>
            <div>
              <label htmlFor="event-name" className="mb-2 block text-sm font-medium text-[#2a2a2a]">
                Event Name*
              </label>
              <input
                id="event-name"
                type="text"
                value={formData.name}
                onChange={(event) => onNameChange(event.target.value)}
                placeholder="e.g., Business Development Seminar 2026"
                className="w-full rounded-xl border border-[#dfdfdf] bg-transparent px-4 py-3 text-sm outline-none placeholder:text-[#b0b0b0] focus:border-[#c8c8c8]"
              />
            </div>

            <div>
              <label htmlFor="event-date" className="mb-2 block text-sm font-medium text-[#2a2a2a]">
                Event Date*
              </label>
              <input
                id="event-date"
                type="text"
                value={formData.date}
                onChange={(event) => onDateChange(event.target.value)}
                placeholder="mm/dd/yyyy"
                className="w-full rounded-xl border border-[#dfdfdf] bg-transparent px-4 py-3 text-sm outline-none placeholder:text-[#b0b0b0] focus:border-[#c8c8c8]"
              />
            </div>

            <div>
              <label htmlFor="event-description" className="mb-2 block text-sm font-medium text-[#2a2a2a]">
                Description (This will be shown on the participant landing page.)
              </label>
              <textarea
                id="event-description"
                rows={3}
                value={formData.description}
                onChange={(event) => onDescriptionChange(event.target.value)}
                placeholder="Briefly describe what this event is about..."
                className="w-full resize-none rounded-xl border border-[#dfdfdf] bg-transparent px-4 py-3 text-sm outline-none placeholder:text-[#b0b0b0] focus:border-[#c8c8c8]"
              />
            </div>
          </form>
        ) : currentStep === 2 ? (
          <div>
            <label
              htmlFor="certificate-template"
              className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-[#cdcdcd] px-6 py-12 text-center"
            >
              <span className="mb-3 text-4xl leading-none text-[#a2a9b7]">^</span>
              <p className="mb-3 text-base text-[#565d6a]">Upload your certificate template</p>
              <span className="rounded-md bg-[#2f77d8] px-5 py-2 text-sm text-white">Choose File</span>
              <span className="mt-3 text-xs text-[#8b94a3]">Supports: JPG, PNG, PDF</span>
              {selectedTemplateName ? <span className="mt-3 text-xs text-[#2f77d8]">{selectedTemplateName}</span> : null}
            </label>
            <input id="certificate-template" type="file" onChange={onTemplateUpload} className="sr-only" />
          </div>
        ) : currentStep === 3 ? (
          <section className="grid grid-cols-1 gap-6 lg:grid-cols-[250px_1fr]">
            <div>
              <p className="mb-3 text-xs font-medium uppercase tracking-wide text-[#989898]">Fields</p>
              <div className="rounded-xl border border-[#e2e2e2] bg-[#f6f6f6] px-4 py-3">
                <div className="flex items-start gap-3">
                  <span className="mt-1 text-xs text-[#b8b8b8]">:::</span>
                  <div>
                    <p className="text-sm font-medium text-[#2d2d2d]">Participant Name</p>
                    <p className="text-xs text-[#9a9a9a]">name * Required</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <p className="mb-3 text-xs font-medium uppercase tracking-wide text-[#989898]">Certificate Preview</p>
              <div className="overflow-hidden rounded-2xl border border-[#d4d4d4] bg-[linear-gradient(145deg,#f2f2f2,#e8e8e8)]">
                <div className="relative min-h-85 px-6 py-8 sm:px-8 sm:py-10">
                  <div className="absolute -left-8 -top-10 h-28 w-32 rotate-[-18deg] bg-[#2b8f73]/25" />
                  <div className="absolute -right-8 -top-8 h-24 w-36 rotate-12 bg-[#126f79]/35" />
                  <div className="absolute -bottom-10 -left-8 h-24 w-36 rotate-14 bg-[#14546f]/35" />
                  <div className="absolute -bottom-8 -right-8 h-24 w-40 -rotate-12 bg-[#1f8f63]/30" />

                  <div className="relative mx-auto max-w-xl text-center">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#2f7d69]">Certificate</p>
                    <h3 className="mt-2 text-4xl font-semibold tracking-wide text-[#1f5f4c] sm:text-5xl">OF RECOGNITION</h3>
                    <p className="mt-4 text-xs text-[#608072]">This Certificate is Proudly Presented to</p>

                    <div className="mx-auto mt-4 max-w-sm rounded-lg border border-[#9aa8a2] bg-white/70 px-4 py-2 text-sm text-[#3f4a45]">
                      Participant Name
                    </div>

                    <p className="mx-auto mt-5 max-w-2xl text-xs leading-5 text-[#3d5d51]">
                      for outstanding achievement and impact during the event, with excellent collaboration,
                      innovation, and commitment.
                    </p>

                    <div className="mt-10 grid grid-cols-2 gap-6 text-left text-[10px] text-[#33584f]">
                      <div>
                        <div className="mb-1 h-px w-full bg-[#89a99c]" />
                        <p className="font-semibold uppercase">Dr. Helena D. Palaog</p>
                        <p>Director, Innovation Office</p>
                      </div>
                      <div>
                        <div className="mb-1 h-px w-full bg-[#89a99c]" />
                        <p className="font-semibold uppercase">Dr. Arie M. Pumecha</p>
                        <p>VP for Research and Innovation</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <p className="mt-3 text-center text-xs text-[#b1b1b1]">Click a field to select - drag to reposition</p>
              {selectedTemplateName ? (
                <p className="mt-2 text-center text-xs text-[#3e78d6]">Template: {selectedTemplateName}</p>
              ) : null}
            </div>
          </section>
        ) : (
          <section>
            <div className="space-y-4">
              <article className="rounded-2xl border border-[#e6e6e6] bg-[#f4f4f4] px-4 py-4 sm:px-5">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="rounded-full bg-[#ffe7e3] px-3 py-1 text-xs font-medium text-[#ff5b2e]">Question 1</span>
                  <span className="text-sm text-[#c1c1c1]">🗑</span>
                </div>
                <p className="text-[1.35rem] text-[#282828]">How would you rate this event overall?</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <button
                      key={`rating-${index + 1}`}
                      type="button"
                      className="h-9 w-9 rounded-xl border border-[#dfdfdf] bg-[#f8f8f8] text-lg leading-none text-[#f2b04c]"
                      aria-label={`Rate ${index + 1} star`}
                    >
                      ☆
                    </button>
                  ))}
                </div>
              </article>

              <article className="rounded-2xl border border-[#e6e6e6] bg-[#f4f4f4] px-4 py-4 sm:px-5">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="rounded-full bg-[#ffe7e3] px-3 py-1 text-xs font-medium text-[#ff5b2e]">Question 2</span>
                  <span className="text-sm text-[#c1c1c1]">🗑</span>
                </div>
                <p className="text-[1.35rem] text-[#282828]">What did you find most valuable about this event?</p>
                <div className="mt-3 rounded-xl border border-[#dddddd] bg-[#f9f9f9] px-4 py-3 text-sm text-[#a1a1a1]">
                  Participant&apos;s answer...
                </div>
              </article>

              <article className="rounded-2xl border border-[#e6e6e6] bg-[#f4f4f4] px-4 py-4 sm:px-5">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="rounded-full bg-[#ffe7e3] px-3 py-1 text-xs font-medium text-[#ff5b2e]">Question 3</span>
                  <span className="text-sm text-[#c1c1c1]">🗑</span>
                </div>
                <p className="text-[1.35rem] text-[#282828]">How did you hear about this event?</p>
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
          </section>
        )}
      </section>
    </>
  );
}
