import RadioPlayer from '../components/RadioPlayer';

export default function Radio({ radioState }) {
  return (
    <div className="min-h-screen">
      <RadioPlayer radioState={radioState} />
    </div>
  );
}
