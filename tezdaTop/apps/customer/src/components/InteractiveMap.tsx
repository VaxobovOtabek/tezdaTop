import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { StoreSearchResult, RouteResponse, Store } from '@yaqintop/contracts';
import { Navigation, MapPin, Maximize2, Store as StoreIcon, Crosshair, CircleDot, XCircle } from 'lucide-react';

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
  onNavigate: (store: StoreSearchResult | { store: Store; distanceM: number }) => void;
  onCancelRoute?: () => void;
  routeData: RouteResponse | null;
  view: 'search' | 'detail' | 'route' | 'saved' | 'profile';
  isDarkMode?: boolean;
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
  onNavigate,
  onCancelRoute,
  routeData,
  view,
  isDarkMode = false,
  onLocationChange,
  onToast
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const radiusCircleRef = useRef<L.Circle | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);
  const routeMarkersLayerRef = useRef<L.LayerGroup | null>(null);
  const cardListRef = useRef<HTMLDivElement | null>(null);

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

      // Standard OpenStreetMap tiles
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
      }).addTo(map);

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

      // Radius circle (Qidiruv maydoni)
      const strokeColor = isDarkMode ? '#4ADE80' : '#059669';
      const fillColor = isDarkMode ? '#22C55E' : '#10B981';
      const radiusLabel = radiusM >= 1000 ? `${(radiusM / 1000).toFixed(1)} km` : `${radiusM} m`;

      if (radiusCircleRef.current) {
        radiusCircleRef.current.setLatLng([userLocation.lat, userLocation.lng]);
        radiusCircleRef.current.setRadius(radiusM);
        radiusCircleRef.current.setStyle({
          color: strokeColor,
          weight: 2.5,
          opacity: 0.9,
          dashArray: '6, 6',
          fillColor: fillColor,
          fillOpacity: isDarkMode ? 0.22 : 0.16
        });
        radiusCircleRef.current.unbindTooltip();
        radiusCircleRef.current.bindTooltip(`🔍 Qidiruv maydoni: ${radiusLabel}`, {
          permanent: false,
          direction: 'top',
          className: 'font-semibold text-xs'
        });
      } else {
        const circle = L.circle([userLocation.lat, userLocation.lng], {
          radius: radiusM,
          color: strokeColor,
          weight: 2.5,
          opacity: 0.9,
          dashArray: '6, 6',
          fillColor: fillColor,
          fillOpacity: isDarkMode ? 0.22 : 0.16
        }).addTo(map);

        circle.bindTooltip(`🔍 Qidiruv maydoni: ${radiusLabel}`, {
          permanent: false,
          direction: 'top',
          className: 'font-semibold text-xs'
        });

        radiusCircleRef.current = circle;
      }

      // Auto fit search circle into screen view only when radius/location explicitly changes
      if (view !== 'route' && radiusCircleRef.current && mapContainerRef.current && mapContainerRef.current.clientWidth > 0) {
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
    const strokeColor = isDarkMode ? '#4ADE80' : '#059669';
    const fillColor = isDarkMode ? '#22C55E' : '#10B981';
    radiusCircleRef.current.setStyle({
      color: strokeColor,
      fillColor: fillColor,
      fillOpacity: isDarkMode ? 0.22 : 0.16
    });
  }, [isDarkMode]);

  // Update Store Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    if (view === 'route') return;

    // Case 1: Product search active
    if (results.length > 0) {
      results.forEach((item) => {
        const latLng = getStoreLatLng(item?.store);
        if (!latLng) return;

        const isSelected = selectedResult?.store?.id === item.store?.id;
        const formattedPrice = Number(item.bestOffer?.price || 0).toLocaleString('uz-UZ');

        const bgStyle = isSelected
          ? 'background: #116B50; color: #ffffff; border: 2px solid #ffffff; box-shadow: 0 10px 18px -2px rgba(17,107,80,0.5);'
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

        const customIcon = L.divIcon({
          className: 'custom-store-pin',
          html: `
            <div style="transform: translate(-50%, -50%); cursor: pointer; transition: transform 0.2s;">
              <div style="${bgStyle} padding: 6px 10px; border-radius: 12px; font-size: 12px; font-weight: 700; display: flex; align-items: center; gap: 6px; white-space: nowrap;">
                <span>🛒</span>
                <span>${formattedPrice} so‘m</span>
              </div>
              <div style="width: 8px; height: 8px; background: ${arrowColor}; transform: rotate(45deg); margin: -4px auto 0 auto;"></div>
            </div>
          `,
          iconSize: [120, 40],
          iconAnchor: [60, 36]
        });

        const marker = L.marker(latLng, {
          icon: customIcon,
          zIndexOffset: isSelected ? 500 : 100
        });

        const popupCardBg = isDarkMode ? '#1F2D26' : '#F9FAF9';
        const popupBorder = isDarkMode ? '#2A3F36' : '#DCE5DF';
        const popupTitle = isDarkMode ? '#E8F2EC' : '#172C28';
        const popupMuted = isDarkMode ? '#8B9E95' : '#566A63';

        const popupContent = `
          <div style="min-width: 200px; padding: 4px; font-family: system-ui, -apple-system, sans-serif;">
            <div style="font-weight: 700; font-size: 14px; color: ${popupTitle}; margin-bottom: 2px;">
              ${item.store.name}
            </div>
            <div style="font-size: 11px; color: ${popupMuted}; margin-bottom: 6px;">
              ${item.store.address}
            </div>
            <div style="background: ${popupCardBg}; border: 1px solid ${popupBorder}; border-radius: 8px; padding: 6px 8px; margin-bottom: 8px;">
              <div style="font-size: 11px; color: ${popupMuted};">${item.bestOffer?.variant?.title || 'Mahsulot'}</div>
              <div style="font-size: 14px; font-weight: 800; color: #116B50;">
                ${formattedPrice} so‘m <span style="font-size: 10px; font-weight: normal; color: ${popupMuted};">/ ${item.bestOffer?.variant?.packUnit || 'dona'}</span>
              </div>
            </div>
            <div style="display: flex; gap: 6px;">
              <button id="btn-detail-${item.store.id}" style="flex: 1; background: #116B50; color: white; border: none; border-radius: 6px; padding: 6px 8px; font-size: 11px; font-weight: 600; cursor: pointer;">
                Do‘kon
              </button>
              <button id="btn-route-${item.store.id}" style="background: ${isDarkMode ? '#23382F' : '#E0EFE7'}; color: ${isDarkMode ? '#4ADE80' : '#116B50'}; border: none; border-radius: 6px; padding: 6px 10px; font-size: 11px; font-weight: 600; cursor: pointer;">
                Marshrut
              </button>
            </div>
          </div>
        `;

        marker.bindPopup(popupContent, { offset: [0, -20] });
        marker.on('click', () => onSelectStore(item));
        marker.on('popupopen', () => {
          const detailBtn = document.getElementById(`btn-detail-${item.store.id}`);
          const routeBtn = document.getElementById(`btn-route-${item.store.id}`);
          if (detailBtn) detailBtn.onclick = (e) => { e.stopPropagation(); onOpenDetail(item); };
          if (routeBtn) routeBtn.onclick = (e) => { e.stopPropagation(); onNavigate(item); };
        });

        markersLayer.addLayer(marker);
      });
    } else {
      nearbyStores.forEach(item => {
        const latLng = getStoreLatLng(item.store);
        if (!latLng) return;
        const label = document.createElement('div');
        label.textContent = item.organization?.name || item.store.name;
        label.style.cssText = `padding:6px 10px;border-radius:12px;white-space:nowrap;font-size:12px;font-weight:700;background:${isDarkMode ? '#16241E' : '#ffffff'};color:${isDarkMode ? '#E8F2EC' : '#172C28'};border:2px solid #116B50;box-shadow:0 2px 8px #0003;`;
        const marker = L.marker(latLng, {
          icon: L.divIcon({ className: 'custom-store-pin', html: label, iconSize: [140, 36], iconAnchor: [70, 36] }),
          title: `${item.organization?.name || item.store.name} — tovar va xizmatlarni ko‘rish`,
          keyboard: true
        });
        marker.on('click', () => {
          onSelectNearbyStore?.(item);
          onOpenNearbyDetail?.(item);
        });
        markersLayer.addLayer(marker);
      });
    }
  }, [results, nearbyStores, selectedResult, view, isDarkMode, mapReady, onSelectNearbyStore, onOpenNearbyDetail]);

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

      const polyline = L.polyline(latLngs, {
        color: isDarkMode ? '#22C55E' : '#116B50',
        weight: 6,
        opacity: 0.9,
        lineCap: 'round',
        lineJoin: 'round',
        dashArray: routeData.mode === 'walking' ? '1, 10' : undefined
      }).addTo(map);

      routePolylineRef.current = polyline;

      const destCoords = latLngs[latLngs.length - 1];
      const destIcon = L.divIcon({
        className: 'dest-marker',
        html: `
          <div style="width: 32px; height: 32px; border-radius: 9999px; background: #116B50; border: 2px solid white; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; color: white; font-size: 14px; font-weight: bold; transform: translate(-50%, -50%);">
            🏁
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      L.marker(destCoords, { icon: destIcon }).addTo(routeMarkersLayer);

      map.fitBounds(polyline.getBounds(), { padding: [60, 60], animate: true });
    }
  }, [view, routeData, isDarkMode, mapReady]);

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

  // Find lowest price
  const lowestPriceOffer = results.length > 0
    ? [...results].sort((a, b) => Number(a.bestOffer.price) - Number(b.bestOffer.price))[0]
    : null;

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
        <div className="absolute top-3 md:top-4 left-3 md:left-4 right-3 md:right-4 z-20 flex justify-between items-center gap-2">
          <div className="bg-[#116B50] text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-lg flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
            <span>Marshrut faol · {Math.round(routeData.durationSec / 60) || 1} daqiqa ({routeData.distanceM >= 1000 ? `${(routeData.distanceM / 1000).toFixed(1)} km` : `${routeData.distanceM} m`})</span>
          </div>

          {onCancelRoute && (
            <button
              onClick={onCancelRoute}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 active:scale-95 text-white text-xs font-bold shadow-lg transition cursor-pointer"
              title="Marshrutni to‘xtatish"
            >
              <XCircle className="w-4 h-4" />
              <span>To‘xtatish</span>
            </button>
          )}
        </div>
      )}

      {/* Floating Top Left Location Status (Desktop) */}
      {view !== 'route' && (
        <div className="absolute top-3 md:top-4 left-3 md:left-4 hidden md:flex items-center pointer-events-none z-10">
          <div className="bg-white/95 dark:bg-[#14201A]/95 backdrop-blur-md border border-[#DCE5DF] dark:border-[#273B32] px-3.5 py-2 rounded-xl text-xs font-semibold text-[#172C28] dark:text-[#E8F2EC] shadow-md pointer-events-auto flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></div>
            <span>Siz turgan joy · Toshkent ({radiusM >= 1000 ? `${(radiusM / 1000).toFixed(1)} km` : `${radiusM} m`})</span>
          </div>
        </div>
      )}

      {/* Floating Map Controls (Top Right: Recenter, Radius, Fit & Zoom) */}
      <div className="absolute right-3 md:right-4 top-3 md:top-4 flex flex-col gap-2 z-20">
        <button
          onClick={handleRecenter}
          title="Mening joylashuvim (GPS)"
          className="w-10 h-10 bg-white/95 dark:bg-[#14201A]/95 backdrop-blur-md rounded-xl border border-[#DCE5DF] dark:border-[#273B32] flex items-center justify-center text-red-500 shadow-md hover:bg-[#FEE2E2] dark:hover:bg-[#2A1D1D] transition active:scale-95 text-xs font-bold"
        >
          <Crosshair className="w-4 h-4" />
        </button>
        <button
          onClick={handleFitRadius}
          title="Qidiruv maydonini to'liq ko'rsatish"
          className="w-10 h-10 bg-white/95 dark:bg-[#14201A]/95 backdrop-blur-md rounded-xl border border-[#DCE5DF] dark:border-[#273B32] flex items-center justify-center text-[#116B50] dark:text-[#4ADE80] shadow-md hover:bg-[#E0EFE7] dark:hover:bg-[#1E362A] transition active:scale-95 text-xs font-bold"
        >
          <CircleDot className="w-4 h-4" />
        </button>
        <button
          onClick={handleFitBounds}
          title="Barcha do'konlarni ko'rsatish"
          className="w-10 h-10 bg-white/95 dark:bg-[#14201A]/95 backdrop-blur-md rounded-xl border border-[#DCE5DF] dark:border-[#273B32] flex items-center justify-center text-[#172C28] dark:text-[#E8F2EC] shadow-md hover:bg-[#F3F6F3] dark:hover:bg-[#1F2F27] transition active:scale-95 text-xs font-bold"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
        <div className="flex flex-col bg-white/95 dark:bg-[#14201A]/95 backdrop-blur-md rounded-xl border border-[#DCE5DF] dark:border-[#273B32] shadow-md overflow-hidden">
          <button
            onClick={handleZoomIn}
            title="Kattalashtirish"
            className="w-10 h-10 flex items-center justify-center text-[#172C28] dark:text-[#E8F2EC] font-bold text-lg hover:bg-[#F3F6F3] dark:hover:bg-[#1F2F27] transition border-b border-[#DCE5DF] dark:border-[#273B32]"
          >
            +
          </button>
          <button
            onClick={handleZoomOut}
            title="Kichiklashtirish"
            className="w-10 h-10 flex items-center justify-center text-[#172C28] dark:text-[#E8F2EC] font-bold text-lg hover:bg-[#F3F6F3] dark:hover:bg-[#1F2F27] transition"
          >
            −
          </button>
        </div>
      </div>

      {/* Bottom Information & Store Cards Carousel Bar (Search Results Mode) */}
      {results.length > 0 && view !== 'route' && (
        <div className="absolute bottom-20 md:bottom-4 left-3 md:left-4 right-3 md:right-4 z-10 pointer-events-none">
          <div className="bg-white/95 dark:bg-[#14201A]/95 backdrop-blur-md border border-[#DCE5DF] dark:border-[#273B32] rounded-2xl p-3 shadow-xl pointer-events-auto flex flex-col gap-2.5 max-w-full">
            {/* Top Info Strip */}
            <div className="flex items-center justify-between text-xs pb-1.5 border-b border-[#DCE5DF]/60 dark:border-[#273B32]">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-[#172C28] dark:text-[#E8F2EC] flex items-center gap-1.5">
                  <StoreIcon className="w-4 h-4 text-[#116B50] dark:text-[#4ADE80]" />
                  {results.length} ta do‘kon topildi
                </span>
                {lowestPriceOffer && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#E0EFE7] dark:bg-[#1C3328] text-[#116B50] dark:text-[#4ADE80] font-semibold text-[11px]">
                    ✨ Eng arzon: {Number(lowestPriceOffer.bestOffer.price).toLocaleString('uz-UZ')} so‘m ({lowestPriceOffer.store.name})
                  </span>
                )}
              </div>
              <span className="text-[11px] text-[#566A63] dark:text-[#8B9E95] hidden lg:inline-block">
                Tanlash uchun xaritadagi pin yoki kartochkani bosing
              </span>
            </div>

            {/* Horizontal Scrollable Store Cards */}
            <div
              ref={cardListRef}
              className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-thin"
            >
              {results.map((item) => {
                const isSelected = selectedResult?.store.id === item.store.id;
                const formattedPrice = Number(item.bestOffer.price).toLocaleString('uz-UZ');

                return (
                  <div
                    key={item.store.id}
                    onClick={() => onSelectStore(item)}
                    className={`shrink-0 w-[240px] md:w-[280px] p-2.5 rounded-xl border transition-all cursor-pointer select-none ${
                      isSelected
                        ? 'bg-[#F4FAF6] dark:bg-[#1B2F25] border-2 border-[#116B50] dark:border-[#4ADE80] shadow-sm'
                        : 'bg-white dark:bg-[#16241E] border-[#DCE5DF] dark:border-[#273B32] hover:border-[#116B50]/50 dark:hover:border-[#4ADE80]/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <div className="truncate flex-1">
                        <h4 className="font-bold text-xs text-[#172C28] dark:text-[#E8F2EC] truncate">{item.store.name}</h4>
                        <div className="text-[11px] text-[#566A63] dark:text-[#8B9E95] truncate">{item.bestOffer.variant.title}</div>
                      </div>
                      <span className="shrink-0 text-xs font-extrabold text-[#116B50] dark:text-[#4ADE80]">
                        {formattedPrice} <span className="text-[10px] font-normal text-[#566A63] dark:text-[#8B9E95]">so‘m</span>
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-[#DCE5DF]/50 dark:border-[#273B32] text-[11px]">
                      <div className="flex items-center gap-1.5 text-[#566A63] dark:text-[#8B9E95]">
                        <span className={item.isOpenNow ? 'text-[#116B50] dark:text-[#4ADE80] font-semibold' : 'text-[#B42318] dark:text-[#F87171]'}>
                          {item.isOpenNow ? '● Ochiq' : '○ Yopiq'}
                        </span>
                        <span>·</span>
                        <span>{item.distanceM} m</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenDetail(item);
                          }}
                          className="px-2 py-0.5 rounded bg-[#116B50] text-white text-[10px] font-semibold hover:bg-[#0d533e] transition"
                        >
                          Do‘kon
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onNavigate(item);
                          }}
                          className="p-1 rounded bg-[#E0EFE7] dark:bg-[#1E362A] text-[#116B50] dark:text-[#4ADE80] hover:bg-[#d0e7dc] transition"
                          title="Marshrut"
                        >
                          <Navigation className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
