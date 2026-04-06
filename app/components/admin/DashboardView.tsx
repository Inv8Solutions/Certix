import type { StatItem } from "./types";

type DashboardViewProps = {
  stats: StatItem[];
  organizationName: string;
  onOpenBuilder: () => void;
};

export default function DashboardView({ stats, organizationName, onOpenBuilder }: DashboardViewProps) {
  return (
    <>
      <section className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[2rem] font-semibold leading-tight">Good morning, {organizationName}</h1>
          <p className="mt-1 text-sm text-[#666]">Manage and track all your certificate generation events</p>
        </div>

        <button
          type="button"
          onClick={onOpenBuilder}
          className="inline-flex items-center gap-3 rounded-full bg-[#111217] px-8 py-4 text-sm font-medium text-white"
        >
          <span className="text-lg leading-none">+</span>
          Create New Event
        </button>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <article key={stat.label} className="rounded-2xl bg-[#f5f5f5] p-6 shadow-[0_1px_0_rgba(0,0,0,0.02)]">
            <p className="text-sm text-[#676767]">{stat.label}</p>
            <p className="mt-2 text-5xl font-medium leading-none tracking-tight text-[#252525]">{stat.value}</p>
            <div className="mt-8">
              <span className="rounded-full bg-[#d7f0e6] px-3 py-1 text-xs font-medium text-[#1f8f67]">{stat.trend}</span>
            </div>
          </article>
        ))}
      </section>
    </>
  );
}
