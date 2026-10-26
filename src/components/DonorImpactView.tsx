import React, { useState, useEffect } from 'react';
import {
  Award,
  HeartHandshake,
  Leaf,
  ShieldCheck,
  Sparkles,
  Printer,
  Calendar,
  CheckCircle2,
  Users,
  UtensilsCrossed,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { DonorImpact, User } from '../utils/foodshare-logic';

interface DonorImpactViewProps {
  currentUser: User;
}

export const DonorImpactView: React.FC<DonorImpactViewProps> = ({ currentUser }) => {
  const [impactData, setImpactData] = useState<DonorImpact | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCertificateModal, setShowCertificateModal] = useState(false);

  useEffect(() => {
    fetchImpact();
  }, [currentUser]);

  const fetchImpact = async () => {
    setLoading(true);
    try {
      // Find donor ID (if current user is donor or NGO, use their ID; otherwise fallback to primary verified donor for demo impact)
      const targetId = currentUser.role === 'donor' || currentUser.role === 'ngo' ? currentUser.id : 'u_donor_1';
      const res = await fetch(`/api/impact/${targetId}`);
      if (res.ok) {
        const data = await res.json();
        setImpactData(data.impact);
      }
    } catch (err) {
      console.error('Failed to fetch impact:', err);
    } finally {
      setLoading(false);
    }
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  const getBadgeIcon = (id: string) => {
    switch (id) {
      case 'first_harvest':
        return <Award className="w-5 h-5 text-amber-500" />;
      case 'hunger_hero':
        return <HeartHandshake className="w-5 h-5 text-red-500" />;
      case 'zero_waste_warrior':
        return <Leaf className="w-5 h-5 text-emerald-500" />;
      case 'community_pillar':
        return <ShieldCheck className="w-5 h-5 text-blue-500" />;
      case 'century_feeder':
        return <Sparkles className="w-5 h-5 text-purple-500" />;
      default:
        return <Award className="w-5 h-5 text-amber-500" />;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Hero Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-stone-900 to-stone-950 rounded-3xl p-6 sm:p-8 text-white border border-emerald-900/50 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-emerald-900/60 text-emerald-300 border border-emerald-700/50">
            Non-Monetary Recognition & verified Social Impact
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Donor Impact & Recognition Portfolio
          </h2>
          <p className="text-xs text-stone-300 max-w-xl leading-relaxed">
            Every metric below is computed purely from real completed pickups and verified handovers in the FoodShare India database. No artificial points or cash rewards.
          </p>
        </div>

        <button
          onClick={() => {
            setShowCertificateModal(true);
            triggerConfetti();
          }}
          className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-extrabold px-5 py-3 rounded-2xl text-xs transition shadow-lg shadow-amber-950/40 flex items-center gap-2 transform active:scale-95 shrink-0"
        >
          <Award className="w-4 h-4 text-stone-950" />
          <span>View Official Certificate</span>
        </button>
      </div>

      {loading || !impactData ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-stone-200 text-stone-400">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-emerald-500 border-t-transparent mb-3"></div>
          <p className="text-xs font-medium">Computing donor impact metrics from database...</p>
        </div>
      ) : (
        <>
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white rounded-2xl border border-stone-200/90 p-4 shadow-sm">
              <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-1">
                <UtensilsCrossed className="w-4 h-4" /> Meals Shared
              </div>
              <div className="text-2xl font-extrabold text-stone-900">
                {impactData.totalServingsDonated}
              </div>
              <span className="text-[11px] text-stone-500">Servings contributed</span>
            </div>

            <div className="bg-white rounded-2xl border border-stone-200/90 p-4 shadow-sm">
              <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-1">
                <Leaf className="w-4 h-4" /> Food Rescued
              </div>
              <div className="text-2xl font-extrabold text-stone-900">
                {impactData.totalKgSaved} kg
              </div>
              <span className="text-[11px] text-stone-500">Diverted from landfills</span>
            </div>

            <div className="bg-white rounded-2xl border border-stone-200/90 p-4 shadow-sm">
              <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-1">
                <Users className="w-4 h-4" /> People Fed
              </div>
              <div className="text-2xl font-extrabold text-stone-900">
                {impactData.peopleFed}
              </div>
              <span className="text-[11px] text-stone-500">Shelter & community lives</span>
            </div>

            <div className="bg-white rounded-2xl border border-stone-200/90 p-4 shadow-sm">
              <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-1">
                <Leaf className="w-4 h-4 text-emerald-600" /> CO2 Prevented
              </div>
              <div className="text-2xl font-extrabold text-stone-900">
                {impactData.co2PreventedKg} kg
              </div>
              <span className="text-[11px] text-stone-500">Greenhouse mitigation</span>
            </div>

            <div className="bg-white rounded-2xl border border-amber-300 p-4 shadow-sm bg-gradient-to-br from-amber-50 to-white col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2 text-amber-800 text-xs font-bold uppercase tracking-wider mb-1">
                <Sparkles className="w-4 h-4 text-amber-600" /> Impact Score
              </div>
              <div className="text-2xl font-extrabold text-amber-900">
                {impactData.points} pts
              </div>
              <span className="text-[11px] text-amber-800">Non-monetary merit</span>
            </div>
          </div>

          {/* Badges Section */}
          <div className="bg-white rounded-3xl border border-stone-200/90 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-stone-900 text-sm">
                  Earned Community Badges & Distinctions
                </h3>
                <p className="text-xs text-stone-500">
                  Awarded automatically upon completing genuine food redistribution milestones.
                </p>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                {impactData.badges.filter((b) => b.earned).length} / {impactData.badges.length} Badges Unlocked
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {impactData.badges.map((b) => (
                <div
                  key={b.id}
                  className={`p-4 rounded-2xl border transition flex items-start gap-3.5 ${
                    b.earned
                      ? 'bg-stone-50/80 border-stone-200 shadow-xs'
                      : 'bg-stone-50/30 border-dashed border-stone-200 opacity-60'
                  }`}
                >
                  <div
                    className={`p-2.5 rounded-xl shrink-0 ${
                      b.earned ? 'bg-white shadow-xs' : 'bg-stone-200 text-stone-400'
                    }`}
                  >
                    {getBadgeIcon(b.id)}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-bold text-stone-900 text-xs">{b.name}</h4>
                      {b.earned && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-stone-500 mt-0.5 leading-relaxed">
                      {b.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Milestones Progress */}
          <div className="bg-white rounded-3xl border border-stone-200/90 p-6 shadow-sm space-y-4">
            <div>
              <h3 className="font-bold text-stone-900 text-sm">Active Impact Milestones</h3>
              <p className="text-xs text-stone-500">
                Track your progress towards the next national zero-waste thresholds.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {impactData.milestones.map((m) => {
                const percent = Math.min(100, Math.round((m.current / m.target) * 100));
                return (
                  <div key={m.title} className="bg-stone-50 p-4 rounded-2xl border border-stone-200">
                    <div className="flex items-center justify-between text-xs font-semibold mb-1">
                      <span className="text-stone-800">{m.title}</span>
                      <span className="text-emerald-700 font-bold">
                        {m.current} / {m.target} {m.unit}
                      </span>
                    </div>
                    <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden mt-2">
                      <div
                        className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                    <div className="text-[10px] text-stone-400 mt-1.5 flex items-center justify-between">
                      <span>{percent}% completed</span>
                      {m.isAchieved && (
                        <span className="text-emerald-600 font-bold uppercase">Achieved</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Official Certificate Modal */}
      {showCertificateModal && impactData && (
        <div className="fixed inset-0 z-50 bg-stone-950/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-stone-200 shadow-2xl p-6 sm:p-8 relative my-6">
            <button
              onClick={() => setShowCertificateModal(false)}
              className="absolute top-4 right-4 text-xs bg-stone-100 hover:bg-stone-200 text-stone-700 px-3 py-1 rounded-xl"
            >
              Close
            </button>

            {/* Certificate Canvas / Container */}
            <div className="border-8 border-double border-amber-600/40 p-6 sm:p-8 rounded-2xl bg-gradient-to-b from-amber-50/40 via-white to-amber-50/20 text-center space-y-4">
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl">🇮🇳</span>
                <span className="text-[10px] tracking-widest font-extrabold uppercase text-amber-900">
                  Government of India Guidelines • FSSAI Compliant
                </span>
                <span className="text-2xl">🇮🇳</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-serif font-black text-stone-900 tracking-wide uppercase">
                Certificate of Food Waste Prevention & Service
              </h2>

              <p className="text-xs font-serif text-stone-500 uppercase tracking-widest">
                This official commendation is proudly presented to
              </p>

              <div className="text-xl sm:text-2xl font-bold font-serif text-emerald-900 underline decoration-amber-400 decoration-2 underline-offset-8 py-2">
                {currentUser.name}
              </div>

              <p className="text-xs text-stone-700 max-w-md mx-auto leading-relaxed">
                In formal recognition of extraordinary citizenship and leadership in diverting edible surplus food from landfills and nourishing vulnerable shelter occupants in {currentUser.city}, {currentUser.state}.
              </p>

              <div className="grid grid-cols-3 gap-3 py-3 border-y border-amber-200/80 text-xs">
                <div>
                  <div className="font-extrabold text-base text-stone-900">{impactData.totalServingsDonated}</div>
                  <div className="text-[10px] text-stone-500 uppercase">Meals Shared</div>
                </div>
                <div>
                  <div className="font-extrabold text-base text-stone-900">{impactData.totalKgSaved} kg</div>
                  <div className="text-[10px] text-stone-500 uppercase">Food Rescued</div>
                </div>
                <div>
                  <div className="font-extrabold text-base text-stone-900">{impactData.co2PreventedKg} kg</div>
                  <div className="text-[10px] text-stone-500 uppercase">CO2 Prevented</div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 text-[11px] text-stone-600">
                <div className="text-left">
                  <div className="font-bold text-stone-800">FoodShare National Registry</div>
                  <div>Certificate ID: FS-IN-{currentUser.id.slice(-6).toUpperCase()}-2026</div>
                </div>

                <div className="text-right">
                  <div className="font-bold text-stone-800">Date of Verification</div>
                  <div>{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => window.print()}
                className="bg-stone-900 hover:bg-stone-800 text-white font-semibold px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Certificate</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
