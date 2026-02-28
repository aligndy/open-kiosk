"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/admin/orders", label: "주문" },
  { href: "/admin/categories", label: "카테고리" },
  { href: "/admin/menus", label: "메뉴" },
  { href: "/admin/translations", label: "번역" },
  { href: "/admin/settings", label: "설정" },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 bg-white shadow-md flex flex-col">
      <div className="p-4 border-b flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-800">카페 관리자</h1>
        <Link
          href="/shop"
          target="_blank"
          className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600 hover:bg-gray-200"
        >
          미리보기
        </Link>
      </div>
      <nav className="flex-1 p-2">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-4 py-2.5 rounded-md mb-1 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
