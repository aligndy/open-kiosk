"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
    if (!confirm("이 메뉴를 삭제하시겠습니까?")) return;
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

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">메뉴 관리</h2>
        <Link
          href="/admin/menus/new"
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
        >
          새 메뉴 추가
        </Link>
      </div>

      {loading ? (
        <p className="text-gray-500">로딩 중...</p>
      ) : menus.length === 0 ? (
        <p className="text-gray-500">등록된 메뉴가 없습니다.</p>
      ) : (
        <div className="bg-white rounded-lg shadow">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left px-4 py-3 text-gray-600 font-medium">이미지</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">메뉴명</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">카테고리</th>
                <th className="text-right px-4 py-3 text-gray-600 font-medium">가격</th>
                <th className="text-center px-4 py-3 text-gray-600 font-medium">상태</th>
                <th className="text-right px-4 py-3 text-gray-600 font-medium w-40">관리</th>
              </tr>
            </thead>
            <tbody>
              {menus.map((menu) => (
                <tr key={menu.id} className="border-b last:border-b-0">
                  <td className="px-4 py-2">
                    {menu.imageUrl ? (
                      <img src={menu.imageUrl} alt={menu.name} className="w-10 h-10 object-cover rounded" />
                    ) : (
                      <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs">없음</div>
                    )}
                  </td>
                  <td className="px-4 py-2 text-gray-800 font-medium">{menu.name}</td>
                  <td className="px-4 py-2 text-gray-600">{menu.category.name}</td>
                  <td className="px-4 py-2 text-right text-gray-800">{menu.price.toLocaleString()}원</td>
                  <td className="px-4 py-2 text-center">
                    <button
                      onClick={() => toggleActive(menu)}
                      className={`text-xs px-2 py-1 rounded ${
                        menu.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {menu.isActive ? "활성" : "비활성"}
                    </button>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button onClick={() => router.push(`/admin/menus/${menu.id}/edit`)} className="text-blue-600 hover:text-blue-800 text-sm mr-2">수정</button>
                    <button onClick={() => deleteMenu(menu.id)} className="text-red-600 hover:text-red-800 text-sm">삭제</button>
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
