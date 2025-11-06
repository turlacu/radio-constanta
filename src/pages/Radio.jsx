import RadioPlayer from '../components/RadioPlayer';

export default function Radio({ radioState }) {
  return (
    <div className="
      min-h-screen
      md:min-h-[calc(100vh-100px)]
      tv:min-h-screen
    ">
      <RadioPlayer radioState={radioState} />
    </div>
  );
}
