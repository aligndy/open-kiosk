"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/stores/cartStore";
import { useLanguageStore } from "@/stores/languageStore";
import CartView from "@/components/shop/CartView";
import CartBar from "@/components/shop/CartBar";
import LanguageSelector from "@/components/shop/LanguageSelector";
import CameraAgeDetector from "@/components/shop/CameraAgeDetector";
import { t } from "@/lib/i18n";

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const totalItems = useCartStore((s) => s.totalItems());
  const totalAmount = useCartStore((s) => s.totalAmount());
  const orderType = useCartStore((s) => s.orderType);
  const clearCart = useCartStore((s) => s.clearCart);
  const { currentLanguage, supportedLanguages, setLanguage, setSupportedLanguages } =
    useLanguageStore();
  const router = useRouter();
  const [showCart, setShowCart] = useState(false);
  const [storeName, setStoreName] = useState(() => t("shop.defaultStoreName", currentLanguage));
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [useCamera, setUseCamera] = useState(false);
  const clickCountRef = useRef(0);
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleLogoClick = useCallback(() => {
    clickCountRef.current += 1;
    if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
    if (clickCountRef.current >= 3) {
      clickCountRef.current = 0;
      router.push("/admin");
      return;
    }
    clickTimerRef.current = setTimeout(() => {
      clickCountRef.current = 0;
    }, 500);
  }, [router]);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.storeName) setStoreName(data.storeName);
        if (data.logoUrl) setLogoUrl(data.logoUrl);
        if (data.supportedLanguages) {
          try {
            const langs = JSON.parse(data.supportedLanguages);
            setSupportedLanguages(langs);
          } catch {
            // keep default
          }
        }
        if (data.defaultLanguage) {
          setLanguage(data.defaultLanguage);
        }
        if (data.useCameraDetection) {
          setUseCamera(true);
        }
      })
      .catch(() => { });
  }, [setSupportedLanguages, setLanguage]);

  if (showCart) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-50">
        <CartView onBack={() => setShowCart(false)} onPaymentComplete={() => setShowCart(false)} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-30 flex items-center justify-between bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-2 select-none cursor-default" onClick={handleLogoClick}>
          {logoUrl && (
            <img src={logoUrl} alt={storeName} className="h-9 w-9 object-contain rounded" />
          )}
          <h1 className="text-2xl font-bold text-gray-900">{storeName}</h1>
        </div>
        <div className="flex items-center gap-3">
          {orderType && (
            <button
              onClick={() => {
                clearCart();
                router.push("/shop");
              }}
              className="flex h-12 items-center justify-center rounded-lg bg-gray-100 px-4 text-sm font-bold text-gray-700 active:bg-gray-200"
            >
              {t("order.backToHome", currentLanguage)}
            </button>
          )}

          <LanguageSelector
            currentLanguage={currentLanguage}
            supportedLanguages={supportedLanguages}
            onSelect={setLanguage}
          />

          {/* Cart icon */}
          {orderType && (
            <button
              onClick={() => setShowCart(true)}
              className="relative flex h-12 w-12 items-center justify-center rounded-lg bg-amber-500 text-white"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"
                />
              </svg>
              {totalItems > 0 && (
                <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                  {totalItems}
                </span>
              )}
            </button>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 pb-24">{children}</main>

      {orderType && (
        <CartBar
          totalItems={totalItems}
          totalAmount={totalAmount}
          onOpenCart={() => setShowCart(true)}
        />
      )}

      {/* {useCamera && <CameraAgeDetector />} */}
    </div>
  );
}
