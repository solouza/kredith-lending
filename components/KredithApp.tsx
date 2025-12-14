'use client';

import React, { useState, useEffect, FormEvent } from 'react';
import { 
  Wallet, Building2, TrendingUp, CheckCircle2, ArrowRight, 
  LogOut, Star, Award, FileText, Zap, Landmark, Clock, PlusCircle, Loader2
} from 'lucide-react';

// --- IOTA IMPORTS ---
import { getFullnodeUrl } from '@iota/iota-sdk/client';
import { Transaction } from '@iota/iota-sdk/transactions'; 
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { 
  createNetworkConfig, 
  IotaClientProvider, 
  WalletProvider, 
  useCurrentAccount, 
  useSignAndExecuteTransaction,
  useIotaClient, 
  ConnectButton, 
  useDisconnectWallet
} from '@iota/dapp-kit';
import '@iota/dapp-kit/dist/index.css';

// --- CONFIGURATION ---
const PACKAGE_ID = '0x8f412472693c878a83e21547fa9c37f0a8db8df11be1db6e265809d4d56ffd8c'; 
const MODULE_NAME = 'umkm_reputation';
const KREDITH_SCORE_TYPE = `${PACKAGE_ID}::${MODULE_NAME}::KredithScore`;

const { networkConfig } = createNetworkConfig({
  testnet: { url: getFullnodeUrl('testnet') },
});
const queryClient = new QueryClient();

// --- TYPES & INTERFACES ---
type ToastType = 'success' | 'error' | '';

interface TxHistory {
  id: number;
  date: string;
  desc: string;
  amount: number;
}

interface Business {
  id: string;
  owner: string | null;
  name: string;
  category: string;
  revenue: number;
  tier: string;
  image_url: string;
  history: TxHistory[];
}

interface ToastProps {
  message: string;
  type: ToastType;
  txDigest?: string; 
  onClose: () => void;
}

interface ComicButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'danger';
  children: React.ReactNode;
}

interface ComicCardProps {
  children: React.ReactNode;
  className?: string;
}

interface ComicInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

type ViewState = 'home' | 'register' | 'dashboard' | 'lenders';

// --- UI COMPONENTS ---

const KredithLogo = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M32 2L40 18L58 12L50 28L62 40L46 44L48 60L32 50L16 60L18 44L2 40L14 28L6 12L24 18L32 2Z" fill="#FACC15" stroke="black" strokeWidth="3" strokeLinejoin="round"/>
    <path d="M32 14L48 24V40L32 50L16 40V24L32 14Z" fill="white" stroke="black" strokeWidth="3"/>
    <path d="M26 22V42" stroke="black" strokeWidth="5" strokeLinecap="round"/>
    <path d="M40 22L26 32L40 42" stroke="black" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const Toast = ({ message, type, txDigest, onClose }: ToastProps) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 6000); 
    return () => clearTimeout(timer);
  }, [onClose, message]);

  if (!message) return null;

  const explorerUrl = txDigest 
    ? `https://explorer.rebased.iota.org/tx/${txDigest}?network=testnet` 
    : '#';

  return (
    <div className={`fixed top-6 right-6 z-50 animate-bounce-in`}>
      <div className={`relative bg-white border-4 border-black px-6 py-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col items-start transform -rotate-1 max-w-sm`}>
        <div className="flex items-center space-x-3 mb-1">
          {type === 'success' ? (
            <CheckCircle2 size={28} className="text-green-500 fill-black" strokeWidth={3} />
          ) : (
            <div className="bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-black border-2 border-black">!</div>
          )}
          <span className="font-black font-sans text-black uppercase tracking-wide text-sm md:text-base">{message}</span>
        </div>
        {txDigest && (
           <a href={explorerUrl} target="_blank" rel="noreferrer" className="ml-10 text-xs font-bold text-blue-600 underline hover:text-blue-800 flex items-center gap-1">
             View on Explorer <ArrowRight size={12} />
           </a>
        )}
      </div>
    </div>
  );
};

const ComicButton = ({ children, onClick, variant = 'primary', disabled, className = '', ...props }: ComicButtonProps) => {
  const baseStyle = "px-6 py-3 font-black text-lg border-4 border-black transition-all active:translate-y-1 active:shadow-none flex items-center justify-center gap-2 uppercase tracking-wider transform hover:-rotate-1 hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]";
  const variants = {
    primary: "bg-yellow-400 text-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:bg-yellow-300",
    secondary: "bg-white text-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:bg-gray-50",
    accent: "bg-cyan-400 text-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:bg-cyan-300",
    danger: "bg-red-400 text-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:bg-red-300"
  };
  return (
    <button onClick={onClick} disabled={disabled} className={`${baseStyle} ${variants[variant]} ${disabled ? 'opacity-50 cursor-not-allowed shadow-none translate-y-1 rotate-0' : ''} ${className}`} {...props}>
      {children}
    </button>
  );
};

