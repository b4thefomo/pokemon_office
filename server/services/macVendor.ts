import type { DeviceType } from '../../shared/types.js';

interface VendorInfo {
  vendor: string;
  type: DeviceType;
}

// Common MAC prefixes (OUI) mapped to vendor and device type
// Format: first 3 octets (e.g., "aa:bb:cc")
const MAC_VENDORS: Record<string, VendorInfo> = {
  // Apple - Laptops/Desktops (Mac)
  '00:03:93': { vendor: 'Apple', type: 'laptop' },
  '00:0a:95': { vendor: 'Apple', type: 'laptop' },
  '00:0d:93': { vendor: 'Apple', type: 'laptop' },
  '00:1e:c2': { vendor: 'Apple', type: 'laptop' },
  '00:25:00': { vendor: 'Apple', type: 'laptop' },
  '3c:06:30': { vendor: 'Apple', type: 'laptop' },
  '14:98:77': { vendor: 'Apple', type: 'laptop' },
  'f8:ff:c2': { vendor: 'Apple', type: 'laptop' },

  // Apple - iPhones/iPads (typically randomized but some aren't)
  '00:26:08': { vendor: 'Apple iPhone', type: 'phone' },
  'f0:d1:a9': { vendor: 'Apple iPhone', type: 'phone' },

  // Dell - Laptops
  '00:14:22': { vendor: 'Dell', type: 'laptop' },
  '00:1a:a0': { vendor: 'Dell', type: 'laptop' },
  '00:1e:4f': { vendor: 'Dell', type: 'laptop' },
  '18:03:73': { vendor: 'Dell', type: 'laptop' },
  'f8:b1:56': { vendor: 'Dell', type: 'laptop' },
  'f8:db:88': { vendor: 'Dell', type: 'laptop' },
  '5c:f9:dd': { vendor: 'Dell', type: 'laptop' },

  // HP - Laptops
  '00:1e:0b': { vendor: 'HP', type: 'laptop' },
  '00:21:5a': { vendor: 'HP', type: 'laptop' },
  '00:25:b3': { vendor: 'HP', type: 'laptop' },
  '3c:d9:2b': { vendor: 'HP', type: 'laptop' },
  'b4:b5:2f': { vendor: 'HP', type: 'laptop' },

  // Lenovo - Laptops
  '00:09:2d': { vendor: 'Lenovo', type: 'laptop' },
  '00:1a:6b': { vendor: 'Lenovo', type: 'laptop' },
  '00:21:86': { vendor: 'Lenovo', type: 'laptop' },
  '60:02:92': { vendor: 'Lenovo', type: 'laptop' },
  'e8:2a:ea': { vendor: 'Lenovo', type: 'laptop' },
  '98:fa:9b': { vendor: 'Lenovo', type: 'laptop' },

  // Microsoft Surface
  '28:18:78': { vendor: 'Microsoft', type: 'laptop' },
  '00:15:5d': { vendor: 'Microsoft', type: 'laptop' },

  // Intel (common in laptops)
  '00:1b:21': { vendor: 'Intel', type: 'laptop' },
  '00:1e:64': { vendor: 'Intel', type: 'laptop' },
  '00:1f:3b': { vendor: 'Intel', type: 'laptop' },
  '3c:a9:f4': { vendor: 'Intel', type: 'laptop' },
  '48:51:b7': { vendor: 'Intel', type: 'laptop' },
  '5c:87:9c': { vendor: 'Intel', type: 'laptop' },

  // ASUS - Laptops
  '00:1a:92': { vendor: 'ASUS', type: 'laptop' },
  '00:1d:60': { vendor: 'ASUS', type: 'laptop' },
  '1c:b7:2c': { vendor: 'ASUS', type: 'laptop' },
  '2c:4d:54': { vendor: 'ASUS', type: 'laptop' },

  // Samsung - Phones
  '00:12:47': { vendor: 'Samsung', type: 'phone' },
  '00:1d:25': { vendor: 'Samsung', type: 'phone' },
  '5c:0a:5b': { vendor: 'Samsung', type: 'phone' },
  '8c:71:f8': { vendor: 'Samsung', type: 'phone' },

  // Google Pixel - Phones
  '3c:28:6d': { vendor: 'Google Pixel', type: 'phone' },
  'f4:f5:d8': { vendor: 'Google Pixel', type: 'phone' },

  // Routers/Network equipment
  '00:00:0c': { vendor: 'Cisco', type: 'router' },
  '00:1a:30': { vendor: 'Cisco', type: 'router' },
  'c0:c1:c0': { vendor: 'Cisco', type: 'router' },
  '00:18:0a': { vendor: 'Netgear', type: 'router' },
  '00:1f:33': { vendor: 'Netgear', type: 'router' },
  '00:14:bf': { vendor: 'Linksys', type: 'router' },
  '00:1a:70': { vendor: 'Linksys', type: 'router' },
  '00:1c:10': { vendor: 'Linksys', type: 'router' },
  '14:7d:da': { vendor: 'TP-Link', type: 'router' },
  '50:c7:bf': { vendor: 'TP-Link', type: 'router' },
  '00:1d:7e': { vendor: 'D-Link', type: 'router' },
  'f8:0d:a9': { vendor: 'Unknown', type: 'router' },  // Often routers
};

export function lookupMacVendor(mac: string): VendorInfo {
  const prefix = mac.toLowerCase().substring(0, 8); // "aa:bb:cc"

  if (MAC_VENDORS[prefix]) {
    return MAC_VENDORS[prefix];
  }

  // Check if it's a randomized MAC (likely phone)
  const firstOctet = mac.split(':')[0];
  if (firstOctet.length >= 2) {
    const secondChar = firstOctet[1].toLowerCase();
    if (['2', '6', 'a', 'e'].includes(secondChar)) {
      return { vendor: 'Randomized MAC', type: 'phone' };
    }
  }

  return { vendor: 'Unknown', type: 'unknown' };
}

export function getDeviceEmoji(type: DeviceType): string {
  switch (type) {
    case 'laptop': return '💻';
    case 'phone': return '📱';
    case 'tablet': return '📱';
    case 'router': return '📡';
    default: return '❓';
  }
}
