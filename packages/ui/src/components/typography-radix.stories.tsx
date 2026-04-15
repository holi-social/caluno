import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/base/table";
import type { Meta, StoryObj } from "@storybook/react-vite";
import type { CSSProperties, ReactNode } from "react";

type Typography = {
  name: string;
  value: string;
};

const TypographyRow = ({
  value,
  name,
  styleKey,
  children,
}: {
  value: string;
  name: string;
  styleKey: keyof CSSProperties;
  children?: ReactNode;
}) => {
  const style = window.getComputedStyle(document.body);
  const styleValue = style.getPropertyValue(value);
  return (
    <TableRow>
      <TableCell>{name}</TableCell>
      <TableCell>
        {styleValue.split(",").map((v, idx) => (
          <p key={`prop-${idx}`}>{v}</p>
        ))}
      </TableCell>
      <TableCell>
        <div style={{ [styleKey]: styleValue }} className="line-clamp-1">
          {children}
        </div>
      </TableCell>
    </TableRow>
  );
};

/**
 * Typography tokens for the design system.
 */
const meta: Meta<{
  children: string;
  key: keyof CSSProperties;
  property: Typography[];
}> = {
  title: "design/Typography",
  argTypes: {},
  args: {
    children: "Typeface",
  },
  render: (args) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Property</TableHead>
          <TableHead>
            <span className="sr-only">Preview</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {args.property.map(({ name, value }) => (
          <TypographyRow
            key={name}
            name={name}
            value={value}
            styleKey={args.key}
          >
            {args.children}
          </TypographyRow>
        ))}
      </TableBody>
    </Table>
  ),
};

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Font family tokens for the design system.
 */
export const FontFamily: Story = {
  args: {
    key: "fontFamily",
    property: [
      { name: "sans", value: "--font-sans" },
      { name: "serif", value: "--font-serif" },
      { name: "mono", value: "--font-mono" },
    ],
  },
};

/**
 * Font size tokens for the design system.
 */
export const FontSize: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      <p className="text-xs">text-xs</p>
      <p className="text-sm">text-sm</p>
      <p className="text-base">text-base</p>
      <p className="text-lg">text-lg</p>
      <p className="text-xl">text-xl</p>
      <p className="text-2xl">text-2xl</p>
      <p className="text-3xl">text-3xl</p>
      <p className="text-4xl">text-4xl</p>
    </div>
  ),
};

/**
 * Font weight tokens for the design system.
 */
export const FontWeight: Story = {
  args: {
    key: "fontWeight",
    property: [
      { name: "thin", value: "--font-weight-thin" },
      { name: "extralight", value: "--font-weight-extralight" },
      { name: "light", value: "--font-weight-light" },
      { name: "normal", value: "--font-weight-normal" },
      { name: "medium", value: "--font-weight-medium" },
      { name: "semibold", value: "--font-weight-semibold" },
      { name: "bold", value: "--font-weight-bold" },
      { name: "extrabold", value: "--font-weight-extrabold" },
      { name: "black", value: "--font-weight-black" },
    ],
  },
};

/**
 * Letter Spacing tokens for the design system.
 */
export const LetterSpacing: Story = {
  args: {
    key: "letterSpacing",
    property: [
      { name: "tighter", value: "--tracking-tighter" },
      { name: "tight", value: "--tracking-tight" },
      { name: "normal", value: "--tracking-normal" },
      { name: "wide", value: "--tracking-wide" },
      { name: "wider", value: "--tracking-wider" },
      { name: "widest", value: "--tracking-widest" },
    ],
  },
};
