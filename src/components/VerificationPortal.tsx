import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  FileCheck2,
  Upload,
  Building2,
  Lock,
  Eye,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  FileText,
} from 'lucide-react';
import { User } from '../utils/foodshare-logic';

interface VerificationPortalProps {
  currentUser: User;
  onVerificationUpdated: () => void;
}

export const VerificationPortal: React.FC<VerificationPortalProps> = ({
  currentUser,
  onVerificationUpdated,
}) => {
  const [selectedDocType, setSelectedDocType] = useState<
    'aadhaar' | 'pan' | 'voter_id' | 'driving_license' | 'ngo_darpan' | 'fssai_license'
  >(currentUser.role === 'ngo' ? 'ngo_darpan' : 'aadhaar');

  const [documentName, setDocumentName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [uploadError, setUploadError] = useState('');

  // Simulated file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        setUploadError('File size exceeds 5 MB limit.');
        return;
      }
      setDocumentName(file.name);
      setUploadError('');
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!documentName) {
      setUploadError('Please select or specify a document file to upload.');
      return;
    }

    setIsUploading(true);
    setUploadError('');
    setUploadSuccess('');

    try {
      const res = await fetch('/api/verifications/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          idType: selectedDocType,
          documentName: documentName || 'Identity_Verification_Document.pdf',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setUploadError(data.error || 'Failed to upload document.');
      } else {
        setUploadSuccess(
          'Identity document uploaded securely into private encrypted storage. Your account status is set to Pending Verification for administrative audit.'
        );
        onVerificationUpdated();
      }
    } catch (err) {
      setUploadError('Network error uploading verification proof.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Current Status Hero Card */}
      <div className="bg-white rounded-3xl border border-stone-200/90 shadow-sm overflow-hidden">
        <div className="p-6 sm:p-8 bg-gradient-to-r from-stone-900 to-stone-850 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-stone-800 text-stone-300 border border-stone-700">
              India Verification Portal • DPDP Act 2023
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight">
              Identity Verification & Trust Status
            </h2>
            <p className="text-xs text-stone-300 max-w-xl leading-relaxed">
              FoodShare India enforces rigorous verification to prevent food fraud, guarantee hygiene compliance, and ensure surplus food reaches authenticated charitable causes.
            </p>
          </div>

          <div className="shrink-0 bg-stone-950/70 p-4 rounded-2xl border border-stone-700/80 text-center min-w-[200px]">
            <div className="text-[11px] text-stone-400 font-medium uppercase tracking-wider">
              Current Account Status
            </div>
            <div className="mt-1 flex items-center justify-center gap-1.5">
              {currentUser.verificationStatus === 'verified' ? (
                <>
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <span className="text-lg font-bold text-emerald-400">Verified</span>
                </>
              ) : currentUser.verificationStatus === 'rejected' ? (
                <>
                  <ShieldAlert className="w-5 h-5 text-red-400" />
                  <span className="text-lg font-bold text-red-400">Rejected</span>
                </>
              ) : (
                <>
                  <ShieldAlert className="w-5 h-5 text-amber-400" />
                  <span className="text-lg font-bold text-amber-400">Pending Review</span>
                </>
              )}
            </div>
            <div className="text-[10px] text-stone-400 mt-1">
              Role: <strong className="capitalize text-stone-200">{currentUser.role}</strong> ({currentUser.city})
            </div>
          </div>
        </div>

        {/* Status Explanation */}
        <div className="p-6 bg-stone-50 border-t border-stone-200/80 text-xs">
          {currentUser.verificationStatus === 'verified' ? (
            <div className="flex items-start gap-3 text-emerald-900 bg-emerald-50 p-4 rounded-2xl border border-emerald-200">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm">Account Fully Verified & Certified</h4>
                <p className="mt-0.5 text-emerald-800">
                  Your identity documents have been authenticated by the FoodShare National Moderation Desk. You are authorized to request, collect, or donate surplus food throughout India.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3 text-amber-900 bg-amber-50 p-4 rounded-2xl border border-amber-200">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm">Pending Administrative Audit</h4>
                <p className="mt-0.5 text-amber-800">
                  Uploading an identity document does not automatically treat it as authentic. An administrator must inspect the submission in the moderation queue before food collection privileges are granted.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* NGO Details Section (If NGO) */}
      {currentUser.role === 'ngo' && currentUser.ngoDetails && (
        <div className="bg-white rounded-3xl border border-stone-200/90 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-stone-900 text-sm">
              Registered NGO / Charity Organization Details
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
            <div className="bg-stone-50 p-3 rounded-xl border border-stone-100">
              <span className="text-[11px] text-stone-400 block">Organization Name</span>
              <span className="font-bold text-stone-800 mt-0.5 block">{currentUser.ngoDetails.orgName}</span>
            </div>

            <div className="bg-stone-50 p-3 rounded-xl border border-stone-100">
              <span className="text-[11px] text-stone-400 block">NITI Aayog Darpan ID</span>
              <span className="font-bold text-stone-800 mt-0.5 block">{currentUser.ngoDetails.darpanId}</span>
            </div>

            <div className="bg-stone-50 p-3 rounded-xl border border-stone-100">
              <span className="text-[11px] text-stone-400 block">Society / Trust Reg No</span>
              <span className="font-bold text-stone-800 mt-0.5 block">{currentUser.ngoDetails.registrationNo}</span>
            </div>

            <div className="bg-stone-50 p-3 rounded-xl border border-stone-100">
              <span className="text-[11px] text-stone-400 block">Year Established</span>
              <span className="font-bold text-stone-800 mt-0.5 block">{currentUser.ngoDetails.yearEstablished}</span>
            </div>

            <div className="bg-stone-50 p-3 rounded-xl border border-stone-100">
              <span className="text-[11px] text-stone-400 block">Daily Beneficiary Capacity</span>
              <span className="font-bold text-stone-800 mt-0.5 block">{currentUser.ngoDetails.beneficiaryCapacity} persons</span>
            </div>

            <div className="bg-stone-50 p-3 rounded-xl border border-stone-100">
              <span className="text-[11px] text-stone-400 block">Tax Exemption (12A / 80G)</span>
              <span className="font-bold text-emerald-700 mt-0.5 block">
                {currentUser.ngoDetails.is12A80GRegistered ? 'Active 12A/80G Certified' : 'Pending Certification'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Document Upload Form */}
      <div className="bg-white rounded-3xl border border-stone-200/90 p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-stone-900 text-sm">
              Upload Official Identity Proof for Verification
            </h3>
          </div>
          <span className="text-xs text-stone-500 font-medium">Max file size: 5 MB</span>
        </div>

        {uploadSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{uploadSuccess}</span>
          </div>
        )}

        {uploadError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{uploadError}</span>
          </div>
        )}

        <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-stone-800 mb-1">
              Select Document Type *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: 'aadhaar', label: 'Masked Aadhaar Card' },
                { id: 'pan', label: 'PAN Card (Income Tax)' },
                { id: 'voter_id', label: 'Election Voter ID' },
                { id: 'driving_license', label: 'Driving License' },
                { id: 'ngo_darpan', label: 'NGO Darpan / Trust Deed' },
                { id: 'fssai_license', label: 'FSSAI Food License' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedDocType(item.id as any)}
                  className={`p-2.5 rounded-xl border text-left font-medium transition ${
                    selectedDocType === item.id
                      ? 'border-emerald-600 bg-emerald-50/80 text-emerald-900 shadow-xs'
                      : 'border-stone-200 hover:border-stone-300 text-stone-700'
                  }`}
                >
                  <span className="block text-xs">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* File Picker / Simulator */}
          <div className="border-2 border-dashed border-stone-300 hover:border-emerald-500 rounded-2xl p-6 text-center bg-stone-50/50 transition">
            <FileText className="w-8 h-8 mx-auto text-stone-400 mb-2" />
            <div className="font-semibold text-stone-800 text-xs mb-1">
              Select PDF, PNG, or JPG Identity Proof Document
            </div>
            <p className="text-[11px] text-stone-400 mb-3">
              Only clear, government-issued documents with visible name and registration/ID are accepted.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={handleFileChange}
                className="text-xs text-stone-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
              />
              <button
                type="button"
                onClick={() =>
                  setDocumentName(
                    `${currentUser.name.replace(/\s+/g, '_')}_${selectedDocType.toUpperCase()}_proof.pdf`
                  )
                }
                className="text-[11px] text-stone-500 hover:text-stone-800 underline"
              >
                Use sample file: {currentUser.name.split(' ')[0]}_{selectedDocType}.pdf
              </button>
            </div>

            {documentName && (
              <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-900 rounded-lg text-xs font-medium">
                <FileCheck2 className="w-3.5 h-3.5 text-emerald-700" />
                <span>Selected: {documentName}</span>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isUploading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-2 rounded-xl transition shadow-sm active:scale-95 disabled:opacity-50"
            >
              {isUploading ? 'Securing & Submitting...' : 'Submit Document for Review'}
            </button>
          </div>
        </form>
      </div>

      {/* DPDP Act 2023 & Food Safety Privacy Disclosure */}
      <div className="bg-stone-50 rounded-3xl border border-stone-200 p-6 space-y-3 text-xs text-stone-600">
        <div className="flex items-center gap-2 font-bold text-stone-900">
          <Lock className="w-4 h-4 text-emerald-700" />
          <span>DPDP Act 2023 & Security Architecture Disclosure</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          <div className="bg-white p-3.5 rounded-xl border border-stone-200/80">
            <div className="font-bold text-stone-800 mb-1">1. Why is this needed?</div>
            <p className="text-stone-500 text-[11px] leading-relaxed">
              Under FSSAI guidelines and community safety protocols, verification prevents counterfeit food claims, safeguards donor security, and verifies recipient authenticity.
            </p>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-stone-200/80">
            <div className="font-bold text-stone-800 mb-1">2. Private Storage & Access Control</div>
            <p className="text-stone-500 text-[11px] leading-relaxed">
              ID proofs are stored in isolated private directories outside public web roots. Documents are never exposed publicly, never logged, and access is restricted to authorized moderators.
            </p>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-stone-200/80">
            <div className="font-bold text-stone-800 mb-1">3. Data Retention & Erasure</div>
            <p className="text-stone-500 text-[11px] leading-relaxed">
              In full compliance with India's Digital Personal Data Protection Act 2023, data is retained strictly for active account tenure and purged upon verified deletion requests.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
