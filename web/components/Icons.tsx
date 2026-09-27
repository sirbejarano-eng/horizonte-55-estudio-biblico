// Iconos propios (trazo de 1,75 px, esquinas redondeadas), en lugar de símbolos de texto como ☾ o ✓.
// Decorativos por defecto: el texto del botón o su aria-label dice qué hace.
import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function base({ size = 20, ...props }: IconProps) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    focusable: false,
    ...props,
  };
}

export const MenuIcon = (p: IconProps) => (<svg {...base(p)}><path d="M4 7h16M4 12h16M4 17h16" /></svg>);
export const CloseIcon = (p: IconProps) => (<svg {...base(p)}><path d="M6 6l12 12M18 6L6 18" /></svg>);
export const SunIcon = (p: IconProps) => (<svg {...base(p)}><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4L6 18M18 6l1.4-1.4" /></svg>);
export const MoonIcon = (p: IconProps) => (<svg {...base(p)}><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" /></svg>);
export const GlobeIcon = (p: IconProps) => (<svg {...base(p)}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3Z" /></svg>);
export const BookIcon = (p: IconProps) => (<svg {...base(p)}><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5v-15Z" /><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5" /><path d="M9 7.5h7" /></svg>);
export const LibraryIcon = (p: IconProps) => (<svg {...base(p)}><rect x="3.5" y="4" width="4" height="16" rx="1" /><rect x="9.5" y="4" width="4" height="16" rx="1" /><path d="M15.4 5.2l3.7-1 3.4 14.9-3.7 1z" /></svg>);
export const SearchIcon = (p: IconProps) => (<svg {...base(p)}><circle cx="11" cy="11" r="6.5" /><path d="M20 20l-4.2-4.2" /></svg>);
export const TimelineIcon = (p: IconProps) => (<svg {...base(p)}><path d="M12 3v18" /><circle cx="12" cy="7" r="2" /><circle cx="12" cy="17" r="2" /><path d="M14 7h6M4 17h6" /></svg>);
export const MapIcon = (p: IconProps) => (<svg {...base(p)}><path d="M9 4L3 6.5v13.5L9 17.5l6 2.5 6-2.5V4L15 6.5 9 4Z" /><path d="M9 4v13.5M15 6.5V20" /></svg>);
export const ArrowLeftIcon = (p: IconProps) => (<svg {...base(p)}><path d="M19 12H5M11 6l-6 6 6 6" /></svg>);
export const ArrowRightIcon = (p: IconProps) => (<svg {...base(p)}><path d="M5 12h14M13 6l6 6-6 6" /></svg>);
export const ChevronDownIcon = (p: IconProps) => (<svg {...base(p)}><path d="M6 9l6 6 6-6" /></svg>);
export const CheckIcon = (p: IconProps) => (<svg {...base(p)}><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>);
export const CircleIcon = (p: IconProps) => (<svg {...base(p)}><circle cx="12" cy="12" r="8" /></svg>);
export const CopyIcon = (p: IconProps) => (<svg {...base(p)}><rect x="8" y="8" width="12" height="12" rx="2.5" /><path d="M16 8V6.5A2.5 2.5 0 0 0 13.5 4h-7A2.5 2.5 0 0 0 4 6.5v7A2.5 2.5 0 0 0 6.5 16H8" /></svg>);
export const ShareIcon = (p: IconProps) => (<svg {...base(p)}><path d="M12 15V3M7.5 7.5L12 3l4.5 4.5" /><path d="M5 12v6.5A2.5 2.5 0 0 0 7.5 21h9a2.5 2.5 0 0 0 2.5-2.5V12" /></svg>);
export const TextSizeIcon = (p: IconProps) => (<svg {...base(p)}><path d="M3 19l5-13 5 13M4.8 14.5h6.4" /><path d="M14.5 19l3.2-8 3.3 8M15.6 16.3h4.2" /></svg>);
export const NoteIcon = (p: IconProps) => (<svg {...base(p)}><path d="M5 4h10l4 4v12H5z" /><path d="M15 4v4h4M8.5 12.5h7M8.5 16h5" /></svg>);
export const DownloadIcon = (p: IconProps) => (<svg {...base(p)}><path d="M12 4v11M7.5 10.5L12 15l4.5-4.5M5 20h14" /></svg>);
export const UploadIcon = (p: IconProps) => (<svg {...base(p)}><path d="M12 15V4M7.5 8.5L12 4l4.5 4.5M5 20h14" /></svg>);
export const OfflineIcon = (p: IconProps) => (<svg {...base(p)}><path d="M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0" /><circle cx="12" cy="19.5" r="1" fill="currentColor" stroke="none" /></svg>);
export const SparkIcon = (p: IconProps) => (<svg {...base(p)}><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" /><path d="M19 17l.7 1.8 1.8.7-1.8.7L19 22l-.7-1.8-1.8-.7 1.8-.7z" /></svg>);
export const LeafIcon = (p: IconProps) => (<svg {...base(p)}><path d="M5 19c0-8 5-14 15-14 0 10-6 15-14 15" /><path d="M5 19l7-7" /></svg>);
export const LockIcon = (p: IconProps) => (<svg {...base(p)}><rect x="5" y="10.5" width="14" height="10" rx="2.5" /><path d="M8 10.5V8a4 4 0 1 1 8 0v2.5" /></svg>);
export const SettingsIcon = (p: IconProps) => (<svg {...base(p)}><path d="M4 7h10M18 7h2M4 17h2M10 17h10" /><circle cx="16" cy="7" r="2" /><circle cx="8" cy="17" r="2" /></svg>);
export const BookmarkIcon = (p: IconProps) => (<svg {...base(p)}><path d="M6.5 3.5h11v17L12 16.5l-5.5 4z" /></svg>);
export const BookmarkFilledIcon = (p: IconProps) => (<svg {...base(p)}><path d="M6.5 3.5h11v17L12 16.5l-5.5 4z" fill="currentColor" /></svg>);
export const HighlightIcon = (p: IconProps) => (<svg {...base(p)}><path d="M14.5 4.5l5 5L10 19H5v-5z" /><path d="M12.5 6.5l5 5M4 21.5h16" /></svg>);
export const TrashIcon = (p: IconProps) => (<svg {...base(p)}><path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13M10 11v5.5M14 11v5.5" /></svg>);
export const MarksIcon = (p: IconProps) => (<svg {...base(p)}><path d="M5 3.5h9.5v16L9.75 16 5 19.5z" /><path d="M17.5 7.5h2v13l-3.5-2.5" /></svg>);
export const GridIcon = (p: IconProps) => (<svg {...base(p)}><rect x="4" y="4" width="6" height="6" rx="1.5" /><rect x="14" y="4" width="6" height="6" rx="1.5" /><rect x="4" y="14" width="6" height="6" rx="1.5" /><rect x="14" y="14" width="6" height="6" rx="1.5" /></svg>);
