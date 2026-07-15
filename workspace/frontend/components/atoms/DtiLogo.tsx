interface DtiLogoProps {
  showText?: boolean;
  size?: number;
  className?: string;
}

export function DtiLogo({ className }: DtiLogoProps) {
  return (
    <div className={className}>
      <img
        src="/dti-logo.webp"
        alt="DTI"
        className="block h-[55px] w-auto"
      />
    </div>
  );
}
