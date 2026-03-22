// === USERS (hardcoded for auth) ===
export const users = [
  { id: 1, username: 'manager', password: 'manager', name: 'Иванов А.С.', role: 'Менеджер' },
  { id: 2, username: 'warehouse', password: 'warehouse', name: 'Петров В.И.', role: 'Кладовщик' },
  { id: 3, username: 'logist', password: 'logist', name: 'Сидорова Е.К.', role: 'Логист' },
];

// === EMPLOYEES ===
export const initialEmployees = [
  { id: 1, name: 'Иванов А.С.', position: 'Менеджер', status: 'Активен' },
  { id: 2, name: 'Петров В.И.', position: 'Кладовщик', status: 'Активен' },
  { id: 3, name: 'Сидорова Е.К.', position: 'Логист', status: 'Активен' },
  { id: 4, name: 'Козлов Д.А.', position: 'Менеджер', status: 'Активен' },
  { id: 5, name: 'Новикова М.П.', position: 'Логист', status: 'В отпуске' },
];

// === CUSTOMERS ===
export const initialCustomers = [
  { id: 1, name: 'ООО «АльфаТрейд»', type: 'Юр. лицо', address: 'г. Москва, ул. Ленина, д. 15', contacts: '+7 (495) 123-45-67' },
  { id: 2, name: 'ИП Смирнов К.В.', type: 'Физ. лицо', address: 'г. Казань, ул. Баумана, д. 42', contacts: '+7 (843) 234-56-78' },
  { id: 3, name: 'ЗАО «СтройМонтаж»', type: 'Юр. лицо', address: 'г. Новосибирск, пр. Мира, д. 8', contacts: '+7 (383) 345-67-89' },
  { id: 4, name: 'ООО «ТехноСервис»', type: 'Юр. лицо', address: 'г. Екатеринбург, ул. Кирова, д. 3', contacts: '+7 (343) 456-78-90' },
  { id: 5, name: 'ИП Козлова А.Д.', type: 'Физ. лицо', address: 'г. Сочи, ул. Морская, д. 21', contacts: '+7 (862) 567-89-01' },
];

// === PRODUCTS ===
export const initialProducts = [
  { id: 1, article: 'ART-001', name: 'Подшипник роликовый 6205', stock: 150, price: 450, status: 'В наличии' },
  { id: 2, article: 'ART-002', name: 'Втулка стальная 40мм', stock: 80, price: 320, status: 'В наличии' },
  { id: 3, article: 'ART-003', name: 'Болт М12×80 оцинкованный', stock: 500, price: 25, status: 'В наличии' },
  { id: 4, article: 'ART-004', name: 'Ремень приводной SPZ-1250', stock: 30, price: 890, status: 'В наличии' },
  { id: 5, article: 'ART-005', name: 'Манжета уплотнительная 50×70', stock: 0, price: 210, status: 'Нет в наличии' },
  { id: 6, article: 'ART-006', name: 'Шестерня коническая Z=24', stock: 12, price: 1750, status: 'В наличии' },
  { id: 7, article: 'ART-007', name: 'Муфта соединительная L-100', stock: 45, price: 1200, status: 'В наличии' },
  { id: 8, article: 'ART-008', name: 'Вал приводной D=40 L=500', stock: 5, price: 4500, status: 'Мало' },
];

