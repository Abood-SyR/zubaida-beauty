/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import lottie from 'lottie-web';
import { CartItem, CartManager } from '@/services/cart_manager';
import emptyAnimation from '@/assets/empty.json';

const REMOVE_ACTION_WIDTH = 88;

type CartIconName = 'cart' | 'minus' | 'plus' | 'trash' | 'tag';

function CartIcon({ name, className = 'h-5 w-5' }: { name: CartIconName; className?: string }) {
  const paths: Record<CartIconName, React.ReactNode> = {
    cart: (
      <>
        <path d="M3 4h2l2.2 11.2a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 1.9-1.4L21 9H6" />
        <circle cx="10" cy="20" r="1" />
        <circle cx="18" cy="20" r="1" />
      </>
    ),
    minus: <path d="M5 12h14" />,
    plus: (
      <>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </>
    ),
    trash: (
      <>
        <path d="M3 6h18" />
        <path d="M8 6V4h8v2" />
        <path d="m19 6-1 14H6L5 6" />
        <path d="M10 11v5M14 11v5" />
      </>
    ),
    tag: (
      <>
        <path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8Z" />
        <circle cx="7.5" cy="7.5" r="1" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
}

interface PointerStart {
  id: string;
  pointerId: number;
  x: number;
  y: number;
}

function CartImage({
  src,
  alt,
  className,
  sizes,
}: {
  src: string;
  alt: string;
  className?: string;
  sizes: string;
}) {
  return (
    <Image
      src={src}
      alt={alt}
      fill
      unoptimized
      sizes={sizes}
      className={`object-contain p-1 ${className ?? ''}`}
    />
  );
}

export default function CartPage() {
  const router = useRouter();
  const cartManager = CartManager.getInstance();
  const [items, setItems] = useState<CartItem[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [openItemId, setOpenItemId] = useState<string | null>(null);
  const [dragState, setDragState] = useState<{ id: string; offset: number } | null>(null);
  const pointerStart = useRef<PointerStart | null>(null);
  const didSwipe = useRef(false);
  const animatedFirstItem = useRef(false);
  const animationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const emptyContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (items.length === 0 && emptyContainerRef.current) {
      const anim = lottie.loadAnimation({
        container: emptyContainerRef.current,
        renderer: 'svg',
        loop: true,
        autoplay: true,
        animationData: emptyAnimation,
      });

      return () => {
        anim.destroy();
      };
    }
  }, [items.length]);

  const updateCartState = useCallback(() => {
    setItems([...cartManager.items]);
    setTotalAmount(cartManager.totalAmount);
  }, [cartManager]);

  useEffect(() => {
    cartManager.loadFromStorage();
    updateCartState();
  }, [cartManager, updateCartState]);

  useEffect(() => {
    const firstItem = items[0];
    if (!firstItem || animatedFirstItem.current) return;

    animatedFirstItem.current = true;
    setOpenItemId(firstItem.id);
    animationTimer.current = setTimeout(() => {
      setOpenItemId((currentId) => (currentId === firstItem.id ? null : currentId));
    }, 1000);
  }, [items]);

  useEffect(
    () => () => {
      if (animationTimer.current) clearTimeout(animationTimer.current);
    },
    [],
  );

  const handleRemove = (id: string) => {
    cartManager.removeItem(id);
    setOpenItemId(null);
    setDragState(null);
    updateCartState();
  };

  const handleUpdateQuantity = (id: string, qty: number) => {
    cartManager.updateQuantity(id, qty);
    updateCartState();
  };

  const handlePointerDown = (
    event: React.PointerEvent<HTMLDivElement>,
    itemId: string,
  ) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    pointerStart.current = {
      id: itemId,
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const start = pointerStart.current;
    if (!start || start.pointerId !== event.pointerId) return;
    const deltaX = event.clientX - start.x;
    const deltaY = event.clientY - start.y;
    if (Math.abs(deltaY) > Math.abs(deltaX)) return;

    const startOffset = openItemId === start.id ? -REMOVE_ACTION_WIDTH : 0;
    setDragState({
      id: start.id,
      offset: Math.max(-REMOVE_ACTION_WIDTH, Math.min(0, startOffset + deltaX)),
    });
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const start = pointerStart.current;
    if (!start || start.pointerId !== event.pointerId) return;
    const deltaX = event.clientX - start.x;
    const deltaY = event.clientY - start.y;
    pointerStart.current = null;

    if (Math.abs(deltaX) < Math.abs(deltaY)) {
      setDragState(null);
      return;
    }

    if (deltaX < -35) {
      didSwipe.current = true;
      setOpenItemId(start.id);
    } else if (deltaX > 35) {
      didSwipe.current = true;
      setOpenItemId(null);
    }
    setDragState(null);
  };

  return (
    <main
      className={`min-h-screen bg-lightPinkBg ${items.length > 0 ? 'pb-64 md:pb-48' : 'pb-28'}`}
      dir="rtl"
    >
      <header className="sticky top-0 z-40 mb-6 border-b border-pink-100 bg-surfaceWhite px-4 py-4 shadow-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link href="/home" className="text-sm font-semibold text-primaryRose hover:underline">
            العودة للرئيسية
          </Link>
          <h1 className="text-xl font-bold text-deepRose">سلة المشتريات</h1>
          <span className="w-20" aria-hidden="true" />
        </div>
      </header>

      <div className="mx-auto max-w-4xl space-y-3 px-4">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-pink-100 bg-surfaceWhite py-16 px-4 text-center shadow-sm">
            <div ref={emptyContainerRef} className="w-48 h-48 sm:w-60 sm:h-60 mb-3" />
            <h2 className="text-lg font-bold text-deepRose">السلة فارغة حالياً</h2>
          </div>
        ) : (
          items.map((item) => {
            const imageUrl = item.imageUrl;
            const imageUrls = item.imageUrls;
            const hasImage =
              !!imageUrl &&
              imageUrl.trim() !== '' &&
              imageUrl !== 'string' &&
              imageUrl.startsWith('http');
            const itemKind = item.isGroup ? 'مجموعة' : item.isOffer ? 'عرض خاص' : 'منتج أساسي';
            const badgeStyle = item.isGroup
              ? 'bg-rose-100 text-deepRose'
              : item.isOffer
              ? 'bg-orange-100 text-orange-700'
              : 'bg-pink-100 text-deepRose';
            const originalPrice = item.originalUnitPrice;
            const isOpen = openItemId === item.id;
            const offset = isOpen ? -REMOVE_ACTION_WIDTH : 0;
            const stockLimit = item.product?.stockQuantity;

            return (
              <article key={item.id} className="relative overflow-hidden rounded-2xl">
                <button
                  type="button"
                  onClick={() => handleRemove(item.id)}
                  aria-label={`حذف ${item.name} من السلة`}
                  className="absolute inset-y-0 right-0 flex w-[88px] flex-col items-center justify-center gap-1 bg-red-500 text-sm font-bold text-white transition hover:bg-red-600"
                >
                  <CartIcon name="trash" className="h-5 w-5" />
                  حذف
                </button>

                <div
                  role="link"
                  tabIndex={0}
                  aria-label={`عرض تفاصيل ${item.name}`}
                  onClick={() => {
                    if (didSwipe.current) {
                      didSwipe.current = false;
                      return;
                    }
                    router.push(item.isGroup ? `/groups/${item.id}` : item.isOffer ? `/offers/${item.id}` : `/product/${item.id}`);
                  }}
                  onKeyDown={(event) => {
                    if (
                      event.target === event.currentTarget &&
                      (event.key === 'Enter' || event.key === ' ')
                    ) {
                      event.preventDefault();
                      router.push(item.isGroup ? `/groups/${item.id}` : item.isOffer ? `/offers/${item.id}` : `/product/${item.id}`);
                    }
                  }}
                  onPointerDown={(event) => handlePointerDown(event, item.id)}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={() => {
                    pointerStart.current = null;
                    setDragState(null);
                  }}
                  style={{
                    transform: `translateX(${
                      dragState?.id === item.id ? dragState.offset : offset
                    }px)`,
                    touchAction: 'pan-y',
                    transition:
                      dragState?.id === item.id ? 'none' : 'transform 280ms ease-in-out',
                  }}
                  className="relative z-10 flex min-h-36 cursor-pointer items-stretch gap-3 rounded-2xl border border-pink-100 bg-surfaceWhite shadow-sm"
                >
                  <div className="relative min-h-36 w-24 shrink-0 overflow-hidden rounded-r-2xl bg-white sm:w-[110px]">
                    {item.isOffer && imageUrls.length > 1 ? (
                      <div className="grid h-full min-h-36 w-full grid-cols-2 gap-0.5 bg-white p-1">
                        {imageUrls.slice(0, 4).map((src, index) => (
                          <div
                            key={`${src}-${index}`}
                            className="relative min-h-0 min-w-0 overflow-hidden rounded-md bg-lightPinkBg"
                          >
                            <CartImage
                              src={src}
                              alt={`${item.name} - صورة ${index + 1}`}
                              sizes="(max-width: 640px) 46px, 52px"
                            />
                          </div>
                        ))}
                      </div>
                    ) : hasImage ? (
                      <CartImage
                        src={imageUrl}
                        alt={item.name}
                        sizes="(max-width: 640px) 96px, 110px"
                      />
                    ) : (
                      <div className="flex h-full min-h-36 items-center justify-center text-textMuted">
                        <CartIcon name="tag" className="h-8 w-8" />
                      </div>
                    )}
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col justify-center py-3 pl-3">
                    <span
                      className={`mb-1 w-fit rounded-full px-2 py-0.5 text-[10px] font-bold ${badgeStyle}`}
                    >
                      {itemKind}
                    </span>
                    <h3 className="line-clamp-1 text-sm font-bold text-textDark">{item.name}</h3>
                    <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                      <span className="text-sm font-bold text-deepRose">
                        {item.unitPrice.toLocaleString('ar-SY')} ل.س
                      </span>
                      {originalPrice != null && (
                        <span className="text-xs text-textMuted line-through">
                          {originalPrice.toLocaleString('ar-SY')} ل.س
                        </span>
                      )}
                      {item.discountPercentage != null && (
                        <span className="text-[10px] font-bold text-emerald-700">
                          خصم {Math.round(item.discountPercentage)}٪
                        </span>
                      )}
                    </div>

                    <div className="mt-2 flex w-fit items-center gap-3 rounded-xl bg-lightPinkBg px-2 py-1">
                      <button
                        type="button"
                        onPointerDown={(event) => event.stopPropagation()}
                        onClick={(event) => {
                          event.stopPropagation();
                          handleUpdateQuantity(item.id, item.quantity - 1);
                        }}
                        aria-label={`تقليل كمية ${item.name}`}
                        className="text-textMuted transition hover:text-deepRose"
                      >
                        <CartIcon name="minus" className="h-4 w-4" />
                      </button>
                      <span className="min-w-4 text-center text-sm font-bold text-textDark">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onPointerDown={(event) => event.stopPropagation()}
                        onClick={(event) => {
                          event.stopPropagation();
                          handleUpdateQuantity(item.id, item.quantity + 1);
                        }}
                        disabled={stockLimit != null && item.quantity >= stockLimit}
                        aria-label={`زيادة كمية ${item.name}`}
                        className="text-primaryRose transition hover:text-deepRose disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <CartIcon name="plus" className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>

      {items.length > 0 && (
        <div className="fixed inset-x-0 bottom-[112px] z-40 px-4 md:bottom-4 md:left-64 md:right-0">
          <div className="mx-auto max-w-4xl rounded-2xl border border-pink-100 bg-surfaceWhite p-4 shadow-[0_-8px_24px_rgba(74,30,52,0.12)]">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-bold text-textMuted">المجموع الكلي:</span>
              <span className="text-xl font-black text-deepRose">
                {totalAmount.toLocaleString('ar-SY')} ل.س
              </span>
            </div>
            <Link
              href="/checkout"
              className="flex h-12 w-full items-center justify-center rounded-xl bg-deepRose font-bold text-white shadow-md transition hover:bg-primaryRose"
            >
              إتمام الطلب
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}