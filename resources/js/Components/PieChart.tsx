export type PieDatum = { name: string; value: number };

/**
 * The statement's spot inks, largest share first. Each clears 4.5:1 on
 * paper, and the legend names every slice, so colour is never the only key.
 */
const PALETTE = [
    'var(--chart-1)',
    'var(--chart-2)',
    'var(--chart-3)',
    'var(--chart-4)',
    'var(--chart-5)',
    'var(--chart-6)',
    'var(--chart-7)',
    'var(--chart-8)',
];

/** A hairline of paper between slices, in radians. */
const GAP = 0.018;

function polar(cx: number, cy: number, r: number, angle: number) {
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)] as const;
}

export default function PieChart({
    data,
    size = 176,
    thickness = 26,
    legendLimit,
    formatValue = (v) => String(v),
    emptyLabel = 'No data yet.',
    label = 'Breakdown',
}: {
    data: PieDatum[];
    size?: number;
    thickness?: number;
    /** List only this many slices in the legend; the chart still draws all. */
    legendLimit?: number;
    formatValue?: (value: number) => string;
    emptyLabel?: string;
    /** What the chart shows, for screen readers. */
    label?: string;
}) {
    const slices = data.filter((d) => d.value > 0);
    const total = slices.reduce((sum, d) => sum + d.value, 0);

    if (total <= 0) {
        return (
            <div
                className="text-ink-2 flex items-center justify-center text-sm"
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

        // Leave a sliver of paper between neighbours, never more than the slice.
        const gap = slices.length > 1 ? Math.min(GAP, (end - start) / 3) : 0;
        const [x1, y1] = polar(radius, radius, r, start + gap / 2);
        const [x2, y2] = polar(radius, radius, r, end - gap / 2);
        const largeArc = end - start - gap > Math.PI ? 1 : 0;

        return {
            name: d.name,
            value: d.value,
            pct: fraction * 100,
            color: PALETTE[i % PALETTE.length],
            path: `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`,
        };
    });

    const isSingle = segments.length === 1;
    const legend = segments.slice(0, legendLimit);
    const unlisted = segments.length - legend.length;

    return (
        <div className="flex flex-wrap items-center gap-x-8 gap-y-5">
            <div
                className="relative shrink-0"
                style={{ width: size, height: size }}
            >
                <svg
                    width={size}
                    height={size}
                    viewBox={`0 0 ${size} ${size}`}
                    role="img"
                    aria-label={`${label} chart`}
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
                        segments.map((s, i) => (
                            <path
                                key={i}
                                d={s.path}
                                fill="none"
                                stroke={s.color}
                                strokeWidth={thickness}
                                strokeLinecap="butt"
                            />
                        ))
                    )}
                </svg>
                <div
                    className="absolute inset-0 grid place-content-center text-center"
                    aria-hidden
                >
                    <span className="label-caps text-ink-2">Total</span>
                    <span className="figures mt-0.5 text-sm font-semibold">
                        {formatValue(total)}
                    </span>
                </div>
            </div>

            <ul className="divide-rule min-w-56 flex-1 divide-y text-sm">
                {legend.map((s, i) => (
                    <li
                        key={i}
                        className="flex items-center justify-between gap-3 py-2 first:pt-0"
                    >
                        <span className="flex min-w-0 items-center gap-2.5">
                            <span
                                className="inline-block size-2.5 shrink-0 rounded-[2px]"
                                style={{ backgroundColor: s.color }}
                                aria-hidden
                            />
                            <span className="truncate">{s.name}</span>
                        </span>
                        <span className="figures flex shrink-0 items-baseline gap-3">
                            <span className="font-medium">
                                {formatValue(s.value)}
                            </span>
                            <span className="text-ink-2 w-12 text-right text-[0.8125rem]">
                                {s.pct.toFixed(1)}%
                            </span>
                        </span>
                    </li>
                ))}
                {unlisted > 0 && (
                    <li className="text-ink-2 py-2 pl-5">+{unlisted} more</li>
                )}
            </ul>
        </div>
    );
}
