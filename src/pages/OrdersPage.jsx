import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Eye, Package, ChevronDown, Trash2 } from 'lucide-react';
import { useData } from '../context/DataContext';
import StatusBadge from '../components/UI/StatusBadge';
import Modal from '../components/UI/Modal';
import './OrdersPage.css';

export default function OrdersPage() {
  const { orders, customers, products, employees, getCustomer, getProduct, getEmployee, addOrder, deleteOrder, shipments, receipts } = useData();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [expandedShipmentId, setExpandedShipmentId] = useState(null);

  const [form, setForm] = useState({
    customerQuery: '', employeeId: employees[0]?.id || '', items: [{ productId: '', quantity: '' }], deliveryDate: '', address: '', notes: ''
  });
  const [showDropdown, setShowDropdown] = useState(false);

  const suggestedCustomers = customers.filter(c => c.name.toLowerCase().includes(form.customerQuery.toLowerCase()));

  const filtered = orders.filter(o => {
    const cust = getCustomer(o.customerId);
    const matchSearch = !search ||
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      (cust && cust.name.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = !statusFilter || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleCreate = (e) => {
    e.preventDefault();
    for (const item of form.items) {
      const product = getProduct(Number(item.productId));
      if (product && Number(item.quantity) > product.stock) {
        alert(`Недостаточно товара "${product.name}" на складе! Доступно: ${product.stock} шт.`);
        return;
      }
    }
    
    const existingCustomer = customers.find(c => c.name.toLowerCase() === form.customerQuery.toLowerCase());
    const customerId = existingCustomer ? existingCustomer.id : null;
    const newCustomerName = !existingCustomer ? form.customerQuery : null;

    addOrder({
      customerId: customerId,
      employeeId: Number(form.employeeId),
      items: form.items.map(i => ({ productId: Number(i.productId), quantity: Number(i.quantity) })),
      deliveryDate: form.deliveryDate,
      address: form.address || (existingCustomer ? existingCustomer.address : ''),
      notes: form.notes,
    }, newCustomerName);
    
    setForm({ customerQuery: '', employeeId: employees[0]?.id || '', items: [{ productId: '', quantity: '' }], deliveryDate: '', address: '', notes: '' });
    setShowNewModal(false);
  };

  const orderShipments = (orderId) => shipments.filter(s => s.orderId === orderId);
  const orderReceipts = (orderId) => receipts.filter(r => r.orderId === orderId);

  const statuses = [...new Set(orders.map(o => o.status))];

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">Журнал заказов</h2>
        <button className="btn btn-primary" onClick={() => setShowNewModal(true)}>
          <Plus size={18} /> Новый заказ
        </button>
      </div>

      <div className="filters-bar">
        <div className="search-input">
          <Search size={16} />
          <input
            placeholder="Поиск по номеру или заказчику..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">Все статусы</option>
          {statuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <motion.div className="table-container" layout>
        <table>
          <thead>
            <tr>
              <th>№ Заказа</th>
              <th>Заказчик</th>
              <th>Товар</th>
              <th>Кол-во</th>
              <th>Срок поставки</th>
              <th>Менеджер</th>
              <th>Статус</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {filtered.map((order, i) => (
                <motion.tr
                  key={order.id}
                  className="clickable"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => setSelectedOrder(order)}
                >
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{order.orderNumber}</td>
                  <td>{getCustomer(order.customerId)?.name || '—'}</td>
                  <td>
                    {order.items && order.items.length > 0 
                      ? (order.items.length > 1 ? `Несколько товаров (${order.items.length})` : getProduct(order.items[0].productId)?.name)
                      : (getProduct(order.productId)?.name || '—')}
                  </td>
                  <td>
                    {order.items && order.items.length > 0 
                      ? (order.items.length > 1 ? order.items.reduce((s, i) => s + i.quantity, 0) : order.items[0].quantity)
                      : order.quantity}
                  </td>
                  <td>{order.deliveryDate}</td>
                  <td>{getEmployee(order.employeeId)?.name || '—'}</td>
                  <td><StatusBadge status={order.status} /></td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                      <button className="btn-icon" onClick={(e) => { e.stopPropagation(); setSelectedOrder(order); }}>
                        <Eye size={16} />
                      </button>
                      <button className="btn-delete" onClick={(e) => { e.stopPropagation(); if(confirm('Удалить заказ ' + order.orderNumber + '?')) deleteOrder(order.id); }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="empty-state">
            <Package size={48} />
            <p>Заказы не найдены</p>
          </div>
        )}
      </motion.div>

      {/* New Order Modal */}
      <Modal isOpen={showNewModal} onClose={() => setShowNewModal(false)} title="Новый заказ" wide>
        <form onSubmit={handleCreate}>
          <div className="form-row">
            <div className="form-group" style={{ position: 'relative' }}>
              <label>Заказчик (выберите или введите нового)</label>
              <input 
                required 
                value={form.customerQuery} 
                onFocus={() => setShowDropdown(true)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                onChange={(e) => {
                  const query = e.target.value;
                  const match = customers.find(c => c.name.toLowerCase() === query.toLowerCase());
                  setForm(f => ({ ...f, customerQuery: query, address: match ? match.address : f.address }));
                  setShowDropdown(true);
                }} 
                placeholder="Имя / Название..." 
                autoComplete="off"
              />
              <AnimatePresence>
                {showDropdown && suggestedCustomers.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                    style={{ 
                      position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10, 
                      background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', 
                      borderRadius: 'var(--radius-md)', marginTop: '4px', maxHeight: '150px', overflowY: 'auto',
                      boxShadow: 'var(--shadow-md)'
                    }}
                  >
                    {suggestedCustomers.map(c => (
                      <div 
                        key={c.id} 
                        style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid var(--border-color)' }}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          setForm(f => ({ ...f, customerQuery: c.name, address: c.address }));
                          setShowDropdown(false);
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        {c.name}
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="form-group">
              <label>Ответственный</label>
              <select required value={form.employeeId} onChange={(e) => setForm(f => ({ ...f, employeeId: e.target.value }))}>
                <option value="">Выберите...</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.position})</option>)}
              </select>
            </div>
          </div>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label>Товары</label>
            {form.items.map((item, index) => {
              const selectedProduct = getProduct(Number(item.productId));
              const maxStock = selectedProduct ? selectedProduct.stock : 0;
              
              return (
                <div key={index} className="form-row" style={{ alignItems: 'flex-end', marginBottom: '10px' }}>
                  <div className="form-group" style={{ flex: 2 }}>
                    <select required value={item.productId} onChange={(e) => {
                      const newItems = [...form.items];
                      newItems[index].productId = e.target.value;
                      const newMax = getProduct(Number(e.target.value))?.stock || 0;
                      if (Number(newItems[index].quantity) > newMax) newItems[index].quantity = newMax ? String(newMax) : '';
                      setForm(f => ({ ...f, items: newItems }));
                    }}>
                      <option value="">Выберите товар...</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.article} — {p.name} (ост: {p.stock})</option>)}
                    </select>
                  </div>
                  
                  <div className="form-group" style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button type="button" className="btn btn-secondary" 
                         disabled={!item.quantity || Number(item.quantity) <= 1}
                         onClick={() => {
                           const newItems = [...form.items];
                           newItems[index].quantity = String(Math.max(1, Number(item.quantity) - 1));
                           setForm(f => ({ ...f, items: newItems }));
                         }}
                      >-</button>
                      
                      <input 
                        type="number" 
                        min="1" 
                        max={maxStock || 1}
                        required 
                        value={item.quantity} 
                        onChange={(e) => {
                          let val = parseInt(e.target.value);
                          if (isNaN(val)) val = '';
                          else if (val > maxStock) val = maxStock;
                          else if (val < 1) val = 1;

                          const newItems = [...form.items];
                          newItems[index].quantity = val === '' ? '' : String(val);
                          setForm(f => ({ ...f, items: newItems }));
                        }} 
                        placeholder="0" 
                        style={{ textAlign: 'center' }} 
                      />
                      
                      <button type="button" className="btn btn-secondary" 
                         disabled={!item.productId || Number(item.quantity) >= maxStock}
                         onClick={() => {
                           const newItems = [...form.items];
                           newItems[index].quantity = String(Math.min(maxStock, Number(item.quantity || 0) + 1));
                           setForm(f => ({ ...f, items: newItems }));
                         }}
                      >+</button>

                      {form.items.length > 1 && (
                        <button type="button" className="btn-icon" style={{ color: 'var(--danger)', marginLeft: '4px' }}
                          onClick={() => {
                            const newItems = form.items.filter((_, i) => i !== index);
                            setForm(f => ({ ...f, items: newItems }));
                          }}
                        >✕</button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <button type="button" className="btn btn-secondary" style={{ marginTop: '5px' }}
              onClick={() => setForm(f => ({ ...f, items: [...f.items, { productId: '', quantity: '' }] }))}
            >
              <Plus size={16} /> Добавить товар
            </button>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Срок поставки</label>
              <input type="date" required value={form.deliveryDate} onChange={(e) => setForm(f => ({ ...f, deliveryDate: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Адрес доставки</label>
              <input value={form.address} onChange={(e) => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Автоматически из заказчика" />
            </div>
          </div>
          <div className="form-group">
            <label>Примечания</label>
            <textarea rows={2} value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Особые условия..." />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setShowNewModal(false)}>Отмена</button>
            <button type="submit" className="btn btn-primary"><Plus size={16} /> Создать</button>
          </div>
        </form>
      </Modal>

      {/* Order Detail Modal */}
      <Modal isOpen={!!selectedOrder} onClose={() => setSelectedOrder(null)} title={`Заказ ${selectedOrder?.orderNumber || ''}`} wide>
        {selectedOrder && (
          <div className="order-detail">
            <div className="order-detail-grid">
              <div className="detail-item">
                <span className="detail-label">Заказчик</span>
                <span className="detail-value">{getCustomer(selectedOrder.customerId)?.name}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Менеджер</span>
                <span className="detail-value">{getEmployee(selectedOrder.employeeId)?.name}</span>
              </div>
              <div className="detail-item" style={{ gridColumn: '1 / -1' }}>
                <span className="detail-label">Товары</span>
                <div className="detail-value">
                  {selectedOrder.items && selectedOrder.items.length > 0 ? (
                    <ul style={{ paddingLeft: '20px', margin: '5px 0' }}>
                      {selectedOrder.items.map((item, idx) => (
                        <li key={idx}><strong>{getProduct(item.productId)?.name}</strong> — {item.quantity} шт.</li>
                      ))}
                    </ul>
                  ) : (
                    <span>{getProduct(selectedOrder.productId)?.name} — {selectedOrder.quantity} шт.</span>
                  )}
                </div>
              </div>
              <div className="detail-item">
                <span className="detail-label">Срок поставки</span>
                <span className="detail-value">{selectedOrder.deliveryDate}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Статус</span>
                <span className="detail-value"><StatusBadge status={selectedOrder.status} /></span>
              </div>
              <div className="detail-item" style={{ gridColumn: '1 / -1' }}>
                <span className="detail-label">Адрес</span>
                <span className="detail-value">{selectedOrder.address}</span>
              </div>
              {selectedOrder.notes && (
                <div className="detail-item" style={{ gridColumn: '1 / -1' }}>
                  <span className="detail-label">Примечания</span>
                  <span className="detail-value">{selectedOrder.notes}</span>
                </div>
              )}
            </div>

            {orderShipments(selectedOrder.id).length > 0 && (
              <div className="detail-section">
                <h4>Отгрузки</h4>
                {orderShipments(selectedOrder.id).map(s => {
                  const isExpanded = expandedShipmentId === s.id;
                  return (
                    <div key={s.id} className="shipment-accordion">
                      <div className="shipment-accordion-header" onClick={() => setExpandedShipmentId(isExpanded ? null : s.id)}>
                        <div className="shipment-accordion-summary">
                          <span>ТТН: {s.ttnNumber}</span>
                          <span>Дата: {s.date ? s.date.split('T')[0] : s.date}</span>
                          <span>Кол-во: {s.quantity}</span>
                          <StatusBadge status={s.status} />
                        </div>
                        <ChevronDown size={16} className={`shipment-chevron ${isExpanded ? 'expanded' : ''}`} />
                      </div>
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            className="shipment-accordion-body"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: 'easeInOut' }}
                          >
                            <div className="ttn-document">
                              <div className="ttn-title">Товарно-транспортная накладная</div>
                              <div className="ttn-grid">
                                <div className="ttn-field">
                                  <span className="ttn-label">Номер ТТН</span>
                                  <span className="ttn-value">{s.ttnNumber}</span>
                                </div>
                                <div className="ttn-field">
                                  <span className="ttn-label">Отправитель (Подписал)</span>
                                  <span className="ttn-value">{getEmployee(selectedOrder.employeeId)?.name || '—'}</span>
                                </div>
                                <div className="ttn-field">
                                  <span className="ttn-label">Получатель</span>
                                  <span className="ttn-value">{getCustomer(selectedOrder.customerId)?.name || '—'}</span>
                                </div>
                                <div className="ttn-field">
                                  <span className="ttn-label">Пункт назначения</span>
                                  <span className="ttn-value">{getCustomer(selectedOrder.customerId)?.address || '—'}</span>
                                </div>
                                <div className="ttn-field">
                                  <span className="ttn-label">Срок доставки</span>
                                  <span className="ttn-value">{selectedOrder.deliveryDate ? selectedOrder.deliveryDate.split('T')[0] : '—'}</span>
                                </div>
                                <div className="ttn-field">
                                  <span className="ttn-label">Дата отгрузки</span>
                                  <span className="ttn-value">{s.date ? s.date.split('T')[0] : '—'}</span>
                                </div>
                                <div className="ttn-field" style={{ gridColumn: '1 / -1' }}>
                                  <span className="ttn-label">Состав заказа</span>
                                  <span className="ttn-value">
                                    {selectedOrder.items && selectedOrder.items.length > 0
                                      ? selectedOrder.items.map((item, idx) => (
                                          <div key={idx}>{getProduct(item.productId)?.name} — {item.quantity} шт.</div>
                                        ))
                                      : '—'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            )}

            {orderReceipts(selectedOrder.id).length > 0 && (
              <div className="detail-section">
                <h4>Приёмки</h4>
                {orderReceipts(selectedOrder.id).map(r => (
                  <div className="detail-sub-item" key={r.id}>
                    <span>Дата: {r.date}</span>
                    <span>Принято: {r.acceptedQuantity} шт.</span>
                    {r.discrepancyReason && <span style={{ color: 'var(--danger)' }}>Расхождение: {r.discrepancyReason}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
