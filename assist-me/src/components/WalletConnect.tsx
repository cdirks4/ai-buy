import { usePrivy, useWallets } from "@privy-io/react-auth";

interface WalletConnectProps {
  onConnect: () => void;
}

const WalletConnect = ({ onConnect }: WalletConnectProps) => {
  const { login, ready, authenticated, user } = usePrivy();
  const { wallets } = useWallets();

  const handleConnect = async () => {
    if (!authenticated) {
      await login();
    }
    onConnect();
  };

  return (
    <div className="flex items-center space-x-4">
      {authenticated && user ? (
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-400">
            {wallets[0]?.address.slice(0, 6)}...{wallets[0]?.address.slice(-4)}
          </span>
          <div className="w-2 h-2 rounded-full bg-green-500" />
        </div>
      ) : (
        <button
          onClick={handleConnect}
          className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5"
        >
          Connect Wallet
        </button>
      )}
    </div>
  );
};

export default WalletConnect;