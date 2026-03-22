import { createContext, useContext, useState, useEffect } from 'react';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [orders, setOrders] = useState([]);
  const [stockReceipts, setStockReceipts] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [claims, setClaims] = useState([]);

  const fetchAll = async () => {
    try {
      const [custRes, prodRes, empRes, ordRes, srcRes, shpRes, recRes, claRes] = await Promise.all([
        fetch('http://localhost:3000/api/customers'),
        fetch('http://localhost:3000/api/products'),
        fetch('http://localhost:3000/api/employees'),
        fetch('http://localhost:3000/api/orders'),
        fetch('http://localhost:3000/api/stockReceipts'),
        fetch('http://localhost:3000/api/shipments'),
        fetch('http://localhost:3000/api/receipts'),
        fetch('http://localhost:3000/api/claims')
      ]);
      setCustomers(await custRes.json());
      setProducts(await prodRes.json());
      setEmployees(await empRes.json());
      setOrders(await ordRes.json());
      setStockReceipts(await srcRes.json());
      setShipments(await shpRes.json());
      setReceipts(await recRes.json());
      setClaims(await claRes.json());
    } catch (e) {
      console.error("Failed to fetch data", e);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const apiPost = async (table, data) => {
    await fetch(`http://localhost:3000/api/${table}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  };

  const apiPut = async (table, id, data) => {
    await fetch(`http://localhost:3000/api/${table}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  };

  const apiDelete = async (table, id) => {
    await fetch(`http://localhost:3000/api/${table}/${id}`, { method: 'DELETE' });
  };

  // Orders
  const addOrder = async (order, newCustomerName) => {
    let customerId = order.customerId;
    if (!customerId && newCustomerName) {
      const res = await fetch('http://localhost:3000/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCustomerName, type: 'Юр. лицо', address: order.address || '', contacts: '' })
      });
      const data = await res.json();
      customerId = data.id;
    }

    const nextId = orders.length > 0 ? Math.max(...orders.map(o => o.id)) + 1 : 1;
    const orderNumber = `ЗК-2026-${String(nextId).padStart(3, '0')}`;
    
    await apiPost('orders', { ...order, customerId, orderNumber, createdAt: new Date().toISOString().split('T')[0], status: 'Новый' });
    fetchAll();
  };
  
  const updateOrder = async (id, updates) => {
    await apiPut('orders', id, updates);
    fetchAll();
  };

  // Stock
  const addStockReceipt = async (receipt, newProductName, customPrice) => {
    let productId = receipt.productId;
    if (!productId && newProductName) {
      const nextId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
      const parsedPrice = parseFloat(customPrice);
      const res = await fetch('http://localhost:3000/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: newProductName, 
          article: `ART-${String(nextId).padStart(4, '0')}`,
          price: isNaN(parsedPrice) ? 0 : parsedPrice,
          stock: receipt.quantity, 
          status: receipt.quantity > 0 ? (receipt.quantity < 10 ? 'Мало' : 'В наличии') : 'Нет в наличии' 
        })
      });
      const data = await res.json();
      productId = data.id;
    } else if (productId) {
      const p = products.find(prod => prod.id === productId);
      if (p) {
        const newStock = p.stock + receipt.quantity;
        const parsedPrice = parseFloat(customPrice);
        await apiPut('products', productId, {
          stock: newStock,
          status: newStock > 0 ? (newStock < 10 ? 'Мало' : 'В наличии') : 'Нет в наличии',
          price: !isNaN(parsedPrice) ? parsedPrice : p.price 
        });
      }
    }
    await apiPost('stockReceipts', { ...receipt, productId });
    fetchAll();
  };

  // Shipments
  const addShipment = async (shipment) => {
    await apiPost('shipments', { ...shipment, status: 'Отгружена' });
    const order = orders.find(o => o.id === shipment.orderId);
    if (order) {
      if (order.items && order.items.length > 0) {
        for (const item of order.items) {
          const p = products.find(prod => prod.id === item.productId);
          if (p) {
            const newStock = Math.max(0, p.stock - item.quantity);
            await apiPut('products', p.id, {
              stock: newStock,
              status: newStock > 0 ? (newStock < 10 ? 'Мало' : 'В наличии') : 'Нет в наличии'
            });
          }
        }
      } else {
        const p = products.find(prod => prod.id === order.productId);
        if (p) {
          const newStock = Math.max(0, p.stock - shipment.quantity);
          await apiPut('products', p.id, {
            stock: newStock,
            status: newStock > 0 ? (newStock < 10 ? 'Мало' : 'В наличии') : 'Нет в наличии'
          });
        }
      }
      await apiPut('orders', order.id, { status: 'Отгружен' });
    }
    fetchAll();
  };

  // Receipts
  const addReceipt = async (receipt) => {
    const r = {...receipt};
    delete r.isDamaged;
    delete r.isPoorQuality;
    await apiPost('receipts', r);

    const order = orders.find(o => o.id === receipt.orderId);
    if (order) {
      const orderTotalQty = order.items ? order.items.reduce((s,i)=>s+i.quantity,0) : order.quantity;

      if (receipt.acceptedQuantity >= orderTotalQty && !receipt.discrepancyReason && !receipt.isDamaged && !receipt.isPoorQuality) {
        await apiPut('orders', order.id, { status: 'Выполнен' });
      } else {
        await apiPut('orders', order.id, { status: 'На рекламации' });
      }

      if (receipt.isDamaged) {
        await apiPost('claims', {
          orderId: order.id,
          customerId: order.customerId,
          type: 'Брак',
          description: `Товар повреждён при получении. ${receipt.discrepancyReason || ''}`.trim(),
          employeeId: order.employeeId,
          deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          resolution: '',
          status: 'Новая',
          createdAt: new Date().toISOString().split('T')[0]
        });
      }
      if (receipt.isPoorQuality) {
        await apiPost('claims', {
          orderId: order.id,
          customerId: order.customerId,
          type: 'Брак',
          description: `Товар некачественный. ${receipt.discrepancyReason || ''}`.trim(),
          employeeId: order.employeeId,
          deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          resolution: '',
          status: 'Новая',
          createdAt: new Date().toISOString().split('T')[0]
        });
      }
      if (receipt.acceptedQuantity < orderTotalQty && !receipt.isDamaged && !receipt.isPoorQuality) {
        await apiPost('claims', {
          orderId: order.id,
          customerId: order.customerId,
          type: 'Недостача',
          description: `Недовоз: принято ${receipt.acceptedQuantity} из ${orderTotalQty}. ${receipt.discrepancyReason || ''}`.trim(),
          employeeId: order.employeeId,
          deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          resolution: '',
          status: 'Новая',
          createdAt: new Date().toISOString().split('T')[0]
        });
      }
    }
    fetchAll();
  };

  // Claims
  const addClaim = async (claim) => {
    await apiPost('claims', { ...claim, status: 'Новая', createdAt: new Date().toISOString().split('T')[0] });
    fetchAll();
  };
  const updateClaim = async (id, updates) => {
    await apiPut('claims', id, updates);
    fetchAll();
  };

  // Customers
  const addCustomer = async (customer) => {
    await apiPost('customers', customer);
    fetchAll();
  };

  // Products
  const addProduct = async (product) => {
    await apiPost('products', { ...product, stock: 0, status: 'Нет в наличии' });
    fetchAll();
  };

  const getCustomer = (id) => customers.find(c => c.id === id);
  const getProduct = (id) => products.find(p => p.id === id);
  const getEmployee = (id) => employees.find(e => e.id === id);
  const getOrder = (id) => orders.find(o => o.id === id);

  const deleteOrder = async (id) => {
    setOrders(prev => prev.filter(o => o.id !== id));
    await apiDelete('orders', id);
    fetchAll();
  };
  const deleteProduct = async (id) => {
    setProducts(prev => prev.filter(p => p.id !== id));
    await apiDelete('products', id);
    fetchAll();
  };
  const deleteShipment = async (id) => {
    setShipments(prev => prev.filter(s => s.orderId !== id));
    await apiDelete('shipments', id);
    fetchAll();
  };

  return (
    <DataContext.Provider value={{
      customers, products, employees, orders, stockReceipts, shipments, receipts, claims,
      addOrder, updateOrder, addStockReceipt, addShipment, addReceipt,
      addClaim, updateClaim, addCustomer, addProduct,
      deleteOrder, deleteProduct, deleteShipment,
      getCustomer, getProduct, getEmployee, getOrder, fetchAll
    }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);
