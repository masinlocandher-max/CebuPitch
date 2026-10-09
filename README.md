# Cebu AI Readiness Initiative

A presentation-first microsite for the proposed Cebu × Cognita AI Readiness Initiative.

## Purpose

This is not positioned as a generic AI seminar or single-tool training package. The presentation proposes a measurable Cebu AI Readiness Initiative that begins with a jointly designed pilot, uses Cognita as the capability-building engine, and can evolve into a public-facing Cebu AI Readiness Hub.

## Run locally

No build step is required. Serve the folder with any static server, for example:

```
python3 -m http.server 8000
```

Then open http://localhost:8000. Opening `index.html` directly from disk still shows the full presentation, but browsers block the 3D layer's JavaScript module on `file://` URLs, so it falls back to the flat design.

## 3D layer

`scene3d.js` renders a single WebGL particle field behind the slide content using Three.js (vendored in `vendor/`, MIT licence). Each particle stands for a person. As the presentation scrolls, the field regroups into a formation for each scene: scattered individuals, the opportunity gap, a field of jobs with roughly one in four lit, the six capabilities, the eight-stage engine, the five-step roadmap, and finally one unified form.

- Particles change colour exactly at section edges so they read on dark, light, and blue scenes.
- Without WebGL, the page keeps its original 2D design. With reduced motion turned on, ambient drift and camera parallax are switched off.

## Presentation controls

- Arrow keys / Page Up / Page Down / Space: navigate
- `F`: fullscreen
- On-screen arrows: navigate
- Sources: opens evidence drawer
- Final CTA: opens proposed pilot next steps

## Deployment

Static deploy compatible with Vercel, Netlify, GitHub Pages, Cloudflare Pages, or any static web host.

## Evidence base

The site links directly to official/public sources from the International Labour Organization, Department of Trade and Industry, and Development Academy of the Philippines. Source inclusion does not imply endorsement of Cognita.
