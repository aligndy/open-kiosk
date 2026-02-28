"use client";

import { useEffect, useState } from "react";

interface Category {
  id: number;
  name: string;
  sortOrder: number;
  isActive: boolean;
}

export default function CategoryManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newSortOrder, setNewSortOrder] = useState(0);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editSortOrder, setEditSortOrder] = useState(0);

  const fetchCategories = async () => {
    setLoading(true);
    const res = await fetch("/api/categories");
    const data = await res.json();
    setCategories(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const addCategory = async () => {
    if (!newName.trim()) return;
    await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim(), sortOrder: newSortOrder }),
    });
    setNewName("");
    setNewSortOrder(0);
    fetchCategories();
  };

  const startEdit = (cat: Category) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditSortOrder(cat.sortOrder);
  };

  const saveEdit = async () => {
    if (!editName.trim() || editingId === null) return;
    await fetch(`/api/categories/${editingId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName.trim(), sortOrder: editSortOrder }),
    });
    setEditingId(null);
    fetchCategories();
  };

  const deleteCategory = async (id: number) => {
    if (!confirm("이 카테고리를 삭제하시겠습니까?")) return;
    await fetch(`/api/categories/${id}`, { method: "DELETE" });
    fetchCategories();
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-4">카테고리 관리</h2>

      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">
          새 카테고리 추가
        </h3>
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1">이름</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="카테고리 이름"
              className="w-full border rounded-md px-3 py-2 text-sm"
              onKeyDown={(e) => e.key === "Enter" && addCategory()}
            />
          </div>
          <div className="w-24">
            <label className="block text-xs text-gray-500 mb-1">정렬순서</label>
            <input
              type="number"
              value={newSortOrder}
              onChange={(e) => setNewSortOrder(Number(e.target.value))}
              className="w-full border rounded-md px-3 py-2 text-sm"
            />
          </div>
          <button
            onClick={addCategory}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
          >
            추가
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-500">로딩 중...</p>
      ) : categories.length === 0 ? (
        <p className="text-gray-500">카테고리가 없습니다.</p>
      ) : (
        <div className="bg-white rounded-lg shadow">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left px-4 py-3 text-gray-600 font-medium">이름</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium w-28">정렬순서</th>
                <th className="text-right px-4 py-3 text-gray-600 font-medium w-36">관리</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id} className="border-b last:border-b-0">
                  {editingId === cat.id ? (
                    <>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full border rounded px-2 py-1 text-sm"
                          onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          value={editSortOrder}
                          onChange={(e) => setEditSortOrder(Number(e.target.value))}
                          className="w-full border rounded px-2 py-1 text-sm"
                        />
                      </td>
                      <td className="px-4 py-2 text-right">
                        <button onClick={saveEdit} className="text-blue-600 hover:text-blue-800 text-sm mr-2">저장</button>
                        <button onClick={() => setEditingId(null)} className="text-gray-500 hover:text-gray-700 text-sm">취소</button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 text-gray-800">{cat.name}</td>
                      <td className="px-4 py-3 text-gray-600">{cat.sortOrder}</td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => startEdit(cat)} className="text-blue-600 hover:text-blue-800 text-sm mr-2">수정</button>
                        <button onClick={() => deleteCategory(cat.id)} className="text-red-600 hover:text-red-800 text-sm">삭제</button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
