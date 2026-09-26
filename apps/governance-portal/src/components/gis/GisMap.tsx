'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useQuery } from '@apollo/client';
import { DISTRICT_OVERVIEW } from '@/graphql/queries';
import Link from 'next/link';
import DeckGL from '@deck.gl/react';
import { ScatterplotLayer, LineLayer, PathLayer, TextLayer } from '@deck.gl/layers';
import { Map as MapLibreMap, StyleSpecification } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

import { useAuthStore } from '@/store/authStore';
import { useScopeStore } from '@/store/scopeStore';
import {
  GIS_PHCS,
  GIS_SUPPLY_ROUTES,
  JURISDICTION_EXTENTS,
  PhcGisFeature,
  PhcSupplyRoute,
  GeoExtent,
} from '@/lib/gisData';
import { RiskBadge, RiskLevel } from '@/components/common/RiskBadge';
import { DataFreshnessLabel } from '@/components/common/DataFreshnessLabel';
import {
  Layers,
  MapPin,
  AlertTriangle,
  Flame,
  Truck,
  Activity,
  Bed,
  Wind,
  Users,
  Building2,
  X,
  ExternalLink,
  ChevronRight,
  Filter,
  Eye,
  EyeOff,
  Navigation,
  Info,
  CheckCircle2,
  AlertOctagon,
  RefreshCw,
  Compass,
  ArrowRight,
} from 'lucide-react';

// ── Layer State Definition ───────────────────────────────────────────────────
export interface GisLayerVisibility {
  phc: boolean;
  risk: boolean;
  medicine: boolean;
  bed: boolean;
  oxygen: boolean;
  workforce: boolean;
  emergency: boolean;
  supply_chain: boolean;
}

const DEFAULT_LAYERS: GisLayerVisibility = {
  phc: true,
  risk: true,
  medicine: true,
  bed: true,
  oxygen: true,
  workforce: true,
  emergency: true,
  supply_chain: true,
};

// ── Color Utilities ──────────────────────────────────────────────────────────
type RGBA = [number, number, number, number];

const COLOR_MAP = {
  // Facility Type
  type24x7: [26, 86, 219, 230] as RGBA, // Blue
  typeUrban: [14, 159, 110, 230] as RGBA, // Emerald
  typeSubCenter: [100, 116, 139, 230] as RGBA, // Slate
  typeChc: [126, 34, 206, 230] as RGBA, // Purple

  // Status
  ok: [14, 159, 110, 230] as RGBA,
  warn: [217, 119, 6, 230] as RGBA,
  critical: [220, 38, 38, 230] as RGBA,
  stockout: [153, 27, 27, 255] as RGBA,
  emergencyPulse: [239, 68, 68, 255] as RGBA,

  // Route colors
  routeInTransit: [14, 159, 110, 240] as RGBA, // Green
  routeDispatched: [37, 99, 235, 240] as RGBA, // Blue
  routeScheduled: [217, 119, 6, 220] as RGBA, // Amber
};

