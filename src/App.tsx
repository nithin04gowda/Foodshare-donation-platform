import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Users,
  MapPin,
  Heart,
  ShieldCheck,
  Clock,
  PlusCircle,
  Phone,
  CheckCircle2,
  X,
  AlertCircle,
  Building2,
  UserCheck,
  Utensils,
  ChevronRight,
  HandHeart,
  Download,
} from 'lucide-react';
import { FoodItem } from '../server';

export default function App() {
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'donate'>('all');
  const [stats, setStats] = useState({
    mealsDonated: 0,
    activeDonors: 0,
    citiesCovered: 0,
    availableCount: 0,
  });

  // Modal states
  const [claimingItem, setClaimingItem] = useState<FoodItem | null>(null);
  const [showPostModal, setShowPostModal] = useState(false);
  const [successToast, setSuccessToast] = useState('');

  // Post Food Form state (Donor)
  const [donorName, setDonorName] = useState('');
  const [donorPhone, setDonorPhone] = useState('');
  const [foodName, setFoodName] = useState('');
  const [quantity, setQuantity] = useState<number>(30);
  const [location, setLocation] = useState('');
  const [foodType, setFoodType] = useState<'veg' | 'non_veg'>('veg');
  const [notes, setNotes] = useState('');
  const [postSubmitting, setPostSubmitting] = useState(false);
  const [postError, setPostError] = useState('');

  // Claim Food Form state (Receiver: NGO or Helping Person)
  const [receiverType, setReceiverType] = useState<'NGO' | 'Helping Person'>('NGO');
  const [receiverName, setReceiverName] = useState('');
  const [orgName, setOrgName] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');
  const [claimSubmitting, setClaimSubmitting] = useState(false);
  const [claimError, setClaimError] = useState('');

  useEffect(() => {
    fetchFood();
    fetchStats();
  }, []);

  const fetchFood = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/food');
      if (res.ok) {
        const data = await res.json();
        setFoodItems(data.items || []);
      }
    } catch (err) {
      console.error('Failed to fetch food:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePostFood = async (e: React.FormEvent) => {
    e.preventDefault();
    setPostError('');

    if (!donorName.trim() || !foodName.trim() || !quantity || !location.trim()) {
      setPostError('Please provide your name, food title, quantity, and pickup location.');
      return;
    }

    setPostSubmitting(true);
    try {
      const res = await fetch('/api/food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          donorName,
          donorPhone: donorPhone || 'Will share on confirmation',
          foodName,
          quantity,
          location,
          foodType,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setPostError(data.error || 'Failed to post food.');
      } else {
        setSuccessToast(`Food posted successfully! ${quantity} meals are now available for NGOs and helping persons.`);
        setTimeout(() => setSuccessToast(''), 4000);
        // Reset form
        setFoodName('');
        setLocation('');
        setNotes('');
        setShowPostModal(false);
        fetchFood();
        fetchStats();
      }
    } catch (err) {
      setPostError('Network error while posting food.');
    } finally {
      setPostSubmitting(false);
    }
  };

  const handleClaimFood = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimingItem) return;
    setClaimError('');

    if (!receiverName.trim() || !receiverPhone.trim()) {
      setClaimError('Please provide your name and phone number.');
      return;
    }

    if (receiverType === 'NGO' && !orgName.trim()) {
      setClaimError('Please provide your NGO / Foundation organization name.');
      return;
    }

    setClaimSubmitting(true);
    try {
      const res = await fetch(`/api/food/${claimingItem.id}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverName,
          receiverType,
          orgName,
          phone: receiverPhone,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setClaimError(data.error || 'Failed to claim food.');
      } else {
        setSuccessToast(`Food claimed successfully by ${receiverType === 'NGO' ? orgName : receiverName}! You can now coordinate pickup.`);
        setTimeout(() => setSuccessToast(''), 5000);
        setClaimingItem(null);
        fetchFood();
        fetchStats();
      }
    } catch (err) {
      setClaimError('Network error while claiming food.');
    } finally {
      setClaimSubmitting(false);
    }
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans flex flex-col">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-700 text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 text-sm animate-bounce">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="font-semibold">{successToast}</span>
        </div>
      )}

      {/* Navigation Bar (Foodbridge Brand matching screenshot) */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white font-extrabold text-lg shadow-sm">
              F
            </div>
            <span className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 hover:opacity-90 transition cursor-pointer select-none">
              FoodDonors
            </span>
          </div>

          {/* Simple Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-stone-600">
            <button
              onClick={() => scrollToSection('hero')}
              className="hover:text-orange-600 transition"
            >
              Home
            </button>
            <button
              onClick={() => scrollToSection('available-food')}
              className="hover:text-orange-600 transition"
            >
              Available Food
            </button>
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="hover:text-orange-600 transition"
            >
              How It Works
            </button>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <a
              href="/api/download"
              download="fooddonors-app.zip"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 border border-stone-200 transition"
              title="Download full project source code as .ZIP"
            >
              <Download className="w-3.5 h-3.5 text-stone-600" />
              <span>Download ZIP</span>
            </a>

            <button
              onClick={() => setShowPostModal(true)}
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-4 sm:px-5 py-2 rounded-lg text-sm shadow-sm transition transform active:scale-95 flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Donate Food</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section (Matching User's Attached Screenshot) */}
      <section
        id="hero"
        className="pt-16 pb-14 px-4 text-center bg-gradient-to-b from-orange-50/40 via-white to-stone-50"
      >
        <div className="max-w-3xl mx-auto space-y-5">
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-orange-600 leading-tight">
            End Hunger, One Meal at a Time
          </h1>
          <p className="text-stone-600 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            Connect with NGOs and helping hands across India. Donate surplus food safely with direct, verified coordination on FoodDonors.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setShowPostModal(true)}
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-2.5 rounded-lg shadow-md hover:shadow-lg transition text-sm flex items-center gap-2"
            >
              <span>Start Donating</span>
            </button>

            <button
              onClick={() => scrollToSection('available-food')}
              className="bg-white hover:bg-stone-50 text-stone-700 font-semibold px-6 py-2.5 rounded-lg border border-stone-300 shadow-xs transition text-sm flex items-center gap-2"
            >
              <span>View Available Food</span>
              <ChevronRight className="w-4 h-4 text-stone-400" />
            </button>
          </div>
        </div>
      </section>

      {/* Light Cream Statistics Strip (Matching Body Color Palette) */}
      <section className="bg-[#FAF7F2] border-y border-stone-200/90 py-6 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-3 gap-4 text-center">
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-1 text-orange-600 text-xs">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div className="text-2xl sm:text-4xl font-extrabold tracking-tight text-stone-900">
              {stats.mealsDonated}
            </div>
            <div className="text-xs sm:text-sm text-stone-600 font-semibold">
              Meals Donated
            </div>
          </div>

          <div className="space-y-1 border-x border-stone-300/80">
            <div className="flex items-center justify-center gap-1 text-orange-600 text-xs">
              <Users className="w-4 h-4" />
            </div>
            <div className="text-2xl sm:text-4xl font-extrabold tracking-tight text-stone-900">
              {stats.activeDonors}
            </div>
            <div className="text-xs sm:text-sm text-stone-600 font-semibold">
              Active Donors
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-center gap-1 text-orange-600 text-xs">
              <MapPin className="w-4 h-4" />
            </div>
            <div className="text-2xl sm:text-4xl font-extrabold tracking-tight text-stone-900">
              {stats.citiesCovered}
            </div>
            <div className="text-xs sm:text-sm text-stone-600 font-semibold">
              Cities Covered
            </div>
          </div>
        </div>
      </section>

      {/* Direct Available Food Feed (Front & Center!) */}
      <section id="available-food" className="py-12 px-4 max-w-5xl mx-auto w-full flex-1">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <h2 className="text-xl sm:text-2xl font-bold text-stone-900">
                Food Posted by Donors
              </h2>
            </div>
            <p className="text-xs text-stone-500 mt-1">
              All surplus food listings ready for pickup by registered NGOs and helping persons.
            </p>
          </div>

          <button
            onClick={() => setShowPostModal(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-4 py-2 rounded-xl text-xs transition shadow-sm flex items-center gap-1.5 shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Post Surplus Food as Donor</span>
          </button>
        </div>

        {/* Food Feed Cards */}
        {loading ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-stone-200 text-stone-400">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-orange-500 border-t-transparent mb-3"></div>
            <p className="text-xs font-medium">Loading food listings...</p>
          </div>
        ) : foodItems.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-stone-200">
            <Utensils className="w-10 h-10 text-stone-300 mx-auto mb-3" />
            <h3 className="font-bold text-stone-800 text-base">No food posted right now</h3>
            <p className="text-xs text-stone-500 mt-1">
              Be the first donor to post available surplus food!
            </p>
            <button
              onClick={() => setShowPostModal(true)}
              className="mt-4 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 py-2 rounded-lg text-xs"
            >
              Post Food Now
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {foodItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition p-5 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Top Bar: Food Type & Status */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-3.5 h-3.5 rounded-sm border p-0.5 flex items-center justify-center ${
                          item.foodType === 'veg'
                            ? 'border-emerald-600 bg-white'
                            : 'border-red-600 bg-white'
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            item.foodType === 'veg' ? 'bg-emerald-600' : 'bg-red-600'
                          }`}
                        ></span>
                      </span>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-stone-600">
                        {item.foodType === 'veg' ? 'Vegetarian' : 'Non-Vegetarian'}
                      </span>
                    </div>

                    <span
                      className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        item.status === 'available'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-stone-100 text-stone-600 border border-stone-200'
                      }`}
                    >
                      {item.status === 'available' ? 'Available' : 'Claimed'}
                    </span>
                  </div>

                  {/* Food Title */}
                  <h3 className="text-base font-extrabold text-stone-900 leading-snug">
                    {item.foodName}
                  </h3>

                  {/* Prominent Quantity Indicator */}
                  <div className="bg-orange-50/70 border border-orange-200/80 rounded-xl p-3 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-orange-800 uppercase font-bold block">
                        Available Quantity
                      </span>
                      <span className="text-xl font-black text-orange-900">
                        {item.quantity} Servings
                      </span>
                    </div>
                    {item.quantityKg && (
                      <div className="text-right">
                        <span className="text-[10px] text-orange-800 uppercase font-bold block">
                          Approx Weight
                        </span>
                        <span className="text-sm font-bold text-stone-700">
                          ~{item.quantityKg} kg
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Location & Donor Details */}
                  <div className="space-y-1.5 text-xs text-stone-600">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                      <span className="font-medium text-stone-800">{item.location}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-stone-400 shrink-0" />
                      <span>
                        Posted by: <strong>{item.donorName}</strong>
                      </span>
                    </div>

                    {item.notes && (
                      <div className="text-[11px] text-stone-500 bg-stone-50 p-2 rounded-lg border border-stone-100">
                        Note: {item.notes}
                      </div>
                    )}
                  </div>

                  {/* If Claimed: Show Claimed By details */}
                  {item.status === 'claimed' && item.claimedBy && (
                    <div className="bg-blue-50/80 border border-blue-200 p-3 rounded-xl text-xs text-blue-900 space-y-1">
                      <div className="font-bold flex items-center gap-1.5 text-blue-950">
                        <ShieldCheck className="w-4 h-4 text-blue-600" />
                        <span>Claimed by {item.claimedBy.type}: {item.claimedBy.name}</span>
                      </div>
                      <div className="text-[11px] text-blue-800">
                        Organization / Purpose: <strong>{item.claimedBy.orgName}</strong>
                      </div>
                      <div className="text-[11px] text-blue-800 flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-blue-600" />
                        <span>Pickup Coordination Contact: {item.claimedBy.phone}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Button: Claim Food (For NGO or Helping Person) */}
                <div className="pt-4 mt-2 border-t border-stone-100">
                  {item.status === 'available' ? (
                    <button
                      onClick={() => setClaimingItem(item)}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-sm active:scale-[0.98]"
                    >
                      <HandHeart className="w-4 h-4" />
                      <span>Claim Food (NGO / Helping Person)</span>
                    </button>
                  ) : (
                    <div className="text-center text-xs font-medium text-stone-400 py-1 flex items-center justify-center gap-1">
                      <CheckCircle2 className="w-4 h-4 text-stone-400" />
                      <span>This food is reserved and handed over</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* "How FoodDonors Works" Section (At the End Before Footer) */}
      <section id="how-it-works" className="py-16 px-4 bg-white border-t border-stone-200/80 w-full">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
              How FoodDonors Works
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 mt-2">
              Simple 3-step redistribution ensuring safe food reaches hungry stomachs, not landfills.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-stone-50 p-6 rounded-2xl border border-stone-200/90 shadow-sm text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shadow-xs">
                <Heart className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="font-bold text-stone-900 text-sm">Schedule Donation</h3>
              <p className="text-xs text-stone-500 leading-relaxed">
                Donors post available food details with exact quantity of servings, pickup location, and contact name.
              </p>
            </div>

            <div className="bg-stone-50 p-6 rounded-2xl border border-stone-200/90 shadow-sm text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
                <ShieldCheck className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="font-bold text-stone-900 text-sm">NGO or Helping Person</h3>
              <p className="text-xs text-stone-500 leading-relaxed">
                Only authenticated NGOs and genuine volunteers claim food for shelters, orphanages, and families in need.
              </p>
            </div>

            <div className="bg-stone-50 p-6 rounded-2xl border border-stone-200/90 shadow-sm text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shadow-xs">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-bold text-stone-900 text-sm">Quick Pickup</h3>
              <p className="text-xs text-stone-500 leading-relaxed">
                Direct contact details are shared immediately so the food is picked up fresh and distributed without delay.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-stone-200 py-8 px-4 text-xs text-stone-500 mt-12">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-orange-600 text-sm">FoodDonors</span>
            <span>• Direct Donor & NGO Food Waste Redistribution</span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="/api/download"
              download="fooddonors-app.zip"
              className="inline-flex items-center gap-1.5 text-stone-700 hover:text-orange-600 font-medium underline underline-offset-2"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Project ZIP</span>
            </a>
            <span>•</span>
            <div>Republic of India 🇮🇳 • Zero Food Waste</div>
          </div>
        </div>
      </footer>

      {/* ---------------- POST FOOD MODAL (DONOR) ---------------- */}
      {showPostModal && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-stone-200 shadow-2xl overflow-hidden my-6">
            <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white p-5 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded">
                  Donor Portal
                </span>
                <h3 className="text-base font-extrabold text-white mt-1">
                  Post Surplus Food
                </h3>
              </div>
              <button
                onClick={() => setShowPostModal(false)}
                className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePostFood} className="p-5 space-y-4 text-xs">
              {postError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{postError}</span>
                </div>
              )}

              {/* 1. Donor Name */}
              <div>
                <label className="block font-bold text-stone-800 mb-1">
                  Donor Name / Restaurant / Caterer *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bawarchi Caterers or Ramesh Sharma"
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  className="w-full border border-stone-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>

              {/* 2. Food Name */}
              <div>
                <label className="block font-bold text-stone-800 mb-1">
                  Food Name / Dish Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vegetable Biryani & Dal or 40 Meals Pack"
                  value={foodName}
                  onChange={(e) => setFoodName(e.target.value)}
                  className="w-full border border-stone-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>

              {/* 3. Number of Quantity Available */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-800 mb-1">
                    Number of Quantity Available *
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    placeholder="e.g. 50 servings"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)}
                    className="w-full border border-stone-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-bold text-stone-800"
                  />
                  <span className="text-[10px] text-stone-400">Total number of servings</span>
                </div>

                <div>
                  <label className="block font-bold text-stone-800 mb-1">
                    Dietary Classification *
                  </label>
                  <select
                    value={foodType}
                    onChange={(e) => setFoodType(e.target.value as any)}
                    className="w-full border border-stone-300 rounded-xl p-2.5 bg-stone-50 font-medium focus:outline-none"
                  >
                    <option value="veg">Vegetarian 🟢</option>
                    <option value="non_veg">Non-Vegetarian 🔴</option>
                  </select>
                </div>
              </div>

              {/* 4. Location */}
              <div>
                <label className="block font-bold text-stone-800 mb-1">
                  Location (Pickup Address / Area / City) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 100ft Road, 4th Block, Koramangala, Bengaluru"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full border border-stone-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>

              {/* 5. Contact Phone */}
              <div>
                <label className="block font-bold text-stone-800 mb-1">
                  Donor Contact Phone Number *
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 9880198765"
                  value={donorPhone}
                  onChange={(e) => setDonorPhone(e.target.value)}
                  className="w-full border border-stone-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>

              {/* 6. Notes */}
              <div>
                <label className="block font-bold text-stone-800 mb-1">
                  Packaging / Storage Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Packed in 5 large foil boxes. Bring containers if needed."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full border border-stone-300 rounded-xl p-2.5 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowPostModal(false)}
                  className="px-4 py-2 font-semibold text-stone-600 hover:text-stone-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={postSubmitting}
                  className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-5 py-2.5 rounded-xl shadow-sm transition active:scale-95 disabled:opacity-50"
                >
                  {postSubmitting ? 'Posting...' : 'Post Food Now'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------- CLAIM FOOD MODAL (RECEIVER: NGO OR HELPING PERSON) ---------------- */}
      {claimingItem && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-stone-200 shadow-2xl overflow-hidden my-6">
            <div className="bg-emerald-700 text-white p-5 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest bg-emerald-800 px-2 py-0.5 rounded">
                  Receiver Handover
                </span>
                <h3 className="text-base font-extrabold text-white mt-1">
                  Claim: {claimingItem.foodName}
                </h3>
              </div>
              <button
                onClick={() => setClaimingItem(null)}
                className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-emerald-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleClaimFood} className="p-5 space-y-4 text-xs">
              {claimError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{claimError}</span>
                </div>
              )}

              {/* Food Info Summary */}
              <div className="bg-stone-50 border border-stone-200 p-3 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-stone-400 uppercase font-bold block">
                    Quantity to Collect
                  </span>
                  <span className="text-base font-extrabold text-stone-900">
                    {claimingItem.quantity} Servings
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-stone-400 uppercase font-bold block">
                    Pickup Location
                  </span>
                  <span className="font-semibold text-stone-800 truncate max-w-[200px] block">
                    {claimingItem.location}
                  </span>
                </div>
              </div>

              {/* Requirement: NGO or Helping Person selector */}
              <div>
                <label className="block font-bold text-stone-800 mb-1">
                  Who is collecting the food? *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setReceiverType('NGO')}
                    className={`p-3 rounded-xl border text-left font-bold transition flex items-center gap-2 ${
                      receiverType === 'NGO'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950'
                        : 'border-stone-200 text-stone-600'
                    }`}
                  >
                    <Building2 className="w-4 h-4 text-emerald-600" />
                    <span>Registered NGO / Charity</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReceiverType('Helping Person')}
                    className={`p-3 rounded-xl border text-left font-bold transition flex items-center gap-2 ${
                      receiverType === 'Helping Person'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950'
                        : 'border-stone-200 text-stone-600'
                    }`}
                  >
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                    <span>Helping Person / Volunteer</span>
                  </button>
                </div>
              </div>

              {/* Receiver Name */}
              <div>
                <label className="block font-bold text-stone-800 mb-1">
                  Your Name (Person Collecting Food) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sister Anita or Ramesh Volunteer"
                  value={receiverName}
                  onChange={(e) => setReceiverName(e.target.value)}
                  className="w-full border border-stone-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              {/* Organization or Purpose */}
              <div>
                <label className="block font-bold text-stone-800 mb-1">
                  {receiverType === 'NGO'
                    ? 'NGO / Trust / Foundation Name *'
                    : 'Where will you distribute this food? (Shelter / Workers / Slum) *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    receiverType === 'NGO'
                      ? 'e.g. Robin Hood Army or Roti Bank Foundation'
                      : 'e.g. Distributing to 30 homeless persons at Majestic shelter'
                  }
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="w-full border border-stone-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              {/* Receiver Contact Phone */}
              <div>
                <label className="block font-bold text-stone-800 mb-1">
                  Your Contact Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 9811223344"
                  value={receiverPhone}
                  onChange={(e) => setReceiverPhone(e.target.value)}
                  className="w-full border border-stone-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-[11px] text-emerald-900">
                <strong>Direct Coordination:</strong> Once claimed, the donor ({claimingItem.donorName}) will be notified and this food will be reserved for your distribution.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setClaimingItem(null)}
                  className="px-4 py-2 font-semibold text-stone-600 hover:text-stone-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={claimSubmitting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-sm transition active:scale-95 disabled:opacity-50"
                >
                  {claimSubmitting ? 'Claiming...' : 'Confirm & Claim Food'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
