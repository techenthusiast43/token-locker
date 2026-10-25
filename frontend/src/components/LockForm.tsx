import React, { useState, useEffect } from 'react';
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  usePublicClient,
} from 'wagmi';
import { parseUnits, formatUnits, isAddress } from 'viem';
import {
  Lock,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Shield,
  Clock,
  HelpCircle,
} from 'lucide-react';
import { TOKEN_LOCKER_ABI, ERC20_ABI } from '../contracts/abis';
import addresses from '../contracts/addresses.json';

interface LockFormProps {
  onLockCreated?: (lockId: bigint) => void;
  onOpenFaucet?: () => void;
}

export const LockForm: React.FC<LockFormProps> = ({ onLockCreated, onOpenFaucet }) => {
  const { address: userAddress, isConnected } = useAccount();
  const publicClient = usePublicClient();

  const tokenLockerAddress = (addresses.tokenLocker || '0x5FbDB2315678afecb367f032d93F642f64180aa3') as `0x${string}`;
  const mockTokenAddress = (addresses.mockToken || '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512') as `0x${string}`;

  // Form State
  const [tokenAddressInput, setTokenAddressInput] = useState<string>(mockTokenAddress);
  const [amountInput, setAmountInput] = useState<string>('100');
  const [titleInput, setTitleInput] = useState<string>('Project Reserve Lock');
  const [durationPreset, setDurationPreset] = useState<number>(30); // days
  const [customDate, setCustomDate] = useState<string>('');

  // Token metadata state
  const [tokenInfo, setTokenInfo] = useState<{
    symbol: string;
    name: string;
    decimals: number;
    balance: bigint;
    allowance: bigint;
  }>({
    symbol: 'TEST',
    name: 'Test Token',
    decimals: 18,
    balance: 0n,
    allowance: 0n,
  });

  const [isLoadingToken, setIsLoadingToken] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);

  // Wagmi contract writing
  const {
    writeContract: writeApprove,
    data: approveHash,
    isPending: isApproving,
    error: approveError,
  } = useWriteContract();

  const {
    writeContract: writeLock,
    data: lockHash,
    isPending: isLocking,
    error: lockError,
  } = useWriteContract();

  // Receipt wait hooks
  const { isLoading: isWaitingApprove, isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({
    hash: approveHash,
  });

  const { isLoading: isWaitingLock, isSuccess: isLockSuccess } = useWaitForTransactionReceipt({
    hash: lockHash,
  });

  // Calculate target unlock timestamp
  const calculateUnlockTimestamp = (): number => {
    if (customDate) {
      const selected = new Date(customDate).getTime();
      return Math.floor(selected / 1000);
    }
    const target = new Date();
    target.setDate(target.getDate() + durationPreset);
    return Math.floor(target.getTime() / 1000);
  };

  // Fetch token info when tokenAddressInput or user changes
  const fetchTokenDetails = async () => {
    if (!publicClient || !isAddress(tokenAddressInput)) {
      setTokenError('Please enter a valid ERC-20 contract address');
      return;
    }

    try {
      setIsLoadingToken(true);
      setTokenError(null);

      const targetAddr = tokenAddressInput as `0x${string}`;

      const [symbol, name, decimals] = await Promise.all([
        publicClient.readContract({
          address: targetAddr,
          abi: ERC20_ABI,
          functionName: 'symbol',
        }).catch(() => 'TOKEN'),
        publicClient.readContract({
          address: targetAddr,
          abi: ERC20_ABI,
          functionName: 'name',
        }).catch(() => 'Custom Token'),
        publicClient.readContract({
          address: targetAddr,
          abi: ERC20_ABI,
          functionName: 'decimals',
        }).catch(() => 18),
      ]);

      let balance = 0n;
      let allowance = 0n;

      if (userAddress) {
        [balance, allowance] = await Promise.all([
          publicClient.readContract({
            address: targetAddr,
            abi: ERC20_ABI,
            functionName: 'balanceOf',
            args: [userAddress],
          }).catch(() => 0n),
          publicClient.readContract({
            address: targetAddr,
            abi: ERC20_ABI,
            functionName: 'allowance',
            args: [userAddress, tokenLockerAddress],
          }).catch(() => 0n),
        ]);
      }

      setTokenInfo({
        symbol,
        name,
        decimals: Number(decimals),
        balance,
        allowance,
      });
    } catch (err: any) {
      setTokenError('Could not fetch token details. Verify address is an ERC-20 on BOT Chain.');
    } finally {
      setIsLoadingToken(false);
    }
  };

  useEffect(() => {
    fetchTokenDetails();
  }, [tokenAddressInput, userAddress, publicClient, isApproveSuccess, isLockSuccess]);

  // Handle Approve Token
  const handleApprove = () => {
    if (!tokenAddressInput || !isAddress(tokenAddressInput)) return;
    const amountToLock = parseUnits(amountInput || '0', tokenInfo.decimals);

    writeApprove({
      address: tokenAddressInput as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [tokenLockerAddress, amountToLock * 100n], // approve generous allowance or exact
    });
  };

  // Handle Deposit & Lock Tokens
  const handleLock = () => {
    if (!tokenAddressInput || !isAddress(tokenAddressInput)) return;
    const amountToLock = parseUnits(amountInput || '0', tokenInfo.decimals);
    const unlockTime = calculateUnlockTimestamp();

    writeLock({
      address: tokenLockerAddress,
      abi: TOKEN_LOCKER_ABI,
      functionName: 'lockTokens',
      args: [
        tokenAddressInput as `0x${string}`,
        amountToLock,
        BigInt(unlockTime),
        titleInput || 'Token Lock',
      ],
    });
  };

  // Check if current allowance is sufficient
  const parsedAmount = parseUnits(amountInput || '0', tokenInfo.decimals);
  const needsApproval = tokenInfo.allowance < parsedAmount;
  const hasInsufficientBalance = parsedAmount > tokenInfo.balance;

  const unlockDateDisplay = new Date(calculateUnlockTimestamp() * 1000).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Header Banner */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#00f2fe]/10 border border-[#00f2fe]/25 text-[#00f2fe] text-xs font-semibold uppercase tracking-wider mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Non-Custodial & 100% Verifiable</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
          Lock ERC-20 Tokens
        </h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)] max-w-lg mx-auto">
          Prove commitment to your community. Tokens cannot be withdrawn until the unlock timestamp is met on BOT Chain.
        </p>
      </div>

      {/* Main Glass Form Card */}
      <div className="glass-panel p-6 sm:p-8 relative overflow-hidden">
        {/* Glow Accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#00f2fe]/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="space-y-6 relative z-10">
          
          {/* 1. Token Address Input */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <span>1. Token Contract Address</span>
                {isLoadingToken && (
                  <span className="text-xs font-normal text-[#00f2fe] animate-pulse">
                    Querying contract...
                  </span>
                )}
              </label>
              <button
                type="button"
                onClick={() => setTokenAddressInput(mockTokenAddress)}
                className="text-xs text-[#00f2fe] hover:underline flex items-center gap-1 font-medium"
              >
                Use TEST Token
              </button>
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="0x..."
                value={tokenAddressInput}
                onChange={(e) => setTokenAddressInput(e.target.value.trim())}
                className="glass-input font-mono text-sm pr-24"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                <span className="badge badge-locked text-xs py-0.5 px-2 font-mono">
                  {tokenInfo.symbol}
                </span>
              </div>
            </div>

            {tokenError && (
              <p className="mt-2 text-xs text-rose-400 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{tokenError}</span>
              </p>
            )}

            {/* Token details badge row */}
            <div className="mt-2.5 flex items-center justify-between text-xs text-[var(--text-secondary)]">
              <span>Token Name: <strong className="text-white">{tokenInfo.name}</strong></span>
              <span>Decimals: <strong className="text-white">{tokenInfo.decimals}</strong></span>
              <span>
                Wallet Balance:{' '}
                <strong className="text-[#00f2fe] font-mono">
                  {Number(formatUnits(tokenInfo.balance, tokenInfo.decimals)).toLocaleString(undefined, {
                    maximumFractionDigits: 4,
                  })}{' '}
                  {tokenInfo.symbol}
                </strong>
              </span>
            </div>
          </div>

          {/* 2. Amount Input */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-slate-200">
                2. Amount to Lock
              </label>
              <div className="flex items-center gap-1">
                {[25, 50, 75, 100].map((percent) => (
                  <button
                    key={percent}
                    type="button"
                    onClick={() => {
                      if (tokenInfo.balance > 0n) {
                        const calculated = (tokenInfo.balance * BigInt(percent)) / 100n;
                        setAmountInput(formatUnits(calculated, tokenInfo.decimals));
                      }
                    }}
                    className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.12)] text-slate-300 transition-colors"
                  >
                    {percent === 100 ? 'MAX' : `${percent}%`}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative">
              <input
                type="number"
                step="any"
                min="0"
                placeholder="0.0"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                className="glass-input font-mono text-lg font-semibold pr-20"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-[var(--text-muted)]">
                {tokenInfo.symbol}
              </span>
            </div>

            {hasInsufficientBalance && (
              <p className="mt-2 text-xs text-rose-400 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Insufficient balance. Get TEST tokens from the faucet or reduce amount.</span>
              </p>
            )}
          </div>

          {/* 3. Unlock Duration */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-slate-200 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#00f2fe]" />
                <span>3. Set Unlock Date</span>
              </label>
              <span className="text-xs text-[var(--text-secondary)]">
                Target: <strong className="text-[#00f2fe]">{unlockDateDisplay}</strong>
              </span>
            </div>

            {/* Quick Presets */}
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-3">
              {[
                { label: '7 Days', days: 7 },
                { label: '30 Days', days: 30 },
                { label: '90 Days', days: 90 },
                { label: '180 Days', days: 180 },
                { label: '1 Year', days: 365 },
              ].map((preset) => (
                <button
                  key={preset.days}
                  type="button"
                  onClick={() => {
                    setDurationPreset(preset.days);
                    setCustomDate('');
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all border ${
                    durationPreset === preset.days && !customDate
                      ? 'bg-[#00f2fe]/15 border-[#00f2fe] text-[#00f2fe] shadow-[0_0_12px_rgba(0,242,254,0.25)]'
                      : 'bg-[rgba(255,255,255,0.03)] border-[var(--border-subtle)] text-slate-400 hover:text-white hover:bg-[rgba(255,255,255,0.06)]'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Custom Datetime Input */}
            <div className="relative">
              <input
                type="datetime-local"
                value={customDate}
                onChange={(e) => {
                  setCustomDate(e.target.value);
                  setDurationPreset(0);
                }}
                className="glass-input text-xs font-medium"
              />
            </div>
          </div>

          {/* 4. Title / Purpose Note */}
          <div>
            <label className="block text-sm font-semibold text-slate-200 mb-2">
              4. Lock Title or Description (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Marketing Reserve, Core Team Vesting, Liquidity Lock"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              className="glass-input text-sm"
              maxLength={64}
            />
          </div>

          {/* Summary Audit Box */}
          <div className="rounded-xl p-4 bg-[rgba(0,242,254,0.03)] border border-[#00f2fe]/20 text-xs space-y-2">
            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-[#00f2fe]" />
                Early Withdrawal:
              </span>
              <span className="font-bold text-rose-400">Strictly Impossible (Enforced by Contract)</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span>Smart Contract Custody:</span>
              <span className="font-mono text-slate-400">
                {tokenLockerAddress.slice(0, 8)}...{tokenLockerAddress.slice(-6)}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span>Unlock Date:</span>
              <span className="font-bold text-white">{unlockDateDisplay}</span>
            </div>
          </div>

          {/* Submission Action Buttons */}
          <div className="pt-2">
            {!isConnected ? (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
                <p className="text-sm font-medium text-amber-300 mb-3">
                  Connect your Web3 wallet to lock tokens on BOT Chain
                </p>
                {/* @ts-ignore */}
                <appkit-button size="md" />
              </div>
            ) : needsApproval ? (
              <button
                type="button"
                onClick={handleApprove}
                disabled={isApproving || isWaitingApprove || hasInsufficientBalance || Number(amountInput) <= 0}
                className="btn-primary w-full py-4 text-base"
              >
                {isApproving || isWaitingApprove ? (
                  <>
                    <span className="pulse-dot bg-[#040814]"></span>
                    <span>Approving {tokenInfo.symbol}...</span>
                  </>
                ) : (
                  <>
                    <span>Step 1: Approve {tokenInfo.symbol}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleLock}
                disabled={isLocking || isWaitingLock || hasInsufficientBalance || Number(amountInput) <= 0}
                className="btn-primary w-full py-4 text-base bg-gradient-to-r from-[#00f2fe] via-[#4facfe] to-[#8a2be2]"
              >
                {isLocking || isWaitingLock ? (
                  <>
                    <span className="pulse-dot bg-[#040814]"></span>
                    <span>Depositing & Locking Tokens...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>
                      Step 2: Lock {amountInput} {tokenInfo.symbol}
                    </span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Success Banners */}
          {isLockSuccess && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold">Tokens Successfully Locked!</p>
                <p className="text-xs text-emerald-400/80 mt-0.5">
                  Your lock record has been minted on BOT Chain. You can view it under "My Locks" or share the public proof link.
                </p>
                {lockHash && (
                  <a
                    href={`https://scan.bohr.life/tx/${lockHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-2 text-xs font-semibold text-[#00f2fe] underline"
                  >
                    View on BohrScan Explorer &rarr;
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Error Banner */}
          {(approveError || lockError) && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>
                {approveError?.message.slice(0, 100) || lockError?.message.slice(0, 100)}...
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
