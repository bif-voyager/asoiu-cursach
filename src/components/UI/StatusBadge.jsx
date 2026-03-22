import './StatusBadge.css';

const statusConfig = {
  'Новый': { color: 'info' },
  'Новая': { color: 'info' },
  'Подтверждён': { color: 'accent' },
  'Отгружен': { color: 'warning' },
  'Отгружена': { color: 'warning' },
  'Доставлена': { color: 'success' },
  'Выполнен': { color: 'success' },
  'Закрыта': { color: 'success' },
  'Просрочен': { color: 'danger' },
  'В работе': { color: 'warning' },
  'Активен': { color: 'success' },
  'В отпуске': { color: 'info' },
  'В наличии': { color: 'success' },
  'Мало': { color: 'warning' },
  'Нет в наличии': { color: 'danger' },
};

export default function StatusBadge({ status }) {
  const config = statusConfig[status] || { color: 'info' };
  return (
    <span className={`status-badge status-${config.color}`}>
      {status}
    </span>
  );
}
