"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useT, useFormatPrice } from "@/lib/i18n";

interface OptionInput {
  name: string;
  priceModifier: number;
}

interface OptionGroupInput {
  id?: number;
  name: string;
  required: boolean;
  options: OptionInput[];
}

interface Category {
  id: number;
  name: string;
  referenceImageUrl?: string | null;
}

interface MenuImageItem {
  id: number;
  menuId: number;
  imageUrl: string;
  prompt: string | null;
  transparentBg: boolean | null;
  usedReferenceImage: boolean | null;
  isAiGenerated: boolean;
  createdAt: string;
}

interface MenuFormProps {
  menuId?: number;
}

export default function MenuForm({ menuId }: MenuFormProps) {
  const router = useRouter();
  const isEdit = !!menuId;
  const t = useT();
  const fp = useFormatPrice();

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<number | "">("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imagePrompt, setImagePrompt] = useState("");
  const [transparentBg, setTransparentBg] = useState(true);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [optionGroups, setOptionGroups] = useState<OptionGroupInput[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Gallery state
  const [galleryImages, setGalleryImages] = useState<MenuImageItem[]>([]);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [fileDragOver, setFileDragOver] = useState(false);

  // Reference image selection
  const [siblingMenus, setSiblingMenus] = useState<{ id: number; name: string; imageUrl: string | null }[]>([]);
  const [selectedRefUrl, setSelectedRefUrl] = useState<string | null>(null);

  // Image preview overlay
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const catRes = await fetch("/api/categories");
      const cats = await catRes.json();
      setCategories(cats);

      if (isEdit) {
        const menuRes = await fetch(`/api/menus/${menuId}`);
        const menu = await menuRes.json();
        setCategoryId(menu.categoryId);
        setName(menu.name);
        setDescription(menu.description || "");
        setPrice(menu.price);
        setImageUrl(menu.imageUrl);
        setOptionGroups(
          menu.optionGroups.map(
            (g: {
              id: number;
              name: string;
              required: boolean;
              options: { name: string; priceModifier: number }[];
            }) => ({
              id: g.id,
              name: g.name,
              required: g.required,
              options: g.options.map((o) => ({
                name: o.name,
                priceModifier: o.priceModifier,
              })),
            })
          )
        );

        // Load gallery images
        const imagesRes = await fetch(`/api/menus/${menuId}/images`);
        setGalleryImages(await imagesRes.json());
      }
      setLoading(false);
    };
    init();
  }, [menuId, isEdit]);

  const refreshGallery = async () => {
    if (!menuId) return;
    const res = await fetch(`/api/menus/${menuId}/images`);
    setGalleryImages(await res.json());
  };

  const uploadFile = async (file: File) => {
    if (isEdit && menuId) {
      setGalleryUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch(`/api/menus/${menuId}/images`, {
          method: "POST",
          body: formData,
        });
        if (res.ok) {
          const data = await res.json();
          setImageUrl(data.imageUrl);
          await refreshGallery();
        } else {
          const data = await res.json();
          alert(data.error?.message || t("admin.menuForm.uploadFailed"));
        }
      } catch {
        alert(t("admin.menuForm.uploadError"));
      }
      setGalleryUploading(false);
    } else {
      setImageUrl(URL.createObjectURL(file));
      const formData = new FormData();
      formData.append("image", file);
      (window as unknown as Record<string, FormData>).__menuImageFile = formData;
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

  // Fetch sibling menus when category changes
  useEffect(() => {
    if (!categoryId) { setSiblingMenus([]); return; }
    fetch(`/api/menus?categoryId=${categoryId}&includeInactive=1`)
      .then((r) => r.json())
      .then((menus) => {
        const siblings = menus
          .filter((m: { id: number; imageUrl: string | null }) => m.id !== menuId && m.imageUrl)
          .map((m: { id: number; name: string; imageUrl: string | null }) => ({
            id: m.id, name: m.name, imageUrl: m.imageUrl,
          }));
        setSiblingMenus(siblings);
      })
      .catch(() => setSiblingMenus([]));
  }, [categoryId, menuId]);

  const defaultPrompt = [name, description].filter(Boolean).join(" - ");

  const selectedCategory = categories.find((c) => c.id === categoryId);
  const categoryRefImage = selectedCategory?.referenceImageUrl || null;

  // Available reference images: category ref + sibling menus + this menu's gallery
  const usedUrls = new Set<string>();
  const referenceOptions: { url: string; label: string }[] = [];
  if (categoryRefImage) {
    referenceOptions.push({ url: categoryRefImage, label: t("admin.menuForm.categoryReference") });
    usedUrls.add(categoryRefImage);
  }
  for (const m of siblingMenus) {
    if (m.imageUrl && !usedUrls.has(m.imageUrl)) {
      referenceOptions.push({ url: m.imageUrl, label: m.name });
      usedUrls.add(m.imageUrl);
    }
  }
  for (const img of galleryImages) {
    if (!usedUrls.has(img.imageUrl)) {
      const label = img.isAiGenerated ? t("admin.menuForm.galleryLabel.ai") : t("admin.menuForm.galleryLabel.upload");
      referenceOptions.push({ url: img.imageUrl, label });
      usedUrls.add(img.imageUrl);
    }
  }

  const generateImage = async () => {
    const finalPrompt = imagePrompt.trim() || defaultPrompt;
    if (!finalPrompt) return;
    setGeneratingImage(true);
    try {
      const requestBody: Record<string, unknown> = {
        prompt: finalPrompt,
        menuId: menuId || null,
        transparentBg,
      };
      if (selectedRefUrl) {
        requestBody.referenceImageUrl = selectedRefUrl;
      }
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });
      const data = await res.json();
      if (data.imageUrl) {
        setImageUrl(data.imageUrl);
        if (isEdit) await refreshGallery();
      } else {
        alert(data.error?.message || t("admin.menuForm.imageGenFailed"));
      }
    } catch {
      alert(t("admin.menuForm.imageGenError"));
    }
    setGeneratingImage(false);
  };

  const selectGalleryImage = async (img: MenuImageItem) => {
    if (!menuId) return;
    await fetch(`/api/menus/${menuId}/images/${img.id}`, { method: "PUT" });
    setImageUrl(img.imageUrl);
  };

  const deleteGalleryImage = async (img: MenuImageItem) => {
    if (!menuId) return;
    await fetch(`/api/menus/${menuId}/images/${img.id}`, { method: "DELETE" });
    if (imageUrl === img.imageUrl) {
      setImageUrl(null);
    }
    await refreshGallery();
  };

  const addOptionGroup = () => {
    setOptionGroups([
      ...optionGroups,
      { name: "", required: false, options: [{ name: "", priceModifier: 0 }] },
    ]);
  };

  const removeOptionGroup = (idx: number) => {
    setOptionGroups(optionGroups.filter((_, i) => i !== idx));
  };

  const updateGroup = (
    idx: number,
    field: "name" | "required",
    value: string | boolean
  ) => {
    const updated = [...optionGroups];
    if (field === "name") updated[idx].name = value as string;
    else updated[idx].required = value as boolean;
    setOptionGroups(updated);
  };

  const addOption = (groupIdx: number) => {
    const updated = [...optionGroups];
    updated[groupIdx].options.push({ name: "", priceModifier: 0 });
    setOptionGroups(updated);
  };

  const removeOption = (groupIdx: number, optIdx: number) => {
    const updated = [...optionGroups];
    updated[groupIdx].options = updated[groupIdx].options.filter(
      (_, i) => i !== optIdx
    );
    setOptionGroups(updated);
  };

  const updateOption = (
    groupIdx: number,
    optIdx: number,
    field: "name" | "priceModifier",
    value: string | number
  ) => {
    const updated = [...optionGroups];
    if (field === "name") updated[groupIdx].options[optIdx].name = value as string;
    else updated[groupIdx].options[optIdx].priceModifier = value as number;
    setOptionGroups(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId || !name.trim() || !price) {
      alert(t("admin.menuForm.requiredFields"));
      return;
    }

    setSaving(true);

    try {
      let savedMenuId = menuId;

      // Check for stored file (new menu case)
      const storedFormData = (window as unknown as Record<string, FormData>).__menuImageFile;
      const hasNewFile = !isEdit && storedFormData;

      if (hasNewFile) {
        const formData = storedFormData;
        formData.append("name", name.trim());
        formData.append("description", description);
        formData.append("price", String(price));
        formData.append("categoryId", String(categoryId));

        const res = await fetch("/api/menus", { method: "POST", body: formData });
        const data = await res.json();
        savedMenuId = data.id;
        delete (window as unknown as Record<string, FormData>).__menuImageFile;
      } else {
        const body: Record<string, unknown> = {
          name: name.trim(),
          description,
          price: Number(price),
          categoryId: Number(categoryId),
        };
        if (imageUrl && !imageUrl.startsWith("blob:")) body.imageUrl = imageUrl;

        const url = isEdit ? `/api/menus/${menuId}` : "/api/menus";
        const method = isEdit ? "PUT" : "POST";
        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        savedMenuId = data.id;
      }

      // Save option groups
      if (isEdit && savedMenuId) {
        const menuRes = await fetch(`/api/menus/${savedMenuId}`);
        const currentMenu = await menuRes.json();
        const existingGroupIds = new Set(
          optionGroups.filter((g) => g.id).map((g) => g.id)
        );

        for (const existing of currentMenu.optionGroups) {
          if (!existingGroupIds.has(existing.id)) {
            await fetch(
              `/api/menus/${savedMenuId}/options/${existing.id}`,
              { method: "DELETE" }
            );
          }
        }

        for (let i = 0; i < optionGroups.length; i++) {
          const group = optionGroups[i];
          if (!group.name.trim()) continue;
          const validOptions = group.options.filter((o) => o.name.trim());

          if (group.id) {
            await fetch(
              `/api/menus/${savedMenuId}/options/${group.id}`,
              {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  name: group.name.trim(),
                  required: group.required,
                  sortOrder: i,
                  options: validOptions.map((o, oi) => ({
                    name: o.name.trim(),
                    priceModifier: Number(o.priceModifier),
                    sortOrder: oi,
                  })),
                }),
              }
            );
          } else {
            await fetch(`/api/menus/${savedMenuId}/options`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: group.name.trim(),
                required: group.required,
                sortOrder: i,
                options: validOptions.map((o, oi) => ({
                  name: o.name.trim(),
                  priceModifier: Number(o.priceModifier),
                  sortOrder: oi,
                })),
              }),
            });
          }
        }
      } else if (savedMenuId) {
        for (let i = 0; i < optionGroups.length; i++) {
          const group = optionGroups[i];
          if (!group.name.trim()) continue;
          const validOptions = group.options.filter((o) => o.name.trim());

          await fetch(`/api/menus/${savedMenuId}/options`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: group.name.trim(),
              required: group.required,
              sortOrder: i,
              options: validOptions.map((o, oi) => ({
                name: o.name.trim(),
                priceModifier: Number(o.priceModifier),
                sortOrder: oi,
              })),
            }),
          });
        }
      }

      router.push("/admin/menus");
    } catch {
      alert(t("common.saveError"));
    }

    setSaving(false);
  };

  if (loading) {
    return <p className="text-gray-500">{t("common.loading")}</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      {/* Basic Fields */}
      <div className="bg-white rounded-lg shadow p-4 space-y-4">
        <h3 className="font-medium text-gray-800">{t("admin.menuForm.basicInfo")}</h3>

        <div>
          <label className="block text-sm text-gray-600 mb-1">{t("admin.menuForm.category")}</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(Number(e.target.value))}
            className="w-full border rounded-md px-3 py-2 text-sm"
            required
          >
            <option value="">{t("admin.menuForm.selectPlaceholder")}</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">{t("admin.menuForm.menuName")}</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border rounded-md px-3 py-2 text-sm"
            required
          />
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">{t("admin.menuForm.description")}</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border rounded-md px-3 py-2 text-sm"
            rows={2}
          />
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">{t("admin.menuForm.price")}</label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value ? Number(e.target.value) : "")}
            className="w-full border rounded-md px-3 py-2 text-sm"
            required
            min={0}
          />
        </div>
      </div>

      {/* Image Gallery */}
      <div
        className="bg-white rounded-lg shadow p-4 space-y-4"
        onDragOver={(e) => { e.preventDefault(); setFileDragOver(true); }}
        onDragLeave={() => setFileDragOver(false)}
        onDrop={handleFileDrop}
      >
        <h3 className="font-medium text-gray-800">{t("admin.menuForm.image")}</h3>

        {/* Drop overlay */}
        {fileDragOver && (
          <div className="flex items-center justify-center rounded-xl border-2 border-dashed border-blue-400 bg-blue-50 py-10">
            <p className="text-blue-500 font-medium">{t("admin.menuForm.dropImageHere")}</p>
          </div>
        )}

        {/* Gallery Grid */}
        {isEdit && galleryImages.length > 0 && !fileDragOver && (
          <div className="grid grid-cols-4 gap-3">
            {galleryImages.map((img) => (
              <div
                key={img.id}
                className={`relative group cursor-pointer rounded-lg border-2 overflow-hidden ${
                  imageUrl === img.imageUrl
                    ? "border-blue-500 ring-2 ring-blue-200"
                    : "border-gray-200 hover:border-gray-400"
                }`}
                onClick={() => imageUrl === img.imageUrl ? setPreviewUrl(img.imageUrl) : selectGalleryImage(img)}
              >
                <img
                  src={img.imageUrl}
                  alt={t("admin.menuForm.menuImage")}
                  className="w-full aspect-square object-cover"
                  title={
                    img.prompt
                      ? `${img.prompt}${img.transparentBg ? ' | 흰배경' : ''}${img.usedReferenceImage ? ' | 레퍼런스' : ''}`
                      : undefined
                  }
                />
                {imageUrl === img.imageUrl && (
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
                  type="button"
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

        {/* Current image preview (for new menus or if no gallery) */}
        {(!isEdit || galleryImages.length === 0) && imageUrl && !fileDragOver && (
          <div className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-gray-200 py-6">
            <img
              src={imageUrl}
              alt={t("admin.menuForm.menuImage")}
              className="w-32 h-32 object-cover rounded-md border"
            />
          </div>
        )}

        {/* Empty state drop zone */}
        {(!isEdit || galleryImages.length === 0) && !imageUrl && !fileDragOver && (
          <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 py-10 text-gray-400">
            <svg className="w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            <p className="text-sm">{t("admin.menuForm.dragOrUpload")}</p>
          </div>
        )}

        {/* Actions row */}
        <div className="border-t pt-4 space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={imagePrompt}
              onChange={(e) => setImagePrompt(e.target.value)}
              placeholder={defaultPrompt || t("admin.menuForm.enterNameFirst")}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
            />
            <button
              type="button"
              onClick={generateImage}
              disabled={generatingImage || (!imagePrompt.trim() && !defaultPrompt)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 disabled:opacity-40 whitespace-nowrap"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              {generatingImage ? t("admin.menuForm.generating") : t("admin.menuForm.aiGenerate")}
            </button>
            <label className={`flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 cursor-pointer whitespace-nowrap ${galleryUploading ? "opacity-40 pointer-events-none" : ""}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
              {galleryUploading ? t("admin.menuForm.uploading") : t("admin.menuForm.fileUpload")}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={galleryUploading}
                className="hidden"
              />
            </label>
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={transparentBg}
                onChange={(e) => setTransparentBg(e.target.checked)}
              />
              {t("admin.menuForm.whiteBg")}
            </label>
            {referenceOptions.length > 0 && (
              <div>
                <p className="text-sm text-gray-600 mb-1.5">{t("admin.menuForm.referenceImages")}</p>
                <div className="flex gap-2 flex-wrap">
                  {referenceOptions.map((ref, idx) => (
                    <button
                      key={`${ref.label}-${idx}`}
                      type="button"
                      onClick={() => selectedRefUrl === ref.url ? setPreviewUrl(ref.url) : setSelectedRefUrl(ref.url)}
                      className={`flex flex-col items-center gap-1 rounded-lg border-2 p-1.5 transition-colors ${
                        selectedRefUrl === ref.url
                          ? "border-purple-500 bg-purple-50"
                          : "border-gray-200 hover:border-gray-400"
                      }`}
                    >
                      <img src={ref.url} alt={ref.label} className="w-12 h-12 object-cover rounded" />
                      <span className="text-[11px] text-gray-500 max-w-[60px] truncate">{ref.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Option Groups */}
      <div className="bg-white rounded-lg shadow p-4 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-medium text-gray-800">{t("admin.menuForm.optionGroups")}</h3>
          <button
            type="button"
            onClick={addOptionGroup}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {t("admin.menuForm.addGroup")}
          </button>
        </div>

        {optionGroups.length === 0 && (
          <p className="text-sm text-gray-400">
            {t("admin.menuForm.noOptionGroups")}
          </p>
        )}

        {optionGroups.map((group, gi) => (
          <div key={gi} className="border rounded-md p-3 space-y-3">
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={group.name}
                onChange={(e) => updateGroup(gi, "name", e.target.value)}
                placeholder={t("admin.menuForm.groupNamePlaceholder")}
                className="flex-1 border rounded px-3 py-1.5 text-sm"
              />
              <label className="flex items-center gap-1 text-sm text-gray-600 whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={group.required}
                  onChange={(e) => updateGroup(gi, "required", e.target.checked)}
                />
                {t("admin.menuForm.required")}
              </label>
              <button
                type="button"
                onClick={() => removeOptionGroup(gi)}
                className="text-red-500 hover:text-red-700 text-sm"
              >
                {t("common.delete")}
              </button>
            </div>

            <div className="pl-4 space-y-2">
              {group.options.map((opt, oi) => (
                <div key={oi} className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={opt.name}
                    onChange={(e) =>
                      updateOption(gi, oi, "name", e.target.value)
                    }
                    placeholder={t("admin.menuForm.optionName")}
                    className="flex-1 border rounded px-2 py-1 text-sm"
                  />
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={opt.priceModifier}
                      onChange={(e) =>
                        updateOption(
                          gi,
                          oi,
                          "priceModifier",
                          Number(e.target.value)
                        )
                      }
                      className="w-24 border rounded px-2 py-1 text-sm text-right"
                    />
                    <span className="text-xs text-gray-500">{fp(0).replace("0", "").trim()}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeOption(gi, oi)}
                    className="text-red-400 hover:text-red-600 text-xs"
                  >
                    X
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addOption(gi)}
                className="text-xs text-blue-500 hover:text-blue-700"
              >
                {t("admin.menuForm.addOption")}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Submit */}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
        >
          {saving ? t("common.saving") : isEdit ? t("common.save") : t("admin.menuForm.register")}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/menus")}
          className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm"
        >
          {t("common.cancel")}
        </button>
      </div>
      {/* Image Preview Overlay */}
      {previewUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setPreviewUrl(null)}
        >
          <img
            src={previewUrl}
            alt="Preview"
            className="max-w-full max-h-full rounded-lg object-contain"
          />
        </div>
      )}
    </form>
  );
}
