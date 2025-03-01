import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as fcl from "@onflow/fcl";
import { FlowWalletService } from '@/services/flowWallet';

interface FlowWalletContextType {
  user: any;
  logIn: () => Promise<void>;
  logOut: () => Promise<void>;
  isReady: boolean;
}

const FlowWalletContext = createContext<FlowWalletContextType>({
  user: null,
  logIn: async () => {},
  logOut: async () => {},
  isReady: false
});

export function FlowWalletProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    fcl.currentUser().subscribe(setUser);
    setIsReady(true);
  }, []);

  const logIn = async () => {
    try {
      await FlowWalletService.authenticate();
    } catch (error) {
      console.error("Failed to log in:", error);
      throw error;
    }
  };

  const logOut = async () => {
    try {
      await FlowWalletService.unauthenticate();
    } catch (error) {
      console.error("Failed to log out:", error);
      throw error;
    }
  };

  return (
    <FlowWalletContext.Provider value={{ user, logIn, logOut, isReady }}>
      {children}
    </FlowWalletContext.Provider>
  );
}

export function useFlowWallet() {
  const context = useContext(FlowWalletContext);
  if (!context) {
    throw new Error("useFlowWallet must be used within a FlowWalletProvider");
  }
  return context;
}