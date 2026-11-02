export const DEFAULT_PRODUCT_THUMBNAIL = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=120&auto=format&fit=crop&q=80';

export function getProductThumbnail(variant?: {
  photoUrl?: string;
  imageUrl?: string;
  title?: string;
  category?: string;
} | null): string {
  if (!variant) return DEFAULT_PRODUCT_THUMBNAIL;

  if (variant.photoUrl && variant.photoUrl.trim()) {
    return variant.photoUrl;
  }

  if (variant.imageUrl && variant.imageUrl.trim()) {
    return variant.imageUrl;
  }

  const title = (variant.title || '').toLowerCase();
  const cat = (variant.category || '').toLowerCase();

  if (title.includes('snickers') || title.includes('snikers')) {
    return 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=120&auto=format&fit=crop&q=80';
  }
  if (title.includes('mars')) {
    return 'https://images.unsplash.com/photo-1582293041079-7814c2f12063?w=120&auto=format&fit=crop&q=80';
  }
  if (title.includes('twix') || title.includes('tviks')) {
    return 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=120&auto=format&fit=crop&q=80';
  }
  if (title.includes('bounty') || title.includes('baunti')) {
    return 'https://images.unsplash.com/photo-1548848221-0c2e497ed557?w=120&auto=format&fit=crop&q=80';
  }
  if (title.includes('cola') || title.includes('kola') || title.includes('coca')) {
    return 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=120&auto=format&fit=crop&q=80';
  }
  if (title.includes('nesquik') || title.includes('neskvik') || title.includes('kakao')) {
    return 'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?w=120&auto=format&fit=crop&q=80';
  }
  if (title.includes('non') || title.includes('bread') || title.includes('patir')) {
    return 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=120&auto=format&fit=crop&q=80';
  }
  if (title.includes('diagnostika') || title.includes('kompyuter') || title.includes('service') || title.includes('remont')) {
    return 'https://images.unsplash.com/photo-1588702547923-7093a6c3ba33?w=120&auto=format&fit=crop&q=80';
  }
  if (cat.includes('ichimlik') || title.includes('suv') || title.includes('sharbat') || title.includes('sok')) {
    return 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=120&auto=format&fit=crop&q=80';
  }
  if (cat.includes('shokolad') || cat.includes('shirinlik')) {
    return 'https://images.unsplash.com/photo-1511381939415-e44015466834?w=120&auto=format&fit=crop&q=80';
  }
  if (cat.includes('sut') || title.includes('qatiq') || title.includes('kefir') || title.includes('tvorog')) {
    return 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=120&auto=format&fit=crop&q=80';
  }
  if (cat.includes('meva') || cat.includes('sabzavot')) {
    return 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=120&auto=format&fit=crop&q=80';
  }

  return DEFAULT_PRODUCT_THUMBNAIL;
}
