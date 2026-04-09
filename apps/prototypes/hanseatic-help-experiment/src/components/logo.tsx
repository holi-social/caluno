// Logo image from Figma — replace with a local asset if the URL expires
const LOGO_URL =
  'https://www.figma.com/api/mcp/asset/0e5ad65e-de8b-4413-ad04-ec3b259a8bf6';

export function Logo() {
  return (
    <div className="relative shrink-0 size-12">
      <img
        alt="Hanseatic Help"
        src={LOGO_URL}
        className="size-full object-cover rounded-full"
      />
    </div>
  );
}
