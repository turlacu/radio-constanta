import { Heading, Body, Button } from './ui';

export default function NewsHeader({
  isSplitScreen = false,
  title = 'Știri',
  subtitle = 'Ultimele noutăți din Dobrogea',
  onBack,
}) {
  const splitShellClass = 'mx-auto w-full max-w-[64rem] px-[clamp(1.15rem,1rem+0.42vw,2.25rem)]';
  const stackedShellClass = 'mx-auto w-full max-w-[96rem] px-[clamp(1rem,0.86rem+0.52vw,2.5rem)]';
  const backSlotClass = 'w-[clamp(2.75rem,2.55rem+0.55vw,3.15rem)]';
  const headerShellClass = isSplitScreen
    ? `${splitShellClass} pr-[clamp(7.4rem,6.4rem+3vw,10rem)] py-[clamp(0.82rem,0.74rem+0.22vw,1.14rem)]`
    : `${stackedShellClass} py-[clamp(0.8rem,0.72rem+0.28vw,1.35rem)]`;

  return (
    <div className="sticky top-0 z-20 isolate overflow-hidden">
      <div className={`absolute inset-0 border-b border-border ${isSplitScreen ? 'bg-bg-secondary' : 'bg-bg-primary'}`} />

      <div className={`relative ${headerShellClass}`}>
        <div className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-[clamp(0.75rem,0.68rem+0.18vw,1rem)]">
          {onBack && (
            <Button
              variant="ghost"
              icon
              size="medium"
              onClick={onBack}
              data-dpad="true"
              data-dpad-group="news"
              data-dpad-action="news-back"
              className={`mt-[clamp(0.1rem,0.08rem+0.04vw,0.16rem)] shrink-0 ${backSlotClass}`}
              aria-label="Go back to news list"
            >
              <svg
                className="h-[clamp(1.1rem,1rem+0.3vw,1.5rem)] w-[clamp(1.1rem,1rem+0.3vw,1.5rem)]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </Button>
          )}
          {!onBack && <div className={backSlotClass} aria-hidden="true" />}

          <div className="min-w-0">
            <Heading
              level={5}
              className={`text-text-primary ${
                isSplitScreen ? 'text-[clamp(1.25rem,1.14rem+0.42vw,2rem)]' : 'text-[clamp(1.5rem,1.32rem+0.78vw,3rem)]'
              }`}
            >
              {title}
            </Heading>
            <Body
              size="small"
              weight="medium"
              opacity="tertiary"
              className={`mt-1 ${isSplitScreen ? 'text-[clamp(0.82rem,0.78rem+0.18vw,1.05rem)]' : 'text-[clamp(0.88rem,0.82rem+0.24vw,1.2rem)]'}`}
            >
              {subtitle}
            </Body>
          </div>
        </div>
      </div>
    </div>
  );
}
