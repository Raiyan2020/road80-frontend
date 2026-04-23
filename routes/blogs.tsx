import React from 'react';
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import Header from '../components/Header';
import { useBlogs, useBlogDetail } from '../features/blogs/hooks/useBlogs';
import { SpinnerIcon, ChevronRightIcon } from '../components/Icons';

type BlogsSearch = {
  id?: number | string;
};

export const Route = createFileRoute('/blogs')({
  component: BlogsPage,
  validateSearch: (search: Record<string, unknown>): BlogsSearch => {
    return {
      id: search.id as string | number | undefined,
    };
  },
});

function BlogsPage() {
  const navigate = useNavigate();
  const { id } = Route.useSearch();
  const { data: listData, isLoading: isListLoading } = useBlogs();
  const { data: detailData, isLoading: isDetailLoading } = useBlogDetail(id);

  const blogs = listData?.data?.data || listData?.data || [];
  const blog = detailData?.data;

  // Single Blog Detail View
  if (id) {
    return (
      <div className="min-h-screen bg-bg dark:bg-slate-950 flex flex-col pb-24 animate-fade-in" dir="rtl">
        <Header 
          title={blog?.title || 'جاري التحميل...'} 
          showBack 
          onBack={() => navigate({ to: '/blogs', search: {} })} 
        />
        
        <div className="flex-1 p-5 overflow-y-auto" style={{ paddingTop: 'calc(var(--header-h) + env(safe-area-inset-top) + 20px)' }}>
          {isDetailLoading ? (
            <div className="flex justify-center items-center h-64">
              <SpinnerIcon className="w-8 h-8 animate-spin text-navy dark:text-blue" />
            </div>
          ) : !blog ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 text-center border border-pale dark:border-slate-800">
               <p className="text-gray-400 font-bold italic">المقال غير موجود</p>
            </div>
          ) : (
             <article className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl shadow-navy/5 border border-pale dark:border-slate-800 overflow-hidden mb-6">
                {blog.image && (
                  <div className="relative h-64 sm:h-80 w-full">
                    <img src={blog.image} alt={blog.title} className="w-full h-full object-cover" />
                    <div className="absolute top-4 right-4 px-3 py-1 bg-navy/80 backdrop-blur-md text-white rounded-full text-xs font-bold border border-white/20">
                       {blog.category_name}
                    </div>
                  </div>
                )}
                
                <div className="p-6 flex flex-col gap-6 text-right">
                   <div className="flex flex-col gap-3">
                     <h1 className="text-[28px] font-black text-navy dark:text-slate-100 leading-tight">{blog.title}</h1>
                     <div className="flex items-center gap-4 text-xs font-bold text-gray-400">
                        <span className="flex items-center gap-1">
                           بواسطة: <span className="text-navy dark:text-blue">{blog.publisher_name}</span>
                        </span>
                        <span className="w-1 h-1 bg-gray-300 rounded-full" />
                        <span>{blog.created_at}</span>
                     </div>
                     <div className="h-1.5 w-16 bg-blue rounded-full mt-2" />
                   </div>

                   <div 
                     className="text-[15px] text-gray-600 dark:text-slate-300 leading-relaxed font-medium whitespace-pre-line prose dark:prose-invert max-w-none" 
                     dangerouslySetInnerHTML={{ __html: blog.description || blog.content || '' }}
                   />
                </div>
             </article>

          )}
        </div>
      </div>
    );
  }

  // Blog List View
  return (
    <div className="min-h-screen bg-bg dark:bg-slate-950 flex flex-col pb-24" dir="rtl">
      <Header title="المدونة" showBack onBack={() => navigate({ to: '/home' })} />
      
      <div className="flex-1 p-5 overflow-y-auto flex flex-col gap-5" style={{ paddingTop: 'calc(var(--header-h) + env(safe-area-inset-top) + 20px)' }}>
        {isListLoading ? (
          <div className="flex justify-center items-center h-48 mt-10">
            <SpinnerIcon className="w-8 h-8 animate-spin text-navy dark:text-blue" />
          </div>
        ) : blogs.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 shadow-sm border border-pale dark:border-slate-800 text-center text-gray-400 animate-fade-in">
             <p className="font-bold">لا توجد مقالات حالياً</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5">
            {blogs.map((blog: any) => (
              <div 
                 key={blog.id} 
                 onClick={() => navigate({ to: '/blogs', search: { id: blog.id } })}
                 className="bg-white dark:bg-slate-900 rounded-3xl shadow-md shadow-navy/5 border border-pale dark:border-slate-800 overflow-hidden flex flex-col group active:scale-98 transition-all duration-300 cursor-pointer"
              >
                 {blog.image && (
                    <img src={blog.image} alt={blog.title} className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500" />
                 )}
                 <div className="p-5 flex flex-col gap-3 text-right">
                    <h3 className="text-xl font-black text-navy dark:text-slate-100 line-clamp-2 leading-tight">{blog.title}</h3>
                    <p className="text-[14px] text-gray-500 dark:text-slate-400 line-clamp-3 leading-relaxed">{blog.short_description || blog.content?.replace(/<[^>]+>/g, '')}</p>
                    <div className="flex items-center gap-1.5 text-blue font-black text-sm mt-2 transition-transform group-hover:translate-x-[-4px]">
                       اقرأ المزيد
                       <ChevronRightIcon className="w-4 h-4 rotate-180" />
                    </div>
                 </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
