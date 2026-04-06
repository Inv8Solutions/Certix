import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, PointerEvent as ReactPointerEvent } from "react";

import type { CertificateNameField, EventForm, StepItem, SurveyQuestion, SurveyQuestionType } from "./types";

type BuilderViewProps = {
  currentStep: number;
  steps: StepItem[];
  formData: EventForm;
  selectedTemplateName: string;
  selectedTemplatePreviewUrl: string | null;
  nameField: CertificateNameField;
  surveyQuestions: SurveyQuestion[];
  onNameChange: (value: string) => void;
  onDateChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onTemplateUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  onAddQuestion: (type: SurveyQuestionType) => void;
  onRemoveQuestion: (questionId: string) => void;
  onQuestionPromptChange: (questionId: string, prompt: string) => void;
  onQuestionOptionChange: (questionId: string, optionIndex: number, value: string) => void;
  onAddOption: (questionId: string) => void;
  onNameFieldChange: (next: CertificateNameField) => void;
  isCreatingEvent: boolean;
  onContinue: () => void;
};

export default function BuilderView({
  currentStep,
  steps,
  formData,
  selectedTemplateName,
  selectedTemplatePreviewUrl,
  nameField,
  surveyQuestions,
  onNameChange,
  onDateChange,
  onDescriptionChange,
  onTemplateUpload,
  onAddQuestion,
  onRemoveQuestion,
  onQuestionPromptChange,
  onQuestionOptionChange,
  onAddOption,
  onNameFieldChange,
  isCreatingEvent,
  onContinue,
}: BuilderViewProps) {
  const previewRef = useRef<HTMLDivElement>(null);
  const [isDraggingName, setIsDraggingName] = useState(false);

  useEffect(() => {
    if (!isDraggingName) {
      return;
    }

    const handlePointerMove = (event: PointerEvent) => {
      const preview = previewRef.current;

      if (!preview) {
        return;
      }

      const rect = preview.getBoundingClientRect();
      const relativeX = ((event.clientX - rect.left) / rect.width) * 100;
      const relativeY = ((event.clientY - rect.top) / rect.height) * 100;

      const clampedX = Math.min(92, Math.max(8, relativeX));
      const clampedY = Math.min(92, Math.max(8, relativeY));

      onNameFieldChange({ ...nameField, x: clampedX, y: clampedY });
    };

    const handlePointerUp = () => {
      setIsDraggingName(false);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [isDraggingName, nameField, onNameFieldChange]);

  const handleNamePointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setIsDraggingName(true);
  };

  const handleNameWheel = (event: React.WheelEvent<HTMLButtonElement>) => {
    const direction = Math.sign(event.deltaY);

    if (direction === 0) {
      return;
    }

    const next = direction < 0 ? nameField.fontSize + 1 : nameField.fontSize - 1;
    onNameFieldChange({
      ...nameField,
      fontSize: Math.max(12, Math.min(96, next)),
    });
  };

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
            disabled={isCreatingEvent}
            className="inline-flex items-center gap-2 rounded-full bg-[#15161b] px-7 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-70"
          >
            {currentStep === 4 ? (isCreatingEvent ? "Creating..." : "Create Event") : "Continue"}
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
              <div
                ref={previewRef}
                className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-[#d4d4d4] bg-[linear-gradient(145deg,#f2f2f2,#e8e8e8)]"
              >
                {selectedTemplatePreviewUrl ? (
                  <img
                    src={selectedTemplatePreviewUrl}
                    alt="Certificate template preview"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  <>
                    <div className="absolute -left-8 -top-10 h-28 w-32 rotate-[-18deg] bg-[#2b8f73]/25" />
                    <div className="absolute -right-8 -top-8 h-24 w-36 rotate-12 bg-[#126f79]/35" />
                    <div className="absolute -bottom-10 -left-8 h-24 w-36 rotate-14 bg-[#14546f]/35" />
                    <div className="absolute -bottom-8 -right-8 h-24 w-40 -rotate-12 bg-[#1f8f63]/30" />

                    <div className="absolute inset-0 px-6 py-6 text-center sm:px-8 sm:py-8">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#2f7d69]">Certificate</p>
                      <h3 className="mt-2 text-3xl font-semibold tracking-wide text-[#1f5f4c] sm:text-4xl">OF RECOGNITION</h3>
                      <p className="mt-3 text-xs text-[#608072]">This Certificate is Proudly Presented to</p>
                    </div>
                  </>
                )}

                <button
                  type="button"
                  onPointerDown={handleNamePointerDown}
                  onWheel={handleNameWheel}
                  className={`absolute z-20 -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-lg border px-4 py-2 font-medium shadow-sm active:cursor-grabbing ${
                    isDraggingName
                      ? "border-[#ff5b2e] bg-[#fff2ed] text-[#ff5b2e]"
                      : "border-[#9aa8a2] bg-white/85 text-[#3f4a45]"
                  }`}
                  style={{
                    left: `${nameField.x}%`,
                    top: `${nameField.y}%`,
                    fontSize: `${nameField.fontSize}px`,
                    lineHeight: 1,
                  }}
                >
                  {formData.name || "Participant Name"}
                </button>

                <div className="pointer-events-none absolute bottom-3 right-3 rounded-md bg-black/55 px-2 py-1 text-[10px] text-white">
                  Drag to reposition
                </div>
                <div className="pointer-events-none absolute bottom-3 left-3 rounded-md bg-black/55 px-2 py-1 text-[10px] text-white">
                  Scroll to resize ({nameField.fontSize}px)
                </div>
              </div>
              <p className="mt-3 text-center text-xs text-[#b1b1b1]">Drag the name field to place it on your certificate.</p>
              {selectedTemplateName ? (
                <p className="mt-2 text-center text-xs text-[#3e78d6]">Template: {selectedTemplateName}</p>
              ) : null}
            </div>
          </section>
        ) : (
          <section>
            {surveyQuestions.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#d7d7d7] bg-[#f7f7f7] px-5 py-8 text-center text-sm text-[#7f7f7f]">
                No survey questions yet. Add your first question below.
              </div>
            ) : (
              <div className="space-y-4">
                {surveyQuestions.map((question, index) => (
                  <article key={question.id} className="rounded-2xl border border-[#e6e6e6] bg-[#f4f4f4] px-4 py-4 sm:px-5">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <span className="rounded-full bg-[#ffe7e3] px-3 py-1 text-xs font-medium text-[#ff5b2e]">
                        Question {index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => onRemoveQuestion(question.id)}
                        className="rounded-full bg-[#f1dcd7] px-3 py-1 text-xs text-[#8b4a3a]"
                      >
                        Remove
                      </button>
                    </div>

                    <input
                      type="text"
                      value={question.prompt}
                      onChange={(event) => onQuestionPromptChange(question.id, event.target.value)}
                      placeholder="Write your question"
                      className="w-full rounded-xl border border-[#dddddd] bg-[#f9f9f9] px-4 py-3 text-sm text-[#2a2a2a] outline-none placeholder:text-[#a1a1a1]"
                    />

                    {question.type === "rating" ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {Array.from({ length: question.scaleMax || 5 }).map((_, ratingIndex) => (
                          <span
                            key={`${question.id}-rating-${ratingIndex + 1}`}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#dfdfdf] bg-[#f8f8f8] text-lg leading-none text-[#f2b04c]"
                          >
                            ☆
                          </span>
                        ))}
                      </div>
                    ) : null}

                    {question.type === "text" ? (
                      <div className="mt-3 rounded-xl border border-[#dddddd] bg-[#f9f9f9] px-4 py-3 text-sm text-[#a1a1a1]">
                        Participant&apos;s answer...
                      </div>
                    ) : null}

                    {question.type === "multiple_choice" ? (
                      <div className="mt-3 space-y-2">
                        {(question.options || []).map((option, optionIndex) => (
                          <input
                            key={`${question.id}-option-${optionIndex}`}
                            type="text"
                            value={option}
                            onChange={(event) => onQuestionOptionChange(question.id, optionIndex, event.target.value)}
                            className="w-full rounded-lg border border-[#dddddd] bg-[#f9f9f9] px-3 py-2 text-sm text-[#2d2d2d] outline-none"
                          />
                        ))}
                        <button
                          type="button"
                          onClick={() => onAddOption(question.id)}
                          className="rounded-full border border-[#d9d9d9] bg-[#f7f7f7] px-4 py-1.5 text-xs text-[#2d2d2d]"
                        >
                          + Add Option
                        </button>
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
            )}

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => onAddQuestion("rating")}
                className="rounded-full border border-[#d9d9d9] bg-[#f7f7f7] px-5 py-2 text-sm text-[#2d2d2d]"
              >
                + Rating Scale
              </button>
              <button
                type="button"
                onClick={() => onAddQuestion("text")}
                className="rounded-full border border-[#d9d9d9] bg-[#f7f7f7] px-5 py-2 text-sm text-[#2d2d2d]"
              >
                + Text Answer
              </button>
              <button
                type="button"
                onClick={() => onAddQuestion("multiple_choice")}
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
