import { createAppKit } from '@reown/appkit/react';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { defineChain } from 'viem';

// Define BOT Chain Mainnet (Chain ID: 677)
export const botChainMainnet = defineChain({
  id: 677,
  name: 'BOT Chain Mainnet',
  nativeCurrency: {
    decimals: 18,
    name: 'BOT',
    symbol: 'BOT',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.botchain.ai'],
    },
  },
  blockExplorers: {
    default: {
      name: 'BotChain Explorer',
      url: 'https://scan.botchain.ai',
    },
  },
  testnet: false,
});

// Define Local Hardhat Chain (Chain ID: 31337)
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

// Explorer helper
export const getExplorerUrl = (chainId?: number) => {
  if (chainId === 31337) return '';
  return 'https://scan.botchain.ai';
};

// Reown / WalletConnect Project ID
export const projectId = import.meta.env.VITE_REOWN_PROJECT_ID || '39aa70f889eb69efc6ea7cd8c6488fff';

export const networks = [botChainMainnet, hardhatLocal];

// Create Wagmi Adapter
export const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks,
});

// Initialize Reown AppKit Modal
export const modal = createAppKit({
  adapters: [wagmiAdapter],
  networks: [botChainMainnet, hardhatLocal],
  defaultNetwork: botChainMainnet,
  projectId,
  metadata: {
    name: 'TokenLocker dApp',
    description: 'Decentralized Trustless Token Locking on BOT Chain Mainnet',
    url: 'https://scan.botchain.ai',
    icons: ['https://scan.botchain.ai/favicon.ico'],
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
