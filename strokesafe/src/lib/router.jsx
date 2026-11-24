/*
  Small client-side router (History API). Kept in-house so the app has no extra dependency;
  the API mirrors React Router (Link, useNavigate, useLocation, useParams), so it can be swapped later.

  Routes are matched in App.jsx with matchPath(). Server/hosting must send index.html for unknown
  paths (vercel.json / public/_redirects do this; Vite dev does it already).
*/
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const RouterContext = createContext(null);

function currentLocation() {
  return { pathname: window.location.pathname, search: window.location.search, state: window.history.state };
}

export function RouterProvider({ children }) {
  const [location, setLocation] = useState(currentLocation);

  useEffect(() => {
    const onPop = () => setLocation(currentLocation());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const navigate = useCallback((to, { replace = false, state = null } = {}) => {
    if (typeof to === "number") {
      window.history.go(to);
      return;
    }
    if (replace) window.history.replaceState(state, "", to);
    else window.history.pushState(state, "", to);
    setLocation(currentLocation());
    const hash = typeof to === "string" && to.includes("#") ? to.split("#")[1] : "";
    if (hash) {
      // In-page section links (e.g. /profile#language): scroll once the page has rendered,
      // also when we are already on that page.
      setTimeout(() => document.getElementById(hash)?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
    } else {
      window.scrollTo({ top: 0 });
    }
  }, []);

  const value = useMemo(() => ({ location, navigate }), [location, navigate]);
  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

export function useNavigate() {
  return useContext(RouterContext).navigate;
}
export function useLocation() {
  return useContext(RouterContext).location;
}
export function useSearchParams() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

/** "/check/q/:id" against "/check/q/Q3" → { id: "Q3" } or null */
export function matchPath(pattern, pathname) {
  const p = pattern.split("/").filter(Boolean);
  const s = pathname.replace(/\/+$/, "").split("/").filter(Boolean);
  if (p.length !== s.length) return null;
  const params = {};
  for (let i = 0; i < p.length; i++) {
    if (p[i].startsWith(":")) params[p[i].slice(1)] = decodeURIComponent(s[i]);
    else if (p[i] !== s[i]) return null;
  }
  return params;
}

export function Link({ to, children, onClick, replace, ...rest }) {
  const navigate = useNavigate();
  return (
    <a
      href={to}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        navigate(to, { replace });
      }}
      {...rest}
    >
      {children}
    </a>
  );
}
