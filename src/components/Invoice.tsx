import { useRef } from "react";
import { useCart, formatPrice, parsePrice } from "../lib/cart";

interface Props {
  onClose: () => void;
}

export default function Invoice({ onClose }: Props) {
  const { items, totalPrice } = useCart();
  const invoiceRef = useRef<HTMLDivElement>(null);
  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const handlePrint = () => {
    const content = invoiceRef.current;
    if (!content) return;
    const win = window.open("", "_blank", "width=800,height=600");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>PX 마트 계산서</title>
      <style>
        body { font-family: 'Malgun Gothic', sans-serif; padding: 40px; color: #111; }
        h1 { text-align: center; font-size: 22px; margin-bottom: 4px; }
        .subtitle { text-align: center; color: #666; font-size: 13px; margin-bottom: 24px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; font-size: 13px; }
        th { background: #f5f5f5; font-weight: 600; }
        .right { text-align: right; }
        .total-row td { font-weight: bold; font-size: 15px; background: #f0f7ff; }
        .footer { text-align: center; color: #999; font-size: 11px; margin-top: 32px; }
        @media print { body { padding: 20px; } }
      </style></head><body>${content.innerHTML}</body></html>`);
    win.document.close();
    win.print();
  };

  const handlePDF = async () => {
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;

    const doc = new jsPDF();
    doc.setFont("helvetica");
    doc.setFontSize(18);
    doc.text("PX Mart Invoice", 105, 20, { align: "center" });
    doc.setFontSize(10);
    doc.text(`Date: ${dateStr}`, 105, 28, { align: "center" });

    const tableData = items.map((item, i) => [
      String(i + 1),
      item.name,
      item.company,
      item.spec,
      item.price,
      String(item.qty),
      formatPrice(parsePrice(item.price) * item.qty),
    ]);

    autoTable(doc, {
      startY: 35,
      head: [["#", "Product", "Company", "Spec", "Unit Price", "Qty", "Subtotal"]],
      body: tableData,
      foot: [["", "", "", "", "", "Total", formatPrice(totalPrice)]],
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [37, 99, 235] },
      footStyles: { fillColor: [240, 247, 255], textColor: [37, 99, 235], fontStyle: "bold" },
    });

    doc.save(`px-invoice-${dateStr}.pdf`);
  };

  const handleCSV = () => {
    const BOM = "﻿";
    const header = "번호,상품명,업체,규격,단가,수량,소계\n";
    const rows = items
      .map(
        (item, i) =>
          `${i + 1},"${item.name}","${item.company}","${item.spec}","${item.price}",${item.qty},"${formatPrice(parsePrice(item.price) * item.qty)}"`,
      )
      .join("\n");
    const footer = `\n,,,,,"합계","${formatPrice(totalPrice)}"`;
    const blob = new Blob([BOM + header + rows + footer], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `px-invoice-${dateStr}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h2 className="font-bold text-lg">계산서 미리보기</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              인쇄
            </button>
            <button
              onClick={handlePDF}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              PDF
            </button>
            <button
              onClick={handleCSV}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              CSV
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl ml-2">
              ✕
            </button>
          </div>
        </div>

        {/* Invoice content */}
        <div className="overflow-y-auto p-6" ref={invoiceRef}>
          <h1 style={{ textAlign: "center", fontSize: "22px", marginBottom: "4px" }}>
            PX 마트 계산서
          </h1>
          <p className="subtitle" style={{ textAlign: "center", color: "#666", fontSize: "13px", marginBottom: "24px" }}>
            {dateStr}
          </p>

          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ border: "1px solid #ddd", padding: "8px", background: "#f5f5f5", textAlign: "left", fontSize: "13px" }}>
                  #
                </th>
                <th style={{ border: "1px solid #ddd", padding: "8px", background: "#f5f5f5", textAlign: "left", fontSize: "13px" }}>
                  상품명
                </th>
                <th style={{ border: "1px solid #ddd", padding: "8px", background: "#f5f5f5", textAlign: "left", fontSize: "13px" }}>
                  업체
                </th>
                <th style={{ border: "1px solid #ddd", padding: "8px", background: "#f5f5f5", textAlign: "left", fontSize: "13px" }}>
                  규격
                </th>
                <th style={{ border: "1px solid #ddd", padding: "8px", background: "#f5f5f5", textAlign: "right", fontSize: "13px" }}>
                  단가
                </th>
                <th style={{ border: "1px solid #ddd", padding: "8px", background: "#f5f5f5", textAlign: "center", fontSize: "13px" }}>
                  수량
                </th>
                <th style={{ border: "1px solid #ddd", padding: "8px", background: "#f5f5f5", textAlign: "right", fontSize: "13px" }}>
                  소계
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={item.id}>
                  <td style={{ border: "1px solid #ddd", padding: "8px", fontSize: "13px" }}>{i + 1}</td>
                  <td style={{ border: "1px solid #ddd", padding: "8px", fontSize: "13px" }}>{item.name}</td>
                  <td style={{ border: "1px solid #ddd", padding: "8px", fontSize: "13px" }}>{item.company}</td>
                  <td style={{ border: "1px solid #ddd", padding: "8px", fontSize: "13px" }}>{item.spec}</td>
                  <td style={{ border: "1px solid #ddd", padding: "8px", fontSize: "13px", textAlign: "right" }}>{item.price}</td>
                  <td style={{ border: "1px solid #ddd", padding: "8px", fontSize: "13px", textAlign: "center" }}>{item.qty}</td>
                  <td style={{ border: "1px solid #ddd", padding: "8px", fontSize: "13px", textAlign: "right" }}>
                    {formatPrice(parsePrice(item.price) * item.qty)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={5} style={{ border: "1px solid #ddd", padding: "10px", background: "#f0f7ff" }} />
                <td style={{ border: "1px solid #ddd", padding: "10px", background: "#f0f7ff", textAlign: "center", fontWeight: "bold", fontSize: "14px" }}>
                  합계
                </td>
                <td style={{ border: "1px solid #ddd", padding: "10px", background: "#f0f7ff", textAlign: "right", fontWeight: "bold", fontSize: "15px", color: "#1d4ed8" }}>
                  {formatPrice(totalPrice)}
                </td>
              </tr>
            </tfoot>
          </table>

          <p style={{ textAlign: "center", color: "#999", fontSize: "11px", marginTop: "32px" }}>
            국군복지 마트(PX/BX) 판매상품 기준 · 실제 매장 가격과 다를 수 있습니다
          </p>
        </div>
      </div>
    </div>
  );
}
