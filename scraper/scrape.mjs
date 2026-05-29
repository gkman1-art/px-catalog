import { chromium } from "playwright";
import { writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = resolve(__dirname, "../src/data/products.json");

const BASE = "https://www.welfare.mil.kr";
const LIST_URL = `${BASE}/content/content.do`;

async function scrape() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // 로그인 페이지로 이동 — 수동 로그인 대기
  await page.goto(`${BASE}/main.do`);
  console.log("로그인해주세요. 로그인 완료 후 자동으로 스크래핑이 시작됩니다...");
  await page.waitForSelector('a[href*="Logout"], a[href*="logout"]', {
    timeout: 300_000,
  });
  console.log("로그인 확인됨. 스크래핑 시작...");

  // 첫 페이지 로드 → 마지막 페이지 번호 추출
  await page.goto(
    `${LIST_URL}?m_code=114&pg=1&c_parent=0&c_depth=null&c_codex=&p_open_dt=&paging_num=10&type=user`,
  );
  const lastPage = await page.evaluate(() => {
    const links = document.querySelectorAll("a");
    for (const a of links) {
      if (a.textContent.trim() === "끝") {
        const m = a.href.match(/pg=(\d+)/);
        return m ? parseInt(m[1]) : 1;
      }
    }
    return 1;
  });
  console.log(`총 ${lastPage} 페이지 발견`);

  const products = [];

  for (let pg = 1; pg <= lastPage; pg++) {
    await page.goto(
      `${LIST_URL}?m_code=114&pg=${pg}&c_parent=0&c_depth=null&c_codex=&p_open_dt=&paging_num=10&type=user`,
    );

    const pageProducts = await page.evaluate(() => {
      const rows = document.querySelectorAll("table tr");
      const items = [];
      for (let i = 1; i < rows.length; i++) {
        const cells = rows[i].querySelectorAll("td");
        if (cells.length < 6) continue;
        const link = cells[3].querySelector("a");
        const pCodeMatch = link
          ? (link.getAttribute("href") || "").match(/p_code=(\d+)/)
          : null;
        items.push({
          id: pCodeMatch ? pCodeMatch[1] : "",
          company: cells[2].textContent.trim(),
          name: cells[3].textContent.trim(),
          spec: cells[4].textContent.trim(),
          price: cells[5].textContent.trim(),
        });
      }
      return items;
    });

    products.push(...pageProducts);
    process.stdout.write(`\r${pg}/${lastPage} 페이지 완료 (${products.length}개)`);
    await page.waitForTimeout(200);
  }

  console.log(`\n스크래핑 완료: ${products.length}개 상품`);

  const meta = {
    scrapedAt: new Date().toISOString(),
    totalProducts: products.length,
    source: "https://www.welfare.mil.kr/content/content.do?m_code=114",
  };

  writeFileSync(OUT_PATH, JSON.stringify({ meta, products }, null, 2), "utf-8");
  console.log(`저장됨: ${OUT_PATH}`);

  await browser.close();
}

scrape().catch((e) => {
  console.error("스크래핑 실패:", e);
  process.exit(1);
});
