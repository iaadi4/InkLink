"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  LayoutDashboard,
  Users,
  Settings,
  Plus,
  ArrowRight,
  LogIn,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";


const InkLinkLogo = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM15.5 8.5C15.5 9.33 14.83 10 14 10C13.17 10 12.5 9.33 12.5 8.5C12.5 7.67 13.17 7 14 7C14.83 7 15.5 7.67 15.5 8.5ZM8.5 15.5C8.5 16.33 7.83 17 7 17C6.17 17 5.5 16.33 5.5 15.5C5.5 14.67 6.17 14 7 14C7.83 14 8.5 14.67 8.5 15.5ZM12 17.5C10.5 17.5 9 17 7.5 16.5C7.3 16.4 7.1 16.2 6.9 16C6.7 15.8 6.5 15.6 6.3 15.4C5.7 14.7 5.2 13.9 4.9 13.1C4.6 12.3 4.5 11.5 4.5 10.7C4.5 8.6 6.1 7 8.2 7H15.8C17.9 7 19.5 8.6 19.5 10.7C19.5 11.5 19.4 12.3 19.1 13.1C18.8 13.9 18.3 14.7 17.7 15.4C17.5 15.6 17.3 15.8 17.1 16C16.9 16.2 16.7 16.4 16.5 16.5C15 17 13.5 17.5 12 17.5Z" fill="currentColor"/>
  </svg>
);

const WorkspaceIllustration = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 280 180" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g clipPath="url(#clip0_503_2)"><rect width="280" height="180" rx="12" fill="url(#paint0_linear_503_2)"/><path d="M-40 181L232.5 -48" stroke="white" strokeOpacity="0.1" strokeWidth="2"/><path d="M30 201L302.5 -28" stroke="white" strokeOpacity="0.1" strokeWidth="2"/><rect x="30" y="40" width="180" height="100" rx="8" fill="white" fillOpacity="0.1"/><rect x="38" y="48" width="164" height="84" rx="4" fill="white"/><path d="M50 80C64 68 74 92 88 80" stroke="#A78BFA" strokeWidth="3" strokeLinecap="round"/><path d="M95 105C109 117 119 93 133 105" stroke="#FBBF24" strokeWidth="3" strokeLinecap="round"/><circle cx="150" cy="70" r="10" fill="#60A5FA"/><rect x="65" y="110" width="20" height="20" rx="5" fill="#34D399" transform="rotate(15 65 110)"/><rect x="180" y="55" width="70" height="70" rx="10" fill="#4F46E5" fillOpacity="0.9" className="shadow-2xl"/><path d="M195 80H235" stroke="white" strokeWidth="3" strokeLinecap="round"/><path d="M195 95H235" stroke="white" strokeWidth="3" strokeLinecap="round"/><path d="M195 110H220" stroke="white" strokeWidth="3" strokeLinecap="round"/></g>
        <defs><linearGradient id="paint0_linear_503_2" x1="0" y1="0" x2="280" y2="180" gradientUnits="userSpaceOnUse"><stop stopColor="#6366F1"/><stop offset="1" stopColor="#8B5CF6"/></linearGradient><clipPath id="clip0_503_2"><rect width="280" height="180" rx="12" fill="white"/></clipPath></defs>
    </svg>
);

const EmptyStateIllustration = ({ className }: { className?: string }) => (
    <div className="text-center">
        <svg className={className} viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="50" y="70" width="300" height="180" rx="12" fill="#F9FAFB"/><rect x="50" y="70" width="300" height="180" rx="12" stroke="#E5E7EB" strokeWidth="2" strokeDasharray="8 8"/><path d="M179.134 145.866L173 128L155.866 134.134C153.941 134.805 152.805 136.941 153.476 138.866L159.609 156L177 150.391C178.925 149.72 180.061 147.791 179.134 145.866Z" fill="#4F46E5"/><path d="M184 150L177 150.391L159.609 156" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="240" cy="125" r="8" fill="#FBBF24" opacity="0.5"/><rect x="120" y="180" width="160" height="10" rx="5" fill="#E5E7EB"/><rect x="120" y="200" width="100" height="10" rx="5" fill="#E5E7EB"/><path d="M250 170 C 270 160, 290 190, 310 180" stroke="#34D399" strokeWidth="2" strokeLinecap="round" strokeDasharray="4 4"/>
        </svg>
        <p className="mt-4 font-semibold text-gray-500">Start a new idea!</p>
    </div>
);

