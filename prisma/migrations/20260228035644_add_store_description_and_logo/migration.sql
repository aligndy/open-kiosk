-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_StoreSettings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "storeName" TEXT NOT NULL DEFAULT '카페',
    "storeDescription" TEXT NOT NULL DEFAULT '',
    "logoUrl" TEXT,
    "defaultLanguage" TEXT NOT NULL DEFAULT 'ko',
    "supportedLanguages" TEXT NOT NULL DEFAULT '["ko"]'
);
INSERT INTO "new_StoreSettings" ("defaultLanguage", "id", "storeName", "supportedLanguages") SELECT "defaultLanguage", "id", "storeName", "supportedLanguages" FROM "StoreSettings";
DROP TABLE "StoreSettings";
ALTER TABLE "new_StoreSettings" RENAME TO "StoreSettings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
