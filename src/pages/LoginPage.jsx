import { useState } from 'react';
import { motion } from 'framer-motion';
import { Truck, LogIn, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './LoginPage.css';

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Simulate async
    await new Promise(r => setTimeout(r, 600));

    const success = login(username, password);
    if (!success) {
      setError('Неверный логин или пароль');
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg">
        <div className="login-bg-gradient" />
        <div className="login-bg-grid" />
      </div>

      <motion.div
        className="login-card glass-card"
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', duration: 0.8, bounce: 0.3 }}
      >
        <motion.div
          className="login-logo"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
        >
          <div className="login-logo-icon">
            <Truck size={32} />
          </div>
        </motion.div>

        <motion.h1
          className="login-title"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          Отдел сбыта
        </motion.h1>

        <motion.p
          className="login-subtitle"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          Система управления сбытом продукции
        </motion.p>

        <motion.form
          className="login-form"
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="form-group">
            <label>Логин</label>
            <input
              type="text"
              placeholder="Введите логин"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>Пароль</label>
            <input
              type="password"
              placeholder="Введите пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <motion.div
              className="login-error"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <AlertCircle size={16} />
              {error}
            </motion.div>
          )}

          <button
            type="submit"
            className="btn btn-primary login-btn"
            disabled={loading || !username || !password}
          >
            {loading ? (
              <span className="login-spinner" />
            ) : (
              <>
                <LogIn size={18} />
                Войти
              </>
            )}
          </button>
        </motion.form>

        <motion.div
          className="login-hint"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <p>Тестовые аккаунты:</p>
          <div className="login-hint-accounts">
            <span>manager / manager</span>
            <span>warehouse / warehouse</span>
            <span>logist / logist</span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
