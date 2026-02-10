# SSR (Server-Side Rendering) considerations

This library uses browser-only APIs (Canvas, FileReader, Image, DOM) and `tesseract.js`, so you must avoid running OCR on the server. Two common approaches for Next.js (and other SSR frameworks) are:

- Use `use client` at the top of client-only components (App Router / React Server Components)
- Use dynamic import with `ssr: false` (Pages Router or for components you can't mark `use client`)

Preferred: `use client` (App Router)

If you're authoring a component for the Next.js App Router that uses `CanvasInput`, `ImageInput`, or `useOCR`, add `use client` at the top of that component file so it runs only in the browser:

```tsx
"use client";

import React from 'react';
import { CanvasInput } from '@hoseinh/react-ocr';

export default function ClientCanvas() {
  return <CanvasInput onDetect={(t) => console.log(t)} />;
}
```

Why `use client`?

- It tells Next.js that this file must be rendered on the client; the component and any imported browser-only code (e.g. `tesseract.js`) will not run during server render.

Alternate: dynamic import (Pages Router or conditional load)

```tsx
import dynamic from 'next/dynamic';

const CanvasInput = dynamic(() => import('@hoseinh/react-ocr').then(m => m.CanvasInput), { ssr: false });

export default function Page() {
  return <CanvasInput onDetect={(t) => console.log(t)} />;
}
```