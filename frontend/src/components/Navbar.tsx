import React from 'react';
import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import { Lock, ShieldCheck, Coins, ExternalLink, RefreshCw } from 'lucide-react';
import { botChainTestnet } from '../config/wagmi';

interface NavbarProps {
  activeTab: 'create' | 'my-locks' | 'verify';
  setActiveTab: (tab: 'create' | 'my-locks' | 'verify') => void;
  onOpenFaucet: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, onOpenFaucet }) => {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  const isCorrectChain = chainId === botChainTestnet.id;

  return (
    <header className="w-full border-b border-[var(--border-subtle)] bg-[rgba(7,9,14,0.8)] backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        
        {/* Brand Logo */}
        <div 
          onClick={() => setActiveTab('create')}
          className="flex items-center gap-3 cursor-pointer select-none group"
        >
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-[#00f2fe] to-[#4facfe] p-[1.5px] shadow-[0_0_20px_rgba(0,242,254,0.3)] group-hover:shadow-[0_0_28px_rgba(0,242,254,0.5)] transition-all">
            <div className="w-full h-full bg-[#0a0f1d] rounded-[10px] flex items-center justify-center">
              <Lock className="w-5 h-5 text-[#00f2fe]" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                TokenLocker
              </span>
              <span className="badge badge-locked text-[10px] py-0.5 px-2">
                BOT CHAIN
              </span>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] font-medium">
              Trustless Smart Contract Locker
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center p-1 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[var(--border-subtle)]">
          <button
            onClick={() => setActiveTab('create')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'create'
                ? 'bg-gradient-to-r from-[#00f2fe]/20 to-[#4facfe]/20 text-[#00f2fe] border border-[#00f2fe]/30 shadow-[0_0_15px_rgba(0,242,254,0.15)]'
                : 'text-[var(--text-secondary)] hover:text-white'
            }`}
          >
            Create Lock
          </button>
          <button
            onClick={() => setActiveTab('my-locks')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'my-locks'
                ? 'bg-gradient-to-r from-[#00f2fe]/20 to-[#4facfe]/20 text-[#00f2fe] border border-[#00f2fe]/30 shadow-[0_0_15px_rgba(0,242,254,0.15)]'
                : 'text-[var(--text-secondary)] hover:text-white'
            }`}
          >
            My Locks
          </button>
          <button
            onClick={() => setActiveTab('verify')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'verify'
                ? 'bg-gradient-to-r from-[#00f2fe]/20 to-[#4facfe]/20 text-[#00f2fe] border border-[#00f2fe]/30 shadow-[0_0_15px_rgba(0,242,254,0.15)]'
                : 'text-[var(--text-secondary)] hover:text-white'
            }`}
          >
            Lock Explorer & Proof
          </button>
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          
          {/* Testnet Faucet Button */}
          <button
            onClick={onOpenFaucet}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-[#8a2be2]/10 hover:bg-[#8a2be2]/20 text-[#c084fc] border border-[#8a2be2]/30 transition-all"
            title="Mint 1,000 Free TEST Tokens for Lock Testing"
          >
            <Coins className="w-3.5 h-3.5" />
            <span>TEST Faucet</span>
          </button>

          {/* Network Badge & Switcher */}
          {isConnected && !isCorrectChain && (
            <button
              onClick={() => switchChain?.({ chainId: botChainTestnet.id })}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Switch to BOT Chain</span>
            </button>
          )}

          {isConnected && isCorrectChain && (
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-[#10b981]/10 text-[#34d399] border border-[#10b981]/25">
              <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse"></span>
              <span>BOT Chain (968)</span>
            </div>
          )}

          {/* Web3 Reown AppKit Button */}
          <div className="appkit-container">
            {/* Custom styled container for the Web3Modal/AppKit standard web-component */}
            {/* @ts-ignore */}
            <appkit-button balance="show" size="md" />
          </div>

          {/* Explorer Link */}
          <a
            href="https://scan.bohr.life/"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2.5 rounded-xl text-[var(--text-secondary)] hover:text-white bg-[rgba(255,255,255,0.03)] border border-[var(--border-subtle)] hover:bg-[rgba(255,255,255,0.08)] transition-all"
            title="Open BohrScan Explorer"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Mobile Navigation bar */}
      <div className="md:hidden flex border-t border-[var(--border-subtle)] px-2 py-1.5 justify-around bg-[rgba(10,15,26,0.95)]">
        <button
          onClick={() => setActiveTab('create')}
          className={`flex-1 py-1.5 text-xs font-medium text-center rounded-lg ${
            activeTab === 'create' ? 'text-[#00f2fe] bg-[#00f2fe]/10' : 'text-slate-400'
          }`}
        >
          Create Lock
        </button>
        <button
          onClick={() => setActiveTab('my-locks')}
          className={`flex-1 py-1.5 text-xs font-medium text-center rounded-lg ${
            activeTab === 'my-locks' ? 'text-[#00f2fe] bg-[#00f2fe]/10' : 'text-slate-400'
          }`}
        >
          My Locks
        </button>
        <button
          onClick={() => setActiveTab('verify')}
          className={`flex-1 py-1.5 text-xs font-medium text-center rounded-lg ${
            activeTab === 'verify' ? 'text-[#00f2fe] bg-[#00f2fe]/10' : 'text-slate-400'
          }`}
        >
          Explorer
        </button>
      </div>
    </header>
  );
};
