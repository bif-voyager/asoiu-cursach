import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Package, ArrowDownToLine, Trash2 } from 'lucide-react';
import { useData } from '../context/DataContext';
import StatusBadge from '../components/UI/StatusBadge';
import Modal from '../components/UI/Modal';

export default function WarehousePage() {
  const { products, stockReceipts, addStockReceipt, getProduct, employees, getEmployee, deleteProduct } = useData();
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState('stock');
  const [form, setForm] = useState({ 
    productQuery: '', quantity: '', customPrice: '', source: 'Производство', note: '',
    date: new Date().toISOString().split('T')[0], employeeId: employees[0]?.id || ''
  });

  const suggestedProducts = products.filter(p => p.name.toLowerCase().includes(form.productQuery.toLowerCase()));

  const filteredProducts = products.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.article.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = (e) => {
    e.preventDefault();
    
    // Find if the typed text matches an existing product exactly by name
    const existingProduct = products.find(p => p.name.toLowerCase() === form.productQuery.toLowerCase());
    const productId = existingProduct ? existingProduct.id : null;
    const newProductName = !existingProduct ? form.productQuery : null;

    addStockReceipt({
      productId: productId,
      quantity: Number(form.quantity),
      date: form.date,
      source: form.source,
      note: form.note,
      employeeId: Number(form.employeeId)
    }, newProductName, form.customPrice ? Number(form.customPrice) : undefined);
    
    setForm({ 
      productQuery: '', quantity: '', customPrice: '', source: 'Производство', note: '',
      date: new Date().toISOString().split('T')[0], employeeId: employees[0]?.id || ''
    });
    setShowAddModal(false);
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">Склад</h2>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <ArrowDownToLine size={18} /> Поступление
        </button>
      </div>

      <div className="tabs">
        <button className={`tab ${activeTab === 'stock' ? 'active' : ''}`} onClick={() => setActiveTab('stock')}>Остатки</button>
        <button className={`tab ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>История поступлений</button>
      </div>

      <div className="filters-bar">
        <div className="search-input">
          <Search size={16} />
          <input placeholder="Поиск товара..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {activeTab === 'stock' && (
        <motion.div className="table-container" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <table>
            <thead>
              <tr>
                <th>Артикул</th>
                <th>Название</th>
                <th>Остаток</th>
                <th>Цена, ₽</th>
                <th>Статус</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filteredProducts.map((p, i) => (
                  <motion.tr
                    key={p.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.article}</td>
                    <td>{p.name}</td>
                    <td style={{ fontWeight: 600 }}>{p.stock} шт.</td>
                    <td>{p.price.toLocaleString()}</td>
                    <td><StatusBadge status={p.status} /></td>
                    <td>
                      <button className="btn-delete" onClick={(e) => { e.stopPropagation(); if(confirm('Удалить товар "' + p.name + '"?')) deleteProduct(p.id); }}>
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
          {filteredProducts.length === 0 && (
            <div className="empty-state"><Package size={48} /><p>Товары не найдены</p></div>
          )}
        </motion.div>
      )}

      {activeTab === 'history' && (
        <motion.div className="table-container" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <table>
            <thead>
              <tr>
                <th>Дата</th>
                <th>Товар</th>
                <th>Количество</th>
                <th>Источник</th>
                <th>Принял</th>
                <th>Примечание</th>
              </tr>
            </thead>
            <tbody>
              {[...stockReceipts].reverse().map((r, i) => (
                <motion.tr key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                  <td style={{ fontWeight: 500 }}>{r.date}</td>
                  <td>{getProduct(r.productId)?.name || '—'}</td>
                  <td style={{ fontWeight: 600, color: 'var(--success)' }}>+{r.quantity}</td>
                  <td>{r.source}</td>
                  <td>{r.employeeId ? getEmployee(r.employeeId)?.name : '—'}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{r.note || '—'}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      )}

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Поступление на склад">
        <form onSubmit={handleAdd}>
          <div className="form-group" style={{ position: 'relative' }}>
            <label>Товар (выберите или введите новый)</label>
            <input 
              required 
              value={form.productQuery} 
              onFocus={() => setShowDropdown(true)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
              onChange={(e) => {
                const query = e.target.value;
                const match = products.find(p => p.name.toLowerCase() === query.toLowerCase());
                setForm(f => ({ ...f, productQuery: query, customPrice: match ? String(match.price) : f.customPrice }));
                setShowDropdown(true);
              }} 
              placeholder="Название товара..." 
              autoComplete="off"
            />
            <AnimatePresence>
              {showDropdown && suggestedProducts.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                  style={{ 
                    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10, 
                    background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', 
                    borderRadius: 'var(--radius-md)', marginTop: '4px', maxHeight: '150px', overflowY: 'auto',
                    boxShadow: 'var(--shadow-md)'
                  }}
                >
                  {suggestedProducts.map(p => (
                    <div 
                      key={p.id} 
                      style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid var(--border-color)' }}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setForm(f => ({ ...f, productQuery: p.name, customPrice: String(p.price) }));
                        setShowDropdown(false);
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      {p.name} <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginLeft: '8px' }}>({p.price} ₽)</span>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Количество</label>
              <input type="number" min="1" required value={form.quantity} onChange={(e) => setForm(f => ({ ...f, quantity: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Цена за шт. (₽)</label>
              <input type="number" min="0" required value={form.customPrice} onChange={(e) => setForm(f => ({ ...f, customPrice: e.target.value }))} placeholder="0" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Дата поступления</label>
              <input type="date" required value={form.date} onChange={(e) => setForm(f => ({ ...f, date: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Принял (Сотрудник)</label>
              <select required value={form.employeeId} onChange={(e) => setForm(f => ({ ...f, employeeId: e.target.value }))}>
                <option value="">Выберите...</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.position})</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Источник</label>
              <select value={form.source} onChange={(e) => setForm(f => ({ ...f, source: e.target.value }))}>
                <option>Производство</option>
                <option>Поставщик</option>
                <option>Возврат</option>
              </select>
            </div>
            <div className="form-group">
              <label>Примечание</label>
              <input value={form.note} onChange={(e) => setForm(f => ({ ...f, note: e.target.value }))} placeholder="Комментарий..." />
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Отмена</button>
            <button type="submit" className="btn btn-primary"><Plus size={16} /> Добавить</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
