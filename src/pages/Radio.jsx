import { useContext } from 'react';
import RadioPlayer from '../components/RadioPlayer';
import { DeviceContext } from '../App';

export default function Radio({ radioState }) {
  const device = useContext(DeviceContext);
  const isSplitScreen = device?.showDualPaneShell;

  return (
    <div className={
      isSplitScreen
        ? "h-full w-full flex items-center justify-center relative z-10" // Split-screen mode: fill entire container and center content, layer above background
        : "min-app-height relative z-10" // Single page mode, layer above background
    }>
      <RadioPlayer radioState={radioState} />
    </div>
  );
}
