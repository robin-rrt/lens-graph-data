import { FollowerNetwork } from './network/types';

export function saveNetworkToFile(network: FollowerNetwork, filename: string) {
  const fs = require('fs');
  fs.writeFileSync(filename, JSON.stringify(network, null, 2));
  console.log(`Network saved to ${filename}`);
}