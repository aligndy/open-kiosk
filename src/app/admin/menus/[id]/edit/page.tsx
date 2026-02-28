"use client";

import { use } from "react";
import MenuForm from "@/components/admin/MenuForm";

export default function EditMenuPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-4">메뉴 수정</h2>
      <MenuForm menuId={Number(id)} />
    </div>
  );
}
