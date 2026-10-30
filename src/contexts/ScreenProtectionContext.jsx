import { createContext, useContext } from 'react';

export const ScreenProtectionContext = createContext({
  active: false,
  reportVideoPlayback: () => {},
});
export const useScreenProtection = () => useContext(ScreenProtectionContext);

export function ScreenProtectionEffects({ children }) {
  return useScreenProtection().active ? null : children;
}
