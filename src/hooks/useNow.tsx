import { createContext, useContext, useEffect, useState } from 'react';

const TimeContext = createContext<number>(Date.now());

export const TimeProvider = ({ children }: { children: React.ReactNode }) => {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    let handle: number;
    const tick = () => {
      if (document.visibilityState === 'visible') {
        setNow(Date.now());
      }
      handle = window.setTimeout(tick, 1000);
    };
    tick();
    return () => clearTimeout(handle);
  }, []);

  return <TimeContext.Provider value={now}>{children}</TimeContext.Provider>;
};

export const useNow = () => useContext(TimeContext);
