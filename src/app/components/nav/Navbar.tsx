'use client';

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useState, useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { useUser } from "../../../providers/UserProvider";
import NotificationBell from "../notifications/NotificationBell";
import NotificationPanel from "../notifications/NotificationPanel";

// นำเข้า Icon ที่จำเป็นทั้งหมด
import { 
  Menu, X, Home, User, LogOut, BriefcaseBusiness, 
  PlusSquare, LayoutDashboard, Bookmark, PieChart, Settings 
} from 'lucide-react'; 

interface NavItem {
  name: string;
  path: string;
  icon: React.ElementType;
}

// 1. กำหนดเมนูหลักที่แสดงบน Navbar เสมอ
const mainNavItems: NavItem[] = [
  { name: 'หน้าแรก', path: '/', icon: Home },
  { name: 'ค้นหางานพิเศษ', path: '/find-job', icon: BriefcaseBusiness },
];

// 2. กำหนดเมนูแยกตาม Role สำหรับอยู่ใน Dropdown/Burger Menu
const menuByRole = {
  teacher: [
    { name: 'โปรไฟล์', path: '/account', icon: User },
    { name: 'ลงประกาศงาน', path: '/manage-projects/create-jobs', icon: PlusSquare },
    { name: 'โปรเจกต์บอร์ด', path: '/project-board', icon: LayoutDashboard },
    { name: 'ตั้งค่า', path: '/settings', icon: Settings },
  ],
  alumni: [
    { name: 'โปรไฟล์', path: '/account', icon: User },
    { name: 'ลงประกาศงาน', path: '/manage-projects/create-jobs', icon: PlusSquare },
    { name: 'โปรเจกต์บอร์ด', path: '/project-board', icon: LayoutDashboard },
    { name: 'ตั้งค่า', path: '/settings', icon: Settings },
  ],
  student: [
    { name: 'โปรไฟล์', path: '/account', icon: User },
    { name: 'งานที่บันทึกไว้', path: '/saved-jobs', icon: Bookmark },
    { name: 'แดชบอร์ด', path: '/dashboard', icon: PieChart },
    { name: 'โปรเจกต์บอร์ด', path: '/project-board', icon: LayoutDashboard },
    { name: 'ตั้งค่า', path: '/settings', icon: Settings },
  ],
};

function BurgerIcon({ isMenuOpen }: { isMenuOpen: boolean }) {
  const Icon = isMenuOpen ? X : Menu;
  return <Icon className="text-gray-400 w-6 h-6 transition-colors duration-300" />;
}

const UserProfileImage = ({ imageUrl, name }: { imageUrl: string | null | undefined, name: string | null | undefined }) => {
  return (
    <div className="rounded-full bg-gray-400 size-10 overflow-hidden flex-shrink-0">
      {imageUrl ? (
        <img src={imageUrl} alt={name || 'User profile'} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-primary-blue-500 text-white font-medium text-lg">
          {name?.charAt(0) || '?'}
        </div>
      )}
    </div>
  );
}

