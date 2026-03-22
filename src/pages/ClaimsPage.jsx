import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, AlertTriangle, Eye } from 'lucide-react';
import { useData } from '../context/DataContext';
import StatusBadge from '../components/UI/StatusBadge';
import Modal from '../components/UI/Modal';
import './ClaimsPage.css';

export default function ClaimsPage() {
  const { claims, orders, shipments, addClaim, updateClaim, getOrder, getCustomer, getEmployee, employees } = useData();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [form, setForm] = useState({
    orderId: '', type: 'Брак', description: '', employeeId: '', deadline: ''
  });

  const selectedOrder = form.orderId ? orders.find(o => o.id === Number(form.orderId)) : null;
  const selectedCustomer = selectedOrder ? getCustomer(selectedOrder.customerId) : null;
  const selectedTtn = selectedOrder ? shipments.find(s => s.orderId === selectedOrder.id)?.ttnNumber || '—' : '—';
  const [resolution, setResolution] = useState('');

  const filtered = claims.filter(c => {
    const matchSearch = !search ||
      c.description.toLowerCase().includes(search.toLowerCase()) ||
      c.type.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleAdd = (e) => {
    e.preventDefault();
    addClaim({
      orderId: Number(form.orderId),
      customerId: selectedOrder?.customerId || 0,
      type: form.type,
      description: form.description,
      employeeId: Number(form.employeeId),
      deadline: form.deadline,
      resolution: '',
    });
    setForm({ orderId: '', type: 'Брак', description: '', employeeId: '', deadline: '' });
    setShowAddModal(false);
  };

  const handleStatusChange = (claim, newStatus) => {
    updateClaim(claim.id, { status: newStatus });
    setSelectedClaim({ ...claim, status: newStatus });
  };

  const handleResolve = (claim) => {
    updateClaim(claim.id, { status: 'Закрыта', resolution });
    setSelectedClaim({ ...claim, status: 'Закрыта', resolution });
    setResolution('');
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">Журнал рекламаций</h2>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={18} /> Новая рекламация
        </button>
      </div>

      <div className="filters-bar">
        <div className="search-input">
          <Search size={16} />
          <input placeholder="Поиск по описанию или типу..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">Все статусы</option>
          <option value="Новая">Новая</option>
          <option value="В работе">В работе</option>
          <option value="Закрыта">Закрыта</option>
        </select>
      </div>

      <motion.div className="table-container" layout>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Тип</th>
              <th>Заказчик</th>
              <th>Заказ</th>
              <th>Описание</th>
              <th>Ответственный</th>
              <th>Срок</th>
              <th>Статус</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {filtered.map((c, i) => (
                <motion.tr
                  key={c.id}
                  className="clickable"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => { setSelectedClaim(c); setResolution(c.resolution || ''); }}
                >
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>РК-{String(c.id).padStart(3, '0')}</td>
                  <td><span className={`claim-type claim-type-${c.type === 'Брак' ? 'defect' : c.type === 'Недостача' ? 'shortage' : 'delay'}`}>{c.type}</span></td>
                  <td>{getCustomer(c.customerId)?.name || '—'}</td>
                  <td>{getOrder(c.orderId)?.orderNumber || '—'}</td>
                  <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.description}</td>
                  <td>{getEmployee(c.employeeId)?.name || '—'}</td>
                  <td>{c.deadline}</td>
                  <td><StatusBadge status={c.status} /></td>
                  <td><button className="btn-icon" onClick={(e) => { e.stopPropagation(); setSelectedClaim(c); setResolution(c.resolution || ''); }}><Eye size={16} /></button></td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="empty-state"><AlertTriangle size={48} /><p>Рекламации не найдены</p></div>
        )}
      </motion.div>

      {/* New Claim Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Новая рекламация" wide>
        <form onSubmit={handleAdd}>
          <div className="form-group">
            <label>Заказ</label>
            <select required value={form.orderId} onChange={(e) => setForm(f => ({ ...f, orderId: e.target.value }))}>
              <option value="">Выберите...</option>
              {orders.map(o => <option key={o.id} value={o.id}>{o.orderNumber}</option>)}
            </select>
          </div>
          {selectedOrder && (
            <div className="form-row">
              <div className="form-group">
                <label>Заказчик</label>
                <input type="text" readOnly value={selectedCustomer?.name || '—'} className="input-readonly" />
              </div>
              <div className="form-group">
                <label>Номер ТТН</label>
                <input type="text" readOnly value={selectedTtn} className="input-readonly" />
              </div>
            </div>
          )}
          <div className="form-row">
            <div className="form-group">
              <label>Тип проблемы</label>
              <select value={form.type} onChange={(e) => setForm(f => ({ ...f, type: e.target.value }))}>
                <option>Брак</option>
                <option>Недостача</option>
                <option>Просрочка</option>
              </select>
            </div>
            <div className="form-group">
              <label>Ответственный</label>
              <select required value={form.employeeId} onChange={(e) => setForm(f => ({ ...f, employeeId: e.target.value }))}>
                <option value="">Выберите...</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Описание</label>
            <textarea rows={3} required value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Опишите проблему..." />
          </div>
          <div className="form-group">
            <label>Срок исполнения</label>
            <input type="date" required value={form.deadline} onChange={(e) => setForm(f => ({ ...f, deadline: e.target.value }))} />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Отмена</button>
            <button type="submit" className="btn btn-primary"><Plus size={16} /> Создать</button>
          </div>
        </form>
      </Modal>

      {/* Claim Detail Modal */}
      <Modal isOpen={!!selectedClaim} onClose={() => setSelectedClaim(null)} title={`Рекламация РК-${String(selectedClaim?.id || 0).padStart(3, '0')}`} wide>
        {selectedClaim && (
          <div className="order-detail">
            <div className="order-detail-grid">
              <div className="detail-item">
                <span className="detail-label">Тип</span>
                <span className="detail-value">{selectedClaim.type}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Статус</span>
                <span className="detail-value"><StatusBadge status={selectedClaim.status} /></span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Заказчик</span>
                <span className="detail-value">{getCustomer(selectedClaim.customerId)?.name}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Заказ</span>
                <span className="detail-value">{getOrder(selectedClaim.orderId)?.orderNumber}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Ответственный</span>
                <span className="detail-value">{getEmployee(selectedClaim.employeeId)?.name}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Срок</span>
                <span className="detail-value">{selectedClaim.deadline}</span>
              </div>
              <div className="detail-item" style={{ gridColumn: '1 / -1' }}>
                <span className="detail-label">Описание</span>
                <span className="detail-value">{selectedClaim.description}</span>
              </div>
              {selectedClaim.resolution && (
                <div className="detail-item" style={{ gridColumn: '1 / -1' }}>
                  <span className="detail-label">Решение</span>
                  <span className="detail-value" style={{ color: 'var(--success)' }}>{selectedClaim.resolution}</span>
                </div>
              )}
            </div>

            {selectedClaim.status !== 'Закрыта' && (
              <div className="claim-actions">
                {selectedClaim.status === 'Новая' && (
                  <button className="btn btn-primary btn-sm" onClick={() => handleStatusChange(selectedClaim, 'В работе')}>
                    Взять в работу
                  </button>
                )}
                {selectedClaim.status === 'В работе' && (
                  <div className="claim-resolve">
                    <div className="form-group">
                      <label>Решение</label>
                      <textarea rows={2} value={resolution} onChange={(e) => setResolution(e.target.value)} placeholder="Опишите предпринятые меры..." />
                    </div>
                    <button className="btn btn-success btn-sm" onClick={() => handleResolve(selectedClaim)} disabled={!resolution}>
                      Закрыть рекламацию
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
