/* eslint-disable @next/next/no-img-element */
export default function CollectionsSection() {
  const collections = [
    {
      title: 'بكج العناية بالبشرة',
      subtitle: 'خصم 30% لفترة محدودة',
      image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400&auto=format&fit=crop&q=80',
    },
    {
      title: 'مجموعة الشعر المثالي',
      subtitle: 'شامبو + سيروم + ماسك',
      image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&auto=format&fit=crop&q=80',
    },
    {
      title: 'مجموعات الهدايا المميزة',
      subtitle: 'جاهزة للإهداء لمن تحب',
      image: 'https://images.unsplash.com/photo-1519735777090-ec97162dc266?w=400&auto=format&fit=crop&q=80',
    },
  ];

  return (
    <section className="mb-6">
      {/* عنوان القسم */}
      <div className="flex justify-between items-center px-4 mb-3">
        <h2 className="text-lg font-bold text-deepRose">المجموعات</h2>
        <button className="text-xs text-textMuted hover:text-primaryRose transition">
          عرض الكل
        </button>
      </div>

      {/* قائمة البطاقات الأفقية */}
      <div className="flex overflow-x-auto gap-4 px-4 pb-2 scrollbar-none">
        {collections.map((item, index) => (
          <div
            key={index}
            className="min-w-[220px] h-[150px] relative rounded-2xl overflow-hidden shadow-md flex-shrink-0 group transform -skew-x-3 hover:skew-x-0 transition duration-300"
          >
            {/* الخلفية والصورة */}
            <img
              src={item.image}
              alt={item.title}
              className="absolute inset-w-full inset-h-full w-full h-full object-cover group-hover:scale-105 transition duration-500"
            />

            {/* تدرج الألوان الداكن فوق الصورة */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>

            {/* النصوص (بإلغاء الميلان لتبقى سهلة القراءة) */}
            <div className="absolute inset-0 p-3 flex flex-col justify-end transform skew-x-3">
              <h3 className="text-white text-sm font-bold mb-1 line-clamp-1">
                {item.title}
              </h3>
              <p className="text-pink-100 text-[11px] line-clamp-1">
                {item.subtitle}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}