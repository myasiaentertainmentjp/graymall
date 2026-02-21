// src/components/CategorySidebar.tsx
import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type Category = Database['public']['Tables']['categories']['Row'];

type Props = {
  className?: string;
};

export default function CategorySidebar({ className = '' }: Props) {
  const [searchParams] = useSearchParams();
  const selectedCategory = searchParams.get('category');
  const [parentCategories, setParentCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const { data: cats } = await supabase
        .from('categories')
        .select('*')
        .is('parent_id', null)
        .order('sort_order');

      if (cats) {
        setParentCategories(cats);
      }
    } catch (err) {
      console.error('Error loading categories:', err);
    } finally {
      setLoading(false);
    }
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
          {parentCategories.map(parent => (
            <div key={parent.id}>
              <Link
                to={`/articles?category=${parent.slug}`}
                className={`block py-3 text-lg font-medium transition ${
                  selectedCategory === parent.slug
                    ? 'text-gray-900'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                {parent.name}
              </Link>
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );
}
