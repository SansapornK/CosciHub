// src/app/components/nav/Navbar.tsx
'use client';

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useState, useEffect, useRef } from "react"; // Added useRef
import { useSession, signOut } from "next-auth/react";
import { useUser } from "../../../providers/UserProvider";
import NotificationBell from "../notifications/NotificationBell";
import NotificationPanel from "../notifications/NotificationPanel";

// --- Icon Imports (Assuming lucide-react is used) ---
import { Menu, X, Home, Search, Bell, User, LogOut, BriefcaseBusiness } from 'lucide-react'; 

interface NavItem {
  name: string;
  path: string;
  icon: React.ElementType; // Added icon property
}

interface BurgerIconProps {
  isMenuOpen: boolean;
}

const navItems: NavItem[] = [
  { name: 'หน้าแรก', path: '/', icon: Home },
  { name: 'ค้นหางานพิเศษ', path: '/find-job', icon: BriefcaseBusiness },
  // { name: 'โปรเจกต์บอร์ด', path: '/project-board', icon: Briefcase }, // Example with more icons
  // { name: 'จัดการโปรเจกต์', path: '/manage-projects', icon: FileText}
  // { name: 'เกี่ยวกับเรา', path: '/about-us', icon: Info} 
];

// Replaced BurgerIcon with a cleaner implementation using icons
function BurgerIcon({ isMenuOpen }: BurgerIconProps) {
  const Icon = isMenuOpen ? X : Menu;
  return (
    <Icon 
      className="text-gray-400 w-6 h-6 transition-colors duration-300"
    />
  )
}

