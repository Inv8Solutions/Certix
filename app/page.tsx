"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

import AdminHeader from "./components/admin/AdminHeader";
import { allEvents, builderSteps, stats } from "./components/admin/data";
import DashboardView from "./components/admin/DashboardView";
import type { AdminEvent, AdminView, EventForm } from "./components/admin/types";

const EventsView = dynamic(() => import("./components/admin/EventsView"), {
  loading: () => <section className="mt-14 rounded-3xl bg-[#f2f2f2] p-8 text-[#7b7b7b]">Loading events...</section>,
});

const BuilderView = dynamic(() => import("./components/admin/BuilderView"), {
  loading: () => <section className="rounded-3xl bg-[#f1f1f1] p-8 text-[#7b7b7b]">Loading builder...</section>,
});

const EventDetailsView = dynamic(() => import("./components/admin/EventDetailsView"), {
  loading: () => <section className="mt-4 rounded-3xl bg-[#f2f2f2] p-8 text-[#7b7b7b]">Loading event details...</section>,
});

const SettingsView = dynamic(() => import("./components/admin/SettingsView"), {
  loading: () => <section className="rounded-3xl bg-[#f1f1f1] p-8 text-[#7b7b7b]">Loading settings...</section>,
});

export default function Home() {
  const [activeView, setActiveView] = useState<AdminView>("dashboard");
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<EventForm>({
    name: "",
    date: "",
    description: "",
  });
  const [selectedTemplateName, setSelectedTemplateName] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<AdminEvent | null>(null);

  const handleOpenBuilder = () => {
    setActiveView("builder");
    setCurrentStep(1);
  };

  const handleContinue = () => {
    if (currentStep === 4) {
      setActiveView("dashboard");
      setCurrentStep(1);
      return;
    }

    setCurrentStep((step) => step + 1);
  };

  const handleTemplateUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setSelectedTemplateName(file.name);
  };

  return (
    <main className="min-h-screen bg-[#ececec] px-6 py-10 text-[#202020] md:px-10">
      <div className="mx-auto w-full max-w-6xl">
        <AdminHeader
          activeView={activeView}
          onDashboard={() => setActiveView("dashboard")}
          onEvents={() => {
            setActiveView("events");
            setSelectedEvent(null);
          }}
          onSettings={() => setActiveView("settings")}
          onAddEvent={handleOpenBuilder}
        />

        {activeView === "dashboard" ? (
          <DashboardView stats={stats} onOpenBuilder={handleOpenBuilder} />
        ) : null}

        {activeView === "events" && selectedEvent === null ? (
          <EventsView
            events={allEvents}
            onSelectEvent={(event) => {
              setSelectedEvent(event);
            }}
          />
        ) : null}

        {activeView === "events" && selectedEvent !== null ? (
          <EventDetailsView event={selectedEvent} onBack={() => setSelectedEvent(null)} />
        ) : null}

        {activeView === "builder" ? (
          <BuilderView
            currentStep={currentStep}
            steps={builderSteps}
            formData={formData}
            selectedTemplateName={selectedTemplateName}
            onNameChange={(value) => setFormData((prev) => ({ ...prev, name: value }))}
            onDateChange={(value) => setFormData((prev) => ({ ...prev, date: value }))}
            onDescriptionChange={(value) => setFormData((prev) => ({ ...prev, description: value }))}
            onTemplateUpload={handleTemplateUpload}
            onContinue={handleContinue}
          />
        ) : null}

        {activeView === "settings" ? (
          <SettingsView />
        ) : null}
      </div>
    </main>
  );
}
