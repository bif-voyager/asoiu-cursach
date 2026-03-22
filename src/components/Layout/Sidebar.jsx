import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShoppingCart, Warehouse, Truck,
  PackageCheck, AlertTriangle, BookOpen
} from 'lucide-react';
import './Sidebar.css';

const navItems = [
  { to: '/', icon: <ShoppingCart size={20} />, label: 'Заказы' },
  { to: '/warehouse', icon: <Warehouse size={20} />, label: 'Склад' },
  { to: '/shipments', icon: <Truck size={20} />, label: 'Отгрузки' },
  { to: '/receipts', icon: <PackageCheck size={20} />, label: 'Журнал получений' },
  { to: '/claims', icon: <AlertTriangle size={20} />, label: 'Рекламации' },
];

export default function Sidebar() {
  return (
    <motion.aside
      className="sidebar"
      initial={{ x: -260 }}
      animate={{ x: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Truck size={24} />
        </div>
        <span>Отдел сбыта</span>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item, i) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <motion.div
              className="sidebar-link-inner"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
            >
              {item.icon}
              <span>{item.label}</span>
            </motion.div>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <span className="sidebar-version">v1.0.0</span>
      </div>
    </motion.aside>
  );
}
