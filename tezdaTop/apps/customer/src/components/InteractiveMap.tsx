import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { StoreSearchResult, RouteResponse, Store } from '@yaqintop/contracts';
import { getProductThumbnail, DEFAULT_PRODUCT_THUMBNAIL } from '../utils/product-thumbnails';
import { Navigation, MapPin, Maximize2, Store as StoreIcon, Crosshair, CircleDot, XCircle, X, ExternalLink } from 'lucide-react';

export interface NearbyStoreItem {
  store: Store;
  organization?: any;
  distanceM: number;
  isOpenNow: boolean;
  offersCount?: number;
}

export const getStoreLatLng = (store?: any): [number, number] | null => {
  if (!store) return null;
  const lat = store.location?.lat ?? store.latitude ?? store.lat;
  const lng = store.location?.lng ?? store.longitude ?? store.lng;
  if (typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng)) {
    return [lat, lng];
  }
  return null;
};

interface InteractiveMapProps {
  userLocation: { lat: number; lng: number };
  radiusM: number;
  results: StoreSearchResult[];
  nearbyStores?: NearbyStoreItem[];
  selectedResult: StoreSearchResult | null;
  selectedNearbyStore?: NearbyStoreItem | null;
  onSelectStore: (store: StoreSearchResult) => void;
  onSelectNearbyStore?: (store: NearbyStoreItem) => void;
  onOpenDetail: (store: StoreSearchResult) => void;
  onOpenNearbyDetail?: (store: NearbyStoreItem) => void;
  onNavigate: (store: StoreSearchResult | { store: any; distanceM?: number }) => void;
  onCancelRoute?: () => void;
  routeData: RouteResponse | null;
  routeMode?: 'walking' | 'driving';
  onChangeRouteMode?: (mode: 'walking' | 'driving') => void;
  view: 'search' | 'detail' | 'route' | 'saved' | 'profile' | 'products' | 'product-detail';
  onOpenProduct?: (variant: any) => void;
  onOpenProductModal?: (item: StoreSearchResult) => void;
  isDarkMode?: boolean;
  locationName?: string;
  onLocationChange?: (lat: number, lng: number) => void;
  onToast?: (msg: string) => void;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  userLocation,
  radiusM,
  results,
  nearbyStores = [],
  selectedResult,
  selectedNearbyStore,
  onSelectStore,
  onSelectNearbyStore,
  onOpenDetail,
  onOpenNearbyDetail,
  onOpenProduct,
  onOpenProductModal,
  onNavigate,
  onCancelRoute,
  routeData,
  routeMode = 'walking',
  onChangeRouteMode,
  view,
  isDarkMode = false,
  locationName,
  onLocationChange,
  onToast
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const radiusCircleRef = useRef<L.Circle | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);
  const routeMarkersLayerRef = useRef<L.LayerGroup | null>(null);
  const prevRadiusRef = useRef<number>(radiusM);
  const [currentZoom, setCurrentZoom] = useState<number>(15);

  // Global handlers for Leaflet popups
  useEffect(() => {
    (window as any).__yaqintop_open_nearby_detail = (storeId: string) => {
      const item = nearbyStores.find((s) => s.store.id === storeId);
      if (item && onOpenNearbyDetail) {
        onOpenNearbyDetail(item);
      }
    };
    (window as any).__yaqintop_route_nearby = (storeId: string) => {
      const item = nearbyStores.find((s) => s.store.id === storeId);
      if (item && onNavigate) {
        onNavigate({ store: item.store, distanceM: item.distanceM || 0 });
      }
    };
    (window as any).__yaqintop_open_result_detail = (storeId: string) => {
      const item = results.find((s) => s.store.id === storeId);
      if (item && onOpenDetail) {
        onOpenDetail(item);
      }
    };
    (window as any).__yaqintop_route_result = (storeId: string) => {
      const item = results.find((s) => s.store.id === storeId);
      if (item && onNavigate) {
        onNavigate(item);
      }
    };
    (window as any).__yaqintop_open_product_modal = (storeId: string) => {
      const item = results.find((s) => s.store.id === storeId);
      if (item && onOpenProductModal) {
        onOpenProductModal(item);
      } else if (item && onOpenProduct) {
        onOpenProduct(item.bestOffer?.variant?.id || item.bestOffer?.variant?.sku || '');
      }
    };

    return () => {
      delete (window as any).__yaqintop_open_nearby_detail;
      delete (window as any).__yaqintop_route_nearby;
      delete (window as any).__yaqintop_open_result_detail;
      delete (window as any).__yaqintop_route_result;
      delete (window as any).__yaqintop_open_product_modal;
    };
  }, [nearbyStores, results, onOpenNearbyDetail, onOpenDetail, onNavigate, onOpenProductModal, onOpenProduct]);

  const [mapReady, setMapReady] = useState(false);

  const userLat = userLocation?.lat ?? 41.311081;
  const userLng = userLocation?.lng ?? 69.240562;

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Clear any dangling leaflet id from strict mode remounts
    if ((mapContainerRef.current as any)._leaflet_id) {
      delete (mapContainerRef.current as any)._leaflet_id;
    }

    let map: L.Map;
    try {
      map = L.map(mapContainerRef.current, {
        center: [userLat, userLng],
        zoom: 15,
        zoomControl: false,
        attributionControl: false
      });

      // Fast, resilient OpenStreetMap tiles with keepBuffer & fast update settings
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        subdomains: ['a', 'b', 'c'],
        maxZoom: 19,
        keepBuffer: 12,
        updateWhenIdle: false,
        updateInterval: 100,
        crossOrigin: true
      }).addTo(map);

      map.on('zoomend', () => {
        setCurrentZoom(map.getZoom());
      });
      setCurrentZoom(map.getZoom());

      map.on('click', () => {
        if (window.innerWidth < 768) {
          onSelectNearbyStore?.(null as any);
        }
      });

      const markersLayer = L.layerGroup().addTo(map);
      const routeMarkersLayer = L.layerGroup().addTo(map);

      markersLayerRef.current = markersLayer;
      routeMarkersLayerRef.current = routeMarkersLayer;
      mapInstanceRef.current = map;
      setMapReady(true);
    } catch (err) {
      console.error('Leaflet map creation failed:', err);
      return;
    }

    // Force size recalculations to guarantee full coverage
    const timer1 = setTimeout(() => map.invalidateSize(), 50);
    const timer2 = setTimeout(() => map.invalidateSize(), 250);
    const timer3 = setTimeout(() => map.invalidateSize(), 600);

    const resizeObserver = new ResizeObserver(() => {
      try {
        map.invalidateSize();
      } catch {}
    });
    resizeObserver.observe(mapContainerRef.current);

    const handleWindowResize = () => {
      try {
        map.invalidateSize();
      } catch {}
    };
    window.addEventListener('resize', handleWindowResize);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      window.removeEventListener('resize', handleWindowResize);
      resizeObserver.disconnect();
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch {}
        mapInstanceRef.current = null;
      }
      userMarkerRef.current = null;
      radiusCircleRef.current = null;
      routePolylineRef.current = null;
      tileLayerRef.current = null;
      setMapReady(false);
    };
  }, []);


  // Whenever view or results count change, re-invalidate map size (without moving view)
  useEffect(() => {
    if (mapInstanceRef.current) {
      setTimeout(() => {
        try {
          mapInstanceRef.current?.invalidateSize({ pan: false });
        } catch {}
      }, 50);
    }
  }, [view, results.length, mapReady]);

  // Update User Location and Radius Circle (Red Dot + Search Area)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapReady) return;

    try {
      // Red Dot (Qizil nuqta) with subtle pulsating radar effect
      const redDotHtml = `
        <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 32px; height: 32px;">
          <div style="position: absolute; width: 32px; height: 32px; border-radius: 9999px; background: #ef4444; opacity: 0.35; animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="width: 18px; height: 18px; border-radius: 9999px; background: #dc2626; border: 3.5px solid #ffffff; box-shadow: 0 0 10px rgba(220,38,38,0.7), 0 2px 4px rgba(0,0,0,0.3); z-index: 2;"></div>
        </div>
      `;

      const userIcon = L.divIcon({
        className: 'custom-user-marker',
        html: redDotHtml,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      if (userMarkerRef.current) {
        userMarkerRef.current.setLatLng([userLocation.lat, userLocation.lng]);
        userMarkerRef.current.setIcon(userIcon);
      } else {
        const marker = L.marker([userLocation.lat, userLocation.lng], {
          icon: userIcon,
          zIndexOffset: 1000
        }).addTo(map);

        marker.bindPopup(`
          <div style="text-align: center; padding: 4px; font-family: system-ui, sans-serif;">
            <strong style="font-size: 13px; color: ${isDarkMode ? '#E8F2EC' : '#172C28'}; display: block;">Siz turgan joy (Qizil nuqta)</strong>
            <span style="font-size: 11px; color: ${isDarkMode ? '#8B9E95' : '#566A63'};">Qidiruv markazi</span>
          </div>
        `);

        userMarkerRef.current = marker;
      }

      // Radius circle (Qidiruv maydoni chegarasi va ichki chiroyli nozik rangi)
      const strokeColor = isDarkMode ? '#4ADE80' : '#10B981';
      const fillColor = isDarkMode ? '#22C55E' : '#10B981';
      const fillOpacity = isDarkMode ? 0.16 : 0.11;

      if (radiusCircleRef.current) {
        radiusCircleRef.current.setLatLng([userLocation.lat, userLocation.lng]);
        radiusCircleRef.current.setRadius(radiusM);
        radiusCircleRef.current.setStyle({
          color: strokeColor,
          weight: 2,
          opacity: 0.85,
          dashArray: '6, 6',
          fill: true,
          fillColor: fillColor,
          fillOpacity: fillOpacity,
          interactive: false,
          bubblingMouseEvents: false,
          className: 'search-radius-circle pointer-events-none'
        });
        const elem = radiusCircleRef.current.getElement() as SVGElement | null;
        if (elem) {
          elem.setAttribute('class', 'search-radius-circle pointer-events-none');
          elem.setAttribute('pointer-events', 'none');
          elem.setAttribute('tabindex', '-1');
          if (elem.style) {
            elem.style.setProperty('outline', 'none', 'important');
            elem.style.setProperty('pointer-events', 'none', 'important');
            elem.style.setProperty('touch-action', 'none', 'important');
          }
        }
      } else {
        const circle = L.circle([userLocation.lat, userLocation.lng], {
          radius: radiusM,
          color: strokeColor,
          weight: 2,
          opacity: 0.85,
          dashArray: '6, 6',
          fill: true,
          fillColor: fillColor,
          fillOpacity: fillOpacity,
          interactive: false,
          bubblingMouseEvents: false,
          className: 'search-radius-circle pointer-events-none'
        }).addTo(map);

        const elem = circle.getElement() as SVGElement | null;
        if (elem) {
          elem.setAttribute('class', 'search-radius-circle pointer-events-none');
          elem.setAttribute('pointer-events', 'none');
          elem.setAttribute('tabindex', '-1');
          if (elem.style) {
            elem.style.setProperty('outline', 'none', 'important');
            elem.style.setProperty('pointer-events', 'none', 'important');
            elem.style.setProperty('touch-action', 'none', 'important');
          }
        }

        radiusCircleRef.current = circle;
      }

      // Auto fit search circle into screen view only when radius explicitly changes
      const isRadiusChanged = prevRadiusRef.current !== radiusM;
      if (isRadiusChanged && view !== 'route' && radiusCircleRef.current && mapContainerRef.current && mapContainerRef.current.clientWidth > 0) {
        prevRadiusRef.current = radiusM;
        map.fitBounds(radiusCircleRef.current.getBounds(), {
          padding: [50, 50],
          maxZoom: 16,
          animate: true
        });
      }
    } catch (err) {
      console.error('Error updating location/circle on map:', err);
    }
  }, [mapReady, userLocation.lat, userLocation.lng, radiusM]);

  // Update theme styling on circle when isDarkMode changes WITHOUT moving or zooming the map
  useEffect(() => {
    if (!radiusCircleRef.current) return;
    const strokeColor = isDarkMode ? '#4ADE80' : '#10B981';
    radiusCircleRef.current.setStyle({
      color: strokeColor,
      weight: 2,
      opacity: 0.85,
      dashArray: '6, 6',
      fill: false,
      fillOpacity: 0,
      interactive: false,
      bubblingMouseEvents: false,
      className: 'search-radius-circle pointer-events-none'
    });
    const elem = radiusCircleRef.current.getElement() as SVGElement | null;
    if (elem) {
      elem.setAttribute('class', 'search-radius-circle pointer-events-none');
      elem.setAttribute('pointer-events', 'none');
      elem.setAttribute('tabindex', '-1');
      if (elem.style) {
        elem.style.setProperty('outline', 'none', 'important');
        elem.style.setProperty('pointer-events', 'none', 'important');
        elem.style.setProperty('touch-action', 'none', 'important');
      }
    }
  }, [isDarkMode]);

  // Update Store Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    if (view === 'route') return;

    const isZoomedIn = currentZoom >= 17;
    const placedBadgePositions: { x: number; y: number }[] = [];

    // Case 1: Product search active
    if (results.length > 0) {
      // Prioritize selected item so its badge is always placed and on top
      const sortedResults = [...results].sort((a, b) => {
        if (selectedResult?.store?.id === a.store?.id) return -1;
        if (selectedResult?.store?.id === b.store?.id) return 1;
        return 0;
      });

      sortedResults.forEach((item) => {
        const latLng = getStoreLatLng(item?.store);
        if (!latLng) return;

        const isSelected = selectedResult?.store?.id === item.store?.id;
        const pt = map.latLngToContainerPoint(latLng);

        let showFullName = false;
        if (isSelected) {
          showFullName = true;
          placedBadgePositions.push({ x: pt.x, y: pt.y });
        } else if (isZoomedIn) {
          // Collision avoidance: do not show label if closer than 100px horizontally and 28px vertically
          const collides = placedBadgePositions.some(
            (p) => Math.abs(pt.x - p.x) < 100 && Math.abs(pt.y - p.y) < 28
          );
          if (!collides) {
            showFullName = true;
            placedBadgePositions.push({ x: pt.x, y: pt.y });
          }
        }
        const formattedPrice = Number(item.bestOffer?.price || 0).toLocaleString('uz-UZ');

        let markerIcon: L.DivIcon;

        if (!showFullName) {
          // Compact dot pin when zoomed out
          const dotColor = isSelected
            ? '#116B50'
            : item.isOpenNow
            ? (isDarkMode ? '#22C55E' : '#116B50')
            : '#9CA3AF';

          markerIcon = L.divIcon({
            className: 'custom-store-pin',
            html: `
              <div style="position: absolute; left: 0; bottom: 0; transform: translate(-50%, -50%); display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; cursor: pointer; pointer-events: auto;">
                <div style="width: 13px; height: 13px; border-radius: 9999px; background: ${dotColor}; border: 2.5px solid #ffffff; box-shadow: 0 2px 5px rgba(0,0,0,0.35); transition: transform 0.15s ease-out;"></div>
              </div>
            `,
            iconSize: [0, 0],
            iconAnchor: [0, 0],
            popupAnchor: [0, -18]
          });
        } else {
          // Full label badge when zoomed in or selected
          const bgStyle = isSelected
            ? 'background: #116B50; color: #ffffff; border: 2px solid #ffffff; box-shadow: 0 8px 18px -2px rgba(17,107,80,0.5);'
            : item.isOpenNow
            ? isDarkMode
              ? 'background: #16241E; color: #E8F2EC; border: 2px solid #22C55E; box-shadow: 0 4px 8px rgba(0,0,0,0.4);'
              : 'background: #ffffff; color: #172C28; border: 2px solid #116B50; box-shadow: 0 4px 8px rgba(0,0,0,0.15);'
            : isDarkMode
            ? 'background: #1F2937; color: #9CA3AF; border: 2px solid #4B5563; box-shadow: 0 4px 6px rgba(0,0,0,0.3);'
            : 'background: #F3F4F6; color: #6B7280; border: 2px solid #9CA3AF; box-shadow: 0 4px 6px rgba(0,0,0,0.1);';

          const arrowColor = isSelected
            ? '#116B50'
            : item.isOpenNow
            ? (isDarkMode ? '#22C55E' : '#116B50')
            : '#9CA3AF';

          markerIcon = L.divIcon({
            className: 'custom-store-pin',
            html: `
              <div style="position: absolute; left: 0; bottom: 0; transform: translate(-50%, 0); display: flex; flex-direction: column; align-items: center; pointer-events: auto; cursor: pointer; user-select: none;">
                <div style="${bgStyle} padding: 4px 8px; border-radius: 9999px; font-size: 11px; font-weight: 700; display: inline-flex; align-items: center; gap: 4px; white-space: nowrap; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">
                  <span style="max-width: 90px; overflow: hidden; text-overflow: ellipsis; opacity: 0.95; font-weight: 600;">${item.store.name}</span>
                  <span style="opacity: 0.5;">·</span>
                  <span>${formattedPrice} so‘m</span>
                </div>
                <div style="width: 0; height: 0; border-left: 5px solid transparent; border-right: 5px solid transparent; border-top: 5px solid ${arrowColor}; margin-top: -1px;"></div>
              </div>
            `,
            iconSize: [0, 0],
            iconAnchor: [0, 0],
            popupAnchor: [0, -32]
          });
        }

        const marker = L.marker(latLng, {
          icon: markerIcon,
          zIndexOffset: isSelected ? 1000 : (showFullName ? 200 : 50),
          title: `${item.store.name} — ${item.bestOffer?.variant?.title || 'Mahsulot'}: ${formattedPrice} so‘m`,
          keyboard: true
        });

        const popupCardBg = isDarkMode ? '#1F2D26' : '#F9FAF9';
        const popupBorder = isDarkMode ? '#2A3F36' : '#DCE5DF';
        const popupTitle = isDarkMode ? '#E8F2EC' : '#172C28';
        const popupMuted = isDarkMode ? '#8B9E95' : '#566A63';
        const productThumb = getProductThumbnail(item.bestOffer?.variant);

        const popupContent = `
          <div style="min-width: 210px; max-width: 280px; padding: 4px; font-family: system-ui, -apple-system, sans-serif;">
            <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 6px; margin-bottom: 2px;">
              <div style="font-weight: 700; font-size: 14px; color: ${popupTitle};">
                ${item.store.name}
              </div>
              <span style="font-size: 10px; font-weight: 700; padding: 1px 5px; border-radius: 4px; background: ${item.isOpenNow ? (isDarkMode ? '#1E362A' : '#E0EFE7') : '#FEE2E2'}; color: ${item.isOpenNow ? (isDarkMode ? '#4ADE80' : '#116B50') : '#B42318'}; white-space: nowrap;">
                ${item.isOpenNow ? 'Ochiq' : 'Yopiq'}
              </span>
            </div>
            <div style="font-size: 11px; color: ${popupMuted}; margin-bottom: 6px; display: flex; align-items: center; justify-content: space-between;">
              <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 150px;">📍 ${item.store.address || 'Toshkent shahri'}</span>
              <span style="font-weight: 600; color: ${isDarkMode ? '#4ADE80' : '#116B50'}; white-space: nowrap;" title="Siz turgan nuqtadan to‘g‘ridan-to‘g‘ri masofa">
                📍 ${item.distanceM === 0 ? 'Siz turgan joyda' : (item.distanceM >= 1000 ? (item.distanceM / 1000).toFixed(1) + ' km' : item.distanceM + ' m')}
              </span>
            </div>
            <div id="btn-popup-prod-box-${item.store.id}" onclick="window.__yaqintop_open_product_modal && window.__yaqintop_open_product_modal('${item.store.id}')" style="background: ${popupCardBg}; border: 1px solid ${popupBorder}; border-radius: 8px; padding: 6px 8px; margin-bottom: 8px; display: flex; align-items: center; gap: 8px; cursor: pointer;" title="Tovar ma‘lumotlari va muqobillarini ko‘rish">
              <img id="btn-popup-thumb-${item.store.id}" src="${productThumb}" alt="${item.bestOffer?.variant?.title || 'Mahsulot'}" style="width: 38px; height: 38px; border-radius: 6px; object-fit: cover; background: #fff; flex-shrink: 0; border: 1px solid ${popupBorder}; cursor: pointer;" />
              <div style="min-width: 0; flex: 1;">
                <div id="btn-prod-${item.store.id}" onclick="window.__yaqintop_open_product_modal && window.__yaqintop_open_product_modal('${item.store.id}')" style="font-size: 12px; font-weight: 700; color: #116B50; cursor: pointer; text-decoration: underline; margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                  ${item.bestOffer?.variant?.title || 'Mahsulot'} ↗
                </div>
                <div style="font-size: 13px; font-weight: 800; color: #116B50;">
                  ${formattedPrice} so‘m <span style="font-size: 10px; font-weight: normal; color: ${popupMuted};">/ ${item.bestOffer?.variant?.packUnit || 'dona'}</span>
                </div>
              </div>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
              <button id="btn-detail-${item.store.id}" onclick="window.__yaqintop_open_result_detail && window.__yaqintop_open_result_detail('${item.store.id}')" style="background: #087F5B; color: white; border: none; border-radius: 10px; padding: 7px 10px; font-size: 11px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px;">
                <span>🏪</span> <span style="white-space: nowrap;">Sahifasiga o‘tish</span>
              </button>
              <button id="btn-route-${item.store.id}" onclick="window.__yaqintop_route_result && window.__yaqintop_route_result('${item.store.id}')" style="background: ${isDarkMode ? '#1E2923' : '#FFFFFF'}; color: ${isDarkMode ? '#E8F2EC' : '#172B26'}; border: 1px solid ${isDarkMode ? '#2E483A' : '#E2E8F0'}; border-radius: 10px; padding: 7px 10px; font-size: 11px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px;">
                <span style="color: #087F5B;">🧭</span> <span style="white-space: nowrap;">Marshrut</span>
              </button>
            </div>
          </div>
        `;

        marker.bindPopup(popupContent, {
          offset: [0, -18],
          autoPan: true,
          autoPanPaddingTopLeft: [16, 90],
          autoPanPaddingBottomRight: [16, 75],
          closeButton: true
        });

        marker.on('popupopen', () => {
          const detailBtn = document.getElementById(`btn-detail-${item.store.id}`);
          const routeBtn = document.getElementById(`btn-route-${item.store.id}`);
          const prodBtn = document.getElementById(`btn-prod-${item.store.id}`);
          const thumbBtn = document.getElementById(`btn-popup-thumb-${item.store.id}`);
          const prodBox = document.getElementById(`btn-popup-prod-box-${item.store.id}`);
          if (prodBox) prodBox.onclick = (e) => {
            e.stopPropagation();
            onOpenProductModal?.(item);
          };
          if (detailBtn) detailBtn.onclick = (e) => { e.stopPropagation(); onOpenDetail(item); };
          if (routeBtn) routeBtn.onclick = (e) => { e.stopPropagation(); onNavigate(item); };
          if (thumbBtn) thumbBtn.onclick = (e) => {
            e.stopPropagation();
            onOpenProductModal?.(item);
          };
          if (prodBtn) prodBtn.onclick = (e) => {
            e.stopPropagation();
            if (onOpenProductModal) {
              onOpenProductModal(item);
            } else if (onOpenProduct) {
              onOpenProduct(item.bestOffer?.variant?.id || item.bestOffer?.variant?.sku || '');
            }
          };
        });

        marker.on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          onSelectStore(item);
          try {
            marker.openPopup();
          } catch {}
        });

        markersLayer.addLayer(marker);

        if (isSelected) {
          setTimeout(() => {
            try {
              marker.openPopup();
            } catch {}
          }, 40);
        }
      });
    } else {
      // Case 2: Nearby stores browse mode
      // Prioritize selected item so its badge is always placed and on top
      const sortedNearby = [...nearbyStores].sort((a, b) => {
        if (selectedNearbyStore?.store?.id === a.store?.id) return -1;
        if (selectedNearbyStore?.store?.id === b.store?.id) return 1;
        return 0;
      });

      sortedNearby.forEach(item => {
        const latLng = getStoreLatLng(item.store);
        if (!latLng) return;
        const isSelected = selectedNearbyStore?.store?.id === item.store?.id;
        const pt = map.latLngToContainerPoint(latLng);

        let showFullName = false;
        if (isSelected) {
          showFullName = true;
          placedBadgePositions.push({ x: pt.x, y: pt.y });
        } else if (isZoomedIn) {
          // Collision avoidance: do not show label if closer than 110px horizontally and 28px vertically
          const collides = placedBadgePositions.some(
            (p) => Math.abs(pt.x - p.x) < 110 && Math.abs(pt.y - p.y) < 28
          );
          if (!collides) {
            showFullName = true;
            placedBadgePositions.push({ x: pt.x, y: pt.y });
          }
        }
        const storeName = (item.organization?.name || item.store.name || '').replace(/"/g, '&quot;');

        let markerIcon: L.DivIcon;

        if (!showFullName) {
          // Dot marker when zoomed out
          const dotColor = isSelected
            ? '#116B50'
            : (item.isOpenNow ?? true)
            ? (isDarkMode ? '#22C55E' : '#116B50')
            : '#9CA3AF';

          markerIcon = L.divIcon({
            className: 'custom-store-pin',
            html: `
              <div style="position: absolute; left: 0; bottom: 0; transform: translate(-50%, -50%); display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; cursor: pointer; pointer-events: auto;">
                <div style="width: 14px; height: 14px; border-radius: 9999px; background: ${dotColor}; border: 2.5px solid #ffffff; box-shadow: 0 2px 6px rgba(0,0,0,0.35); transition: transform 0.15s ease-out;"></div>
              </div>
            `,
            iconSize: [0, 0],
            iconAnchor: [0, 0],
            popupAnchor: [0, -18]
          });
        } else {
          // Full pill badge when zoomed in or selected
          const badgeBg = isSelected
            ? '#116B50'
            : (isDarkMode ? '#16241E' : '#ffffff');
          const badgeColor = isSelected
            ? '#ffffff'
            : (isDarkMode ? '#E8F2EC' : '#172C28');
          const borderColor = isSelected
            ? '#ffffff'
            : '#116B50';
          const shadow = isSelected
            ? '0 6px 16px rgba(17,107,80,0.5)'
            : '0 3px 10px rgba(0,0,0,0.18)';

          markerIcon = L.divIcon({
            className: 'custom-store-pin',
            html: `
              <div style="position: absolute; left: 0; bottom: 0; transform: translate(-50%, 0); display: flex; flex-direction: column; align-items: center; pointer-events: auto; cursor: pointer; user-select: none;">
                <div style="display: inline-flex; align-items: center; gap: 5px; padding: 4px 9px; border-radius: 9999px; font-size: 11px; font-weight: 700; background: ${badgeBg}; color: ${badgeColor}; border: 2px solid ${borderColor}; box-shadow: ${shadow}; white-space: nowrap;">
                  <span style="display: flex; align-items: center; justify-content: center; width: 16px; height: 16px; border-radius: 9999px; background: ${isSelected ? '#ffffff' : '#116B50'}; color: ${isSelected ? '#116B50' : '#ffffff'}; font-size: 9px;">🏢</span>
                  <span style="max-width: 130px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${storeName}</span>
                </div>
                <div style="width: 0; height: 0; border-left: 5px solid transparent; border-right: 5px solid transparent; border-top: 5px solid ${borderColor}; margin-top: -1px;"></div>
              </div>
            `,
            iconSize: [0, 0],
            iconAnchor: [0, 0],
            popupAnchor: [0, -32]
          });
        }

        const marker = L.marker(latLng, {
          icon: markerIcon,
          zIndexOffset: isSelected ? 1000 : (showFullName ? 200 : 50),
          title: `${item.organization?.name || item.store.name} — tovar va xizmatlarni ko‘rish`,
          keyboard: true
        });

        const popupCardBg = isDarkMode ? '#1F2D26' : '#F9FAF9';
        const popupBorder = isDarkMode ? '#2A3F36' : '#DCE5DF';
        const popupTitle = isDarkMode ? '#E8F2EC' : '#172C28';
        const popupMuted = isDarkMode ? '#8B9E95' : '#566A63';
        const storeType = item.store?.type === 'WHOLESALE' ? 'Ulgurji savdo' : 'Chakana do‘kon';
        const isOpen = item.isOpenNow ?? true;
        const openStatusHtml = isOpen
          ? `<span style="color: ${isDarkMode ? '#4ADE80' : '#116B50'}; font-weight: 700; font-size: 11px;">● Ochiq</span>`
          : `<span style="color: #EF4444; font-weight: 700; font-size: 11px;">○ Yopiq</span>`;
        const distanceHtml = item.distanceM
          ? `<span style="color: ${popupMuted}; font-size: 11px;"> · ${item.distanceM >= 1000 ? `${(item.distanceM / 1000).toFixed(1)} km` : `${item.distanceM} m`}</span>`
          : '';

        const distanceLabel = item.distanceM
          ? (item.distanceM >= 1000 ? `${(item.distanceM / 1000).toFixed(1)} km` : `${Math.round(item.distanceM)} m`)
          : '445 m';

        const popupContent = `
          <div style="min-width: 240px; max-width: 290px; padding: 4px; font-family: system-ui, -apple-system, sans-serif;">
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 4px;">
              <div style="font-weight: 800; font-size: 15px; color: ${popupTitle}; line-height: 1.25; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                ${storeName}
              </div>
              <div style="background: ${isDarkMode ? '#1E362A' : '#E8F5EE'}; color: ${isDarkMode ? '#4ADE80' : '#087F5B'}; font-size: 11px; font-weight: 800; padding: 2.5px 8px; border-radius: 9999px; white-space: nowrap; display: flex; align-items: center; gap: 3px;">
                <span>📍</span> <span>${distanceLabel}</span>
              </div>
            </div>
            <div style="font-size: 11.5px; color: ${popupMuted}; margin-bottom: 10px; display: flex; align-items: flex-start; gap: 4px; line-height: 1.35;">
              <span style="flex-shrink: 0;">📍</span> <span>${item.store.address || 'Guliston, Sirdaryo'}</span>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
              <button id="btn-nearby-detail-${item.store.id}" onclick="window.__yaqintop_open_nearby_detail && window.__yaqintop_open_nearby_detail('${item.store.id}')" style="background: #087F5B; color: white; border: none; border-radius: 10px; padding: 8px 10px; font-size: 11px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
                <span>🏪</span> <span style="white-space: nowrap;">Sahifasiga o‘tish</span>
              </button>
              <button id="btn-nearby-route-${item.store.id}" onclick="window.__yaqintop_route_nearby && window.__yaqintop_route_nearby('${item.store.id}')" style="background: ${isDarkMode ? '#1E2923' : '#FFFFFF'}; color: ${isDarkMode ? '#E8F2EC' : '#172B26'}; border: 1px solid ${isDarkMode ? '#2E483A' : '#E2E8F0'}; border-radius: 10px; padding: 8px 10px; font-size: 11px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px;">
                <span style="color: #087F5B;">🧭</span> <span style="white-space: nowrap;">Marshrut</span>
              </button>
            </div>
          </div>
        `;

        marker.bindPopup(popupContent, {
          offset: [0, -18],
          autoPan: true,
          autoPanPaddingTopLeft: [16, 90],
          autoPanPaddingBottomRight: [16, 75],
          closeButton: true
        });

        marker.on('popupopen', () => {
          const detailBtn = document.getElementById(`btn-nearby-detail-${item.store.id}`);
          const routeBtn = document.getElementById(`btn-nearby-route-${item.store.id}`);
          if (detailBtn) detailBtn.onclick = (e) => {
            e.stopPropagation();
            onOpenNearbyDetail?.(item);
          };
          if (routeBtn) routeBtn.onclick = (e) => {
            e.stopPropagation();
            onNavigate?.({ store: item.store, distanceM: item.distanceM || 0 });
          };
        });

        marker.on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          onSelectNearbyStore?.(item);
          try {
            marker.openPopup();
          } catch {}
        });

        markersLayer.addLayer(marker);

        if (isSelected) {
          setTimeout(() => {
            try {
              marker.openPopup();
            } catch {}
          }, 40);
        }
      });
    }
  }, [results, nearbyStores, selectedResult, selectedNearbyStore, currentZoom, view, isDarkMode, mapReady, onSelectNearbyStore, onOpenNearbyDetail, onSelectStore]);

  // Center selected result or nearby store on change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || view === 'route') return;

    if (selectedResult?.store) {
      const latLng = getStoreLatLng(selectedResult.store);
      if (latLng) {
        map.panTo(latLng, {
          animate: true,
          duration: 0.5
        });
      }
    } else if (selectedNearbyStore?.store) {
      const latLng = getStoreLatLng(selectedNearbyStore.store);
      if (latLng) {
        map.panTo(latLng, {
          animate: true,
          duration: 0.5
        });
      }
    }
  }, [selectedResult, selectedNearbyStore, view]);

  // Update Route Polyline & Destination Marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    const routeMarkersLayer = routeMarkersLayerRef.current;
    if (!map || !routeMarkersLayer) return;

    if (routePolylineRef.current) {
      map.removeLayer(routePolylineRef.current);
      routePolylineRef.current = null;
    }
    routeMarkersLayer.clearLayers();

    if (view === 'route' && routeData && routeData.geometry && routeData.geometry.length > 0) {
      const latLngs: [number, number][] = routeData.geometry.map(([lng, lat]) => [lat, lng]);

      const isWalking = (routeMode || routeData.mode) === 'walking';
      const polyline = L.polyline(latLngs, {
        color: isDarkMode ? '#22C55E' : '#116B50',
        weight: 6,
        opacity: 0.9,
        lineCap: 'round',
        lineJoin: 'round',
        dashArray: isWalking ? '1, 10' : undefined,
        interactive: false
      }).addTo(map);

      const polyElem = polyline.getElement() as SVGElement | null;
      if (polyElem?.style) {
        polyElem.style.outline = 'none';
        polyElem.style.pointerEvents = 'none';
      }

      routePolylineRef.current = polyline;

      const destCoords = latLngs[latLngs.length - 1];
      const destIcon = L.divIcon({
        className: 'dest-marker',
        html: `
          <div style="width: 32px; height: 32px; border-radius: 9999px; background: #116B50; border: 2px solid white; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; color: white; font-size: 14px; font-weight: bold;">
            🏁
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      L.marker(destCoords, { icon: destIcon }).addTo(routeMarkersLayer);

      setTimeout(() => {
        try {
          map.invalidateSize();
          map.fitBounds(polyline.getBounds(), { padding: [60, 60], animate: true });
        } catch {}
      }, 50);
    }
  }, [view, routeData, routeMode, isDarkMode, mapReady]);

  // Re-center on User Location
  const handleRecenter = () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const uLat = userLocation?.lat ?? 41.311081;
    const uLng = userLocation?.lng ?? 69.240562;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          if (onLocationChange) onLocationChange(latitude, longitude);
          map.setView([latitude, longitude], 15, { animate: true });
          if (onToast) onToast('GPS joylashuv aniqlandi!');
        },
        () => {
          map.setView([uLat, uLng], 15, { animate: true });
          if (onToast) onToast('Boshlang‘ich qidiruv nuqtasiga qaytildi');
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      map.setView([uLat, uLng], 15, { animate: true });
      if (onToast) onToast('Boshlang‘ich joylashuvga qaytildi');
    }
  };

  // Fit search radius circle in view
  const handleFitRadius = () => {
    const map = mapInstanceRef.current;
    const circle = radiusCircleRef.current;
    if (!map || !circle) return;

    map.fitBounds(circle.getBounds(), { padding: [50, 50], maxZoom: 16, animate: true });
    if (onToast) onToast(`Qidiruv maydoni: ${radiusM >= 1000 ? `${(radiusM / 1000).toFixed(1)} km` : `${radiusM} m`}`);
  };

  // Fit all markers in view
  const handleFitBounds = () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const uLat = userLocation?.lat ?? 41.311081;
    const uLng = userLocation?.lng ?? 69.240562;

    if (results.length > 0) {
      const validPoints: [number, number][] = results
        .map((r) => getStoreLatLng(r?.store))
        .filter((pt): pt is [number, number] => pt !== null);
      if (validPoints.length > 0) {
        const bounds = L.latLngBounds(validPoints);
        bounds.extend([uLat, uLng]);
        map.fitBounds(bounds, { padding: [50, 50], animate: true });
      }
    } else if (nearbyStores.length > 0) {
      const validPoints: [number, number][] = nearbyStores
        .map((r) => getStoreLatLng(r?.store))
        .filter((pt): pt is [number, number] => pt !== null);
      if (validPoints.length > 0) {
        const bounds = L.latLngBounds(validPoints);
        bounds.extend([uLat, uLng]);
        map.fitBounds(bounds, { padding: [50, 50], animate: true });
      }
    }
  };

  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut();
  };

  

  return (
    <div className="relative w-full h-full min-h-0 flex-1 flex flex-col overflow-hidden">
      {/* Leaflet Map Canvas - Fills 100% of container */}
      <div
        ref={mapContainerRef}
        className="absolute inset-0 w-full h-full z-0"
        style={{ width: '100%', height: '100%' }}
      />

      {/* Floating Route Mode Top Notification / Stop Action */}
      {view === 'route' && routeData && (
        <div className="absolute top-3 md:top-4 left-3 md:left-4 right-3 md:right-4 z-20 flex flex-col gap-2 max-w-md pointer-events-auto">
          <div className="bg-white/95 dark:bg-[#14201A]/95 backdrop-blur-md p-3 rounded-2xl border border-[#DCE5DF] dark:border-[#273B32] shadow-xl flex flex-col gap-2">
            {/* Top row: Store Name & Stop button */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <div className="min-w-0">
                  <h4 className="text-xs md:text-sm font-bold text-[#172C28] dark:text-[#E8F2EC] truncate">
                    {selectedResult?.store?.name || selectedNearbyStore?.store?.name || 'Do‘konga marshrut'}
                  </h4>
                  {(selectedResult?.store?.address || selectedNearbyStore?.store?.address) && (
                    <p className="text-[11px] text-[#566A63] dark:text-[#8B9E95] truncate">
                      {selectedResult?.store?.address || selectedNearbyStore?.store?.address}
                    </p>
                  )}
                </div>
              </div>

              {onCancelRoute && (
                <button
                  onClick={onCancelRoute}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 active:scale-95 text-white text-xs font-bold shadow-xs transition shrink-0 cursor-pointer"
                  title="Marshrutni to‘xtatish"
                >
                  <XCircle className="w-4 h-4" />
                  <span>To‘xtatish</span>
                </button>
              )}
            </div>

            {/* Bottom row: Time/Distance summary + Mode Selector (Piyoda / Mashina) + External map */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#DCE5DF]/60 dark:border-[#273B32]">
              <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#116B50] dark:text-[#4ADE80]">
                <span>{(routeMode || routeData.mode) === 'walking' ? '🚶' : '🚗'}</span>
                <span>{Math.round(routeData.durationSec / 60) || 1} daqiqa</span>
                <span className="text-[#566A63] dark:text-[#8B9E95] font-normal">
                  · {routeData.distanceM >= 1000 ? `${(routeData.distanceM / 1000).toFixed(1)} km` : `${routeData.distanceM} m`}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {onChangeRouteMode && (
                  <div className="flex p-0.5 bg-[#F3F6F3] dark:bg-[#1A2822] rounded-lg border border-[#DCE5DF] dark:border-[#2A3F36] text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => onChangeRouteMode('walking')}
                      className={`px-2 py-1 rounded-md transition ${
                        (routeMode || routeData.mode) === 'walking'
                          ? 'bg-[#116B50] text-white shadow-xs'
                          : 'text-[#566A63] dark:text-[#8B9E95] hover:text-[#172C28] dark:hover:text-white'
                      }`}
                    >
                      🚶 Piyoda
                    </button>
                    <button
                      type="button"
                      onClick={() => onChangeRouteMode('driving')}
                      className={`px-2 py-1 rounded-md transition ${
                        (routeMode || routeData.mode) === 'driving'
                          ? 'bg-[#116B50] text-white shadow-xs'
                          : 'text-[#566A63] dark:text-[#8B9E95] hover:text-[#172C28] dark:hover:text-white'
                      }`}
                    >
                      🚗 Avto
                    </button>
                  </div>
                )}

                {routeData.externalMapUrl && (
                  <a
                    href={routeData.externalMapUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg bg-[#E0EFE7] dark:bg-[#1E362A] hover:bg-[#D0E7DC] text-[#116B50] dark:text-[#4ADE80] transition flex items-center justify-center"
                    title="Google / Yandex xaritasida ochish"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Floating Map Controls (Top Right: Recenter, Radius, Fit & Zoom) */}
      <div className="absolute right-3 md:right-4 top-20 sm:top-24 md:top-4 flex flex-col gap-2 z-20">
        <button
          onClick={handleRecenter}
          title="Mening joylashuvim (GPS)"
          className="w-9 h-9 sm:w-10 sm:h-10 bg-white/95 dark:bg-[#14201A]/95 backdrop-blur-md rounded-xl border border-[#DCE5DF] dark:border-[#273B32] flex items-center justify-center text-red-500 shadow-md hover:bg-[#FEE2E2] dark:hover:bg-[#2A1D1D] transition active:scale-95 text-xs font-bold"
        >
          <Crosshair className="w-4 h-4" />
        </button>
        <button
          onClick={handleFitRadius}
          title="Qidiruv maydonini to'liq ko'rsatish"
          className="w-9 h-9 sm:w-10 sm:h-10 bg-white/95 dark:bg-[#14201A]/95 backdrop-blur-md rounded-xl border border-[#DCE5DF] dark:border-[#273B32] flex items-center justify-center text-[#116B50] dark:text-[#4ADE80] shadow-md hover:bg-[#E0EFE7] dark:hover:bg-[#1E362A] transition active:scale-95 text-xs font-bold"
        >
          <CircleDot className="w-4 h-4" />
        </button>
        <button
          onClick={handleFitBounds}
          title="Barcha do'konlarni ko'rsatish"
          className="w-9 h-9 sm:w-10 sm:h-10 bg-white/95 dark:bg-[#14201A]/95 backdrop-blur-md rounded-xl border border-[#DCE5DF] dark:border-[#273B32] flex items-center justify-center text-[#172C28] dark:text-[#E8F2EC] shadow-md hover:bg-[#F3F6F3] dark:hover:bg-[#1F2F27] transition active:scale-95 text-xs font-bold"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
        <div className="flex flex-col bg-white/95 dark:bg-[#14201A]/95 backdrop-blur-md rounded-xl border border-[#DCE5DF] dark:border-[#273B32] shadow-md overflow-hidden">
          <button
            onClick={handleZoomIn}
            title="Kattalashtirish"
            className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-[#172C28] dark:text-[#E8F2EC] font-bold text-lg hover:bg-[#F3F6F3] dark:hover:bg-[#1F2F27] transition border-b border-[#DCE5DF] dark:border-[#273B32]"
          >
            +
          </button>
          <button
            onClick={handleZoomOut}
            title="Kichiklashtirish"
            className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-[#172C28] dark:text-[#E8F2EC] font-bold text-lg hover:bg-[#F3F6F3] dark:hover:bg-[#1F2F27] transition"
          >
            −
          </button>
        </div>
      </div>

      {/* Mobile Floating Card for Selected Nearby Store (when user taps store pin on map) */}
      {!results.length && selectedNearbyStore && view !== 'route' && (
        <div className="absolute bottom-[72px] md:hidden left-3 right-3 z-30 pointer-events-none animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="bg-white/95 dark:bg-[#14201A]/95 backdrop-blur-md border border-[#116B50]/30 dark:border-[#4ADE80]/30 rounded-2xl p-3.5 sm:p-4 shadow-xl pointer-events-auto flex flex-col gap-2.5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="px-2 py-0.5 rounded-md bg-[#E0EFE7] dark:bg-[#1E362A] text-[#116B50] dark:text-[#4ADE80] text-[11px] font-black uppercase tracking-wider">
                    {selectedNearbyStore.store?.type === 'WHOLESALE' ? 'Ulgurji' : 'Do‘kon'}
                  </span>
                  <span className={selectedNearbyStore.isOpenNow ? 'text-[#116B50] dark:text-[#4ADE80] text-xs font-bold' : 'text-red-500 text-xs font-bold'}>
                    {selectedNearbyStore.isOpenNow ? '● Ochiq' : '○ Yopiq'}
                  </span>
                </div>
                <h3 className="font-extrabold text-base text-[#172C28] dark:text-[#E8F2EC] truncate">
                  {selectedNearbyStore.organization?.name || selectedNearbyStore.store?.name}
                </h3>
                <p className="text-xs text-[#566A63] dark:text-[#8B9E95] mt-0.5 truncate">
                  📍 {selectedNearbyStore.store?.address || 'Toshkent shahri'}
                  {selectedNearbyStore.distanceM && (
                    <span className="font-bold text-[#116B50] dark:text-[#4ADE80] ml-1">
                      · {selectedNearbyStore.distanceM >= 1000 ? `${(selectedNearbyStore.distanceM / 1000).toFixed(1)} km` : `${selectedNearbyStore.distanceM} m`}
                    </span>
                  )}
                </p>
              </div>
              <button
                onClick={() => onSelectNearbyStore?.(null as any)}
                className="text-[#8B9E95] hover:text-[#172C28] dark:hover:text-white p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                title="Yopish"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-[#DCE5DF]/60 dark:border-[#273B32]">
              <button
                onClick={() => onOpenNearbyDetail?.(selectedNearbyStore)}
                className="flex-1 min-h-[44px] py-2.5 px-3 rounded-xl bg-[#116B50] active:scale-95 text-white text-xs sm:text-sm font-bold transition flex items-center justify-center gap-1.5 shadow-xs"
              >
                <StoreIcon className="w-4 h-4" />
                <span>Sahifasiga o‘tish</span>
              </button>
              <button
                onClick={() => onNavigate?.({ store: selectedNearbyStore.store, distanceM: selectedNearbyStore.distanceM || 0 })}
                className="min-h-[44px] py-2.5 px-3.5 rounded-xl bg-[#E0EFE7] dark:bg-[#1E362A] active:scale-95 text-[#116B50] dark:text-[#4ADE80] text-xs sm:text-sm font-bold transition flex items-center gap-1.5"
              >
                <Navigation className="w-4 h-4" />
                <span>Marshrut</span>
              </button>
            </div>
          </div>
        </div>
      )}

          </div>
  );
};
