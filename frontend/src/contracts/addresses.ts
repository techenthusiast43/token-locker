import addressesJson from './addresses.json';

export interface ChainConfig {
  chainId: number;
  name: string;
  tokenLocker: `0x${string}`;
  mockToken?: `0x${string}`;
  explorer: string;
  rpc: string;
}

export const NETWORKS_CONFIG: Record<number, ChainConfig> = {
  677: {
    chainId: 677,
    name: 'BOT Chain Mainnet',
    tokenLocker: ((addressesJson as any).mainnet?.tokenLocker || (addressesJson.chainId === 677 ? addressesJson.tokenLocker : '')) as `0x${string}`,
    mockToken: undefined,
    explorer: 'https://scan.botchain.ai',
    rpc: 'https://rpc.botchain.ai',
  },
  968: {
    chainId: 968,
    name: 'BOT Chain Testnet',
    tokenLocker: ((addressesJson as any).testnet?.tokenLocker || (addressesJson.chainId === 968 ? addressesJson.tokenLocker : '0x5Ed2E76ef698cAdf1905C5FD8de89a4dA786ae52')) as `0x${string}`,
    mockToken: ((addressesJson as any).testnet?.mockToken || (addressesJson.chainId === 968 ? addressesJson.mockToken : '0xBb6987f6981B31BE9e76829A6eBCa743634b8094')) as `0x${string}`,
    explorer: 'https://scan.bohr.life',
    rpc: 'https://rpc.bohr.life',
  },
};

export function getAddresses(chainId?: number): ChainConfig {
  if (chainId === 968) {
    return NETWORKS_CONFIG[968];
  }
  return NETWORKS_CONFIG[677];
}
