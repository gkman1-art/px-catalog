import { useState, useMemo, useRef, useEffect } from "react";
import Fuse from "fuse.js";
import catalogData from "../data/products.json";

interface Product {
  id: string;
  company: string;
  name: string;
  spec: string;
  price: string;
}

const IMAGE_BASE = "https://www.welfare.mil.kr/shop/imgView.do?p_code=";
const ITEMS_PER_PAGE = 50;

function parsePrice(price: string): number {
  return parseInt(price.replace(/[^0-9]/g, ""), 10) || 0;
}

const products: Product[] = catalogData.products;

const fuse = new Fuse(products, {
  keys: ["name", "company", "spec"],
  threshold: 0.3,
  ignoreLocation: true,
});

const companies = [...new Set(products.map((p) => p.company))].sort();

function ProductImage({ id, name }: { id: string; name: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className="w-12 h-12 rounded border border-gray-200 bg-gray-100 flex items-center justify-center text-gray-400 text-xs font-medium">
        {name.charAt(0)}
      </div>
    );
  }
  return (
    <img
      src={IMAGE_BASE + id}
      alt={name}
      loading="lazy"
      className="w-12 h-12 object-contain rounded border border-gray-100"
      onError={() => setFailed(true)}
    />
  );
}

type SortKey = "name" | "price-asc" | "price-desc" | "company";

export default function Catalog() {
  const [query, setQuery] = useState("");
  const [selectedCompany, setSelectedCompany] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("name");
  const [page, setPage] = useState(1);
  const [companySearch, setCompanySearch] = useState("");
  const [companyDropdownOpen, setCompanyDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setCompanyDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = useMemo(() => {
    let result: Product[];

    if (query.trim()) {
      result = fuse.search(query).map((r) => r.item);
    } else {
      result = [...products];
    }

    if (selectedCompany) {
      result = result.filter((p) => p.company === selectedCompany);
    }

    switch (sortBy) {
      case "name":
        result.sort((a, b) => a.name.localeCompare(b.name, "ko"));
        break;
      case "price-asc":
        result.sort((a, b) => parsePrice(a.price) - parsePrice(b.price));
        break;
      case "price-desc":
        result.sort((a, b) => parsePrice(b.price) - parsePrice(a.price));
        break;
      case "company":
        result.sort((a, b) => a.company.localeCompare(b.company, "ko"));
        break;
    }

    return result;
  }, [query, selectedCompany, sortBy]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paged = filtered.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE,
  );

  useEffect(() => {
    setPage(1);
  }, [query, selectedCompany, sortBy]);

  const filteredCompanies = companySearch
    ? companies.filter((c) =>
        c.toLowerCase().includes(companySearch.toLowerCase()),
      )
    : companies;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          PX 마트 판매상품 카탈로그
        </h1>
        <p className="text-gray-500 text-sm">
          국군복지 마트(PX/BX) 판매상품 검색 · 총{" "}
          <strong>{products.length.toLocaleString()}</strong>개 상품
          <span className="ml-2 text-xs text-gray-400">
            업데이트: {catalogData.meta.scrapedAt.slice(0, 10)}
          </span>
        </p>
      </header>

      {/* Search & Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search input */}
          <div className="flex-1 relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="상품명, 업체명, 규격으로 검색..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>

          {/* Company filter */}
          <div className="relative w-full sm:w-64" ref={dropdownRef}>
            <button
              onClick={() => setCompanyDropdownOpen(!companyDropdownOpen)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-left bg-white hover:bg-gray-50 transition flex items-center justify-between"
            >
              <span
                className={
                  selectedCompany ? "text-gray-900" : "text-gray-400"
                }
              >
                {selectedCompany || "업체 필터"}
              </span>
              <svg
                className={`w-4 h-4 text-gray-400 transition ${companyDropdownOpen ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            {companyDropdownOpen && (
              <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-hidden">
                <div className="p-2 border-b border-gray-100">
                  <input
                    type="text"
                    value={companySearch}
                    onChange={(e) => setCompanySearch(e.target.value)}
                    placeholder="업체명 검색..."
                    className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                    autoFocus
                  />
                </div>
                <div className="overflow-y-auto max-h-48">
                  <button
                    onClick={() => {
                      setSelectedCompany("");
                      setCompanyDropdownOpen(false);
                      setCompanySearch("");
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-blue-50 text-blue-600 font-medium"
                  >
                    전체 업체
                  </button>
                  {filteredCompanies.map((c) => (
                    <button
                      key={c}
                      onClick={() => {
                        setSelectedCompany(c);
                        setCompanyDropdownOpen(false);
                        setCompanySearch("");
                      }}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 ${selectedCompany === c ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-700"}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortKey)}
            className="px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition sm:w-40"
          >
            <option value="name">이름순</option>
            <option value="price-asc">가격 낮은순</option>
            <option value="price-desc">가격 높은순</option>
            <option value="company">업체순</option>
          </select>
        </div>

        {/* Active filters */}
        {(query || selectedCompany) && (
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-500">
              {filtered.length.toLocaleString()}개 결과
            </span>
            {query && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                검색: {query}
                <button onClick={() => setQuery("")} className="hover:text-blue-900">
                  ✕
                </button>
              </span>
            )}
            {selectedCompany && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                {selectedCompany}
                <button
                  onClick={() => setSelectedCompany("")}
                  className="hover:text-green-900"
                >
                  ✕
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Product Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-16">
                  이미지
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  상품명
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                  업체
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">
                  규격
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  판매가
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paged.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3">
                    <ProductImage id={p.id} name={p.name} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900 text-sm">
                      {p.name}
                    </div>
                    <div className="text-xs text-gray-400 sm:hidden">
                      {p.company}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 hidden sm:table-cell">
                    {p.company}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 hidden md:table-cell">
                    {p.spec}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-sm text-blue-700 whitespace-nowrap">
                    {p.price}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {paged.length === 0 && (
          <div className="py-16 text-center text-gray-400">
            <svg
              className="mx-auto w-12 h-12 mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p>검색 결과가 없습니다</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
            <span className="text-sm text-gray-500">
              {(page - 1) * ITEMS_PER_PAGE + 1} -{" "}
              {Math.min(page * ITEMS_PER_PAGE, filtered.length)} /{" "}
              {filtered.length.toLocaleString()}
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                이전
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const start = Math.max(
                  1,
                  Math.min(page - 2, totalPages - 4),
                );
                const pageNum = start + i;
                if (pageNum > totalPages) return null;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`px-3 py-1.5 text-sm border rounded-md transition ${
                      page === pageNum
                        ? "bg-blue-600 text-white border-blue-600"
                        : "border-gray-300 bg-white hover:bg-gray-50"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                다음
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="mt-8 text-center text-xs text-gray-400">
        <p>
          데이터 출처:{" "}
          <a
            href="https://www.welfare.mil.kr/content/content.do?m_code=114"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-gray-600"
          >
            국군복지포털
          </a>{" "}
          · 비공식 검색 도구
        </p>
      </footer>
    </div>
  );
}