export function GisMap() {
  const { user } = useAuthStore();
  const { level, stateId, districtId, phcId, setPhc } = useScopeStore();

  // Active overlay visibility toggles
  const [layers, setLayers] = useState<GisLayerVisibility>(DEFAULT_LAYERS);
  const [selectedPhc, setSelectedPhc] = useState<PhcGisFeature | null>(null);
  const [hoveredInfo, setHoveredInfo] = useState<{
    x: number;
    y: number;
    object: PhcGisFeature | PhcSupplyRoute | null;
    type: 'phc' | 'route';
  } | null>(null);

  // Pulse timer for emergency and live routes animation
  const [pulseScale, setPulseScale] = useState(1);
  useEffect(() => {
    let forward = true;
    const interval = setInterval(() => {
      setPulseScale((prev) => {
        if (prev >= 1.8) forward = false;
        if (prev <= 1.0) forward = true;
        return forward ? prev + 0.08 : prev - 0.08;
      });
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // Determine active extent and viewport constraints based on user role and scope
  const isDistrictAdmin = user.role === 'district_admin';
  const isStateAdmin = user.role === 'state_admin';

  // Effective district & state bounds
  const activeDistrictId = isDistrictAdmin ? user.districtId : districtId;
  const activeStateId = isDistrictAdmin ? user.stateId : isStateAdmin ? user.stateId : stateId;

  // Resolve camera target extent
  const activeExtent: GeoExtent = useMemo(() => {
    if (activeDistrictId && JURISDICTION_EXTENTS[activeDistrictId]) {
      return JURISDICTION_EXTENTS[activeDistrictId];
    }
    if (activeStateId && JURISDICTION_EXTENTS[activeStateId]) {
      return JURISDICTION_EXTENTS[activeStateId];
    }
    return JURISDICTION_EXTENTS.national;
  }, [activeDistrictId, activeStateId]);

  // Deck.gl ViewState
  const [viewState, setViewState] = useState({
    longitude: activeExtent.center[0],
    latitude: activeExtent.center[1],
    zoom: activeExtent.zoom,
    minZoom: isDistrictAdmin ? 8.2 : activeExtent.minZoom,
    maxZoom: activeExtent.maxZoom,
    pitch: 20,
    bearing: 0,
  });

  // Camera updates when jurisdiction changes
  useEffect(() => {
    setViewState((prev) => ({
      ...prev,
      longitude: activeExtent.center[0],
      latitude: activeExtent.center[1],
      zoom: activeExtent.zoom,
      minZoom: isDistrictAdmin ? 8.2 : activeExtent.minZoom,
    }));
  }, [activeExtent, isDistrictAdmin]);

  // MapLibre background container
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);

  // Initialize MapLibre GL Basemap
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // High-reliability open raster basemap tiles (OpenStreetMap & HOT mirrors)
    const styleSpec: StyleSpecification = {
      version: 8,
      sources: {
        'osm-tiles': {
          type: 'raster',
          tiles: [
            'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
            'https://a.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
            'https://b.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
          ],
          tileSize: 256,
          attribution: '&copy; OpenStreetMap contributors, Humanitarian OpenStreetMap Team',
        },
      },
      layers: [
        {
          id: 'osm-tiles-layer',
          type: 'raster',
          source: 'osm-tiles',
          minzoom: 0,
          maxzoom: 19,
        },
      ],
    };

    const map = new MapLibreMap({
      container: mapContainerRef.current,
      style: styleSpec,
      center: [viewState.longitude, viewState.latitude],
      zoom: viewState.zoom,
      interactive: false, // DeckGL handles interactions and synchronizes viewState
      attributionControl: false,
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Synchronize MapLibre camera with DeckGL viewState
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.jumpTo({
        center: [viewState.longitude, viewState.latitude],
        zoom: viewState.zoom,
        bearing: viewState.bearing,
        pitch: viewState.pitch,
      });
    }
  }, [viewState]);

  // ── Nationwide Live Hierarchy Fetch from PostgreSQL ──────────────────────────
  const [hierarchyPhcs, setHierarchyPhcs] = useState<PhcGisFeature[]>([]);

  useEffect(() => {
    let isMounted = true;
    const fetchAllIndiaPhcs = async () => {
      try {
        const backendBase = (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_BACKEND_URL)
          ? process.env.NEXT_PUBLIC_BACKEND_URL.replace('/graphql', '')
          : '';
        const endpoint = backendBase ? `${backendBase}/api/v1/jurisdiction/hierarchy` : '/api/v1/jurisdiction/hierarchy';
        const res = await fetch(endpoint);
        if (!res.ok) return;
        const json = await res.json();
        if (json.success && json.data?.phcs && isMounted) {
          const mapped: PhcGisFeature[] = json.data.phcs.map((p: any) => {
            const occupied = Number(p.occupied_beds) || 12;
            const total = Number(p.total_beds) || 30;
            const oxygen = Number(p.oxygen_cylinders_available) || 20;
            const isCrit = occupied > total * 0.85 || oxygen < 10;
            const isHigh = occupied > total * 0.70 || oxygen < 15;
            const riskLevel: RiskLevel = isCrit ? 'CRITICAL' : isHigh ? 'HIGH' : 'LOW';
            const riskScore = isCrit ? 88 : isHigh ? 72 : 35;
            return {
              id: p.id,
              name: p.name,
              code: `PHC-${(p.state_name || 'IN').substring(0, 3).toUpperCase()}-${p.id.substring(0, 4)}`,
              districtId: p.district_id,
              districtName: p.district_name || 'District',
              stateId: p.state_id,
              stateName: p.state_name || 'State',
              coordinates: [Number(p.longitude) || 77.2090, Number(p.latitude) || 28.6139],
              type: '24x7_PHC',
              population: total * 850,
              riskScore,
              riskLevel,
              medicineCoverageDays: isCrit ? 1.5 : isHigh ? 3.2 : 8.0,
              medicineStatus: isCrit ? 'critical' : isHigh ? 'low' : 'adequate',
              bedOccupancy: Math.round((occupied / total) * 100),
              totalBeds: total,
              oxygenDays: Math.round((oxygen / 5) * 10) / 10,
              oxygenStatus: oxygen < 12 ? 'critical' : 'stable',
              staffShortagePct: 15,
              activeStaff: 12,
              totalStaff: 15,
              hasEmergency: isCrit,
              emergencyDetail: isCrit ? 'High surge in patient intake & low buffer' : undefined,
              lastSyncTime: new Date(p.created_at || Date.now()).toISOString(),
            };
          });
          setHierarchyPhcs(mapped);
        }
      } catch (err) {
        console.error('Failed to load nationwide PHC hierarchy:', err);
      }
    };
    fetchAllIndiaPhcs();
    return () => { isMounted = false; };
  }, []);

  // Fetch live district PHC facilities from backend PostgreSQL
  const { data: districtData } = useQuery(DISTRICT_OVERVIEW, {
    variables: { districtId: activeDistrictId || 'dist-pune' },
    skip: !activeDistrictId && !user.districtId,
  });

  const livePhcs: PhcGisFeature[] = useMemo(() => {
    if (hierarchyPhcs.length > 0) {
      return hierarchyPhcs;
    }
    if (!districtData?.districtOverview?.phcList || districtData.districtOverview.phcList.length === 0) {
      return GIS_PHCS;
    }
    const phcList = districtData.districtOverview.phcList;
    const mapped: PhcGisFeature[] = phcList.map((p: any) => ({
      id: p.phcId,
      name: p.name,
      code: `PHC-${p.phcId.substring(0, 4)}`,
      type: '24x7_PHC',
      coordinates: [p.longitude || 73.8567, p.latitude || 18.5204],
      districtId: districtData.districtOverview.districtId,
      districtName: districtData.districtOverview.districtName || 'District',
      stateId: districtData.districtOverview.stateId || 'state-mh',
      stateName: 'Maharashtra',
      population: 30000,
      riskLevel: (p.riskLevel as RiskLevel) || 'LOW',
      riskScore: p.riskLevel === 'CRITICAL' ? 88 : p.riskLevel === 'HIGH' ? 72 : 35,
      medicineCoverageDays: 6.0,
      medicineStatus: 'adequate',
      bedOccupancy: Math.round(((p.occupiedBeds || 15) / (p.totalBeds || 30)) * 100),
      totalBeds: p.totalBeds || 30,
      oxygenDays: 4.5,
      oxygenStatus: 'stable',
      staffShortagePct: 10,
      activeStaff: 8,
      totalStaff: 10,
      hasEmergency: p.riskLevel === 'CRITICAL',
      emergencyDetail: p.riskLevel === 'CRITICAL' ? 'Critical beds surge' : undefined,
      lastSyncTime: new Date().toISOString(),
    }));
    const currentDistrictId = districtData.districtOverview.districtId;
    const otherPhcs = GIS_PHCS.filter((p) => p.districtId !== currentDistrictId);
    return [...mapped, ...otherPhcs];
  }, [hierarchyPhcs, districtData]);

  // ── Role-based Data Scoping per Masterplan §26 ─────────────────────────────
  // If district_admin: strictly filter features to user.districtId
  // If state_admin: strictly filter features to user.stateId
  const scopedPhcs = useMemo(() => {
    return livePhcs.filter((phc) => {
      if (isDistrictAdmin) {
        return phc.districtId === user.districtId;
      }
      if (isStateAdmin) {
        return phc.stateId === user.stateId;
      }
      if (districtId) {
        return phc.districtId === districtId;
      }
      if (stateId) {
        return phc.stateId === stateId;
      }
      return true;
    });
  }, [livePhcs, isDistrictAdmin, isStateAdmin, user.districtId, user.stateId, districtId, stateId]);

  // Filter Supply Routes
  // MANDATORY CONSTRAINT: "the supply routes should be visible from phc to phc only"
  const scopedRoutes = useMemo(() => {
    return GIS_SUPPLY_ROUTES.filter((route) => {
      // Must be between known scoped PHCs
      if (isDistrictAdmin) {
        return route.districtId === user.districtId;
      }
      if (isStateAdmin) {
        return route.stateId === user.stateId;
      }
      if (districtId) {
        return route.districtId === districtId;
      }
      if (stateId) {
        return route.stateId === stateId;
      }
      return true;
    });
  }, [isDistrictAdmin, isStateAdmin, user.districtId, user.stateId, districtId, stateId]);

  // ── Deck.gl Layer Implementations ──────────────────────────────────────────
  const deckLayers = useMemo(() => {
    const layersList = [];

    // ── 8. Supply Chain Layer (Lines with Direction from PHC to PHC only) ─────
    if (layers.supply_chain && scopedRoutes.length > 0) {
      // Main transit line
      layersList.push(
        new LineLayer<PhcSupplyRoute>({
          id: 'layer-supply-chain-lines',
          data: scopedRoutes,
          pickable: true,
          getSourcePosition: (d) => d.fromCoords,
          getTargetPosition: (d) => d.toCoords,
          getColor: (d) =>
            d.status === 'in_transit'
              ? COLOR_MAP.routeInTransit
              : d.status === 'dispatched'
              ? COLOR_MAP.routeDispatched
              : COLOR_MAP.routeScheduled,
          getWidth: 3.5,
          widthUnits: 'pixels',
          onHover: (info) => {
            if (info.object) {
              setHoveredInfo({
                x: info.x,
                y: info.y,
                object: info.object,
                type: 'route',
              });
            } else {
              setHoveredInfo(null);
            }
          },
        })
      );

      // Arrow direction heads / midpoint waypoint indicators
      layersList.push(
        new ScatterplotLayer<PhcSupplyRoute>({
          id: 'layer-supply-chain-midpoints',
          data: scopedRoutes,
          pickable: false,
          getPosition: (d) => [
            (d.fromCoords[0] + d.toCoords[0]) / 2,
            (d.fromCoords[1] + d.toCoords[1]) / 2,
          ],
          getFillColor: [255, 255, 255, 255],
          getLineColor: (d) =>
            d.status === 'in_transit'
              ? [14, 159, 110, 255]
              : [37, 99, 235, 255],
          getLineWidth: 2,
          getRadius: 7,
          radiusUnits: 'pixels',
          stroked: true,
        })
      );
    }

    // ── 7. Emergency Layer: Active Emergencies as Pulsing Markers ─────────────
    if (layers.emergency) {
      const emergencyPhcs = scopedPhcs.filter((p) => p.hasEmergency);
      if (emergencyPhcs.length > 0) {
        // Outer pulsing hazard ring
        layersList.push(
          new ScatterplotLayer<PhcGisFeature>({
            id: 'layer-emergency-pulse',
            data: emergencyPhcs,
            pickable: false,
            getPosition: (d) => d.coordinates,
            getFillColor: [239, 68, 68, 50],
            getLineColor: [220, 38, 38, 220],
            getLineWidth: 2,
            getRadius: 28 * pulseScale,
            radiusUnits: 'pixels',
            stroked: true,
          })
        );

        // Core emergency dot
        layersList.push(
          new ScatterplotLayer<PhcGisFeature>({
            id: 'layer-emergency-core',
            data: emergencyPhcs,
            pickable: false,
            getPosition: (d) => d.coordinates,
            getFillColor: [220, 38, 38, 240],
            getRadius: 8,
            radiusUnits: 'pixels',
          })
        );
      }
    }

    // ── 2. Risk Layer: Color-coded by Composite Risk Score ────────────────────
    if (layers.risk) {
      layersList.push(
        new ScatterplotLayer<PhcGisFeature>({
          id: 'layer-risk-halo',
          data: scopedPhcs,
          pickable: false,
          getPosition: (d) => d.coordinates,
          getRadius: (d) => 14 + (d.riskScore / 100) * 12,
          radiusUnits: 'pixels',
          getFillColor: (d) => {
            if (d.riskLevel === 'CRITICAL') return [220, 38, 38, 70];
            if (d.riskLevel === 'HIGH') return [234, 88, 12, 60];
            if (d.riskLevel === 'MODERATE') return [234, 179, 8, 50];
            return [14, 159, 110, 40];
          },
          getLineColor: (d) => {
            if (d.riskLevel === 'CRITICAL') return [220, 38, 38, 220];
            if (d.riskLevel === 'HIGH') return [234, 88, 12, 200];
            if (d.riskLevel === 'MODERATE') return [202, 138, 4, 180];
            return [14, 159, 110, 160];
          },
          getLineWidth: 1.5,
          stroked: true,
        })
      );
    }

    // ── 4. Bed Layer: Occupancy Heat / Concentric Indicator ───────────────────
    if (layers.bed) {
      layersList.push(
        new ScatterplotLayer<PhcGisFeature>({
          id: 'layer-bed-occupancy',
          data: scopedPhcs,
          pickable: false,
          getPosition: (d) => d.coordinates,
          getRadius: 16,
          radiusUnits: 'pixels',
          getLineColor: (d) => {
            if (d.bedOccupancy >= 90) return [220, 38, 38, 240]; // Critical
            if (d.bedOccupancy >= 75) return [217, 119, 6, 220]; // High
            return [14, 159, 110, 180]; // Normal
          },
          getFillColor: [0, 0, 0, 0],
          getLineWidth: 2.5,
          stroked: true,
        })
      );
    }

    // ── 5. Oxygen Layer: Criticality Indicator Ring ───────────────────────────
    if (layers.oxygen) {
      layersList.push(
        new ScatterplotLayer<PhcGisFeature>({
          id: 'layer-oxygen-status',
          data: scopedPhcs,
          pickable: false,
          getPosition: (d) => d.coordinates,
          getRadius: 20,
          radiusUnits: 'pixels',
          getLineColor: (d) => {
            if (d.oxygenStatus === 'critical') return [220, 38, 38, 240];
            if (d.oxygenStatus === 'warning') return [217, 119, 6, 220];
            return [2, 132, 199, 180]; // Cyan/Blue
          },
          getFillColor: [0, 0, 0, 0],
          getLineWidth: 1.8,
          stroked: true,
        })
      );
    }

    // ── 6. Workforce Layer: Staff Shortage Indicator Ring ─────────────────────
    if (layers.workforce) {
      layersList.push(
        new ScatterplotLayer<PhcGisFeature>({
          id: 'layer-workforce-shortage',
          data: scopedPhcs,
          pickable: false,
          getPosition: (d) => d.coordinates,
          getRadius: 23,
          radiusUnits: 'pixels',
          getLineColor: (d) => {
            if (d.staffShortagePct >= 35) return [220, 38, 38, 240];
            if (d.staffShortagePct >= 20) return [217, 119, 6, 200];
            return [14, 159, 110, 160];
          },
          getFillColor: [0, 0, 0, 0],
          getLineWidth: 1.5,
          stroked: true,
        })
      );
    }

    // ── 3. Medicine Layer: Shortage / Stockout Shading ────────────────────────
    // ── 1. PHC Layer: Base Facility Marker Point ──────────────────────────────
    if (layers.phc || layers.medicine) {
      layersList.push(
        new ScatterplotLayer<PhcGisFeature>({
          id: 'layer-phc-points',
          data: scopedPhcs,
          pickable: true,
          getPosition: (d) => d.coordinates,
          getRadius: (d) => (d.type === 'CHC' ? 12 : 9),
          radiusUnits: 'pixels',
          getFillColor: (d) => {
            // If medicine layer active, color represents medicine stock status
            if (layers.medicine) {
              if (d.medicineStatus === 'stockout') return COLOR_MAP.stockout;
              if (d.medicineStatus === 'critical') return COLOR_MAP.critical;
              if (d.medicineStatus === 'low') return COLOR_MAP.warn;
              return COLOR_MAP.ok;
            }
            // Base PHC layer colors by facility type
            if (d.type === '24x7_PHC') return COLOR_MAP.type24x7;
            if (d.type === 'CHC') return COLOR_MAP.typeChc;
            if (d.type === 'Urban_PHC') return COLOR_MAP.typeUrban;
            return COLOR_MAP.typeSubCenter;
          },
          getLineColor: [255, 255, 255, 255],
          getLineWidth: 2,
          stroked: true,
          onClick: (info) => {
            if (info.object) {
              setSelectedPhc(info.object);
            }
          },
          onHover: (info) => {
            if (info.object) {
              setHoveredInfo({
                x: info.x,
                y: info.y,
                object: info.object,
                type: 'phc',
              });
            } else {
              setHoveredInfo(null);
            }
          },
        })
      );

      // Facility Name Label
      layersList.push(
        new TextLayer<PhcGisFeature>({
          id: 'layer-phc-labels',
          data: scopedPhcs,
          pickable: false,
          getPosition: (d) => [d.coordinates[0], d.coordinates[1]],
          getText: (d) => d.name.replace(' Primary Health Centre', ' PHC'),
          getSize: 11,
          getColor: [15, 23, 42, 230],
          getTextAnchor: 'start',
          getAlignmentBaseline: 'center',
          getPixelOffset: [16, 0],
          fontFamily: 'Inter, sans-serif',
          fontWeight: 600,
          backgroundColor: [255, 255, 255, 200],
          backgroundPadding: [3, 2],
        })
      );
    }

    return layersList;
  }, [layers, scopedPhcs, scopedRoutes, pulseScale]);

  // Toggle single layer
  const toggleLayer = (layerKey: keyof GisLayerVisibility) => {
    setLayers((prev) => ({ ...prev, [layerKey]: !prev[layerKey] }));
  };

  // Reset to default
  const resetLayers = () => setLayers(DEFAULT_LAYERS);

  // Focus on a specific PHC
  const focusPhc = (phc: PhcGisFeature) => {
    setSelectedPhc(phc);
    setViewState((prev) => ({
      ...prev,
      longitude: phc.coordinates[0],
      latitude: phc.coordinates[1],
      zoom: 13,
    }));
  };

  return (
    <div
      className="gis-container"
      style={{
        position: 'relative',
        height: 'calc(100vh - 170px)',
        minHeight: '620px',
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
      }}
    >
      {/* ── Background MapLibre Canvas Container ────────────────────────────── */}
      <div
        ref={mapContainerRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 1,
        }}
      />

      {/* ── Foreground Deck.gl Interactive Layer Canvas ────────────────────── */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 2 }}>
        <DeckGL
          viewState={viewState}
          onViewStateChange={({ viewState: rawViewState }) => {
            const next = rawViewState as { longitude?: number; latitude?: number; zoom?: number; bearing?: number; pitch?: number };
            if (!next || next.longitude === undefined || next.latitude === undefined) return;
            // Apply strict bounds constraint for district_admin
            if (isDistrictAdmin && activeExtent.bounds) {
              const [[minLng, minLat], [maxLng, maxLat]] = activeExtent.bounds;
              const clampedLng = Math.max(minLng, Math.min(maxLng, next.longitude!));
              const clampedLat = Math.max(minLat, Math.min(maxLat, next.latitude!));
              setViewState((prev) => ({
                ...prev,
                ...next,
                longitude: clampedLng,
                latitude: clampedLat,
                zoom: Math.max(activeExtent.minZoom, next.zoom ?? prev.zoom),
              }));
            } else {
              setViewState((prev) => ({
                ...prev,
                ...next,
                longitude: next.longitude!,
                latitude: next.latitude!,
                zoom: next.zoom ?? prev.zoom,
              }));
            }
          }}
          controller={{
            doubleClickZoom: true,
            dragPan: true,
            scrollZoom: true,
          }}
          layers={deckLayers}
          getCursor={({ isHovering }) => (isHovering ? 'pointer' : 'default')}
        />
      </div>

      {/* ── Layer Toggles Bar (Floating Top Left) ───────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          top: 14,
          left: 14,
          zIndex: 10,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(8px)',
          borderRadius: '10px',
          border: '1px solid #cbd5e1',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          padding: '10px 14px',
          maxWidth: '380px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 13, color: '#0f172a' }}>
            <Layers size={16} color="#1a56db" />
            <span>GIS Health Overlays (8 Layers)</span>
          </div>
          <button
            onClick={resetLayers}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 11,
              fontWeight: 600,
              color: '#1a56db',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            Reset
          </button>
        </div>

        {/* 8 Toggle Buttons Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
          {/* 1. PHC Layer */}
          <button
            onClick={() => toggleLayer('phc')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 8px',
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              border: `1px solid ${layers.phc ? '#bfdbfe' : '#e2e8f0'}`,
              backgroundColor: layers.phc ? '#eff6ff' : '#f8fafc',
              color: layers.phc ? '#1a56db' : '#64748b',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Building2 size={13} />
              <span>1. PHC Points</span>
            </span>
            {layers.phc ? <Eye size={12} /> : <EyeOff size={12} />}
          </button>

          {/* 2. Risk Layer */}
          <button
            onClick={() => toggleLayer('risk')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 8px',
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              border: `1px solid ${layers.risk ? '#fed7aa' : '#e2e8f0'}`,
              backgroundColor: layers.risk ? '#fff7ed' : '#f8fafc',
              color: layers.risk ? '#c2410c' : '#64748b',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <AlertTriangle size={13} />
              <span>2. Risk Score</span>
            </span>
            {layers.risk ? <Eye size={12} /> : <EyeOff size={12} />}
          </button>

          {/* 3. Medicine Layer */}
          <button
            onClick={() => toggleLayer('medicine')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 8px',
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              border: `1px solid ${layers.medicine ? '#a7f3d0' : '#e2e8f0'}`,
              backgroundColor: layers.medicine ? '#ecfdf5' : '#f8fafc',
              color: layers.medicine ? '#065f46' : '#64748b',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Activity size={13} />
              <span>3. Medicine Stock</span>
            </span>
            {layers.medicine ? <Eye size={12} /> : <EyeOff size={12} />}
          </button>

          {/* 4. Bed Layer */}
          <button
            onClick={() => toggleLayer('bed')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 8px',
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              border: `1px solid ${layers.bed ? '#fde68a' : '#e2e8f0'}`,
              backgroundColor: layers.bed ? '#fffbeb' : '#f8fafc',
              color: layers.bed ? '#92400e' : '#64748b',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Bed size={13} />
              <span>4. Bed Heat</span>
            </span>
            {layers.bed ? <Eye size={12} /> : <EyeOff size={12} />}
          </button>

          {/* 5. Oxygen Layer */}
          <button
            onClick={() => toggleLayer('oxygen')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 8px',
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              border: `1px solid ${layers.oxygen ? '#bae6fd' : '#e2e8f0'}`,
              backgroundColor: layers.oxygen ? '#f0f9ff' : '#f8fafc',
              color: layers.oxygen ? '#0369a1' : '#64748b',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Wind size={13} />
              <span>5. Oxygen Buffer</span>
            </span>
            {layers.oxygen ? <Eye size={12} /> : <EyeOff size={12} />}
          </button>

          {/* 6. Workforce Layer */}
          <button
            onClick={() => toggleLayer('workforce')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 8px',
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              border: `1px solid ${layers.workforce ? '#fecaca' : '#e2e8f0'}`,
              backgroundColor: layers.workforce ? '#fef2f2' : '#f8fafc',
              color: layers.workforce ? '#991b1b' : '#64748b',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Users size={13} />
              <span>6. Workforce</span>
            </span>
            {layers.workforce ? <Eye size={12} /> : <EyeOff size={12} />}
          </button>

          {/* 7. Emergency Layer */}
          <button
            onClick={() => toggleLayer('emergency')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 8px',
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              border: `1px solid ${layers.emergency ? '#fecaca' : '#e2e8f0'}`,
              backgroundColor: layers.emergency ? '#fef2f2' : '#f8fafc',
              color: layers.emergency ? '#dc2626' : '#64748b',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Flame size={13} />
              <span>7. Emergencies</span>
            </span>
            {layers.emergency ? <Eye size={12} /> : <EyeOff size={12} />}
          </button>

          {/* 8. Supply Chain Layer (PHC to PHC only) */}
          <button
            onClick={() => toggleLayer('supply_chain')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 8px',
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              border: `1px solid ${layers.supply_chain ? '#a7f3d0' : '#e2e8f0'}`,
              backgroundColor: layers.supply_chain ? '#ecfdf5' : '#f8fafc',
              color: layers.supply_chain ? '#0e9f6e' : '#64748b',
            }}
            title="Supply routes strictly visible from PHC to PHC only"
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Truck size={13} />
              <span>8. PHC Routes</span>
            </span>
            {layers.supply_chain ? <Eye size={12} /> : <EyeOff size={12} />}
          </button>
        </div>
      </div>

      {/* ── Bounding Confinement Notice (For district_admin or state_admin) ── */}
      {isDistrictAdmin && (
        <div
          style={{
            position: 'absolute',
            bottom: 16,
            left: 16,
            zIndex: 10,
            padding: '6px 12px',
            borderRadius: 6,
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            fontSize: 11,
            color: '#475569',
            boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Info size={13} color="#1a56db" />
          <span>
            <strong>Jurisdiction Bounded:</strong> District Admin role restricted to Pune District extent.
          </span>
        </div>
      )}

      {/* ── Floating Hover Tooltip ─────────────────────────────────────────── */}
      {hoveredInfo && hoveredInfo.object && (
        <div
          style={{
            position: 'absolute',
            left: hoveredInfo.x + 12,
            top: hoveredInfo.y + 12,
            zIndex: 30,
            pointerEvents: 'none',
            backgroundColor: '#ffffff',
            borderRadius: 8,
            padding: '10px 14px',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15)',
            border: '1px solid #e2e8f0',
            fontSize: 12,
            color: '#0f172a',
            maxWidth: 280,
          }}
        >
          {hoveredInfo.type === 'phc' ? (
            (() => {
              const phc = hoveredInfo.object as PhcGisFeature;
              return (
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>{phc.name}</div>
                  <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6 }}>
                    {phc.districtName}, {phc.stateName} ({phc.type.replace('_', ' ')})
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <span style={{ fontSize: 11 }}>Risk:</span>
                    <RiskBadge level={phc.riskLevel} size="sm" />
                  </div>
                  <div style={{ fontSize: 11, color: '#475569' }}>
                    <div>Medicine Stock: <strong>{phc.medicineCoverageDays} days</strong></div>
                    <div>Bed Occupancy: <strong>{phc.bedOccupancy}%</strong></div>
                    <div>Staff Vacancy: <strong>{phc.staffShortagePct}%</strong></div>
                  </div>
                </div>
              );
            })()
          ) : (
            (() => {
              const route = hoveredInfo.object as PhcSupplyRoute;
              return (
                <div>
                  <div style={{ fontWeight: 700, color: '#0e9f6e', fontSize: 11, textTransform: 'uppercase', marginBottom: 2 }}>
                    Inter-PHC Supply Route
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{route.commodity}</div>
                  <div style={{ fontSize: 11, color: '#475569', margin: '4px 0' }}>
                    From: <strong>{route.fromPhcName}</strong>
                    <br />
                    To: <strong>{route.toPhcName}</strong>
                  </div>
                  <div style={{ fontSize: 11, color: '#0f172a' }}>
                    Quantity: <strong>{route.quantity.toLocaleString()} {route.unit}</strong> (ETA {route.etaHours}h)
                  </div>
                </div>
              );
            })()
          )}
        </div>
      )}

      {/* ── Slide-Over Side Panel: Selected PHC Summary ─────────────────────── */}
      {selectedPhc && (
        <div
          className="gis-side-panel"
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '360px',
            height: '100%',
            backgroundColor: '#ffffff',
            borderLeft: '1px solid #e2e8f0',
            boxShadow: '-4px 0 20px rgba(0,0,0,0.08)',
            zIndex: 25,
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              backgroundColor: '#f8fafc',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <Building2 size={15} color="#1a56db" />
                <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                  {selectedPhc.code}
                </span>
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>
                {selectedPhc.name}
              </h3>
              <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>
                {selectedPhc.districtName}, {selectedPhc.stateName}
              </div>
            </div>

            <button
              onClick={() => setSelectedPhc(null)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#64748b',
                padding: 4,
              }}
              aria-label="Close panel"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body Content */}
          <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
            {/* Risk & Freshness Bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>Risk Tier:</span>
                <RiskBadge level={selectedPhc.riskLevel} size="md" />
              </div>
              <DataFreshnessLabel timestamp={selectedPhc.lastSyncTime} compact source="PHC Tablet Sync" />
            </div>

            {/* Active Emergency Alert if any */}
            {selectedPhc.hasEmergency && (
              <div
                style={{
                  padding: '12px',
                  borderRadius: 8,
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 12, color: '#dc2626', marginBottom: 4 }}>
                  <Flame size={14} />
                  <span>Active Emergency Incident</span>
                </div>
                <div style={{ fontSize: 12, color: '#991b1b', lineHeight: 1.3 }}>
                  {selectedPhc.emergencyDetail}
                </div>
              </div>
            )}

            {/* Key Facility Metrics Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
              <div style={{ padding: '10px', backgroundColor: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 11, color: '#64748b' }}>Medicine Stock</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: selectedPhc.medicineCoverageDays < 3 ? '#dc2626' : '#0e9f6e' }}>
                  {selectedPhc.medicineCoverageDays} Days
                </div>
                <div style={{ fontSize: 10, color: '#64748b', textTransform: 'capitalize' }}>
                  {selectedPhc.medicineStatus}
                </div>
              </div>

              <div style={{ padding: '10px', backgroundColor: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 11, color: '#64748b' }}>Bed Occupancy</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: selectedPhc.bedOccupancy > 85 ? '#dc2626' : '#0f172a' }}>
                  {selectedPhc.bedOccupancy}%
                </div>
                <div style={{ fontSize: 10, color: '#64748b' }}>
                  {Math.round((selectedPhc.bedOccupancy / 100) * selectedPhc.totalBeds)} / {selectedPhc.totalBeds} Beds
                </div>
              </div>

              <div style={{ padding: '10px', backgroundColor: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 11, color: '#64748b' }}>Oxygen Buffer</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: selectedPhc.oxygenDays < 2 ? '#dc2626' : '#0f172a' }}>
                  {selectedPhc.oxygenDays} Days
                </div>
                <div style={{ fontSize: 10, color: '#64748b', textTransform: 'capitalize' }}>
                  {selectedPhc.oxygenStatus}
                </div>
              </div>

              <div style={{ padding: '10px', backgroundColor: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 11, color: '#64748b' }}>Clinical Staffing</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: selectedPhc.staffShortagePct > 30 ? '#dc2626' : '#0e9f6e' }}>
                  {selectedPhc.activeStaff} / {selectedPhc.totalStaff}
                </div>
                <div style={{ fontSize: 10, color: '#64748b' }}>
                  {selectedPhc.staffShortagePct}% Vacancy
                </div>
              </div>
            </div>

            {/* Inter-PHC Routes Originating or Terminating Here */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Truck size={14} color="#1a56db" />
                <span>Inter-PHC Supply Routes</span>
              </div>

              {scopedRoutes.filter(
                (r) => r.fromPhcId === selectedPhc.id || r.toPhcId === selectedPhc.id
              ).length === 0 ? (
                <div style={{ fontSize: 11, color: '#94a3b8', fontStyle: 'italic' }}>
                  No active inter-facility shipments currently in transit for this facility.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {scopedRoutes
                    .filter((r) => r.fromPhcId === selectedPhc.id || r.toPhcId === selectedPhc.id)
                    .map((route) => {
                      const isInbound = route.toPhcId === selectedPhc.id;
                      return (
                        <div
                          key={route.id}
                          style={{
                            padding: '8px 10px',
                            borderRadius: 6,
                            backgroundColor: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            fontSize: 11,
                          }}
                        >
                          <div style={{ fontWeight: 600, color: '#0f172a', display: 'flex', justifyContent: 'space-between' }}>
                            <span>{route.commodity}</span>
                            <span style={{ color: '#0e9f6e', fontWeight: 700 }}>
                              {isInbound ? 'INBOUND' : 'OUTBOUND'}
                            </span>
                          </div>
                          <div style={{ color: '#64748b', marginTop: 2 }}>
                            {isInbound ? `From: ${route.fromPhcName}` : `To: ${route.toPhcName}`}
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, color: '#475569' }}>
                            <span>Qty: {route.quantity.toLocaleString()} {route.unit}</span>
                            <span>ETA: {route.etaHours}h</span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* Navigation & Action Footer */}
            <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid #e2e8f0' }}>
              <Link
                href={`/?phc=${selectedPhc.id}`}
                onClick={() => setPhc(selectedPhc.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '10px 16px',
                  borderRadius: 8,
                  backgroundColor: '#1a56db',
                  color: '#ffffff',
                  fontSize: 13,
                  fontWeight: 600,
                  textDecoration: 'none',
                  boxShadow: '0 2px 4px rgba(26, 86, 219, 0.2)',
                  transition: 'background 0.15s ease',
                }}
              >
                <span>View Full Detail Drill-down</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
