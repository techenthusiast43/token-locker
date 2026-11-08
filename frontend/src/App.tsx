import React, { useState, useEffect } from 'react';
import { WagmiProvider, useAccount, useChainId, usePublicClient } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config, botChainMainnet, hardhatLocal, getExplorerUrl } from './config/wagmi';
import { Navbar } from './components/Navbar';
import { LockForm } from './components/LockForm';
import { MyLocks } from './components/MyLocks';
import { VerifyLock } from './components/VerifyLock';
import { TOKEN_LOCKER_ABI } from './contracts/abis';
import { getAddresses } from './contracts/addresses';
import {
  Lock,
  ShieldCheck,
  Coins,
  ExternalLink,
  Layers,
  CheckCircle2,
} from 'lucide-react';

const queryClient = new QueryClient();

function MainContent() {
  const [activeTab, setActiveTab] = useState<'create' | 'my-locks' | 'verify'>('create');
  const [selectedVerifyId, setSelectedVerifyId] = useState<bigint | null>(null);
  const [totalLocksCount, setTotalLocksCount] = useState<number>(0);

  const { address: userAddress, isConnected } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();

  const networkConfig = getAddresses(chainId);
  const tokenLockerAddress = networkConfig.tokenLocker;
  const explorerUrl = getExplorerUrl(chainId);
  const rpcUrl = networkConfig.rpc;
  const isLocal = chainId === hardhatLocal.id;

  // Fetch total locks count
  useEffect(() => {
    const fetchStats = async () => {
      if (!publicClient || !tokenLockerAddress) return;
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

        {/* BOT Chain Ecosystem Showcase Section */}
        <section className="glass-panel p-6 sm:p-8 rounded-2xl border border-[#00f2fe]/20 relative overflow-hidden bg-gradient-to-br from-[#00f2fe]/5 via-[#0a0f1d] to-[#8a2be2]/5 shadow-[0_0_30px_rgba(0,242,254,0.08)] mt-12">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#00f2fe]/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
          
          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-[#00f2fe] bg-[#00f2fe]/10 px-2.5 py-0.5 rounded-full border border-[#00f2fe]/25">
                  BOT Chain Ecosystem Showcase
                </span>
                <span className="text-xs text-slate-400 font-mono">Chain ID: 677</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Built Natively for BOT Chain
              </h3>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-xl mt-1">
                TokenLocker provides trustless token vesting and liquidity locking infrastructure for builders and communities on BOT Chain.
              </p>
            </div>

            {/* Official BOT Chain Ecosystem Links with Official Logo */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full lg:w-auto">
              <a
                href="https://botchain.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary flex-1 sm:flex-initial py-3 px-5 text-xs font-semibold flex items-center justify-center gap-2.5 bg-[rgba(255,255,255,0.04)] hover:bg-[#00f2fe]/10 hover:border-[#00f2fe]/40 hover:text-[#00f2fe] transition-all rounded-xl"
              >
                <img src="/botchain-logo.png" alt="BOT Chain Logo" className="w-4 h-4 rounded-full object-contain shrink-0" />
                <span>BOT Chain Website</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-60" />
              </a>

              <a
                href="https://scan.botchain.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary flex-1 sm:flex-initial py-3 px-5 text-xs font-semibold flex items-center justify-center gap-2.5 rounded-xl shadow-[0_0_20px_rgba(0,242,254,0.3)]"
              >
                <img src="/botchain-logo.png" alt="BOT Chain Logo" className="w-4 h-4 rounded-full object-contain shrink-0" />
                <span>BOT Chain Explorer</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Comprehensive Ecosystem Footer */}
      <footer className="w-full border-t border-[var(--border-subtle)] bg-[rgba(5,7,12,0.95)] pt-12 pb-8 px-4 text-xs text-slate-400 mt-12">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-[var(--border-subtle)]">
            
            {/* Col 1 & 2: Project & Network Identity */}
            <div className="md:col-span-2 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#00f2fe] to-[#4facfe] p-[1.5px] flex items-center justify-center">
                  <div className="w-full h-full bg-[#0a0f1d] rounded-[7px] flex items-center justify-center">
                    <Lock className="w-4 h-4 text-[#00f2fe]" />
                  </div>
                </div>
                <span className="font-extrabold text-base tracking-tight text-white">
                  TokenLocker
                </span>
                <span className="badge badge-locked text-[10px] py-0.5 px-2 font-semibold">
                  BOT CHAIN
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] max-w-sm leading-relaxed">
                Decentralized, trustless, and non-custodial token locking & vesting protocol deployed natively on BOT Chain Mainnet.
              </p>
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse"></span>
                <span>
                  {isLocal ? 'Running on Hardhat Localhost (Chain ID 31337)' : 'Live on BOT Chain Mainnet (Chain ID 677)'}
                </span>
              </div>
            </div>

            {/* Col 3: Official BOT Chain Links with Official Logo */}
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                <span>BOT Chain Ecosystem</span>
              </p>
              <ul className="space-y-2 text-xs">
                <li>
                  <a
                    href="https://botchain.ai"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[#00f2fe] transition-colors flex items-center gap-2 group"
                  >
                    <img src="/botchain-logo.png" alt="BOT Chain Logo" className="w-4 h-4 rounded-full object-contain shrink-0" />
                    <span>BOT Chain Website</span>
                    <ExternalLink className="w-3 h-3 text-slate-400 ml-auto" />
                  </a>
                </li>
                <li>
                  <a
                    href="https://scan.botchain.ai"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[#00f2fe] transition-colors flex items-center gap-2 group"
                  >
                    <img src="/botchain-logo.png" alt="BOT Chain Logo" className="w-4 h-4 rounded-full object-contain shrink-0" />
                    <span>BOT Chain Explorer</span>
                    <ExternalLink className="w-3 h-3 text-slate-400 ml-auto" />
                  </a>
                </li>
                <li className="pt-1">
                  <span className="text-[11px] text-slate-400 block font-mono">
                    RPC: {rpcUrl}
                  </span>
                </li>
              </ul>
            </div>

            {/* Col 4: Verified Contracts & Links */}
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-white">
                Verified Contracts
              </p>
              <ul className="space-y-2 text-xs">
                <li>
                  <a
                    href={`https://scan.botchain.ai/address/${tokenLockerAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[#00f2fe] transition-colors flex items-center gap-1.5 font-mono"
                  >
                    <span>TokenLocker: {tokenLockerAddress.slice(0, 6)}...{tokenLockerAddress.slice(-4)}</span>
                    <ExternalLink className="w-3 h-3 text-slate-400 ml-auto" />
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/techenthusiast43/token-locker"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[#00f2fe] transition-colors flex items-center gap-1.5"
                  >
                    <span>GitHub Open Source</span>
                    <ExternalLink className="w-3 h-3 text-slate-400 ml-auto" />
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom strip */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
            <p>© {new Date().getFullYear()} TokenLocker. Open-source under MIT License. Non-custodial DeFi infrastructure on BOT Chain.</p>
            <div className="flex items-center gap-4">
              <a 
                href="https://botchain.ai" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="hover:text-white underline transition-colors flex items-center gap-1.5"
              >
                <img src="/botchain-logo.png" alt="BOT Chain Logo" className="w-3.5 h-3.5 rounded-full object-contain shrink-0" />
                <span>botchain.ai</span>
              </a>
              <span>•</span>
              <a 
                href="https://scan.botchain.ai" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="hover:text-white underline transition-colors flex items-center gap-1.5"
              >
                <img src="/botchain-logo.png" alt="BOT Chain Logo" className="w-3.5 h-3.5 rounded-full object-contain shrink-0" />
                <span>scan.botchain.ai</span>
              </a>
            </div>
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
