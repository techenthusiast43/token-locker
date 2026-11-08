import addressesJson from './addresses.json';

export interface ChainConfig {
  chainId: number;
  name: string;
  tokenLocker: `0x${string}`;
  mockToken?: `0x${string}`;
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

export const LOCALHOST_CONFIG: ChainConfig = {
  chainId: 31337,
  name: 'Hardhat Localhost',
  tokenLocker: ((addressesJson as any).localhost?.tokenLocker || '0x5FbDB2315678afecb367f032d93F642f64180aa3') as `0x${string}`,
  mockToken: ((addressesJson as any).localhost?.mockToken || '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512') as `0x${string}`,
  explorer: '',
  rpc: 'http://127.0.0.1:8545',
};

export function getAddresses(chainId?: number): ChainConfig {
  if (chainId === 31337) {
    return LOCALHOST_CONFIG;
  }
  return MAINNET_CONFIG;
}
