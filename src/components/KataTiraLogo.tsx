import React from 'react';

interface KataTiraLogoProps {
  className?: string;
  size?: number;
}

export const KataTiraLogo: React.FC<KataTiraLogoProps> = ({ 
  className = 'h-8 w-8', 
  size 
}) => {
  return (
    <svg
      viewBox="0 0 500 500"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={size ? { width: size, height: size } : undefined}
      role="img"
      aria-label="KataTira Logo"
    >
      {/* 
        KataTira Signature Brand Logo:
        Dual intertwining question marks ("Kata" / "Tira" - "Where / Which way") 
        facing and curving together in Orange & Black with contrasting outlines to form a heart silhouette.
      */}
      <g id="katatira-heart-marks">
        {/* LEFT ORANGE QUESTION MARK (curving right towards center) */}
        <path
          d="M 125 180 
             C 105 105, 185 70, 240 95 
             C 275 110, 275 155, 250 195 
             C 215 250, 165 265, 195 325 
             C 205 345, 215 365, 218 385 
             C 192 375, 182 345, 172 315 
             C 152 255, 95 240, 108 175 
             Z"
          fill="#f97316"
          stroke="#0f172a"
          strokeWidth="16"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Left Mark Inner Highlight Accent Curve */}
        <path
          d="M 155 125 C 190 95, 240 120, 235 155"
          stroke="#ffedd5"
          strokeWidth="10"
          strokeLinecap="round"
        />
        {/* Dot of Left Question Mark */}
        <circle 
          cx="212" 
          cy="425" 
          r="30" 
          fill="#f97316" 
          stroke="#0f172a" 
          strokeWidth="15" 
        />
        <circle 
          cx="205" 
          cy="418" 
          r="8" 
          fill="#ffedd5" 
        />

        {/* RIGHT BLACK QUESTION MARK (with orange outer border contour) */}
        <path
          d="M 270 170 
             C 255 115, 335 95, 385 120 
             C 435 145, 435 200, 400 245 
             C 360 295, 310 315, 325 380 
             C 328 395, 335 410, 335 425 
             C 310 410, 300 380, 292 355 
             C 280 295, 335 270, 365 230 
             C 390 195, 385 155, 350 140 
             C 315 125, 275 145, 280 185 
             Z"
          fill="#0f172a"
          stroke="#f97316"
          strokeWidth="14"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Outer Black Protective Halo Outline */}
        <path
          d="M 265 165 C 248 108, 335 88, 390 115 C 445 142, 442 205, 406 252 C 363 303, 313 322, 330 388"
          stroke="#0f172a"
          strokeWidth="6"
          strokeLinecap="round"
        />
        {/* Dot of Right Question Mark */}
        <circle 
          cx="326" 
          cy="465" 
          r="28" 
          fill="#0f172a" 
          stroke="#f97316" 
          strokeWidth="14" 
        />
        <circle 
          cx="319" 
          cy="458" 
          r="7" 
          fill="#ffffff" 
          opacity="0.9"
        />
      </g>
    </svg>
  );
};
