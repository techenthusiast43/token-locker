import React, { useState, useEffect } from 'react';
import { WagmiProvider, useAccount, usePublicClient } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config, botChainTestnet } from './config/wagmi';
import { Navbar } from './components/Navbar';
import { LockForm } from './components/LockForm';
import { MyLocks } from './components/MyLocks';
import { VerifyLock } from './components/VerifyLock';
import { FaucetModal } from './components/FaucetModal';
import { TOKEN_LOCKER_ABI } from './contracts/abis';
import addresses from './contracts/addresses.json';
import {
  Lock,
  ShieldCheck,
  Coins,
  ExternalLink,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

const queryClient = new QueryClient();

function MainContent() {
  const [activeTab, setActiveTab] = useState<'create' | 'my-locks' | 'verify'>('create');
  const [isFaucetOpen, setIsFaucetOpen] = useState(false);
  const [selectedVerifyId, setSelectedVerifyId] = useState<bigint | null>(null);
  const [totalLocksCount, setTotalLocksCount] = useState<number>(0);

  const { address: userAddress, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const tokenLockerAddress = (addresses.tokenLocker || '0x5FbDB2315678afecb367f032d93F642f64180aa3') as `0x${string}`;

  // Fetch total locks count
  useEffect(() => {
    const fetchStats = async () => {
      if (!publicClient) return;
      try {
        const count = await publicClient.readContract({
          address: tokenLockerAddress,
          abi: TOKEN_LOCKER_ABI,
          functionName: 'totalLocks',
        });
        setTotalLocksCount(Number(count));
      } catch {
        // quiet fallback
      }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, [publicClient, tokenLockerAddress]);

  const handleOpenVerify = (lockId: bigint) => {
    setSelectedVerifyId(lockId);
    setActiveTab('verify');
    window.location.hash = `#lock-${lockId.toString()}`;
  };

  return (
    <div className="min-h-screen flex flex-col justify-between selection:bg-[#00f2fe]/30 selection:text-[#00f2fe]">
      {/* Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenFaucet={() => setIsFaucetOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
        
        {/* Metric Overview Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="glass-panel p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#00f2fe]/10 border border-[#00f2fe]/20 flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5 text-[#00f2fe]" />
            </div>
            <div>
              <p className="text-[11px] text-[var(--text-muted)] font-medium">Total Locks</p>
              <p className="text-lg font-bold text-white font-mono">{totalLocksCount}</p>
            </div>
          </div>

          <div className="glass-panel p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#8a2be2]/10 border border-[#8a2be2]/20 flex items-center justify-center shrink-0">
              <Coins className="w-5 h-5 text-[#c084fc]" />
            </div>
            <div>
              <p className="text-[11px] text-[var(--text-muted)] font-medium">Supported Tokens</p>
              <p className="text-lg font-bold text-white">Any ERC-20</p>
            </div>
          </div>

          <div className="glass-panel p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#10b981]/10 border border-[#10b981]/20 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-[#34d399]" />
            </div>
            <div>
              <p className="text-[11px] text-[var(--text-muted)] font-medium">Security</p>
              <p className="text-lg font-bold text-white">Non-Custodial</p>
            </div>
          </div>

          <div className="glass-panel p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-[11px] text-[var(--text-muted)] font-medium">Early Withdrawal</p>
              <p className="text-lg font-bold text-rose-400">Strictly 0%</p>
            </div>
          </div>
        </div>

        {/* View Content */}
        {activeTab === 'create' && (
          <LockForm
            onLockCreated={(id) => handleOpenVerify(id)}
            onOpenFaucet={() => setIsFaucetOpen(true)}
          />
        )}

        {activeTab === 'my-locks' && (
          <MyLocks
            onNavigateToCreate={() => setActiveTab('create')}
            onOpenVerify={handleOpenVerify}
          />
        )}

        {activeTab === 'verify' && (
          <VerifyLock initialLockId={selectedVerifyId} />
        )}
      </main>

      {/* Testnet Faucet Modal */}
      <FaucetModal
        isOpen={isFaucetOpen}
        onClose={() => setIsFaucetOpen(false)}
      />

      {/* Footer */}
      <footer className="w-full border-t border-[var(--border-subtle)] bg-[rgba(5,7,12,0.9)] py-8 px-4 text-xs text-slate-400 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">TokenLocker dApp</span>
            <span className="text-[var(--text-muted)]">•</span>
            <span>Running on BOT Chain Testnet (Chain ID 968)</span>
          </div>

          <div className="flex items-center gap-6">
            <a
              href="https://rpc.bohr.life"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              RPC Endpoint
            </a>
            <a
              href="https://scan.bohr.life/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors flex items-center gap-1"
            >
              <span>BohrScan Explorer</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <button
              onClick={() => setIsFaucetOpen(true)}
              className="text-[#00f2fe] hover:underline font-medium"
            >
              Test Token Faucet
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <WagmiProvider config={config as any}>
      <QueryClientProvider client={queryClient}>
        <MainContent />
      </QueryClientProvider>
    </WagmiProvider>
  );
}
