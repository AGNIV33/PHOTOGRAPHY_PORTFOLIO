import { Suspense } from "react";
import { AdminGate } from "@/components/admin/admin-gate";
import { CategoryManager } from "@/components/admin/category-manager";
import { countTags, sortedCategories } from "@/lib/categories";
import { aiAvailable } from "@/lib/classify";
import { adminListPhotos } from "@/lib/photos";

async function Categories() {
  const photos = await adminListPhotos();
  return <CategoryManager categories={sortedCategories(countTags(photos))} ai={aiAvailable} total={photos.length} />;
}

export default function CategoriesPage() {
  return (
    <Suspense fallback={<p className="label">Loading…</p>}>
      <AdminGate next="/admin/categories">
        <Categories />
      </AdminGate>
    </Suspense>
  );
}
