# AGENTS.md

## Project Overview

**Rewear Studio** (`clothing-photo-studio`) is an AI-powered photo editing application designed for secondhand and marketplace sellers on eBay, Vinted, Poshmark, and Depop. It transforms flat-lay clothing photos into clean, professional marketplace listings by smoothing creases, boosting authentic wood floor contrast, and cleaning edge clutter while strictly preserving garment wear, tags, and authentic branding.

### Application Domain & Features
- **One-Click AI Enhancement**: Streams garments and balances daylight floor contrast via Google Gemini API (`/api/edit`).
- **Interactive Inspection**: Real-time draggable comparison slider and side-by-side split view.
- **Client-Side Optimization**: Automatic 2K downscaling and Canvas JPEG compression (< 3.5 MB) to remain strictly within cloud serverless payload limits.
- **Clipboard & Drag-and-Drop**: Direct `Cmd+V` / `Ctrl+V` paste support and intuitive drag-and-drop.
- **Privacy-First**: Direct in-memory image processing; no user images are stored to disk or databases.

---

## Setup Commands

```bash
# Install dependencies
yarn install

# Start development server (Vite on :5173 + API proxy to backend on :8787)
yarn dev

# Run automated tests
yarn test

# Type-check and production build
yarn build

# Start production server
yarn start
```

---

## Project Structure

The project implements a feature-based architecture (Bulletproof React pattern):

```
src/
├── app/              # Application layer (app, provider, router, routes)
│   ├── routes/       # Route-level page components (studio-route.tsx)
│   ├── app.tsx       # Root application component
│   ├── provider.tsx  # Global AppProvider and ErrorBoundary
│   └── router.tsx    # App router and layout coordinator
├── assets/           # Static media assets, icons, fonts
├── components/       # Shared UI components across the application
│   ├── feedback/     # ErrorToast, StatusPill
│   └── ui/           # Shared UI primitives (Icon)
├── config/           # Global configurations and constants
│   ├── constants.ts  # Upload limits, dimensions, supported MIME types
│   └── env.ts        # API endpoints and application metadata
├── features/         # Self-contained feature modules
│   └── studio/       # Clothing photo studio core feature
│       ├── components/ # Dropzone, SliderView, SplitView, StageActions, etc.
│       ├── hooks/      # usePhotoStudio, useSliderComparison, useServerStatus
│       └── index.ts    # Feature public API
├── hooks/            # Application-wide reusable React hooks
│   ├── use-clipboard-paste.ts # Global paste listener with stable ref
│   └── use-object-url.ts      # ObjectURL lifecycle & memory cleanup hook
├── lib/              # Preconfigured service clients
│   └── api-client.ts # Server status and photo edit API client
├── stores/           # Global application state stores
├── testing/          # Test utilities and mock generators
│   └── mocks.ts      # Mock status responses and image generators
├── types/            # Shared TypeScript types and interfaces
│   └── studio.ts     # Domain types (IconName, ViewMode, ServerStatus)
└── utils/            # Pure utility functions
    ├── error.ts      # HTTP and API error parser
    ├── format.ts     # File size and filename formatters
    └── image.ts      # Image loading, canvas resizing, and JPEG export
```

### Feature Colocation Rule
Each feature in `src/features/*` is self-contained. Subdirectories follow:
- `components/`: Feature-specific UI components
- `hooks/`: Feature-specific state and interaction hooks
- `types/`: Feature-specific TypeScript declarations
- `index.ts`: Feature public exports

---

## Code Standards & Conventions

### Critical Project Rules
1. **No `React.FC` or `FC<Props>`**: Always define normal props interfaces:
   ```tsx
   // Correct
   interface DropzoneProps {
     busy: boolean;
     onFileSelect: (file: File) => void;
   }
   export function Dropzone({ busy, onFileSelect }: DropzoneProps) { ... }

   // Incorrect: export const Dropzone: React.FC<DropzoneProps> = ...
   ```
2. **No `handle*` Event Naming**: Never prefix event handlers or props with `handle`. Always use `on*` or descriptive action verbs:
   ```tsx
   // Correct
   onPress, onFileSelect, onResetPhoto, onConvertPhoto, onDismiss

   // Incorrect
   handlePress, handleFileSelect, handleReset, handleSubmit
   ```
3. **Custom Hooks Over Inline `useEffect`s**:
   - Extract stateful logic, subscriptions, and DOM event listeners into dedicated custom hooks (`useObjectUrl`, `useClipboardPaste`, `useSliderComparison`, `useServerStatus`).
   - Do not litter components with raw `useEffect` blocks.
