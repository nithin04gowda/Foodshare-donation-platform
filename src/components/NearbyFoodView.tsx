import React, { useState, useEffect } from 'react';
import {
  Clock,
  MapPin,
  ShieldCheck,
  AlertTriangle,
  Leaf,
  Package,
  Thermometer,
  Info,
  Search,
  Filter,
  CheckCircle2,
} from 'lucide-react';
import { Donation, User } from '../utils/foodshare-logic';
import { LocationOption } from '../types';

interface NearbyFoodViewProps {
  currentUser: User;
  currentLocation: LocationOption;
  radiusKm: number;
  onOpenRequestModal: (donation: Donation) => void;
  onRequestVerificationTab: () => void;
  refreshTrigger: number;
}

export const NearbyFoodView: React.FC<NearbyFoodViewProps> = ({
  currentUser,
  currentLocation,
  radiusKm,
  onOpenRequestModal,
  onRequestVerificationTab,
  refreshTrigger,
}) => {
  const [donations, setDonations] = useState<Array<Donation & { approximate_distance_km?: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [foodTypeFilter, setFoodTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchDonations();
  }, [currentLocation, radiusKm, categoryFilter, foodTypeFilter, searchQuery, refreshTrigger]);

  const fetchDonations = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        lat: currentLocation.latitude.toString(),
        lon: currentLocation.longitude.toString(),
        radius: radiusKm.toString(),
        category: categoryFilter,
        foodType: foodTypeFilter,
        search: searchQuery,
      });

      const res = await fetch(`/api/donations/nearby?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setDonations(data.donations || []);
      }
    } catch (err) {
      console.error('Failed to fetch nearby donations:', err);
    } finally {
      setLoading(false);
    }
  };

  // Helper to format deadline
  const formatTimeRemaining = (deadlineStr: string) => {
    const diff = new Date(deadlineStr).getTime() - Date.now();
    if (diff <= 0) return 'Expired';
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h remaining`;
    }
    return `${hours}h ${minutes}m remaining`;
  };

  const getStorageBadge = (condition: string) => {
    switch (condition) {
      case 'heated':
        return { label: 'Keep Hot (>60°C)', color: 'bg-amber-100 text-amber-800 border-amber-300' };
      case 'refrigerated':
        return { label: 'Refrigerated (4°C)', color: 'bg-blue-100 text-blue-800 border-blue-300' };
      case 'dry_sealed':
        return { label: 'Dry & Sealed', color: 'bg-purple-100 text-purple-800 border-purple-300' };
      default:
        return { label: 'Ambient Temp', color: 'bg-stone-100 text-stone-800 border-stone-300' };
    }
  };

  const getPackagingLabel = (pkg: string) => {
    switch (pkg) {
      case 'foil_containers':
        return 'Sealed Foil Containers';
      case 'disposable_boxes':
        return 'Food-grade Meal Boxes';
      case 'bring_own_vessel':
        return 'Recipient Must Bring Vessels';
      case 'packaged_sealed':
        return 'Commercial Factory Sealed';
      default:
        return 'Standard Packaging';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner explaining Verification Requirement for Recipients */}
      {currentUser.verificationStatus !== 'verified' && (
        <div className="bg-amber-50 border border-amber-300/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-100 rounded-xl text-amber-800 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-amber-950 text-sm">
                Account Status: Pending Verification
              </h4>
              <p className="text-xs text-amber-800 mt-0.5">
                Under FoodShare India safety policies, only verified individuals and accredited NGOs can request or collect food.
                You can browse nearby listings below, but claiming food requires administrative ID approval.
              </p>
            </div>
          </div>
          <button
            onClick={onRequestVerificationTab}
            className="shrink-0 bg-amber-700 hover:bg-amber-800 text-white font-medium px-4 py-2 rounded-xl text-xs transition shadow-sm"
          >
            Submit ID Proof Now
          </button>
        </div>
      )}

      {/* Discovery Filters Bar */}
      <div className="bg-white rounded-2xl border border-stone-200/90 p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
            <input
              type="text"
              placeholder="Search surplus food by dish, bakery, cuisine, or donor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 bg-stone-50/50"
            />
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-500 font-medium whitespace-nowrap flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Category:
            </span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs border border-stone-200 rounded-xl px-2.5 py-2 bg-stone-50 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            >
              <option value="all">All Categories</option>
              <option value="cooked_meals">Cooked Meals / Banquet</option>
              <option value="bakery">Bakery & Breads</option>
              <option value="raw_groceries">Raw Farm Produce</option>
              <option value="packaged_food">Packaged Groceries</option>
            </select>
          </div>

          {/* Food Type / Dietary Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-500 font-medium whitespace-nowrap">Diet:</span>
            <select
              value={foodTypeFilter}
              onChange={(e) => setFoodTypeFilter(e.target.value)}
              className="text-xs border border-stone-200 rounded-xl px-2.5 py-2 bg-stone-50 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            >
              <option value="all">All Diets</option>
              <option value="veg">Vegetarian 🟢</option>
              <option value="non_veg">Non-Vegetarian 🔴</option>
              <option value="vegan">Pure Vegan 🌱</option>
            </select>
          </div>
        </div>

        {/* Search Info bar */}
        <div className="flex flex-wrap items-center justify-between text-xs text-stone-500 pt-2 border-t border-stone-100">
          <div>
            Showing available food within <strong className="text-stone-800">{radiusKm} km</strong> of{' '}
            <strong className="text-emerald-700">{currentLocation.name}</strong>
          </div>
          <div className="flex items-center gap-3">
            <span>
              Found: <strong className="text-stone-800">{donations.length}</strong> active donations
            </span>
            <span className="text-stone-300">|</span>
            <span className="text-[11px] text-stone-500">
              Sorted by exact Haversine distance
            </span>
          </div>
        </div>
      </div>

      {/* Donations List / Grid */}
      {loading ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-stone-200 text-stone-400">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-emerald-500 border-t-transparent mb-3"></div>
          <p className="text-xs font-medium">Scanning nearby verified surplus food within {radiusKm} km...</p>
        </div>
      ) : donations.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-stone-200">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-stone-100 flex items-center justify-center text-stone-400 mb-3">
            <MapPin className="w-7 h-7 text-stone-400" />
          </div>
          <h3 className="font-bold text-stone-800 text-base">No active donations within {radiusKm} km</h3>
          <p className="text-xs text-stone-500 max-w-md mx-auto mt-1">
            Try expanding your search radius to 10 km or 20 km in the top bar, or switch your location to an Indian metropolitan hub like Bengaluru or Delhi.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {donations.map((d) => {
            const distance = (d as any).distanceKm ?? (d as any).approximate_distance_km ?? 0;
            const storageBadge = getStorageBadge(d.storageCondition);
            const timeRemaining = formatTimeRemaining(d.expiryDeadline);
            const percentAvailable = Math.round(
              (d.availableQuantityServings / d.initialQuantityServings) * 100
            );

            return (
              <div
                key={d.id}
                className="bg-white rounded-2xl border border-stone-200/90 shadow-sm hover:shadow-md transition flex flex-col justify-between overflow-hidden group"
              >
                <div>
                  {/* Card Header with Badges */}
                  <div className="p-4 pb-2 border-b border-stone-100">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      {/* Dietary Indicator (FSSAI green/red dot) */}
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-3.5 h-3.5 rounded-sm border p-0.5 flex items-center justify-center ${
                            d.foodType === 'veg'
                              ? 'border-emerald-600 bg-white'
                              : d.foodType === 'vegan'
                              ? 'border-emerald-600 bg-white'
                              : 'border-red-600 bg-white'
                          }`}
                          title={d.foodType.toUpperCase()}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              d.foodType === 'non_veg' ? 'bg-red-600' : 'bg-emerald-600'
                            }`}
                          ></span>
                        </span>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-stone-700">
                          {d.category.replace('_', ' ')}
                        </span>
                      </div>

                      {/* Distance Badge */}
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                        <MapPin className="w-3 h-3 text-emerald-600" />
                        {distance.toFixed(1)} km away
                      </span>
                    </div>

                    <h3 className="font-bold text-stone-900 text-sm leading-snug line-clamp-1 group-hover:text-emerald-700 transition">
                      {d.title}
                    </h3>

                    {/* Donor profile preview */}
                    <div className="flex items-center gap-1.5 mt-1.5 text-xs text-stone-600">
                      <span className="font-medium truncate max-w-[170px]">{d.donorName}</span>
                      {d.donorVerified && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200/60">
                          <CheckCircle2 className="w-2.5 h-2.5" /> Verified
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 space-y-3">
                    <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                      {d.description}
                    </p>

                    {/* Quantity & Progress */}
                    <div className="bg-stone-50 rounded-xl p-2.5 border border-stone-100">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-semibold text-stone-700">Remaining Available:</span>
                        <span className="font-bold text-emerald-700">
                          {d.availableQuantityServings} / {d.initialQuantityServings} servings
                        </span>
                      </div>
                      <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${percentAvailable}%` }}
                        ></div>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-stone-500 mt-1">
                        <span>Approx. Weight: {d.approxWeightKg} kg</span>
                        {d.reservedQuantityServings > 0 && (
                          <span className="text-amber-700 font-medium">
                            {d.reservedQuantityServings} reserved
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Expiry Countdown & Storage */}
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="flex items-center gap-1.5 text-stone-700 bg-stone-50 p-2 rounded-lg border border-stone-100">
                        <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <div>
                          <div className="text-[10px] text-stone-400">Pickup Deadline</div>
                          <div className="font-semibold text-stone-800">{timeRemaining}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 text-stone-700 bg-stone-50 p-2 rounded-lg border border-stone-100">
                        <Thermometer className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <div>
                          <div className="text-[10px] text-stone-400">Storage Req</div>
                          <div className="font-semibold text-stone-800 truncate">{storageBadge.label}</div>
                        </div>
                      </div>
                    </div>

                    {/* Packaging & Safety */}
                    <div className="space-y-1 text-[11px] text-stone-500">
                      <div className="flex items-center gap-1">
                        <Package className="w-3 h-3 text-stone-400 shrink-0" />
                        <span>Package: {getPackagingLabel(d.packaging)}</span>
                      </div>
                      {d.allergenNotes && (
                        <div className="flex items-start gap-1 text-stone-500">
                          <Info className="w-3 h-3 text-stone-400 shrink-0 mt-0.5" />
                          <span className="line-clamp-1">Allergens: {d.allergenNotes}</span>
                        </div>
                      )}
                    </div>

                    {/* Privacy notice regarding exact address */}
                    <div className="text-[10px] text-stone-400 bg-stone-50 px-2 py-1.5 rounded-lg border border-stone-100 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
                      <span>{d.donorAddress}</span>
                    </div>
                  </div>
                </div>

                {/* Card Footer Action */}
                <div className="p-4 pt-0">
                  <button
                    onClick={() => onOpenRequestModal(d)}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-3 rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98]"
                  >
                    <span>Request Food Pickup</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
