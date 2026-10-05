import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { StoreSearchResult, RouteResponse } from '@yaqintop/contracts';
import { Navigation, MapPin, Maximize2, Layers } from 'lucide-react';

interface InteractiveMapProps {
  userLocation: { lat: number; lng: number };
  radiusM: number;
  results: StoreSearchResult[];
  selectedResult: StoreSearchResult | null;
  onSelectStore: (store: StoreSearchResult) => void;
  onOpenDetail: (store: StoreSearchResult) => void;
  onNavigate: (store: StoreSearchResult) => void;
  routeData: RouteResponse | null;
  view: 'search' | 'detail' | 'route' | 'saved' | 'profile';
  onLocationChange?: (lat: number, lng: number) => void;
  onToast?: (msg: string) => void;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  userLocation,
  radiusM,
  results,
  selectedResult,
  onSelectStore,
  onOpenDetail,
  onNavigate,
  routeData,
  view,
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

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [userLocation.lat, userLocation.lng],
      zoom: 15,
      zoomControl: false,
      attributionControl: false
    });

    // Add CartoDB Positron / OSM tiles with rich aesthetics
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd'
    }).addTo(map);

    L.control.attribution({
      position: 'bottomright',
      prefix: '<span>© <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> · YaqinTop</span>'
    }).addTo(map);

    const markersLayer = L.layerGroup().addTo(map);
    const routeMarkersLayer = L.layerGroup().addTo(map);

    markersLayerRef.current = markersLayer;
    routeMarkersLayerRef.current = routeMarkersLayer;
    mapInstanceRef.current = map;

    // Resize observer to auto invalidateSize
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update User Location and Radius Circle
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // User location marker
    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([userLocation.lat, userLocation.lng]);
    } else {
      const userIcon = L.divIcon({
        className: 'custom-user-marker',
        html: `
          <div class="relative flex items-center justify-center">
            <div class="absolute w-8 h-8 rounded-full bg-blue-500 opacity-25 animate-ping"></div>
            <div class="w-6 h-6 rounded-full bg-blue-600 border-2 border-white shadow-lg flex items-center justify-center text-white text-[10px] font-bold">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="6"/>
              </svg>
            </div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const marker = L.marker([userLocation.lat, userLocation.lng], {
        icon: userIcon,
        zIndexOffset: 1000
      }).addTo(map);

      marker.bindPopup(`
        <div class="p-1 text-center font-sans">
          <strong class="text-xs text-[#172C28] block">Sizning joylashuvingiz</strong>
          <span class="text-[11px] text-[#566A63]">Qidiruv markazi</span>
        </div>
      `);

      userMarkerRef.current = marker;
    }

    // Radius circle
    if (radiusCircleRef.current) {
      radiusCircleRef.current.setLatLng([userLocation.lat, userLocation.lng]);
      radiusCircleRef.current.setRadius(radiusM);
    } else {
      const circle = L.circle([userLocation.lat, userLocation.lng], {
        radius: radiusM,
        color: '#116B50',
        weight: 2,
        dashArray: '6, 6',
        fillColor: '#116B50',
        fillOpacity: 0.08
      }).addTo(map);

      radiusCircleRef.current = circle;
    }
  }, [userLocation.lat, userLocation.lng, radiusM]);

  // Update Store Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    if (view === 'route') return; // In route mode, handled separately

    results.forEach((item) => {
      const isSelected = selectedResult?.store.id === item.store.id;
      const formattedPrice = Number(item.bestOffer.price).toLocaleString('uz-UZ');

      const customIcon = L.divIcon({
        className: 'custom-store-pin',
        html: `
          <div class="transform -translate-x-1/2 -translate-y-1/2 transition-transform duration-200 cursor-pointer ${
            isSelected ? 'scale-110 z-50' : 'hover:scale-105'
          }">
            <div class="px-2.5 py-1.5 rounded-xl text-xs font-bold shadow-md border-2 flex items-center gap-1.5 whitespace-nowrap ${
              isSelected
                ? 'bg-[#116B50] text-white border-white ring-2 ring-[#116B50] shadow-xl'
                : item.isOpenNow
                ? 'bg-white text-[#172C28] border-[#116B50]'
                : 'bg-[#F3F4F6] text-[#6B7280] border-[#9CA3AF]'
            }">
              <span class="text-sm">🛒</span>
              <span>${formattedPrice} so‘m</span>
            </div>
            <div class="w-2 h-2 bg-current rotate-45 mx-auto -mt-1 ${
              isSelected ? 'text-[#116B50]' : item.isOpenNow ? 'text-[#116B50]' : 'text-[#9CA3AF]'
            }"></div>
          </div>
        `,
        iconSize: [120, 40],
        iconAnchor: [60, 36]
      });

      const marker = L.marker([item.store.location.lat, item.store.location.lng], {
        icon: customIcon,
        zIndexOffset: isSelected ? 500 : 100
      });

      // Custom Popup
      const popupContent = `
        <div style="font-family: inherit; min-width: 200px; padding: 4px;">
          <div style="font-weight: 700; font-size: 14px; color: #172C28; margin-bottom: 2px;">
            ${item.store.name}
          </div>
          <div style="font-size: 11px; color: #566A63; margin-bottom: 6px;">
            ${item.store.address}
          </div>
          <div style="background: #F9FAF9; border: 1px solid #DCE5DF; border-radius: 8px; padding: 6px 8px; margin-bottom: 8px;">
            <div style="font-size: 11px; color: #566A63;">${item.bestOffer.variant.title}</div>
            <div style="font-size: 14px; font-weight: 800; color: #116B50;">
              ${formattedPrice} so‘m <span style="font-size: 10px; font-weight: normal; color: #566A63;">/ ${item.bestOffer.variant.packUnit}</span>
            </div>
          </div>
          <div style="display: flex; gap: 6px;">
            <button id="btn-detail-${item.store.id}" style="flex: 1; background: #116B50; color: white; border: none; border-radius: 6px; padding: 6px 8px; font-size: 11px; font-weight: 600; cursor: pointer;">
              Do‘kon
            </button>
            <button id="btn-route-${item.store.id}" style="background: #E0EFE7; color: #116B50; border: none; border-radius: 6px; padding: 6px 10px; font-size: 11px; font-weight: 600; cursor: pointer;">
              Marshrut
            </button>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent, { offset: [0, -20] });

      marker.on('click', () => {
        onSelectStore(item);
      });

      marker.on('popupopen', () => {
        const detailBtn = document.getElementById(`btn-detail-${item.store.id}`);
        const routeBtn = document.getElementById(`btn-route-${item.store.id}`);

        if (detailBtn) {
          detailBtn.onclick = (e) => {
            e.stopPropagation();
            onOpenDetail(item);
          };
        }
        if (routeBtn) {
          routeBtn.onclick = (e) => {
            e.stopPropagation();
            onNavigate(item);
          };
        }
      });

      markersLayer.addLayer(marker);
    });
  }, [results, selectedResult, view]);

  // Center selected result on change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedResult || view === 'route') return;

    map.panTo([selectedResult.store.location.lat, selectedResult.store.location.lng], {
      animate: true,
      duration: 0.5
    });
  }, [selectedResult, view]);

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
      // geometry format is [ [lng, lat], ... ]
      const latLngs: [number, number][] = routeData.geometry.map(([lng, lat]) => [lat, lng]);

      const polyline = L.polyline(latLngs, {
        color: '#116B50',
        weight: 6,
        opacity: 0.9,
        lineCap: 'round',
        lineJoin: 'round',
        dashArray: routeData.mode === 'walking' ? '1, 10' : undefined
      }).addTo(map);

      routePolylineRef.current = polyline;

      // Destination Marker
      const destCoords = latLngs[latLngs.length - 1];
      const destIcon = L.divIcon({
        className: 'dest-marker',
        html: `
          <div class="w-8 h-8 rounded-full bg-[#116B50] border-2 border-white shadow-xl flex items-center justify-center text-white text-xs font-bold transform -translate-x-1/2 -translate-y-1/2 animate-bounce">
            🏁
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      L.marker(destCoords, { icon: destIcon }).addTo(routeMarkersLayer);

      // Fit map to route bounds
      map.fitBounds(polyline.getBounds(), { padding: [60, 60], animate: true });
    }
  }, [view, routeData]);

  // Re-center on User Location
  const handleRecenter = () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          if (onLocationChange) onLocationChange(latitude, longitude);
          map.setView([latitude, longitude], 15, { animate: true });
          if (onToast) onToast('GPS joylashuv aniqlandi!');
        },
        () => {
          map.setView([userLocation.lat, userLocation.lng], 15, { animate: true });
          if (onToast) onToast('Boshlang‘ich qidiruv nuqtasiga qaytildi');
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      map.setView([userLocation.lat, userLocation.lng], 15, { animate: true });
      if (onToast) onToast('Boshlang‘ich joylashuvga qaytildi');
    }
  };

  // Fit all markers in view
  const handleFitBounds = () => {
    const map = mapInstanceRef.current;
    if (!map || results.length === 0) return;

    const bounds = L.latLngBounds(
      results.map((r) => [r.store.location.lat, r.store.location.lng] as [number, number])
    );
    bounds.extend([userLocation.lat, userLocation.lng]);
    map.fitBounds(bounds, { padding: [50, 50], animate: true });
  };

  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut();
  };

  return (
    <div className="relative w-full h-full min-h-[400px]">
      {/* Leaflet Map Canvas */}
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full z-0" />

      {/* Floating Top Bar */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-center pointer-events-none z-10">
        <div className="bg-white/95 backdrop-blur-md border border-[#DCE5DF] px-3.5 py-2 rounded-xl text-xs font-semibold text-[#172C28] shadow-md pointer-events-auto flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#116B50] animate-pulse"></div>
          <span>Qidiruv markazi · Toshkent ({radiusM >= 1000 ? `${(radiusM / 1000).toFixed(1)} km` : `${radiusM} m`})</span>
        </div>

        <button
          onClick={handleRecenter}
          title="Mening joylashuvim"
          className="w-10 h-10 bg-white/95 backdrop-blur-md rounded-xl border border-[#DCE5DF] flex items-center justify-center text-[#116B50] shadow-md pointer-events-auto hover:bg-[#EDF5F0] transition active:scale-95"
        >
          <MapPin className="w-5 h-5" />
        </button>
      </div>

      {/* Floating Map Controls (Zoom & Fit) */}
      <div className="absolute right-4 bottom-24 md:bottom-8 flex flex-col gap-2 z-10">
        <button
          onClick={handleFitBounds}
          title="Barcha do'konlarni ko'rsatish"
          className="w-10 h-10 bg-white/95 backdrop-blur-md rounded-xl border border-[#DCE5DF] flex items-center justify-center text-[#172C28] shadow-md hover:bg-[#F3F6F3] transition active:scale-95 text-xs font-bold"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
        <div className="flex flex-col bg-white/95 backdrop-blur-md rounded-xl border border-[#DCE5DF] shadow-md overflow-hidden">
          <button
            onClick={handleZoomIn}
            title="Kattalashtirish"
            className="w-10 h-10 flex items-center justify-center text-[#172C28] font-bold text-lg hover:bg-[#F3F6F3] transition border-b border-[#DCE5DF]"
          >
            +
          </button>
          <button
            onClick={handleZoomOut}
            title="Kichiklashtirish"
            className="w-10 h-10 flex items-center justify-center text-[#172C28] font-bold text-lg hover:bg-[#F3F6F3] transition"
          >
            −
          </button>
        </div>
      </div>
    </div>
  );
};
