import React, { useState } from 'react';
import {
  MapPin,
  ShieldCheck,
  ShieldAlert,
  Award,
  PlusCircle,
  LayoutDashboard,
  Utensils,
  UserCheck,
  Building2,
  FileCode2,
  ChevronDown,
  Compass,
} from 'lucide-react';
import { User } from '../utils/foodshare-logic';
import { INDIAN_LOCATIONS, LocationOption } from '../types';

interface NavbarProps {
  currentUser: User;
  allUsers: User[];
  onSelectUser: (user: User) => void;
  currentLocation: LocationOption;
  onSelectLocation: (loc: LocationOption) => void;
  radiusKm: number;
  onChangeRadius: (radius: number) => void;
  activeTab: string;
  onChangeTab: (tab: string) => void;
  onOpenCreateDonation: () => void;
  onOpenBackendDocs: () => void;
  pendingVerificationsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  allUsers,
  onSelectUser,
  currentLocation,
  onSelectLocation,
  radiusKm,
  onChangeRadius,
  activeTab,
  onChangeTab,
  onOpenCreateDonation,
  onOpenBackendDocs,
  pendingVerificationsCount,
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLocationMenu, setShowLocationMenu] = useState(false);
  const [customLat, setCustomLat] = useState('');
  const [customLon, setCustomLon] = useState('');

  const handleUseBrowserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          onSelectLocation({
            name: 'GPS Device Location (India)',
            state: 'India',
            pincode: 'Current',
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
          setShowLocationMenu(false);
        },
        () => {
          alert('Could not access browser location. Please select an Indian city manually.');
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  };

  const handleApplyCustomCoords = (e: React.FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(customLat);
    const lon = parseFloat(customLon);
    if (!isNaN(lat) && !isNaN(lon)) {
      onSelectLocation({
        name: `Custom (${lat.toFixed(3)}, ${lon.toFixed(3)})`,
        state: 'Custom GPS',
        pincode: 'Direct',
        latitude: lat,
        longitude: lon,
      });
      setShowLocationMenu(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-stone-900 border-b border-stone-800 text-stone-100 shadow-md">
      {/* Top Banner: India Platform and Role Status */}
      <div className="bg-stone-950 px-4 py-1.5 border-b border-stone-800 text-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 font-medium text-[11px] border border-emerald-800/60">
            🇮🇳 India Only
          </span>
          <span className="text-stone-400 hidden sm:inline">
            Zero Hunger & Food Waste Reduction Initiative • DPDP Act 2023 Compliant
          </span>
        </div>

        {/* Current Active User Status Bar */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-stone-400">Acting as:</span>
            <span className="font-semibold text-amber-400">{currentUser.name}</span>
            <span className="text-[11px] px-1.5 py-0.2 rounded uppercase font-bold tracking-wider bg-stone-800 text-stone-300">
              {currentUser.role}
            </span>
          </div>

          {currentUser.verificationStatus === 'verified' ? (
            <span className="inline-flex items-center gap-1 text-emerald-400 text-xs font-medium">
              <ShieldCheck className="w-3.5 h-3.5" /> Verified
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-amber-400 text-xs font-medium bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800/40">
              <ShieldAlert className="w-3.5 h-3.5" /> Pending Verification
            </span>
          )}

          {/* Quick Switch Persona Button */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-1 text-xs bg-stone-800 hover:bg-stone-700 px-2 py-0.5 rounded text-stone-200 border border-stone-700 transition"
              title="Switch user account or test different roles"
            >
              Switch Role <ChevronDown className="w-3 h-3" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-1.5 w-72 bg-stone-900 border border-stone-700 rounded-lg shadow-2xl py-2 z-50 text-stone-200">
                <div className="px-3 py-1 text-[11px] font-semibold text-stone-400 uppercase tracking-wider border-b border-stone-800">
                  Switch Active Persona
                </div>
                <div className="max-h-64 overflow-y-auto py-1">
                  {allUsers.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => {
                        onSelectUser(u);
                        setShowUserMenu(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs hover:bg-stone-800 flex items-start justify-between gap-2 transition ${
                        currentUser.id === u.id ? 'bg-stone-800/80 text-emerald-400' : ''
                      }`}
                    >
                      <div>
                        <div className="font-medium text-stone-100">{u.name}</div>
                        <div className="text-[11px] text-stone-400 capitalize">
                          {u.role} • {u.city}
                        </div>
                      </div>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-semibold ${
                          u.verificationStatus === 'verified'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/50'
                            : 'bg-amber-950 text-amber-400 border border-amber-800/50'
                        }`}
                      >
                        {u.verificationStatus}
                      </span>
                    </button>
                  ))}
                </div>
                <div className="border-t border-stone-800 px-3 pt-2 text-[11px] text-stone-400">
                  All testing personas interact with real database records.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center shadow-lg shadow-emerald-900/30 text-white font-black text-xl tracking-tight">
            FS
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg text-white tracking-tight">FoodShare</span>
              <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30">
                India
              </span>
            </div>
            <p className="text-[11px] text-stone-400">Surplus Food Rescue & Verification</p>
          </div>
        </div>

        {/* Location & Radius Selector */}
        <div className="flex items-center gap-2 bg-stone-800/90 border border-stone-700/80 rounded-xl p-1 shadow-inner text-xs">
          {/* Location Picker */}
          <div className="relative">
            <button
              onClick={() => setShowLocationMenu(!showLocationMenu)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900/80 hover:bg-stone-900 text-stone-200 transition"
              title="Change your search location in India"
            >
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-medium truncate max-w-[150px]">{currentLocation.name}</span>
              <ChevronDown className="w-3 h-3 text-stone-400" />
            </button>

            {showLocationMenu && (
              <div className="absolute left-0 mt-2 w-80 bg-stone-900 border border-stone-700 rounded-xl shadow-2xl p-3 z-50">
                <div className="text-xs font-bold text-stone-300 mb-2 flex items-center justify-between">
                  <span>Select Location in India</span>
                  <button
                    onClick={handleUseBrowserLocation}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 underline"
                  >
                    <Compass className="w-3 h-3" /> Use GPS
                  </button>
                </div>

                <div className="text-[11px] text-stone-400 mb-2">
                  Haversine distance is calculated from these coordinates:
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                  {INDIAN_LOCATIONS.map((loc) => (
                    <button
                      key={loc.name}
                      onClick={() => {
                        onSelectLocation(loc);
                        setShowLocationMenu(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded text-xs flex items-center justify-between hover:bg-stone-800 transition ${
                        currentLocation.name === loc.name ? 'bg-emerald-950/60 text-emerald-300 font-semibold' : 'text-stone-300'
                      }`}
                    >
                      <span>{loc.name}</span>
                      <span className="text-[10px] text-stone-500">{loc.pincode}</span>
                    </button>
                  ))}
                </div>

                {/* Custom coordinates form */}
                <form onSubmit={handleApplyCustomCoords} className="mt-3 pt-2 border-t border-stone-800 text-[11px]">
                  <div className="text-stone-400 font-medium mb-1">Manual Coordinates (Lat / Lon):</div>
                  <div className="flex gap-1.5">
                    <input
                      type="number"
                      step="0.0001"
                      placeholder="Lat e.g. 12.97"
                      value={customLat}
                      onChange={(e) => setCustomLat(e.target.value)}
                      className="w-1/2 bg-stone-950 border border-stone-700 px-2 py-1 rounded text-stone-200"
                    />
                    <input
                      type="number"
                      step="0.0001"
                      placeholder="Lon e.g. 77.59"
                      value={customLon}
                      onChange={(e) => setCustomLon(e.target.value)}
                      className="w-1/2 bg-stone-950 border border-stone-700 px-2 py-1 rounded text-stone-200"
                    />
                  </div>
                  <button
                    type="submit"
                    className="mt-1.5 w-full bg-emerald-700 hover:bg-emerald-600 text-white py-1 rounded font-medium text-xs transition"
                  >
                    Apply Coordinates
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Search Radius Options (5 km default, 10 km, 20 km, 50 km) */}
          <div className="flex items-center gap-1 pl-1 border-l border-stone-700">
            <span className="text-stone-400 text-[11px] hidden sm:inline">Radius:</span>
            {[5, 10, 20, 50].map((r) => (
              <button
                key={r}
                onClick={() => onChangeRadius(r)}
                className={`px-2 py-1 rounded text-xs font-semibold transition ${
                  radiusKm === r
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
                }`}
                title={`Find food donations within ${r} km`}
              >
                {r}km
              </button>
            ))}
          </div>
        </div>

        {/* Primary Action: Post Food */}
        <div className="flex items-center gap-2">
          {(currentUser.role === 'donor' || currentUser.role === 'admin' || currentUser.role === 'ngo') && (
            <button
              onClick={onOpenCreateDonation}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-3.5 py-1.5 rounded-xl shadow-md shadow-emerald-950 text-xs transition transform active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Donate Food</span>
            </button>
          )}

          <button
            onClick={onOpenBackendDocs}
            className="flex items-center gap-1 text-xs text-stone-400 hover:text-stone-200 bg-stone-800 hover:bg-stone-700 border border-stone-700 px-2.5 py-1.5 rounded-xl transition"
            title="Inspect Flask backend & MySQL schema implementation"
          >
            <FileCode2 className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Backend & MySQL</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="max-w-7xl mx-auto px-4 flex items-center gap-1 overflow-x-auto text-xs font-medium border-t border-stone-800/80">
        <button
          onClick={() => onChangeTab('nearby')}
          className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 transition whitespace-nowrap ${
            activeTab === 'nearby'
              ? 'border-emerald-500 text-emerald-400 font-semibold'
              : 'border-transparent text-stone-400 hover:text-stone-200'
          }`}
        >
          <Utensils className="w-3.5 h-3.5" />
          <span>Nearby Food Discovery</span>
        </button>

        <button
          onClick={() => onChangeTab('activity')}
          className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 transition whitespace-nowrap ${
            activeTab === 'activity'
              ? 'border-emerald-500 text-emerald-400 font-semibold'
              : 'border-transparent text-stone-400 hover:text-stone-200'
          }`}
        >
          <LayoutDashboard className="w-3.5 h-3.5" />
          <span>My Activity & Pickups</span>
        </button>

        <button
          onClick={() => onChangeTab('verification')}
          className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 transition whitespace-nowrap ${
            activeTab === 'verification'
              ? 'border-emerald-500 text-emerald-400 font-semibold'
              : 'border-transparent text-stone-400 hover:text-stone-200'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>ID Verification & DPDP</span>
          {currentUser.verificationStatus === 'pending' && (
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          )}
        </button>

        <button
          onClick={() => onChangeTab('impact')}
          className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 transition whitespace-nowrap ${
            activeTab === 'impact'
              ? 'border-emerald-500 text-emerald-400 font-semibold'
              : 'border-transparent text-stone-400 hover:text-stone-200'
          }`}
        >
          <Award className="w-3.5 h-3.5 text-amber-400" />
          <span>Donor Recognition & Certificate</span>
        </button>

        <button
          onClick={() => onChangeTab('admin')}
          className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 transition whitespace-nowrap ${
            activeTab === 'admin'
              ? 'border-emerald-500 text-emerald-400 font-semibold'
              : 'border-transparent text-stone-400 hover:text-stone-200'
          }`}
        >
          <Building2 className="w-3.5 h-3.5 text-blue-400" />
          <span>Admin Moderation</span>
          {pendingVerificationsCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-stone-950 font-bold text-[10px]">
              {pendingVerificationsCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};
