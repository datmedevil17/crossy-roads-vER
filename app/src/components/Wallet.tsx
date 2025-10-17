import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import "./Wallet.css";

export function Wallet() {
  return (
    <div id="wallet">
      <WalletMultiButton
        style={{ 
          backgroundColor: '#16a34a', 
          color: 'white',
          borderRadius: '0.5rem',
          border: 'none',
          padding: '0.5rem 1rem',
          fontSize: '0.875rem',
          fontWeight: '500',
        }}
      />
    </div>
  );
}
