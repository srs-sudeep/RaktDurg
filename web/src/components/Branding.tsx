interface BrandingFooterProps {
  className?: string;
  showAboutLink?: boolean;
}

export function BrandingFooter({ className = "", showAboutLink = true }: BrandingFooterProps) {
  return (
    <div className={`text-center text-xs text-muted-foreground ${className}`}>
      <p className="font-medium text-muted-foreground">By IBITF and IIT Bhilai</p>
      <p className="mt-1">Powered by Recogx Init</p>
      {showAboutLink && (
        <div className="mt-2 flex justify-center gap-3">
          <a href="/about" className="text-primary hover:underline">
            About
          </a>
          <a
            href="https://rakt-durg-docs.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Docs
          </a>
          <a href="/contact" className="text-primary hover:underline">
            Contact
          </a>
        </div>
      )}
    </div>
  );
}

export function BrandingLogo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const dims = size === "sm" ? "h-8 w-8" : size === "lg" ? "h-20 w-20" : "h-12 w-12";
  const textSize = size === "sm" ? "text-base" : size === "lg" ? "text-2xl" : "text-xl";

  return (
    <div className="flex flex-col items-center gap-2">
      <img src="/logo.svg" alt="RaktDurg" className={dims} />
      <h1 className={`font-display font-semibold text-foreground ${textSize}`}>RaktDurg</h1>
      <p className="text-sm text-muted-foreground">District Blood Bank Platform</p>
    </div>
  );
}
