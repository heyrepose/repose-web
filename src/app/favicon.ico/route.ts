import { NextResponse } from "next/server";

// Vercel will 404 `/favicon.ico` if there is no file in `public/`.
// We return a lightweight SVG for the favicon URL so the request always succeeds.
const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="#264A2E"/>
  <text x="32" y="43" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="30" fill="#F3EBDE" font-weight="700">R</text>
</svg>`;

export async function GET() {
  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      // Encourage caching; safe because the favicon is brand-level static.
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}

