// Small outline icons (inherit colour from the surrounding text).
const base = {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true
};

export const SearchIcon = (props) => (
    <svg {...base} {...props}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
);
export const HeartIcon = ({ filled, ...props }) => (
    <svg {...base} {...props} fill={filled ? "currentColor" : "none"}>
        <path d="M12 20s-7-4.4-9-9.2C1.8 7.6 3.6 4.5 6.9 4.5c1.8 0 3.2.9 5.1 3 1.9-2.1 3.3-3 5.1-3 3.3 0 5.1 3.1 3.9 6.3C19 15.6 12 20 12 20Z" />
    </svg>
);
export const CartIcon = (props) => (
    <svg {...base} {...props}><path d="M3 4h2.2l2 11h10.2l1.8-7.5H6" /><circle cx="9" cy="19.5" r="1.3" /><circle cx="17" cy="19.5" r="1.3" /></svg>
);
export const ArrowRight = (props) => (
    <svg {...base} {...props}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);
export const TruckIcon = (props) => (
    <svg {...base} {...props}><path d="M2 6h11v10H2zM13 10h4l3 3v3h-7" /><circle cx="6.5" cy="17.5" r="1.7" /><circle cx="16.5" cy="17.5" r="1.7" /></svg>
);
export const ShieldIcon = (props) => (
    <svg {...base} {...props}><path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6l-7-3Z" /><path d="m9 12 2 2 4-4" /></svg>
);
export const RefreshIcon = (props) => (
    <svg {...base} {...props}><path d="M20 11a8 8 0 0 0-14.5-3.5M4 4v4h4M4 13a8 8 0 0 0 14.5 3.5M20 20v-4h-4" /></svg>
);
export const HeadsetIcon = (props) => (
    <svg {...base} {...props}><path d="M4 14v-2a8 8 0 0 1 16 0v2" /><rect x="3" y="14" width="4" height="6" rx="1.5" /><rect x="17" y="14" width="4" height="6" rx="1.5" /></svg>
);
export const BagIcon = (props) => (
    <svg {...base} {...props}><path d="M5 8h14l-1 12H6L5 8Z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></svg>
);

export const ArrowLeft = (props) => (
    <svg {...base} {...props}><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
);
export const GridIcon = (props) => (
    <svg {...base} {...props}><rect x="3" y="3" width="7.5" height="7.5" rx="1.5" /><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5" /><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5" /><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5" /></svg>
);
export const UserIcon = (props) => (
    <svg {...base} {...props}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>
);
export const UsersIcon = (props) => (
    <svg {...base} {...props}><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><circle cx="17" cy="9" r="2.5" /><path d="M17.5 14a5 5 0 0 1 4 5" /></svg>
);
export const StoreIcon = (props) => (
    <svg {...base} {...props}><path d="m3 9 1.5-5h15L21 9" /><path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0" /><path d="M5 12v8h14v-8M10 20v-5h4v5" /></svg>
);
export const PackageIcon = (props) => (
    <svg {...base} {...props}><path d="m12 3-9 4.5v9L12 21l9-4.5v-9L12 3Z" /><path d="m3 7.5 9 4.5 9-4.5M12 12v9" /></svg>
);
export const ClipboardIcon = (props) => (
    <svg {...base} {...props}><rect x="5" y="4" width="14" height="17" rx="2" /><rect x="9" y="2" width="6" height="4" rx="1" /><path d="M9 11h6M9 15h6" /></svg>
);
export const MapPinIcon = (props) => (
    <svg {...base} {...props}><path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21Z" /><circle cx="12" cy="9.5" r="2.5" /></svg>
);
export const CreditCardIcon = (props) => (
    <svg {...base} {...props}><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20M6 15h4" /></svg>
);
export const BellIcon = (props) => (
    <svg {...base} {...props}><path d="M6 16v-5a6 6 0 0 1 12 0v5l2 2H4l2-2Z" /><path d="M10 21a2 2 0 0 0 4 0" /></svg>
);
export const TagIcon = (props) => (
    <svg {...base} {...props}><path d="M3 12V4h8l10 10-8 8L3 12Z" /><circle cx="7.5" cy="8.5" r="1.2" /></svg>
);
export const SettingsIcon = (props) => (
    <svg {...base} {...props}><path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1" /><circle cx="15" cy="6" r="2" /><circle cx="9" cy="12" r="2" /><circle cx="17" cy="18" r="2" /></svg>
);
export const LogoutIcon = (props) => (
    <svg {...base} {...props}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></svg>
);
export const StarIcon = ({ filled = true, ...props }) => (
    <svg {...base} {...props} fill={filled ? "currentColor" : "none"}>
        <path d="m12 3 2.7 5.9 6.3.8-4.7 4.3 1.3 6.4L12 17.2l-5.6 3.2 1.3-6.4L3 9.7l6.3-.8L12 3Z" />
    </svg>
);
export const CheckIcon = (props) => (
    <svg {...base} {...props}><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
);
export const LockIcon = (props) => (
    <svg {...base} {...props}><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
);
export const ChartIcon = (props) => (
    <svg {...base} {...props}><path d="M5 20v-9M12 20V4M19 20v-6" /></svg>
);
export const ClockIcon = (props) => (
    <svg {...base} {...props}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
);
export const PesoIcon = (props) => (
    <svg {...base} {...props}><path d="M8 20V5h5a3.5 3.5 0 0 1 0 7H8M6 8.5h10M6 11h10" /></svg>
);
export const HomeIcon = (props) => (
    <svg {...base} {...props}><path d="m3 11 9-8 9 8M5 10v10h14V10M10 20v-6h4v6" /></svg>
);
export const ImageIcon = (props) => (
    <svg {...base} {...props}><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="1.8" /><path d="m21 16-5-5-9 9" /></svg>
);
export const TrashIcon = (props) => (
    <svg {...base} {...props}><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6" /></svg>
);
export const EditIcon = (props) => (
    <svg {...base} {...props}><path d="m4 20 1-4L16.5 4.5a2.1 2.1 0 0 1 3 3L8 19l-4 1Z" /></svg>
);
export const XIcon = (props) => (
    <svg {...base} {...props}><path d="m6 6 12 12M18 6 6 18" /></svg>
);
export const GiftIcon = (props) => (
    <svg {...base} {...props}><rect x="3" y="8" width="18" height="4" rx="1" /><path d="M5 12v9h14v-9M12 8v13" /><path d="M12 8H7.5a2.5 2.5 0 1 1 0-5C10 3 12 8 12 8Zm0 0h4.5a2.5 2.5 0 1 0 0-5C14 3 12 8 12 8Z" /></svg>
);
export const InboxIcon = (props) => (
    <svg {...base} {...props}><path d="m3 13 3-8h12l3 8v6H3v-6Z" /><path d="M3 13h5l1 2h6l1-2h5" /></svg>
);
export const MessageIcon = (props) => (
    <svg {...base} {...props}><path d="M4 5h16v11H9l-5 4V5Z" /></svg>
);
export const CogIcon = SettingsIcon;
