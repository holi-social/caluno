# Design files

Directory for design files in `.pen` format (Pencil).

## Library file

`clippy-design-system.lib.pen` is the source of components for every other design file. It mirrors the existing design system — **still in progress**.

## Creating a new file

When creating a new file, open its design libraries and connect `clippy-design-system.lib.pen`. Files pull their components from the library, not from each other.

## One file per feature

We keep **one file per feature** and hold all of that feature's later stages inside it. (Subject to change.)

## Saving

**Save manually.** Pencil has no autosave yet — unsaved work is lost.
