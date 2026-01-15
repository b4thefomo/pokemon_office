export const config = {
  network: {
    subnet: '192.168.1.0/24',
    scanInterval: 30000,
    offlineThreshold: 300000,
  },
  server: {
    port: 3001,
  },
  persistence: {
    dataPath: './data/devices.json',
  },
};
