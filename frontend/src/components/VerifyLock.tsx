import React, { useState, useEffect } from 'react';
import { usePublicClient } from 'wagmi';
import { formatUnits, isAddress } from 'viem';
import {
  ShieldCheck,
  Search,
  Lock,
  Unlock,
  CheckCircle,
  ExternalLink,
  Copy,
  Check,
  Calendar,
  Clock,
  User,
  Coins,
  Share2,
} from 'lucide-react';
import { TOKEN_LOCKER_ABI, ERC20_ABI } from '../contracts/abis';
import addresses from '../contracts/addresses.json';
import { LockRecord } from '../types';

interface VerifyLockProps {
  initialLockId?: bigint | null;
}

export const VerifyLock: React.FC<VerifyLockProps> = ({ initialLockId }) => {
  const publicClient = usePublicClient();
  const tokenLockerAddress = (addresses.tokenLocker || '0x5FbDB2315678afecb367f032d93F642f64180aa3') as `0x${string}`;

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedLock, setSelectedLock] = useState<LockRecord | null>(null);
  const [tokenMeta, setTokenMeta] = useState<{ symbol: string; decimals: number }>({ symbol: 'TOKEN', decimals: 18 });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Auto-detect lock from URL hash or initial prop
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#lock-')) {
        const idStr = hash.replace('#lock-', '');
        try {
          const id = BigInt(idStr);
          lookupLock(id);
        } catch {
          // ignore invalid
        }
      } else if (initialLockId) {
        lookupLock(initialLockId);
      } else {
        // Default to lock #1 if available
        lookupLock(1n);
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, [initialLockId, publicClient]);

  // Lookup single lock
  const lookupLock = async (lockId: bigint) => {
    if (!publicClient) return;
    try {
      setIsLoading(true);
      setErrorMessage(null);

      const lock = (await publicClient.readContract({
        address: tokenLockerAddress,
        abi: TOKEN_LOCKER_ABI,
        functionName: 'getLock',
        args: [lockId],
      })) as LockRecord;

      if (!lock || lock.amount === 0n) {
        setErrorMessage(`Lock #${lockId.toString()} was not found on BOT Chain.`);
        setSelectedLock(null);
        return;
      }

      setSelectedLock(lock);

      // Fetch token metadata
      try {
        const [symbol, decimals] = await Promise.all([
          publicClient.readContract({
            address: lock.token,
            abi: ERC20_ABI,
            functionName: 'symbol',
          }).catch(() => 'TOKEN'),
          publicClient.readContract({
            address: lock.token,
            abi: ERC20_ABI,
            functionName: 'decimals',
          }).catch(() => 18),
        ]);
        setTokenMeta({ symbol, decimals: Number(decimals) });
      } catch {
        setTokenMeta({ symbol: 'TOKEN', decimals: 18 });
      }
    } catch (err: any) {
      setErrorMessage(`No lock record found with ID #${lockId.toString()}.`);
      setSelectedLock(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    if (/^\d+$/.test(query)) {
      lookupLock(BigInt(query));
    } else {
      setErrorMessage('Please enter a valid numeric Lock ID (e.g. 1, 2, 3)');
    }
  };

  const copyShareLink = () => {
    if (!selectedLock) return;
    const url = `${window.location.origin}${window.location.pathname}#lock-${selectedLock.id.toString()}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const shareOnX = () => {
    if (!selectedLock) return;
    const text = encodeURIComponent(
      `🔒 Verified on-chain token lock: ${formatUnits(selectedLock.amount, tokenMeta.decimals)} ${tokenMeta.symbol} locked inside TokenLocker on BOT Chain!\nInspect proof:`
    );
    const url = encodeURIComponent(`${window.location.origin}${window.location.pathname}#lock-${selectedLock.id.toString()}`);
    window.open(`https://x.com/intent/tweet?text=${text}&url=${url}`, '_blank');
  };

  const now = Math.floor(Date.now() / 1000);
  const isUnlocked = selectedLock ? now >= Number(selectedLock.unlockTimestamp) : false;

  return (
    <div className="w-full max-w-3xl mx-auto space-y-8">
      
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#10b981]/10 border border-[#10b981]/25 text-[#34d399] text-xs font-semibold uppercase tracking-wider mb-3">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Public On-Chain Verification</span>
        </div>
        <h2 className="text-3xl font-extrabold text-white">
          Inspect & Verify Token Locks
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-[var(--text-secondary)] max-w-lg mx-auto">
          Verify locked liquidity, team vesting, and reserves on BOT Chain. Anyone can inspect lock records in full transparency.
        </p>
      </div>

      {/* Search Input Bar */}
      <form onSubmit={handleSearchSubmit} className="relative max-w-lg mx-auto">
        <input
          type="text"
          placeholder="Enter Lock ID (e.g. 1, 2, 3...)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="glass-input pl-12 pr-28 py-3.5 text-sm"
        />
        <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
        <button
          type="submit"
          className="btn-primary absolute right-2 top-1/2 -translate-y-1/2 py-2 px-4 text-xs font-bold"
        >
          Verify
        </button>
      </form>

      {/* Main Verification Certificate Card */}
      {isLoading ? (
        <div className="glass-panel p-16 text-center">
          <div className="w-8 h-8 border-2 border-[#00f2fe] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs text-slate-300">Querying BOT Chain blockchain...</p>
        </div>
      ) : errorMessage ? (
        <div className="glass-panel p-8 text-center text-rose-300 bg-rose-500/5 border-rose-500/20 max-w-md mx-auto">
          <Lock className="w-8 h-8 text-rose-400 mx-auto mb-2 opacity-60" />
          <p className="text-sm font-semibold">{errorMessage}</p>
        </div>
      ) : selectedLock ? (
        <div className="glass-panel p-6 sm:p-8 relative overflow-hidden border-[#00f2fe]/30 shadow-[0_0_40px_rgba(0,242,254,0.12)]">
          
          {/* Subtle Watermark Lock Icon */}
          <Lock className="w-96 h-96 absolute -right-20 -bottom-20 text-white/[0.015] pointer-events-none select-none" />

          {/* Certificate Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[var(--border-subtle)] gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="badge badge-verified">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>On-Chain Verified</span>
                </span>
                <span className="badge badge-locked font-mono text-[11px]">
                  BOT Chain (968)
                </span>
              </div>
              <h3 className="text-2xl font-black text-white tracking-tight">
                Token Lock #{selectedLock.id.toString().padStart(3, '0')}
              </h3>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                {selectedLock.title || 'Smart Contract Token Lock'}
              </p>
            </div>

            {/* Status Indicator */}
            <div>
              {selectedLock.isWithdrawn ? (
                <div className="badge badge-withdrawn py-1.5 px-3.5 text-xs">
                  <CheckCircle className="w-4 h-4 text-slate-400" />
                  <span>Withdrawn</span>
                </div>
              ) : isUnlocked ? (
                <div className="badge badge-unlocked py-1.5 px-3.5 text-xs shadow-[0_0_15px_rgba(0,242,254,0.3)]">
                  <Unlock className="w-4 h-4" />
                  <span>Ready to Withdraw</span>
                </div>
              ) : (
                <div className="badge badge-locked py-1.5 px-3.5 text-xs shadow-[0_0_15px_rgba(245,158,11,0.25)]">
                  <Lock className="w-4 h-4" />
                  <span>Active Lock</span>
                </div>
              )}
            </div>
          </div>

          {/* Core Locked Amount Feature */}
          <div className="py-6 border-b border-[var(--border-subtle)]">
            <div className="text-xs text-[var(--text-muted)] font-semibold uppercase tracking-wider mb-1">
              Verified Locked Amount
            </div>
            <div className="flex items-baseline gap-2.5">
              <span className="text-3xl sm:text-4xl font-extrabold text-white font-mono">
                {Number(formatUnits(selectedLock.amount, tokenMeta.decimals)).toLocaleString(undefined, {
                  maximumFractionDigits: 4,
                })}
              </span>
              <span className="text-lg font-bold text-[#00f2fe]">{tokenMeta.symbol}</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Guaranteed held in custody by contract{' '}
              <a
                href={`https://scan.bohr.life/address/${tokenLockerAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-[#00f2fe] underline"
              >
                {tokenLockerAddress.slice(0, 8)}...{tokenLockerAddress.slice(-6)}
              </a>
            </p>
          </div>

          {/* Details Table */}
          <div className="py-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[var(--border-subtle)] space-y-1">
              <div className="text-[var(--text-muted)] font-medium">Owner / Beneficiary:</div>
              <div className="font-mono text-white text-xs break-all flex items-center justify-between">
                <span>{selectedLock.owner}</span>
                <a
                  href={`https://scan.bohr.life/address/${selectedLock.owner}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#00f2fe] hover:text-white ml-2"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[var(--border-subtle)] space-y-1">
              <div className="text-[var(--text-muted)] font-medium">Token Contract:</div>
              <div className="font-mono text-white text-xs break-all flex items-center justify-between">
                <span>{selectedLock.token}</span>
                <a
                  href={`https://scan.bohr.life/address/${selectedLock.token}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#00f2fe] hover:text-white ml-2"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[var(--border-subtle)] space-y-1">
              <div className="text-[var(--text-muted)] font-medium">Unlock Timestamp:</div>
              <div className="text-white font-semibold">
                {new Date(Number(selectedLock.unlockTimestamp) * 1000).toLocaleString('en-US', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[var(--border-subtle)] space-y-1">
              <div className="text-[var(--text-muted)] font-medium">Early Withdrawal Allowed:</div>
              <div className="text-rose-400 font-bold flex items-center gap-1.5">
                <span>NO (Contract Code Enforced)</span>
              </div>
            </div>
          </div>

          {/* Trust Guarantees */}
          <div className="p-4 rounded-xl bg-[#10b981]/5 border border-[#10b981]/20 flex items-start gap-3 text-xs text-slate-300 mb-6">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white">Smart Contract Security Assurance:</strong>
              <p className="mt-0.5 text-slate-400">
                This lock is deployed on BOT Chain. The contract code has no owner backdoors or administrative overrides that can withdraw funds prematurely.
              </p>
            </div>
          </div>

          {/* Social Proof Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={copyShareLink}
              className="btn-secondary w-full sm:flex-1 py-3 text-xs font-semibold"
            >
              {copiedLink ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">Link Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-300" />
                  <span>Copy Verification Link</span>
                </>
              )}
            </button>

            <button
              onClick={shareOnX}
              className="btn-secondary w-full sm:flex-1 py-3 text-xs font-semibold bg-[#1da1f2]/10 border-[#1da1f2]/30 hover:bg-[#1da1f2]/20 text-[#1da1f2]"
            >
              <Share2 className="w-4 h-4" />
              <span>Share Proof on X (Twitter)</span>
            </button>

            <a
              href={`https://scan.bohr.life/address/${tokenLockerAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary w-full sm:flex-1 py-3 text-xs font-semibold"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Inspect on BohrScan</span>
            </a>
          </div>
        </div>
      ) : null}
    </div>
  );
};