const ComicCard = ({ children, className = '' }: ComicCardProps) => (
  <div className={`bg-white border-4 border-black shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] p-6 relative overflow-hidden ${className}`}>
    {children}
  </div>
);

const ComicInput = ({ className = '', ...props }: ComicInputProps) => (
  <input {...props} className={`w-full bg-white border-4 border-black px-4 py-3 font-black text-black placeholder-gray-400 focus:outline-none focus:shadow-[6px_6px_0px_0px_#FACC15] transition-all ${className}`} />
);

// --- VIEW COMPONENTS ---

interface NavbarProps {
  currentView: ViewState;
  setCurrentView: (view: ViewState) => void;
  myBusiness: Business | null;
}

const Navbar = ({ currentView, setCurrentView, myBusiness }: NavbarProps) => {
  const account = useCurrentAccount();
  const { mutate: disconnect } = useDisconnectWallet();
  
  return (
    <nav className="bg-white border-b-4 border-black sticky top-0 z-40 py-4 shadow-md">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => setCurrentView('home')}>
          <div className="transform group-hover:scale-110 transition-transform duration-200">
             <KredithLogo className="w-14 h-14 drop-shadow-[4px_4px_0px_rgba(0,0,0,1)]" />
          </div>
          <div className="flex flex-col transform -rotate-2">
            <span className="text-4xl font-black tracking-tighter text-black leading-none drop-shadow-[2px_2px_0px_#FACC15]">KREDITH</span>
          </div>
        </div>
        <div className="flex items-center space-x-6">
          {account ? (
            <div className="flex items-center space-x-4">
              <button onClick={() => setCurrentView('lenders')} className={`font-black text-sm uppercase border-2 border-transparent hover:border-black hover:bg-cyan-300 px-3 py-1 transition-all transform hover:-rotate-2 ${currentView === 'lenders' ? 'bg-cyan-300 border-black -rotate-2' : 'text-black'}`}>Pinjaman</button>
              <button onClick={() => setCurrentView(myBusiness ? 'dashboard' : 'register')} className={`font-black text-sm uppercase border-2 border-transparent hover:border-black hover:bg-yellow-300 px-3 py-1 transition-all transform hover:rotate-2 ${currentView !== 'home' && currentView !== 'lenders' ? 'bg-yellow-300 border-black rotate-1' : 'text-black'}`}>{myBusiness ? 'Dashboard' : 'Register'}</button>
              <div className="hidden md:flex bg-black px-4 py-2 border-2 border-black items-center space-x-2 transform rotate-1">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse border border-white"></div>
                <span className="font-bold text-xs text-white tracking-widest">{account.address.slice(0, 6)}...{account.address.slice(-4)}</span>
              </div>
              <button onClick={() => disconnect()} className="text-black hover:text-red-500 transition-colors"><LogOut size={28} strokeWidth={3} /></button>
            </div>
          ) : (
            <ConnectButton className="!bg-white !text-black !font-black !border-4 !border-black !rounded-none !shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:!bg-gray-50 hover:!translate-y-[-2px] !font-sans" connectText="CONNECT WALLET" />
          )}
        </div>
      </div>
    </nav>
  );
};

// === HOME VIEW (LENGKAP DENGAN GAME PLAN & DATA PREVIEW) ===
interface HomeViewProps {
  setCurrentView: (view: ViewState) => void;
  isConnected: boolean;
  isChecking: boolean;
}

