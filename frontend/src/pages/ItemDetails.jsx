import { useParams, useNavigate } from "react-router-dom";
import { useItems } from "../context/ItemContext";
import { useAuth } from "../context/AuthContext";
import { Clock, ShieldCheck, AlertTriangle, ArrowLeft, History, Package, QrCode, Scan } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { BrowserQRCodeReader } from "@zxing/browser";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import PageWrapper from "../components/common/PageWrapper";

const STATUS_META = {
  AVAILABLE: {
    label: "Available",
    color: "bg-emerald-100 text-emerald-800 border-emerald-200",
    description: "This item has not been claimed yet.",
  },
  PENDING_VERIFICATION: {
    label: "Pending Verification / Handover",
    color: "bg-amber-100 text-amber-800 border-amber-200",
    description: "A claim is pending. Please coordinate the handover.",
  },
  RETURNED: {
    label: "Returned to Owner",
    color: "bg-slate-200 text-slate-800 border-slate-300",
    description: "The item has been successfully returned.",
  },
};

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } },
};

export default function ItemDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getItemById, submitClaim, startVerification, decideClaim, getReturnToken, scanReturnItem } = useItems();
  const { user, isAdmin } = useAuth();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [verificationMethod, setVerificationMethod] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [returnToken, setReturnToken] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const videoRef = useRef(null);
  const qrReaderRef = useRef(null);

  useEffect(() => {
    let active = true;
    const fetchItemAndToken = async () => {
      try {
        setLoading(true);
        setError(null);
        const fetchedItem = await getItemById(id);

        if (!fetchedItem) {
          if (active) setError('Item not found');
        } else {
          if (active) setItem(fetchedItem);

          // If pending verification and user is claimant, fetch the return token
          if (fetchedItem.status === 'PENDING_VERIFICATION' && fetchedItem.claimant?._id === user?._id) {
            const tokenRes = await getReturnToken(fetchedItem._id);
            if (tokenRes.success && active) {
              setReturnToken(tokenRes.token);
            }
          }
        }
      } catch (err) {
        if (active) setError(err?.message || 'Failed to load item');
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchItemAndToken();
    return () => { active = false; };
  }, [id, getItemById, getReturnToken, user?._id]);

  useEffect(() => {
    if (!showScanner || !videoRef.current) return undefined;

    const codeReader = new BrowserQRCodeReader();
    qrReaderRef.current = codeReader;

    codeReader.decodeFromVideoDevice(undefined, videoRef.current, (result, error) => {
      if (result) {
        handleScan(result, error);
      }
    }).catch((error) => {
      console.error('QR reader error:', error);
    });

    return () => {
      if (qrReaderRef.current) {
        qrReaderRef.current.reset();
        qrReaderRef.current = null;
      }
    };
  }, [showScanner]);

  const handleClaim = async () => {
    try {
      const result = await submitClaim(item?._id);
      if (result?.success) {
        alert("Claim submitted successfully!");
        const updatedItem = await getItemById(id);
        setItem(updatedItem);
      } else {
        alert(result?.message || "Failed to submit claim");
      }
    } catch (err) {
      alert(err?.message || "Failed to submit claim");
    }
  };

  const handleStartVerification = async () => {
    try {
      const result = await startVerification(item?._id, verificationMethod);
      if (result?.success) {
        alert("Verification started");
        const updatedItem = await getItemById(id);
        setItem(updatedItem);
      } else {
        alert(result?.message || "Failed to start verification");
      }
    } catch (err) {
      alert(err?.message || "Failed to start verification");
    }
  };

  const handleDecision = async (approved) => {
    if (!verificationMethod || (!approved && !adminNotes)) {
      alert("Verification method and rejection reason are required.");
      return;
    }

    try {
      const result = await decideClaim({
        itemId: item?._id,
        approved,
        verificationMethod,
        notes: adminNotes,
      });

      if (result?.success) {
        alert(approved ? "Claim approved!" : "Claim rejected");
        const updatedItem = await getItemById(id);
        setItem(updatedItem);
      } else {
        alert(result?.message || "Failed to process decision");
      }
    } catch (err) {
      alert(err?.message || "Failed to process decision");
    }
  };

  const handleScan = async (result, error) => {
    if (!!result) {
      setShowScanner(false);
      const text = result?.getText?.() || result?.text || result;
      const res = await scanReturnItem(item?._id, text);
      if (res?.success) {
        alert("Success! Handover confirmed mechanically via QR verification.");
        const updatedItem = await getItemById(id);
        setItem(updatedItem);
      } else {
        alert(res?.message || "Invalid QR Code.");
      }
    }
  };

  if (loading) {
    return (
      <PageWrapper>
        <div className="min-h-screen flex items-center justify-center text-slate-900 bg-slate-50">
          <div className="text-center">
            <div className="spinner mb-4 mx-auto border-t-indigo-500"></div>
            <p className="text-xl font-medium text-slate-500">Loading item...</p>
          </div>
        </div>
      </PageWrapper>
    );
  }

  if (error || !item) {
    return (
      <PageWrapper>
        <div className="min-h-screen flex items-center justify-center text-slate-900 bg-slate-50">
          <div className="text-center">
            <AlertTriangle size={64} className="text-red-500 mx-auto mb-4" />
            <p className="text-xl text-slate-500 mb-6 font-medium">{error || 'Item not found'}</p>
            <button
              onClick={() => navigate(-1)}
              className="px-6 py-3 bg-indigo-500 text-white rounded-xl font-bold hover:bg-indigo-600 shadow-md transition"
            >
              Go Back
            </button>
          </div>
        </div>
      </PageWrapper>
    );
  }

  const statusInfo = STATUS_META[item?.status] || STATUS_META.AVAILABLE;
  const locationText = item?.geoLocation?.address || item?.location || 'Location not specified';

  return (
    <PageWrapper>
      <div className="min-h-screen px-6 py-14 md:py-20 bg-slate-50 text-slate-900">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          className="max-w-5xl mx-auto bg-white rounded-3xl p-8 md:p-12 shadow-sm border-2 border-slate-200 relative overflow-hidden"
        >
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition mb-8 text-sm font-semibold"
          >
            <ArrowLeft size={16} /> Back
          </button>

          <div className="flex flex-col md:flex-row gap-10">
            <div className="md:w-1/2 space-y-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="rounded-2xl overflow-hidden shadow-sm border-2 border-slate-100 bg-slate-50"
              >
                {item?.imageURL ? (
                  <img
                    src={item.imageURL}
                    alt={item?.title || 'Item'}
                    className="w-full h-72 object-cover hover:scale-105 transition duration-500"
                  />
                ) : (
                  <div className="w-full h-72 flex items-center justify-center text-slate-400">
                    <Package size={64} />
                  </div>
                )}
              </motion.div>

              <div>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className={`inline-block px-4 py-1.5 rounded-full text-xs font-bold border-2 mb-4 ${statusInfo?.color || ''}`}
                >
                  {statusInfo?.label || 'Unknown'}
                </motion.div>
                <h1 className="text-3xl font-black text-slate-900 mb-2">{item?.title || 'Untitled'}</h1>
                <p className="text-indigo-500 font-bold text-sm mb-4">{item?.category || 'Uncategorized'}</p>
                <p className="text-slate-500 font-medium text-sm leading-relaxed mb-6">
                  <span className="text-slate-900 font-bold">Location: </span>{locationText}
                </p>
                <p className="text-slate-500 font-medium text-sm">
                  {statusInfo?.description || ''}
                </p>
              </div>

              {!isAdmin && item?.status === "AVAILABLE" && (
                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleClaim}
                  className="w-full bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-4 rounded-xl font-bold transition-all shadow-md focus:ring-4 focus:ring-indigo-500/20 outline-none"
                >
                  Submit Claim Request
                </motion.button>
              )}

              {/* QR GENERATOR FOR CLAIMANT */}
              {item?.status === "PENDING_VERIFICATION" && item?.claimant?._id === user?._id && returnToken && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-6 flex flex-col items-center shadow-inner"
                >
                  <div className="text-indigo-500 mb-2"><QrCode size={32} /></div>
                  <h3 className="text-lg font-black text-slate-900 mb-2">Your Return Token</h3>
                  <p className="text-sm font-medium text-slate-500 mb-6 text-center max-w-xs">Show this secure QR Code to the person who found the item. Once they scan it, the system will finalize the handover.</p>
                  <div className="bg-white p-4 rounded-2xl shadow-sm border-2 border-slate-100">
                    <QRCodeSVG value={returnToken} size={180} />
                  </div>
                </motion.div>
              )}

              {/* QR SCANNER FOR FINDER */}
              {item?.status === "PENDING_VERIFICATION" && item?.createdBy?._id === user?._id && (
                <div className="space-y-4">
                  {!showScanner ? (
                    <motion.button
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowScanner(true)}
                      className="w-full flex justify-center items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-4 rounded-xl font-bold transition-all shadow-md focus:ring-4 focus:ring-emerald-500/20 outline-none"
                    >
                      <Scan size={20} /> Scan QR to Confirm Physical Return
                    </motion.button>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-slate-900 rounded-2xl p-4 overflow-hidden shadow-2xl relative"
                    >
                      <button onClick={() => setShowScanner(false)} className="absolute top-2 right-4 text-white/50 hover:text-white z-10 font-bold">Close X</button>
                      <div className="relative overflow-hidden rounded-2xl bg-black">
                        <video ref={videoRef} className="w-full min-h-[320px] object-cover" />
                        <div className="pointer-events-none absolute inset-0 border-4 border-dashed border-white/30" />
                      </div>
                      <p className="text-center text-white/70 text-sm mt-3 font-medium">Point your camera at the Claimant's QR Code.</p>
                    </motion.div>
                  )}
                </div>
              )}

              {isAdmin && item?.status === "UNDER_VERIFICATION" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="space-y-4 bg-white/5 p-5 rounded-2xl border border-white/10"
                >
                  <p className="font-semibold text-sm text-orange-300">Verification Tools</p>
                  <select
                    value={verificationMethod}
                    onChange={(e) => setVerificationMethod(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white text-sm"
                  >
                    <option value="" className="text-black">Select Verification Method</option>
                    <option value="ID Match" className="text-black">ID Match</option>
                    <option value="Description Match" className="text-black">Description Match</option>
                    <option value="Security Approval" className="text-black">Security Approval</option>
                  </select>

                  <textarea
                    placeholder="Admin notes / rejection reason"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white text-sm placeholder-white/40"
                    rows={3}
                  />

                  <div className="flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleDecision(true)}
                      className="flex-1 bg-green-600 px-4 py-3 rounded-xl font-bold text-sm"
                    >
                      Approve
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleDecision(false)}
                      className="flex-1 bg-red-600 px-4 py-3 rounded-xl font-bold text-sm"
                    >
                      Reject
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </div>

            <div className="md:w-1/2 flex flex-col h-full space-y-6">
              <section className="bg-slate-50 rounded-2xl p-6 border-2 border-slate-200">
                <h2 className="text-lg font-black text-slate-900 mb-3 flex items-center gap-2">
                  <ShieldCheck size={18} className="text-indigo-500" /> Handover Process
                </h2>
                <ul className="text-sm font-medium text-slate-600 space-y-2.5">
                  <li className="flex gap-2"><span className="text-indigo-500 font-bold">•</span> Finders and Claimants meet physically.</li>
                  <li className="flex gap-2"><span className="text-indigo-500 font-bold">•</span> Claimant opens this page to reveal the secure QR Token.</li>
                  <li className="flex gap-2"><span className="text-indigo-500 font-bold">•</span> Finder opens this page to Scan the QR Token to verify.</li>
                  <li className="flex gap-2"><span className="text-indigo-500 font-bold">•</span> Scans write an immutable `RETURNED` receipt to the Database.</li>
                </ul>
              </section>

              <section className="flex-1 border-t-2 border-slate-100 pt-6">
                <div className="flex justify-between items-end mb-4">
                  <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <Clock size={18} className="text-indigo-500" /> Recent History
                  </h2>
                </div>

                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  className="space-y-3"
                >
                  {item?.history?.slice(-3).map((event, idx) => (
                    <motion.div
                      variants={itemVariants}
                      key={idx}
                      className="bg-slate-50 rounded-xl p-4 text-sm border-2 border-slate-100"
                    >
                      <p className="font-bold text-slate-900">{event?.message || 'No message'}</p>
                      <div className="flex justify-between items-center mt-2">
                        <p className="text-slate-500 font-medium text-xs">
                          {event?.by?.name || event?.by || 'Unknown'} ({event?.role || 'user'})
                        </p>
                        <p className="text-indigo-500 font-bold text-xs">
                          {event?.time ? new Date(event.time).toLocaleString() : 'Unknown time'}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </section>

              <div className="flex items-start gap-3 bg-amber-50 border-2 border-amber-200 rounded-xl p-4 text-xs text-amber-800 font-medium">
                <AlertTriangle size={20} className="text-amber-500 shrink-0" />
                <p>
                  Actions logged in the history panel constitute the immutable audit trail and cannot be edited or deleted by non-administrators.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </PageWrapper>
  );
}
