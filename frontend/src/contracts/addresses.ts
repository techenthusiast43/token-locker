import addressesJson from './addresses.json';

export interface ChainConfig {
  chainId: number;
  name: string;
  tokenLocker: `0x${string}`;
  explorer: string;
  rpc: string;
}

export const MAINNET_CONFIG: ChainConfig = {
  chainId: 677,
  name: 'BOT Chain Mainnet',
  tokenLocker: (addressesJson.tokenLocker || '0xcA7110690a29728998034f833eAFa5341D98bD5f') as `0x${string}`,
  explorer: 'https://scan.botchain.ai',
  rpc: 'https://rpc.botchain.ai',
};

export function getAddresses(): ChainConfig {
  return MAINNET_CONFIG;
}