const HomeView = ({ setCurrentView, isConnected, isChecking }: HomeViewProps) => (
  <div className="flex flex-col w-full bg-white text-black overflow-hidden">
    {/* 1. Hero Section */}
    <div className="flex flex-col items-center justify-center min-h-[75vh] text-center px-4 py-20 relative overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-20 bg-[repeating-conic-gradient(#FACC15_0_15deg,transparent_15deg_30deg)] animate-spin-slow origin-center scale-150"></div>
      <div className="absolute top-20 left-10 md:left-20 text-yellow-400 opacity-90 transform -rotate-12 hidden md:block z-10 drop-shadow-[4px_4px_0px_black]">
        <Star size={120} fill="currentColor" stroke="black" strokeWidth={2} />
      </div>
      <div className="absolute bottom-20 right-10 md:right-20 text-cyan-400 opacity-90 transform rotate-12 hidden md:block z-10 drop-shadow-[4px_4px_0px_black]">
        <Zap size={100} fill="currentColor" stroke="black" strokeWidth={2} />
      </div>

      <div className="max-w-5xl space-y-8 animate-bounce-in relative z-10">
        <div className="inline-block px-8 py-3 bg-white border-4 border-black shadow-[6px_6px_0px_0px_#000] transform -rotate-2">
          <span className="font-black text-sm md:text-lg tracking-widest uppercase">Powered by IOTA Move</span>
        </div>
        <h1 className="text-6xl md:text-8xl font-black text-black leading-none tracking-tighter drop-shadow-[6px_6px_0px_#FACC15] transform rotate-1">
          RECORD YOUR <br/>
          <span className="text-white text-stroke-3 text-stroke-black bg-black px-4 transform -skew-x-12 inline-block my-2 shadow-[8px_8px_0px_#FACC15]">TRANSACTIONS</span> <br/>
          INTO REPUTATION!
        </h1>
        <div className="flex flex-col sm:flex-row justify-center gap-6 mt-16">
          {isConnected ? (
             isChecking ? (
                <div className="flex items-center gap-2 font-black text-xl bg-white border-4 border-black px-8 py-4 shadow-[6px_6px_0px_0px_#000]">
                   <Loader2 className="animate-spin" /> CHECKING DATABASE...
                </div>
             ) : (
                <ComicButton onClick={() => setCurrentView('register')} variant="primary" className="text-xl px-10 py-4">
                    START NOW <ArrowRight size={24} strokeWidth={4} />
                </ComicButton>
             )
          ) : (
            <ConnectButton 
                className="!bg-yellow-400 !text-black !font-black !text-xl !px-10 !py-4 !border-4 !border-black !rounded-none !shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
                connectText="CONNECT TO START"
            />
          )}
        </div>
      </div>
    </div>

    {/* 2. Comic Strip Section (GAME PLAN) */}
    <div className="bg-white py-24 px-4 border-y-4 border-black">
      <div className="container mx-auto max-w-7xl">
        <div className="bg-cyan-400 border-4 border-black p-4 inline-block mb-12 shadow-[8px_8px_0px_0px_#000] transform -rotate-1">
             <h2 className="text-4xl md:text-5xl font-black text-black uppercase tracking-tighter">The Game Plan</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-4 border-black bg-white shadow-[16px_16px_0px_0px_#000]">
          {[
            { step: '01', title: 'MINT BADGE', desc: 'Register once. Mint your unique "Kredith Score" NFT!', icon: <Award size={48} strokeWidth={2.5}/>, color: 'bg-yellow-300' },
            { step: '02', title: 'RECORD REVENUE', desc: 'Input sales. Data stored forever. NO GAS FEES!', icon: <FileText size={48} strokeWidth={2.5}/>, color: 'bg-red-400' },
            { step: '03', title: 'LEVEL UP', desc: 'Hit 10M, 100M revenue. Upgrade Tier automatically!', icon: <TrendingUp size={48} strokeWidth={2.5}/>, color: 'bg-green-400' }
          ].map((item, idx) => (
            <div key={idx} className={`relative p-8 border-b-4 md:border-b-0 md:border-r-4 border-black last:border-0 hover:bg-gray-50 transition-colors`}>
              <div className={`absolute top-4 left-4 ${item.color} border-4 border-black w-14 h-14 flex items-center justify-center font-black text-2xl shadow-[4px_4px_0px_0px_#000]`}>
                {item.step}
              </div>
              <div className="mt-16 text-center flex flex-col items-center">
                <div className="mb-6 transform hover:scale-125 transition-transform duration-300 drop-shadow-[4px_4px_0px_rgba(0,0,0,0.5)]">
                    {item.icon}
                </div>
                <h3 className="text-3xl font-black text-black mb-3 uppercase italic transform -rotate-1">{item.title}</h3>
                <p className="text-black font-bold text-lg leading-tight border-t-4 border-black pt-4 w-full">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* 3. Data Preview Section (DATA SPEAKS LOUDER) */}
    <div className="py-24 px-4 bg-gradient-to-br from-white via-gray-100 to-gray-200">
      <div className="container mx-auto max-w-6xl">
         <div className="flex flex-col md:flex-row gap-12 items-center">
             <div className="md:w-1/2 space-y-6">
                 <div className="bg-black text-white p-4 inline-block transform rotate-1 shadow-[8px_8px_0px_0px_#FACC15]">
                    <h2 className="text-4xl font-black uppercase">Data Speaks Louder!</h2>
                 </div>
                 <p className="text-xl font-bold border-l-8 border-black pl-6 py-2">
                    No more boring audits. Kredith shows your power level on-chain:
                 </p>
                 <div className="space-y-4">
                    {['Total Revenue', 'Reputation Tier', 'Category Verified'].map((text, i) => (
                        <div key={i} className="flex items-center space-x-4 bg-white border-4 border-black p-3 shadow-[4px_4px_0px_0px_#000] hover:translate-x-2 transition-transform cursor-default">
                            <CheckCircle2 size={24} className="text-green-500 fill-black" strokeWidth={3} />
                            <span className="font-black text-lg uppercase">{text}</span>
                        </div>
                    ))}
                 </div>
             </div>

             <div className="md:w-1/2 w-full">
                 <div className="relative">
                    <div className="absolute -inset-4 bg-black transform rotate-3"></div>
                    <div className="absolute -inset-4 bg-yellow-400 transform -rotate-2"></div>
                    
                    <div className="relative bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_#000]">
                        <div className="absolute -top-6 -right-6">
                            <Star size={80} className="text-yellow-400 fill-yellow-400 drop-shadow-[4px_4px_0px_#000] stroke-black stroke-[3]" />
                        </div>
                        
                        <div className="flex items-center border-b-4 border-black pb-4 mb-4 space-x-4">
                            <div className="w-16 h-16 bg-blue-400 border-4 border-black rounded-full flex items-center justify-center">
                                <Building2 size={32} strokeWidth={3} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black uppercase">Warteg Bahari</h3>
                                <div className="bg-black text-white px-2 py-1 text-xs font-bold inline-block">ID: 0x8A...2B9</div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gray-100 border-4 border-black p-2 text-center">
                                <div className="text-xs font-black text-gray-500">REVENUE</div>
                                <div className="text-2xl font-black">150.2 Jt</div>
                            </div>
                            <div className="bg-gray-100 border-4 border-black p-2 text-center">
                                <div className="text-xs font-black text-gray-500">CATEGORY</div>
                                <div className="text-2xl font-black">F&B</div>
                            </div>
                        </div>
                    </div>
                 </div>
             </div>
         </div>
      </div>
    </div>
  </div>
);

// --- REGISTER, DASHBOARD, LENDERS ---

interface RegisterViewProps { handleRegister: (e: FormEvent<HTMLFormElement>) => void; isLoading: boolean; }
const RegisterView = ({ handleRegister, isLoading }: RegisterViewProps) => (
  <div className="min-h-[85vh] flex items-center justify-center bg-yellow-400 relative overflow-hidden px-4 py-12">
    <div className="absolute top-0 right-0 w-full h-full bg-cyan-400 clip-path-polygon-split z-0"></div>
    <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-yellow-400 z-0"></div>
    <style>{`.clip-path-polygon-split { clip-path: polygon(100% 0, 0 0, 100% 100%); }`}</style>
    <div className="w-full max-w-md bg-white border-4 border-black shadow-[16px_16px_0px_0px_#000] p-8 relative transform rotate-1 z-10">
      <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-white border-4 border-black px-6 py-2 shadow-[4px_4px_0px_0px_#000]"><span className="font-black text-xl uppercase">New Player</span></div>
      <div className="text-center mb-8 border-b-4 border-black pb-6 mt-4"><div className="w-24 h-24 mx-auto mb-4 bg-cyan-300 rounded-full border-4 border-black flex items-center justify-center"><Building2 size={48} strokeWidth={3} /></div><h2 className="text-4xl font-black text-black uppercase transform -rotate-1">Registration</h2></div>
      <form onSubmit={handleRegister} className="space-y-6">
        <div><label className="block text-sm font-black text-black mb-2 uppercase tracking-wide bg-yellow-300 inline-block px-2 border-2 border-black transform -rotate-1">Business Name</label><ComicInput name="businessName" type="text" required placeholder="E.g. KOPI SENJA" /></div>
        <div><label className="block text-sm font-black text-black mb-2 uppercase tracking-wide bg-cyan-300 inline-block px-2 border-2 border-black transform rotate-1">Sector Category</label><div className="relative"><select name="category" className="w-full appearance-none bg-white border-4 border-black px-4 py-3 font-black text-black focus:outline-none focus:shadow-[6px_6px_0px_0px_#FACC15] transition-all"><option value="F&B">FOOD & BEVERAGE</option><option value="Retail">RETAIL / GROCERY</option><option value="Service">SERVICES</option><option value="Technology">TECHNOLOGY</option></select><div className="absolute right-4 top-4 pointer-events-none text-black font-black">▼</div></div></div>
        <ComicButton type="submit" disabled={isLoading} variant="primary" className="w-full text-xl py-4 mt-4">{isLoading ? <span className="animate-pulse">MINTING...</span> : 'MINT IDENTITY'}</ComicButton>
      </form>
      <div className="mt-8 text-center font-bold text-xs"><p>* GAS FEES APPLY. INITIAL TIER: BRONZE.</p></div>
    </div>
  </div>
);

interface DashboardViewProps { myBusiness: Business | null; handleRecordRevenue: (e: FormEvent<HTMLFormElement>) => void; isLoading: boolean; }
const DashboardView = ({ myBusiness, handleRecordRevenue, isLoading }: DashboardViewProps) => {
  if (!myBusiness) return <div className="min-h-screen flex items-center justify-center bg-white font-black text-3xl uppercase tracking-widest animate-pulse">LOADING ARCHIVES...</div>;
  const getTierStyle = (tier: string) => { switch(tier) { case 'Gold': return 'bg-yellow-400 text-black'; case 'Silver': return 'bg-gray-300 text-black'; default: return 'bg-orange-400 text-black'; } };
  const getNextMilestone = (revenue: number) => { if (revenue >= 100000000) return "MAX POWER REACHED!"; if (revenue >= 10000000) return `NEXT: GOLD (${(100000000 - revenue).toLocaleString('id-ID')} MORE)`; return `NEXT: SILVER (${(10000000 - revenue).toLocaleString('id-ID')} MORE)`; };
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 relative">
      <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-300 rounded-full blur-3xl opacity-20 pointer-events-none"></div>
      <div className="container mx-auto max-w-6xl relative z-10">
        <div className="bg-white border-4 border-black p-6 mb-10 shadow-[8px_8px_0px_0px_#000] flex flex-col md:flex-row justify-between items-end">
          <div className="flex items-center space-x-6"><div className="hidden md:flex w-20 h-20 border-4 border-black bg-yellow-300 items-center justify-center transform -rotate-3 shadow-[4px_4px_0px_0px_#000]"><KredithLogo className="w-16 h-16" /></div><div><h2 className="text-4xl md:text-5xl font-black text-black uppercase italic">{myBusiness.name}</h2><div className="flex items-center space-x-3 mt-2"><span className="bg-cyan-300 px-3 py-1 border-2 border-black text-sm font-black text-black uppercase transform rotate-2">{myBusiness.category}</span><span className="font-bold text-sm bg-black text-white px-2 py-1">ID: {myBusiness.id.substring(0, 12)}...</span></div></div></div>
          <div className="mt-4 md:mt-0 text-right"><div className="flex items-center gap-2 bg-green-400 border-2 border-black px-3 py-1 shadow-[2px_2px_0px_0px_#000]"><div className="w-3 h-3 bg-white rounded-full animate-pulse border border-black"></div><span className="font-black text-sm">ONLINE</span></div></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-5">
            <div className="bg-white p-6 border-4 border-black shadow-[12px_12px_0px_0px_#000] relative">
               <div className="absolute top-0 left-0 w-0 h-0 border-t-[40px] border-t-black border-r-[40px] border-r-transparent"></div>
               <div className={`absolute top-0 right-0 -mt-4 -mr-4 text-sm font-black uppercase px-6 py-2 border-4 border-black shadow-[4px_4px_0px_0px_#000] z-10 transform rotate-3 ${getTierStyle(myBusiness.tier)}`}>{myBusiness.tier} Class</div>
               <div className="border-4 border-black bg-gray-100 p-4 mb-6 mt-4"><div className="aspect-square bg-white flex items-center justify-center border-2 border-dashed border-gray-400 relative overflow-hidden group"><img src={myBusiness.image_url} alt={myBusiness.tier} className="w-3/4 h-3/4 object-contain drop-shadow-[8px_8px_0px_rgba(0,0,0,0.2)] z-10 relative group-hover:scale-110 transition-transform duration-300"/><div className="absolute inset-0 opacity-10 bg-[repeating-conic-gradient(black_0_15deg,transparent_15deg_30deg)]"></div></div></div>
               <div className="space-y-4 font-bold border-4 border-black p-4 bg-yellow-50"><div className="flex justify-between border-b-2 border-black pb-2"><span className="text-gray-600">STATUS</span><span className="font-black uppercase text-green-600">{myBusiness.tier} VERIFIED</span></div><div className="flex justify-between"><span className="text-gray-600">ISSUER</span><span className="font-black">KREDITH DAO</span></div></div>
               <div className="mt-6"><div className="flex justify-between mb-2 font-black text-xs uppercase bg-black text-white px-2 py-1"><span>Next Level</span><span>{getNextMilestone(myBusiness.revenue)}</span></div><div className="w-full bg-white border-4 border-black h-6 p-0.5"><div className="bg-gradient-to-r from-yellow-400 to-red-500 h-full transition-all duration-1000 border-r-2 border-black" style={{ width: `${Math.min((myBusiness.revenue / 100000000) * 100, 100)}%` }}></div></div></div>
            </div>
          </div>
          <div className="md:col-span-7 space-y-8">
            <div className="grid grid-cols-2 gap-6"><ComicCard className="bg-cyan-200"><div className="flex flex-col items-start justify-between h-full"><div className="bg-white border-2 border-black p-2 mb-2 rounded-full"><TrendingUp className="text-black" strokeWidth={3} /></div><div><p className="font-black text-sm opacity-70 mb-1">TOTAL REVENUE</p><h3 className="text-2xl md:text-4xl font-black tracking-tighter">{myBusiness.revenue.toLocaleString('id-ID')}</h3><p className="text-xs font-bold">IDR</p></div></div></ComicCard><ComicCard className="bg-purple-300"><div className="flex flex-col items-start justify-between h-full"><div className="bg-white border-2 border-black p-2 mb-2 rounded-full"><Star className="text-black" strokeWidth={3} /></div><div><p className="font-black text-sm opacity-70 mb-1">TRUST SCORE</p><h3 className="text-3xl md:text-4xl font-black text-black">{myBusiness.tier === 'Gold' ? 'AAA' : myBusiness.tier === 'Silver' ? 'BBB' : 'B-'}</h3></div></div></ComicCard></div>
            <div className="bg-white p-8 border-4 border-black shadow-[12px_12px_0px_0px_#FACC15] relative"><div className="absolute -top-5 left-10 bg-red-500 text-white px-4 py-1 border-4 border-black font-black transform -rotate-2">ACTION REQUIRED!</div><div className="flex items-center space-x-3 mb-6 border-b-4 border-black pb-4 mt-2"><PlusCircle size={32} strokeWidth={3} /><h3 className="text-2xl font-black uppercase italic">Record Transaction</h3></div><form onSubmit={handleRecordRevenue} className="space-y-6"><div><label className="block text-sm font-black text-black mb-2 uppercase tracking-wide bg-yellow-300 inline-block px-2 border-2 border-black transform -rotate-1">Description</label><ComicInput name="description" type="text" required placeholder="E.g. Jual 50 Paket Nasi" /></div><div className="grid grid-cols-1 md:grid-cols-5 gap-4"><div className="md:col-span-3"><label className="block text-sm font-black text-black mb-2 uppercase">Amount (IDR)</label><div className="relative"><span className="absolute left-4 top-3.5 text-black font-black text-lg">Rp</span><ComicInput name="amount" type="number" min="1" required placeholder="0" className="pl-12 text-2xl" /></div></div><div className="md:col-span-2 flex items-end"><ComicButton type="submit" disabled={isLoading} variant="primary" className="w-full h-[60px] text-xl">{isLoading ? <span>...</span> : <><span>SUBMIT</span><ArrowRight size={24} strokeWidth={4} /></>}</ComicButton></div></div></form></div>
            <div className="bg-white border-4 border-black p-0 shadow-[8px_8px_0px_0px_#000]"><div className="bg-black p-4 flex items-center justify-between border-b-4 border-black"><h3 className="text-white font-black text-xl uppercase flex items-center gap-2"><Clock className="text-yellow-400" /> Transaction History</h3><div className="text-xs font-bold bg-yellow-400 px-2 py-1 text-black border-2 border-white transform rotate-2">LATEST ENTRIES</div></div><div className="max-h-[300px] overflow-y-auto p-4 space-y-3 bg-[url('https://www.transparenttextures.com/patterns/white-diamond.png')]">{myBusiness.history && myBusiness.history.length > 0 ? (myBusiness.history.map((tx) => (<div key={tx.id} className="bg-white border-4 border-black p-3 flex justify-between items-center hover:bg-yellow-50 transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]"><div><div className="font-black text-lg leading-tight uppercase">{tx.desc}</div><div className="text-xs font-bold text-gray-500 bg-gray-200 px-1 inline-block mt-1 border border-gray-400">{tx.date}</div></div><div className="text-right"><div className="font-black text-xl text-green-600">+{tx.amount.toLocaleString('id-ID')}</div><div className="text-xs font-bold bg-black text-white px-1 inline-block">IDR</div></div></div>))) : (<div className="text-center py-8 font-black text-gray-400 italic border-4 border-dashed border-gray-300">NO DATA RECORDED YET...</div>)}</div></div>
          </div>
        </div>
      </div>
    </div>
  );
};

const LendersView = ({ setCurrentView }: { setCurrentView: (view: ViewState) => void }) => {
  const lenders = [ { id: 1, name: "Bank Rakyat Digital", desc: "Solusi modal kerja untuk UMKM yang sedang berkembang pesat.", color: "bg-cyan-200", reqTier: "Silver", minTx: 20, maxLoan: "500 Juta" }, { id: 2, name: "Ventura Kilat", desc: "Pendanaan cepat cair untuk kebutuhan mendesak.", color: "bg-yellow-200", reqTier: "Bronze", minTx: 5, maxLoan: "50 Juta" }, { id: 3, name: "Mega Investama", desc: "Mitra strategis untuk ekspansi bisnis skala besar.", color: "bg-purple-200", reqTier: "Gold", minTx: 50, maxLoan: "2 Miliar" }, { id: 4, name: "Koperasi Warga", desc: "Bunga rendah, dari kita untuk kita.", color: "bg-green-200", reqTier: "Bronze", minTx: 2, maxLoan: "10 Juta" } ];
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-12 relative overflow-hidden"><div className="absolute top-0 left-0 w-full h-64 bg-black transform -skew-y-2 origin-top-left z-0"></div><div className="container mx-auto max-w-6xl relative z-10"><div className="mb-12 text-center"><div className="inline-block bg-yellow-400 border-4 border-black px-6 py-2 shadow-[6px_6px_0px_0px_#000] transform -rotate-2 mb-4"><h1 className="text-4xl md:text-5xl font-black text-black uppercase tracking-tighter">Mitra Peminjam</h1></div><p className="text-white font-bold text-lg max-w-2xl mx-auto drop-shadow-[2px_2px_0px_#000]">Pilih mitra yang sesuai dengan reputasi on-chain bisnis Anda.</p></div><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">{lenders.map((lender) => (<div key={lender.id} className="relative group"><div className={`absolute inset-0 border-4 border-black bg-black translate-x-3 translate-y-3`}></div><div className={`relative h-full bg-white border-4 border-black p-6 flex flex-col transition-transform group-hover:-translate-x-1 group-hover:-translate-y-1`}> <div className={`-mx-6 -mt-6 p-6 border-b-4 border-black ${lender.color} flex flex-col items-center text-center`}><div className="w-16 h-16 bg-white border-4 border-black rounded-full flex items-center justify-center mb-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]"><Landmark size={32} strokeWidth={2.5} /></div><h3 className="font-black text-xl leading-tight uppercase">{lender.name}</h3></div> <div className="flex-grow py-6 text-center"><p className="text-sm font-bold text-gray-600 mb-6">{lender.desc}</p><div className="space-y-3"><div className="flex items-center justify-between bg-gray-50 p-2 border-2 border-black border-dashed"><span className="text-xs font-black uppercase text-gray-500">Syarat Tier</span><span className={`text-sm font-black uppercase px-2 ${lender.reqTier === 'Gold' ? 'bg-yellow-400' : lender.reqTier === 'Silver' ? 'bg-gray-300' : 'bg-orange-400'} border border-black`}>{lender.reqTier}</span></div><div className="flex items-center justify-between bg-gray-50 p-2 border-2 border-black border-dashed"><span className="text-xs font-black uppercase text-gray-500">Min. Transaksi</span><span className="text-sm font-black uppercase">{lender.minTx} / Hari</span></div><div className="flex items-center justify-between bg-gray-50 p-2 border-2 border-black border-dashed"><span className="text-xs font-black uppercase text-gray-500">Max Limit</span><span className="text-sm font-black uppercase text-green-600">{lender.maxLoan}</span></div></div></div><div className="mt-auto pt-4 border-t-4 border-black"><ComicButton variant="secondary" className="w-full text-sm py-2">Lihat Detail</ComicButton></div></div></div>))}</div></div></div>
  );
};


// --- MAIN APP LOGIC (OTAKNYA DI SINI) ---

function KredithApp() {
  const [currentView, setCurrentView] = useState<ViewState>('home'); 
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(false); 
  const [toast, setToast] = useState<Omit<ToastProps, 'onClose'>>({ message: '', type: '', txDigest: '' });
  const [myBusiness, setMyBusiness] = useState<Business | null>(null);

  // --- IOTA HOOKS ---
  const account = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const client = useIotaClient();

  // --- 1. AUTO LOGIN LOGIC ---
  useEffect(() => {
    async function checkExistingBusiness() {
      if (!account) {
        setMyBusiness(null);
        setCurrentView('home');
        return;
      }

      setIsChecking(true);
      try {
        const ownedObjects = await client.getOwnedObjects({
          owner: account.address,
          filter: { StructType: KREDITH_SCORE_TYPE },
          options: { showContent: true }
        });

        if (ownedObjects.data.length > 0) {
          const objData = ownedObjects.data[0].data?.content;
          
          if (objData && objData.dataType === 'moveObject') {
             const fields = objData.fields as any;
             setMyBusiness({
                id: ownedObjects.data[0].data?.objectId || "",
                owner: account.address,
                name: fields.name,
                category: fields.category,
                revenue: parseInt(fields.revenue),
                tier: fields.tier,
                image_url: fields.image_url,
                history: []
             });
             setCurrentView('dashboard');
             setToast({ message: `WELCOME BACK, ${fields.name}!`, type: 'success' });
          }
        }
      } catch (err) {
        console.error("Error checking business:", err);
      } finally {
        setIsChecking(false);
      }
    }

    checkExistingBusiness();
  }, [account, client]);

  // --- 2. REGISTER LOGIC ---
  const handleRegister = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!account) return alert("Wallet not connected!");

    const formData = new FormData(e.currentTarget);
    const name = formData.get('businessName') as string;
    const category = formData.get('category') as string;
    
    setIsLoading(true);

    const tx = new Transaction();
    tx.moveCall({
      target: `${PACKAGE_ID}::${MODULE_NAME}::register`,
      arguments: [tx.pure.string(name), tx.pure.string(category)],
    });

    signAndExecute(
      { transaction: tx },
      {
        onSuccess: async (result) => {
          setToast({ message: 'SUCCESS! NFT MINTED!', type: 'success', txDigest: result.digest });
          try {
            const txBlock = await client.waitForTransaction({ digest: result.digest, options: { showEffects: true } });
            const createdId = txBlock.effects?.created?.[0]?.reference?.objectId;
            
            if (createdId) {
               setMyBusiness({
                  id: createdId,
                  owner: account.address,
                  name: name,
                  category: category,
                  revenue: 0,
                  tier: "Bronze",
                  image_url: "https://cdn-icons-png.flaticon.com/128/14458/14458082.png",
                  history: []
               });
               setCurrentView('dashboard');
            }
          } catch (e) {
             console.error(e);
          } finally {
            setIsLoading(false);
          }
        },
        onError: (err) => {
          setIsLoading(false);
          setToast({ message: 'FAILED: ' + err.message, type: 'error' });
        }
      }
    );
  };

  // --- 3. REVENUE LOGIC ---
  const handleRecordRevenue = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const amount = parseInt(formData.get('amount') as string);
    const description = formData.get('description') as string;

    if (!amount || amount <= 0) return;
    if (!myBusiness || !myBusiness.id) return alert("Error: Business ID not found.");

    setIsLoading(true);

    const tx = new Transaction();
    tx.moveCall({
      target: `${PACKAGE_ID}::${MODULE_NAME}::record_revenue`,
      arguments: [tx.object(myBusiness.id), tx.pure.u64(amount)],
    });

    signAndExecute(
      { transaction: tx },
      {
        onSuccess: (result) => {
          setIsLoading(false);
          setToast({ message: 'REVENUE RECORDED!', type: 'success', txDigest: result.digest });

          setMyBusiness((prev) => {
             if (!prev) return null;
             const newRevenue = prev.revenue + amount;
             let newTier = prev.tier;
             let newImageUrl = prev.image_url;
             if (newRevenue > 100000000) { newTier = "Gold"; newImageUrl = "https://cdn-icons-png.flaticon.com/128/14458/14458116.png"; } 
             else if (newRevenue > 10000000) { newTier = "Silver"; newImageUrl = "https://cdn-icons-png.flaticon.com/128/14457/14457452.png"; }

             const newTx: TxHistory = { id: Date.now(), date: new Date().toLocaleDateString('id-ID'), desc: description, amount: amount };
             return { ...prev, revenue: newRevenue, tier: newTier, image_url: newImageUrl, history: [newTx, ...prev.history] };
          });
          (e.target as HTMLFormElement).reset();
        },
        onError: (err) => {
          setIsLoading(false);
          setToast({ message: 'FAILED: ' + err.message, type: 'error' });
        }
      }
    );
  };

  return (
    <div className="font-sans min-h-screen flex flex-col bg-white text-black selection:bg-yellow-400 selection:text-black">
      <Navbar currentView={currentView} setCurrentView={setCurrentView} myBusiness={myBusiness} />
      <main className="flex-grow">
        {currentView === 'home' && <HomeView setCurrentView={setCurrentView} isConnected={!!account} isChecking={isChecking} />}
        {currentView === 'register' && <RegisterView handleRegister={handleRegister} isLoading={isLoading} />}
        {currentView === 'dashboard' && <DashboardView myBusiness={myBusiness} handleRecordRevenue={handleRecordRevenue} isLoading={isLoading} />}
        {currentView === 'lenders' && <LendersView setCurrentView={setCurrentView} />}
      </main>
      <footer className="bg-black text-white py-12 mt-auto border-t-8 border-yellow-400">
        <div className="container mx-auto px-4 text-center">
          <p className="font-black text-2xl mb-2 tracking-widest uppercase italic">KREDITH &copy; 2025</p>
          <div className="mt-6"><code className="text-xs font-mono bg-yellow-400 text-black px-2 py-1 border-2 border-white">Module: KREDITH::umkm_reputation</code></div>
        </div>
      </footer>
      <Toast message={toast.message} type={toast.type} txDigest={toast.txDigest} onClose={() => setToast({ message: '', type: '', txDigest: '' })} />
    </div>
  );
}

// --- ROOT WRAPPER ---
export default function AppWrapper() {
  return (
    <QueryClientProvider client={queryClient}>
      <IotaClientProvider networks={networkConfig} defaultNetwork="testnet">
        <WalletProvider>
          <KredithApp />
        </WalletProvider>
      </IotaClientProvider>
    </QueryClientProvider>
  );
}