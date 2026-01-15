# Pokemon Office - Network Presence Visualizer

## Project Overview

A fun office visualization tool that monitors local network connections and displays connected devices as Pokemon-style characters sitting at desks. When someone connects to the office network, they appear as a character sprite at a randomly assigned desk or communal space.

## Core Features

### 1. Network Scanner Service
- Continuously monitors the local network for device connections/disconnections
- Detects new IP addresses joining the network
- Tracks MAC addresses for persistent device identification
- Configurable scan interval (default: 30 seconds)
- Supports subnet scanning (e.g., 192.168.1.0/24)

### 2. Character Assignment System
- Assigns a unique Pokemon-style character to each new device
- Persists device-to-character mappings (so returning devices get the same character)
- Supports manual character assignment override
- Character pool with fallback to random assignment if pool exhausted

### 3. Office Layout Visualization
- 2D top-down pixel art office map
- 22 desk positions (numbered/named)
- Communal spaces (kitchen, meeting rooms, lounge areas)
- Characters animate with idle sprites when seated
- Visual indicators for online/offline/away status

### 4. Desk Management
- Random desk assignment for new connections
- Persistent desk assignments (returning devices go to same desk)
- Manual desk reassignment capability
- Desk availability tracking

## Technical Architecture

### Backend Service
```
/server
  /services
    networkScanner.ts      # ARP/ping network scanning
    deviceRegistry.ts      # Device-to-character persistence
    deskManager.ts         # Desk assignment logic
    websocketServer.ts     # Real-time updates to frontend
  /models
    device.ts              # Device entity (IP, MAC, character, desk)
    character.ts           # Character entity (name, sprites)
    desk.ts                # Desk entity (position, occupant)
  /config
    network.config.ts      # Network scanning configuration
    office.config.ts       # Office layout configuration
```

### Frontend Visualization
```
/client
  /components
    OfficeMap.vue          # Main office floor plan canvas
    CharacterSprite.vue    # Animated character component
    DeskSlot.vue           # Individual desk position
    StatusPanel.vue        # Connection status sidebar
  /assets
    /sprites               # Character sprite sheets
    /tiles                 # Office floor/furniture tiles
  /stores
    office.ts              # Office state management
```

### Data Persistence
- SQLite or JSON file for device registry
- Stores: MAC address, assigned character, assigned desk, display name

## Network Scanning Approaches

### Option A: ARP Scanning (Recommended)
- Uses `arp-scan` or native ARP table
- Fast and reliable on local subnet
- Requires appropriate permissions

### Option B: Ping Sweep
- Pings all IPs in subnet range
- More portable but slower
- May be blocked by firewalls

### Option C: DHCP Lease Monitoring
- Monitors router DHCP leases
- Requires router API access
- Most accurate for managed networks

## API Endpoints

```
GET  /api/devices          # List all known devices
GET  /api/devices/online   # List currently connected devices
POST /api/devices/:mac/character  # Assign character to device
POST /api/devices/:mac/desk       # Assign desk to device
POST /api/devices/:mac/name       # Set display name for device

GET  /api/office           # Get full office state
GET  /api/office/desks     # Get desk assignments
WS   /ws/office            # Real-time office updates
```

## Configuration

```typescript
// office.config.ts
export const officeConfig = {
  network: {
    subnet: '192.168.1.0/24',
    scanInterval: 30000,        // 30 seconds
    offlineThreshold: 300000,   // 5 minutes before marked offline
  },
  office: {
    desks: 22,
    communalSpaces: ['kitchen', 'meeting-room-1', 'meeting-room-2', 'lounge'],
  },
  display: {
    mapWidth: 800,
    mapHeight: 600,
    tileSize: 32,
  }
};
```

## Tech Stack Recommendations

### Backend
- **Runtime**: Node.js or Bun
- **Framework**: Fastify or Hono (lightweight)
- **Network Scanning**: `node-arp` or `network-list` npm packages
- **WebSocket**: `ws` or built-in Bun WebSocket
- **Database**: SQLite with `better-sqlite3` or JSON file

### Frontend
- **Framework**: Vue 3 or vanilla JS with Canvas API
- **Rendering**: HTML5 Canvas or Pixi.js for sprite animation
- **State**: Pinia or simple reactive store
- **Styling**: Tailwind CSS for UI panels

## Commands

```bash
# Development
npm run dev              # Start both server and client
npm run server           # Start backend only
npm run client           # Start frontend only

# Network scanning (may require sudo)
npm run scan             # Manual network scan

# Database
npm run db:reset         # Clear device assignments
npm run db:seed          # Seed with test data

# Build
npm run build            # Production build
```

## Environment Variables

```env
NETWORK_SUBNET=192.168.1.0/24
SCAN_INTERVAL=30000
OFFLINE_THRESHOLD=300000
DATABASE_PATH=./data/devices.db
PORT=3000
```

## Future Enhancements

- [ ] Slack/Teams integration for automatic name resolution
- [ ] Character customization (hats, accessories)
- [ ] Meeting room booking visualization
- [ ] Historical presence data/analytics
- [ ] Mobile app view
- [ ] Sound effects on connect/disconnect
- [ ] Character interactions (walking between desks)
- [ ] Away status detection (idle time)
