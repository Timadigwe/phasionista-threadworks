import React from 'react';
import { ConnectionProvider, WalletProvider, useWallet } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl, Connection, PublicKey } from '@solana/web3.js';

// Solana Wallet Service
const network = WalletAdapterNetwork.Devnet;
const endpoint = clusterApiUrl(network);

const wallets = [
  new PhantomWalletAdapter(),
  new SolflareWalletAdapter(),
];

// Wallet Provider Component
export const SolanaWalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect={false}>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

// Hook for using wallet in React components
export const useSolanaWallet = () => {
  const { publicKey, connected, connect, disconnect, wallet } = useWallet();

  const validateAddress = (address: string): boolean => {
    const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
    return base58Regex.test(address);
  };

  const getBalance = async (publicKey: string): Promise<number> => {
    try {
      const connection = new Connection(endpoint);
      const balance = await connection.getBalance(new PublicKey(publicKey));
      return balance / 1e9;
    } catch (error) {
      console.error('Error getting balance:', error);
      return 0;
    }
  };

  return {
    publicKey: publicKey?.toString() || null,
    connected,
    connect,
    disconnect,
    wallet,
    validateAddress,
    getBalance,
  };
};