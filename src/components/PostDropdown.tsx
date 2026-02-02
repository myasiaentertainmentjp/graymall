import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PenSquare, FileText, ChevronDown } from 'lucide-react';

export default function PostDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="投稿"
      >
        <PenSquare className="w-4 h-4" />
        <span>投稿</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50">
          <div className="py-1">
            <Link
              to="/editor/new"
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
              onClick={() => setIsOpen(false)}
            >
              <FileText className="w-4 h-4 text-gray-500" />
              <span>新規記事を作成</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
