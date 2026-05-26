// Borsa Takip PWA - Veri Yönetim Sistemi (store.js)

const DEFAULT_STOCKS = {
  "THYAO": { name: "Türk Hava Yolları", price: 312.50, prevPrice: 308.20 },
  "EREGL": { name: "Ereğli Demir Çelik", price: 52.40, prevPrice: 53.60 },
  "SASA": { name: "Sasa Polyester", price: 48.90, prevPrice: 48.90 },
  "ASELS": { name: "Aselsan", price: 61.20, prevPrice: 59.80 },
  "ASTOR": { name: "Astor Enerji", price: 98.65, prevPrice: 101.40 },
  "TUPRS": { name: "Tüpraş", price: 164.80, prevPrice: 162.50 },
  "YKBNK": { name: "Yapı Kredi Bankası", price: 32.10, prevPrice: 31.90 },
  "KCHOL": { name: "Koç Holding", price: 218.40, prevPrice: 221.80 }
};

const ALL_BIST100_STOCKS = {
  "AKBNK": "Akbank T.A.Ş.",
  "ALARK": "Alarko Holding A.Ş.",
  "ARCLK": "Arçelik A.Ş.",
  "ASELS": "Aselsan Elektronik Sanayi",
  "ASTOR": "Astor Enerji A.Ş.",
  "BIMAS": "BİM Birleşik Mağazalar",
  "EREGL": "Ereğli Demir ve Çelik Fabrikaları",
  "FROTO": "Ford Otomotiv Sanayi",
  "GARAN": "Türkiye Garanti Bankası",
  "HEKTS": "Hektaş Ticaret T.A.Ş.",
  "KCHOL": "Koç Holding A.Ş.",
  "KOZAL": "Koza Altın İşletmeleri",
  "ODAS": "Odaş Elektrik Üretim",
  "PGSUS": "Pegasus Hava Taşımacılığı",
  "SAHOL": "Hacı Ömer Sabancı Holding",
  "SASA": "Sasa Polyester Sanayi",
  "SISE": "Türkiye Şişe ve Cam Fabrikaları",
  "TAVHL": "TAV Havalimanları Holding",
  "TCELL": "Turkcell İletişim Hizmetleri",
  "THYAO": "Türk Hava Yolları A.O.",
  "TOASO": "Tofaş Türk Otomobil Fabrikası",
  "TUPRS": "Tüpraş Türkiye Petrol Rafinerileri",
  "VESTL": "Vestel Elektronik Sanayi",
  "YKBNK": "Yapı ve Kredi Bankası"
};

