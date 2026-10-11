import { Suspense } from "react";
import CategoryProductsPage from "@/app/home/sections/category_products_page";

async function CategoryRoute({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ title?: string | string[] }>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const title = Array.isArray(query.title) ? query.title[0] : query.title;

  return <CategoryProductsPage categoryId={id} categoryTitle={title} />;
}

export default function Page(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ title?: string | string[] }>;
}) {
  return (
    <Suspense fallback={<div className="p-8 text-center">جارٍ تحميل القسم...</div>}>
      <CategoryRoute params={props.params} searchParams={props.searchParams} />
    </Suspense>
  );
}
