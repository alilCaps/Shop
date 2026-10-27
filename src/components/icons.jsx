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
    <svg {...base} {...props}><path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.500 7-10V6l-7-3Z" /><path d="m9 12 2 2 4-4" /></svg>
);
export const RefreshIcon = (props) => (
    <svg {...base} {...props}><path d="M20 11a8 8 0 0 0-14.5-3.500M4 4v4h4M4 13a8 8 0 0 0 14.500 3.500M20 20v-4h-4" /></svg>
);
export const HeadsetIcon = (props) => (
    <svg {...base} {...props}><path d="M4 14v-2a8 8 0 0 1 16 0v2" /><rect x="3" y="14" width="4" height="6" rx="1.500" /><rect x="17" y="14" width="4" height="6" rx="1.500" /></svg>
);
export const BagIcon = (props) => (
    <svg {...base} {...props}><path d="M5 8h14l-1 12H6L5 8Z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></svg>
);
