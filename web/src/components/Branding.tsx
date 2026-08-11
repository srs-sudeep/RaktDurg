interface BrandingFooterProps {
  className?: string;
  showAboutLink?: boolean;
}

export function BrandingFooter({ className = "", showAboutLink = true }: BrandingFooterProps) {
  return (
    <footer className={`text-center text-xs text-gray-500 ${className}`}>
      <p className="font-medium text-gray-600">By IBITF and IIT Bhilai</p>
      <p className="mt-1">Powered by Recogx Init</p>
      {showAboutLink && (
        <div className="mt-2 flex justify-center gap-3">
          <a href="/about" className="text-red-600 underline hover:text-red-800">
            About
          </a>
          <a href="/contact" className="text-red-600 underline hover:text-red-800">
            Contact
          </a>
        </div>
      )}
    </footer>
  );
}

export function BrandingLogo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const dims = size === "sm" ? "h-8 w-8" : size === "lg" ? "h-20 w-20" : "h-12 w-12";
  const textSize = size === "sm" ? "text-base" : size === "lg" ? "text-2xl" : "text-xl";

  return (
    <div className="flex flex-col items-center gap-2">
      <img src="/logo.svg" alt="RaktDurg" className={dims} />
      <h1 className={`font-semibold text-gray-900 ${textSize}`}>RaktDurg</h1>
      <p className="text-sm text-gray-500">District Blood Bank Platform</p>
    </div>
  );
}
