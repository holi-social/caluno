# UI

React component library for use in web apps.

- React components based on shadcn
- Tailwind incl. theming providing by next-themes
- Storybook for viewing and documenting the components

## Adding a new component

To add a component use the shadcn client to add the component and to add it's related Story.

1. Use: `bunx --bun shadcn@latest add [component name]` to add the component
2. Then use `bunx --bun shadcn@latest add @storybook/[component name]-story` to add the related Story for the component.
3. Export component by adding to src/index.ts file

### Manual follow-up steps for the Story
1. Modify the Story, change `import type { Meta, StoryObj }` from `"@storybook/react-vite";` to `"@storybook/react-vite";`
2. Move story file to src/components/base. So it's next to the component.

You can also ask your Agent to add the component. It will add the component, story and perform manual fix-ups. E.g. "add button shadcn component to ui package"
