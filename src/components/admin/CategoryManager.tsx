"use client";

import { useEffect, useRef, useState } from "react";
import { useT } from "@/lib/i18n";

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
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const t = useT();

  // Gallery modal state
  const [galleryCategory, setGalleryCategory] = useState<Category | null>(null);
  const [galleryImages, setGalleryImages] = useState<CategoryImageItem[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [galleryPrompt, setGalleryPrompt] = useState("");
  const [galleryGenerating, setGalleryGenerating] = useState(false);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [fileDragOver, setFileDragOver] = useState(false);

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
    const maxSort = categories.reduce((max, c) => Math.max(max, c.sortOrder), -1);
    await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim(), sortOrder: maxSort + 1 }),
    });
    setNewName("");
    fetchCategories();
  };

  const startEdit = (cat: Category) => {
    setEditingId(cat.id);
    setEditName(cat.name);
  };

  const saveEdit = async () => {
    if (!editName.trim() || editingId === null) return;
    await fetch(`/api/categories/${editingId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName.trim() }),
    });
    setEditingId(null);
    fetchCategories();
  };

  const deleteCategory = async (id: number) => {
    if (!confirm(t("admin.category.confirmDelete"))) return;
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
        alert(data.error?.message || t("admin.menuForm.imageGenFailed"));
      }
    } catch {
      alert(t("admin.menuForm.imageGenError"));
    }
    setGalleryGenerating(false);
  };

  const uploadFile = async (file: File) => {
    if (!galleryCategory) return;
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
        alert(data.error?.message || t("admin.menuForm.uploadFailed"));
      }
    } catch {
      alert(t("admin.menuForm.uploadError"));
    }
    setGalleryUploading(false);
  };

  const uploadGalleryImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadFile(file);
    e.target.value = "";
  };

  const handleFileDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setFileDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      await uploadFile(file);
    }
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

  // Drag & drop
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const handleDragStart = (idx: number) => {
    dragItem.current = idx;
    setDragIdx(idx);
  };

  const handleDragEnter = (idx: number) => {
    dragOverItem.current = idx;
  };

  const handleDragEnd = async () => {
    if (dragItem.current === null || dragOverItem.current === null || dragItem.current === dragOverItem.current) {
      setDragIdx(null);
      return;
    }
    const reordered = [...categories];
    const [removed] = reordered.splice(dragItem.current, 1);
    reordered.splice(dragOverItem.current, 0, removed);
    // Update sortOrder locally
    const updated = reordered.map((cat, i) => ({ ...cat, sortOrder: i }));
    setCategories(updated);
    setDragIdx(null);
    dragItem.current = null;
    dragOverItem.current = null;
    // Persist to server
    for (const cat of updated) {
      await fetch(`/api/categories/${cat.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sortOrder: cat.sortOrder }),
      });
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-4">{t("admin.category.management")}</h2>

      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">
          {t("admin.category.addNew")}
        </h3>
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1">{t("admin.category.name")}</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={t("admin.category.categoryName")}
              className="w-full border rounded-md px-3 py-2 text-sm"
              onKeyDown={(e) => e.key === "Enter" && addCategory()}
            />
          </div>
          <button
            onClick={addCategory}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
          >
            {t("common.add")}
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-500">{t("common.loading")}</p>
      ) : categories.length === 0 ? (
        <p className="text-gray-500">{t("admin.category.noCategories")}</p>
      ) : (
        <div className="bg-white rounded-lg shadow">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="w-10 px-2 py-3" />
                <th className="text-left px-4 py-3 text-gray-600 font-medium">{t("admin.category.name")}</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium w-24">{t("admin.category.reference")}</th>
                <th className="text-right px-4 py-3 text-gray-600 font-medium w-36">{t("admin.category.manage")}</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat, idx) => (
                <tr
                  key={cat.id}
                  draggable={editingId !== cat.id}
                  onDragStart={() => handleDragStart(idx)}
                  onDragEnter={() => handleDragEnter(idx)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => e.preventDefault()}
                  className={`border-b last:border-b-0 transition-colors ${
                    dragIdx === idx ? "opacity-40 bg-blue-50" : ""
                  }`}
                >
                  {editingId === cat.id ? (
                    <>
                      <td className="px-2 py-2 text-center text-gray-300">
                        <svg className="w-5 h-5 mx-auto" fill="currentColor" viewBox="0 0 24 24"><path d="M8 6h2v2H8zm6 0h2v2h-2zM8 11h2v2H8zm6 0h2v2h-2zM8 16h2v2H8zm6 0h2v2h-2z"/></svg>
                      </td>
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
                        {cat.referenceImageUrl ? (
                          <img src={cat.referenceImageUrl} alt={t("admin.category.reference")} className="w-10 h-10 object-cover rounded border" />
                        ) : (
                          <span className="text-gray-400 text-xs">{t("common.none")}</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <button onClick={saveEdit} className="text-blue-600 hover:text-blue-800 text-sm mr-2">{t("common.save")}</button>
                        <button onClick={() => setEditingId(null)} className="text-gray-500 hover:text-gray-700 text-sm">{t("common.cancel")}</button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-2 py-3 text-center cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600">
                        <svg className="w-5 h-5 mx-auto" fill="currentColor" viewBox="0 0 24 24"><path d="M8 6h2v2H8zm6 0h2v2h-2zM8 11h2v2H8zm6 0h2v2h-2zM8 16h2v2H8zm6 0h2v2h-2z"/></svg>
                      </td>
                      <td className="px-4 py-3 text-gray-800">{cat.name}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => openGallery(cat)}
                          className="hover:opacity-80 transition-opacity"
                          title={t("admin.category.openGallery")}
                        >
                          {cat.referenceImageUrl ? (
                            <img src={cat.referenceImageUrl} alt={t("admin.category.reference")} className="w-10 h-10 object-cover rounded border cursor-pointer" />
                          ) : (
                            <span className="inline-flex items-center justify-center w-10 h-10 rounded border border-dashed border-gray-300 text-gray-400 text-lg cursor-pointer hover:border-blue-400 hover:text-blue-400">+</span>
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => startEdit(cat)} className="text-blue-600 hover:text-blue-800 text-sm mr-2">{t("common.edit")}</button>
                        <button onClick={() => deleteCategory(cat.id)} className="text-red-600 hover:text-red-800 text-sm">{t("common.delete")}</button>
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
          <div
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6"
            onDragOver={(e) => { e.preventDefault(); setFileDragOver(true); }}
            onDragLeave={() => setFileDragOver(false)}
            onDrop={handleFileDrop}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800">
                {t("admin.category.referenceImages", { name: galleryCategory.name })}
              </h3>
              <button
                onClick={closeGallery}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                &times;
              </button>
            </div>

            {/* Drop overlay */}
            {fileDragOver && (
              <div className="mb-4 flex items-center justify-center rounded-xl border-2 border-dashed border-blue-400 bg-blue-50 py-10">
                <p className="text-blue-500 font-medium">{t("admin.menuForm.dropImageHere")}</p>
              </div>
            )}

            {/* Image Grid */}
            {galleryLoading ? (
              <p className="text-gray-500 text-sm py-4">{t("common.loading")}</p>
            ) : galleryImages.length === 0 && !fileDragOver ? (
              <div className="mb-4 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 py-10 text-gray-400">
                <svg className="w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                <p className="text-sm">{t("admin.menuForm.dragOrUpload")}</p>
              </div>
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
                      alt={t("admin.category.categoryImage")}
                      className="w-full aspect-square object-cover"
                      title={img.prompt || undefined}
                    />
                    {galleryCategory.referenceImageUrl === img.imageUrl && (
                      <div className="absolute top-1 left-1 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded">
                        {t("admin.menuForm.selected")}
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

            {/* Actions */}
            <div className="border-t pt-4 flex gap-3">
              {/* AI Generation */}
              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  value={galleryPrompt}
                  onChange={(e) => setGalleryPrompt(e.target.value)}
                  placeholder={t("admin.category.imageDescription")}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
                  onKeyDown={(e) => e.key === "Enter" && generateGalleryImage()}
                  disabled={galleryGenerating}
                />
                <button
                  onClick={generateGalleryImage}
                  disabled={galleryGenerating || !galleryPrompt.trim()}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 disabled:opacity-40 whitespace-nowrap"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  {galleryGenerating ? t("admin.menuForm.generating") : t("admin.menuForm.aiGenerate")}
                </button>
              </div>

              {/* File Upload */}
              <label className={`flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 cursor-pointer whitespace-nowrap ${galleryUploading ? "opacity-40 pointer-events-none" : ""}`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                {galleryUploading ? t("admin.menuForm.uploading") : t("admin.menuForm.fileUpload")}
                <input
                  type="file"
                  accept="image/*"
                  onChange={uploadGalleryImage}
                  disabled={galleryUploading}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
