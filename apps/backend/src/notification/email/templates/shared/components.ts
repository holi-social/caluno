import { emailTheme } from './theme';
import { escapeHtml } from './utils';

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

/** Emphasized inline text with email-client-safe styling. */
export function strong(content: string): string {
  return `<strong style="color:${colors.ink};font-weight:700">${content}</strong>`;
}

/** Primary body copy. */
export function paragraph(
  content: string,
  options: Pick<TextOptions, 'padding'> = {},
): string {
  return text(content, {
    color: colors.muted,
    padding: options.padding ?? '0 0 24px',
  });
}

/** Small supporting copy for role or status notes. */
export function note(content: string): string {
  return text(content, {
    size: '14px',
    color: colors.muted,
    padding: '0',
  });
}

/** Label/value pair for compact transactional details. */
export function detailItem(
  label: string,
  value: string,
  options: { last?: boolean } = {},
): string {
  return text(`${strong(label)}<br />${value}`, {
    color: colors.muted,
    padding: options.last ? '0 0 24px' : '0 0 12px',
  });
}

export type DetailTableRow =
  | { kind: 'pair'; label: string; value: string }
  | { kind: 'block'; label: string; value: string };

const detailTableLabelStyle = [
  'padding:8px 20px 8px 0',
  'font-size:14px',
  'font-weight:600',
  `color:${colors.ink}`,
  'vertical-align:top',
  'width:108px',
  'white-space:nowrap',
].join(';');

const detailTableValueStyle = [
  'padding:8px 0',
  'font-size:14px',
  `color:${colors.muted}`,
  'vertical-align:top',
  'line-height:1.5',
].join(';');

/** Compact two-column table for transactional metadata. */
export function detailTable(rows: DetailTableRow[]): string {
  if (rows.length === 0) {
    return '';
  }

  const tableRows = rows
    .map((row, index) => {
      const border =
        index < rows.length - 1
          ? `border-bottom:1px solid ${colors.border};`
          : '';

      if (row.kind === 'block') {
        return `<tr style="${border}">
          <td colspan="2" style="padding:12px 0 8px;font-size:14px;vertical-align:top;">
            <div style="font-weight:600;color:${colors.ink};margin-bottom:6px;">${row.label}</div>
            <div style="color:${colors.muted};line-height:1.55;">${row.value}</div>
          </td>
        </tr>`;
      }

      return `<tr style="${border}">
        <td style="${detailTableLabelStyle}">${row.label}</td>
        <td style="${detailTableValueStyle}">${row.value}</td>
      </tr>`;
    })
    .join('');

  return `<mj-table padding="0 0 20px" font-size="14px" color="${colors.muted}" cellpadding="0" cellspacing="0" width="100%">
    ${tableRows}
  </mj-table>`;
}

export interface HeadingOptions {
  size?: string;
  padding?: string;
  letterSpacing?: string;
  color?: string;
}

/** Section heading. */
export function heading(content: string, options: HeadingOptions = {}): string {
  const {
    size = '26px',
    padding = '0 0 12px',
    letterSpacing = '-0.02em',
    color = colors.ink,
  } = options;

  return text(content, {
    size,
    weight: 700,
    color,
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
  const { href, label, padding = '0 0 24px' } = options;

  return `<mj-button href="${href}" background-color="${colors.primary}" color="${colors.onBrand}" font-size="16px" font-weight="600" border-radius="8px" inner-padding="14px 28px" align="left" padding="${padding}">${label}</mj-button>`;
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
  const marker = `<span style="color:${colors.primary};font-weight:700">${index}.</span>`;
  return text(`${marker}&nbsp;&nbsp;${content}`, { padding });
}

export interface ShiftCardOptions {
  href: string;
  /** The shift's cover image — falls back to a flat tinted block when null, matching the frontend card's no-image state. */
  imageUrl: string | null;
  title: string;
  subtitle: string;
  /** Extra line for row-specific context, rendered as a pill badge — e.g. why a shift needs volunteers. */
  meta?: string;
  /** Omits the bottom margin — pass for the last card in a stack. */
  last?: boolean;
}

const SHIFT_CARD_IMAGE_HEIGHT = '120px';

/**
 * A clickable shift card mirroring the frontend's volunteering-side shift
 * cards: a cover image banner (or a flat tinted fallback when the shift has
 * none) above a title, a subtitle line (org/date), and an optional reason
 * pill — the whole card is one link.
 */
export function shiftCard(options: ShiftCardOptions): string {
  const { href, imageUrl, title, subtitle, meta, last = false } = options;
  const marginBottom = last ? '0' : '12px';

  const imageBlock = imageUrl
    ? `<img src="${escapeHtml(imageUrl)}" width="600" alt="" style="display:block;width:100%;height:${SHIFT_CARD_IMAGE_HEIGHT};object-fit:cover;background-color:${colors.border};" />`
    : `<div style="width:100%;height:${SHIFT_CARD_IMAGE_HEIGHT};background-color:${colors.bg};"></div>`;

  const metaBadge = meta
    ? `<span style="display:inline-block;background-color:${colors.primarySoft};color:${colors.primaryText};border-radius:9999px;padding:3px 10px;font-size:12px;font-weight:600;margin-top:8px;">${meta}</span>`
    : '';

  return text(
    `<a href="${href}" style="text-decoration:none;display:block;border:1px solid ${colors.border};border-radius:12px;overflow:hidden;margin:0 0 ${marginBottom};">
      ${imageBlock}
      <div style="padding:12px 14px 14px;">
        <div style="font-weight:600;color:${colors.ink};font-size:15px;line-height:1.4;">${title}</div>
        <div style="color:${colors.muted};font-size:13px;line-height:1.4;margin-top:2px;">${subtitle}</div>
        ${metaBadge}
      </div>
    </a>`,
    { padding: '0' },
  );
}

/**
 * A bordered content card section. Most transactional emails put their primary
 * content inside one of these.
 */
export function card(content: string): string {
  return `
    <mj-section background-color="${colors.surface}" border="1px solid ${colors.border}" border-radius="12px" padding="32px 28px 28px">
      <mj-column>
        ${content}
      </mj-column>
    </mj-section>
  `;
}
