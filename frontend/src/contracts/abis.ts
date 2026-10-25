export const TOKEN_LOCKER_ABI = [
  {
    "type": "function",
    "name": "lockTokens",
    "inputs": [
      { "name": "token", "type": "address", "internalType": "address" },
      { "name": "amount", "type": "uint256", "internalType": "uint256" },
      { "name": "unlockTimestamp", "type": "uint256", "internalType": "uint256" },
      { "name": "title", "type": "string", "internalType": "string" }
    ],
    "outputs": [{ "name": "lockId", "type": "uint256", "internalType": "uint256" }],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "withdraw",
    "inputs": [{ "name": "lockId", "type": "uint256", "internalType": "uint256" }],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "extendLock",
    "inputs": [
      { "name": "lockId", "type": "uint256", "internalType": "uint256" },
      { "name": "newUnlockTimestamp", "type": "uint256", "internalType": "uint256" }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "transferLockOwnership",
    "inputs": [
      { "name": "lockId", "type": "uint256", "internalType": "uint256" },
      { "name": "newOwner", "type": "address", "internalType": "address" }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "getLock",
    "inputs": [{ "name": "lockId", "type": "uint256", "internalType": "uint256" }],
    "outputs": [
      {
        "name": "",
        "type": "tuple",
        "internalType": "struct TokenLocker.Lock",
        "components": [
          { "name": "id", "type": "uint256", "internalType": "uint256" },
          { "name": "token", "type": "address", "internalType": "address" },
          { "name": "owner", "type": "address", "internalType": "address" },
          { "name": "amount", "type": "uint256", "internalType": "uint256" },
          { "name": "unlockTimestamp", "type": "uint256", "internalType": "uint256" },
          { "name": "createdAt", "type": "uint256", "internalType": "uint256" },
          { "name": "isWithdrawn", "type": "bool", "internalType": "bool" },
          { "name": "title", "type": "string", "internalType": "string" }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getUserLocks",
    "inputs": [{ "name": "user", "type": "address", "internalType": "address" }],
    "outputs": [{ "name": "", "type": "uint256[]", "internalType": "uint256[]" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getTokenLocks",
    "inputs": [{ "name": "token", "type": "address", "internalType": "address" }],
    "outputs": [{ "name": "", "type": "uint256[]", "internalType": "uint256[]" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getLocksBatch",
    "inputs": [{ "name": "lockIds", "type": "uint256[]", "internalType": "uint256[]" }],
    "outputs": [
      {
        "name": "",
        "type": "tuple[]",
        "internalType": "struct TokenLocker.Lock[]",
        "components": [
          { "name": "id", "type": "uint256", "internalType": "uint256" },
          { "name": "token", "type": "address", "internalType": "address" },
          { "name": "owner", "type": "address", "internalType": "address" },
          { "name": "amount", "type": "uint256", "internalType": "uint256" },
          { "name": "unlockTimestamp", "type": "uint256", "internalType": "uint256" },
          { "name": "createdAt", "type": "uint256", "internalType": "uint256" },
          { "name": "isWithdrawn", "type": "bool", "internalType": "bool" },
          { "name": "title", "type": "string", "internalType": "string" }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "totalLocks",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "event",
    "name": "TokensLocked",
    "inputs": [
      { "name": "lockId", "type": "uint256", "indexed": true, "internalType": "uint256" },
      { "name": "token", "type": "address", "indexed": true, "internalType": "address" },
      { "name": "owner", "type": "address", "indexed": true, "internalType": "address" },
      { "name": "amount", "type": "uint256", "indexed": false, "internalType": "uint256" },
      { "name": "unlockTimestamp", "type": "uint256", "indexed": false, "internalType": "uint256" },
      { "name": "title", "type": "string", "indexed": false, "internalType": "string" },
      { "name": "createdAt", "type": "uint256", "indexed": false, "internalType": "uint256" }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "TokensWithdrawn",
    "inputs": [
      { "name": "lockId", "type": "uint256", "indexed": true, "internalType": "uint256" },
      { "name": "token", "type": "address", "indexed": true, "internalType": "address" },
      { "name": "owner", "type": "address", "indexed": true, "internalType": "address" },
      { "name": "amount", "type": "uint256", "indexed": false, "internalType": "uint256" },
      { "name": "withdrawnAt", "type": "uint256", "indexed": false, "internalType": "uint256" }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "LockExtended",
    "inputs": [
      { "name": "lockId", "type": "uint256", "indexed": true, "internalType": "uint256" },
      { "name": "oldUnlockTimestamp", "type": "uint256", "indexed": false, "internalType": "uint256" },
      { "name": "newUnlockTimestamp", "type": "uint256", "indexed": false, "internalType": "uint256" }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "LockOwnershipTransferred",
    "inputs": [
      { "name": "lockId", "type": "uint256", "indexed": true, "internalType": "uint256" },
      { "name": "previousOwner", "type": "address", "indexed": true, "internalType": "address" },
      { "name": "newOwner", "type": "address", "indexed": true, "internalType": "address" }
    ],
    "anonymous": false
  }
] as const;

export const ERC20_ABI = [
  {
    "type": "function",
    "name": "name",
    "inputs": [],
    "outputs": [{ "name": "", "type": "string", "internalType": "string" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "symbol",
    "inputs": [],
    "outputs": [{ "name": "", "type": "string", "internalType": "string" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "decimals",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint8", "internalType": "uint8" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "balanceOf",
    "inputs": [{ "name": "account", "type": "address", "internalType": "address" }],
    "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "allowance",
    "inputs": [
      { "name": "owner", "type": "address", "internalType": "address" },
      { "name": "spender", "type": "address", "internalType": "address" }
    ],
    "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "approve",
    "inputs": [
      { "name": "spender", "type": "address", "internalType": "address" },
      { "name": "value", "type": "uint256", "internalType": "uint256" }
    ],
    "outputs": [{ "name": "", "type": "bool", "internalType": "bool" }],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "faucet",
    "inputs": [
      { "name": "to", "type": "address", "internalType": "address" },
      { "name": "amount", "type": "uint256", "internalType": "uint256" }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  }
] as const;
