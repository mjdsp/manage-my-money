import { SVGAttributes } from 'react';

/**
 * The mark: a statement in miniature. A solid issuer band across the top,
 * two printed lines, and the perforation a payment stub tears along.
 */
export default function ApplicationLogo(props: SVGAttributes<SVGElement>) {
    return (
        <svg
            viewBox="0 0 28 28"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden
            {...props}
        >
            <path
                d="M7 3.5h14A1.5 1.5 0 0 1 22.5 5v4h-17V5A1.5 1.5 0 0 1 7 3.5Z"
                fill="currentColor"
            />
            <rect
                x="5.5"
                y="3.5"
                width="17"
                height="21"
                rx="1.5"
                stroke="currentColor"
                strokeWidth="1.8"
            />
            <path
                d="M9.25 13h9.5M9.25 16.25h5.75"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
            />
            <path
                d="M8 20.25h12"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeDasharray="0 3"
            />
        </svg>
    );
}
