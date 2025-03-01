import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { PrivyProviderWrapper } from "@/providers/PrivyProvider";
import SubgraphProvider from "@/providers/SubgraphProvider";
import { NavBar } from "@/components/NavBar";
import { AgentWalletProvider } from "@/context/AgentWalletContext";
import { GradientWave } from "@/components/GradientWave";
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Assist Me",
  description: "AI-powered DeFi assistant on Mantle",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen antialiased`}>
        <div className="relative min-h-screen">
          <GradientWave />
          <PrivyProviderWrapper>
            <SubgraphProvider>
              <AgentWalletProvider>
                <div className="relative z-10">
                  <NavBar />
                  <main className="container mx-auto px-4 py-8">
                    {children}
                  </main>
                </div>
              </AgentWalletProvider>
            </SubgraphProvider>
          </PrivyProviderWrapper>
        </div>
      </body>
    </html>
  );
}
