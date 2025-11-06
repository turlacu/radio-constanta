import { useContext } from 'react';
import RadioPlayer from '../components/RadioPlayer';
import { DeviceContext } from '../App';

export default function Radio({ radioState }) {
  const device = useContext(DeviceContext);
  const isSplitScreen = device?.screenWidth >= 768;

  return (
    <div className={
      isSplitScreen
        ? "h-full" // Split-screen mode: fill container height
        : "min-h-screen md:min-h-[calc(100vh-100px)] tv:min-h-screen" // Single page mode
    }>
      <RadioPlayer radioState={radioState} />
    </div>
  );
}
