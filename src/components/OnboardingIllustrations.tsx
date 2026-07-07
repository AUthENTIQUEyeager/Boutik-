// Illustrations plates et colorées pour l'onboarding — dessinées à la main en SVG,
// volontairement variées (pas uniquement vert/blanc) pour donner du caractère à chaque écran.

export function IllustrationCahier() {
  return (
    <svg viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="120" cy="120" r="110" fill="#FFF1E6" />
      <rect x="55" y="45" width="130" height="160" rx="10" fill="#F4A261" />
      <rect x="55" y="45" width="130" height="160" rx="10" fill="url(#cahierGrad)" fillOpacity="0.15" />
      <rect x="68" y="45" width="10" height="160" fill="#E76F51" />
      <rect x="72" y="70" width="98" height="8" rx="4" fill="#FFF7F0" opacity="0.85" />
      <rect x="72" y="92" width="98" height="8" rx="4" fill="#FFF7F0" opacity="0.7" />
      <rect x="72" y="114" width="72" height="8" rx="4" fill="#FFF7F0" opacity="0.55" />
      <path d="M75 148 L100 168 L170 128" stroke="#FFE8D6" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
      {/* stylo qui gribouille, symbole d'erreur */}
      <g transform="translate(150 150) rotate(18)">
        <rect x="-6" y="-42" width="12" height="60" rx="6" fill="#2A9D8F" />
        <polygon points="-6,-42 6,-42 0,-58" fill="#264653" />
      </g>
      <circle cx="185" cy="60" r="14" fill="#E9C46A" />
      <circle cx="45" cy="180" r="10" fill="#E76F51" />
      <defs>
        <linearGradient id="cahierGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" />
          <stop offset="1" stopColor="#000" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function IllustrationDettes() {
  return (
    <svg viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="120" cy="120" r="110" fill="#EAF2FF" />
      {/* deux personnages */}
      <g>
        <circle cx="85" cy="95" r="26" fill="#5B7FDE" />
        <path d="M50 190c0-30 20-52 35-52s35 22 35 52" fill="#7C9BEB" />
      </g>
      <g>
        <circle cx="160" cy="100" r="22" fill="#F6B26B" />
        <path d="M128 188c0-26 16-46 32-46s32 20 32 46" fill="#F9C784" />
      </g>
      {/* bulle avec point d'interrogation d'argent */}
      <g transform="translate(150 45)">
        <rect x="-34" y="-28" width="68" height="46" rx="14" fill="#FFFFFF" />
        <polygon points="-6,18 6,18 -2,32" fill="#FFFFFF" />
        <text x="0" y="4" textAnchor="middle" fontSize="26" fontFamily="Arial, sans-serif" fill="#5B7FDE" fontWeight="bold">?</text>
      </g>
      <circle cx="30" cy="55" r="10" fill="#F6B26B" opacity="0.7" />
      <circle cx="205" cy="150" r="8" fill="#5B7FDE" opacity="0.6" />
    </svg>
  );
}

export function IllustrationCalcul() {
  return (
    <svg viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="120" cy="120" r="110" fill="#F3EAFB" />
      {/* calculatrice */}
      <rect x="72" y="55" width="96" height="130" rx="14" fill="#9B5DE5" />
      <rect x="86" y="70" width="68" height="30" rx="6" fill="#F1E4FB" />
      <text x="120" y="92" textAnchor="middle" fontSize="16" fontFamily="Arial, sans-serif" fill="#5A189A" fontWeight="bold">1 250</text>
      {[0,1,2,3].map((row) =>
        [0,1,2].map((col) => (
          <circle key={`${row}-${col}`} cx={92 + col*30} cy={118 + row*16} r="6" fill="#F1E4FB" opacity={0.9 - row*0.1} />
        ))
      )}
      {/* pièces qui volent, couleurs variées */}
      <circle cx="55" cy="70" r="16" fill="#F9C74F" />
      <circle cx="55" cy="70" r="16" fill="none" stroke="#F3722C" strokeWidth="2" />
      <circle cx="195" cy="60" r="12" fill="#90BE6D" />
      <circle cx="195" cy="60" r="12" fill="none" stroke="#43AA8B" strokeWidth="2" />
      <circle cx="45" cy="170" r="10" fill="#F94144" opacity="0.85" />
    </svg>
  );
}

export function IllustrationBoutikPlus() {
  return (
    <svg viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="120" cy="120" r="110" fill="#E4FBF1" />
      {/* téléphone avec dashboard */}
      <rect x="78" y="40" width="84" height="160" rx="18" fill="#0B7A52" />
      <rect x="86" y="56" width="68" height="128" rx="8" fill="#FFFFFF" />
      <rect x="94" y="66" width="52" height="10" rx="5" fill="#DFF7EC" />
      <rect x="94" y="84" width="24" height="24" rx="6" fill="#10B981" />
      <rect x="122" y="84" width="24" height="24" rx="6" fill="#FDBA57" />
      <polyline points="94,150 106,132 118,142 132,118 146,128" stroke="#10B981" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {/* confettis multicolores */}
      <circle cx="45" cy="70" r="8" fill="#FDBA57" />
      <rect x="185" y="55" width="12" height="12" rx="3" fill="#5B7FDE" transform="rotate(20 191 61)" />
      <circle cx="200" cy="150" r="7" fill="#E76F51" />
      <rect x="35" y="160" width="10" height="10" rx="2" fill="#9B5DE5" transform="rotate(-15 40 165)" />
      <circle cx="120" cy="20" r="6" fill="#10B981" />
    </svg>
  );
}
