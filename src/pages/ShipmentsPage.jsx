import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Truck, ChevronDown, Trash2 } from 'lucide-react';
import { useData } from '../context/DataContext';
import StatusBadge from '../components/UI/StatusBadge';
import Modal from '../components/UI/Modal';
import './OrdersPage.css';

export default function ShipmentsPage() {
  const { shipments, orders, employees, addShipment, getOrder, getCustomer, getProduct, getEmployee, deleteShipment } = useData();
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [form, setForm] = useState({ orderId: '', ttnNumber: '', date: '', employeeId: '' });

  const filtered = shipments.filter(s => {
    const order = getOrder(s.orderId);
    return !search || s.ttnNumber.toLowerCase().includes(search.toLowerCase()) ||
      (order && order.orderNumber.toLowerCase().includes(search.toLowerCase()));
  });

  const availableOrders = orders.filter(o => ['Новый', 'Подтверждён'].includes(o.status));

  const handleAdd = (e) => {
    e.preventDefault();
    const o = getOrder(Number(form.orderId));
    const totalQty = o ? (o.items ? o.items.reduce((sum, i) => sum + i.quantity, 0) : o.quantity) : 1;
    addShipment({
      orderId: Number(form.orderId),
      ttnNumber: form.ttnNumber,
      date: form.date,
      quantity: totalQty,
      carrier: getEmployee(Number(form.employeeId))?.name || '',
    });
    setForm({ orderId: '', ttnNumber: '', date: '', employeeId: '' });
    setShowAddModal(false);
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">Отгрузки</h2>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={18} /> Новая отгрузка
        </button>
      </div>

      <div className="filters-bar">
        <div className="search-input">
          <Search size={16} />
          <input placeholder="Поиск по ТТН или номеру заказа..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <motion.div className="table-container" layout>
        <table>
          <thead>
            <tr>
              <th>ТТН</th>
              <th>Заказ</th>
              <th>Заказчик</th>
              <th>Товар</th>
              <th>Кол-во</th>
              <th>Дата</th>
              <th>Перевозчик</th>
              <th>Статус</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {filtered.map((s, i) => {
                const order = getOrder(s.orderId);
                const isExpanded = expandedId === s.id;
                return (
                  <React.Fragment key={s.id}>
                    <motion.tr 
                      className="clickable"
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                      onClick={() => setExpandedId(isExpanded ? null : s.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.ttnNumber}</td>
                      <td>{order?.orderNumber || '—'}</td>
                      <td>{order ? getCustomer(order.customerId)?.name : '—'}</td>
                      <td>
                        {order ? (order.items && order.items.length > 0 
                          ? (order.items.length > 1 ? `Несколько товаров (${order.items.length})` : getProduct(order.items[0].productId)?.name)
                          : getProduct(order.productId)?.name) : '—'}
                      </td>
                      <td>{s.quantity}</td>
                      <td>{s.date ? s.date.split('T')[0] : s.date}</td>
                      <td>{s.carrier}</td>
                      <td><StatusBadge status={s.status} /></td>
                      <td>
                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end', alignItems: 'center' }}>
                          <ChevronDown size={16} className={`shipment-chevron ${isExpanded ? 'expanded' : ''}`} />
                          <button className="btn-delete" onClick={(e) => { e.stopPropagation(); if(confirm('Удалить отгрузку ТТН ' + s.ttnNumber + '?')) deleteShipment(s.orderId); }}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.tr
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <td colSpan={9} style={{ padding: '0 12px 12px' }}>
                            <div className="ttn-document">
                              <div className="ttn-title">Товарно-транспортная накладная</div>
                              <div className="ttn-grid">
                                <div className="ttn-field">
                                  <span className="ttn-label">Номер ТТН</span>
                                  <span className="ttn-value">{s.ttnNumber}</span>
                                </div>
                                <div className="ttn-field">
                                  <span className="ttn-label">Отправитель (Подписал)</span>
                                  <span className="ttn-value">{order ? getEmployee(order.employeeId)?.name : '—'}</span>
                                </div>
                                <div className="ttn-field">
                                  <span className="ttn-label">Получатель</span>
                                  <span className="ttn-value">{order ? getCustomer(order.customerId)?.name : '—'}</span>
                                </div>
                                <div className="ttn-field">
                                  <span className="ttn-label">Пункт назначения</span>
                                  <span className="ttn-value">{order ? getCustomer(order.customerId)?.address : '—'}</span>
                                </div>
                                <div className="ttn-field">
                                  <span className="ttn-label">Срок доставки</span>
                                  <span className="ttn-value">{order?.deliveryDate ? order.deliveryDate.split('T')[0] : '—'}</span>
                                </div>
                                <div className="ttn-field">
                                  <span className="ttn-label">Дата отгрузки</span>
                                  <span className="ttn-value">{s.date ? s.date.split('T')[0] : '—'}</span>
                                </div>
                                <div className="ttn-field" style={{ gridColumn: '1 / -1' }}>
                                  <span className="ttn-label">Состав заказа</span>
                                  <span className="ttn-value">
                                    {order && order.items && order.items.length > 0
                                      ? order.items.map((item, idx) => (
                                          <div key={idx}>{getProduct(item.productId)?.name} — {item.quantity} шт.</div>
                                        ))
                                      : '—'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>
                        </motion.tr>
                      )}
                    </AnimatePresence>
                  </React.Fragment>
                );
              })}
            </AnimatePresence>
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="empty-state"><Truck size={48} /><p>Отгрузки не найдены</p></div>
        )}
      </motion.div>

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Новая отгрузка">
        <form onSubmit={handleAdd}>
          <div className="form-group">
            <label>Заказ</label>
            <select required value={form.orderId} onChange={(e) => setForm(f => ({ ...f, orderId: e.target.value }))}>
              <option value="">Выберите заказ...</option>
              {availableOrders.map(o => {
                const totalQty = o.items ? o.items.reduce((sum, i) => sum + i.quantity, 0) : o.quantity;
                return (
                  <option key={o.id} value={o.id}>
                    {o.orderNumber} — {getCustomer(o.customerId)?.name} ({totalQty} шт.)
                  </option>
                );
              })}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Номер ТТН</label>
              <input required value={form.ttnNumber} onChange={(e) => setForm(f => ({ ...f, ttnNumber: e.target.value }))} placeholder="ТТН-2026-XXXX" />
            </div>
            <div className="form-group">
              <label>Дата отгрузки</label>
              <input type="date" required value={form.date} onChange={(e) => setForm(f => ({ ...f, date: e.target.value }))} />
            </div>
          </div>
          <div className="form-group">
            <label>Кто отгрузил</label>
            <select required value={form.employeeId} onChange={(e) => setForm(f => ({ ...f, employeeId: e.target.value }))}>
              <option value="">Выберите сотрудника...</option>
              {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name} ({emp.position})</option>)}
            </select>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Отмена</button>
            <button type="submit" className="btn btn-primary"><Plus size={16} /> Оформить</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
