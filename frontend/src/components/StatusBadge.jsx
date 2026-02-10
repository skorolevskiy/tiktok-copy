const STATUS_CONFIG = {
  pending: { label: 'Ожидание', icon: 'fa-clock' },
  downloading: { label: 'Скачивание', icon: 'fa-spinner fa-spin' },
  downloaded: { label: 'Скачано', icon: 'fa-check' },
  processing: { label: 'Обработка', icon: 'fa-spinner fa-spin' },
  completed: { label: 'Готово', icon: 'fa-check-circle' },
  active: { label: 'Активен', icon: 'fa-check-circle' },
  failed: { label: 'Ошибка', icon: 'fa-times-circle' },
  error: { label: 'Ошибка', icon: 'fa-times-circle' },
};

export default function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || { label: status, icon: 'fa-circle' };
  return (
    <span className={`badge badge-${status}`}>
      <i className={`fas ${config.icon}`}></i> {config.label}
    </span>
  );
}
