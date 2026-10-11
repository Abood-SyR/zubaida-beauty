'use client';

import { Suspense, useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { CartManager } from '@/services/cart_manager';
import { AppColors } from '@/constants/app_colors';

const destinations = [
  { icon: 'home', label: 'الرئيسية', path: '/home' },
  { icon: 'cart', label: 'السلة', path: '/cart' },
  { icon: 'favorite', label: 'المفضلة', path: '/favorites' },
  { icon: 'profile', label: 'الملف الشخصي', path: '/profile' },
] as const;

function getActiveIndex(pathname: string) {
  if (pathname === '/cart') return 1;
  if (pathname === '/favorites') return 2;
  if (pathname === '/profile') return 3;
  return 0;
}

function subscribeToDesktopChanges(callback: () => void) {
  const mediaQuery = window.matchMedia('(min-width: 768px)');
  mediaQuery.addEventListener('change', callback);
  return () => mediaQuery.removeEventListener('change', callback);
}

function getIsDesktopSnapshot() {
  return window.matchMedia('(min-width: 768px)').matches;
}

function getIsDesktopServerSnapshot() {
  return false;
}

function NavigationIcon({
  name,
  size,
}: {
  name: (typeof destinations)[number]['icon'];
  size: number;
}) {
  const paths = {
    home: 'M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z',
    cart: 'M7 18a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm10 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM5.2 5l.6 3H21l-2 8H7L4 3H1V1h4l.2 1H22l-2.5 11H8.5',
    favorite: 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z',
    profile: 'M20 21a8 8 0 0 0-16 0m8-10a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z',
  };

  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={name === 'home' || name === 'favorite' ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={paths[name]} />
    </svg>
  );
}

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-lightPinkBg relative flex" dir="rtl">
      <div className="main-layout-content min-w-0 flex-1">{children}</div>
      <Suspense fallback={null}>
        <MainNavigation />
      </Suspense>
    </div>
  );
}

function MainNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const cartManager = CartManager.getInstance();
  const activeIndex = getActiveIndex(pathname);
  const subscribeToCart = useCallback(
    (listener: () => void) => cartManager.subscribe(listener),
    [cartManager],
  );
  const getCartCount = useCallback(() => cartManager.itemCount, [cartManager]);
  const cartCount = useSyncExternalStore(
    subscribeToCart,
    getCartCount,
    () => 0,
  );
  const isDesktop = useSyncExternalStore(
    subscribeToDesktopChanges,
    getIsDesktopSnapshot,
    getIsDesktopServerSnapshot,
  );
  const [animationKey, setAnimationKey] = useState(0);
  const [animationDuration, setAnimationDuration] = useState(900);

  const showNavigation = ['/', '/home', '/cart', '/favorites', '/profile'].includes(pathname);

  useEffect(() => {
    cartManager.loadFromStorage();
  }, [cartManager]);

  const handleNavigation = (index: number) => {
    const distance = Math.abs(index - activeIndex);
    const distanceInPixels = distance * ((window.innerWidth - 40) / destinations.length);
    setAnimationDuration(
      distance === 0
        ? 650
        : Math.min(1200, Math.max(800, 700 + distanceInPixels * 0.4)),
    );
    setAnimationKey((key) => key + 1);
    router.push(destinations[index].path);
  };

  return (
    <>
      {showNavigation && isDesktop && (
        <aside className="w-64 shrink-0 bg-surfaceWhite border-l border-pink-100 flex flex-col p-4 shadow-sm sticky top-0 h-screen">
          <h1 className="text-xl font-bold text-deepRose mb-8 text-center">Zubaida Beauty</h1>
          <nav aria-label="التنقل الرئيسي" className="space-y-2 flex-1">
            {destinations.map((item, index) => (
              <button
                key={item.path}
                type="button"
                aria-current={activeIndex === index ? 'page' : undefined}
                onClick={() => handleNavigation(index)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition ${
                  activeIndex === index
                    ? 'bg-primaryRose text-white shadow-md'
                    : 'text-textDark hover:bg-lightPinkBg/50'
                }`}
              >
                <NavigationIcon name={item.icon} size={20} />
                <span>{item.label}</span>
                {index === 1 && cartCount > 0 && (
                  <span className="mr-auto bg-red-500 text-white text-[10px] min-w-5 h-5 px-1 rounded-full flex items-center justify-center font-bold">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </aside>
      )}

      {showNavigation && !isDesktop && (
        <nav
          aria-label="التنقل الرئيسي"
          className="flutter-bottom-nav fixed z-50"
          style={{
            left: 20,
            right: 20,
            bottom: 25,
            height: 75,
            '--nav-animation-duration': `${animationDuration}ms`,
          } as React.CSSProperties}
        >
          <div
            className={`flutter-nav-drop${animationKey > 0 ? ' moving' : ''}`}
            key={animationKey}
            style={{ right: `calc(${activeIndex} * 25%)` }}
            aria-hidden="true"
          >
            <svg viewBox="0 0 100 75" preserveAspectRatio="none">
              <defs>
                <radialGradient id="nav-drop-fill" cx="50%" cy="35%" r="75%">
                  <stop offset="0%" stopColor={AppColors.primaryRose} stopOpacity=".32" />
                  <stop offset="65%" stopColor={AppColors.primaryRose} stopOpacity=".10" />
                  <stop offset="100%" stopColor={AppColors.surfaceWhite} stopOpacity=".15" />
                </radialGradient>
                <linearGradient id="nav-drop-border" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={AppColors.surfaceWhite} stopOpacity=".85" />
                  <stop offset="50%" stopColor={AppColors.primaryRose} stopOpacity=".25" />
                  <stop offset="100%" stopColor={AppColors.surfaceWhite} stopOpacity=".3" />
                </linearGradient>
              </defs>
              <path
                d="M50 4 C85 4 100 19 98 33 C97 53 78 72 50 72 C22 72 3 53 2 33 C0 19 15 4 50 4Z"
                fill="url(#nav-drop-fill)"
                stroke="url(#nav-drop-border)"
                strokeWidth="1.8"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          </div>

          <div className="flutter-nav-items">
            {destinations.map((item, index) => {
              const isSelected = activeIndex === index;
              return (
                <button
                  key={item.path}
                  type="button"
                  aria-label={item.label}
                  aria-current={isSelected ? 'page' : undefined}
                  onClick={() => handleNavigation(index)}
                  className="flutter-nav-item"
                  style={{ color: isSelected ? AppColors.primaryRose : '#9e9e9e' }}
                >
                  <span className={`flutter-nav-item-content${isSelected ? ' selected' : ''}`}>
                    <span className="flutter-nav-icon">
                      <NavigationIcon name={item.icon} size={isSelected ? 28 : 22} />
                      {index === 1 && cartCount > 0 && (
                        <span className="flutter-cart-badge">
                          {cartCount > 99 ? '99+' : cartCount}
                        </span>
                      )}
                    </span>
                    <span className="flutter-nav-label">{item.label}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </>
  );
}
