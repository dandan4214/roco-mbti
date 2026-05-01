import type { SVGProps } from 'react';

type IconProps = Omit<SVGProps<SVGSVGElement>, 'children'> & {
  size?: number;
};

function base(p: IconProps): SVGProps<SVGSVGElement> {
  const { size = 18, style, ...rest } = p;
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.7,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    ...rest,
    style: { verticalAlign: '-3px', flexShrink: 0, ...style },
  };
}

export const IconSparkle = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 3l1.6 5.5L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.5L12 3z" />
    <path d="M19 14l.7 2.3L22 17l-2.3.7L19 20l-.7-2.3L16 17l2.3-.7L19 14z" />
  </svg>
);

export const IconTrophy = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M7 4h10v3a5 5 0 01-10 0V4z" />
    <path d="M7 4H4v2a3 3 0 003 3" />
    <path d="M17 4h3v2a3 3 0 01-3 3" />
    <path d="M9 21h6" />
    <path d="M12 17v4" />
  </svg>
);

export const IconDocument = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M6 3h8l4 4v14H6V3z" />
    <path d="M14 3v4h4" />
    <path d="M9 12h6M9 15h6M9 18h4" />
  </svg>
);

export const IconChart = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 20V8M10 20V4M16 20v-8M22 20v-5" />
    <path d="M3 20h19" />
  </svg>
);

export const IconRadar = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="12" cy="12" r="1.5" fill="currentColor" />
  </svg>
);

export const IconCastle = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M3 21h18" />
    <path d="M5 21V11l3-2V6h2v3h2V8h2v3h2V8h2v3h2V6h2v3l3 2v10" />
    <path d="M10 21v-4h4v4" />
  </svg>
);

export const IconSwords = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M14 5l5-2-2 5-9 9-3-3 9-9z" />
    <path d="M5 14l3 3" />
    <path d="M10 5L5 3l2 5 9 9 3-3-9-9z" />
    <path d="M19 14l-3 3" />
  </svg>
);

export const IconEgg = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 3c-3.5 0-6 5-6 10a6 6 0 0012 0c0-5-2.5-10-6-10z" />
  </svg>
);

export const IconPeople = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="9" cy="8" r="3" />
    <path d="M3 19a6 6 0 0112 0" />
    <circle cx="17" cy="9" r="2.5" />
    <path d="M15 19a5 5 0 016-4.9" />
  </svg>
);

export const IconMask = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M5 6h14v6a7 6 0 01-14 0V6z" />
    <path d="M9 10v.01M15 10v.01" />
    <path d="M9.5 14c1 1 4 1 5 0" />
  </svg>
);

export const IconGamepad = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M5 7h14a2 2 0 012 2v6a2 2 0 01-2 2h-1.5l-2-3h-7l-2 3H5a2 2 0 01-2-2V9a2 2 0 012-2z" />
    <path d="M7 11h2M8 10v2" />
    <path d="M15 11v.01M17 13v.01" />
  </svg>
);

export const IconChat = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M21 12a8 8 0 11-3.5-6.6L21 4l-1 4a8 8 0 011 4z" />
    <path d="M8 12h.01M12 12h.01M16 12h.01" />
  </svg>
);

export const IconMegaphone = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M3 11v2a2 2 0 002 2h2v3a1.5 1.5 0 003 0v-3l11 4V6L10 10H5a2 2 0 00-2 1z" />
  </svg>
);

export const IconImage = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <circle cx="8.5" cy="10" r="1.5" />
    <path d="M3 17l5-5 4 4 3-3 6 5" />
  </svg>
);

export const IconHandPoint = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M9 11V5.5a1.5 1.5 0 113 0V11" />
    <path d="M12 9V4.5a1.5 1.5 0 113 0V11" />
    <path d="M15 8.5a1.5 1.5 0 113 0V13" />
    <path d="M6 13.5a1.5 1.5 0 013 0V15" />
    <path d="M6 13c0 5 2 8 6 8h2a4 4 0 004-4v-3" />
  </svg>
);

export const IconShare = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 3v13" />
    <path d="M7 8l5-5 5 5" />
    <path d="M5 13v6a2 2 0 002 2h10a2 2 0 002-2v-6" />
  </svg>
);

export const IconSave = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M5 3h11l3 3v15H5V3z" />
    <path d="M8 3v6h8V3" />
    <rect x="8" y="14" width="8" height="6" />
  </svg>
);

export const IconCode = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M9 7l-5 5 5 5" />
    <path d="M15 7l5 5-5 5" />
    <path d="M14 4l-4 16" />
  </svg>
);

export const IconQuestion = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.5 9a2.5 2.5 0 015 0c0 1.7-2.5 1.7-2.5 4" />
    <path d="M12 17.5v.01" />
  </svg>
);

export const IconClose = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

export const IconArrowRight = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M5 12h14M13 5l7 7-7 7" />
  </svg>
);
