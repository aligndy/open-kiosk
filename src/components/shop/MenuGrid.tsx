"use client";

import { MenuWithOptions } from "@/types";
import MenuCard from "@/components/shop/MenuCard";

interface MenuGridProps {
  menus: MenuWithOptions[];
  currentLanguage: string;
  onSelect: (menu: MenuWithOptions) => void;
}

export default function MenuGrid({ menus, currentLanguage, onSelect }: MenuGridProps) {
  return (
    <div className="grid grid-cols-3 gap-3 p-3">
      {menus.map((menu) => (
        <MenuCard
          key={menu.id}
          menu={menu}
          currentLanguage={currentLanguage}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
