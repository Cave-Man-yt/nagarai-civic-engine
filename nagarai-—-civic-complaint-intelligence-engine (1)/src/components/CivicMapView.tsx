import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MasterCluster, ComplaintCategory } from '../types';
import { KNOWN_CIVIC_LANDMARKS } from '../utils/geoUtils';

interface CivicMapViewProps {
  clusters: MasterCluster[];
  selectedClusterId: string | null;
  onSelectCluster: (clusterId: string) => void;
  onDispatchCrew: (cluster: MasterCluster) => void;
  onVerifyResolve: (cluster: MasterCluster) => void;
}

export const CivicMapView: React.FC<CivicMapViewProps> = ({
  clusters,
  selectedClusterId,
  onSelectCluster,
  onDispatchCrew,
  onVerifyResolve,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const circlesLayerRef = useRef<L.LayerGroup | null>(null);
  const landmarksLayerRef = useRef<L.LayerGroup | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Centered around Chennai / Central Civic Grid (13.0645, 80.2642)
    const map = L.map(mapContainerRef.current, {
      center: [13.0680, 80.2500],
      zoom: 13,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a> & NagarAI GIS',
      maxZoom: 19,
    }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    circlesLayerRef.current = L.layerGroup().addTo(map);
    landmarksLayerRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Markers and Clusters
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current || !circlesLayerRef.current || !landmarksLayerRef.current) return;

    markersLayerRef.current.clearLayers();
    circlesLayerRef.current.clearLayers();
    landmarksLayerRef.current.clearLayers();

    // 1. Render Sensitive Landmarks (Schools & Hospitals)
    KNOWN_CIVIC_LANDMARKS.forEach((poi) => {
      const isHospital = poi.type === 'hospital';
      const isSchool = poi.type === 'school';
      const isMetro = poi.type === 'metro';

      const iconBg = isHospital ? '#ef4444' : isSchool ? '#3b82f6' : isMetro ? '#8b5cf6' : '#64748b';
      const iconSymbol = isHospital ? '🏥' : isSchool ? '🏫' : isMetro ? '🚇' : '📍';

      const poiIcon = L.divIcon({
        className: 'custom-poi-marker',
        html: `
          <div style="
            background-color: ${iconBg};
            color: white;
            padding: 4px 6px;
            border-radius: 8px;
            font-size: 11px;
            font-weight: bold;
            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
            border: 2px solid white;
            display: flex;
            align-items: center;
            gap: 4px;
            white-space: nowrap;
          ">
            <span>${iconSymbol}</span>
            <span style="max-width: 110px; overflow: hidden; text-overflow: ellipsis;">${poi.name.split(' ')[0]}</span>
          </div>
        `,
        iconSize: [120, 24],
        iconAnchor: [60, 12],
      });

      const poiMarker = L.marker([poi.lat, poi.lng], { icon: poiIcon });
      poiMarker.bindTooltip(`<b>${poi.name}</b><br/>Type: ${(poi.type || 'Landmark').toUpperCase()}<br/>Zone Buffer: ${isHospital ? '500m' : '300m'}`, {
        direction: 'top',
      });
      landmarksLayerRef.current?.addLayer(poiMarker);

      // Sensitive Proximity Buffer Circle
      const bufferRadius = isHospital ? 500 : isSchool ? 300 : 200;
      const bufferCircle = L.circle([poi.lat, poi.lng], {
        radius: bufferRadius,
        color: iconBg,
        weight: 1,
        dashArray: '4, 4',
        fillColor: iconBg,
        fillOpacity: 0.04,
      });
      landmarksLayerRef.current?.addLayer(bufferCircle);
    });

    // 2. Render Civic Master Clusters
    clusters.forEach((cluster) => {
      const isSelected = cluster.id === selectedClusterId;
      const isResolved = cluster.status === 'resolved';
      const isCritical = cluster.priorityScore >= 130;

      // Color based on priority
      let pinColor = '#3b82f6'; // blue (low)
      if (isResolved) pinColor = '#10b981'; // green
      else if (isCritical) pinColor = '#ef4444'; // red
      else if (cluster.priorityScore >= 90) pinColor = '#f97316'; // orange
      else if (cluster.priorityScore >= 50) pinColor = '#f59e0b'; // amber

      // Category Icon Symbol
      const categoryIconMap: Record<ComplaintCategory, string> = {
        live_wire_hazard: '⚡',
        open_manhole: '⚠️',
        pothole: '🕳️',
        garbage_dump: '🗑️',
        waterlogging: '🌊',
        water_leakage: '💧',
        broken_streetlight: '💡',
        fallen_tree: '🌳',
        sewage_overflow: '☣️',
      };

      const symbol = categoryIconMap[cluster.category] || '📍';

      const customIcon = L.divIcon({
        className: 'custom-civic-marker',
        html: `
          <div style="position: relative; cursor: pointer;">
            ${
              isCritical && !isResolved
                ? `<div style="
                    position: absolute;
                    width: 48px;
                    height: 48px;
                    top: -6px;
                    left: -6px;
                    border-radius: 50%;
                    background: rgba(239, 68, 68, 0.4);
                    animation: pulse 1.5s infinite;
                  "></div>`
                : ''
            }
            <div style="
              width: 36px;
              height: 36px;
              border-radius: 50%;
              background: ${pinColor};
              border: ${isSelected ? '3px solid #f8fafc' : '2px solid white'};
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 16px;
              color: white;
              box-shadow: 0 4px 12px rgba(0,0,0,0.35);
              transform: ${isSelected ? 'scale(1.2)' : 'scale(1)'};
              transition: all 0.2s ease;
            ">
              ${symbol}
            </div>
            <div style="
              position: absolute;
              bottom: -18px;
              left: 50%;
              transform: translateX(-50%);
              background: #0f172a;
              color: #f8fafc;
              font-size: 10px;
              font-weight: 800;
              padding: 1px 5px;
              border-radius: 10px;
              border: 1px solid ${pinColor};
              white-space: nowrap;
              box-shadow: 0 2px 5px rgba(0,0,0,0.4);
            ">
              ${isResolved ? 'FIXED' : `P-${cluster.priorityScore}`}
            </div>
            ${
              cluster.affectedCitizenCount > 1
                ? `<div style="
                    position: absolute;
                    top: -6px;
                    right: -6px;
                    background: #6366f1;
                    color: white;
                    font-size: 9px;
                    font-weight: bold;
                    width: 18px;
                    height: 18px;
                    border-radius: 50%;
                    border: 1.5px solid white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                  ">
                    ${cluster.affectedCitizenCount}
                  </div>`
                : ''
            }
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const marker = L.marker([cluster.coordinates.lat, cluster.coordinates.lng], { icon: customIcon });

      // Popup Content
      const popupHtml = `
        <div style="font-family: system-ui, sans-serif; min-width: 220px; color: #0f172a;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <span style="font-weight: 800; color: #0284c7; font-size: 12px;">${cluster.clusterCode}</span>
            <span style="background: ${pinColor}; color: white; padding: 2px 6px; border-radius: 6px; font-size: 11px; font-weight: bold;">
              Priority: ${cluster.priorityScore}
            </span>
          </div>
          <h4 style="margin: 0 0 6px 0; font-size: 13px; font-weight: 700; line-height: 1.3;">
            ${cluster.title}
          </h4>
          <div style="font-size: 11px; color: #64748b; margin-bottom: 6px;">
            📍 ${cluster.locationName}
          </div>
          <div style="display: flex; gap: 8px; font-size: 11px; margin-bottom: 8px; background: #f1f5f9; padding: 6px; border-radius: 6px;">
            <div>👥 <b>${cluster.affectedCitizenCount}</b> Citizen(s)</div>
            <div>🏢 <b>${cluster.department}</b></div>
          </div>
          <div style="font-size: 10px; color: #475569; margin-bottom: 8px; font-style: italic;">
            ${cluster.priorityBreakdown.explanation}
          </div>
          <div style="display: flex; gap: 6px;">
            <button id="btn-inspect-${cluster.id}" style="
              flex: 1;
              background: #0f172a;
              color: white;
              border: none;
              padding: 5px 8px;
              border-radius: 6px;
              font-size: 11px;
              font-weight: 600;
              cursor: pointer;
            ">
              View Cluster
            </button>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);

      marker.on('click', () => {
        onSelectCluster(cluster.id);
      });

      marker.on('popupopen', () => {
        setTimeout(() => {
          const btn = document.getElementById(`btn-inspect-${cluster.id}`);
          if (btn) {
            btn.onclick = () => onSelectCluster(cluster.id);
          }
        }, 50);
      });

      markersLayerRef.current?.addLayer(marker);

      // Geo Spread Perimeter Circle
      const clusterPerimeterCircle = L.circle([cluster.coordinates.lat, cluster.coordinates.lng], {
        radius: cluster.centroidRadiusMeters || 40,
        color: pinColor,
        weight: isSelected ? 2 : 1,
        fillColor: pinColor,
        fillOpacity: isSelected ? 0.2 : 0.08,
      });
      circlesLayerRef.current?.addLayer(clusterPerimeterCircle);
    });
  }, [clusters, selectedClusterId, onSelectCluster]);

  // Center Map when selected cluster changes
  useEffect(() => {
    if (!selectedClusterId || !mapInstanceRef.current) return;
    const selected = clusters.find((c) => c.id === selectedClusterId);
    if (selected) {
      mapInstanceRef.current.flyTo([selected.coordinates.lat, selected.coordinates.lng], 15, {
        duration: 0.8,
      });
    }
  }, [selectedClusterId, clusters]);

  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([13.0680, 80.2500], 13);
    }
  };

  return (
    <div className="relative w-full h-full min-h-[460px] rounded-2xl overflow-hidden shadow-sm border border-slate-200 bg-white">
      <div ref={mapContainerRef} className="w-full h-full min-h-[460px] z-10" />

      {/* Map Legend Overlay */}
      <div className="absolute top-4 right-4 z-20 bg-white/95 backdrop-blur-md p-3 rounded-xl border border-slate-200 shadow-md text-xs text-slate-700 pointer-events-auto max-w-[210px]">
        <div className="font-bold text-slate-900 mb-2 flex items-center justify-between">
          <span>Live Risk Priority</span>
          <button
            onClick={handleRecenter}
            className="text-[10px] text-sky-700 hover:text-sky-800 font-bold cursor-pointer"
          >
            Reset View
          </button>
        </div>
        <div className="space-y-1.5 font-medium">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500 animate-pulse border border-white"></span>
            <span>Critical Emergency (P &gt; 130)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-orange-500 border border-white"></span>
            <span>High Priority (P 90-130)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-500 border border-white"></span>
            <span>Medium Priority (P 50-90)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 border border-white"></span>
            <span>Resolved &amp; AI Verified</span>
          </div>
        </div>

        <div className="mt-2.5 pt-2 border-t border-slate-200 text-[10px] text-slate-500 font-medium space-y-1">
          <div className="flex items-center gap-1.5">
            <span>🏫</span>
            <span>School Buffer (300m +18)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span>🏥</span>
            <span>Hospital Buffer (500m +25)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
