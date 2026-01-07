// src/components/CategorySidebar.tsx
import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ChevronDown } from 'lucide-react';
import type { Database } from '../lib/database.types';

type Category = Database['public']['Tables']['categories']['Row'];

type Props = {
  className?: string;
};

export default function CategorySidebar({ className = '' }: Props) {
  const [searchParams] = useSearchParams();
  const selectedCategory = searchParams.get('category');
  const [parentCategories, setParentCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<Record<string, Category[]>>({});
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const { data: cats } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order');

      if (cats) {
        const parents = cats.filter(c => !c.parent_id);
        const subs: Record<string, Category[]> = {};
        parents.forEach(p => {
          subs[p.id] = cats.filter(c => c.parent_id === p.id);
        });
        setParentCategories(parents);
        setSubCategories(subs);
      }
    } catch (err) {
      console.error('Error loading categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (categoryId: string) => {
    setCollapsedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  if (loading) {
    return (
      <aside className={className}>
        <div className="sticky top-20">
          <div className="animate-pulse space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-8 bg-gray-100 rounded" />
            ))}
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className={className}>
      <div className="sticky top-20">
        <nav>
          {parentCategories.map(parent => {
            const isCollapsed = collapsedCategories.has(parent.id);
            const children = subCategories[parent.id] || [];
            const hasChildren = children.length > 0;

            return (
              <div key={parent.id} className="border-b border-gray-100 last:border-b-0">
                {/* 親カテゴリ */}
                <div className="flex items-center">
                  <Link
                    to={`/articles?category=${parent.slug}`}
                    className={`flex-1 py-3 text-base font-medium transition ${
                      selectedCategory === parent.slug
                        ? 'text-gray-900'
                        : 'text-gray-700 hover:text-gray-900'
                    }`}
                  >
                    {parent.name}
                  </Link>
                  {hasChildren && (
                    <button
                      onClick={() => toggleCategory(parent.id)}
                      className="p-2 text-gray-400 hover:text-gray-600 transition"
                    >
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${isCollapsed ? '-rotate-90' : ''}`}
                      />
                    </button>
                  )}
                </div>

                {/* 子カテゴリ */}
                {hasChildren && !isCollapsed && (
                  <div className="pb-3 space-y-1">
                    {children.map(sub => (
                      <Link
                        key={sub.id}
                        to={`/articles?category=${sub.slug}`}
                        className={`block py-1.5 text-sm transition ${
                          selectedCategory === sub.slug
                            ? 'text-gray-900 bg-gray-100 -mx-2 px-2 rounded'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        {sub.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
