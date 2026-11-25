/* Re-renders when StrokeSafe data on the device changes (same tab or another tab). */
import { useEffect, useRef, useState } from "react";

export function useStored(readFn, deps = []) {
  const fnRef = useRef(readFn);
  fnRef.current = readFn;
  const [value, setValue] = useState(readFn);

  useEffect(() => {
    setValue(fnRef.current());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    const refresh = () => setValue(fnRef.current());
    window.addEventListener("strokesafe:storage", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("strokesafe:storage", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);
  return value;
}
