// Borsa Takip PWA - Arayüz ve Kontrol Katmanı (app.js)

document.addEventListener('DOMContentLoaded', () => {
  // --- EKRAN YÖNLENDİRME (TAB ROUTING) ---
  const tabs = document.querySelectorAll('.tab-bar .tab-item');
  const screens = document.querySelectorAll('main .screen');
  
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetScreenId = tab.getAttribute('data-target');
      
      // Tab aktifliğini güncelle
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      // Ekranı göster
      screens.forEach(screen => {
        if (screen.id === targetScreenId) {
          screen.classList.add('active');
        } else {
          screen.classList.remove('active');
        }
      });

      // İlgili ekran verilerini tazele
      if (targetScreenId === 'screen-portfolio') {
        renderPortfolio();
      } else if (targetScreenId === 'screen-history') {
        renderHistory();
      } else if (targetScreenId === 'screen-watchlist') {
        renderWatchlist();
      }
    });
  });

  // --- İŞLEM TİPİ SEÇİMİ (AL / SAT / BAŞLANGIÇ) ---
  let transactionType = 'BUY';
  const btnTypeBuy = document.getElementById('btn-type-buy');
  const btnTypeSell = document.getElementById('btn-type-sell');
  const btnTypeInit = document.getElementById('btn-type-init');
  
  const labelPrice = document.getElementById('label-price');
  const formGroupDate = document.getElementById('form-group-date');

  btnTypeBuy.addEventListener('click', () => {
    transactionType = 'BUY';
    btnTypeBuy.classList.add('active', 'buy');
    btnTypeSell.classList.remove('active', 'sell');
    btnTypeInit.classList.remove('active', 'buy');
    if (labelPrice) labelPrice.innerText = 'Birim Fiyat (TL)';
    if (formGroupDate) formGroupDate.style.display = 'block';
    const dateInput = document.getElementById('input-date');
    if (dateInput) dateInput.setAttribute('required', 'true');
  });

  btnTypeSell.addEventListener('click', () => {
    transactionType = 'SELL';
    btnTypeSell.classList.add('active', 'sell');
    btnTypeBuy.classList.remove('active', 'buy');
    btnTypeInit.classList.remove('active', 'buy');
    if (labelPrice) labelPrice.innerText = 'Birim Fiyat (TL)';
    if (formGroupDate) formGroupDate.style.display = 'block';
    const dateInput = document.getElementById('input-date');
    if (dateInput) dateInput.setAttribute('required', 'true');
  });

  btnTypeInit.addEventListener('click', () => {
    transactionType = 'INITIAL';
    btnTypeInit.classList.add('active', 'buy');
    btnTypeBuy.classList.remove('active', 'buy');
    btnTypeSell.classList.remove('active', 'sell');
    if (labelPrice) labelPrice.innerText = 'Ortalama Maliyet (TL)';
    if (formGroupDate) formGroupDate.style.display = 'none';
    const dateInput = document.getElementById('input-date');
    if (dateInput) dateInput.removeAttribute('required');
  });

  // Tarih inputunu bugüne ayarla
  const dateInput = document.getElementById('input-date');
  if (dateInput) {
    dateInput.value = new Date().toISOString().split('T')[0];
  }

  // --- HAREKET EKLEME VE OTO-FİYAT DOLDURMA ---
  const symbolsList = document.getElementById('symbols-list');
  const inputSymbol = document.getElementById('input-symbol');
  const inputPrice = document.getElementById('input-price');

  function populateDatalist() {
    if (!symbolsList) return;
    const prices = BorsaStore.getPrices();
    symbolsList.innerHTML = '';
    for (const sym in prices) {
      const option = document.createElement('option');
      option.value = sym;
      option.textContent = `${prices[sym].name} (Güncel: ${prices[sym].price} TL)`;
      symbolsList.appendChild(option);
    }
  }

  // --- TAKİP LİSTESİ ÖNERİ VE DİNAMİK ARAMA MOTORU ---
  const inputWatchlistSymbol = document.getElementById('input-watchlist-symbol');
  const watchlistSuggestions = document.getElementById('watchlist-suggestions');

  if (inputWatchlistSymbol && watchlistSuggestions) {
    inputWatchlistSymbol.addEventListener('input', (e) => {
      const query = e.target.value.toUpperCase().trim();
      watchlistSuggestions.innerHTML = '';
      
      if (!query) {
        watchlistSuggestions.style.display = 'none';
        return;
      }
      
      const bist100 = BorsaStore.ALL_BIST100_STOCKS;
      const matches = [];
      
      for (const sym in bist100) {
        const name = bist100[sym].toUpperCase();
        if (sym.includes(query) || name.includes(query)) {
          matches.push({ symbol: sym, name: bist100[sym] });
        }
      }
      
      if (matches.length > 0) {
        watchlistSuggestions.style.display = 'flex';
        matches.forEach(match => {
          const div = document.createElement('div');
          div.style.padding = '10px 14px';
          div.style.borderRadius = '8px';
          div.style.cursor = 'pointer';
          div.style.fontSize = '13px';
          div.style.color = 'var(--text-primary)';
          div.style.transition = 'background 0.2s';
          div.style.display = 'flex';
          div.style.justifyContent = 'space-between';
          
          div.innerHTML = `
            <span style="font-weight: 700; color: var(--accent-color);">${match.symbol}</span>
            <span style="color: var(--text-secondary); max-width: 70%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${match.name}</span>
          `;
          
          div.addEventListener('mouseenter', () => {
            div.style.background = 'rgba(99, 102, 241, 0.15)';
          });
          div.addEventListener('mouseleave', () => {
            div.style.background = 'none';
          });
          
          div.addEventListener('click', () => {
            inputWatchlistSymbol.value = match.symbol;
            watchlistSuggestions.style.display = 'none';
          });
          watchlistSuggestions.appendChild(div);
        });
      } else {
        watchlistSuggestions.style.display = 'none';
      }
    });

    // Sayfa dışına tıklanınca önerileri kapat
    document.addEventListener('click', (e) => {
      if (e.target !== inputWatchlistSymbol && e.target !== watchlistSuggestions) {
        watchlistSuggestions.style.display = 'none';
      }
    });
  }

  if (inputSymbol) {
    inputSymbol.addEventListener('input', (e) => {
      const sym = e.target.value.toUpperCase().trim();
      const prices = BorsaStore.getPrices();
      const priceBadge = document.getElementById('symbol-current-price-badge');
      
      if (prices[sym]) {
        if (inputPrice) {
          inputPrice.value = prices[sym].price;
        }
        if (priceBadge) {
          priceBadge.innerText = `Güncel: ${prices[sym].price.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL`;
          priceBadge.style.display = 'inline-block';
        }
      } else {
        if (priceBadge) {
          priceBadge.style.display = 'none';
        }
      }
    });
  }

  // --- HAREKET EKLEME FORMU ---
  const addForm = document.getElementById('add-transaction-form');
  addForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const symbol = document.getElementById('input-symbol').value.toUpperCase().trim();
    const quantity = parseFloat(document.getElementById('input-quantity').value);
    const price = parseFloat(document.getElementById('input-price').value);
    const date = document.getElementById('input-date').value;

    if (!symbol || isNaN(quantity) || isNaN(price)) {
      alert('Lütfen tüm alanları doğru şekilde doldurun!');
      return;
    }

    // Satış işleminde elindeki adetten fazlasını satmasını engelle
    if (transactionType === 'SELL') {
      const data = BorsaStore.getPortfolio();
      const currentHolding = data.holdings.find(h => h.symbol === symbol);
      const heldQuantity = currentHolding ? currentHolding.quantity : 0;
      
      if (quantity > heldQuantity) {
        alert(`Yetersiz bakiye! Elinizde sadece ${heldQuantity} adet ${symbol} bulunuyor.`);
        return;
      }
    }

    // İşlemi kaydet
    BorsaStore.addTransaction({
      symbol,
      type: transactionType,
      quantity,
      price,
      date: transactionType === 'INITIAL' ? '1900-01-01' : date
    });

    // Formu sıfırla ve varsayılana dön
    addForm.reset();
    transactionType = 'BUY';
    btnTypeBuy.classList.add('active', 'buy');
    btnTypeSell.classList.remove('active', 'sell');
    btnTypeInit.classList.remove('active', 'buy');
    if (labelPrice) labelPrice.innerText = 'Birim Fiyat (TL)';
    if (formGroupDate) formGroupDate.style.display = 'block';
    
    const dateInput = document.getElementById('input-date');
    if (dateInput) {
      dateInput.setAttribute('required', 'true');
      dateInput.value = new Date().toISOString().split('T')[0];
    }
    
    const priceBadge = document.getElementById('symbol-current-price-badge');
    if (priceBadge) priceBadge.style.display = 'none';
    
    // İşlem ekleme modundan çıkarıp portföye yönlendir
    alert('İşlem başarıyla eklendi!');
    const portfolioTab = document.querySelector('.tab-bar .tab-item[data-target="screen-portfolio"]');
    if (portfolioTab) portfolioTab.click();
  });

  // --- PORTFÖYÜ LİSTELEME ---
  const holdingsList = document.getElementById('holdings-list');
  const sumTotalValue = document.getElementById('summary-total-value');
  const sumTotalCost = document.getElementById('summary-total-cost');
  const sumTotalProfit = document.getElementById('summary-total-profit');

  function saveWatchlistOrder() {
    const items = document.querySelectorAll('#watchlist-list .stock-item');
    const newOrder = [];
    items.forEach(item => {
      const sym = item.getAttribute('data-symbol');
      if (sym) newOrder.push(sym);
    });
    localStorage.setItem('bt_watchlist', JSON.stringify(newOrder));
  }

  function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.stock-item:not(.dragging)')];
    return draggableElements.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child };
      } else {
        return closest;
      }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
  }

  function renderWatchlist() {
    const watchlistContainer = document.getElementById('watchlist-list');
    if (!watchlistContainer) return;
    
    const watchlistSymbols = BorsaStore.getWatchlist();
    const prices = BorsaStore.getPrices();
    watchlistContainer.innerHTML = '';
    
    if (watchlistSymbols.length === 0) {
      watchlistContainer.innerHTML = `
        <div class="empty-state" style="padding: 20px;">
          <div class="empty-state-text">Takip listeniz boş. Yukarıdan yeni bir hisse ekleyebilirsiniz.</div>
        </div>
      `;
      return;
    }
    
    watchlistSymbols.forEach(sym => {
      const stock = prices[sym] || { name: `${sym} Hisse Senedi`, price: 100.00, prevPrice: 100.00 };
      const diff = stock.price - stock.prevPrice;
      const diffPercent = stock.prevPrice > 0 ? (diff / stock.prevPrice) * 100 : 0;
      const isUp = diff > 0;
      const isZero = diff === 0;
      const changeClass = isZero ? '' : (isUp ? 'profit' : 'loss');
      const sign = isZero ? '' : (isUp ? '+' : '');
      const badgeHTML = isZero ? `<span style="font-size:10px; color:var(--text-muted);">0.00%</span>` : 
        `<span class="badge ${changeClass}" style="font-size:10px; padding:2px 6px; font-weight:700;">
          ${sign}${diffPercent.toFixed(2)}%
        </span>`;

      const item = document.createElement('div');
      item.className = 'stock-item watchlist-item';
      item.setAttribute('draggable', 'true');
      item.setAttribute('data-symbol', sym);
      item.style.cursor = 'pointer';
      item.style.display = 'flex';
      item.style.alignItems = 'center';
      
      item.innerHTML = `
        <!-- Drag Handle for Mobile & Desktop Reordering -->
        <span class="drag-handle" style="cursor: grab; padding: 10px 14px 10px 0; color: var(--text-muted); font-size: 16px; user-select: none;">☰</span>
        
        <div class="stock-info" style="flex: 2;">
          <div style="display:flex; align-items:center; gap:8px;">
            <span class="stock-symbol">${sym}</span>
            ${badgeHTML}
          </div>
          <span class="stock-name">${stock.name}</span>
          <span style="font-size: 11px; color: var(--accent-color); margin-top: 2px;">
            Alım/Satım Yap ➔
          </span>
        </div>
        
        <div class="stock-stats" style="flex: 3; flex-direction: row; justify-content: flex-end; align-items: center; gap: 10px;">
          <span style="font-weight: 600; font-size: 14px; color: var(--text-primary); margin-right: 4px;">
            ${stock.price.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL
          </span>
          
          <button class="close-sheet-btn remove-watchlist-btn" aria-label="Takip listesinden çıkar" style="width: 28px; height: 28px; font-size: 13px; color: var(--loss-color); background: rgba(244,63,94,0.05); border: 1px solid rgba(244,63,94,0.1);">✕</button>
        </div>
      `;

      // Takip listesinden çıkarma butonu dinleyicisi
      const removeBtn = item.querySelector('.remove-watchlist-btn');
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Tıklama satıra geçmesin
        if (confirm(`${sym} hissesini takip listenizden çıkarmak istiyor musunuz?`)) {
          BorsaStore.removeFromWatchlist(sym);
          populateDatalist();
          renderWatchlist();
        }
      });
      
      // Tıklanınca Ekle sekmesine geçip hisseyi ve fiyatı otomatik doldur
      item.addEventListener('click', () => {
        const addTab = document.querySelector('.tab-bar .tab-item[data-target="screen-add"]');
        if (addTab) {
          addTab.click();
          const inputSym = document.getElementById('input-symbol');
          if (inputSym) {
            inputSym.value = sym;
            inputSym.dispatchEvent(new Event('input'));
          }
        }
      });

      // Masaüstü Drag & Drop Olayları
      item.addEventListener('dragstart', (e) => {
        item.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
      });

      item.addEventListener('dragend', () => {
        item.classList.remove('dragging');
        saveWatchlistOrder();
      });

      // Mobil Touch-Drag Kaydırma Olayları (☰ butonu ile)
      const dragHandle = item.querySelector('.drag-handle');
      dragHandle.addEventListener('touchstart', (e) => {
        item.classList.add('dragging');
        e.preventDefault(); // Sayfanın kaymasını engelle
      }, { passive: false });

      dragHandle.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        const elementUnder = document.elementFromPoint(touch.clientX, touch.clientY);
        if (!elementUnder) return;
        
        const targetItem = elementUnder.closest('#watchlist-list .stock-item');
        if (targetItem && targetItem !== item) {
          const rect = targetItem.getBoundingClientRect();
          const next = (touch.clientY - rect.top) / rect.height > 0.5;
          watchlistContainer.insertBefore(item, next ? targetItem.nextSibling : targetItem);
        }
      }, { passive: false });

      dragHandle.addEventListener('touchend', () => {
        item.classList.remove('dragging');
        saveWatchlistOrder();
      });
      
      watchlistContainer.appendChild(item);
    });

    // Masaüstü için Konteyner Sürükleme Hedefi
    watchlistContainer.addEventListener('dragover', (e) => {
      e.preventDefault();
      const dragging = document.querySelector('.dragging');
      if (dragging) {
        const afterElement = getDragAfterElement(watchlistContainer, e.clientY);
        if (afterElement == null) {
          watchlistContainer.appendChild(dragging);
        } else {
          watchlistContainer.insertBefore(dragging, afterElement);
        }
      }
    });
  }

  function renderPortfolio() {
    const data = BorsaStore.getPortfolio();
    const prices = BorsaStore.getPrices(); // Fiyat farkını hesaplamak için fiyatları al
    
    // Watchlist'i her zaman güncelle
    renderWatchlist();
    
    // Özet kartını güncelle
    sumTotalValue.innerText = `${data.summary.totalValue.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL`;
    sumTotalCost.innerText = `${data.summary.totalCost.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL`;
    
    const profitVal = data.summary.unrealizedProfit;
    const profitPct = data.summary.unrealizedProfitPercent;
    
    sumTotalProfit.className = `badge ${profitVal >= 0 ? 'profit' : 'loss'}`;
    sumTotalProfit.innerText = `${profitVal >= 0 ? '+' : ''}${profitVal.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL (${profitVal >= 0 ? '+' : ''}${profitPct.toFixed(2)}%)`;

    // Portföy listesini oluştur
    holdingsList.innerHTML = '';
    
    if (data.holdings.length === 0) {
      holdingsList.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">💼</div>
          <div class="empty-state-text">Portföyünüz henüz boş. "Ekle" sekmesinden ilk hisse alımınızı kaydedebilirsiniz.</div>
        </div>
      `;
      return;
    }

    data.holdings.forEach(hold => {
      const isProfit = hold.profit >= 0;
      
      // Günlük değişim hesaplaması
      const stockPriceObj = prices[hold.symbol] || { price: hold.currentPrice, prevPrice: hold.currentPrice };
      const diff = stockPriceObj.price - stockPriceObj.prevPrice;
      const diffPercent = stockPriceObj.prevPrice > 0 ? (diff / stockPriceObj.prevPrice) * 100 : 0;
      const isUp = diff > 0;
      const isZero = diff === 0;
      const colorVal = isZero ? 'var(--text-muted)' : (isUp ? 'var(--profit-color)' : 'var(--loss-color)');
      
      const dailyChangeHTML = isZero ? '<span style="font-size:11px; color:var(--text-muted); margin-left: 6px;">(0.00%)</span>' : 
        `<span style="font-size:11px; font-weight:700; color:${colorVal}; margin-left: 6px;">
          (${isUp ? '+' : ''}${diffPercent.toFixed(2)}%)
        </span>`;

      const item = document.createElement('div');
      item.className = 'stock-item';
      item.innerHTML = `
        <div class="stock-info">
          <div style="display:flex; align-items:center; gap:8px;">
            <span class="stock-symbol">${hold.symbol}</span>
          </div>
          <span class="stock-name">${hold.name}</span>
          <span class="stock-holdings">
            ${hold.quantity.toLocaleString('tr-TR')} Adet @ ${hold.averageCost.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL (Maliyet)
          </span>
          <span style="font-size: 11px; color: var(--text-secondary); margin-top: 2px; display: flex; align-items: center;">
            Güncel Fiyat: ${hold.currentPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL ${dailyChangeHTML}
          </span>
        </div>
        <div class="stock-stats">
          <span class="stock-price">${hold.currentValue.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL</span>
          <span class="badge ${isProfit ? 'profit' : 'loss'}">
            ${isProfit ? '+' : ''}${hold.profit.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL (${isProfit ? '+' : ''}${hold.profitPercent.toFixed(2)}%)
          </span>
        </div>
      `;
      
      // Detay Bottom Sheet modalı aç
      item.addEventListener('click', () => openDetailsSheet(hold.symbol));
      holdingsList.appendChild(item);
    });
  }

  // --- DETAY BOTTOM SHEET MODALI ---
  const overlay = document.getElementById('details-overlay');
  const sheet = document.getElementById('details-sheet');
  const btnCloseSheet = document.getElementById('btn-close-sheet');
  const sheetTitle = document.getElementById('details-sheet-title');
  const sheetAvgCost = document.getElementById('sheet-average-cost');
  const sheetNetQty = document.getElementById('sheet-net-quantity');
  const sheetCurPrice = document.getElementById('sheet-current-price');
  const sheetCurPriceChange = document.getElementById('sheet-current-price-change');
  const sheetCurValue = document.getElementById('sheet-current-value');
  const sheetNetProfit = document.getElementById('sheet-net-profit');
  const sheetMovementsList = document.getElementById('sheet-movements-list');

  function openDetailsSheet(symbol) {
    const data = BorsaStore.getPortfolio();
    const pos = data.holdings.find(h => h.symbol === symbol);
    
    if (!pos) return;

    sheetTitle.innerText = `${pos.symbol} Detayları`;
    sheetAvgCost.innerText = `${pos.averageCost.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL`;
    sheetNetQty.innerText = `${pos.quantity.toLocaleString('tr-TR')} Adet`;
    sheetCurValue.innerText = `${pos.currentValue.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL`;
    
    // Güncel fiyat ve günlük yüzde değişimi hesapla
    const prices = BorsaStore.getPrices();
    const stockPriceObj = prices[pos.symbol] || { price: pos.currentPrice, prevPrice: pos.currentPrice };
    const curPriceVal = stockPriceObj.price;
    const diff = curPriceVal - stockPriceObj.prevPrice;
    const diffPercent = stockPriceObj.prevPrice > 0 ? (diff / stockPriceObj.prevPrice) * 100 : 0;
    
    if (sheetCurPrice) {
      sheetCurPrice.innerText = `${curPriceVal.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL`;
    }
    
    if (sheetCurPriceChange) {
      const isUp = diff > 0;
      const isZero = diff === 0;
      sheetCurPriceChange.style.display = 'inline-block';
      if (isZero) {
        sheetCurPriceChange.innerText = '0.00%';
        sheetCurPriceChange.style.background = 'rgba(255, 255, 255, 0.05)';
        sheetCurPriceChange.style.color = 'var(--text-muted)';
      } else {
        sheetCurPriceChange.innerText = `${isUp ? '+' : ''}${diffPercent.toFixed(2)}%`;
        sheetCurPriceChange.style.background = isUp ? 'var(--profit-bg)' : 'var(--loss-color)'; // using existing vars
        // Let's make sure it matches the CSS styles or class.
        // Actually, we can use the same background classes/colors from CSS:
        sheetCurPriceChange.style.background = isUp ? 'var(--profit-bg)' : 'var(--loss-bg)';
        sheetCurPriceChange.style.color = isUp ? 'var(--profit-color)' : 'var(--loss-color)';
      }
    }
    
    const isProfit = pos.profit >= 0;
    sheetNetProfit.className = `badge ${isProfit ? 'profit' : 'loss'}`;
    sheetNetProfit.innerText = `${isProfit ? '+' : ''}${pos.profit.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL (${isProfit ? '+' : ''}${pos.profitPercent.toFixed(2)}%)`;

    // Hareketleri listele (sadece bu hisseye özel)
    sheetMovementsList.innerHTML = '';
    pos.movements.forEach(move => {
      const isBuy = move.type === 'BUY' || move.type === 'INITIAL';
      const mItem = document.createElement('div');
      mItem.className = 'history-item';
      
      let profitText = '';
      if (isBuy) {
        // Alım veya başlangıç hareketinin güncel fiyata göre anlık kâr/zararı
        const currentStockPrice = pos.currentPrice;
        const purchasePrice = move.price;
        const txProfit = (currentStockPrice - purchasePrice) * move.quantity;
        const txProfitPct = purchasePrice > 0 ? ((currentStockPrice - purchasePrice) / purchasePrice) * 100 : 0;
        const txIsProfit = txProfit >= 0;
        profitText = `<span class="badge ${txIsProfit ? 'profit' : 'loss'}" style="margin-top: 4px; font-size: 10px; font-weight: 700;">
          Anlık PNL: ${txIsProfit ? '+' : ''}${txProfit.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL (${txIsProfit ? '+' : ''}${txProfitPct.toFixed(2)}%)
        </span>`;
      } else {
        // Satış hareketinde gerçekleşmiş kâr/zarar
        const txIsProfit = move.realizedProfit >= 0;
        
        // Anlık PNL (Satış fiyatı ile güncel fiyat arasındaki fark - Fırsat Kâr/Zararı)
        const currentStockPrice = pos.currentPrice;
        const salePrice = move.price;
        const txCurrentProfit = (salePrice - currentStockPrice) * move.quantity;
        const txCurrentProfitPct = currentStockPrice > 0 ? ((salePrice - currentStockPrice) / currentStockPrice) * 100 : 0;
        const txCurrentIsProfit = txCurrentProfit >= 0;

        profitText = `
          <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px; margin-top: 4px;">
            <span class="badge ${txIsProfit ? 'profit' : 'loss'}" style="font-size: 10px; font-weight: 700; width: fit-content;">
              Gerçekleşen PNL: ${txIsProfit ? '+' : ''}${move.realizedProfit.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL
            </span>
            <span class="badge ${txCurrentIsProfit ? 'profit' : 'loss'}" style="font-size: 10px; font-weight: 700; width: fit-content;">
              Anlık PNL: ${txCurrentIsProfit ? '+' : ''}${txCurrentProfit.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL (${txCurrentIsProfit ? '+' : ''}${txCurrentProfitPct.toFixed(2)}%)
            </span>
          </div>
        `;
      }

      let typeText = isBuy ? 'ALIM' : 'SATIŞ';
      let dateText = new Date(move.date).toLocaleDateString('tr-TR');
      let typeClass = isBuy ? 'buy' : 'sell';

      if (move.type === 'INITIAL') {
        typeText = 'BAŞLANGIÇ';
        dateText = 'Tarih Bağımsız';
      }

      mItem.innerHTML = `
        <div class="hist-left">
          <span class="hist-type-${typeClass}">${typeText}</span>
          <span class="hist-meta">${dateText}</span>
        </div>
        <div class="hist-right">
          <span class="hist-price">${move.price.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL</span>
          <span class="hist-meta">${move.quantity.toLocaleString('tr-TR')} Adet</span>
          ${profitText}
        </div>
      `;
      sheetMovementsList.appendChild(mItem);
    });

    // Hızlı Al/Sat Buton Dinleyicilerini Kur
    const sheetBtnBuy = document.getElementById('sheet-btn-buy');
    const sheetBtnSell = document.getElementById('sheet-btn-sell');

    // Mükerrer dinleyicileri önlemek için butonları klonlayıp temizle
    const newBtnBuy = sheetBtnBuy.cloneNode(true);
    const newBtnSell = sheetBtnSell.cloneNode(true);
    sheetBtnBuy.parentNode.replaceChild(newBtnBuy, sheetBtnBuy);
    sheetBtnSell.parentNode.replaceChild(newBtnSell, sheetBtnSell);

    newBtnBuy.addEventListener('click', () => {
      closeDetailsSheet();
      transactionType = 'BUY';
      btnTypeBuy.classList.add('active', 'buy');
      btnTypeSell.classList.remove('active', 'sell');
      
      const addTab = document.querySelector('.tab-bar .tab-item[data-target="screen-add"]');
      if (addTab) {
        addTab.click();
        const inputSym = document.getElementById('input-symbol');
        const inputQty = document.getElementById('input-quantity');
        if (inputSym) {
          inputSym.value = symbol;
          inputSym.dispatchEvent(new Event('input'));
        }
        if (inputQty) {
          inputQty.value = '';
          inputQty.focus();
        }
      }
    });

    newBtnSell.addEventListener('click', () => {
      closeDetailsSheet();
      transactionType = 'SELL';
      btnTypeSell.classList.add('active', 'sell');
      btnTypeBuy.classList.remove('active', 'buy');
      
      const addTab = document.querySelector('.tab-bar .tab-item[data-target="screen-add"]');
      if (addTab) {
        addTab.click();
        const inputSym = document.getElementById('input-symbol');
        const inputQty = document.getElementById('input-quantity');
        if (inputSym) {
          inputSym.value = symbol;
          inputSym.dispatchEvent(new Event('input'));
        }
        if (inputQty) {
          inputQty.value = pos.quantity; // Elindeki tüm lot sayısını otomatik doldurur!
          inputQty.focus();
        }
      }
    });

    overlay.classList.add('active');
    sheet.classList.add('active');
  }

  function closeDetailsSheet() {
    overlay.classList.remove('active');
    sheet.classList.remove('active');
  }

  overlay.addEventListener('click', closeDetailsSheet);
  btnCloseSheet.addEventListener('click', closeDetailsSheet);

  // --- GEÇMİŞ EKRANI ---
  const closedList = document.getElementById('closed-list');
  const histRealizedVal = document.getElementById('history-realized-profit');
  const historyLog = document.getElementById('history-log');

  function renderHistory() {
    const data = BorsaStore.getPortfolio();
    
    // Gerçekleşen Kâr/Zarar
    const realized = data.summary.realizedProfit;
    histRealizedVal.innerText = `${realized >= 0 ? '+' : ''}${realized.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL`;
    histRealizedVal.className = `summary-value ${realized >= 0 ? 'profit' : 'loss'}`;
    if (realized >= 0) {
      histRealizedVal.style.color = 'var(--profit-color)';
    } else {
      histRealizedVal.style.color = 'var(--loss-color)';
    }

    // Kapanan Pozisyonları Listele
    closedList.innerHTML = '';
    if (data.closedPositions.length === 0) {
      closedList.innerHTML = `
        <div class="empty-state" style="padding: 20px;">
          <div class="empty-state-text">Kapanan pozisyonunuz bulunmamaktadır.</div>
        </div>
      `;
    } else {
      data.closedPositions.forEach(cp => {
        const isProfit = cp.realizedProfit >= 0;
        const item = document.createElement('div');
        item.className = 'stock-item';
        item.style.cursor = 'default';
        item.style.flexDirection = 'column';
        item.style.alignItems = 'stretch';
        item.style.gap = '10px';
        
        item.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
            <div class="stock-info">
              <span class="stock-symbol">${cp.symbol}</span>
              <span class="stock-name">${cp.name}</span>
            </div>
            <div class="stock-stats">
              <span class="badge ${isProfit ? 'profit' : 'loss'}" style="font-weight: 700; font-size: 11px;">
                Net PNL: ${isProfit ? '+' : ''}${cp.realizedProfit.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL
              </span>
            </div>
          </div>
          
          <!-- Detaylı Al-Sat Kapanış Bilgileri -->
          <div style="display: flex; justify-content: space-between; font-size: 11px; color: var(--text-secondary); border-top: 1px solid var(--panel-border); padding-top: 8px; margin-top: 2px;">
            <span>Miktar: <b style="color: var(--text-primary);">${cp.totalQty.toLocaleString('tr-TR')} Adet</b></span>
            <span>Ort. Alış: <b style="color: var(--text-primary);">${cp.avgBuyPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL</b></span>
            <span>Ort. Satış: <b style="color: var(--text-primary);">${cp.avgSellPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL</b></span>
          </div>
          
          <div style="font-size: 9px; color: var(--text-muted); text-align: right; margin-top: -2px;">
            Kapanış Tarihi: ${new Date(cp.date).toLocaleDateString('tr-TR')}
          </div>
        `;
        closedList.appendChild(item);
      });
    }

    // Tüm Kronolojik Hareket Logu
    historyLog.innerHTML = '';
    const allTx = BorsaStore.getTransactions().sort((a, b) => new Date(b.date) - new Date(a.date)); // Yeniden eskiye
    
    if (allTx.length === 0) {
      historyLog.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📜</div>
          <div class="empty-state-text">Hareket geçmişi bulunamadı.</div>
        </div>
      `;
      return;
    }

    allTx.forEach(tx => {
      const isBuy = tx.type === 'BUY' || tx.type === 'INITIAL';
      const item = document.createElement('div');
      item.className = 'history-item';
      
      const wrapper = document.createElement('div');
      wrapper.style.display = 'flex';
      wrapper.style.justifyContent = 'space-between';
      wrapper.style.alignItems = 'center';
      wrapper.style.width = '100%';

      let typeText = isBuy ? `ALIM (${tx.symbol})` : `SATIŞ (${tx.symbol})`;
      let dateText = new Date(tx.date).toLocaleDateString('tr-TR');
      let typeClass = isBuy ? 'buy' : 'sell';

      if (tx.type === 'INITIAL') {
        typeText = `BAŞLANGIÇ (${tx.symbol})`;
        dateText = 'Tarih Bağımsız';
      }

      wrapper.innerHTML = `
        <div class="hist-left">
          <span class="hist-type-${typeClass}">${typeText}</span>
          <span class="hist-meta">${dateText}</span>
        </div>
        <div class="hist-right" style="display:flex; flex-direction:column; align-items:flex-end;">
          <span class="hist-price">${tx.price.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL</span>
          <span class="hist-meta">${tx.quantity.toLocaleString('tr-TR')} Adet</span>
        </div>
      `;
      
      item.appendChild(wrapper);
      historyLog.appendChild(item);
    });
  }

  // --- TÜM PORTFÖYÜ SIFIRLA BUTONU ---
  const btnResetPortfolio = document.getElementById('btn-reset-portfolio');
  if (btnResetPortfolio) {
    btnResetPortfolio.addEventListener('click', () => {
      if (confirm('DİKKAT! Tüm alım-satım hareketleriniz kalıcı olarak silinecek ve portföyünüz tamamen sıfırlanacaktır. Bu işlem geri alınamaz. Sıfırlamak istediğinizden emin misiniz?')) {
        localStorage.removeItem('bt_transactions');
        renderHistory();
        renderPortfolio();
        alert('Portföyünüz başarıyla sıfırlandı!');
      }
    });
  }

  // --- YENİ HİSSE TAKİBİ EKLEME FORMU ---
  const watchlistAddForm = document.getElementById('watchlist-add-form');
  if (watchlistAddForm) {
    watchlistAddForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = document.getElementById('input-watchlist-symbol');
      const symbol = input.value.toUpperCase().trim();
      
      const bist100 = BorsaStore.ALL_BIST100_STOCKS;
      if (!bist100[symbol]) {
        alert('Geçersiz Hisse Kodu! Lütfen listeden önerilen bir BIST100 hissesi seçin.');
        return;
      }

      if (symbol) {
        BorsaStore.addToWatchlist(symbol);
        input.value = '';
        populateDatalist();
        renderWatchlist();
      }
    });
  }

  // --- FİYATLARI SİMÜLE ET BUTONU ---
  const btnSimulate = document.getElementById('btn-simulate');
  btnSimulate.addEventListener('click', () => {
    BorsaStore.simulatePrices();
    populateDatalist();
    
    // Hangi ekrandaysak orayı tazele
    const activeScreen = document.querySelector('main .screen.active');
    if (activeScreen) {
      if (activeScreen.id === 'screen-portfolio') {
        renderPortfolio();
      } else if (activeScreen.id === 'screen-history') {
        renderHistory();
      } else if (activeScreen.id === 'screen-watchlist') {
        renderWatchlist();
      }
    }
    
    // Açık olan Bottom Sheet varsa onu da güncelle
    if (sheet.classList.contains('active')) {
      const activeSymbol = sheetTitle.innerText.split(' ')[0]; // Örn "THYAO Detayları"
      openDetailsSheet(activeSymbol);
    }

    // Kısa bir efekt
    btnSimulate.style.transform = 'scale(0.95)';
    setTimeout(() => {
      btnSimulate.style.transform = 'none';
    }, 100);
  });

  // --- BAŞLANGIÇ YÜKLEMESİ ---
  populateDatalist();
  renderPortfolio();
});
