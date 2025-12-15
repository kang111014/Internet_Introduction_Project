// api/news.js
export default async function handler(request, response) {
  // 1. 從前端獲取查詢參數 (例如幣別)
  const { query } = request.query;

  // ⚠️⚠️ 請在這裡填入你的 GNews API Key ⚠️⚠️
  const API_KEY = "9bb657395dc63efdf082c82e33b15f16";

  if (!query) {
    return response.status(400).json({ error: "Missing query parameter" });
  }

  try {
    // 2. 由 Vercel 伺服器去向 GNews 發送請求
    // (伺服器對伺服器不會有 CORS 問題)
    const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&lang=en&max=6&apikey=${API_KEY}`;
    
    const res = await fetch(url);
    const data = await res.json();

    // 3. 把抓到的資料回傳給前端
    return response.status(200).json(data);

  } catch (error) {
    return response.status(500).json({ error: "Failed to fetch news", details: error.message });
  }
}