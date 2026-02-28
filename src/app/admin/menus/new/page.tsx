"use client";

import MenuForm from "@/components/admin/MenuForm";

export default function NewMenuPage() {
  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-4">새 메뉴 추가</h2>
      <MenuForm />
    </div>
  );
}
