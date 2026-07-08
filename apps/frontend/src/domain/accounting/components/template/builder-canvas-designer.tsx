'use client';

import { cn } from '@repo/ui';
import {
  AlignLeftIcon,
  CircleIcon,
  ImageIcon,
  MinusIcon,
  MousePointer2Icon,
  PenLineIcon,
  QrCodeIcon,
  SquareIcon,
  Table2Icon,
  TypeIcon,
} from 'lucide-react';
import type { PlacedField } from './builder-types';

interface TemplateBuilderDesignerMockProps {
  fields: PlacedField[];
}

const LEFT_TOOLS = [
  MousePointer2Icon,
  TypeIcon,
  ImageIcon,
  Table2Icon,
  AlignLeftIcon,
  MinusIcon,
  SquareIcon,
  CircleIcon,
  PenLineIcon,
  QrCodeIcon,
];

// Fixed positions (as % of document) for up to 8 overlaid field chips.
// Covers the typical invoice zones: header, billing addresses, table rows, totals.
const FIELD_POSITIONS: { top: string; left?: string; right?: string }[] = [
  { top: '6%', left: '3%' },
  { top: '6%', right: '3%' },
  { top: '22%', left: '3%' },
  { top: '22%', right: '3%' },
  { top: '44%', left: '3%' },
  { top: '58%', left: '3%' },
  { top: '72%', right: '3%' },
  { top: '82%', left: '3%' },
];

function Sep() {
  return <div className="mx-1.5 h-3.5 w-px shrink-0 bg-zinc-600" />;
}

function TBtn({ children }: { children: React.ReactNode }) {
  return (
    <button
      type="button"
      tabIndex={-1}
      className="pointer-events-none shrink-0 select-none rounded border border-zinc-600 bg-zinc-700 px-2 py-px text-[10px] text-zinc-300"
    >
      {children}
    </button>
  );
}

function TLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="shrink-0 select-none text-[10px] text-zinc-500">
      {children}
    </span>
  );
}

