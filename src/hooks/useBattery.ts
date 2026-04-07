import { useEffect } from "react";

function useBattery(): void {
  useEffect(() => {
    return () => {};
  }, []);
}

export default useBattery;
