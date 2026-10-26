import React, { useState, useEffect } from 'react';
import {
  Building2,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  FileText,
  AlertTriangle,
  Users,
  UtensilsCrossed,
  Leaf,
  Clock,
  Eye,
  Check,
  X,
} from 'lucide-react';
import { User } from '../utils/foodshare-logic';

interface AdminPortalViewProps {
  currentUser: User;
  onDataChanged: () => void;
}

export const AdminPortalView: React.FC<AdminPortalViewProps> = ({
  currentUser,
  onDataChanged,
}) => {
  const [stats, setStats] = useState<any>(null);
  const [verifications, setVerifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'verifications' | 'donations' | 'audit'>('verifications');
  const [allDonations, setAllDonations] = useState<any[]>([]);
  const [selectedDocPreview, setSelectedDocPreview] = useState<any | null>(null);
  const [rejectionModalUser, setRejectionModalUser] = useState<any | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      // Fetch stats
      const statsRes = await fetch('/api/admin/stats');
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.stats);
      }

      // Fetch verification submissions
      const verRes = await fetch('/api/verifications');
      if (verRes.ok) {
        const verData = await verRes.json();
        setVerifications(verData.verifications || []);
      }

      // Fetch all donations
      const donRes = await fetch('/api/donations/nearby?radius=5000');
      if (donRes.ok) {
        const donData = await donRes.json();
        setAllDonations(donData.donations || []);
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewVerification = async (
    verId: string,
    decision: 'verified' | 'rejected',
    reason?: string
  ) => {
    try {
      const res = await fetch(`/api/verifications/${verId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision,
          rejectionReason: reason || '',
          reviewerId: currentUser.id,
        }),
      });

      if (res.ok) {
        setNotice(`Verification marked as ${decision}. Account permissions updated in real database.`);
        setTimeout(() => setNotice(''), 3000);
        fetchAdminData();
        onDataChanged();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-stone-900 rounded-3xl p-6 sm:p-8 text-white border border-stone-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-stone-800 text-stone-300 border border-stone-700">
            Administrative Moderation & Trust Desk
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight mt-1">
            FoodShare National Audit & Review Portal
          </h2>
          <p className="text-xs text-stone-400 mt-1 max-w-xl">
            Inspect private government identity proofs, authenticate registered NGOs (NITI Aayog Darpan checks), and moderate surplus food listings.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-blue-950 text-blue-300 border border-blue-800">
            Authorized: {currentUser.name}
          </span>
        </div>
      </div>

      {notice && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-900 text-xs flex items-center gap-2 shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{notice}</span>
        </div>
      )}

      {/* Real Statistics from MySQL/Express Backend */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <div className="bg-white p-3.5 rounded-2xl border border-stone-200 shadow-xs">
            <span className="text-[10px] text-stone-400 font-bold uppercase block">Pending Reviews</span>
            <span className="text-xl font-black text-amber-600">{stats.pendingVerifications}</span>
            <span className="text-[10px] text-stone-500 block">Requires audit</span>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-stone-200 shadow-xs">
            <span className="text-[10px] text-stone-400 font-bold uppercase block">Verified NGOs</span>
            <span className="text-xl font-black text-emerald-700">{stats.verifiedNGOs}</span>
            <span className="text-[10px] text-stone-500 block">Darpan authenticated</span>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-stone-200 shadow-xs">
            <span className="text-[10px] text-stone-400 font-bold uppercase block">Verified Donors</span>
            <span className="text-xl font-black text-stone-900">{stats.verifiedDonors}</span>
            <span className="text-[10px] text-stone-500 block">Hotels & Caterers</span>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-stone-200 shadow-xs">
            <span className="text-[10px] text-stone-400 font-bold uppercase block">Total Rescued</span>
            <span className="text-xl font-black text-emerald-700">{stats.totalKgSaved} kg</span>
            <span className="text-[10px] text-stone-500 block">Food waste saved</span>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-stone-200 shadow-xs">
            <span className="text-[10px] text-stone-400 font-bold uppercase block">Total Servings</span>
            <span className="text-xl font-black text-stone-900">{stats.totalServingsShared}</span>
            <span className="text-[10px] text-stone-500 block">Beneficiaries fed</span>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-stone-200 shadow-xs">
            <span className="text-[10px] text-stone-400 font-bold uppercase block">Completed Pickups</span>
            <span className="text-xl font-black text-blue-700">{stats.totalPickups}</span>
            <span className="text-[10px] text-stone-500 block">OTP handovers</span>
          </div>
        </div>
      )}

      {/* Admin Nav Subtabs */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-2 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('verifications')}
          className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
            activeTab === 'verifications'
              ? 'bg-stone-900 text-white'
              : 'text-stone-500 hover:text-stone-900'
          }`}
        >
          <span>Identity Verification Queue</span>
          {verifications.filter((v) => v.status === 'pending').length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-stone-950 font-bold text-[10px]">
              {verifications.filter((v) => v.status === 'pending').length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('donations')}
          className={`px-3 py-1.5 rounded-xl transition ${
            activeTab === 'donations' ? 'bg-stone-900 text-white' : 'text-stone-500 hover:text-stone-900'
          }`}
        >
          <span>All Platform Donations</span>
        </button>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-stone-200 text-stone-400">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-emerald-500 border-t-transparent mb-3"></div>
          <p className="text-xs font-medium">Loading moderation records...</p>
        </div>
      ) : activeTab === 'verifications' ? (
        /* ---------------- Verification Queue ---------------- */
        <div className="space-y-4">
          {verifications.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-stone-200 text-stone-500 text-xs">
              No verification submissions in queue.
            </div>
          ) : (
            verifications.map((v) => (
              <div
                key={v.id}
                className="bg-white rounded-2xl border border-stone-200/90 p-5 shadow-sm space-y-4"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-stone-900 text-sm">{v.userName}</span>
                      <span className="text-[11px] px-2 py-0.5 rounded uppercase font-semibold bg-stone-100 text-stone-700">
                        {v.userRole}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          v.status === 'verified'
                            ? 'bg-emerald-100 text-emerald-800'
                            : v.status === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {v.status}
                      </span>
                    </div>
                    <div className="text-xs text-stone-500 mt-0.5">
                      {v.userCity}, {v.userState} (PIN: {v.userPincode}) • Contact: {v.userPhone}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {v.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleReviewVerification(v.id, 'verified')}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3.5 py-1.5 rounded-xl text-xs transition flex items-center gap-1 shadow-sm"
                        >
                          <Check className="w-3.5 h-3.5" /> Approve & Verify
                        </button>

                        <button
                          onClick={() => setRejectionModalUser(v)}
                          className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-semibold px-3 py-1.5 rounded-xl text-xs transition flex items-center gap-1"
                        >
                          <X className="w-3.5 h-3.5" /> Reject
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => setSelectedDocPreview(v)}
                      className="bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium px-3 py-1.5 rounded-xl text-xs transition flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" /> Inspect Document
                    </button>
                  </div>
                </div>

                {/* NGO extra details check */}
                {v.ngoDetails && (
                  <div className="bg-stone-50 p-3 rounded-xl border border-stone-200/80 text-xs space-y-1">
                    <div className="font-bold text-stone-800">
                      NITI Aayog NGO Darpan Registration:
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-stone-600">
                      <div>Org: <strong>{v.ngoDetails.orgName}</strong></div>
                      <div>Darpan ID: <strong>{v.ngoDetails.darpanId}</strong></div>
                      <div>12A/80G: <strong>{v.ngoDetails.is12A80GRegistered ? 'Yes' : 'No'}</strong></div>
                    </div>
                  </div>
                )}

                {/* Document metadata */}
                <div className="flex items-center justify-between text-xs text-stone-500 bg-stone-50/60 px-3 py-2 rounded-xl">
                  <div className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-stone-400" />
                    <span>Uploaded Proof: <strong>{v.documentName}</strong> ({v.idType.toUpperCase()})</span>
                  </div>
                  <span className="text-[11px]">Submitted: {new Date(v.submittedAt).toLocaleString('en-IN')}</span>
                </div>

                {v.rejectionReason && (
                  <div className="text-xs text-red-700 bg-red-50 p-2.5 rounded-xl border border-red-200">
                    <strong>Rejection Reason:</strong> {v.rejectionReason}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      ) : (
        /* ---------------- All Donations ---------------- */
        <div className="space-y-3">
          {allDonations.map((d) => (
            <div
              key={d.id}
              className="bg-white rounded-2xl border border-stone-200 p-4 shadow-sm flex items-center justify-between gap-4 text-xs"
            >
              <div>
                <div className="font-bold text-stone-900 text-sm">{d.title}</div>
                <div className="text-stone-500">
                  Donor: {d.donorName} • {d.city} • {d.availableQuantityServings} / {d.initialQuantityServings} servings left
                </div>
              </div>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                  d.status === 'completed'
                    ? 'bg-blue-100 text-blue-800'
                    : d.status === 'available'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {d.status.replace('_', ' ')}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Document Inspection Modal */}
      {selectedDocPreview && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-stone-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <span className="text-[10px] text-stone-400 font-bold uppercase">
                  Private Storage Document Inspection
                </span>
                <h3 className="text-base font-bold text-stone-900">
                  {selectedDocPreview.documentName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedDocPreview(null)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 bg-stone-100 rounded-2xl border border-stone-200 text-center space-y-2">
              <FileText className="w-12 h-12 text-emerald-700 mx-auto" />
              <div className="font-bold text-stone-800 text-sm">
                Document Type: {selectedDocPreview.idType.toUpperCase()}
              </div>
              <p className="text-xs text-stone-500">
                Uploaded by {selectedDocPreview.userName} ({selectedDocPreview.userRole})
              </p>
              <div className="text-[11px] text-stone-400 bg-white p-2 rounded-lg border border-stone-200 font-mono">
                Storage: /private_storage/identity_proofs/{selectedDocPreview.userId}_verified.pdf
              </div>
              <p className="text-[10px] text-stone-400 italic">
                DPDP Act 2023: Document access restricted to authorized moderators only. Not exposed to public web root.
              </p>
            </div>

            <div className="flex justify-end gap-2">
              {selectedDocPreview.status === 'pending' && (
                <button
                  onClick={() => {
                    handleReviewVerification(selectedDocPreview.id, 'verified');
                    setSelectedDocPreview(null);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2 rounded-xl text-xs"
                >
                  Approve Document & Verify Account
                </button>
              )}
              <button
                onClick={() => setSelectedDocPreview(null)}
                className="bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold px-4 py-2 rounded-xl text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Reason Modal */}
      {rejectionModalUser && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full border border-stone-200 p-6 space-y-4">
            <h3 className="text-base font-bold text-stone-900">
              Reject Verification for {rejectionModalUser.userName}
            </h3>
            <p className="text-xs text-stone-500">
              Provide a clear reason why this identity document could not be authenticated:
            </p>

            <textarea
              rows={3}
              placeholder="e.g. Blurry photo, name mismatch with registration, expired certificate..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full border border-stone-300 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-red-500/20"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setRejectionModalUser(null)}
                className="bg-stone-100 text-stone-700 px-4 py-2 rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleReviewVerification(
                    rejectionModalUser.id,
                    'rejected',
                    rejectionReason || 'Document details could not be validated.'
                  );
                  setRejectionModalUser(null);
                }}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-xl text-xs"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
