/*
  Les petites icônes du site : des traits fins, dessinés ici, pas des
  emoji. Un emoji change d'allure selon le téléphone (et fait « généré
  automatiquement ») ; ces traits restent les mêmes partout et prennent la
  couleur du texte autour d'eux.
*/

type Props = { className?: string };

function Svg({ className = "h-5 w-5", children }: { className?: string; children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export const SearchIcon = (p: Props) => (
  <Svg {...p}><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4-4" /></Svg>
);

export const UserIcon = (p: Props) => (
  <Svg {...p}><circle cx="12" cy="8" r="3.6" /><path d="M5 20c.8-3.6 3.5-5.4 7-5.4s6.2 1.8 7 5.4" /></Svg>
);

export const HeartIcon = (p: Props) => (
  <Svg {...p}><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" /></Svg>
);

export const BagIcon = (p: Props) => (
  <Svg {...p}><path d="M5 8h14l-1 12H6L5 8Z" /><path d="M9 8V6.5a3 3 0 0 1 6 0V8" /></Svg>
);

export const PinIcon = (p: Props) => (
  <Svg {...p}><path d="M12 21s6-5.6 6-11a6 6 0 0 0-12 0c0 5.4 6 11 6 11Z" /><circle cx="12" cy="10" r="2.2" /></Svg>
);

export const TruckIcon = (p: Props) => (
  <Svg {...p}><path d="M3 6h11v10H3zM14 9h4l3 3v4h-7" /><circle cx="7" cy="17.5" r="1.8" /><circle cx="17" cy="17.5" r="1.8" /></Svg>
);

export const ShieldIcon = (p: Props) => (
  <Svg {...p}><path d="M12 3 5 6v5c0 4.4 3 8 7 9 4-1 7-4.6 7-9V6l-7-3Z" /><path d="m9 12 2 2 4-4" /></Svg>
);

export const StoreIcon = (p: Props) => (
  <Svg {...p}><path d="M4 9 5.5 4h13L20 9M4 9v11h16V9M4 9a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0A2.7 2.7 0 0 0 20 9" /></Svg>
);

export const BoxIcon = (p: Props) => (
  <Svg {...p}><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" /><path d="m4 7.5 8 4.5 8-4.5M12 12v9" /></Svg>
);

export const GridIcon = (p: Props) => (
  <Svg {...p}><rect x="4" y="4" width="6.5" height="6.5" rx="1" /><rect x="13.5" y="4" width="6.5" height="6.5" rx="1" /><rect x="4" y="13.5" width="6.5" height="6.5" rx="1" /><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1" /></Svg>
);

export const SparkIcon = (p: Props) => (
  <Svg {...p}><path d="M12 4v5M12 15v5M4 12h5M15 12h5" /></Svg>
);

export const MapIcon = (p: Props) => (
  <Svg {...p}><path d="m3 6 6-2 6 2 6-2v14l-6 2-6-2-6 2V6ZM9 4v14M15 6v14" /></Svg>
);

export const HelpIcon = (p: Props) => (
  <Svg {...p}><circle cx="12" cy="12" r="8.5" /><path d="M9.7 9.6a2.4 2.4 0 1 1 3.4 2.2c-.7.4-1.1.9-1.1 1.7M12 16.5v.1" /></Svg>
);
