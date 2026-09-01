export type PieDatum = { name: string; value: number };

/** Distinct, colour-blind-friendly-ish palette; slices cycle through it. */
const PALETTE = [
    '#0ea5e9',
    '#f97316',
    '#8b5cf6',
    '#10b981',
    '#ef4444',
    '#eab308',
    '#ec4899',
    '#14b8a6',
    '#6366f1',
    '#84cc16',
    '#f43f5e',
    '#06b6d4',
];

function polar(cx: number, cy: number, r: number, angle: number) {
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)] as const;
}

export default function PieChart({
    data,
    size = 176,
    thickness = 32,
    formatValue = (v) => String(v),
    emptyLabel = 'No data yet.',
}: {
    data: PieDatum[];
    size?: number;
    thickness?: number;
    formatValue?: (value: number) => string;
    emptyLabel?: string;
}) {
    const slices = data.filter((d) => d.value > 0);
    const total = slices.reduce((sum, d) => sum + d.value, 0);

    if (total <= 0) {
        return (
            <div
                className="flex items-center justify-center text-sm text-gray-400"
                style={{ minHeight: size }}
            >
                {emptyLabel}
            </div>
        );
    }

    const radius = size / 2;
    const r = radius - thickness / 2;
    let angle = -Math.PI / 2;

    const segments = slices.map((d, i) => {
        const fraction = d.value / total;
        const start = angle;
        const end = angle + fraction * Math.PI * 2;
        angle = end;

        const [x1, y1] = polar(radius, radius, r, start);
        const [x2, y2] = polar(radius, radius, r, end);
        const largeArc = end - start > Math.PI ? 1 : 0;

        return {
            name: d.name,
            value: d.value,
            pct: fraction * 100,
            color: PALETTE[i % PALETTE.length],
            path: `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`,
        };
    });

    const isSingle = segments.length === 1;

    return (
        <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
            <svg
                width={size}
                height={size}
                viewBox={`0 0 ${size} ${size}`}
                className="shrink-0"
                role="img"
                aria-label="Pie chart"
            >
                {isSingle ? (
                    <circle
                        cx={radius}
                        cy={radius}
                        r={r}
                        fill="none"
                        stroke={segments[0].color}
                        strokeWidth={thickness}
                    />
                ) : (
                    segments.map((s) => (
                        <path
                            key={s.name}
                            d={s.path}
                            fill="none"
                            stroke={s.color}
                            strokeWidth={thickness}
                            strokeLinecap="butt"
                        />
                    ))
                )}
            </svg>

            <ul className="min-w-48 flex-1 space-y-1.5 text-sm">
                {segments.map((s) => (
                    <li
                        key={s.name}
                        className="flex items-center justify-between gap-3"
                    >
                        <span className="flex min-w-0 items-center gap-2">
                            <span
                                className="inline-block size-2.5 shrink-0 rounded-sm"
                                style={{ backgroundColor: s.color }}
                            />
                            <span className="truncate">{s.name}</span>
                        </span>
                        <span className="shrink-0 text-gray-600 tabular-nums">
                            {formatValue(s.value)} · {s.pct.toFixed(1)}%
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
}
