export interface CategoryWithMenus {
  id: number;
  name: string;
  nameTranslations: string;
  sortOrder: number;
  isActive: boolean;
  menus: MenuWithOptions[];
}

export interface MenuWithOptions {
  id: number;
  categoryId: number;
  name: string;
  nameTranslations: string;
  description: string;
  descriptionTranslations: string;
  price: number;
  imageUrl: string | null;
  isActive: boolean;
  sortOrder: number;
  optionGroups: OptionGroupWithOptions[];
}

export interface OptionGroupWithOptions {
  id: number;
  menuId: number;
  name: string;
  nameTranslations: string;
  required: boolean;
  sortOrder: number;
  options: OptionItem[];
}

export interface OptionItem {
  id: number;
  optionGroupId: number;
  name: string;
  nameTranslations: string;
  priceModifier: number;
  sortOrder: number;
}

export interface CartItem {
  menuId: number;
  menuName: string;
  menuNameTranslations: string;
  imageUrl: string | null;
  quantity: number;
  unitPrice: number;
  selectedOptions: SelectedOption[];
  subtotal: number;
}

export interface SelectedOption {
  groupId: number;
  optionId: number;
  groupName: string;
  groupNameTranslations: string;
  optionName: string;
  optionNameTranslations: string;
  priceModifier: number;
}

export interface OrderRequest {
  items: {
    menuId: number;
    quantity: number;
    selectedOptions: { groupId: number; optionId: number }[];
  }[];
  language: string;
}

export interface TranslationMap {
  [lang: string]: string;
}

export function getTranslation(
  translationsJson: string,
  lang: string,
  fallback: string
): string {
  try {
    const map: TranslationMap = JSON.parse(translationsJson);
    return map[lang] || fallback;
  } catch {
    return fallback;
  }
}