// === ORDERS ===
export const initialOrders = [
  {
    id: 1, orderNumber: 'ЗК-2026-001', customerId: 1, employeeId: 1,
    productId: 1, quantity: 20, deliveryDate: '2026-03-15',
    address: 'г. Москва, ул. Ленина, д. 15', status: 'Новый',
    createdAt: '2026-03-01', notes: 'Срочная поставка'
  },
  {
    id: 2, orderNumber: 'ЗК-2026-002', customerId: 2, employeeId: 4,
    productId: 3, quantity: 200, deliveryDate: '2026-03-20',
    address: 'г. Казань, ул. Баумана, д. 42', status: 'Подтверждён',
    createdAt: '2026-03-02', notes: ''
  },
  {
    id: 3, orderNumber: 'ЗК-2026-003', customerId: 3, employeeId: 1,
    productId: 6, quantity: 5, deliveryDate: '2026-03-10',
    address: 'г. Новосибирск, пр. Мира, д. 8', status: 'Отгружен',
    createdAt: '2026-02-25', notes: 'Упаковка в деревянные ящики'
  },
  {
    id: 4, orderNumber: 'ЗК-2026-004', customerId: 4, employeeId: 4,
    productId: 7, quantity: 10, deliveryDate: '2026-03-08',
    address: 'г. Екатеринбург, ул. Кирова, д. 3', status: 'Выполнен',
    createdAt: '2026-02-20', notes: ''
  },
  {
    id: 5, orderNumber: 'ЗК-2026-005', customerId: 1, employeeId: 1,
    productId: 4, quantity: 15, deliveryDate: '2026-03-05',
    address: 'г. Москва, ул. Ленина, д. 15', status: 'Просрочен',
    createdAt: '2026-02-15', notes: 'Деление на 3 партии'
  },
  {
    id: 6, orderNumber: 'ЗК-2026-006', customerId: 5, employeeId: 4,
    productId: 2, quantity: 50, deliveryDate: '2026-03-25',
    address: 'г. Сочи, ул. Морская, д. 21', status: 'Новый',
    createdAt: '2026-03-07', notes: ''
  },
];

// === STOCK RECEIPTS (Поступления на склад) ===
export const initialStockReceipts = [
  { id: 1, productId: 1, quantity: 100, date: '2026-02-20', source: 'Производство', note: 'Плановая партия' },
  { id: 2, productId: 3, quantity: 300, date: '2026-02-22', source: 'Поставщик', note: 'ООО «МеталлПром»' },
  { id: 3, productId: 7, quantity: 20, date: '2026-03-01', source: 'Производство', note: '' },
  { id: 4, productId: 2, quantity: 50, date: '2026-03-05', source: 'Возврат', note: 'Возврат от ИП Козлова' },
];

// === SHIPMENTS (Отгрузки) ===
export const initialShipments = [
  {
    id: 1, orderId: 3, ttnNumber: 'ТТН-2026-0001', date: '2026-03-06',
    quantity: 5, carrier: 'ООО «ТрансЛогистик»', status: 'Отгружена'
  },
  {
    id: 2, orderId: 4, ttnNumber: 'ТТН-2026-0002', date: '2026-02-28',
    quantity: 10, carrier: 'ИП Михайлов (доставка)', status: 'Доставлена'
  },
];

// === RECEIPTS (Приёмки) ===
export const initialReceipts = [
  {
    id: 1, orderId: 4, shipmentId: 2, date: '2026-03-02',
    acceptedQuantity: 10, discrepancyReason: ''
  },
  {
    id: 2, orderId: 3, shipmentId: 1, date: '2026-03-09',
    acceptedQuantity: 4, discrepancyReason: 'Повреждение 1 шт. при транспортировке'
  },
];

// === CLAIMS (Рекламации) ===
export const initialClaims = [
  {
    id: 1, orderId: 3, customerId: 3, type: 'Брак', employeeId: 1,
    description: 'Одна шестерня имеет трещину на зубьях', deadline: '2026-03-20',
    status: 'В работе', resolution: '', createdAt: '2026-03-09'
  },
  {
    id: 2, orderId: 5, customerId: 1, type: 'Просрочка', employeeId: 4,
    description: 'Заказ не доставлен в срок, просрочка более 4 дней', deadline: '2026-03-12',
    status: 'Новая', resolution: '', createdAt: '2026-03-09'
  },
  {
    id: 3, orderId: 4, customerId: 4, type: 'Недостача', employeeId: 1,
    description: 'Первоначально было заявлено о недостаче. После пересчёта — всё корректно', deadline: '2026-03-05',
    status: 'Закрыта', resolution: 'Пересчёт подтвердил полную комплектацию. Инцидент закрыт.', createdAt: '2026-02-28'
  },
];
