/** Decorative SVG panels for auth and public marketing pages */

export function LoginHeroPanel() {
  return (
    <div className="relative flex h-full flex-col justify-between overflow-hidden bg-gradient-to-br from-red-700 via-red-600 to-red-900 p-10 text-white">
      <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-red-400/20 blur-3xl" />

      <div className="relative z-10">
        <img src="/logo.svg" alt="" className="h-16 w-16 drop-shadow-lg" />
        <h1 className="mt-6 text-4xl font-bold tracking-tight">RaktDurg</h1>
        <p className="mt-2 max-w-sm text-lg text-red-100">
          District Blood Bank Platform for Durg — inventory, camps, and donor workflows in one place.
        </p>
      </div>

      <div className="relative z-10 my-8 flex justify-center">
        <BloodBankIllustration />
      </div>

      <div className="relative z-10 space-y-6">
        <div className="grid grid-cols-3 gap-4">
          {[
            { value: "8", label: "Blood groups tracked" },
            { value: "24/7", label: "Public stock view" },
            { value: "100%", label: "NBTC aligned" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl bg-white/10 px-3 py-4 backdrop-blur-sm">
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="mt-1 text-xs text-red-100">{stat.label}</p>
            </div>
          ))}
        </div>
        <p className="text-sm text-red-200">
          By IBITF and IIT Bhilai · Powered by Recogx Init
        </p>
      </div>
    </div>
  );
}

function BloodBankIllustration() {
  return (
    <svg
      viewBox="0 0 320 240"
      className="h-48 w-full max-w-xs drop-shadow-2xl"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect x="40" y="60" width="240" height="140" rx="16" fill="white" fillOpacity="0.15" />
      <rect x="60" y="80" width="80" height="100" rx="8" fill="white" fillOpacity="0.25" />
      <rect x="160" y="80" width="100" height="44" rx="8" fill="white" fillOpacity="0.2" />
      <rect x="160" y="136" width="100" height="44" rx="8" fill="white" fillOpacity="0.2" />
      <circle cx="100" cy="130" r="28" fill="#FCA5A5" fillOpacity="0.9" />
      <path
        d="M100 108c-8 12-16 20-16 28a16 16 0 1032 0c0-8-8-16-16-28z"
        fill="#DC2626"
      />
      <rect x="72" y="40" width="16" height="24" rx="4" fill="white" fillOpacity="0.4" />
      <rect x="232" y="40" width="16" height="24" rx="4" fill="white" fillOpacity="0.4" />
      <path d="M80 40h160" stroke="white" strokeOpacity="0.3" strokeWidth="3" strokeLinecap="round" />
      {[0, 1, 2, 3].map((i) => (
        <circle
          key={i}
          cx={180 + i * 18}
          cy={102}
          r="6"
          fill={["#FCA5A5", "#93C5FD", "#C4B5FD", "#86EFAC"][i]}
        />
      ))}
      <path
        d="M48 200h224"
        stroke="white"
        strokeOpacity="0.2"
        strokeWidth="2"
        strokeDasharray="8 6"
      />
    </svg>
  );
}

export function HeroPattern() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute -left-24 top-0 h-96 w-96 rounded-full bg-red-200/40 blur-3xl" />
      <div className="absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-red-100/60 blur-3xl" />
      <svg className="absolute inset-0 h-full w-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.5" fill="currentColor" className="text-red-900" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dots)" />
      </svg>
    </div>
  );
}

export function FeatureIcon({ type }: { type: "stock" | "camp" | "ops" | "phone" | "shield" | "heart" }) {
  const icons = {
    stock: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 012-2h2a2 2 0 012 2v6m-6 0h6m-6 0H7m8 0v-6a2 2 0 012-2h2a2 2 0 012 2v6m-6 0h6" />
    ),
    camp: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
    ),
    ops: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    ),
    phone: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    ),
    shield: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    ),
    heart: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    ),
  };

  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 text-red-600">
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        {icons[type]}
      </svg>
    </div>
  );
}

export function StockSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="animate-pulse rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="h-8 w-14 rounded-full bg-gray-200" />
            <div className="h-5 w-20 rounded bg-gray-200" />
          </div>
          <div className="mt-4 h-3 w-full rounded bg-gray-100" />
          <div className="mt-2 h-3 w-2/3 rounded bg-gray-100" />
          <div className="mt-4 flex gap-2">
            <div className="h-12 flex-1 rounded-lg bg-gray-100" />
            <div className="h-12 flex-1 rounded-lg bg-gray-100" />
          </div>
        </div>
      ))}
    </div>
  );
}
