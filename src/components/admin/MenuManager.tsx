"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useT, useFormatPrice } from "@/lib/i18n";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Menu {
  id: number;
  name: string;
  price: number;
  imageUrl: string | null;
  isActive: boolean;
  sortOrder: number;
  category: { id: number; name: string };
}

interface CategoryGroup {
  id: number;
  name: string;
  menus: Menu[];
}

function SortableRow({
  menu,
  onToggleActive,
  onDuplicate,
  onDelete,
  onEdit,
  t,
  fp,
}: {
  menu: Menu;
  onToggleActive: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onEdit: () => void;
  t: (key: string) => string;
  fp: (amount: number) => string;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: menu.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className="border-b last:border-b-0 hover:bg-gray-50/50"
    >
      <td className="px-2 py-2 w-8">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 touch-none"
        >
          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
          </svg>
        </button>
      </td>
      <td className="px-4 py-2">
        {menu.imageUrl ? (
          <img src={menu.imageUrl} alt={menu.name} className="w-10 h-10 object-cover rounded" />
        ) : (
          <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs">{t("common.none")}</div>
        )}
      </td>
      <td className="px-4 py-2 text-gray-800 font-medium">{menu.name}</td>
      <td className="px-4 py-2 text-right text-gray-800">{fp(menu.price)}</td>
      <td className="px-4 py-2 text-center">
        <button
          onClick={onToggleActive}
          className={`text-xs px-2 py-1 rounded ${
            menu.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
          }`}
        >
          {menu.isActive ? t("admin.menu.active") : t("admin.menu.inactive")}
        </button>
      </td>
      <td className="px-4 py-2 text-right">
        <button onClick={onDuplicate} className="text-gray-500 hover:text-gray-700 text-sm mr-2">{t("admin.menu.duplicate")}</button>
        <button onClick={onEdit} className="text-blue-600 hover:text-blue-800 text-sm mr-2">{t("common.edit")}</button>
        <button onClick={onDelete} className="text-red-600 hover:text-red-800 text-sm">{t("common.delete")}</button>
      </td>
    </tr>
  );
}

export default function MenuManager() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<number>>(new Set());
  const router = useRouter();
  const t = useT();
  const fp = useFormatPrice();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

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

  const categoryGroups = useMemo(() => {
    const groupMap = new Map<number, CategoryGroup>();
    for (const menu of menus) {
      const catId = menu.category.id;
      if (!groupMap.has(catId)) {
        groupMap.set(catId, { id: catId, name: menu.category.name, menus: [] });
      }
      groupMap.get(catId)!.menus.push(menu);
    }
    for (const group of groupMap.values()) {
      group.menus.sort((a, b) => a.sortOrder - b.sortOrder);
    }
    return Array.from(groupMap.values());
  }, [menus]);

  const toggleCollapse = (categoryId: number) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

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

  const handleDragEnd = async (event: DragEndEvent, group: CategoryGroup) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = group.menus.findIndex((m) => m.id === active.id);
    const newIndex = group.menus.findIndex((m) => m.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = [...group.menus];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);

    // Optimistic update
    const updatedMenus = menus.map((m) => {
      const idx = reordered.findIndex((r) => r.id === m.id);
      if (idx !== -1) return { ...m, sortOrder: idx };
      return m;
    });
    setMenus(updatedMenus);

    // Save to server
    const items = reordered.map((m, i) => ({ id: m.id, sortOrder: i }));
    await fetch("/api/menus/reorder", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });
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
        <div className="space-y-4">
          {categoryGroups.map((group) => {
            const isCollapsed = collapsedCategories.has(group.id);
            const activeCount = group.menus.filter((m) => m.isActive).length;
            return (
              <div key={group.id} className="bg-white rounded-lg shadow">
                <button
                  onClick={() => toggleCollapse(group.id)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 rounded-t-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-gray-400 text-sm">{isCollapsed ? "▶" : "▼"}</span>
                    <span className="font-semibold text-gray-800">{group.name}</span>
                    <span className="text-xs text-gray-500">
                      {group.menus.length}{t("admin.menu.countUnit")} ({t("admin.menu.active")} {activeCount})
                    </span>
                  </div>
                </button>
                {!isCollapsed && (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={(event) => handleDragEnd(event, group)}
                  >
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-gray-50/50">
                          <th className="w-8"></th>
                          <th className="text-left px-4 py-2 text-gray-500 font-medium text-xs">{t("admin.menu.image")}</th>
                          <th className="text-left px-4 py-2 text-gray-500 font-medium text-xs">{t("admin.menu.name")}</th>
                          <th className="text-right px-4 py-2 text-gray-500 font-medium text-xs">{t("admin.menu.price")}</th>
                          <th className="text-center px-4 py-2 text-gray-500 font-medium text-xs">{t("admin.menu.status")}</th>
                          <th className="text-right px-4 py-2 text-gray-500 font-medium text-xs w-48">{t("admin.menu.manage")}</th>
                        </tr>
                      </thead>
                      <SortableContext
                        items={group.menus.map((m) => m.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <tbody>
                          {group.menus.map((menu) => (
                            <SortableRow
                              key={menu.id}
                              menu={menu}
                              onToggleActive={() => toggleActive(menu)}
                              onDuplicate={() => duplicateMenu(menu.id)}
                              onDelete={() => deleteMenu(menu.id)}
                              onEdit={() => router.push(`/admin/menus/${menu.id}/edit`)}
                              t={t}
                              fp={fp}
                            />
                          ))}
                        </tbody>
                      </SortableContext>
                    </table>
                  </DndContext>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
