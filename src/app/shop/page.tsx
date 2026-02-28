"use client";

import { useEffect, useState } from "react";
import { useLanguageStore } from "@/stores/languageStore";
import { CategoryWithMenus, MenuWithOptions } from "@/types";
import OptionModal from "@/components/shop/OptionModal";
import CategoryTabs from "@/components/shop/CategoryTabs";
import MenuGrid from "@/components/shop/MenuGrid";

export default function ShopPage() {
  const [categories, setCategories] = useState<CategoryWithMenus[]>([]);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [selectedMenu, setSelectedMenu] = useState<MenuWithOptions | null>(null);
  const [loading, setLoading] = useState(true);
  const currentLanguage = useLanguageStore((s) => s.currentLanguage);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data: CategoryWithMenus[]) => {
        setCategories(data);
        if (data.length > 0) {
          setActiveCategory(data[0].id);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const currentCategory = categories.find((c) => c.id === activeCategory);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-xl text-gray-400">메뉴를 불러오는 중...</div>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-xl text-gray-400">등록된 메뉴가 없습니다</div>
      </div>
    );
  }

  return (
    <>
      <CategoryTabs
        categories={categories}
        activeCategory={activeCategory}
        onSelect={setActiveCategory}
        currentLanguage={currentLanguage}
      />

      <MenuGrid
        menus={currentCategory?.menus ?? []}
        currentLanguage={currentLanguage}
        onSelect={setSelectedMenu}
      />

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
