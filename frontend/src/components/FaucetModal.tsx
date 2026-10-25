import React, { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { Coins, CheckCircle, AlertCircle, Sparkles, X } from 'lucide-react';
import { ERC20_ABI } from '../contracts/abis';
import addresses from '../contracts/addresses.json';

interface FaucetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FaucetModal: React.FC<FaucetModalProps> = ({ isOpen, onClose }) => {
  const { address: userAddress, isConnected } = useAccount();
  const mockTokenAddress = (addresses.mockToken || '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512') as `0x${string}`;

  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isWaiting, isSuccess } = useWaitForTransactionReceipt({ hash });

  if (!isOpen) return null;

  const handleMint = () => {
    if (!userAddress) return;
    writeContract({
      address: mockTokenAddress,
      abi: ERC20_ABI,
      functionName: 'faucet',
      args: [userAddress, parseEther('1000')],
    });
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content p-6 sm:p-8 space-y-5" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#8a2be2]/15 border border-[#8a2be2]/30 flex items-center justify-center">
              <Coins className="w-5 h-5 text-[#c084fc]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">TEST Token Faucet</h3>
              <p className="text-xs text-[var(--text-secondary)]">BOT Chain Testnet Demo</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info */}
        <div className="text-xs text-slate-300 space-y-2">
          <p>
            Need test tokens to experiment with <strong>TokenLocker</strong>? Mint <strong>1,000 TEST</strong> tokens directly into your connected wallet with a single transaction.
          </p>
          <div className="p-3 rounded-xl bg-white/[0.03] border border-[var(--border-subtle)] space-y-1">
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Token Name:</span>
              <span className="font-semibold text-white">Test Token (TEST)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Contract Address:</span>
              <span className="font-mono text-[#00f2fe] text-[11px]">
                {mockTokenAddress.slice(0, 10)}...{mockTokenAddress.slice(-8)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Mint Quantity:</span>
              <span className="font-bold text-white">1,000 TEST</span>
            </div>
          </div>
        </div>

        {/* Mint Button */}
        {!isConnected ? (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 text-center">
            Connect wallet first to receive test tokens
          </div>
        ) : (
          <button
            onClick={handleMint}
            disabled={isPending || isWaiting}
            className="btn-primary w-full py-3.5 bg-gradient-to-r from-[#8a2be2] to-[#4facfe]"
          >
            {isPending || isWaiting ? (
              <>
                <span className="pulse-dot bg-[#040814]"></span>
                <span>Minting 1,000 TEST Tokens...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Mint 1,000 TEST Tokens Free</span>
              </>
            )}
          </button>
        )}

        {/* Success */}
        {isSuccess && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Success! 1,000 TEST tokens have been minted to your wallet.</span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error.message.slice(0, 80)}...</span>
          </div>
        )}
      </div>
    </div>
  );
};