4. **Vercel React Best Practices**:
   - **Calculate derived state during render** (`rerender-derived-state-no-effect`): Compute URLs, filenames, and flags during render instead of syncing via effects.
   - **Explicit conditional rendering** (`rendering-conditional-render`): Use `condition ? <Component /> : null` instead of `&&` when dealing with numbers or falsy values.
   - **Avoid barrel-file import bloat** (`bundle-barrel-imports`): Prefer direct, tree-shakeable imports.
   - **Use `useRef` for transient values** (`rerender-use-ref-transient-values`): Store active dragging flags, file selections, and abort controllers in refs.
   - **Hoist static objects and JSX** (`rendering-hoist-jsx`): SVG path dictionaries, default configurations, and constants must be hoisted outside component bodies.

### TypeScript
- Strict mode enabled (`tsc --noEmit`).
- Absolute import alias `@/*` maps to `./src/*` (e.g., `@/components/ui/icon`, `@/utils/image`).
- Define types and interfaces before implementation.

### Naming Conventions
- **Files & Folders**: `kebab-case.ts` / `kebab-case.tsx`
- **React Components**: `PascalCase`
- **Functions & Hooks**: `camelCase`, hooks prefixed with `use` (e.g. `usePhotoStudio`)
- **Constants**: `SCREAMING_SNAKE_CASE`

---

## Styling Architecture

- **Vanilla CSS (`src/styles.css`)**: Native CSS for speed, control, and zero runtime overhead.
- **Curated Theme**: Dark theme with tailored HSL variables, glassmorphic cards (`rgba(255, 255, 255, 0.04)`), luminous accents, and smooth transitions.
- **Accessible & Responsive**: Keyboard navigability (`tabIndex`, enter/space activation on dropzone), mobile-friendly layouts, and pointer capture for slider dragging.

---

## State Management & Custom Hooks

- **Image URL Lifecycle (`useObjectUrl`)**: Creates `URL.createObjectURL(blob)` and automatically revokes it on change or unmount, preventing memory leaks without manual component effects.
- **Clipboard Management (`useClipboardPaste`)**: Manages `paste` listeners on `window` using a stable ref callback (`advanced-use-latest`), preventing listener re-registration on re-render.
- **Slider Interaction (`useSliderComparison`)**: Manages the before/after slider divider using HTML5 pointer capture on pointer down/move/up.
- **Server Health (`useServerStatus`)**: Manages `/api/status` polling, connection indicator state, and retry functions.
- **Photo Workflow (`usePhotoStudio`)**: Coordinates image selection, client-side preparation, API conversion, error handling, and sample toggling.

---

## Image Processing & API Pipeline

### Client-Side Preparation (`src/utils/image.ts`)
1. **Validation**: Check against allowed types (`image/jpeg`, `image/png`, `image/webp`) and size limits (< 20 MB).
2. **Dimension Constraints**: If width or height exceeds 2048px, rescale proportionally on an offscreen `<canvas>` to maintain crisp 2K resolution.
3. **Payload Compression**: Export to JPEG at 0.9 quality if size exceeds 3.5 MB to strictly stay within cloud serverless request limits (4.5 MB).

### Server Communication (`src/lib/api-client.ts`)
- **`/api/status`**: GET request to verify Gemini API key configuration.
- **`/api/edit`**: POST multipart request (`FormData`) sending `image` and `mode` (`natural`).
- **Cancellation**: Managed via `AbortController` passed to API fetch calls.

---

## Testing Strategy

- **Backend & Integration Tests**: Executed using Node's built-in test runner:
  ```bash
  yarn test
  ```
  Validates prompt safety, size limit rejections, API timeouts, static route security, and image format constraints.
- **Type Checking**:
  ```bash
  yarn build  # Runs tsc --noEmit && vite build
  ```
- **Test Utilities (`src/testing/mocks.ts`)**:
  Provides mock image generators and server response fixtures.

---

## Key Tech Stack

- **React 19**: Modern concurrent React (`react@19.3.0`, `react-dom@19.3.0`).
- **TypeScript 7**: Strict compilation (`typescript@7.0.2`).
- **Vite 8**: Client bundler with fast HMR (`vite@8.3.4`, `@vitejs/plugin-react@6.1.2`).
- **Node.js**: HTTP backend (`server/app.mjs`) & Vercel Serverless Function (`api/edit.js`).
- **Google Gemini API**: Multimodal editing model (`gemini-nano-banana-2.1`).