// Dynamic SVG Preview Generator
const generateRoomPreview = (id: string) => {
    const hashCode = (s: string) => s.split('').reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0);
    const seed = hashCode(id);
    const rand = (min: number, max: number) => {
      const random = Math.sin(seed + id.length) * 10000;
      return (random - Math.floor(random)) * (max - min) + min;
    };
    
    const colors = ["#6366F1", "#8B5CF6", "#EC4899", "#10B981", "#F59E0B"];
    const patternType = Math.abs(seed) % 3;

    switch (patternType) {
        case 0: return <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#F9FAFB" />{Array.from({ length: 15 }).map((_, i) => (<circle key={i} cx={`${rand(5, 95)}%`} cy={`${rand(5, 95)}%`} r={rand(2, 5)} fill={colors[i % colors.length]} opacity="0.7"/>))}</svg>;
        case 1: return <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#F9FAFB" /><path d={`M 0 ${rand(30, 70)} C 50 ${rand(0, 100)}, 150 ${rand(0, 100)}, 200 ${rand(30, 70)} S 350 ${rand(0,100)}, 400 ${rand(30,70)}`} stroke={colors[Math.abs(seed) % colors.length]} fill="none" strokeWidth="4" opacity="0.6"/><path d={`M 0 ${rand(30, 70)} C 50 ${rand(0, 100)}, 150 ${rand(0, 100)}, 200 ${rand(30, 70)} S 350 ${rand(0,100)}, 400 ${rand(30,70)}`} stroke={colors[Math.abs(seed+1) % colors.length]} fill="none" strokeWidth="4" opacity="0.6" transform="translate(0, 20)"/></svg>;
        default: return <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#F9FAFB" />{Array.from({ length: 5 }).map((_, i) => (<rect key={i} x={`${rand(10, 80)}%`} y={`${rand(10, 80)}%`} width={`${rand(10, 30)}%`} height={`${rand(10, 30)}%`} rx="4" fill={colors[i % colors.length]} opacity="0.7"/>))}</svg>;
    }
};

interface Member { name: string; }
interface Room { id: string; name: string; members: Member[]; }
const user = { name: "Alex Grant", email: "alex.grant@example.com" };

const RoomCard = ({ room, index }: { room: Room; index: number }) => {
    const router = useRouter();
    const roomPreview = useMemo(() => generateRoomPreview(room.id), [room.id]);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.4, delay: index * 0.1, ease: "easeOut" }}
            className="bg-white rounded-2xl shadow-lg shadow-gray-100 border border-gray-200/80 hover:border-indigo-400 hover:shadow-indigo-100/50 transition-all group flex flex-col overflow-hidden"
        >
            <div className="h-28 w-full">{roomPreview}</div>
            <div className="p-5 flex flex-col flex-1">
                <p className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors flex-1">{room.name}</p>
                <div className="flex justify-between items-center mt-4">
                    <div className="flex -space-x-2">
                        {room.members.map(member => (
                            <Image
                                key={member.name}
                                className="w-8 h-8 rounded-full border-2 border-white"
                                src={`https://ui-avatars.com/api/?name=${member.name}&background=random&color=fff&font-size=0.4`}
                                alt={member.name}
                                title={member.name}
                                width={32}
                                height={32}
                                unoptimized
                            />
                        ))}
                    </div>
                    <Button onClick={() => router.push(`/room/${room.id}`)} variant="ghost" className="font-semibold text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg">
                        Open <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                </div>
            </div>
        </motion.div>
    );
};


