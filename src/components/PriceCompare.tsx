import { useState, useEffect, useRef } from "react";
import { parsePrice, formatPrice } from "../lib/cart";

interface NaverItem {
  title: string;
  link: string;
  image: string;
  lprice: string;
  mallName: string;
  brand: string;
  productType: string;
}

interface Props {
  productName: string;
  pxPrice: string;
  onClose: () => void;
}

const cache = new Map<string, NaverItem[]>();

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "");
}

export default function PriceCompare({ productName, pxPrice, onClose }: Props) {
  const [items, setItems] = useState<NaverItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cached = cache.get(productName);
    if (cached) {
      setItems(cached);
      setLoading(false);
      return;
    }

    fetch(`/api/naver-search?query=${encodeURIComponent(productName)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.items) {
          cache.set(productName, data.items);
          setItems(data.items);
        } else {
          setError(data.error || "검색 실패");
        }
      })
      .catch(() => setError("네트워크 오류"))
      .finally(() => setLoading(false));
  }, [productName]);

  const px = parsePrice(pxPrice);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        ref={ref}
        className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <div className="min-w-0">
            <h2 className="font-bold text-base truncate">가격 비교</h2>
            <p className="text-xs text-gray-500 truncate">{productName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl ml-3 shrink-0"
          >
            ✕
          </button>
        </div>

        <div className="px-4 py-3 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
          <span className="text-sm font-medium text-blue-800">PX 판매가</span>
          <span className="text-lg font-bold text-blue-700">{pxPrice}</span>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading && (
            <div className="flex flex-col items-center py-12 text-gray-400">
              <svg
                className="w-8 h-8 animate-spin mb-3"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              <p className="text-sm">네이버 쇼핑 검색 중...</p>
            </div>
          )}

          {error && (
            <div className="text-center py-12 text-red-500 text-sm">
              {error}
            </div>
          )}

          {!loading && !error && items.length === 0 && (
            <div className="text-center py-12 text-gray-400 text-sm">
              검색 결과가 없습니다
            </div>
          )}

          {!loading && items.length > 0 && (
            <div className="space-y-3">
              {items.map((item, i) => {
                const naverPrice = parseInt(item.lprice, 10) || 0;
                const diff = naverPrice - px;
                const pct =
                  px > 0
                    ? Math.round((Math.abs(diff) / px) * 100)
                    : 0;

                return (
                  <a
                    key={i}
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex gap-3 p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50/30 transition group"
                  >
                    {item.image && (
                      <img
                        src={item.image}
                        alt=""
                        className="w-14 h-14 object-contain rounded border border-gray-100 shrink-0 bg-white"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-blue-700">
                        {stripHtml(item.title)}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {item.mallName || "네이버쇼핑"}
                        {item.brand ? ` · ${item.brand}` : ""}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-sm">
                        {formatPrice(naverPrice)}
                      </p>
                      {px > 0 && naverPrice > 0 && (
                        <p
                          className={`text-xs font-medium mt-0.5 ${
                            diff > 0
                              ? "text-green-600"
                              : diff < 0
                                ? "text-red-500"
                                : "text-gray-400"
                          }`}
                        >
                          {diff > 0
                            ? `PX가 ${formatPrice(diff)} 저렴 (${pct}%)`
                            : diff < 0
                              ? `PX가 ${formatPrice(-diff)} 비쌈 (${pct}%)`
                              : "동일 가격"}
                        </p>
                      )}
                    </div>
                  </a>
                );
              })}
            </div>
          )}
        </div>

        <div className="px-4 py-2.5 border-t border-gray-100 text-center">
          <p className="text-[10px] text-gray-400">
            네이버 쇼핑 검색 결과 · 실제 가격과 다를 수 있습니다
          </p>
        </div>
      </div>
    </div>
  );
}
