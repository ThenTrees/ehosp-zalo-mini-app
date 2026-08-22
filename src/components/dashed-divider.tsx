export function DashedDivider() {
  return (
    <div className="flex flex-col justify-end self-stretch pt-2">
      <svg
        width="100%"
        height="100%"
        preserveAspectRatio="none"
        viewBox="0 0 311 1"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ overflow: 'visible' }}
      >
        <path d="M0 0.5H311" stroke="#CCCCCC" strokeDasharray="4 8" />
      </svg>
    </div>
  );
}
