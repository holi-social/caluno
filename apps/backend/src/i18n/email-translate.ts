export type EmailTranslate = (
  key: string,
  args?: Record<string, string | number>,
) => string;

export interface EmailTemplateContext {
  t: EmailTranslate;
  formatDateTime: (date: Date) => string;
  formatDate: (date: Date) => string;
  formatTime: (date: Date) => string;
  formatList: (items: string[]) => string;
}
