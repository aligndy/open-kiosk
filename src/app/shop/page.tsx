"use client";

import { useEffect, useState } from "react";
import { useLanguageStore } from "@/stores/languageStore";
import { useT } from "@/lib/i18n";
import { CategoryWithMenus, MenuWithOptions } from "@/types";
import OptionModal from "@/components/shop/OptionModal";
import CategoryTabs from "@/components/shop/CategoryTabs";
import MenuGrid from "@/components/shop/MenuGrid";
import VendingGrid from "@/components/shop/VendingGrid";
import OrderTypeSelection from "@/components/shop/OrderTypeSelection";
import { useUiStore } from "@/stores/uiStore";
import { useCartStore } from "@/stores/cartStore";
import { showToast } from "@/components/ui/Toast";

export default function ShopPage() {
  const [categories, setCategories] = useState<CategoryWithMenus[]>([]);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const { isVendingMode, setVendingMode, showAgeDetectionToast, setShowAgeDetectionToast } = useUiStore();
  const orderType = useCartStore((s) => s.orderType);
  const [selectedMenu, setSelectedMenu] = useState<MenuWithOptions | null>(null);
  const [loading, setLoading] = useState(true);
  const currentLanguage = useLanguageStore((s) => s.currentLanguage);
  const t = useT();

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data: CategoryWithMenus[]) => {
        setCategories(data);
        if (data.length > 0) {
          setActiveCategory(data[0].id);
        }
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (showAgeDetectionToast) {
      showToast(t("shop.vendingAutoEnabled"), "info");
      setShowAgeDetectionToast(false);
    }
  }, [showAgeDetectionToast, setShowAgeDetectionToast, t]);

  const currentCategory = categories.find((c) => c.id === activeCategory);

  const handleCategorySelect = (id: number) => {
    setVendingMode(false);
    setActiveCategory(id);
  };

  const handleVendingToggle = () => {
    const nextMode = !isVendingMode;
    setVendingMode(nextMode);
    if (!nextMode && categories.length > 0) {
      setActiveCategory(categories[0].id);
    } else {
      setActiveCategory(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-xl text-gray-400">{t("shop.loadingMenus")}</div>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-xl text-gray-400">{t("shop.noMenus")}</div>
      </div>
    );
  }

  if (!orderType) {
    return <OrderTypeSelection />;
  }

  return (
    <>
      <CategoryTabs
        categories={categories}
        activeCategory={activeCategory}
        onSelect={handleCategorySelect}
        currentLanguage={currentLanguage}
        vendingMode={isVendingMode}
        onVendingToggle={handleVendingToggle}
      />

      {isVendingMode ? (
        <VendingGrid
          categories={categories}
          currentLanguage={currentLanguage}
        />
      ) : (
        <MenuGrid
          menus={currentCategory?.menus ?? []}
          currentLanguage={currentLanguage}
          onSelect={setSelectedMenu}
        />
      )}

      {/* Option modal */}
      {selectedMenu && (
        <OptionModal
          menu={selectedMenu}
          onClose={() => setSelectedMenu(null)}
        />
      )}
    </>
  );
}
