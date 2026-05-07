import { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Calendar, Tag, Package, Laptop, BookOpen, Key, Shirt, Watch, FileText } from "lucide-react";

export const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.97 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.2 },
  },
};

const STATUS_COLOR = {
  AVAILABLE: "bg-emerald-50 text-emerald-700 border border-emerald-100",
  PENDING_VERIFICATION: "bg-amber-50 text-amber-700 border border-amber-100",
  RETURNED: "bg-slate-100 text-slate-700 border border-slate-200",
};

const STATUS_LABEL = {
  AVAILABLE: "Available",
  PENDING_VERIFICATION: "Pending",
  RETURNED: "Returned",
};

const CATEGORY_COLOR = {
  Electronics: "bg-blue-100 text-blue-500",
  Stationery: "bg-purple-100 text-purple-500",
  Keys: "bg-yellow-100 text-yellow-500",
  Clothing: "bg-pink-100 text-pink-500",
  Accessories: "bg-rose-100 text-rose-500",
  Documents: "bg-slate-100 text-slate-500",
  Other: "bg-gray-100 text-gray-500",
};

// Per-category fallback icons — distinct and injective (Req 2.3)
const CATEGORY_ICON = {
  Electronics:  Laptop,
  Stationery:   BookOpen,
  Keys:         Key,
  Clothing:     Shirt,
  Accessories:  Watch,
  Documents:    FileText,
  Other:        Package,
};

export default function ItemCard({ item }) {
  const [imgError, setImgError] = useState(false);
  const isFound = item.type === "found";

  // Resolve the correct fallback icon for this item's category
  const CategoryIcon = CATEGORY_ICON[item.category] ?? Package;

  const showImage = item.imageURL && !imgError;

  return (
    <motion.article
      variants={cardVariants}
      whileHover={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={`relative bg-white border border-slate-100 rounded-3xl overflow-hidden group focus-within:ring-2 focus-within:ring-indigo-500 shadow-[0_20px_50px_rgba(8,112,184,0.07)] ${item.status === 'RETURNED' ? 'grayscale opacity-60' : ''} ${isFound ? 'border-l-4 border-l-emerald-500' : 'border-l-4 border-l-rose-500'}`}
      role="article"
      aria-label={`${item.title} - ${item.category}`}
    >
      {/* Status ribbon */}
      {item.status && (
        <div
          className={`absolute top-4 right-4 z-10 px-3 py-1 rounded-full text-xs font-semibold shadow-sm backdrop-blur-md ${STATUS_COLOR[item.status] ?? "bg-white text-slate-700 border border-slate-200"}`}
          role="status"
          aria-label={`Status: ${STATUS_LABEL[item.status]}`}
        >
          {STATUS_LABEL[item.status] ?? item.status}
        </div>
      )}

      {/* Image area — exact h-48 to match SkeletonCard (Req 7.5) */}
      <div className={`h-48 w-full overflow-hidden flex items-center justify-center ${CATEGORY_COLOR[item.category] || "bg-slate-100 text-slate-500"}`}>
        {showImage ? (
          <motion.img
            src={item.imageURL}
            alt={`Photo of ${item.title}`}
            className="h-full w-full object-cover"
            whileHover={{ scale: 1.08 }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <CategoryIcon size={48} aria-hidden="true" />
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="text-lg font-bold text-slate-900 mb-3 group-hover:text-indigo-600 transition-colors">
          {item.title}
        </h3>

        <div className="flex items-center gap-2 text-sm font-semibold text-slate-500 mb-1.5">
          <MapPin size={15} className="text-blue-500 flex-shrink-0" aria-hidden="true" />
          <span className="truncate">{item.location}</span>
        </div>

        <div className="flex items-center gap-2 text-sm font-semibold text-slate-500 mb-4">
          <Calendar size={15} className="text-purple-500 flex-shrink-0" aria-hidden="true" />
          <time dateTime={item.date}>{new Date(item.date).toLocaleDateString()}</time>
        </div>

        <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-slate-50 text-slate-600 px-3 py-1.5 rounded-full border border-slate-100">
          <Tag size={13} aria-hidden="true" />
          {item.category}
        </span>
      </div>
    </motion.article>
  );
}
