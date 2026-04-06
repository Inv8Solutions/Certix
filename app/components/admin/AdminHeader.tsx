import type { AdminView } from "./types";

type AdminHeaderProps = {
  activeView: AdminView;
  onDashboard: () => void;
  onEvents: () => void;
  onSettings: () => void;
  onAddEvent: () => void;
};

function navButtonClass(isActive: boolean, isMuted?: boolean) {
  if (isActive) {
    return "rounded-full bg-[#ff5b2e] px-6 py-2 font-medium text-white";
  }

  if (isMuted) {
    return "rounded-full bg-[#d5d5d5] px-6 py-2 text-[#202020]";
  }

  return "rounded-full px-6 py-2 text-[#202020]";
}

export default function AdminHeader({ activeView, onDashboard, onEvents, onSettings, onAddEvent }: AdminHeaderProps) {
  return (
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
            <button type="button" onClick={onDashboard} className={navButtonClass(activeView === "dashboard")}>
              Dashboard
            </button>
          </li>
          <li>
            <button type="button" onClick={onEvents} className={navButtonClass(activeView === "events")}>
              Events
            </button>
          </li>
          <li>
            <button type="button" onClick={onSettings} className={navButtonClass(activeView === "settings")}>
              Settings
            </button>
          </li>
          <li>
            <button type="button" onClick={onAddEvent} className={navButtonClass(activeView === "builder", true)}>
              Add Event
            </button>
          </li>
        </ul>
      </nav>

      <button
        type="button"
        aria-label="Admin profile"
        className="h-11 w-11 rounded-full bg-[#ff5b2e] ring-4 ring-[#e5e5e5]"
      />
    </header>
  );
}
