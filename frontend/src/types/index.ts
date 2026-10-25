export interface LockRecord {
  id: bigint;
  token: `0x${string}`;
  owner: `0x${string}`;
  amount: bigint;
  unlockTimestamp: bigint;
  createdAt: bigint;
  isWithdrawn: boolean;
  title: string;
}

export interface TokenInfo {
  address: `0x${string}`;
  name: string;
  symbol: string;
  decimals: number;
  balance: bigint;
}
