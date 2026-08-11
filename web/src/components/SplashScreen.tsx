interface SplashScreenProps {
  message?: string;
}

export function SplashScreen({ message = "Loading RaktDurg…" }: SplashScreenProps) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-gray-50 via-white to-red-50">
      <div className="pointer-events-none absolute -left-32 top-0 h-96 w-96 rounded-full bg-red-200/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-red-100/40 blur-3xl" />

      <div className="relative flex flex-col items-center">
        <div className="relative">
          <div className="absolute inset-0 animate-ping rounded-full bg-red-400/20" style={{ animationDuration: "2s" }} />
          <img src="/logo.svg" alt="RaktDurg" className="relative h-24 w-24 drop-shadow-lg" />
        </div>
        <h1 className="mt-6 text-3xl font-bold text-gray-900">RaktDurg</h1>
        <p className="mt-1 text-sm text-gray-500">District Blood Bank Platform</p>
        <p className="mt-4 text-xs font-medium text-gray-600">By IBITF and IIT Bhilai</p>
        <p className="text-xs text-gray-400">Powered by Recogx Init</p>
        <div className="mt-8 flex items-center gap-6 opacity-80">
          <img src="/IIT_Bhilai.svg" alt="" className="h-8 object-contain" />
          <img src="/IBITF.jpeg" alt="" className="h-7 rounded object-contain" />
          <img src="/recogx.webp" alt="" className="h-5 object-contain" />
        </div>

        <div className="mt-10 flex flex-col items-center gap-3">
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-2 w-2 animate-bounce rounded-full bg-red-600"
                style={{ animationDelay: `${i * 150}ms` }}
              />
            ))}
          </div>
          <p className="text-sm font-medium text-gray-500">{message}</p>
        </div>
      </div>
    </div>
  );
}

export function PageLoader({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-5 py-16">
      <div className="relative">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-red-100 border-t-red-600" />
        <img
          src="/logo.svg"
          alt=""
          className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2"
        />
      </div>
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <div className="h-1 w-32 overflow-hidden rounded-full bg-gray-100">
        <div className="h-full w-1/2 animate-shimmer rounded-full bg-gradient-to-r from-red-400 to-red-600" />
      </div>
    </div>
  );
}
