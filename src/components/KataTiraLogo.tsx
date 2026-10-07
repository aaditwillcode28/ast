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
      viewBox="0 0 1000 1000"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={size ? { width: size, height: size } : undefined}
      role="img"
      aria-label="KataTira Logo"
    >
      {/* 
        Exact reproduction of uploaded artwork:
        1. Left: Orange question mark with thick black stroke and white inner hook cutout.
           Bottom dot: orange circle with white crescent/highlight and black outer stroke.
        2. Right: Black question mark angled to mirror and complete the heart contour.
           Orange outer contour accent along the perimeter.
           Bottom dot: black circle with white crescent highlight and orange outer border.
      */}
      <g>
        {/* === LEFT QUESTION MARK (ORANGE) === */}
        {/* Main curved body */}
        <path
          d="M 235 290 
             C 210 200, 310 160, 420 205 
             C 495 240, 490 325, 460 365 
             C 415 300, 330 220, 305 315 
             C 285 390, 420 460, 400 550 
             C 388 605, 395 640, 400 660 
             L 370 660 
             C 365 625, 345 565, 330 520 
             C 300 425, 190 380, 235 290 
             Z"
          fill="#ff6b00"
          stroke="#000000"
          strokeWidth="28"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Left inner white cutout curve that creates the dynamic ribbon hook */}
        <path
          d="M 310 300 
             C 335 225, 410 270, 460 355 
             C 485 320, 480 250, 420 215 
             C 335 175, 245 220, 280 320 
             C 310 405, 355 470, 370 540 
             C 360 480, 310 420, 275 360 
             Z"
          fill="#ffffff"
          stroke="#000000"
          strokeWidth="18"
          strokeLinejoin="round"
        />

        {/* Left Bottom Dot (Orange circle with black outline and white inner shine) */}
        <circle
          cx="425"
          cy="605"
          r="52"
          fill="#ff6b00"
          stroke="#000000"
          strokeWidth="24"
        />
        {/* Left Dot Inner highlight */}
        <path
          d="M 395 580 C 410 565, 435 565, 450 580"
          stroke="#ffffff"
          strokeWidth="10"
          strokeLinecap="round"
        />


        {/* === RIGHT QUESTION MARK (BLACK) === */}
        {/* Orange Outer Silhouette / Accent Halo Outline */}
        <path
          d="M 525 360 
             C 490 260, 610 240, 700 275 
             C 805 320, 835 440, 770 525 
             C 670 655, 530 635, 520 735 
             L 512 745 
             C 505 640, 650 630, 725 530 
             C 785 450, 765 345, 680 305 
             C 605 270, 520 285, 545 375 
             Z"
          fill="none"
          stroke="#ff6b00"
          strokeWidth="48"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Black main body */}
        <path
          d="M 525 360 
             C 490 260, 610 240, 700 275 
             C 805 320, 835 440, 770 525 
             C 670 655, 530 635, 520 735 
             L 512 745 
             C 505 640, 650 630, 725 530 
             C 785 450, 765 345, 680 305 
             C 605 270, 520 285, 545 375 
             Z"
          fill="#0a0a0a"
          stroke="#000000"
          strokeWidth="12"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Right Bottom Dot (Black with outer orange rim and white crescent shine) */}
        {/* Orange outer border */}
        <circle
          cx="550"
          cy="715"
          r="62"
          fill="#ff6b00"
        />
        {/* Black inner circle */}
        <circle
          cx="550"
          cy="715"
          r="48"
          fill="#0a0a0a"
          stroke="#000000"
          strokeWidth="6"
        />
        {/* Crescent highlight shine */}
        <path
          d="M 565 680 C 585 695, 585 725, 565 745"
          stroke="#ffffff"
          strokeWidth="14"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
};
