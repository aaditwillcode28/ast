import React from "react";

interface KataTiraLogoProps {
  className?: string;
  size?: number;
}

export const KataTiraLogo: React.FC<KataTiraLogoProps> = ({
  className = "h-8 w-8",
  size,
}) => {
  return (
    <img
      src="/katatira-logo.svg"
      alt="KataTira Logo"
      className={className}
      style={size ? { width: size, height: size } : undefined}
    />
  );
};
