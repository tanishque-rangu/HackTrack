import React from 'react';

interface GokuSilhouetteProps {
  hairColor: string; // e.g. '#000000' or '#FFC107'
  isSuperSaiyan: boolean;
  className?: string;
}

export const GokuSilhouette: React.FC<GokuSilhouetteProps> = ({
  hairColor,
  isSuperSaiyan,
  className = '',
}) => {
  return (
    <svg
      viewBox="0 0 300 360"
      className={`w-56 h-64 select-none pointer-events-none ${className}`}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="gokuAuraGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={isSuperSaiyan ? "#FF9800" : "#00E5FF"} stopOpacity="0.8" />
          <stop offset="100%" stopColor={isSuperSaiyan ? "#FF5722" : "#1E88E5"} stopOpacity="0" />
        </radialGradient>
        <linearGradient id="giGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#E65100" />
          <stop offset="100%" stopColor="#BF360C" />
        </linearGradient>
        <linearGradient id="undershirtGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1A237E" />
          <stop offset="100%" stopColor="#0D47A1" />
        </linearGradient>
      </defs>

      {/* Back Aura Glow */}
      <ellipse
        cx="150"
        cy="200"
        rx="110"
        ry="130"
        fill="url(#gokuAuraGlow)"
        className="transition-all duration-300"
      />

      <g transform="translate(0, 20)">
        {/* Crouched Legs / Base Stance */}
        <path
          d="M 60 280 Q 90 250 120 270 L 110 320 L 50 310 Z"
          fill="#1C1917"
        />
        <path
          d="M 240 280 Q 210 250 180 270 L 190 320 L 250 310 Z"
          fill="#1C1917"
        />

        {/* Orange Gi Pants & Belt */}
        <path
          d="M 80 230 Q 150 250 220 230 L 230 290 Q 150 310 70 290 Z"
          fill="url(#giGradient)"
        />
        <path
          d="M 110 225 L 190 225 L 185 240 L 115 240 Z"
          fill="#0D47A1"
        />

        {/* Muscular Arms - Crouched Power-Up Pose */}
        {/* Left Arm & Fist */}
        <path
          d="M 100 150 Q 50 170 45 220 Q 65 230 85 210 Q 80 180 110 165 Z"
          fill="#1F1916"
        />
        <circle cx="48" cy="225" r="14" fill="#0D47A1" /> {/* Wristband */}
        <ellipse cx="40" cy="238" rx="14" ry="12" fill="#2D231E" /> {/* Left Fist */}

        {/* Right Arm & Fist */}
        <path
          d="M 200 150 Q 250 170 255 220 Q 235 230 215 210 Q 220 180 190 165 Z"
          fill="#1F1916"
        />
        <circle cx="252" cy="225" r="14" fill="#0D47A1" /> {/* Wristband */}
        <ellipse cx="260" cy="238" rx="14" ry="12" fill="#2D231E" /> {/* Right Fist */}

        {/* Torso & Undershirt */}
        <path
          d="M 100 140 L 200 140 L 210 230 L 90 230 Z"
          fill="url(#giGradient)"
        />
        <path
          d="M 125 140 L 175 140 L 165 190 L 135 190 Z"
          fill="url(#undershirtGradient)"
        />

        {/* Neck & Face Contour */}
        <path
          d="M 130 110 L 170 110 L 165 145 L 135 145 Z"
          fill="#2A1E17"
        />
        <path
          d="M 120 70 Q 150 125 180 70 Q 150 135 120 70 Z"
          fill="#1F1916"
        />

        {/* Dynamic Spiky Goku Hair (Separate SVG path for smooth fill transition) */}
        <path
          d="M 120 75 
             Q 90 60 70 85 
             Q 85 50 100 35 
             Q 70 30 55 5 
             Q 90 10 115 -15 
             Q 130 -35 150 -55 
             Q 170 -35 185 -15 
             Q 210 10 245 5 
             Q 230 30 200 35 
             Q 215 50 230 85 
             Q 210 60 180 75 
             Q 150 85 120 75 Z"
          fill={hairColor}
          stroke={isSuperSaiyan ? '#FFE082' : '#212121'}
          strokeWidth="3"
          className="transition-colors duration-200"
        />

        {/* Stern Eye/Brow Ridge Silhouette */}
        <path
          d="M 130 85 L 148 93 L 152 93 L 170 85 L 160 90 L 140 90 Z"
          fill={isSuperSaiyan ? '#00E5FF' : '#424242'}
        />
      </g>
    </svg>
  );
};
