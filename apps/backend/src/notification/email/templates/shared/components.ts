import { emailTheme } from './theme';

const { colors } = emailTheme;

export interface TextOptions {
  size?: string;
  weight?: string | number;
  color?: string;
  align?: 'left' | 'center' | 'right';
  padding?: string;
  letterSpacing?: string;
  lineHeight?: string;
}

/** Generic text block. Headings are just text with a heavier weight. */
export function text(content: string, options: TextOptions = {}): string {
  const {
    size = '16px',
    weight = '400',
    color = colors.ink,
    align,
    padding = '0',
    letterSpacing,
    lineHeight,
  } = options;

  const attrs = [
    `font-size="${size}"`,
    `font-weight="${weight}"`,
    `color="${color}"`,
    `padding="${padding}"`,
  ];
  if (align) attrs.push(`align="${align}"`);
  if (letterSpacing) attrs.push(`letter-spacing="${letterSpacing}"`);
  if (lineHeight) attrs.push(`line-height="${lineHeight}"`);

  return `<mj-text ${attrs.join(' ')}>${content}</mj-text>`;
}

export interface HeadingOptions {
  size?: string;
  padding?: string;
  letterSpacing?: string;
}

/** Section heading. */
export function heading(content: string, options: HeadingOptions = {}): string {
  const {
    size = '26px',
    padding = '0 0 12px',
    letterSpacing = '-0.02em',
  } = options;

  return text(content, {
    size,
    weight: 700,
    padding,
    letterSpacing,
    lineHeight: '1.25',
  });
}

export interface ButtonOptions {
  href: string;
  label: string;
  padding?: string;
}

/** Primary call-to-action button. */
export function button(options: ButtonOptions): string {
  const { href, label, padding = '0 0 32px' } = options;

  return `<mj-button href="${href}" background-color="${colors.greenDark}" color="${colors.onBrand}" font-size="16px" font-weight="600" border-radius="8px" inner-padding="14px 28px" align="left" padding="${padding}">${label}</mj-button>`;
}

/** Horizontal rule. */
export function divider(padding = '0 0 24px'): string {
  return `<mj-divider border-color="${colors.border}" border-width="1px" padding="${padding}" />`;
}

/** A single entry in an ordered, branded "next steps" list. */
export function orderedListItem(
  index: number,
  content: string,
  options: { last?: boolean } = {},
): string {
  const padding = options.last ? '0' : '0 0 12px';
  const marker = `<span style="color:${colors.green};font-weight:700">${index}.</span>`;
  return text(`${marker}&nbsp;&nbsp;${content}`, { padding });
}

/**
 * A bordered content card section. Most transactional emails put their primary
 * content inside one of these.
 */
export function card(content: string): string {
  return `
    <mj-section background-color="${colors.surface}" border="1px solid ${colors.border}" border-radius="12px" padding="40px 32px 32px">
      <mj-column>
        ${content}
      </mj-column>
    </mj-section>
  `;
}
