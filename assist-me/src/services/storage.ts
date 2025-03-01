interface WalletData {
  address: string;
  encryptedPrivateKey: string;
  userId: string;
  createdAt: string;
  lastAccessed: string;
}

class StorageService {
  private readonly WALLETS_KEY = 'agent_wallets';

  private getWallets(): WalletData[] {
    try {
      const data = localStorage.getItem(this.WALLETS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private saveWallets(wallets: WalletData[]): void {
    localStorage.setItem(this.WALLETS_KEY, JSON.stringify(wallets));
  }

  storeWallet(wallet: WalletData): void {
    const wallets = this.getWallets();
    wallets.push(wallet);
    this.saveWallets(wallets);
  }

  getWalletByUserId(userId: string): WalletData | null {
    const wallets = this.getWallets();
    return wallets.find(w => w.userId === userId) || null;
  }

  updateLastAccessed(address: string): void {
    const wallets = this.getWallets();
    const index = wallets.findIndex(w => w.address === address);
    if (index !== -1) {
      wallets[index].lastAccessed = new Date().toISOString();
      this.saveWallets(wallets);
    }
  }

  debugPrintWallets(): WalletData[] {
    return this.getWallets();
  }
}

export const storageService = new StorageService();