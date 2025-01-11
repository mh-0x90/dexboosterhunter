// scrapeSolscan.ts
import puppeteer from "puppeteer";

export async function getSolscanHolders(tokenAddress: string) {
  // 1. Launch Puppeteer
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // 2. Build the Solscan URL dynamically
  const solscanUrl = `https://solscan.io/token/${tokenAddress}`;

  await page.goto(solscanUrl, { waitUntil: "networkidle0" });
  await page.waitForSelector("div");

  // 3. Evaluate the page in the browser context
  const holdersCount = await page.evaluate(() => {
    const allDivs = [...document.querySelectorAll("div")];
    // Find the <div> containing "Holders"
    const labelDiv = allDivs.find((el) =>
      el.textContent?.trim().toLowerCase() === "holders"
    );
    if (!labelDiv) return null;

    // The parent element has children, [0] is "Holders", [1] is the number
    const labelParent = labelDiv.parentElement;
    if (!labelParent) return null;

    const c1 = labelParent.children[1];
    return c1?.textContent?.trim() || null;
  });

  // 4. Close browser
  await browser.close();

  // 5. Return the result
  return holdersCount;
}
