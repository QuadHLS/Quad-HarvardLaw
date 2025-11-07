import * as React from "react";

const MOBILE_BREAKPOINT = 768;

/**
 * Detects if the user is on a phone (not tablet or desktop)
 * Uses user agent string to identify actual mobile devices
 */
export function isPhone(): boolean {
  if (typeof window === 'undefined') return false;
  
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  
  // Check for phone user agents
  const phoneRegex = /iPhone|iPod|Android.*Mobile|BlackBerry|Windows Phone|webOS|Opera Mini|Mobile|mobile|CriOS/i;
  
  // Exclude tablets (iPad, Android tablets)
  const tabletRegex = /iPad|Android(?!.*Mobile)|Tablet/i;
  
  // If it matches tablet, it's not a phone
  if (tabletRegex.test(userAgent)) {
    return false;
  }
  
  // Check if it's a phone
  return phoneRegex.test(userAgent);
}

/**
 * React hook to detect if user is on a phone
 * Returns true for phones, false for tablets/desktops
 */
export function useIsPhone(): boolean {
  const [isPhoneDevice, setIsPhoneDevice] = React.useState<boolean>(false);

  React.useEffect(() => {
    setIsPhoneDevice(isPhone());
  }, []);

  return isPhoneDevice;
}

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(
    undefined,
  );

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}
