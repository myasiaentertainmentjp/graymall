import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  name: string;
  url?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="パンくずリスト" className="text-sm text-gray-500 mb-4">
      <ol className="flex items-center flex-wrap gap-1">
        <li className="flex items-center">
          <Link
            to="/"
            className="flex items-center gap-1 hover:text-gray-700 transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            <span className="sr-only">ホーム</span>
          </Link>
        </li>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={index} className="flex items-center">
              <ChevronRight className="w-3.5 h-3.5 mx-1 text-gray-400" />
              {isLast || !item.url ? (
                <span className="text-gray-700 line-clamp-1 max-w-[200px]">
                  {item.name}
                </span>
              ) : (
                <Link
                  to={item.url}
                  className="hover:text-gray-700 transition-colors line-clamp-1 max-w-[200px]"
                >
                  {item.name}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
