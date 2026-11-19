import { isRetiredUzumImage, pickupServiceImage } from './uzum-images';

export const DEFAULT_PRODUCT_THUMBNAIL = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&auto=format&fit=crop&q=80';

export function isBrokenCatalogImage(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return true;
  const lower = url.trim().toLowerCase();
  return (
    lower.includes('catalog.korzinka.uz') ||
    lower.includes('images.uzum.uz/cg2011ng49devoa8f4gg') ||
    isRetiredUzumImage(lower)
  );
}

export function getProductThumbnail(variant?: {
  photoUrl?: string;
  imageUrl?: string;
  title?: string;
  titleRu?: string;
  category?: string;
} | null): string {
  if (!variant) return DEFAULT_PRODUCT_THUMBNAIL;

  if (variant.photoUrl?.trim() && !isBrokenCatalogImage(variant.photoUrl)) {
    return variant.photoUrl.trim();
  }

  if (variant.imageUrl?.trim() && !isBrokenCatalogImage(variant.imageUrl)) {
    return variant.imageUrl.trim();
  }

  if (isRetiredUzumImage(variant.photoUrl) || isRetiredUzumImage(variant.imageUrl)) {
    return pickupServiceImage;
  }

  const title = `${variant.title || ''} ${(variant as any).titleRu || ''}`.toLowerCase();
  const cat = (variant.category || '').toLowerCase();

  // Sabzavotlar & Mevalar
  if (title.includes('sabzi') || title.includes('морков')) {
    return 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=300&auto=format&fit=crop&q=80';
  }
  if (title.includes('olma') || title.includes('яблок') || title.includes('apple')) {
    return 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=300&auto=format&fit=crop&q=80';
  }
  if (title.includes('banan') || title.includes('банан') || title.includes('banana')) {
    return 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=300&auto=format&fit=crop&q=80';
  }
  if (title.includes('pomidor') || title.includes('томат') || title.includes('помидор')) {
    return 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=300&auto=format&fit=crop&q=80';
  }
  if (title.includes('bodring') || title.includes('огурц') || title.includes('cucumber')) {
    return 'https://images.unsplash.com/photo-1604977042946-1eecc30f269e?w=300&auto=format&fit=crop&q=80';
  }
  if (title.includes('kartoshka') || title.includes('картоф') || title.includes('potato')) {
    return 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=300&auto=format&fit=crop&q=80';
  }
  if (title.includes('piyoz') || title.includes('лук') || title.includes('onion')) {
    return 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=300&auto=format&fit=crop&q=80';
  }

  // Go'sht & Tuxum
  if (title.includes('farsh') || title.includes('фарш') || title.includes('go‘sht') || title.includes("go'sht") || title.includes('говяж') || title.includes('мясо') || title.includes('mol')) {
    return 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=300&auto=format&fit=crop&q=80';
  }
  if (title.includes('tovuq') || title.includes('куриц') || title.includes('chicken')) {
    return 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=300&auto=format&fit=crop&q=80';
  }
  if (title.includes('kolbasa') || title.includes('sosiska') || title.includes('колбас') || title.includes('сосиск')) {
    return 'https://images.unsplash.com/photo-1544025162-d76694265947?w=300&auto=format&fit=crop&q=80';
  }
  if (title.includes('tuxum') || title.includes('яйц') || title.includes('egg')) {
    return 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=300&auto=format&fit=crop&q=80';
  }

  // Sut & Sut mahsulotlari
  if (title.includes('sut') || title.includes('musaffo') || title.includes('молок') || title.includes('milk')) {
    return 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300&auto=format&fit=crop&q=80';
  }
  if (title.includes('sariyog') || title.includes('sariyog‘') || title.includes("sariyog'") || title.includes('сливочное масло') || title.includes('butter')) {
    return 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=300&auto=format&fit=crop&q=80';
  }
  if (title.includes('pishloq') || title.includes('сыр') || title.includes('cheese')) {
    return 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=300&auto=format&fit=crop&q=80';
  }
  if (title.includes('qatiq') || title.includes('kefir') || title.includes('tvorog') || title.includes('творог') || title.includes('сметан')) {
    return 'https://images.unsplash.com/photo-1571212515416-fef01fc43637?w=300&auto=format&fit=crop&q=80';
  }

  // Non & Un
  if (title.includes('non') || title.includes('patir') || title.includes('хлеб') || title.includes('lepyoshka') || title.includes('lavash')) {
    return 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300&auto=format&fit=crop&q=80';
  }
  if (title.includes('un') || title.includes('bug‘doy') || title.includes("bug'doy") || title.includes('мука') || title.includes('flour')) {
    return 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300&auto=format&fit=crop&q=80';
  }

  // Bakkaleya: Tuz, Shakar, Yog', Makaron, Guruch
  if (title.includes('tuz') || title.includes('соль') || title.includes('salt')) {
    return 'https://images.unsplash.com/photo-1518110925495-5fe2fda0442c?w=300&auto=format&fit=crop&q=80';
  }
  if (title.includes('shakar') || title.includes('сахар') || title.includes('sugar')) {
    return 'https://images.unsplash.com/photo-1581441363689-1f3c3c414635?w=300&auto=format&fit=crop&q=80';
  }
  if (title.includes('yog‘') || title.includes("yog'") || title.includes('maslo') || title.includes('масло растительное') || title.includes('o‘simlik')) {
    return 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=300&auto=format&fit=crop&q=80';
  }
  if (title.includes('makaron') || title.includes('макарон') || title.includes('pasta') || title.includes('spagetti')) {
    return 'https://images.unsplash.com/photo-1551462147-ff29053bfc14?w=300&auto=format&fit=crop&q=80';
  }
  if (title.includes('guruch') || title.includes('рис') || title.includes('rice')) {
    return 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&auto=format&fit=crop&q=80';
  }

  // Ichimliklar: Choy, Fuse Tea, Sharbat, Suv, Gazli ichimliklar
  if (title.includes('fuse tea') || title.includes('choy') || title.includes('чай') || title.includes('tea')) {
    return 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=300&auto=format&fit=crop&q=80';
  }
  if (title.includes('sharbat') || title.includes('sok') || title.includes('сок') || title.includes('juice') || title.includes('bliss')) {
    return 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=300&auto=format&fit=crop&q=80';
  }
  if (title.includes('cola') || title.includes('kola') || title.includes('pepsi') || title.includes('fanta') || title.includes('sprite')) {
    return 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=300&auto=format&fit=crop&q=80';
  }
  if (title.includes('suv') || title.includes('вода') || title.includes('water') || title.includes('nestle') || title.includes('hydrolife')) {
    return 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=300&auto=format&fit=crop&q=80';
  }
  if (title.includes('kofe') || title.includes('qahva') || title.includes('coffee') || title.includes('кофе') || title.includes('nescafe')) {
    return 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=300&auto=format&fit=crop&q=80';
  }

  // Shirinliklar & Shokolad
  if (title.includes('snickers') || title.includes('snikers')) {
    return 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=300&auto=format&fit=crop&q=80';
  }
  if (title.includes('mars')) {
    return 'https://images.unsplash.com/photo-1582293041079-7814c2f12063?w=300&auto=format&fit=crop&q=80';
  }
  if (title.includes('twix') || title.includes('tviks')) {
    return 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=300&auto=format&fit=crop&q=80';
  }
  if (title.includes('bounty') || title.includes('baunti')) {
    return 'https://images.unsplash.com/photo-1548848221-0c2e497ed557?w=300&auto=format&fit=crop&q=80';
  }
  if (title.includes('shokolad') || title.includes('шоколад') || title.includes('chocolate') || title.includes('konfet') || title.includes('конфет')) {
    return 'https://images.unsplash.com/photo-1511381939415-e44015466834?w=300&auto=format&fit=crop&q=80';
  }
  if (title.includes('pechenye') || title.includes('печенье') || title.includes('cookie') || title.includes('vafli') || title.includes('вафли')) {
    return 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=300&auto=format&fit=crop&q=80';
  }

  // Tibbiyot / Dorixona
  if (title.includes('dori') || title.includes('tabletka') || title.includes('kapsula') || title.includes('parasetamol') || title.includes('aspirin') || title.includes('vitamin') || cat.includes('dori') || cat.includes('dorixona')) {
    return 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&auto=format&fit=crop&q=80';
  }

  // Xizmatlar & Kompyuter / Game Club
  if (title.includes('diagnostika') || title.includes('kompyuter') || title.includes('service') || title.includes('remont') || title.includes('rtx') || title.includes('vip') || title.includes('gaming')) {
    return 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=300&auto=format&fit=crop&q=80';
  }

  // Umumiy toifa mosliklari
  if (cat.includes('ichimlik')) {
    return 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=300&auto=format&fit=crop&q=80';
  }
  if (cat.includes('shokolad') || cat.includes('shirinlik')) {
    return 'https://images.unsplash.com/photo-1511381939415-e44015466834?w=300&auto=format&fit=crop&q=80';
  }
  if (cat.includes('sut')) {
    return 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300&auto=format&fit=crop&q=80';
  }
  if (cat.includes('meva') || cat.includes('sabzavot')) {
    return 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=300&auto=format&fit=crop&q=80';
  }

  return DEFAULT_PRODUCT_THUMBNAIL;
}
