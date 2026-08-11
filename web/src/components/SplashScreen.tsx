interface SplashScreenProps {
  message?: string;
}

export function SplashScreen({ message = "Loading RaktDurg…" }: SplashScreenProps) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gray-50">
      <img src="/logo.svg" alt="RaktDurg" className="h-24 w-24 animate-pulse" />
      <h1 className="mt-6 text-2xl font-bold text-gray-900">RaktDurg</h1>
      <p className="mt-1 text-sm text-gray-500">District Blood Bank Platform</p>
      <p className="mt-4 text-xs font-medium text-gray-600">By IBITF and IIT Bhilai</p>
      <p className="text-xs text-gray-400">Powered by Recogx Init</p>
      <div className="mt-8 flex items-center gap-6 opacity-80">
        <img src="/IIT_Bhilai.svg" alt="" className="h-8 object-contain" />
        <img src="/IBITF.jpeg" alt="" className="h-7 rounded object-contain" />
        <img src="/recogx.webp" alt="" className="h-5 object-contain" />
      </div>
      <div className="mt-10 flex items-center gap-2 text-sm text-gray-500">
        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
        {message}
      </div>
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4">
      <img src="/logo.svg" alt="" className="h-12 w-12 animate-pulse opacity-80" />
      <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
      <p className="text-sm text-gray-500">Loading…</p>
    </div>
  );
}
