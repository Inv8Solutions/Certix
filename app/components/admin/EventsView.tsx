import type { AdminEvent } from "./types";

type EventsViewProps = {
  events: AdminEvent[];
  onSelectEvent: (event: AdminEvent) => void;
};

export default function EventsView({ events, onSelectEvent }: EventsViewProps) {
  return (
    <section className="mt-14 overflow-hidden rounded-3xl border border-[#e2e2e2] bg-[#f2f2f2]">
      <div className="grid grid-cols-[1.6fr_1.3fr_1fr] border-b border-[#e0e0e0] px-6 py-4 text-xl text-[#5f5f5f]">
        <p>All Events</p>
        <p>Summary</p>
        <p>Actions</p>
      </div>

      <div>
        {events.length === 0 ? (
          <div className="px-6 py-12 text-center text-[#7b7b7b]">
            No events found in Firestore yet.
          </div>
        ) : null}

        {events.map((event) => (
          <article
            key={event.id}
            onClick={() => onSelectEvent(event)}
            className="grid cursor-pointer grid-cols-[1.6fr_1.3fr_1fr] items-center border-b border-[#e6e6e6] px-6 py-5 last:border-b-0"
          >
            <div className="flex items-center gap-4">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#ff5b2e] text-lg text-white">▣</div>
              <div>
                <p className="text-[1.9rem] leading-tight text-[#2d2d2d]">{event.name}</p>
                <p className="mt-1 text-sm text-[#7b7b7b]">{event.dateAndVenue}</p>
              </div>
            </div>

            <div className="flex items-center gap-7">
              <div>
                <p className="text-[2rem] leading-none text-[#1f1f1f]">{event.scans}</p>
                <p className="mt-1 text-sm text-[#6f6f6f]">Scans</p>
              </div>
              <div>
                <p className="text-[2rem] leading-none text-[#1f1f1f]">{event.certs}</p>
                <p className="mt-1 text-sm text-[#6f6f6f]">Certs</p>
              </div>
              <div>
                <p className="text-[2rem] leading-none text-[#1f1f1f]">{event.survey}</p>
                <p className="mt-1 text-sm text-[#6f6f6f]">Survey</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onSelectEvent(event)}
                className="inline-flex items-center gap-2 rounded-xl bg-[#e8e8e8] px-4 py-2 text-sm text-[#445060]"
              >
                <span className="text-xs">◉</span>
                View Details
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl bg-[#e7f0ff] px-4 py-2 text-sm font-medium text-[#2f78e1]"
              >
                <span className="text-xs">↓</span>
                Export Data
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
