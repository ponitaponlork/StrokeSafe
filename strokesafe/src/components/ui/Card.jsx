/*
  Card: white rounded box with a soft shadow.
  tone: "white" (default) | "blue" (light-blue section) | "outline"
  Pass `onClick` to make the whole card a large tappable button (e.g. answer options).
  Pass `selected` to show the chosen state (blue border + tick).
*/
import Icon from "./Icon.jsx";

const TONES = {
  white: "bg-white border border-ss-line shadow-ss-card",
  blue: "bg-ss-blue-50 border border-ss-blue-100",
  outline: "bg-white border border-ss-line",
};

export default function Card({ children, tone = "white", onClick, selected = false, className = "", ...rest }) {
  const base = `relative rounded-3xl p-5 ${TONES[tone] ?? TONES.white} ${className}`;

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={selected}
        className={`${base} w-full text-left transition-all duration-150 hover:border-ss-blue-200 active:scale-[0.99] ${
          selected ? "!border-ss-blue ring-2 ring-ss-blue-100" : ""
        }`}
        {...rest}
      >
        {children}
        {selected && (
          <span className="absolute right-4 top-4 grid h-7 w-7 place-items-center rounded-full bg-ss-blue text-white">
            <Icon name="check" className="h-4 w-4" strokeWidth={3} />
          </span>
        )}
      </button>
    );
  }
  return (
    <div className={base} {...rest}>
      {children}
    </div>
  );
}
