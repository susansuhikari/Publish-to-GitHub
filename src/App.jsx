import React, { useState, useEffect } from 'react';

const API_URL = "https://script.google.com/macros/s/AKfycbz9UdysjI-zzvOoKI_CxXPZMA6P1KfZyItyStpfEzr7m-VAMF_45gwMLql-nmq9tbAH/exec";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('PROFILE');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  const [dbProducts, setDbProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [unpaidOrders, setUnpaidOrders] = useState([]);
  const [paymentInputs, setPaymentInputs] = useState({});
  const [undeliveredOrders, setUndeliveredOrders] = useState([]);
  
  // 每週防呆跟進狀態
  const [weeklyTasks, setWeeklyTasks] = useState([]);
  const [checkedTasks, setCheckedTasks] = useState({});

  const [formData, setFormData] = useState({
    customerName: '', productName: '', amount: '', ownerPrice: '', storeName: '',
    ibvPercent: '', cashPercent: '', quantity: '1', price: '', paymentInfo: '',
    deliveryDate: new Date().toISOString().split('T')[0]
  });

  const [profileData, setProfileData] = useState({
    name: '', phone: '', address: '', health: '', skin: '', howWeMet: '', interaction: '', ig: '', line: ''
  });

  useEffect(() => {
    fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'get_products' }) })
    .then(res => res.json()).then(result => { if (result.data) setDbProducts(result.data); })
    .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    if (activeTab === 'UNPAID') fetchUnpaidOrders();
    if (activeTab === 'UNDELIVERED') fetchUndeliveredOrders();
    if (activeTab === 'WEEKLY_CHECK') fetchWeeklyTasks();
  }, [activeTab]);

  const fetchUnpaidOrders = () => {
    setLoading(true);
    fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'get_unpaid' }) })
      .then(res => res.json()).then(result => { if (result.data) setUnpaidOrders(result.data); setLoading(false); })
      .catch(err => setLoading(false));
  };

  const fetchUndeliveredOrders = () => {
    setLoading(true);
    fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'get_undelivered' }) })
      .then(res => res.json()).then(result => { if (result.data) setUndeliveredOrders(result.data); setLoading(false); })
      .catch(err => setLoading(false));
  };

  const fetchWeeklyTasks = () => {
    setLoading(true);
    fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'get_weekly_followup' }) })
      .then(res => res.json()).then(result => { if (result.data) setWeeklyTasks(result.data); setLoading(false); })
      .catch(err => setLoading(false));
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
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
      setFormData(prev => ({ 
        ...prev, productName: '', amount: '', ownerPrice: '', storeName: '', 
        ibvPercent: '', cashPercent: '', quantity: '1', price: '', paymentInfo: '',
        deliveryDate: new Date().toISOString().split('T')[0]
      }));
    } catch (error) { setMessage('發生錯誤'); }
    setLoading(false);
  };

  const handleProfileSubmit = async () => {
    if (!profileData.name) { setMessage('⚠️ 姓名為必填！'); return; }
    setLoading(true);
    try {
      const response = await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'add_profile', data: profileData }) });
      const result = await response.json();
      setMessage(result.data.message);
      if (result.data.message.includes('成功')) setProfileData({ name: '', phone: '', address: '', health: '', skin: '', howWeMet: '', interaction: '', ig: '', line: '' });
    } catch (error) { setMessage('發生錯誤'); }
    setLoading(false);
  };

  const handleUpdatePayment = async (order) => {
    const paymentInfo = paymentInputs[order.row];
    if (!paymentInfo) return;
    setLoading(true);
    try {
      const response = await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'update_payment_by_row', data: { sheetName: order.sheetName, row: order.row, paymentInfo: paymentInfo } }) });
      const result = await response.json();
      setMessage(result.data.message);
      setPaymentInputs(prev => ({ ...prev, [order.row]: '' }));
      fetchUnpaidOrders();
    } catch (error) { setMessage('更新失敗'); }
    setLoading(false);
  };

  const handleUpdateDelivery = async (order, statusType) => {
    setLoading(true);
    try {
      const response = await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'update_delivery_by_row', data: { sheetName: order.sheetName, row: order.row, deliveryStatus: statusType } }) });
      const result = await response.json();
      setMessage(result.data.message);
      fetchUndeliveredOrders();
    } catch (error) { setMessage('更新失敗'); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
        
        <div className="bg-indigo-600 p-5 text-white text-center">
          <h1 className="text-xl md:text-2xl font-bold tracking-wider">全通路訂單控制台</h1>
        </div>
        
        {/* 分頁導覽列 */}
        <div className="flex border-b bg-gray-50 overflow-x-auto">
          <button onClick={() => setActiveTab('PROFILE')} className={`flex-1 min-w-[90px] py-3 font-bold text-xs md:text-sm ${activeTab === 'PROFILE' ? 'text-emerald-600 border-b-4 border-emerald-600 bg-white' : 'text-gray-500'}`}>🌟 貴人建檔</button>
          <button onClick={() => setActiveTab('BV')} className={`flex-1 min-w-[90px] py-3 font-bold text-xs md:text-sm ${activeTab === 'BV' ? 'text-blue-600 border-b-4 border-blue-600 bg-white' : 'text-gray-500'}`}>獨家代理</button>
          <button onClick={() => setActiveTab('IBV')} className={`flex-1 min-w-[90px] py-3 font-bold text-xs md:text-sm ${activeTab === 'IBV' ? 'text-indigo-600 border-b-4 border-indigo-600 bg-white' : 'text-gray-500'}`}>夥伴商店</button>
          <button onClick={() => setActiveTab('UNPAID')} className={`flex-1 min-w-[90px] py-3 font-bold text-xs md:text-sm ${activeTab === 'UNPAID' ? 'text-red-500 border-b-4 border-red-500 bg-white' : 'text-gray-500'}`}>待收款</button>
          <button onClick={() => setActiveTab('UNDELIVERED')} className={`flex-1 min-w-[90px] py-3 font-bold text-xs md:text-sm ${activeTab === 'UNDELIVERED' ? 'text-orange-500 border-b-4 border-orange-500 bg-white' : 'text-gray-500'}`}>待交貨</button>
          <button onClick={() => setActiveTab('WEEKLY_CHECK')} className={`flex-1 min-w-[100px] py-3 font-bold text-xs md:text-sm ${activeTab === 'WEEKLY_CHECK' ? 'text-purple-600 border-b-4 border-purple-600 bg-white' : 'text-gray-500'}`}>🛡️ 每週防呆</button>
        </div>

        {message && <div className="m-4 p-3 bg-green-50 text-green-700 border border-green-200 rounded-lg text-center font-medium">{message}</div>}

        <div className="p-5 md:p-8 space-y-5">
          
          {/* 1. 貴人建檔 */}
          {activeTab === 'PROFILE' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-emerald-50 p-5 rounded-xl border border-emerald-100 space-y-4">
                <h3 className="font-bold text-emerald-800 border-b border-emerald-200 pb-2">基本聯繫資料</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="text-sm font-semibold text-emerald-900 mb-1 block">貴人姓名 (必填)</label><input type="text" name="name" value={profileData.name} onChange={handleProfileChange} className="w-full border p-3 rounded-lg outline-none" placeholder="例如：吳宣萱" /></div>
                  <div><label className="text-sm font-semibold text-emerald-900 mb-1 block">電話</label><input type="text" name="phone" value={profileData.phone} onChange={handleProfileChange} className="w-full border p-3 rounded-lg outline-none" placeholder="0912345678" /></div>
                  <div><label className="text-sm font-semibold text-emerald-900 mb-1 block">LINE 名稱</label><input type="text" name="line" value={profileData.line} onChange={handleProfileChange} className="w-full border p-3 rounded-lg outline-none" placeholder="LINE 暱稱" /></div>
                  <div><label className="text-sm font-semibold text-emerald-900 mb-1 block">IG 帳號</label><input type="text" name="ig" value={profileData.ig} onChange={handleProfileChange} className="w-full border p-3 rounded-lg outline-none" placeholder="@帳號" /></div>
                  <div className="md:col-span-2"><label className="text-sm font-semibold text-emerald-900 mb-1 block">寄件地址</label><input type="text" name="address" value={profileData.address} onChange={handleProfileChange} className="w-full border p-3 rounded-lg outline-none" placeholder="地址或超商門市" /></div>
                </div>
              </div>
              <button disabled={loading} onClick={handleProfileSubmit} className="w-full bg-emerald-600 text-white font-bold py-4 rounded-xl shadow-md hover:bg-emerald-700">確認新增貴人檔案</button>
            </div>
          )}

          {/* 2. 獨家代理 (BV) */}
          {activeTab === 'BV' && (
            <div className="space-y-5 animate-fade-in">
              <div><label className="text-sm font-semibold text-gray-700 mb-1 block">貴人姓名 (若為自用請填: 名字 [自用] 或 名字 [月要求])</label><input type="text" name="customerName" value={formData.customerName} onChange={handleChange} className="w-full border p-3 rounded-lg outline-none" placeholder="例如：吳宣萱 或 蘇慈棻 [自用]" /></div>
              <div className="bg-blue-50 p-5 rounded-xl border border-blue-100 space-y-4">
                <div className="relative">
                  <label className="text-sm font-semibold text-blue-900 mb-1 block">商品名稱 (關鍵字自動搜尋)</label>
                  <input type="text" name="productName" value={formData.productName} onChange={handleProductSearch} className="w-full border border-blue-200 p-3 rounded-lg outline-none bg-white" placeholder="例如：OPC" />
                  {isDropdownOpen && filteredProducts.length > 0 && (
                    <ul className="absolute z-10 w-full bg-white border rounded-lg shadow-xl max-h-60 overflow-y-auto mt-1">
                      {filteredProducts.map((p, idx) => (
                        <li key={idx} className="p-3 hover:bg-blue-50 cursor-pointer border-b" onClick={() => selectProduct(p)}>
                          <div className="font-bold">{p.name}</div>
                          <div className="text-blue-600 text-sm">NT$ {p.price.toLocaleString()}</div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div><label className="text-sm font-semibold text-blue-900 mb-1 block">單件售價</label><input type="number" name="price" value={formData.price} onChange={handleChange} className="w-full border border-blue-200 p-3 rounded-lg bg-white outline-none" /></div>
                  <div><label className="text-sm font-semibold text-blue-900 mb-1 block">購買數量</label><input type="number" name="quantity" value={formData.quantity} onChange={handleChange} className="w-full border border-blue-200 p-3 rounded-lg bg-white outline-none" min="1" /></div>
                  <div><label className="text-sm font-semibold text-blue-900 mb-1 block">🌟 預估出貨日</label><input type="date" name="deliveryDate" value={formData.deliveryDate} onChange={handleChange} className="w-full border border-blue-200 p-3 rounded-lg bg-white outline-none font-medium text-blue-800" /></div>
                </div>
              </div>
              <div><label className="text-sm font-semibold text-gray-700 mb-1 block">收款狀態 / 備註</label><input type="text" name="paymentInfo" value={formData.paymentInfo} onChange={handleChange} className="w-full border p-3 rounded-lg outline-none" placeholder="中信匯款" /></div>
              <button disabled={loading} onClick={() => handleSubmit('add_bv')} className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-md hover:bg-blue-700">確認新增 BV 訂單與智慧排程</button>
            </div>
          )}

          {/* 3. 夥伴商店 (IBV) */}
          {activeTab === 'IBV' && (
            <div className="space-y-5 animate-fade-in">
              <div><label className="text-sm font-semibold text-gray-700 mb-1 block">貴人姓名 (若為自用請填: 名字 [自用])</label><input type="text" name="customerName" value={formData.customerName} onChange={handleChange} className="w-full border p-3 rounded-lg outline-none" placeholder="例如：吳宣萱" /></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><label className="text-sm font-semibold text-gray-700 mb-1 block">商店名稱</label><input type="text" name="storeName" value={formData.storeName} onChange={handleChange} className="w-full border p-3 rounded-lg outline-none" placeholder="慧上癮" /></div>
                <div><label className="text-sm font-semibold text-gray-700 mb-1 block">購買商品</label><input type="text" name="productName" value={formData.productName} onChange={handleChange} className="w-full border p-3 rounded-lg outline-none" placeholder="月餅" /></div>
                <div><label className="text-sm font-semibold text-gray-700 mb-1 block">商品售價 (實付)</label><input type="number" name="amount" value={formData.amount} onChange={handleChange} className="w-full border p-3 rounded-lg outline-none" placeholder="499" /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 bg-indigo-50 rounded-xl border border-indigo-100">
                <div><label className="text-sm font-semibold text-indigo-900 mb-1 block">店主價格</label><input type="number" name="ownerPrice" value={formData.ownerPrice} onChange={handleChange} className="w-full border border-indigo-200 p-3 bg-white outline-none" placeholder="450" /></div>
                <div><label className="text-sm font-semibold text-indigo-900 mb-1 block">IBV 回饋 (%)</label><input type="number" name="ibvPercent" value={formData.ibvPercent} onChange={handleChange} className="w-full border border-indigo-200 p-3 bg-white outline-none" placeholder="13.5" step="0.1" /></div>
                <div><label className="text-sm font-semibold text-indigo-900 mb-1 block">現金回饋 (%)</label><input type="number" name="cashPercent" value={formData.cashPercent} onChange={handleChange} className="w-full border border-indigo-200 p-3 bg-white outline-none" placeholder="2" step="0.1" /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="text-sm font-semibold text-gray-700 mb-1 block">收款狀態 / 備註</label><input type="text" name="paymentInfo" value={formData.paymentInfo} onChange={handleChange} className="w-full border p-3 rounded-lg outline-none" placeholder="已轉帳" /></div>
                <div><label className="text-sm font-semibold text-indigo-900 mb-1 block">🌟 應確認到貨日 (同步日曆提醒)</label><input type="date" name="deliveryDate" value={formData.deliveryDate} onChange={handleChange} className="w-full border border-indigo-200 p-3 bg-white outline-none font-medium text-indigo-800" /></div>
              </div>
              <button disabled={loading} onClick={() => handleSubmit('add_ibv')} className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl shadow-md hover:bg-indigo-700">確認新增 IBV 訂單與到貨提醒</button>
            </div>
          )}

          {/* 4. 待收款對帳 */}
          {activeTab === 'UNPAID' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex justify-between items-end border-b pb-2"><h2 className="text-lg font-bold">尚未收款訂單 ({unpaidOrders.length} 筆)</h2><button onClick={fetchUnpaidOrders} className="text-indigo-600 text-sm font-semibold">重新整理</button></div>
              {loading && <p className="text-center py-4">讀取中...</p>}
              {!loading && unpaidOrders.length === 0 && <p className="text-center py-8 text-gray-400 bg-gray-50 rounded-xl">目前所有訂單都已收款 🎉</p>}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {unpaidOrders.map((order, idx) => (
                  <div key={idx} className="bg-white border rounded-xl p-5 shadow-sm flex flex-col justify-between">
                    <div>
                      <span className={`text-xs font-bold px-2 py-1 rounded ${order.sheetName === 'BV下單' ? 'bg-blue-100 text-blue-700' : 'bg-indigo-100 text-indigo-700'}`}>{order.sheetName === 'BV下單' ? '獨家代理 (BV)' : '夥伴商店 (IBV)'}</span>
                      <h3 className="font-bold text-xl mt-2">{order.customerName}</h3>
                      <p className="text-gray-600">{order.productName}</p>
                      <p className="text-red-500 font-bold text-lg mt-1">NT$ {(order.amount || 0).toLocaleString()}</p>
                    </div>
                    <div className="mt-5 border-t pt-4">
                      <input type="text" placeholder="填寫收款方式 (例：轉帳)" className="w-full border p-2.5 rounded-lg mb-2 text-sm outline-none" onChange={(e) => setPaymentInputs({...paymentInputs, [order.row]: e.target.value})} value={paymentInputs[order.row] || ''} />
                      <button onClick={() => handleUpdatePayment(order)} disabled={!paymentInputs[order.row]} className="w-full bg-green-500 text-white font-bold py-2.5 rounded-lg hover:bg-green-600 disabled:opacity-50">確認入帳</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. 待交貨對帳 */}
          {activeTab === 'UNDELIVERED' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex justify-between items-end border-b pb-2">
                <h2 className="text-lg font-bold">尚未交貨/尚未到貨訂單 ({undeliveredOrders.length} 筆)</h2>
                <button onClick={fetchUndeliveredOrders} className="text-orange-600 text-sm font-semibold">重新整理</button>
              </div>
              {loading && <p className="text-center py-4">讀取中...</p>}
              {!loading && undeliveredOrders.length === 0 && <p className="text-center py-8 text-gray-400 bg-gray-50 rounded-xl">目前所有訂單都已到貨交貨 📦✨</p>}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {undeliveredOrders.map((order, idx) => (
                  <div key={idx} className="bg-white border rounded-xl p-5 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className={`text-xs font-bold px-2 py-1 rounded ${order.sheetName === 'BV下單' ? 'bg-blue-100 text-blue-700' : 'bg-indigo-100 text-indigo-700'}`}>
                          {order.sheetName === 'BV下單' ? '獨家代理 (BV)' : '夥伴商店 (IBV)'}
                        </span>
                        <span className="text-gray-400 text-xs">預計到貨: {order.targetDate || '未指定'}</span>
                      </div>
                      <h3 className="font-bold text-xl mt-1">{order.customerName}</h3>
                      <p className="text-gray-600 text-sm mt-1">{order.productName}</p>
                    </div>
                    <div className="mt-5 border-t pt-4 space-y-2">
                      <p className="text-xs text-gray-500">點擊完成交貨消單：</p>
                      <div className="grid grid-cols-3 gap-2">
                        <button onClick={() => handleUpdateDelivery(order, '面交')} className="bg-orange-500 text-white font-bold py-2 rounded-lg text-sm hover:bg-orange-600">🤝 面交</button>
                        <button onClick={() => handleUpdateDelivery(order, '寄送')} className="bg-blue-500 text-white font-bold py-2 rounded-lg text-sm hover:bg-blue-600">📦 寄送</button>
                        <button onClick={() => handleUpdateDelivery(order, '廠商直送')} className="bg-purple-500 text-white font-bold py-2 rounded-lg text-sm hover:bg-purple-600">🚀 直送</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6. 每週防呆跟進 */}
          {activeTab === 'WEEKLY_CHECK' && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-purple-50 p-4 rounded-xl border border-purple-200 text-purple-900 text-sm">
                🛡️ <b>每週防呆跟進護城河：</b> 自動列出「本週前後 7 天內」所有需要執行的關心任務與到貨確認。執行完畢後直接打勾，確保不會漏掉任何一位貴人！
              </div>
              <div className="flex justify-between items-end border-b pb-2"><h2 className="text-lg font-bold">本週應跟進任務 ({weeklyTasks.length} 項)</h2><button onClick={fetchWeeklyTasks} className="text-purple-600 text-sm font-semibold">重新整理</button></div>
              {loading && <p className="text-center py-4">運算中...</p>}
              {!loading && weeklyTasks.length === 0 && <p className="text-center py-8 text-gray-400 bg-gray-50 rounded-xl">太棒了！近期前後 7 天沒有未完成的跟進任務 🎉</p>}
              
              <div className="space-y-3">
                {weeklyTasks.map((task, idx) => (
                  <div key={idx} className={`border rounded-xl p-4 flex items-center justify-between transition-all ${checkedTasks[idx] ? 'bg-gray-50 opacity-50 line-through' : 'bg-white shadow-sm'}`}>
                    <div className="flex items-center space-x-4">
                      <input 
                        type="checkbox" 
                        checked={!!checkedTasks[idx]} 
                        onChange={() => setCheckedTasks({...checkedTasks, [idx]: !checkedTasks[idx]})}
                        className="w-6 h-6 text-purple-600 rounded cursor-pointer"
                      />
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-lg text-gray-800">{task.customerName}</span>
                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded font-bold">{task.taskType}</span>
                        </div>
                        <p className="text-gray-600 text-sm mt-0.5">{task.productName}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-gray-400 block">排定日期</span>
                      <span className="font-bold text-purple-600">{task.taskDate}</span>
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