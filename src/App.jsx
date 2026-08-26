import React, { useState, useEffect } from 'react';

// ⚠️ 請務必將這裡換成妳最新部署的 Google Apps Script 網址
const API_URL = "https://script.google.com/macros/s/AKfycbz9UdysjI-zzvOoKI_CxXPZMA6P1KfZyItyStpfEzr7m-VAMF_45gwMLql-nmq9tbAH/exec";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('PROFILE'); // 預設顯示新功能方便測試
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  const [dbProducts, setDbProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [unpaidOrders, setUnpaidOrders] = useState([]);
  const [paymentInputs, setPaymentInputs] = useState({});

  // 下單表單狀態
  const [formData, setFormData] = useState({
    customerName: '', productName: '', amount: '', ownerPrice: '', storeName: '',
    ibvPercent: '', cashPercent: '', quantity: '1', price: '', paymentInfo: ''
  });

  // 🌟 獨立的【貴人建檔】表單狀態 (對應 A-J 欄)
  const [profileData, setProfileData] = useState({
    name: '', phone: '', address: '', health: '', skin: '', howWeMet: '', interaction: '', ig: '', line: ''
  });

  useEffect(() => {
    fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'get_products' }) })
    .then(res => res.json()).then(result => { if (result.data) setDbProducts(result.data); })
    .catch(err => console.error("無法載入資料", err));
  }, []);

  useEffect(() => {
    if (activeTab === 'UNPAID') fetchUnpaidOrders();
  }, [activeTab]);

  const fetchUnpaidOrders = () => {
    setLoading(true);
    fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'get_unpaid' }) })
      .then(res => res.json())
      .then(result => { if (result.data) setUnpaidOrders(result.data); setLoading(false); })
      .catch(err => setLoading(false));
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  
  // 🌟 處理貴人建檔的輸入
  const handleProfileChange = (e) => setProfileData({ ...profileData, [e.target.name]: e.target.value });

  const handleProductSearch = (e) => {
    const keyword = e.target.value;
    setFormData({ ...formData, productName: keyword });
    if (keyword) {
      setFilteredProducts(dbProducts.filter(p => p.name.toLowerCase().includes(keyword.toLowerCase())));
      setIsDropdownOpen(true);
    } else setIsDropdownOpen(false);
  };

  const selectProduct = (product) => {
    setFormData({ ...formData, productName: product.name, price: product.price });
    setIsDropdownOpen(false);
  };

  const handleSubmit = async (actionType) => {
    setLoading(true);
    setMessage('資料傳送中...');
    try {
      const response = await fetch(API_URL, {
        method: 'POST', body: JSON.stringify({ action: actionType, data: formData })
      });
      const result = await response.json();
      setMessage(result.data.message || '操作成功！');
      setFormData(prev => ({ ...prev, productName: '', amount: '', ownerPrice: '', storeName: '', ibvPercent: '', cashPercent: '', quantity: '1', price: '', paymentInfo: '' }));
    } catch (error) { setMessage('發生錯誤，請檢查網路。'); }
    setLoading(false);
  };

  // 🌟 送出貴人建檔
  const handleProfileSubmit = async () => {
    if (!profileData.name) { setMessage('⚠️ 姓名為必填欄位！'); return; }
    setLoading(true);
    setMessage('建立貴人檔案中...');
    try {
      const response = await fetch(API_URL, {
        method: 'POST', body: JSON.stringify({ action: 'add_profile', data: profileData })
      });
      const result = await response.json();
      setMessage(result.data.message);
      // 成功後清空表單
      if (result.data.message.includes('成功')) {
        setProfileData({ name: '', phone: '', address: '', health: '', skin: '', howWeMet: '', interaction: '', ig: '', line: '' });
      }
    } catch (error) { setMessage('發生錯誤，請檢查網路。'); }
    setLoading(false);
  };

  const handleUpdatePayment = async (order) => {
    const paymentInfo = paymentInputs[order.row];
    if (!paymentInfo) return;
    setLoading(true);
    setMessage('更新收款中...');
    try {
      const response = await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'update_payment_by_row', data: { sheetName: order.sheetName, row: order.row, paymentInfo: paymentInfo } }) });
      const result = await response.json();
      setMessage(result.data.message);
      setPaymentInputs(prev => ({ ...prev, [order.row]: '' }));
      fetchUnpaidOrders();
    } catch (error) { setMessage('更新失敗'); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
        
        <div className="bg-indigo-600 p-5 md:p-6 text-white text-center">
          <h1 className="text-xl md:text-2xl font-bold tracking-wider">全通路訂單控制台</h1>
        </div>
        
        {/* 🌟 加入第四個分頁選單 */}
        <div className="flex border-b bg-gray-50 overflow-x-auto">
          <button onClick={() => setActiveTab('PROFILE')} className={`flex-1 min-w-[120px] py-4 font-bold text-sm md:text-base transition-colors ${activeTab === 'PROFILE' ? 'text-emerald-600 border-b-4 border-emerald-600 bg-white' : 'text-gray-500 hover:text-emerald-500'}`}>🌟 貴人建檔</button>
          <button onClick={() => setActiveTab('BV')} className={`flex-1 min-w-[120px] py-4 font-bold text-sm md:text-base transition-colors ${activeTab === 'BV' ? 'text-blue-600 border-b-4 border-blue-600 bg-white' : 'text-gray-500 hover:text-blue-500'}`}>獨家代理 (BV)</button>
          <button onClick={() => setActiveTab('IBV')} className={`flex-1 min-w-[120px] py-4 font-bold text-sm md:text-base transition-colors ${activeTab === 'IBV' ? 'text-indigo-600 border-b-4 border-indigo-600 bg-white' : 'text-gray-500 hover:text-indigo-500'}`}>夥伴商店 (IBV)</button>
          <button onClick={() => setActiveTab('UNPAID')} className={`flex-1 min-w-[120px] py-4 font-bold text-sm md:text-base transition-colors ${activeTab === 'UNPAID' ? 'text-red-500 border-b-4 border-red-500 bg-white' : 'text-gray-500 hover:text-red-400'}`}>待收款對帳</button>
        </div>

        {message && (
          <div className="m-4 md:m-6 p-4 bg-green-50 text-green-700 border border-green-200 rounded-lg text-center font-medium shadow-sm">
            {message}
          </div>
        )}

        <div className="p-5 md:p-8 space-y-5">
          
          {/* 🌟 貴人建檔專屬 UI */}
          {activeTab === 'PROFILE' && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-gray-500 text-sm border-b pb-2 mb-4">建立新的潛在貴人檔案，紀錄越詳細，未來的關係經營越輕鬆！</div>
              
              {/* 區塊 1：基本聯繫 */}
              <div className="bg-emerald-50 p-5 rounded-xl border border-emerald-100 space-y-4">
                <h3 className="font-bold text-emerald-800 border-b border-emerald-200 pb-2">基本聯繫資料</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-emerald-900 mb-1.5">貴人姓名 (必填)</label>
                    <input type="text" name="name" value={profileData.name} onChange={handleProfileChange} className="w-full border border-emerald-200 rounded-lg p-3 text-base focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="例如：李曼蒂" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-emerald-900 mb-1.5">電話</label>
                    <input type="text" name="phone" value={profileData.phone} onChange={handleProfileChange} className="w-full border border-emerald-200 rounded-lg p-3 text-base focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="例如：0912345678" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-emerald-900 mb-1.5">LINE 名稱</label>
                    <input type="text" name="line" value={profileData.line} onChange={handleProfileChange} className="w-full border border-emerald-200 rounded-lg p-3 text-base focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="LINE 顯示暱稱" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-emerald-900 mb-1.5">IG 帳號</label>
                    <input type="text" name="ig" value={profileData.ig} onChange={handleProfileChange} className="w-full border border-emerald-200 rounded-lg p-3 text-base focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="@帳號" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-emerald-900 mb-1.5">寄件地址</label>
                    <input type="text" name="address" value={profileData.address} onChange={handleProfileChange} className="w-full border border-emerald-200 rounded-lg p-3 text-base focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="完整收件地址或超商門市" />
                  </div>
                </div>
              </div>

              {/* 區塊 2：身體密碼 */}
              <div className="bg-orange-50 p-5 rounded-xl border border-orange-100 space-y-4">
                <h3 className="font-bold text-orange-800 border-b border-orange-200 pb-2">身體與保養密碼</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-orange-900 mb-1.5">健康調查 (困擾/需求)</label>
                    <textarea name="health" value={profileData.health} onChange={handleProfileChange} className="w-full border border-orange-200 rounded-lg p-3 text-base focus:ring-2 focus:ring-orange-500 outline-none h-24 resize-none" placeholder="例如：容易疲勞、睡眠品質不好、想調整腸胃..." />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-orange-900 mb-1.5">膚況 (膚質/保養需求)</label>
                    <textarea name="skin" value={profileData.skin} onChange={handleProfileChange} className="w-full border border-orange-200 rounded-lg p-3 text-base focus:ring-2 focus:ring-orange-500 outline-none h-24 resize-none" placeholder="例如：混和偏乾、容易過敏、想找保濕精華..." />
                  </div>
                </div>
              </div>

              {/* 區塊 3：關係註記 */}
              <div className="bg-purple-50 p-5 rounded-xl border border-purple-100 space-y-4">
                <h3 className="font-bold text-purple-800 border-b border-purple-200 pb-2">關係註記</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-purple-900 mb-1.5">當初認識 (情境/介紹人)</label>
                    <input type="text" name="howWeMet" value={profileData.howWeMet} onChange={handleProfileChange} className="w-full border border-purple-200 rounded-lg p-3 text-base focus:ring-2 focus:ring-purple-500 outline-none" placeholder="例如：高中同學、曼蒂介紹、IG陌生開發..." />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-purple-900 mb-1.5">互動歷史 / 備註</label>
                    <textarea name="interaction" value={profileData.interaction} onChange={handleProfileChange} className="w-full border border-purple-200 rounded-lg p-3 text-base focus:ring-2 focus:ring-purple-500 outline-none h-24 resize-none" placeholder="紀錄任何聊天細節、喜好、或跟進進度..." />
                  </div>
                </div>
              </div>

              <button disabled={loading} onClick={handleProfileSubmit} className="w-full mt-2 bg-emerald-600 text-white font-bold text-lg py-4 rounded-xl shadow-md hover:bg-emerald-700 hover:shadow-lg active:scale-[0.98] transition-all">
                {loading ? '資料儲存中...' : '確認新增貴人檔案'}
              </button>
            </div>
          )}

          {/* -------------------- 舊有分頁區塊 (BV / IBV / UNPAID) 保留不動 -------------------- */}
          {activeTab !== 'UNPAID' && activeTab !== 'PROFILE' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">貴人姓名</label>
              <input type="text" name="customerName" value={formData.customerName} onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-3 text-base focus:ring-2 focus:ring-indigo-500 outline-none transition" placeholder="例如：吳宣萱" />
            </div>
          )}

          {activeTab === 'BV' && (
            <div className="space-y-5 animate-fade-in">
              <div className="grid grid-cols-1 gap-4 md:gap-6 bg-blue-50 p-5 md:p-6 rounded-xl border border-blue-100">
                <div className="relative">
                  <label className="block text-sm font-semibold text-blue-900 mb-1.5">商品名稱 (輸入關鍵字自動搜尋)</label>
                  <input type="text" name="productName" value={formData.productName} onChange={handleProductSearch} onFocus={() => { if(formData.productName) setIsDropdownOpen(true); }} onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)} className="w-full border border-blue-200 rounded-lg p-3 text-base focus:ring-2 focus:ring-blue-500 outline-none transition" placeholder="例如：OPC" autoComplete="off" />
                  {isDropdownOpen && filteredProducts.length > 0 && (
                    <ul className="absolute z-10 w-full bg-white border border-blue-200 rounded-lg shadow-xl max-h-60 overflow-y-auto mt-1">
                      {filteredProducts.map((p, idx) => (
                        <li key={idx} className="p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0" onClick={() => selectProduct(p)}>
                          <div className="font-bold text-gray-800">{p.name}</div>
                          <div className="text-blue-600 text-sm font-semibold mt-1">單件售價: NT$ {p.price.toLocaleString()}</div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-blue-900 mb-1.5">單件售價</label>
                    <input type="number" name="price" value={formData.price} onChange={handleChange} className="w-full border border-blue-200 rounded-lg p-3 text-base bg-white focus:ring-2 focus:ring-blue-500 outline-none transition" placeholder="例如：1915" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-blue-900 mb-1.5">購買數量</label>
                    <input type="number" name="quantity" value={formData.quantity} onChange={handleChange} className="w-full border border-blue-200 rounded-lg p-3 text-base bg-white focus:ring-2 focus:ring-blue-500 outline-none transition" min="1" />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">收款狀態 / 備註 (留空預設為「尚未收款」)</label>
                <input type="text" name="paymentInfo" value={formData.paymentInfo} onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-3 text-base focus:ring-2 focus:ring-blue-500 outline-none transition" placeholder="例如：中信匯款" />
              </div>
              <button disabled={loading} onClick={() => handleSubmit('add_bv')} className="w-full mt-4 bg-blue-600 text-white font-bold text-lg py-4 rounded-xl shadow-md hover:bg-blue-700 hover:shadow-lg active:scale-[0.98] transition-all">
                {loading ? '處理中...' : '確認新增 BV 訂單與排程'}
              </button>
            </div>
          )}

          {activeTab === 'IBV' && (
            <div className="space-y-5 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">商店名稱</label><input type="text" name="storeName" value={formData.storeName} onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-3 text-base focus:ring-2 focus:ring-indigo-500" placeholder="例如：慧上癮" /></div>
                <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">購買商品 (自行輸入)</label><input type="text" name="productName" value={formData.productName} onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-3 text-base focus:ring-2 focus:ring-indigo-500" placeholder="例如：月餅" /></div>
                <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">商品售價 (顧客實付)</label><input type="number" name="amount" value={formData.amount} onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-3 text-base focus:ring-2 focus:ring-indigo-500" placeholder="例如：499" /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 p-5 bg-indigo-50 rounded-xl border border-indigo-100">
                <div><label className="block text-sm font-semibold text-indigo-900 mb-1.5">店主價格</label><input type="number" name="ownerPrice" value={formData.ownerPrice} onChange={handleChange} className="w-full border border-indigo-200 rounded-lg p-3 text-base focus:ring-2 focus:ring-indigo-500" placeholder="例如：450" /></div>
                <div><label className="block text-sm font-semibold text-indigo-900 mb-1.5">IBV 回饋 (%)</label><input type="number" name="ibvPercent" value={formData.ibvPercent} onChange={handleChange} className="w-full border border-indigo-200 rounded-lg p-3 text-base focus:ring-2 focus:ring-indigo-500" placeholder="例如：13.5" step="0.1" /></div>
                <div><label className="block text-sm font-semibold text-indigo-900 mb-1.5">現金回饋 (%)</label><input type="number" name="cashPercent" value={formData.cashPercent} onChange={handleChange} className="w-full border border-indigo-200 rounded-lg p-3 text-base focus:ring-2 focus:ring-indigo-500" placeholder="例如：2" step="0.1" /></div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">收款狀態 / 備註</label>
                <input type="text" name="paymentInfo" value={formData.paymentInfo} onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-3 text-base focus:ring-2 focus:ring-indigo-500" placeholder="例如：今天已轉帳" />
              </div>
              <button disabled={loading} onClick={() => handleSubmit('add_ibv')} className="w-full mt-4 bg-indigo-600 text-white font-bold text-lg py-4 rounded-xl shadow-md hover:bg-indigo-700">
                {loading ? '傳送中...' : '確認新增 IBV 訂單'}
              </button>
            </div>
          )}

          {activeTab === 'UNPAID' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex justify-between items-end border-b pb-2">
                <h2 className="text-lg font-bold text-gray-800">尚未收款訂單 ({unpaidOrders.length} 筆)</h2>
                <button onClick={fetchUnpaidOrders} className="text-indigo-600 text-sm font-semibold hover:underline">重新整理</button>
              </div>
              {loading && <p className="text-center text-gray-500 py-4">讀取訂單中...</p>}
              {!loading && unpaidOrders.length === 0 && <p className="text-center text-gray-500 py-8 bg-gray-50 rounded-xl border border-dashed">太棒了！目前所有的訂單都已經收到款項囉 🎉</p>}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {unpaidOrders.map((order, idx) => (
                  <div key={idx} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <span className={`text-xs font-bold px-2 py-1 rounded-md ${order.sheetName === 'BV下單' ? 'bg-blue-100 text-blue-700' : 'bg-indigo-100 text-indigo-700'}`}>
                          {order.sheetName === 'BV下單' ? '獨家代理 (BV)' : '夥伴商店 (IBV)'}
                        </span>
                        <span className="text-gray-400 text-sm">{order.date ? new Date(order.date).toLocaleDateString() : '無日期'}</span>
                      </div>
                      <h3 className="font-bold text-gray-800 text-xl">{order.customerName}</h3>
                      <p className="text-gray-600 mt-1 line-clamp-2">{order.productName}</p>
                      <p className="text-red-500 font-bold mt-2 text-lg">NT$ {(order.amount || 0).toLocaleString()}</p>
                    </div>
                    <div className="mt-5 border-t pt-4">
                      <input type="text" placeholder="填寫收款方式 (例：中信轉帳)" className="w-full border border-gray-300 p-2.5 rounded-lg mb-3 text-sm focus:ring-2 focus:ring-green-500 outline-none" onChange={(e) => setPaymentInputs({...paymentInputs, [order.row]: e.target.value})} value={paymentInputs[order.row] || ''} />
                      <button onClick={() => handleUpdatePayment(order)} disabled={loading || !paymentInputs[order.row]} className="w-full bg-green-500 text-white font-bold py-2.5 rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors">確認入帳</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}