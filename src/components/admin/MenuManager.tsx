"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useT, useFormatPrice } from "@/lib/i18n";

interface Menu {
  id: number;
  name: string;
  price: number;
  imageUrl: string | null;
  isActive: boolean;
  sortOrder: number;
  category: { id: number; name: string };
}

export default function MenuManager() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const t = useT();
  const fp = useFormatPrice();

  const fetchMenus = async () => {
    setLoading(true);
    const res = await fetch("/api/menus?includeInactive=1");
    const data = await res.json();
    setMenus(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchMenus();
  }, []);

  const deleteMenu = async (id: number) => {
    if (!confirm(t("admin.menu.confirmDelete"))) return;
    await fetch(`/api/menus/${id}`, { method: "DELETE" });
    fetchMenus();
  };

  const toggleActive = async (menu: Menu) => {
    await fetch(`/api/menus/${menu.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !menu.isActive }),
    });
    fetchMenus();
  };

  const duplicateMenu = async (id: number) => {
    await fetch(`/api/menus/${id}/duplicate`, { method: "POST" });
    fetchMenus();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">{t("admin.menu.management")}</h2>
        <Link
          href="/admin/menus/new"
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
        >
          {t("admin.menu.addNew")}
        </Link>
      </div>

      {loading ? (
        <p className="text-gray-500">{t("common.loading")}</p>
      ) : menus.length === 0 ? (
        <p className="text-gray-500">{t("admin.menu.noMenus")}</p>
      ) : (
        <div className="bg-white rounded-lg shadow">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left px-4 py-3 text-gray-600 font-medium">{t("admin.menu.image")}</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">{t("admin.menu.name")}</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">{t("admin.menu.category")}</th>
                <th className="text-right px-4 py-3 text-gray-600 font-medium">{t("admin.menu.price")}</th>
                <th className="text-center px-4 py-3 text-gray-600 font-medium">{t("admin.menu.status")}</th>
                <th className="text-right px-4 py-3 text-gray-600 font-medium w-48">{t("admin.menu.manage")}</th>
              </tr>
            </thead>
            <tbody>
              {menus.map((menu) => (
                <tr key={menu.id} className="border-b last:border-b-0">
                  <td className="px-4 py-2">
                    {menu.imageUrl ? (
                      <img src={menu.imageUrl} alt={menu.name} className="w-10 h-10 object-cover rounded" />
                    ) : (
                      <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs">{t("common.none")}</div>
                    )}
                  </td>
                  <td className="px-4 py-2 text-gray-800 font-medium">{menu.name}</td>
                  <td className="px-4 py-2 text-gray-600">{menu.category.name}</td>
                  <td className="px-4 py-2 text-right text-gray-800">{fp(menu.price)}</td>
                  <td className="px-4 py-2 text-center">
                    <button
                      onClick={() => toggleActive(menu)}
                      className={`text-xs px-2 py-1 rounded ${
                        menu.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {menu.isActive ? t("admin.menu.active") : t("admin.menu.inactive")}
                    </button>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button onClick={() => duplicateMenu(menu.id)} className="text-gray-500 hover:text-gray-700 text-sm mr-2">{t("admin.menu.duplicate")}</button>
                    <button onClick={() => router.push(`/admin/menus/${menu.id}/edit`)} className="text-blue-600 hover:text-blue-800 text-sm mr-2">{t("common.edit")}</button>
                    <button onClick={() => deleteMenu(menu.id)} className="text-red-600 hover:text-red-800 text-sm">{t("common.delete")}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
