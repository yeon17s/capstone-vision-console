import { useEffect } from "react";

function useBattery() {
  useEffect(() => {
    return () => {};
  }, []);
}

export default useBattery;
