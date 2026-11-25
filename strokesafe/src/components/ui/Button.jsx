/*
  Button: large, rounded, easy to tap (minimum 56px tall).
  variants: "primary" (blue), "secondary" (white with border), "soft" (light blue),
            "emergency" (red: use ONLY for emergency actions), "emergencyLight" (white on red screens)
  Pass `href` to render a link (for example "tel:..." for one-tap calling).
*/
import Icon from "./Icon.jsx";
import { Link } from "../../lib/router.jsx";

const VARIANTS = {
  primary: "bg-ss-blue text-white hover:bg-ss-blue-dark shadow-ss-float",
  secondary: "bg-white text-ss-ink border border-ss-line hover:border-ss-blue-200 hover:bg-ss-blue-50",
  soft: "bg-ss-blue-50 text-ss-blue hover:bg-ss-blue-100",
  emergency: "bg-ss-red text-white hover:bg-ss-red-dark shadow-ss-sos",
  emergencyLight: "bg-white text-ss-red hover:bg-ss-red-50",
};

export default function Button({
  children,
  variant = "primary",
  icon,
  iconRight,
  href,
  fullWidth = true,
  size = "lg",
  disabled = false,
  className = "",
  ...rest
}) {
  const sizes = size === "xl" ? "min-h-16 px-6 text-lg" : "min-h-14 px-5 text-base";
  const classes = [
    "ss-btn inline-flex items-center justify-center gap-3 rounded-2xl font-semibold transition-colors duration-150",
    "active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50",
    sizes,
    fullWidth ? "w-full" : "",
    VARIANTS[variant] ?? VARIANTS.primary,
    className,
  ].join(" ");

  const content = (
    <>
      {icon && <Icon name={icon} className="h-6 w-6 shrink-0" />}
      <span>{children}</span>
      {iconRight && <Icon name={iconRight} className="h-5 w-5 shrink-0" />}
    </>
  );

  if (href && !disabled && href.startsWith("/")) {
    // in-app link: no page reload
    return (
      <Link to={href} className={classes} {...rest}>
        {content}
      </Link>
    );
  }
  if (href && !disabled) {
    return (
      <a href={href} className={classes} {...rest}>
        {content}
      </a>
    );
  }
  return (
    <button type="button" className={classes} disabled={disabled} {...rest}>
      {content}
    </button>
  );
}
