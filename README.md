# Pokemon Office

A fun network presence visualizer that shows who's in the office using Pokemon-style characters. When devices connect to your local network, they appear as animated characters that walk to desks.

## Features

- Real-time network scanning to detect devices
- Pokemon-style placeholder characters with walking animations
- A* pathfinding for characters walking to their desks
- WebSocket for live updates
- Persistent device-to-character mapping

## Quick Start

```bash
npm install
npm run dev
```

- Server runs at http://localhost:3001
- Client runs at http://localhost:5173

## Screenshots

Characters walk from the entrance to their assigned desks when devices connect to the network.

## Tech Stack

- **Backend**: Node.js, Express, WebSocket
- **Frontend**: Phaser 3, EasyStar.js (A* pathfinding)
- **Build**: Vite, TypeScript
