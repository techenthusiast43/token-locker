import React, { useState, useEffect } from 'react';
import {
  useAccount,
  usePublicClient,
  useWriteContract,
  useWaitForTransactionReceipt,
} from 'wagmi';
import { formatUnits } from 'viem';
import {
  Lock,
  Unlock,
  Clock,
  ExternalLink,
  Share2,
  Calendar,
  AlertTriangle,
  UserCheck,
  CheckCircle,
  ShieldCheck,
  ArrowUpRight,
  Copy,
  Check,
} from 'lucide-react';
import { TOKEN_LOCKER_ABI, ERC20_ABI } from '../contracts/abis';
import addresses from '../contracts/addresses.json';
import { LockRecord } from '../types';

interface MyLocksProps {
  onNavigateToCreate: () => void;
  onOpenVerify: (lockId: bigint) => void;
}

export const MyLocks: React.FC<MyLocksProps> = ({ onNavigateToCreate, onOpenVerify }) => {
  const { address: userAddress, isConnected } = useAccount();
  const publicClient = usePublicClient();

  const tokenLockerAddress = (addresses.tokenLocker || '0x5FbDB2315678afecb367f032d93F642f64180aa3') as `0x${string}`;

  const [locks, setLocks] = useState<LockRecord[]>([]);
  const [tokenMeta, setTokenMeta] = useState<Record<string, { symbol: string; decimals: number }>>({});
  const [filter, setFilter] = useState<'all' | 'active' | 'claimable' | 'withdrawn'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<bigint | null>(null);

  // Extend & Transfer Modal States
  const [activeModal, setActiveModal] = useState<'extend' | 'transfer' | null>(null);
  const [selectedLock, setSelectedLock] = useState<LockRecord | null>(null);
  const [extendDays, setExtendDays] = useState<number>(30);
  const [newOwnerAddress, setNewOwnerAddress] = useState<string>('');

  // Write contracts
  const { writeContract: writeWithdraw, data: withdrawHash, isPending: isWithdrawing } = useWriteContract();
  const { writeContract: writeExtend, data: extendHash, isPending: isExtending } = useWriteContract();
  const { writeContract: writeTransfer, data: transferHash, isPending: isTransferring } = useWriteContract();

  const { isSuccess: isWithdrawSuccess } = useWaitForTransactionReceipt({ hash: withdrawHash });
  const { isSuccess: isExtendSuccess } = useWaitForTransactionReceipt({ hash: extendHash });
  const { isSuccess: isTransferSuccess } = useWaitForTransactionReceipt({ hash: transferHash });

  // Current timestamp clock for live countdown
  const [currentTime, setCurrentTime] = useState<number>(Math.floor(Date.now() / 1000));

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch User Locks
  const fetchLocks = async () => {
    if (!publicClient || !userAddress) return;
    try {
      setIsLoading(true);

      const lockIds = (await publicClient.readContract({
        address: tokenLockerAddress,
        abi: TOKEN_LOCKER_ABI,
        functionName: 'getUserLocks',
        args: [userAddress],
      })) as bigint[];

      if (!lockIds || lockIds.length === 0) {
        setLocks([]);
        setIsLoading(false);
        return;
      }

      const fetchedLocks = (await publicClient.readContract({
        address: tokenLockerAddress,
        abi: TOKEN_LOCKER_ABI,
        functionName: 'getLocksBatch',
        args: [lockIds],
      })) as LockRecord[];

      setLocks([...fetchedLocks].reverse());

      // Query token symbols for these locks
      const uniqueTokenAddrs = Array.from(new Set(fetchedLocks.map((l) => l.token)));
      const metaMap: Record<string, { symbol: string; decimals: number }> = {};

      await Promise.all(
        uniqueTokenAddrs.map(async (tokenAddr) => {
          try {
            const [sym, dec] = await Promise.all([
              publicClient.readContract({
                address: tokenAddr,
                abi: ERC20_ABI,
                functionName: 'symbol',
              }).catch(() => 'TOKEN'),
              publicClient.readContract({
                address: tokenAddr,
                abi: ERC20_ABI,
                functionName: 'decimals',
              }).catch(() => 18),
            ]);
            metaMap[tokenAddr.toLowerCase()] = {
              symbol: sym,
              decimals: Number(dec),
            };
          } catch {
            metaMap[tokenAddr.toLowerCase()] = { symbol: 'TOKEN', decimals: 18 };
          }
        })
      );

      setTokenMeta(metaMap);
    } catch (err) {
      console.error('Error fetching user locks:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLocks();
  }, [userAddress, publicClient, isWithdrawSuccess, isExtendSuccess, isTransferSuccess]);

  // Handle Withdraw
  const handleWithdraw = (lockId: bigint) => {
    writeWithdraw({
      address: tokenLockerAddress,
      abi: TOKEN_LOCKER_ABI,
      functionName: 'withdraw',
      args: [lockId],
    });
  };

  // Handle Extend Lock
  const handleExtendSubmit = () => {
    if (!selectedLock) return;
    const currentUnlock = Number(selectedLock.unlockTimestamp);
    const newUnlock = currentUnlock + extendDays * 86400;

    writeExtend({
      address: tokenLockerAddress,
      abi: TOKEN_LOCKER_ABI,
      functionName: 'extendLock',
      args: [selectedLock.id, BigInt(newUnlock)],
    });

    setActiveModal(null);
  };

  // Handle Transfer Lock
  const handleTransferSubmit = () => {
    if (!selectedLock || !newOwnerAddress) return;
    writeTransfer({
      address: tokenLockerAddress,
      abi: TOKEN_LOCKER_ABI,
      functionName: 'transferLockOwnership',
      args: [selectedLock.id, newOwnerAddress as `0x${string}`],
    });

    setActiveModal(null);
  };

  // Copy shareable proof URL
  const copyProofLink = (lockId: bigint) => {
    const url = `${window.location.origin}${window.location.pathname}#lock-${lockId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(lockId);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Countdown formatter
  const formatCountdown = (unlockTime: bigint) => {
    const remaining = Number(unlockTime) - currentTime;
    if (remaining <= 0) return 'Unlocked';

    const days = Math.floor(remaining / 86400);
    const hours = Math.floor((remaining % 86400) / 3600);
    const minutes = Math.floor((remaining % 3600) / 60);
    const seconds = remaining % 60;

    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  };

  // Filtered locks
  const filteredLocks = locks.filter((lock) => {
    const isUnlocked = currentTime >= Number(lock.unlockTimestamp);
    if (filter === 'active') return !lock.isWithdrawn && !isUnlocked;
    if (filter === 'claimable') return !lock.isWithdrawn && isUnlocked;
    if (filter === 'withdrawn') return lock.isWithdrawn;
    return true;
  });

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      
      {/* Top Bar: Title & Filter Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-3">
            <span>My Locked Tokens</span>
            <span className="badge badge-locked text-xs px-2.5 py-0.5">
              {locks.length} Total
            </span>
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Manage your token locks, monitor countdowns, and withdraw unlocked funds.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[var(--border-subtle)]">
          {(['all', 'active', 'claimable', 'withdrawn'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setFilter(mode)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                filter === mode
                  ? 'bg-[#00f2fe]/20 text-[#00f2fe] border border-[#00f2fe]/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Lock Records Grid */}
      {!isConnected ? (
        <div className="glass-panel p-12 text-center max-w-md mx-auto">
          <Lock className="w-12 h-12 text-[#00f2fe] mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-bold text-white mb-2">Connect Your Wallet</h3>
          <p className="text-xs text-[var(--text-secondary)] mb-6">
            Connect your MetaMask or Web3 wallet to inspect your locked tokens on BOT Chain.
          </p>
          {/* @ts-ignore */}
          <appkit-button size="md" />
        </div>
      ) : isLoading ? (
        <div className="glass-panel p-16 text-center">
          <div className="w-8 h-8 border-2 border-[#00f2fe] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-slate-300 font-medium">Fetching on-chain lock records...</p>
        </div>
      ) : filteredLocks.length === 0 ? (
        <div className="glass-panel p-12 text-center max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-[#00f2fe]/10 flex items-center justify-center mx-auto mb-4 border border-[#00f2fe]/20">
            <Lock className="w-7 h-7 text-[#00f2fe]" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">No Locks Found</h3>
          <p className="text-xs text-[var(--text-secondary)] mb-6">
            {filter === 'all'
              ? "You haven't locked any tokens yet on BOT Chain. Create your first token lock now!"
              : `You have no locks in the "${filter}" category.`}
          </p>
          <button onClick={onNavigateToCreate} className="btn-primary">
            Create a Lock Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredLocks.map((lock) => {
            const meta = tokenMeta[lock.token.toLowerCase()] || { symbol: 'TOKEN', decimals: 18 };
            const formattedAmount = formatUnits(lock.amount, meta.decimals);
            const isUnlocked = currentTime >= Number(lock.unlockTimestamp);
            const unlockDateStr = new Date(Number(lock.unlockTimestamp) * 1000).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={lock.id.toString()}
                className="glass-panel p-5 flex flex-col justify-between hover:border-[rgba(0,242,254,0.3)] group transition-all"
              >
                {/* Card Header */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="font-mono text-xs font-semibold text-slate-400">
                      Lock #{lock.id.toString().padStart(3, '0')}
                    </span>

                    {/* Status Badge */}
                    {lock.isWithdrawn ? (
                      <span className="badge badge-withdrawn">
                        <CheckCircle className="w-3 h-3" />
                        <span>Withdrawn</span>
                      </span>
                    ) : isUnlocked ? (
                      <span className="badge badge-unlocked shadow-[0_0_10px_rgba(0,242,254,0.3)]">
                        <Unlock className="w-3 h-3 animate-bounce" />
                        <span>Ready to Claim</span>
                      </span>
                    ) : (
                      <span className="badge badge-locked">
                        <Lock className="w-3 h-3" />
                        <span>Locked</span>
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h4 className="text-base font-bold text-white mb-1 truncate" title={lock.title}>
                    {lock.title || 'Token Lock'}
                  </h4>

                  {/* Amount Display */}
                  <div className="my-3 p-3 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[var(--border-subtle)]">
                    <div className="text-xs text-[var(--text-muted)] font-medium">Locked Balance</div>
                    <div className="text-xl font-extrabold text-white font-mono flex items-baseline gap-1.5 mt-0.5">
                      <span>{Number(formattedAmount).toLocaleString(undefined, { maximumFractionDigits: 4 })}</span>
                      <span className="text-xs text-[#00f2fe]">{meta.symbol}</span>
                    </div>
                  </div>

                  {/* Details List */}
                  <div className="space-y-2 text-xs text-[var(--text-secondary)] mb-4">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Countdown:</span>
                      </span>
                      <span className={`font-mono font-semibold ${isUnlocked ? 'text-[#00f2fe]' : 'text-amber-400'}`}>
                        {lock.isWithdrawn ? 'Completed' : formatCountdown(lock.unlockTimestamp)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>Unlock Date:</span>
                      </span>
                      <span className="text-white font-medium">{unlockDateStr}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span>Token Contract:</span>
                      <a
                        href={`https://scan.bohr.life/address/${lock.token}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-[#00f2fe] hover:underline flex items-center gap-1"
                      >
                        <span>{lock.token.slice(0, 6)}...{lock.token.slice(-4)}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="pt-3 border-t border-[var(--border-subtle)] space-y-2">
                  
                  {/* Primary Withdraw Button */}
                  {!lock.isWithdrawn && (
                    <button
                      onClick={() => handleWithdraw(lock.id)}
                      disabled={!isUnlocked || isWithdrawing}
                      className={`w-full py-2.5 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-1.5 ${
                        isUnlocked
                          ? 'btn-primary'
                          : 'bg-[rgba(255,255,255,0.04)] text-slate-500 cursor-not-allowed border border-[var(--border-subtle)]'
                      }`}
                    >
                      <Unlock className="w-3.5 h-3.5" />
                      <span>{isUnlocked ? 'Withdraw Tokens' : 'Locked Until Expiry'}</span>
                    </button>
                  )}

                  {/* Secondary Management Actions */}
                  <div className="flex items-center gap-1.5">
                    
                    {/* Public Proof / Inspect */}
                    <button
                      onClick={() => onOpenVerify(lock.id)}
                      className="btn-secondary flex-1 py-1.5 text-[11px] font-semibold"
                      title="Inspect Public Verification Card"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-[#00f2fe]" />
                      <span>Proof</span>
                    </button>

                    {/* Copy Shareable Link */}
                    <button
                      onClick={() => copyProofLink(lock.id)}
                      className="btn-secondary px-2.5 py-1.5 text-[11px]"
                      title="Copy Public Link to Share"
                    >
                      {copiedId === lock.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-slate-300" />
                      )}
                    </button>

                    {/* Extend Lock Button */}
                    {!lock.isWithdrawn && (
                      <button
                        onClick={() => {
                          setSelectedLock(lock);
                          setActiveModal('extend');
                        }}
                        className="btn-secondary px-2.5 py-1.5 text-[11px]"
                        title="Extend Lock Duration"
                      >
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                      </button>
                    )}

                    {/* Transfer Ownership Button */}
                    {!lock.isWithdrawn && (
                      <button
                        onClick={() => {
                          setSelectedLock(lock);
                          setActiveModal('transfer');
                        }}
                        className="btn-secondary px-2.5 py-1.5 text-[11px]"
                        title="Transfer Lock Ownership"
                      >
                        <UserCheck className="w-3.5 h-3.5 text-[#a855f7]" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Extend Lock */}
      {activeModal === 'extend' && selectedLock && (
        <div className="modal-backdrop" onClick={() => setActiveModal(null)}>
          <div className="modal-content p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-400" />
                <span>Extend Lock #{selectedLock.id.toString()}</span>
              </h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <p className="text-xs text-[var(--text-secondary)]">
              Increase the unlock duration for <strong>{selectedLock.title}</strong>. Smart contract rules only allow extending time, never reducing it.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Select Additional Days
              </label>
              <div className="grid grid-cols-4 gap-2 mb-3">
                {[15, 30, 90, 180].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setExtendDays(d)}
                    className={`py-2 rounded-xl text-xs font-semibold border ${
                      extendDays === d
                        ? 'bg-[#00f2fe]/20 border-[#00f2fe] text-[#00f2fe]'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    +{d} Days
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
              New Unlock Date: <strong>{new Date((Number(selectedLock.unlockTimestamp) + extendDays * 86400) * 1000).toLocaleString()}</strong>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setActiveModal(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleExtendSubmit} disabled={isExtending} className="btn-primary flex-1">
                {isExtending ? 'Extending...' : 'Confirm Extension'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Transfer Ownership */}
      {activeModal === 'transfer' && selectedLock && (
        <div className="modal-backdrop" onClick={() => setActiveModal(null)}>
          <div className="modal-content p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-[#a855f7]" />
                <span>Transfer Lock #{selectedLock.id.toString()}</span>
              </h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <p className="text-xs text-[var(--text-secondary)]">
              Assign full ownership and withdrawal rights of this lock to a new recipient address on BOT Chain.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                New Beneficiary / Owner Address
              </label>
              <input
                type="text"
                placeholder="0x..."
                value={newOwnerAddress}
                onChange={(e) => setNewOwnerAddress(e.target.value.trim())}
                className="glass-input font-mono text-xs"
              />
            </div>

            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>Warning: This action is irreversible. The recipient will gain exclusive right to withdraw these tokens once unlocked.</span>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setActiveModal(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleTransferSubmit} disabled={isTransferring || !newOwnerAddress} className="btn-primary flex-1">
                {isTransferring ? 'Transferring...' : 'Transfer Lock'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