const ChatHomepage = () => {
  const [myRooms, setMyRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
        setMyRooms([
            { id: "prj-collab-alpha", name: "Project Alpha Collaboration", members: [{name: "Mia"}, {name: "Leo"}] },
            { id: "q4-marketing-sync", name: "Q4 Marketing Sync", members: [{name: "Chloe"}, {name: "Alex"}, {name: "Sam"}] },
            { id: "ux-design-review", name: "UX Design Review", members: [{name: "Alex"}] },
        ]);
        setIsLoading(false);
    }, 1500);
  }, []);
  
  const FADE_IN_ANIMATION_SETTINGS = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { type: "spring" as const, stiffness: 100, damping: 20, duration: 0.8 },
  };

  return (
    <div className="font-jakarta bg-white text-gray-800 flex min-h-screen">
      <aside className="w-64 bg-white border-r border-gray-200/80 flex-col fixed h-full hidden lg:flex">
        <div className="flex items-center gap-3 px-6 h-20 border-b border-gray-200/80"><InkLinkLogo className="w-9 h-9 text-indigo-600" /><span className="text-2xl font-bold text-gray-900">InkLink</span></div>
        <nav className="flex-1 px-4 py-6 space-y-2">
            <a href="#" className="flex items-center gap-3 px-4 py-2.5 bg-indigo-50 text-indigo-700 rounded-lg font-semibold"><LayoutDashboard size={20} /> Dashboard</a>
            <a href="#" className="flex items-center gap-3 px-4 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"><Users size={20} /> My Teams</a>
            <a href="#" className="flex items-center gap-3 px-4 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"><Settings size={20} /> Settings</a>
        </nav>
        <div className="px-6 py-4 border-t border-gray-200/80">
            <div className="flex items-center gap-3">
                <Image src={`https://ui-avatars.com/api/?name=${user.name.replace(" ", "+")}&background=E0E7FF&color=4F46E5&font-size=0.4`} alt={user.name} width={40} height={40} className="w-10 h-10 rounded-full" unoptimized/>
                <div><p className="font-semibold text-gray-800">{user.name}</p><p className="text-sm text-gray-500">{user.email}</p></div>
            </div>
        </div>
      </aside>

      <main className="flex-1 lg:ml-64 bg-gray-50/80">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-10">
            <motion.header {...FADE_IN_ANIMATION_SETTINGS}>
                <div className="flex items-center justify-between mb-8">
                    <div><h1 className="text-3xl font-bold text-gray-900">Dashboard</h1><p className="text-gray-500 mt-1">Welcome back, {user.name.split(' ')[0]}! Let&apos;s create something brilliant today.</p></div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm mb-12">
                   <div className="flex flex-col md:flex-row gap-6 items-center">
                        <div className="shrink-0"><WorkspaceIllustration className="w-48 h-auto"/></div>
                        <div className="flex-1"><h2 className="text-xl font-bold text-gray-900">Start or join a workspace</h2><p className="text-gray-500 mt-1">Enter an ID to join an existing room or create a new one.</p></div>
                        <div className="flex items-center gap-2 w-full md:w-auto">
                            <Input placeholder="Paste Room ID..." className="h-11"/>
                            <Button className="bg-gray-800 hover:bg-gray-900 text-white font-semibold h-11 px-5"><LogIn size={16} className="mr-2"/> Join</Button>
                        </div>
                   </div>
                </div>
            </motion.header>

            <motion.div {...FADE_IN_ANIMATION_SETTINGS} transition={{...FADE_IN_ANIMATION_SETTINGS.transition, delay: 0.2}}>
                 <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Your Rooms</h2>
                    <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-lg shadow-indigo-200 transition-transform hover:scale-105"><Plus size={20} className="mr-2"/> Create Room</Button>
                 </div>
                 
                 {isLoading ? ( <p className="text-center text-gray-500 py-10">Loading your brilliant ideas...</p>) 
                 : myRooms.length === 0 ? (<div className="text-center bg-white rounded-2xl p-12 border border-gray-200/80 mt-8"><EmptyStateIllustration className="mx-auto" /></div>) 
                 : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <AnimatePresence>
                            {myRooms.map((room, index) => (
                                <RoomCard key={room.id} room={room} index={index} />
                            ))}
                        </AnimatePresence>
                    </div>
                 )}
            </motion.div>
        </div>
      </main>
    </div>
  );
};

export default ChatHomepage;