function Navbar() {
  const { data: session, status } = useSession();
  const userRole = session?.user?.role; 
  const { userData } = useUser();
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  const [navHeight, setNavHeight] = useState<number>(72);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState<boolean>(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState<boolean>(false);

  const userMenuRef = useRef<HTMLDivElement>(null); 
  const notificationRef = useRef<HTMLDivElement>(null); 
  const pathname = usePathname();

  const toggleMenuOpen = () => {
    setIsMenuOpen(!isMenuOpen);
    document.body.style.overflow = !isMenuOpen ? 'hidden' : 'auto';
  };

  useEffect(() => {
    const updateNavHeight = () => {
      const navElement = document.getElementById('main-navbar');
      if (navElement) setNavHeight(navElement.offsetHeight);
    }
    updateNavHeight();
    window.addEventListener('resize', updateNavHeight);
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('resize', updateNavHeight);
      window.removeEventListener('scroll', handleScroll);
      document.body.style.overflow = 'auto';
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) setIsUserMenuOpen(false);
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) setIsNotificationOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setIsUserMenuOpen(false);
    setIsMenuOpen(false);
    await signOut({ callbackUrl: '/' });
  };

  const userProfileUrl = userData?.profileImageUrl || session?.user?.profileImageUrl;
  const userName = userData?.name || session?.user?.name;
  const currentRoleMenus = userRole ? menuByRole[userRole as keyof typeof menuByRole] : [];

  return (
    <>
      <nav id="main-navbar" className={`w-screen h-fit backdrop-blur-md shadow py-4 px-4 md:px-12 fixed top-0 flex justify-between z-50 rounded-b-xl ${isScrolled ? 'bg-white/90 shadow-md shadow-gray-400/25' : 'bg-white/90'}`}>
        <Link href={'/'} className="transform transition-transform hover:scale-105 flex-shrink-0">
          <img src="/logo/cosci-hub-logo.png" alt="logo" className="h-[40px]" />
        </Link>

        <div className="flex items-center gap-4 sm:gap-8">
          {/* Desktop Main Menu */}
          <div className="hidden sm:flex gap-8">
            {mainNavItems.map((item) => (
              <Link key={item.path} href={item.path} className={`flex flex-col items-center justify-center transition-all duration-200 relative ${pathname === item.path ? 'text-primary-blue-400' : 'text-gray-400 hover:text-primary-blue-400'}`}>
                <item.icon className="w-7 h-7" />
                <span className="text-xs font-normal mt-1">{item.name}</span>
              </Link>
            ))}
          </div>

          {status === 'authenticated' ? (
            <div className="flex items-center gap-3 relative">
              <div className="relative" ref={notificationRef}>
                <NotificationBell onClick={() => {setIsNotificationOpen(!isNotificationOpen); setIsUserMenuOpen(false);}} isOpen={isNotificationOpen} />
                <NotificationPanel isOpen={isNotificationOpen} onClose={() => setIsNotificationOpen(false)} />
              </div>

              <div className="relative" ref={userMenuRef}>
                <button onClick={() => {setIsUserMenuOpen(!isUserMenuOpen); setIsNotificationOpen(false);}} className="rounded-full focus:ring-2 focus:ring-primary-blue-500/50">
                  <UserProfileImage imageUrl={userProfileUrl} name={userName} />
                </button>

                {/* Desktop User Dropdown */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-xl ring-1 ring-black ring-opacity-5 z-50 p-1 origin-top-right animate-fade-in-down">
                    <div className="px-4 py-3 border-b border-gray-100 mb-1 text-sm font-medium truncate">{userName}</div>
                    {currentRoleMenus.map((item) => (
                      <Link key={item.path} href={item.path} onClick={() => setIsUserMenuOpen(false)} className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                        <item.icon className="w-4 h-4 mr-2" /> {item.name}
                      </Link>
                    ))}
                    <button onClick={handleLogout} className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left rounded-lg mt-1 border-t border-gray-100 pt-2">
                      <LogOut className="w-4 h-4 mr-2" /> ออกจากระบบ
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <Link href="/auth?state=login" className="btn-primary text-s py-2 px-4">เข้าสู่ระบบ</Link>
          )}

          <button onClick={toggleMenuOpen} className="sm:hidden hover:text-primary-blue-400 p-1 rounded-full hover:bg-gray-100">
            <BurgerIcon isMenuOpen={isMenuOpen} />
          </button>
        </div>
      </nav>
      
      {/* Mobile/Burger Menu Overlay */}
      <div style={{ top: `${navHeight}px` }} className={`fixed left-0 right-0 bottom-0 bg-black/10 backdrop-blur-sm transition-opacity duration-300 sm:hidden z-30 ${isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} onClick={toggleMenuOpen} />
      
      <div style={{ top: `${navHeight}px` }} className={`fixed left-0 w-full max-h-[calc(100vh-${navHeight}px)] bg-white shadow-lg rounded-b-2xl z-40 sm:hidden transition-all duration-500 ease-in-out overflow-auto ${isMenuOpen ? 'translate-y-0 opacity-100' : 'translate-y-[-20px] opacity-0 pointer-events-none'}`}>
        <div className="flex flex-col p-2">
          {/* Main Items in Burger */}
          {mainNavItems.map((item) => (
            <Link key={item.path} href={item.path} className={`py-3 px-4 text-s font-normal hover:bg-gray-100 rounded-xl flex items-center gap-3 ${pathname === item.path ? 'text-primary-blue-400' : 'text-gray-400'}`} onClick={() => setIsMenuOpen(false)}>
              <item.icon className="w-5 h-5" /> {item.name}
            </Link>
          ))}
          
          {session && (
            <div className="mt-2 pt-2 border-t border-gray-200">
              <div className="py-3 px-4 flex items-center gap-3">
                <UserProfileImage imageUrl={userProfileUrl} name={userName} />
                <div className="text-sm font-medium truncate">{userName}</div>
              </div>
              {/* Role Based Items in Burger */}
              {currentRoleMenus.map((item) => (
                <Link key={item.path} href={item.path} className="py-3 px-4 text-s font-normal hover:bg-gray-100 rounded-xl flex items-center gap-3 text-gray-600" onClick={() => setIsMenuOpen(false)}>
                  <item.icon className="w-5 h-5" /> {item.name}
                </Link>
              ))}
              <button onClick={handleLogout} className="w-full text-left py-3 px-4 text-s font-normal hover:bg-gray-100 rounded-xl text-red-500 flex items-center gap-3">
                <LogOut className="w-5 h-5" /> ออกจากระบบ
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default Navbar;