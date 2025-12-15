import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import './App.css';

function App() {
  const [fromCurrency, setFromCurrency] = useState("USD");
  const [toCurrency, setToCurrency] = useState("JPY");
  
  const [currentRate, setCurrentRate] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [newsList, setNewsList] = useState([]);
  const [rateLoading, setRateLoading] = useState(true);
  const [newsLoading, setNewsLoading] = useState(true);

  const currencies = [
    { code: 'USD', name: '🇺🇸 美金 (USD)' },
    { code: 'EUR', name: '🇪🇺 歐元 (EUR)' },
    { code: 'JPY', name: '🇯🇵 日幣 (JPY)' },
    { code: 'GBP', name: '🇬🇧 英鎊 (GBP)' },
    { code: 'CNY', name: '🇨🇳 人民幣 (CNY)' },
    { code: 'HKD', name: '🇭🇰 港幣 (HKD)' },
    { code: 'SGD', name: '🇸🇬 新加坡幣 (SGD)' },
    { code: 'AUD', name: '🇦🇺 澳幣 (AUD)' },
    { code: 'CAD', name: '🇨🇦 加幣 (CAD)' },
    { code: 'CHF', name: '🇨🇭 瑞士法郎 (CHF)' },
    { code: 'KRW', name: '🇰🇷 韓元 (KRW)' },
  ];
  
  // ⚠️⚠️ 請記得填入你的 API Key ⚠️⚠️
  const GNEWS_API_KEY = "9bb657395dc63efdf082c82e33b15f16"; 

  // 獨立出來的抓匯率功能
  const fetchRateData = async () => {
    setRateLoading(true);
    if (fromCurrency === toCurrency) {
      setCurrentRate(1);
      setHistoryData([]); 
      setRateLoading(false);
      return;
    }

    try {
      const today = new Date();
      const pastDate = new Date();
      pastDate.setDate(today.getDate() - 30);
      const endDate = today.toISOString().split('T')[0];
      const startDate = pastDate.toISOString().split('T')[0];

      const [latestRes, historyRes] = await Promise.all([
        axios.get(`https://api.frankfurter.app/latest?from=${fromCurrency}&to=${toCurrency}`),
        axios.get(`https://api.frankfurter.app/${startDate}..${endDate}?from=${fromCurrency}&to=${toCurrency}`)
      ]);

      setCurrentRate(latestRes.data.rates[toCurrency]);
      const formattedData = Object.keys(historyRes.data.rates).map(date => ({
        date: date.slice(5),
        rate: historyRes.data.rates[date][toCurrency]
      }));
      setHistoryData(formattedData);
      setRateLoading(false);
    } catch (error) {
      console.error("匯率 API 錯誤:", error);
      setCurrentRate(null);
      setRateLoading(false);
    }
  };

  // 獨立出來的抓新聞功能 (加上 useCallback 避免重複渲染)
  const fetchNewsData = useCallback(async () => {
    setNewsLoading(true);
    if (!GNEWS_API_KEY || GNEWS_API_KEY.includes("貼在這裡")) {
      setNewsLoading(false);
      return;
    }

    try {
      // 搜尋策略調整：
      // 1. 為了讓新聞更多，我們主要搜尋 "目標貨幣(例如 JPY) + Finance"
      // 2. max=6：抓取 6 則新聞填滿畫面
      const query = `${toCurrency} finance`; 
      const response = await axios.get(`https://gnews.io/api/v4/search?q=${query}&lang=en&max=6&apikey=${GNEWS_API_KEY}`);
      
      setNewsList(response.data.articles);
      setNewsLoading(false);
    } catch (error) {
      console.error("新聞 API 錯誤:", error);
      setNewsLoading(false);
    }
  }, [toCurrency, GNEWS_API_KEY]); // 當目標貨幣改變時，此函式會更新

  // 當幣別改變時，執行這兩個功能
  useEffect(() => {
    fetchRateData();
    fetchNewsData();
  }, [fromCurrency, toCurrency, fetchNewsData]);

  return (
    <div className="app-container">
      <div className="dashboard-card">
        <h1 className="title">全球匯率與財經儀表板</h1>
        
        {/* 幣別選擇區 */}
        <div className="selector-container">
          <div className="select-group">
            <label>持有貨幣</label>
            <select value={fromCurrency} onChange={(e) => setFromCurrency(e.target.value)} className="currency-select">
              {currencies.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
            </select>
          </div>
          <div className="swap-icon">➡️</div>
          <div className="select-group">
            <label>目標貨幣</label>
            <select value={toCurrency} onChange={(e) => setToCurrency(e.target.value)} className="currency-select">
              {currencies.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
            </select>
          </div>
        </div>

        {/* 匯率與圖表 */}
        <div className="rate-section">
          <div className="rate-display">
            {rateLoading ? "..." : (currentRate ? `${currentRate} ${toCurrency}` : "暫無數據")}
          </div>
          <p className="description">1 {fromCurrency} = {currentRate} {toCurrency}</p>
        </div>

        <div className="chart-section">
          <h3 className="section-title">📉 30 天匯率走勢</h3>
          <div className="chart-container">
            {rateLoading ? <div className="loading-text">載入圖表中...</div> : (
              historyData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={historyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="date" tick={{fontSize: 12}} />
                    <YAxis domain={['auto', 'auto']} tick={{fontSize: 12}} />
                    <Tooltip />
                    <Line type="monotone" dataKey="rate" stroke="#1a73e8" strokeWidth={3} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              ) : <div className="loading-text">無歷史數據</div>
            )}
          </div>
        </div>

        {/* 新聞區塊 (標題 + 刷新按鈕) */}
        <div className="news-section">
          <div className="news-header">
            <h3 className="section-title" style={{marginBottom: 0}}>📰 財經快訊 ({toCurrency})</h3>
            
            {/* 🆕 刷新按鈕 */}
            <button 
              className="refresh-btn" 
              onClick={fetchNewsData} 
              disabled={newsLoading}
            >
              {newsLoading ? "更新中..." : "🔄 刷新新聞"}
            </button>
          </div>

          <div className="news-grid">
            {newsList.length > 0 ? (
              newsList.map((news, index) => (
                <a key={index} href={news.url} target="_blank" rel="noreferrer" className="news-card">
                  <div className="news-image" style={{
                    backgroundImage: news.image ? `url(${news.image})` : 'none',
                    backgroundColor: '#eee'
                  }}></div>
                  <div className="news-content">
                    <h4 className="news-title">{news.title}</h4>
                    <p className="news-source">
                      {news.source.name} · {news.publishedAt.slice(0, 10)}
                    </p>
                  </div>
                </a>
              ))
            ) : (
              <p className="no-news">
                {newsLoading ? "載入新聞中..." : "暫無相關新聞"}
              </p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default App;