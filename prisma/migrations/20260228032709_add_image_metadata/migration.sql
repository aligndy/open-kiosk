-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CategoryImage" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "categoryId" INTEGER NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "prompt" TEXT,
    "isAiGenerated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CategoryImage_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_CategoryImage" ("categoryId", "createdAt", "id", "imageUrl") SELECT "categoryId", "createdAt", "id", "imageUrl" FROM "CategoryImage";
DROP TABLE "CategoryImage";
ALTER TABLE "new_CategoryImage" RENAME TO "CategoryImage";
CREATE TABLE "new_MenuImage" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "menuId" INTEGER NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "prompt" TEXT,
    "transparentBg" BOOLEAN,
    "usedReferenceImage" BOOLEAN,
    "isAiGenerated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MenuImage_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES "Menu" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_MenuImage" ("createdAt", "id", "imageUrl", "menuId") SELECT "createdAt", "id", "imageUrl", "menuId" FROM "MenuImage";
DROP TABLE "MenuImage";
ALTER TABLE "new_MenuImage" RENAME TO "MenuImage";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
