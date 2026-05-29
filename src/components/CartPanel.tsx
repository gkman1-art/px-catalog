import { useState } from "react";
import { useCart, formatPrice, parsePrice } from "../lib/cart";
import Invoice from "./Invoice";

export default function CartPanel() {
  const { items, updateQty, removeItem, clearCart, totalItems, totalPrice } =
    useCart();
  const [open, setOpen] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);

  return (
    <>
      {/* Floating cart button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-blue-600 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg hover:bg-blue-700 transition"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
        </svg>
        {totalItems > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {totalItems > 99 ? "99+" : totalItems}
          </span>
        )}
      </button>

      {/* Slide-over panel */}
      {open && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-md bg-white shadow-xl flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <h2 className="text-lg font-bold">
                장바구니{" "}
                <span className="text-sm font-normal text-gray-500">
                  ({totalItems}개)
                </span>
              </h2>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl">
                ✕
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {items.length === 0 ? (
                <div className="text-center text-gray-400 py-16">
                  <svg className="mx-auto w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                  </svg>
                  <p>장바구니가 비어 있습니다</p>
                </div>
              ) : (
                items.map((item) => (
                  <div key={item.id} className="flex items-start gap-3 bg-gray-50 rounded-lg p-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900 truncate">{item.name}</p>
                      <p className="text-xs text-gray-500">{item.company} · {item.spec}</p>
                      <p className="text-sm font-semibold text-blue-700 mt-1">
                        {item.price} × {item.qty} ={" "}
                        {formatPrice(parsePrice(item.price) * item.qty)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateQty(item.id, item.qty - 1)}
                        className="w-7 h-7 rounded border border-gray-300 bg-white flex items-center justify-center text-gray-600 hover:bg-gray-100"
                      >
                        -
                      </button>
                      <span className="w-7 text-center text-sm font-medium">{item.qty}</span>
                      <button
                        onClick={() => updateQty(item.id, item.qty + 1)}
                        className="w-7 h-7 rounded border border-gray-300 bg-white flex items-center justify-center text-gray-600 hover:bg-gray-100"
                      >
                        +
                      </button>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="w-7 h-7 rounded flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 ml-1"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-gray-200 p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">합계</span>
                  <span className="text-xl font-bold text-blue-700">
                    {formatPrice(totalPrice)}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={clearCart}
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition"
                  >
                    비우기
                  </button>
                  <button
                    onClick={() => setShowInvoice(true)}
                    className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                  >
                    계산서 출력
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showInvoice && <Invoice onClose={() => setShowInvoice(false)} />}
    </>
  );
}