// Helper component for the user profile image/placeholder
const UserProfileImage = ({ imageUrl, name }: { imageUrl: string | null | undefined, name: string | null | undefined }) => {
  return (
    <div className="rounded-full bg-gray-400 size-10 overflow-hidden flex-shrink-0">
      {imageUrl ? (
        <img 
          src={imageUrl} 
          alt={name || 'User profile'} 
          className="w-full h-full object-cover"
        />
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
  const { userData } = useUser();
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  const [navHeight, setNavHeight] = useState<number>(72); // ประมาณความสูงของ navbar
  const [isUserMenuOpen, setIsUserMenuOpen] = useState<boolean>(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState<boolean>(false);

  // Ref for user menu and notification areas to handle outside clicks
  const userMenuRef = useRef<HTMLDivElement>(null); 
  const notificationRef = useRef<HTMLDivElement>(null); 
  
  const toggleMenuOpen = (): void => {
    setIsMenuOpen(!isMenuOpen);
    // Prevent scrolling when menu is open
    if (!isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  };
  
  const pathname = usePathname();
  const router = useRouter();
  
  // Get navbar height on mount and resize
  useEffect(() => {
    const updateNavHeight = (): void => {
      const navElement = document.getElementById('main-navbar');
      if (navElement) {
        setNavHeight(navElement.offsetHeight);
      }
    }
    updateNavHeight();
    window.addEventListener('resize', updateNavHeight);
    return () => window.removeEventListener('resize', updateNavHeight);
  }, []);
  
  // Add scroll effect
  useEffect(() => {
    const handleScroll = (): void => {
      setIsScrolled(window.scrollY > 20);
    }
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    }
  }, []);
  
  // Clean up body style when component unmounts
  useEffect(() => {
    return () => {
      document.body.style.overflow = 'auto';
    }
  }, []);

  // Handle user menu toggle
  const toggleUserMenu = () => {
    setIsUserMenuOpen(prev => !prev);
    setIsNotificationOpen(false); // Close other menus
  };

  // Handle notification toggle
  const toggleNotification = () => {
    setIsNotificationOpen(prev => !prev);
    setIsUserMenuOpen(false); // Close other menus
  };

  // Handle closing notification
  const closeNotification = () => {
    setIsNotificationOpen(false);
  };

  // Close menus if clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Close user menu
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
      // Close notification panel if click is outside both the bell and the panel
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle logout
  const handleLogout = async () => {
    setIsUserMenuOpen(false);
    await signOut({ callbackUrl: '/' });
  };

  // Combine user data
  const userProfileUrl = userData?.profileImageUrl || session?.user?.profileImageUrl;
  const userName = userData?.name || session?.user?.name;
  
  return (
    <>
      <nav
        id="main-navbar"
        className={`w-screen h-fit backdrop-blur-md shadow py-4 px-4 md:px-4 lg:px-4 xl:px-12 fixed top-0 flex justify-between z-50 rounded-b-xl ${
          isScrolled ? 'bg-white/90 shadow-md shadow-gray-400/25' : 'bg-white/90'
        }`}
      >
        {/* โลโก้ซ้าย */}
        <Link href={'/'} className="transform transition-transform hover:scale-105 flex-shrink-0">
          <img src="/logo/cosci-hub-logo.png" alt="cosci:connect" className="h-[40px]" />
        </Link>

        {/* เมนูและปุ่มทั้งหมดอยู่ด้านขวา */}
        <div className="flex items-center gap-4 sm:gap-8">
          
          {/* Desktop Menu - ถูกแก้ไขให้แสดงผลแบบ Icon-on-top */}
          <div className="hidden sm:flex gap-8">
            {navItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  // *** การเปลี่ยนแปลงหลัก: ใช้ flex-col เพื่อเรียงแนวตั้ง ***
                  className={`
                    transition-all duration-200 relative 
                    after:absolute after:bottom-[-5px] after:left-0 after:h-[2px] after:bg-primary-blue-400 after:transition-all after:duration-300
                    
                    // กำหนดให้เป็นคอลัมน์และอยู่ตรงกลาง
                    flex flex-col items-center justify-center
                    
                    // กำหนดสีและเส้นใต้
                    ${pathname === item.path
                      ? 'text-primary-blue-400 after:w-full' // Active: สีน้ำเงินและเส้นเต็ม
                      : 'text-gray-400 hover:text-primary-blue-400 after:w-0 hover:after:w-full' // Inactive: สีเทา, Hover เป็นสีน้ำเงิน
                    }
                  `}
                >
                  {/* Icon Component */}
                  <IconComponent className="w-7 h-7" />
                  
                  {/* Text Component */}
                  <span className="text-xs font-normal mt-1">
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </div>

          {/* ปุ่มเข้าสู่ระบบ / Profile */}
          {status === 'authenticated' ? (
            /* Authenticated User Profile Menu */
            <div className="flex items-center gap-3 relative">
              
              {/* Notification Bell & Panel */}
              <div className="relative" ref={notificationRef}>
                <NotificationBell 
                  onClick={toggleNotification}
                  isOpen={isNotificationOpen}
                />
                {/* NotificationPanel must handle its own positioning/navHeight dependency */}
                <NotificationPanel 
                  isOpen={isNotificationOpen} 
                  onClose={closeNotification} 
                  // navHeight={navHeight}
                />
              </div>

              {/* Profile Button and Dropdown */}
              <div className="relative" ref={userMenuRef}>
                <button
                  id="profile-button"
                  onClick={toggleUserMenu}
                  className="rounded-full transition-shadow duration-200 focus:outline-none focus:ring-2 focus:ring-primary-blue-500/50"
                  aria-expanded={isUserMenuOpen}
                >
                  <UserProfileImage 
                    imageUrl={userProfileUrl} 
                    name={userName} 
                  />
                </button>

                {/* User Dropdown Menu */}
                {isUserMenuOpen && (
                  <div
                    id="user-menu"
                    className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-xl ring-1 ring-black ring-opacity-5 z-50 p-1 origin-top-right animate-fade-in-down"
                  >
                    <div className="py-1">
                      <div className="px-4 py-3 border-b border-gray-100 mb-1">
                        <p className="text-sm font-medium truncate">{userName}</p>
                        <p className="text-xs text-gray-500 truncate">{userData?.email || session.user?.email}</p>
                      </div>
                      
                      <Link
                        href="/account"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full transition-colors rounded-lg"
                      >
                        <User className="w-4 h-4 mr-2" />
                        โปรไฟล์
                      </Link>
                      
                      <button
                        onClick={handleLogout}
                        className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left transition-colors rounded-lg mt-1 border-t border-gray-100 pt-2"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        ออกจากระบบ
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <Link href="/auth?state=login" className="btn-primary text-s py-2 px-4">
                เข้าสู่ระบบ
              </Link>
            </div>
          )}

          {/* Burger Icon สำหรับมือถือ */}
          <button
            onClick={toggleMenuOpen}
            className="sm:hidden hover:text-primary-blue-400 transition-colors p-1 rounded-full hover:bg-gray-100"
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          >
            <BurgerIcon isMenuOpen={isMenuOpen} />
          </button>
        </div>
      </nav>
      
      {/* Overlay when mobile menu is open - ตอนนี้จะเริ่มต้นจากด้านล่างของ navbar */}
      <div
        style={{ top: `${navHeight}px` }}
        className={`fixed left-0 right-0 bottom-0 bg-black/10 backdrop-blur-sm transition-opacity duration-300 sm:hidden z-30 ${
          isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={toggleMenuOpen}
      ></div>
      
      {/* Mobile Menu - slide-in animation */}
      <div
        style={{ top: `${navHeight}px` }}
        className={`fixed left-0 w-full max-h-[calc(100vh-${navHeight}px)] bg-white shadow-lg rounded-b-2xl z-40 sm:hidden transition-all duration-500 ease-in-out overflow-auto ${
          isMenuOpen ? 'translate-y-0 opacity-100' : 'translate-y-[-20px] opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex flex-col p-2">
          {navItems.map((item, index) => {
            const IconComponent = item.icon;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`py-3 px-4 text-s font-normal hover:bg-gray-100 rounded-xl transition-all duration-100 flex items-center gap-3 ${pathname === item.path ? 'text-primary-blue-400' : 'text-gray-400'}`}
                onClick={() => setIsMenuOpen(false)}
                style={{
                  transitionDelay: `${index * 50}ms`,
                  opacity: isMenuOpen ? 1 : 0,
                  transform: isMenuOpen
                    ? 'translateY(0)'
                    : 'translateY(-20px)'
                }}
              >
                <IconComponent className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
          
          {/* Authentication links for mobile menu */}
          {!session && (
            <div className="mt-2 pt-2 border-t border-gray-200">
              <Link
                href="/auth?state=login"
                className={`py-3 px-4 text-s font-normal hover:bg-gray-100 rounded-xl transition-all duration-100 text-primary-blue-500 flex items-center gap-3`}
                onClick={() => setIsMenuOpen(false)}
                style={{
                  transitionDelay: `${navItems.length * 50}ms`,
                  opacity: isMenuOpen ? 1 : 0,
                  transform: isMenuOpen
                    ? 'translateY(0)'
                    : 'translateY(-20px)'
                }}
              >
                <LogOut className="w-5 h-5 rotate-180" />
                เข้าสู่ระบบ
              </Link>
              <Link
                href="/auth?state=register"
                className={`py-3 px-4 text-s font-normal hover:bg-gray-100 rounded-xl transition-all duration-100 text-primary-blue-500 flex items-center gap-3`}
                onClick={() => setIsMenuOpen(false)}
                style={{
                  transitionDelay: `${(navItems.length + 1) * 50}ms`,
                  opacity: isMenuOpen ? 1 : 0,
                  transform: isMenuOpen
                    ? 'translateY(0)'
                    : 'translateY(-20px)'
                }}
              >
                <User className="w-5 h-5" />
                สร้างบัญชี
              </Link>
            </div>
          )}
          
          {/* User info and logout for mobile menu */}
          {session && (
            <div className="mt-2 pt-2 border-t border-gray-200">
              <div className="py-3 px-4 flex items-center gap-3">
                <UserProfileImage 
                  imageUrl={userProfileUrl} 
                  name={userName} 
                />
                <div>
                  <p className="font-medium truncate">{userName}</p>
                  <p className="text-xs text-gray-500 truncate">{userData?.email || session.user?.email}</p>
                </div>
              </div>
              
              <Link
                href="/account"
                className={`py-3 px-4 text-s font-normal hover:bg-gray-100 rounded-xl transition-all duration-100 text-gray-600 flex items-center gap-3`}
                onClick={() => setIsMenuOpen(false)}
              >
                <User className="w-5 h-5" />
                โปรไฟล์
              </Link>
              
              <button
                onClick={handleLogout}
                className={`w-full text-left py-3 px-4 text-s font-normal hover:bg-gray-100 rounded-xl transition-all duration-100 text-red-500 flex items-center gap-3`}
              >
                <LogOut className="w-5 h-5" />
                ออกจากระบบ
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default Navbar