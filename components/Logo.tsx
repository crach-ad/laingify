// Brand mark: lime square with a layered-stack glyph, per the design rework.
export default function Logo({ size = 34 }: { size?: number }) {
  const glyph = Math.round(size * 0.53);
  return (
    <div
      className="flex items-center justify-center"
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.26),
        background: "var(--accent)",
      }}
    >
      <svg width={glyph} height={glyph} viewBox="0 0 24 24" fill="none">
        <path d="M4 7l8-4 8 4-8 4-8-4z" fill="#0A0B0E" />
        <path
          d="M4 12l8 4 8-4M4 17l8 4 8-4"
          stroke="#0A0B0E"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
