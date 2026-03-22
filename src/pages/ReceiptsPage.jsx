import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, PackageCheck } from 'lucide-react';
import { useData } from '../context/DataContext';
import StatusBadge from '../components/UI/StatusBadge';
import Modal from '../components/UI/Modal';

export default function ReceiptsPage() {
  const { receipts, orders, shipments, addReceipt, getOrder, getCustomer, getProduct } = useData();
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({ 
    orderId: '', shipmentId: '', date: '', 
    itemQuantities: {},
    discrepancyReason: '', isDamaged: false, isPoorQuality: false 
  });

  const shipped = orders.filter(o => o.status === 'Отгружен');

  const selectedOrder = form.orderId ? getOrder(Number(form.orderId)) : null;
  const orderItems = useMemo(() => {
    if (!selectedOrder) return [];
    if (selectedOrder.items && selectedOrder.items.length > 0) return selectedOrder.items;
    return [];
  }, [selectedOrder]);

  // Calculate total accepted across all items
  const totalAccepted = Object.values(form.itemQuantities).reduce((s, v) => s + (Number(v) || 0), 0);
  const totalOrdered = orderItems.reduce((s, i) => s + i.quantity, 0);

  // Check if any item has a mismatch
  const hasDiscrepancy = orderItems.some(item => {
    const received = Number(form.itemQuantities[item.productId] || 0);
    return received !== item.quantity;
  });

  const handleAdd = (e) => {
    e.preventDefault();
    
    // Build discrepancy description from per-item mismatches
    let autoDiscrepancy = '';
    const mismatches = orderItems.filter(item => {
      const received = Number(form.itemQuantities[item.productId] || 0);
      return received !== item.quantity;
    });
    
    if (mismatches.length > 0) {
      autoDiscrepancy = mismatches.map(item => {
        const received = Number(form.itemQuantities[item.productId] || 0);
        const name = getProduct(item.productId)?.name || `Товар #${item.productId}`;
        return `${name}: принято ${received} из ${item.quantity}`;
      }).join('; ');
    }

    const fullReason = [autoDiscrepancy, form.discrepancyReason].filter(Boolean).join('. ');

    addReceipt({
      orderId: Number(form.orderId),
      shipmentId: Number(form.shipmentId) || null,
      date: form.date,
      acceptedQuantity: totalAccepted,
      discrepancyReason: fullReason,
      isDamaged: form.isDamaged,
      isPoorQuality: form.isPoorQuality
    });
    setForm({ 
      orderId: '', shipmentId: '', date: '', 
      itemQuantities: {},
      discrepancyReason: '', isDamaged: false, isPoorQuality: false 
    });
    setShowAddModal(false);
  };

  const orderShipments = (orderId) => shipments.filter(s => s.orderId === orderId);

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">Журнал получений</h2>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={18} /> Подтвердить приёмку
        </button>
      </div>

      <div className="filters-bar">
        <div className="search-input">
          <Search size={16} />
          <input placeholder="Поиск..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <motion.div className="table-container" layout>
        <table>
          <thead>
            <tr>
              <th>Заказ</th>
              <th>Заказчик</th>
              <th>Товар</th>
              <th>Заказано</th>
              <th>Принято</th>
              <th>Дата приёмки</th>
              <th>Расхождение</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {receipts.map((r, i) => {
                const order = getOrder(r.orderId);
                return (
                  <motion.tr key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{order?.orderNumber || '—'}</td>
                    <td>{order ? getCustomer(order.customerId)?.name : '—'}</td>
                    <td>
                      {order ? (order.items && order.items.length > 0 
                        ? (order.items.length > 1 ? `Несколько товаров (${order.items.length})` : getProduct(order.items[0].productId)?.name)
                        : getProduct(order.productId)?.name) : '—'}
                    </td>
                    <td>{order ? (order.items ? order.items.reduce((s,i)=>s+i.quantity,0) : order.quantity) : '—'}</td>
                    <td style={{ fontWeight: 600, color: r.acceptedQuantity < (order ? (order.items ? order.items.reduce((s,i)=>s+i.quantity,0) : order.quantity) : 0) ? 'var(--danger)' : 'var(--success)' }}>
                      {r.acceptedQuantity}
                    </td>
                    <td>{r.date ? r.date.split('T')[0] : '—'}</td>
                    {(() => {
                      const hasIssue = !!r.discrepancyReason;
                      const claimResolved = order?.claimStatus === 'Закрыта';
                      let label, color;
                      if (!hasIssue) {
                        label = 'Принято'; color = 'var(--success)';
                      } else if (claimResolved) {
                        label = 'Принято'; color = 'var(--success)';
                      } else {
                        label = 'Рекламация'; color = 'var(--danger)';
                      }
                      return <td style={{ color, fontSize: '0.85rem', fontWeight: 500 }}>{label}</td>;
                    })()}
                  </motion.tr>
                );
              })}
            </AnimatePresence>
          </tbody>
        </table>
        {receipts.length === 0 && (
          <div className="empty-state"><PackageCheck size={48} /><p>Получения не найдены</p></div>
        )}
      </motion.div>

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Подтверждение приёмки">
        <form onSubmit={handleAdd}>
          <div className="form-group">
            <label>Заказ (отгруженный)</label>
            <select required value={form.orderId} onChange={(e) => {
              const oid = Number(e.target.value);
              const sh = shipments.find(s => s.orderId === oid);
              const order = getOrder(oid);
              // Pre-fill itemQuantities with expected values
              const quantities = {};
              if (order && order.items) {
                order.items.forEach(item => {
                  quantities[item.productId] = String(item.quantity);
                });
              }
              setForm(f => ({ ...f, orderId: e.target.value, shipmentId: sh ? String(sh.id) : '', itemQuantities: quantities }));
            }}>
              <option value="">Выберите заказ...</option>
              {shipped.map(o => {
                const totalQty = o.items ? o.items.reduce((sum, i) => sum + i.quantity, 0) : o.quantity;
                return (
                  <option key={o.id} value={o.id}>
                    {o.orderNumber} — {getCustomer(o.customerId)?.name} ({totalQty} шт.)
                  </option>
                );
              })}
            </select>
          </div>
          {form.orderId && orderShipments(Number(form.orderId)).length > 0 && (
            <div className="form-group">
              <label>ТТН</label>
              <input readOnly value={orderShipments(Number(form.orderId)).map(s => s.ttnNumber).join(', ')} style={{ opacity: 0.7, cursor: 'default' }} />
            </div>
          )}
          <div className="form-group">
            <label>Дата приёмки</label>
            <input type="date" required value={form.date} onChange={(e) => setForm(f => ({ ...f, date: e.target.value }))} />
          </div>

          {/* Per-item quantity inputs */}
          {form.orderId && orderItems.length > 0 && (
            <div style={{ margin: '16px 0' }}>
              <label style={{ display: 'block', marginBottom: '10px', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)' }}>
                Состав заказа — проверка получения
              </label>
              <div style={{ 
                background: 'var(--bg-tertiary)', 
                borderRadius: 'var(--radius-md)', 
                border: '1px solid var(--border-color)',
                overflow: 'hidden'
              }}>
                {/* Header */}
                <div style={{ 
                  display: 'grid', gridTemplateColumns: '1fr 90px 90px 32px', gap: '8px', 
                  padding: '8px 12px', borderBottom: '1px solid var(--border-color)',
                  fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', fontWeight: 600
                }}>
                  <span>Товар</span>
                  <span style={{ textAlign: 'center' }}>Заказано</span>
                  <span style={{ textAlign: 'center' }}>Принято</span>
                  <span></span>
                </div>
                {/* Items */}
                {orderItems.map((item, idx) => {
                  const received = Number(form.itemQuantities[item.productId] || 0);
                  const match = received === item.quantity;
                  return (
                    <div key={idx} style={{ 
                      display: 'grid', gridTemplateColumns: '1fr 90px 90px 32px', gap: '8px', alignItems: 'center',
                      padding: '10px 12px', 
                      borderBottom: idx < orderItems.length - 1 ? '1px solid var(--border-color)' : 'none',
                    }}>
                      <span style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                        {getProduct(item.productId)?.name || `#${item.productId}`}
                      </span>
                      <span style={{ textAlign: 'center', color: 'var(--text-muted)', fontWeight: 600 }}>
                        {item.quantity} шт.
                      </span>
                      <input 
                        type="number" min="0" required
                        value={form.itemQuantities[item.productId] || ''}
                        onChange={(e) => setForm(f => ({
                          ...f,
                          itemQuantities: { ...f.itemQuantities, [item.productId]: e.target.value }
                        }))}
                        style={{ 
                          width: '80px', textAlign: 'center', padding: '4px 6px',
                          border: `1px solid ${match ? 'var(--border-color)' : 'var(--danger)'}`,
                          borderRadius: 'var(--radius-sm)',
                          background: match ? 'var(--bg-secondary)' : 'rgba(239, 68, 68, 0.08)',
                          color: match ? 'var(--text-primary)' : 'var(--danger)',
                          fontWeight: 600, fontSize: '0.9rem'
                        }}
                      />
                      <span style={{ textAlign: 'center', fontSize: '1.1rem' }}>
                        {match ? '✅' : '⚠️'}
                      </span>
                    </div>
                  );
                })}
                {/* Summary row */}
                <div style={{ 
                  display: 'grid', gridTemplateColumns: '1fr 90px 90px 32px', gap: '8px', alignItems: 'center',
                  padding: '10px 12px', borderTop: '1px solid var(--border-color)',
                  background: 'var(--bg-secondary)', fontWeight: 700, fontSize: '0.85rem'
                }}>
                  <span style={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Итого</span>
                  <span style={{ textAlign: 'center', color: 'var(--text-primary)' }}>{totalOrdered} шт.</span>
                  <span style={{ textAlign: 'center', color: hasDiscrepancy ? 'var(--danger)' : 'var(--success)' }}>{totalAccepted} шт.</span>
                  <span style={{ textAlign: 'center', fontSize: '1.1rem' }}>{hasDiscrepancy ? '⚠️' : '✅'}</span>
                </div>
              </div>
            </div>
          )}

          <div className="form-group">
            <label>Причина расхождений / Комментарий</label>
            <textarea 
              rows={2} 
              style={{ minHeight: '60px', overflow: 'hidden', resize: 'none' }}
              value={form.discrepancyReason} 
              onChange={(e) => {
                e.target.style.height = 'inherit';
                e.target.style.height = `${e.target.scrollHeight}px`;
                setForm(f => ({ ...f, discrepancyReason: e.target.value }));
              }} 
              placeholder="Описание проблемы..." 
            />
          </div>
          <div className="form-row" style={{ display: 'flex', gap: '24px', alignItems: 'center', marginTop: '12px' }}>
            <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              <input type="checkbox" checked={form.isDamaged} onChange={(e) => setForm(f => ({ ...f, isDamaged: e.target.checked }))} />
              Товар повреждён
            </label>
            <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              <input type="checkbox" checked={form.isPoorQuality} onChange={(e) => setForm(f => ({ ...f, isPoorQuality: e.target.checked }))} />
              Товар некачественный
            </label>
          </div>
          <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Отмена</button>
            <button type="submit" className="btn btn-success"><PackageCheck size={16} /> Подтвердить</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