const BorsaStore = {
  ALL_BIST100_STOCKS: ALL_BIST100_STOCKS,
  // 1. İşlemleri Getir
  getTransactions() {
    const data = localStorage.getItem('bt_transactions');
    return data ? JSON.parse(data) : [];
  },

  // 2. İşlem Ekle
  addTransaction(tx) {
    const transactions = this.getTransactions();
    const newTx = {
      id: 'tx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      symbol: tx.symbol.toUpperCase().trim(),
      type: tx.type, // 'BUY' veya 'SELL'
      quantity: parseFloat(tx.quantity),
      price: parseFloat(tx.price),
      date: tx.date || new Date().toISOString().split('T')[0]
    };
    transactions.push(newTx);
    localStorage.setItem('bt_transactions', JSON.stringify(transactions));
    
    // Eğer fiyatlar listesinde bu hisse yoksa varsayılan fiyat ata
    const prices = this.getPrices();
    if (!prices[newTx.symbol]) {
      prices[newTx.symbol] = {
        name: `${newTx.symbol} Hisse Senedi`,
        price: newTx.price,
        prevPrice: newTx.price
      };
      localStorage.setItem('bt_prices', JSON.stringify(prices));
    }

    return newTx;
  },

  // 3. İşlem Sil
  deleteTransaction(id) {
    let transactions = this.getTransactions();
    transactions = transactions.filter(tx => tx.id !== id);
    localStorage.setItem('bt_transactions', JSON.stringify(transactions));
  },

  // 4. Hisse Fiyatlarını Al
  getPrices() {
    const data = localStorage.getItem('bt_prices');
    if (!data) {
      localStorage.setItem('bt_prices', JSON.stringify(DEFAULT_STOCKS));
      return DEFAULT_STOCKS;
    }
    const parsed = JSON.parse(data);
    // Güvenlik: Eski LocalStorage verilerinde prevPrice yoksa tanımla
    for (const key in parsed) {
      if (parsed[key].prevPrice === undefined) {
        parsed[key].prevPrice = parsed[key].price;
      }
    }
    return parsed;
  },

  // 4a. Takip Listesi Sembollerini Al
  getWatchlist() {
    const data = localStorage.getItem('bt_watchlist');
    if (!data) {
      const defaultWatchlist = ["THYAO", "EREGL", "SASA", "ASELS", "ASTOR", "TUPRS", "YKBNK", "KCHOL"];
      localStorage.setItem('bt_watchlist', JSON.stringify(defaultWatchlist));
      return defaultWatchlist;
    }
    return JSON.parse(data);
  },

  // 4b. Takip Listesine Ekle
  addToWatchlist(symbol) {
    const sym = symbol.toUpperCase().trim();
    if (!sym) return;
    const list = this.getWatchlist();
    if (!list.includes(sym)) {
      list.push(sym);
      localStorage.setItem('bt_watchlist', JSON.stringify(list));
    }
    // Fiyatlarda yoksa varsayılan fiyat ata
    const prices = this.getPrices();
    if (!prices[sym]) {
      const stockName = ALL_BIST100_STOCKS[sym] || `${sym} Hisse Senedi`;
      prices[sym] = {
        name: stockName,
        price: 100.00,
        prevPrice: 100.00
      };
      localStorage.setItem('bt_prices', JSON.stringify(prices));
    }
  },

  // 4c. Takip Listesinden Çıkar
  removeFromWatchlist(symbol) {
    const sym = symbol.toUpperCase().trim();
    let list = this.getWatchlist();
    list = list.filter(s => s !== sym);
    localStorage.setItem('bt_watchlist', JSON.stringify(list));
  },

  // 5. Fiyat Güncelle (Gün Sonu)
  updatePrice(symbol, price) {
    const prices = this.getPrices();
    const newPriceVal = parseFloat(price);
    if (prices[symbol]) {
      prices[symbol].prevPrice = prices[symbol].price;
      prices[symbol].price = newPriceVal;
    } else {
      prices[symbol] = { name: `${symbol} Hisse Senedi`, price: newPriceVal, prevPrice: newPriceVal };
    }
    localStorage.setItem('bt_prices', JSON.stringify(prices));
  },

  // 6. Fiyatları Rastgele Simüle Et (Piyasa Dalgalanması)
  simulatePrices() {
    const prices = this.getPrices();
    for (const symbol in prices) {
      const oldPrice = prices[symbol].price;
      const changePercent = (Math.random() * 6 - 3) / 100; // -3% ile +3% arası değişim
      prices[symbol].prevPrice = oldPrice;
      prices[symbol].price = parseFloat((oldPrice * (1 + changePercent)).toFixed(2));
    }
    localStorage.setItem('bt_prices', JSON.stringify(prices));
    return prices;
  },

  // 7. Portföy ve Kâr/Zarar Hesaplama
  getPortfolio() {
    const transactions = this.getTransactions();
    const prices = this.getPrices();
    
    // İşlemleri tarihe göre sırala
    const sortedTx = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    const portfolio = {};

    sortedTx.forEach(tx => {
      const sym = tx.symbol;
      if (!portfolio[sym]) {
        portfolio[sym] = {
          symbol: sym,
          name: prices[sym] ? prices[sym].name : `${sym} Hisse Senedi`,
          quantity: 0,
          averageCost: 0,
          totalCost: 0,
          realizedProfit: 0,
          movements: [], // Bu pozisyonun aktif hareketleri
          closedCycles: [], // Tamamlanmış al-sat döngüleri
          
          // Döngü içi akümülatörler
          totalQtyBought: 0,
          totalCostBought: 0,
          totalQtySold: 0,
          totalRevenueSold: 0
        };
      }

      const position = portfolio[sym];

      if (tx.type === 'BUY' || tx.type === 'INITIAL') {
        const oldQty = position.quantity;
        const newQty = oldQty + tx.quantity;
        
        position.totalQtyBought += tx.quantity;
        position.totalCostBought += tx.quantity * tx.price;
        
        if (newQty > 0) {
          // Ortalama maliyet hesaplama
          position.averageCost = ((oldQty * position.averageCost) + (tx.quantity * tx.price)) / newQty;
        } else {
          position.averageCost = 0;
        }
        
        position.quantity = newQty;
        position.totalCost = position.quantity * position.averageCost;
        
        position.movements.push({
          ...tx,
          realizedProfit: 0 // Alım işleminde gerçekleşen kâr olmaz
        });
      } else if (tx.type === 'SELL') {
        const oldQty = position.quantity;
        // Satışta ortalama maliyet değişmez, gerçekleşen kâr/zarar oluşur
        const realized = (tx.price - position.averageCost) * tx.quantity;
        position.realizedProfit += realized;
        
        position.totalQtySold += tx.quantity;
        position.totalRevenueSold += tx.quantity * tx.price;
        
        position.quantity = Math.max(0, oldQty - tx.quantity);
        position.totalCost = position.quantity * position.averageCost;

        position.movements.push({
          ...tx,
          realizedProfit: realized
        });

        // Pozisyon tamamen kapandıysa döngüyü kaydet ve sıfırla
        if (position.quantity === 0) {
          const avgBuyPrice = position.totalQtyBought > 0 ? position.totalCostBought / position.totalQtyBought : position.averageCost;
          const avgSellPrice = position.totalQtySold > 0 ? position.totalRevenueSold / position.totalQtySold : tx.price;
          
          position.closedCycles.push({
            totalQty: position.totalQtySold,
            avgBuyPrice: avgBuyPrice,
            avgSellPrice: avgSellPrice,
            realizedProfit: position.realizedProfit, // o döngüde biriken toplam realized profit
            date: tx.date
          });
          
          // Sıfırlama
          position.averageCost = 0;
          position.totalCost = 0;
          position.realizedProfit = 0;
          position.totalQtyBought = 0;
          position.totalCostBought = 0;
          position.totalQtySold = 0;
          position.totalRevenueSold = 0;
        }
      }
    });

    // Aktif portföy listesini oluştur (sadece elinde hisse olanlar)
    const activeHoldings = [];
    const closedPositions = [];

    let totalActiveCost = 0;
    let totalActiveValue = 0;
    let totalRealizedProfit = 0;

    for (const sym in portfolio) {
      const pos = portfolio[sym];
      const currentPrice = prices[sym] ? prices[sym].price : pos.averageCost;
      
      // Kapanan döngüleri topla
      if (pos.closedCycles && pos.closedCycles.length > 0) {
        pos.closedCycles.forEach(cycle => {
          closedPositions.push({
            symbol: pos.symbol,
            name: pos.name,
            totalQty: cycle.totalQty,
            avgBuyPrice: cycle.avgBuyPrice,
            avgSellPrice: cycle.avgSellPrice,
            realizedProfit: cycle.realizedProfit,
            date: cycle.date
          });
          totalRealizedProfit += cycle.realizedProfit;
        });
      }
      
      // Devam eden pozisyondaki gerçekleşmiş kârları da ekle (kısmi satışlar)
      totalRealizedProfit += pos.realizedProfit;

      if (pos.quantity > 0) {
        pos.currentPrice = currentPrice;
        pos.currentValue = pos.quantity * currentPrice;
        pos.profit = pos.currentValue - pos.totalCost;
        pos.profitPercent = pos.totalCost > 0 ? (pos.profit / pos.totalCost) * 100 : 0;
        
        totalActiveCost += pos.totalCost;
        totalActiveValue += pos.currentValue;
        
        activeHoldings.push(pos);
      } else if (pos.realizedProfit !== 0 && (!pos.closedCycles || pos.closedCycles.length === 0)) {
        closedPositions.push({
          symbol: pos.symbol,
          name: pos.name,
          totalQty: pos.totalQtySold,
          avgBuyPrice: pos.totalCostBought / pos.totalQtyBought,
          avgSellPrice: pos.totalRevenueSold / pos.totalQtySold,
          realizedProfit: pos.realizedProfit,
          date: new Date().toISOString().split('T')[0]
        });
      }
    }

    const totalUnrealizedProfit = totalActiveValue - totalActiveCost;
    const totalUnrealizedProfitPercent = totalActiveCost > 0 ? (totalUnrealizedProfit / totalActiveCost) * 100 : 0;

    return {
      holdings: activeHoldings,
      closedPositions: closedPositions,
      summary: {
        totalCost: totalActiveCost,
        totalValue: totalActiveValue,
        unrealizedProfit: totalUnrealizedProfit,
        unrealizedProfitPercent: totalUnrealizedProfitPercent,
        realizedProfit: totalRealizedProfit,
        netProfit: totalUnrealizedProfit + totalRealizedProfit
      }
    };
  }
};

window.BorsaStore = BorsaStore;
