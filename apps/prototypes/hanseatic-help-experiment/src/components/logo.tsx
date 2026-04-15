const LOGO_URL = '/logo.png';

export function Logo() {
  return (
    <div className="relative shrink-0 size-20">
      <img
        alt="Hanseatic Help"
        src={LOGO_URL}
        className="size-full object-cover rounded-full"
      />
    </div>
  );
}
