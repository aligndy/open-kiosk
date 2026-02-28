"use client";

import { useEffect, useState } from "react";

interface Category {
  id: number;
  name: string;
  sortOrder: number;
  isActive: boolean;
  referenceImageUrl: string | null;
}

interface CategoryImageItem {
  id: number;
  categoryId: number;
  imageUrl: string;
  prompt: string | null;
  isAiGenerated: boolean;
  createdAt: string;
}

export default function CategoryManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newSortOrder, setNewSortOrder] = useState(0);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editSortOrder, setEditSortOrder] = useState(0);

  // Gallery modal state
  const [galleryCategory, setGalleryCategory] = useState<Category | null>(null);
  const [galleryImages, setGalleryImages] = useState<CategoryImageItem[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [galleryPrompt, setGalleryPrompt] = useState("");
  const [galleryGenerating, setGalleryGenerating] = useState(false);
  const [galleryUploading, setGalleryUploading] = useState(false);

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

  // Gallery functions
  const openGallery = async (cat: Category) => {
    setGalleryCategory(cat);
    setGalleryLoading(true);
    setGalleryPrompt("");
    try {
      const res = await fetch(`/api/categories/${cat.id}/images`);
      if (res.ok) {
        const data = await res.json();
        setGalleryImages(data);
      } else {
        setGalleryImages([]);
      }
    } catch {
      setGalleryImages([]);
    }
    setGalleryLoading(false);
  };

  const closeGallery = () => {
    setGalleryCategory(null);
    setGalleryImages([]);
    setGalleryPrompt("");
  };

  const generateGalleryImage = async () => {
    if (!galleryCategory || !galleryPrompt.trim()) return;
    setGalleryGenerating(true);
    try {
      const res = await fetch(`/api/categories/${galleryCategory.id}/images`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: galleryPrompt.trim() }),
      });
      if (res.ok) {
        setGalleryPrompt("");
        // Refresh gallery and categories
        const imagesRes = await fetch(`/api/categories/${galleryCategory.id}/images`);
        setGalleryImages(await imagesRes.json());
        fetchCategories();
      } else {
        const data = await res.json();
        alert(data.error?.message || "이미지 생성 실패");
      }
    } catch {
      alert("이미지 생성 중 오류가 발생했습니다.");
    }
    setGalleryGenerating(false);
  };

  const uploadGalleryImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !galleryCategory) return;
    setGalleryUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/categories/${galleryCategory.id}/images`, {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const imagesRes = await fetch(`/api/categories/${galleryCategory.id}/images`);
        setGalleryImages(await imagesRes.json());
        fetchCategories();
      } else {
        const data = await res.json();
        alert(data.error?.message || "업로드 실패");
      }
    } catch {
      alert("업로드 중 오류가 발생했습니다.");
    }
    setGalleryUploading(false);
    e.target.value = "";
  };

  const selectGalleryImage = async (img: CategoryImageItem) => {
    if (!galleryCategory) return;
    await fetch(`/api/categories/${galleryCategory.id}/images/${img.id}`, {
      method: "PUT",
    });
    setGalleryCategory({ ...galleryCategory, referenceImageUrl: img.imageUrl });
    fetchCategories();
  };

  const deleteGalleryImage = async (img: CategoryImageItem) => {
    if (!galleryCategory) return;
    await fetch(`/api/categories/${galleryCategory.id}/images/${img.id}`, {
      method: "DELETE",
    });
    const imagesRes = await fetch(`/api/categories/${galleryCategory.id}/images`);
    setGalleryImages(await imagesRes.json());
    fetchCategories();
    // Update gallery category reference if it was the deleted one
    if (galleryCategory.referenceImageUrl === img.imageUrl) {
      setGalleryCategory({ ...galleryCategory, referenceImageUrl: null });
    }
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
                <th className="text-left px-4 py-3 text-gray-600 font-medium w-24">레퍼런스</th>
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
                      <td className="px-4 py-2">
                        {cat.referenceImageUrl ? (
                          <img src={cat.referenceImageUrl} alt="레퍼런스" className="w-10 h-10 object-cover rounded border" />
                        ) : (
                          <span className="text-gray-400 text-xs">없음</span>
                        )}
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
                      <td className="px-4 py-3">
                        <button
                          onClick={() => openGallery(cat)}
                          className="hover:opacity-80 transition-opacity"
                          title="갤러리 열기"
                        >
                          {cat.referenceImageUrl ? (
                            <img src={cat.referenceImageUrl} alt="레퍼런스" className="w-10 h-10 object-cover rounded border cursor-pointer" />
                          ) : (
                            <span className="inline-flex items-center justify-center w-10 h-10 rounded border border-dashed border-gray-300 text-gray-400 text-lg cursor-pointer hover:border-blue-400 hover:text-blue-400">+</span>
                          )}
                        </button>
                      </td>
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

      {/* Gallery Modal */}
      {galleryCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800">
                {galleryCategory.name} - 레퍼런스 이미지
              </h3>
              <button
                onClick={closeGallery}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                &times;
              </button>
            </div>

            {/* Image Grid */}
            {galleryLoading ? (
              <p className="text-gray-500 text-sm py-4">로딩 중...</p>
            ) : galleryImages.length === 0 ? (
              <p className="text-gray-400 text-sm py-4">이미지가 없습니다. AI 생성 또는 파일 업로드를 해주세요.</p>
            ) : (
              <div className="grid grid-cols-4 gap-3 mb-4">
                {galleryImages.map((img) => (
                  <div
                    key={img.id}
                    className={`relative group cursor-pointer rounded-lg border-2 overflow-hidden ${
                      galleryCategory.referenceImageUrl === img.imageUrl
                        ? "border-blue-500 ring-2 ring-blue-200"
                        : "border-gray-200 hover:border-gray-400"
                    }`}
                    onClick={() => selectGalleryImage(img)}
                  >
                    <img
                      src={img.imageUrl}
                      alt="카테고리 이미지"
                      className="w-full aspect-square object-cover"
                      title={img.prompt || undefined}
                    />
                    {galleryCategory.referenceImageUrl === img.imageUrl && (
                      <div className="absolute top-1 left-1 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded">
                        선택됨
                      </div>
                    )}
                    {img.isAiGenerated && (
                      <div className="absolute bottom-1 left-1 bg-purple-600 text-white text-[10px] px-1 py-0.5 rounded font-medium">
                        AI
                      </div>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteGalleryImage(img);
                      }}
                      className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      X
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* AI Generation */}
            <div className="border-t pt-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  AI 이미지 생성
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={galleryPrompt}
                    onChange={(e) => setGalleryPrompt(e.target.value)}
                    placeholder="이미지 설명 (예: 따뜻한 분위기의 커피 카페)"
                    className="flex-1 border rounded-md px-3 py-2 text-sm"
                    onKeyDown={(e) => e.key === "Enter" && generateGalleryImage()}
                    disabled={galleryGenerating}
                  />
                  <button
                    onClick={generateGalleryImage}
                    disabled={galleryGenerating || !galleryPrompt.trim()}
                    className="px-4 py-2 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700 disabled:opacity-50 whitespace-nowrap"
                  >
                    {galleryGenerating ? "생성 중..." : "생성"}
                  </button>
                </div>
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  파일 업로드
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={uploadGalleryImage}
                  disabled={galleryUploading}
                  className="text-sm"
                />
                {galleryUploading && (
                  <span className="text-xs text-gray-500 ml-2">업로드 중...</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
