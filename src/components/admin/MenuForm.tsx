"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<number | "">("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imagePrompt, setImagePrompt] = useState("");
  const [transparentBg, setTransparentBg] = useState(true);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [useReferenceImage, setUseReferenceImage] = useState(true);
  const [optionGroups, setOptionGroups] = useState<OptionGroupInput[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Gallery state
  const [galleryImages, setGalleryImages] = useState<MenuImageItem[]>([]);
  const [galleryUploading, setGalleryUploading] = useState(false);

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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (isEdit && menuId) {
      // Upload via gallery API
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
          alert(data.error?.message || "업로드 실패");
        }
      } catch {
        alert("업로드 중 오류가 발생했습니다.");
      }
      setGalleryUploading(false);
      e.target.value = "";
    } else {
      // New menu: just set as file for submit
      setImageUrl(URL.createObjectURL(file));
      // Store file for later submit - we use a hidden approach
      const formData = new FormData();
      formData.append("image", file);
      (window as unknown as Record<string, FormData>).__menuImageFile = formData;
    }
  };

  const defaultPrompt = [name, description].filter(Boolean).join(" - ");

  const selectedCategory = categories.find((c) => c.id === categoryId);
  const categoryRefImage = selectedCategory?.referenceImageUrl || null;

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
      if (useReferenceImage && categoryRefImage) {
        requestBody.referenceImageUrl = categoryRefImage;
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
        alert(data.error?.message || "이미지 생성 실패");
      }
    } catch {
      alert("이미지 생성 중 오류가 발생했습니다.");
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
      alert("카테고리, 이름, 가격은 필수입니다.");
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
      alert("저장 중 오류가 발생했습니다.");
    }

    setSaving(false);
  };

  if (loading) {
    return <p className="text-gray-500">로딩 중...</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      {/* Basic Fields */}
      <div className="bg-white rounded-lg shadow p-4 space-y-4">
        <h3 className="font-medium text-gray-800">기본 정보</h3>

        <div>
          <label className="block text-sm text-gray-600 mb-1">카테고리</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(Number(e.target.value))}
            className="w-full border rounded-md px-3 py-2 text-sm"
            required
          >
            <option value="">선택하세요</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">메뉴명</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border rounded-md px-3 py-2 text-sm"
            required
          />
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">설명</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border rounded-md px-3 py-2 text-sm"
            rows={2}
          />
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">가격 (원)</label>
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
      <div className="bg-white rounded-lg shadow p-4 space-y-4">
        <h3 className="font-medium text-gray-800">이미지</h3>

        {/* Gallery Grid */}
        {isEdit && galleryImages.length > 0 && (
          <div className="grid grid-cols-4 gap-3">
            {galleryImages.map((img) => (
              <div
                key={img.id}
                className={`relative group cursor-pointer rounded-lg border-2 overflow-hidden ${
                  imageUrl === img.imageUrl
                    ? "border-blue-500 ring-2 ring-blue-200"
                    : "border-gray-200 hover:border-gray-400"
                }`}
                onClick={() => selectGalleryImage(img)}
              >
                <img
                  src={img.imageUrl}
                  alt="메뉴 이미지"
                  className="w-full aspect-square object-cover"
                  title={
                    img.prompt
                      ? `${img.prompt}${img.transparentBg ? ' | 흰배경' : ''}${img.usedReferenceImage ? ' | 레퍼런스' : ''}`
                      : undefined
                  }
                />
                {imageUrl === img.imageUrl && (
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
        {(!isEdit || galleryImages.length === 0) && imageUrl && (
          <div className="mb-2">
            <img
              src={imageUrl}
              alt="메뉴 이미지"
              className="w-32 h-32 object-cover rounded-md border"
            />
          </div>
        )}

        <div>
          <label className="block text-sm text-gray-600 mb-1">
            파일 업로드
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            disabled={galleryUploading}
            className="text-sm"
          />
          {galleryUploading && (
            <span className="text-xs text-gray-500 ml-2">업로드 중...</span>
          )}
        </div>

        <div className="border-t pt-4">
          <label className="block text-sm text-gray-600 mb-1">
            AI 이미지 생성
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={imagePrompt}
              onChange={(e) => setImagePrompt(e.target.value)}
              placeholder={defaultPrompt || "메뉴명을 먼저 입력하세요"}
              className="flex-1 border rounded-md px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={generateImage}
              disabled={generatingImage || (!imagePrompt.trim() && !defaultPrompt)}
              className="px-4 py-2 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700 disabled:opacity-50"
            >
              {generatingImage ? "생성 중..." : "생성"}
            </button>
          </div>
          <label className="mt-2 flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={transparentBg}
              onChange={(e) => setTransparentBg(e.target.checked)}
            />
            흰 배경으로 생성
          </label>
          {categoryRefImage && (
            <label className="mt-2 flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={useReferenceImage}
                onChange={(e) => setUseReferenceImage(e.target.checked)}
              />
              레퍼런스 이미지 스타일 적용
              <img src={categoryRefImage} alt="레퍼런스" className="w-8 h-8 object-cover rounded border ml-1" />
            </label>
          )}
        </div>
      </div>

      {/* Option Groups */}
      <div className="bg-white rounded-lg shadow p-4 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-medium text-gray-800">옵션 그룹</h3>
          <button
            type="button"
            onClick={addOptionGroup}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            + 그룹 추가
          </button>
        </div>

        {optionGroups.length === 0 && (
          <p className="text-sm text-gray-400">
            옵션 그룹이 없습니다. 추가 버튼을 눌러주세요.
          </p>
        )}

        {optionGroups.map((group, gi) => (
          <div key={gi} className="border rounded-md p-3 space-y-3">
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={group.name}
                onChange={(e) => updateGroup(gi, "name", e.target.value)}
                placeholder="그룹명 (예: 온도, 사이즈)"
                className="flex-1 border rounded px-3 py-1.5 text-sm"
              />
              <label className="flex items-center gap-1 text-sm text-gray-600 whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={group.required}
                  onChange={(e) => updateGroup(gi, "required", e.target.checked)}
                />
                필수
              </label>
              <button
                type="button"
                onClick={() => removeOptionGroup(gi)}
                className="text-red-500 hover:text-red-700 text-sm"
              >
                삭제
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
                    placeholder="옵션명"
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
                    <span className="text-xs text-gray-500">원</span>
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
                + 옵션 추가
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
          {saving ? "저장 중..." : isEdit ? "저장" : "등록"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/menus")}
          className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm"
        >
          취소
        </button>
      </div>
    </form>
  );
}
