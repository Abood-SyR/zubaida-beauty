import { Suspense } from "react";
import CategoryProductsPage from "@/app/home/sections/category_products_page";

type CategorySearchParams = {
  category_id?: string | string[];
  title?: string | string[];
};

async function CategoryRoute({
  searchParams,
}: {
  searchParams: Promise<CategorySearchParams>;
}) {
  const query = await searchParams;
  const categoryId = Array.isArray(query.category_id)
    ? query.category_id[0]
    : query.category_id;
  const title = Array.isArray(query.title) ? query.title[0] : query.title;

  return (
    <CategoryProductsPage
      categoryId={categoryId}
      categoryTitle={title}
    />
  );
}

export default function Page(props: {
  searchParams: Promise<CategorySearchParams>;
}) {
  return (
    <Suspense fallback={<div className="p-8 text-center">جارٍ تحميل القسم...</div>}>
      <CategoryRoute searchParams={props.searchParams} />
    </Suspense>
  );
}
