import { useSettings } from '../contexts/SettingsContext';
import { SCREEN_PROTECTION_TIMEOUTS } from '../utils/screenProtection';
import { Heading, Body } from './ui';

const MODES = [
  { value: 'auto', label: 'Automat' },
  { value: 'text', label: 'Text în mișcare' },
  { value: 'black', label: 'Ecran negru' },
  { value: 'off', label: 'Dezactivat' },
];

export default function ScreenProtectionSettings({ sectionClassName, buttonClassName }) {
  const {
    screenProtectionMode,
    setScreenProtectionMode,
    screenProtectionTimeoutMinutes,
    setScreenProtectionTimeoutMinutes,
  } = useSettings();
  const selectedClass = selected =>
    `${buttonClassName} ${
      selected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
    }`;
  return (
    <div className={sectionClassName}>
      <Heading level={5} className="mb-2">
        Protecție ecran OLED
      </Heading>
      <div className="grid grid-cols-2 gap-2">
        {MODES.map(option => (
          <button
            key={option.value}
            type="button"
            data-dpad="true"
            data-dpad-group="settings"
            aria-pressed={screenProtectionMode === option.value}
            onClick={() => setScreenProtectionMode(option.value)}
            className={selectedClass(screenProtectionMode === option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
      <div className="mt-3 text-sm text-text-secondary">Activare după</div>
      <div
        className="mt-1 grid grid-cols-4 gap-1.5"
        role="group"
        aria-label="Activare protecție ecran după"
      >
        {SCREEN_PROTECTION_TIMEOUTS.map(minutes => (
          <button
            key={minutes}
            type="button"
            data-dpad="true"
            data-dpad-group="settings"
            disabled={screenProtectionMode === 'off'}
            aria-pressed={screenProtectionTimeoutMinutes === minutes}
            onClick={() => setScreenProtectionTimeoutMinutes(minutes)}
            className={`${selectedClass(screenProtectionTimeoutMinutes === minutes)} disabled:opacity-40`}
          >
            {minutes} min
          </button>
        ))}
      </div>
      <Body size="small" opacity="secondary" className="mt-2 text-[11px] leading-tight">
        Modul automat afișează numele postului, apoi un ecran negru după încă 3 minute. Sunetul
        continuă. Apăsați o tastă pentru revenire. Protecția nu acoperă redarea video. Reduce
        afișarea prelungită a elementelor statice; nu oprește fizic ecranul.
      </Body>
    </div>
  );
}
