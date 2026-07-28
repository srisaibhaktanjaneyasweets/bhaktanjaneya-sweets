import { config } from "./config";

/**
 * Submit URLs to the IndexNow API to notify search engines (Bing, Yandex, etc.)
 * that page contents have been updated.
 */
export async function submitToIndexNow(urls: string[]) {
  const isProd = 
    process.env.NODE_ENV === "production" || 
    (process.env.NEXT_PUBLIC_SITE_URL && !process.env.NEXT_PUBLIC_SITE_URL.includes("localhost"));
  
  if (!isProd) {
    console.log("IndexNow: Skipped submission in local/test environment for URLs:", urls);
    return;
  }

  try {
    const siteUrl = config.siteUrl.replace(/\/$/, "");
    const host = new URL(siteUrl).hostname;
    
    // Format all URLs relative to the main site url
    const formattedUrls = urls.map(u => {
      if (u.startsWith("http")) return u;
      return `${siteUrl}/${u.replace(/^\//, "")}`;
    });

    const payload = {
      host,
      key: "b58d4cca6a814540b5ccf226401efaf8",
      keyLocation: `${siteUrl}/b58d4cca6a814540b5ccf226401efaf8.txt`,
      urlList: formattedUrls,
    };

    console.log("IndexNow: Submitting URLs to IndexNow API...", formattedUrls);
    
    const response = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error(`IndexNow: API returned status ${response.status}:`, await response.text());
    } else {
      console.log("IndexNow: Successfully submitted URLs to search engines!");
    }
  } catch (error) {
    console.error("IndexNow: Failed to submit to API:", error);
  }
}
