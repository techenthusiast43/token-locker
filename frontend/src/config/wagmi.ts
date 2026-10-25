import { createAppKit } from '@reown/appkit/react';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { defineChain } from 'viem';

// Define BOT Chain Testnet
export const botChainTestnet = defineChain({
  id: 968,
  name: 'BOT Chain Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'BOT',
    symbol: 'BOT',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.bohr.life'],
    },
  },
  blockExplorers: {
    default: {
      name: 'BohrScan',
      url: 'https://scan.bohr.life',
    },
  },
  testnet: true,
});

// Local Hardhat Node Chain for rapid testing
export const hardhatLocal = defineChain({
  id: 31337,
  name: 'Hardhat Localhost',
  nativeCurrency: {
    decimals: 18,
    name: 'ETH',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['http://127.0.0.1:8545'],
    },
  },
  testnet: true,
});

// Reown / WalletConnect Project ID (can be configured in .env or defaults to a working demo key)
export const projectId = import.meta.env.VITE_REOWN_PROJECT_ID || '8e6b5ffdcbc9794bc2c96d3bc9b107de';

export const networks = [botChainTestnet, hardhatLocal];

// Create Wagmi Adapter
export const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks,
});

// Initialize Reown AppKit Modal
export const modal = createAppKit({
  adapters: [wagmiAdapter],
  networks: [botChainTestnet, hardhatLocal],
  defaultNetwork: botChainTestnet,
  projectId,
  metadata: {
    name: 'TokenLocker dApp',
    description: 'Decentralized Trustless Token Locking on BOT Chain',
    url: 'https://locker.bohr.life',
    icons: ['https://scan.bohr.life/favicon.ico'],
  },
  features: {
    analytics: false,
    email: false,
    socials: [],
  },
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#00f2fe',
    '--w3m-border-radius-master': '12px',
  },
});

export const config = wagmiAdapter.wagmiConfig;
