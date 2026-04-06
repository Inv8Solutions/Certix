import type { AdminSettings } from "./types";

type SettingsViewProps = {
  settings: AdminSettings | null;
};

export default function SettingsView({ settings }: SettingsViewProps) {
  if (!settings) {
    return (
      <section className="rounded-2xl bg-[#f1f1f1] px-4 py-6 text-[#6e6e6e] sm:px-8 sm:py-7">
        <h2 className="mb-4 text-3xl font-semibold text-[#252525]">Settings</h2>
        <p>No settings document found in Firestore yet.</p>
      </section>
    );
  }

  return (
    <>
      <section className="rounded-2xl bg-[#f1f1f1] px-4 py-6 sm:px-8 sm:py-7">
        <h2 className="mb-6 text-3xl font-semibold text-[#252525]">Settings</h2>

        {/* Profile Section */}
        <div className="mb-8">
          <h3 className="mb-4 text-sm font-medium uppercase tracking-wide text-[#8a8a8a]">Profile</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl bg-white px-4 py-3">
              <span className="text-sm text-[#6e6e6e]">Organization Name</span>
              <span className="text-sm font-medium text-[#2a2a2a]">{settings.organizationName}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-white px-4 py-3">
              <span className="text-sm text-[#6e6e6e]">Contact Email</span>
              <span className="text-sm font-medium text-[#2a2a2a]">{settings.contactEmail}</span>
            </div>
          </div>
        </div>

        {/* Certificate Defaults Section */}
        <div className="mb-8">
          <h3 className="mb-4 text-sm font-medium uppercase tracking-wide text-[#8a8a8a]">Certificate Defaults</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl bg-white px-4 py-3">
              <span className="text-sm text-[#6e6e6e]">Default Template</span>
              <span className="text-sm font-medium text-[#2a2a2a]">{settings.defaultTemplate}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-white px-4 py-3">
              <span className="text-sm text-[#6e6e6e]">Output Format</span>
              <span className="text-sm font-medium text-[#2a2a2a]">{settings.outputFormat}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-white px-4 py-3">
              <span className="text-sm text-[#6e6e6e]">Auto-email on Generation</span>
              <button
                type="button"
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.autoEmailOnGeneration ? "bg-[#ff5b2e]" : "bg-[#c7c7c7]"
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                    settings.autoEmailOnGeneration ? "translate-x-5" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Survey Settings Section */}
        <div>
          <h3 className="mb-4 text-sm font-medium uppercase tracking-wide text-[#8a8a8a]">Survey Settings</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl bg-white px-4 py-3">
              <span className="text-sm text-[#6e6e6e]">Require survey by Default</span>
              <button
                type="button"
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.requireSurveyByDefault ? "bg-[#ff5b2e]" : "bg-[#c7c7c7]"
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                    settings.requireSurveyByDefault ? "translate-x-5" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