export function TemplateBuilderDesignerMock({
  fields,
}: TemplateBuilderDesignerMockProps) {
  return (
    <div className="flex h-full select-none flex-col overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900 text-zinc-300">
      {/* ── Top toolbar ── */}
      <div className="flex shrink-0 items-center gap-1 overflow-x-auto border-b border-zinc-700 bg-zinc-800 px-2 py-1.5">
        {/* Lang */}
        <select
          tabIndex={-1}
          className="pointer-events-none shrink-0 rounded border border-zinc-600 bg-zinc-700 px-1.5 py-px text-[10px] text-zinc-300"
        >
          <option>English</option>
        </select>
        <TBtn>Change PDF</TBtn>
        <Sep />
        <TLabel>Edit</TLabel>
        <TBtn>Static schema</TBtn>
        <TBtn>JSON</TBtn>
        <Sep />
        <TLabel>Project</TLabel>
        <TBtn>Save Project</TBtn>
        <TBtn>Save As</TBtn>
        <TBtn>Reset</TBtn>
        <Sep />
        <TLabel>Preview</TLabel>
        <TBtn>Form/Viewer</TBtn>
        <Sep />
        <TLabel>Output</TLabel>
        <TBtn>Template JSON</TBtn>
        <TBtn>Generate PDF</TBtn>
      </div>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left icon strip */}
        <div className="flex w-9 shrink-0 flex-col items-center gap-0.5 border-r border-zinc-700 bg-zinc-800 py-2">
          {LEFT_TOOLS.map((Icon, i) => (
            <button
              key={i}
              type="button"
              tabIndex={-1}
              className={cn(
                'pointer-events-none flex h-7 w-7 items-center justify-center rounded text-zinc-400',
                i === 0 && 'bg-zinc-600 text-zinc-200',
              )}
            >
              <Icon size={14} />
            </button>
          ))}
        </div>

        {/* Canvas */}
        <div className="relative flex-1 overflow-auto bg-zinc-700 p-6 pt-8">
          {/* Ruler */}
          <div className="pointer-events-none absolute inset-x-9 top-0 z-10 flex h-6 items-end border-b border-zinc-600 bg-zinc-800">
            {Array.from({ length: 14 }).map((_, i) => (
              <div
                key={i}
                className="relative h-2 flex-1 self-end border-r border-zinc-600 last:border-r-0"
              >
                <span className="absolute right-0.5 top-[-11px] text-[8px] text-zinc-500">
                  {(i + 1) * 25}
                </span>
              </div>
            ))}
          </div>

          {/* A4 document */}
          <div
            className="relative mx-auto bg-white shadow-2xl"
            style={{ width: 'min(100%, 480px)', aspectRatio: '1 / 1.414' }}
          >
            <div className="absolute inset-0 p-[6%] text-zinc-800">
              {/* Invoice header */}
              <div className="mb-[4%] flex items-start justify-between">
                <div className="space-y-[2%] text-[9px] text-zinc-500">
                  <div className="flex items-center gap-1">
                    <span className="w-6 font-semibold text-zinc-600">NO.</span>
                    <span className="border border-zinc-300 px-1.5 py-0.5">
                      123456789
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-6 font-semibold text-zinc-600">DUE</span>
                    <span className="border border-zinc-300 px-1.5 py-0.5">
                      02/02/2026
                    </span>
                  </div>
                </div>
                <h1 className="text-[22px] font-black tracking-widest text-zinc-800">
                  INVOICE
                </h1>
              </div>

              <hr className="mb-[3%] border-zinc-200" />

              {/* Billing grid */}
              <div className="mb-[4%] grid grid-cols-2 gap-2 text-[8px] text-zinc-500">
                <div className="space-y-0.5 border border-dashed border-zinc-300 p-2">
                  <div className="mb-0.5 text-[7px] font-semibold uppercase tracking-wider text-zinc-400">
                    Invoice To
                  </div>
                  <div>Thynk Unlimited</div>
                  <div>23 Anywhere St., Any City, ST 12345</div>
                  <div className="text-zinc-400">www.reallygreatsite.com</div>
                </div>
                <div className="space-y-0.5 border border-dashed border-zinc-300 p-2 text-right">
                  <div className="mb-0.5 text-[7px] font-semibold uppercase tracking-wider text-zinc-400">
                    Company
                  </div>
                  <div>Howard Ong</div>
                  <div>23 Anywhere St., Any City, ST 12345</div>
                  <div className="text-zinc-400">hello@reallygreatsite.com</div>
                </div>
              </div>

              {/* Line-items table */}
              <table className="mb-[4%] w-full text-[8px]">
                <thead>
                  <tr className="bg-teal-700 text-white">
                    <th className="px-2 py-1 text-left font-medium">
                      Description
                    </th>
                    <th className="px-2 py-1 text-right font-medium">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}>
                      <td className="border border-zinc-200 px-2 py-1 text-zinc-400">
                        Your Service Description
                      </td>
                      <td className="border border-zinc-200 px-2 py-1 text-right text-zinc-400">
                        $100
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div className="ml-auto w-[38%] text-[8px]">
                <div className="flex justify-between border-b border-zinc-100 py-0.5">
                  <span className="text-zinc-400">Subtotal</span>
                  <span className="border border-zinc-200 px-2 text-zinc-600">
                    $400
                  </span>
                </div>
                <div className="flex justify-between border-b border-zinc-100 py-0.5">
                  <span className="text-zinc-400">Tax (10%)</span>
                  <span className="border border-zinc-200 px-2 text-zinc-600">
                    $40
                  </span>
                </div>
                <div className="flex justify-between py-0.5 font-semibold">
                  <span className="text-zinc-600">TOTAL</span>
                  <span className="border border-zinc-300 bg-zinc-50 px-2 text-zinc-700">
                    $440
                  </span>
                </div>
              </div>

              {/* Watermark */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <span
                  className="select-none text-center text-[13px] font-bold uppercase tracking-widest text-zinc-400/40"
                  style={{ transform: 'rotate(-30deg)', lineHeight: 1.4 }}
                >
                  Mock —<br />
                  pdfme integration
                  <br />
                  not yet wired
                </span>
              </div>

              {/* Placed field overlays */}
              {fields.map((field, i) => {
                const pos = FIELD_POSITIONS[i];
                if (!pos) return null;
                const isUnbound = field.dataSource === null;
                const label =
                  field.dataSource?.replace(/_/g, ' ') ?? 'not linked';
                return (
                  <div
                    key={field.id}
                    style={{ position: 'absolute', ...pos }}
                    className={cn(
                      'rounded border px-1.5 py-0.5 font-mono text-[7px]',
                      isUnbound
                        ? 'border-red-400 bg-red-50 text-red-500'
                        : 'border-teal-400 bg-teal-50 text-teal-700',
                    )}
                  >
                    {label}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right sidebar — pdfme Field List */}
        <div className="flex w-44 shrink-0 flex-col border-l border-zinc-700 bg-zinc-800">
          <div className="flex shrink-0 items-center justify-between border-b border-zinc-700 px-3 py-2">
            <span className="text-[10px] font-semibold text-zinc-200">
              Field List
            </span>
            <span className="text-zinc-500 text-xs">›</span>
          </div>

          <div className="flex-1 overflow-y-auto">
            {fields.length === 0 ? (
              <p className="px-3 py-2 text-[10px] text-zinc-500">
                No fields placed yet
              </p>
            ) : (
              fields.map((field) => {
                const isUnbound = field.dataSource === null;
                const name =
                  field.dataSource ?? `field_${field.id.slice(0, 4)}`;
                return (
                  <div
                    key={field.id}
                    className="flex cursor-default items-center gap-1.5 px-2 py-[5px] text-[10px] hover:bg-zinc-700"
                  >
                    <span className="shrink-0 text-[10px] text-zinc-600">
                      ⠿
                    </span>
                    <span className="shrink-0 rounded bg-zinc-700 px-0.5 text-[8px] text-zinc-400">
                      T
                    </span>
                    <span
                      className={cn(
                        'truncate',
                        isUnbound ? 'text-red-400' : 'text-zinc-300',
                      )}
                    >
                      {name}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
