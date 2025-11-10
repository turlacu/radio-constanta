import { useContext } from 'react';
import RadioPlayer from '../components/RadioPlayer';
import { DeviceContext } from '../App';

export default function Radio({ radioState }) {
  const device = useContext(DeviceContext);
  const isSplitScreen = device?.screenWidth >= 768;

  return (
    <div className={
      isSplitScreen
        ? "h-full w-full flex items-center justify-center relative z-10" // Split-screen mode: fill entire container and center content, layer above background
        : "min-h-screen md:min-h-[calc(100vh-100px)] tv:min-h-screen relative z-10" // Single page mode, layer above background
    }>
      <RadioPlayer radioState={radioState} />
    </div>
  );
}
