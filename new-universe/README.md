# Universe Skill Unlocker

A 3D gamified skill progression experience built with React Three Fiber.

## Features

- **10,000 twinkling stars** — custom GLSL shader starfield
- **8 unique planets** — procedural surface shaders, orbital layout, glowing halos
- **Locked / unlocked states** — padlock icons, emissive auras, floating labels
- **Rocket flight animation** — primitive geometry rocket with glowing trail
- **Unlock sequence** — particle burst, toast notification, treasure chest modal
- **Interactive UI** — OrbitControls, camera zoom, glassmorphism side panel

## Stack

- `@react-three/fiber` + `@react-three/drei`
- `@react-spring/three` (available for extensions)
- `framer-motion` for UI overlays
- `tailwindcss` for panels
- `three.js` primitives & shaders — no external 3D models

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Usage

1. **Planet 0** starts unlocked with the rocket docked
2. Click an unlocked planet to zoom in and view course details
3. Click **Complete Course** to launch the rocket to the next planet
4. Watch the unlock animation — particles, toast, and chest reward
5. Click **Claim Reward** to continue exploring

## Scripts

| Command         | Description          |
| --------------- | -------------------- |
| `npm run dev`   | Start dev server     |
| `npm run build` | Production build     |
| `npm run preview` | Preview production build |
