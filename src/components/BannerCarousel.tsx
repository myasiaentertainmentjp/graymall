// src/components/BannerCarousel.tsx
import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

type BannerSlide = {
  id: number;
  image: string;
  alt: string;
  link?: string;
  bgColor?: string;
  title?: string;
  subtitle?: string;
};

// サンプルスライド（後で実際の画像に置き換え）
// 画像サイズ: 1200×628px（アスペクト比 1.91:1）
const defaultSlides: BannerSlide[] = [
  {
    id: 1,
    image: '/banners/banner-1.svg',
    alt: 'グレーモールとは？',
    link: '/guidelines',
    bgColor: 'bg-gradient-to-r from-emerald-600 to-emerald-800',
    title: 'グレーモールとは？',
    subtitle: 'あなたの知識を、価値に変える',
  },
  {
    id: 2,
    image: '/banners/banner-2.svg',
    alt: '出品ガイド',
    link: '/guidelines',
    bgColor: 'bg-gradient-to-r from-blue-600 to-blue-800',
    title: 'かんたん3ステップで出品',
    subtitle: '記事を書いて、価格を決めて、公開するだけ',
  },
  {
    id: 3,
    image: '/banners/banner-3.svg',
    alt: 'アフィリエイト機能',
    link: '/affiliate-guide',
    bgColor: 'bg-gradient-to-r from-amber-500 to-orange-600',
    title: 'アフィリエイト機能',
    subtitle: '記事を紹介して報酬をGET！',
  },
  {
    id: 4,
    image: '/banners/banner-4.svg',
    alt: '人気記事ランキング',
    link: '/articles?sort=popular',
    bgColor: 'bg-gradient-to-r from-red-500 to-pink-600',
    title: '人気記事ランキング',
    subtitle: 'いま売れている記事をチェック！',
  },
];

type Props = {
  slides?: BannerSlide[];
  autoPlayInterval?: number;
};

export default function BannerCarousel({ slides = defaultSlides, autoPlayInterval = 6000 }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(goToNext, autoPlayInterval);
    return () => clearInterval(timer);
  }, [isPaused, autoPlayInterval, goToNext]);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > minSwipeDistance) goToNext();
    if (distance < -minSwipeDistance) goToPrev();
  };

  const getSlideIndex = (offset: number) => {
    return (currentIndex + offset + slides.length) % slides.length;
  };

  const renderSlide = (slide: BannerSlide, isCenter: boolean) => {
    const content = (
      <div className={`relative w-full aspect-[2.5/1] overflow-hidden rounded-lg transition-all duration-300 ${isCenter ? 'opacity-100' : 'opacity-60'}`}>
        <img
          src={slide.image}
          alt={slide.alt}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
            const placeholder = (e.target as HTMLImageElement).nextElementSibling as HTMLElement;
            if (placeholder) placeholder.style.display = 'flex';
          }}
        />
        <div
          className={`absolute inset-0 ${slide.bgColor || 'bg-gray-700'} hidden flex-col items-center justify-center text-white p-4`}
        >
          <h3 className="text-lg sm:text-xl lg:text-2xl font-bold mb-1 text-center">{slide.title}</h3>
          <p className="text-xs sm:text-sm text-white/80 text-center">{slide.subtitle}</p>
        </div>
      </div>
    );

    if (slide.link && isCenter) {
      return (
        <Link to={slide.link} className="block">
          {content}
        </Link>
      );
    }
    return content;
  };

  return (
    <div
      className="relative w-full mb-6"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* モバイル: 1枚表示 */}
      <div
        className="lg:hidden relative overflow-hidden"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {slides.map((slide) => (
            <div key={slide.id} className="w-full flex-shrink-0 px-1">
              {renderSlide(slide, true)}
            </div>
          ))}
        </div>
      </div>

      {/* PC: 中央1枚 + 左右にチラ見せ */}
      <div className="hidden lg:block relative overflow-hidden">
        <div className="flex items-center justify-center gap-3">
          {/* 左のスライド（チラ見せ） */}
          <div
            className="w-[12%] flex-shrink-0 cursor-pointer"
            onClick={goToPrev}
          >
            {renderSlide(slides[getSlideIndex(-1)], false)}
          </div>

          {/* 中央のスライド */}
          <div className="w-[72%] flex-shrink-0 relative">
            {renderSlide(slides[currentIndex], true)}
            {/* 矢印を中央スライドの端に配置 */}
            <button
              onClick={goToPrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center text-white transition-colors z-10"
              aria-label="前のスライド"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center text-white transition-colors z-10"
              aria-label="次のスライド"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          {/* 右のスライド（チラ見せ） */}
          <div
            className="w-[12%] flex-shrink-0 cursor-pointer"
            onClick={goToNext}
          >
            {renderSlide(slides[getSlideIndex(1)], false)}
          </div>
        </div>
      </div>

      {/* Navigation Arrows (モバイルのみ) */}
      <button
        onClick={goToPrev}
        className="lg:hidden absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center text-white transition-colors z-10"
        aria-label="前のスライド"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button
        onClick={goToNext}
        className="lg:hidden absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center text-white transition-colors z-10"
        aria-label="次のスライド"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Dot Indicators */}
      <div className="flex justify-center gap-2 mt-3">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-2 h-2 rounded-full transition-colors ${
              index === currentIndex ? 'bg-emerald-500' : 'bg-gray-600 hover:bg-gray-500'
            }`}
            aria-label={`スライド ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
