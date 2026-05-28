import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { X, AlertTriangle, CheckCircle, Info, Loader2, FolderOpen, ExternalLink } from 'lucide-react';

/* ─── Button ──────────────────────────────────────────────── */
export function Button({ variant = 'secondary', size = 'md', icon: Icon, iconRight: IconRight, children, onClick, disabled, type, className = '', title }) {
  const sizes = {
    sm: 'h-[26px] px-[9px] text-[12px] gap-[5px]',
    md: 'h-[30px] px-[11px] text-[12.5px] gap-[6px]',
    lg: 'h-[36px] px-[14px] text-[13px] gap-[7px]',
  };
  const iconSizes = { sm: 13, md: 14, lg: 15 };

  const variants = {
    primary:   'bg-brand-600 text-white border border-brand-600 shadow-[0_1px_0_rgba(255,255,255,.12)_inset,0_1px_2px_rgba(79,70,229,.18)] hover:bg-brand-700',
    secondary: 'bg-n-0 text-n-800 border border-n-200 shadow-[var(--shadow-xs)] hover:border-n-300 hover:bg-n-25',
    ghost:     'bg-transparent text-n-700 border border-transparent hover:bg-n-100',
    danger:    'bg-n-0 text-red-600 border border-n-200 hover:bg-red-50 hover:border-red-100',
    subtle:    'bg-n-100 text-n-800 border border-transparent hover:bg-n-150',
  };

  return (
    <button
      type={type || 'button'}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`inline-flex items-center justify-center rounded-[6px] font-[550] tracking-[-0.005em] transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${sizes[size]} ${variants[variant]} ${className}`}
    >
      {Icon && <Icon size={iconSizes[size]} />}
      {children}
      {IconRight && <IconRight size={iconSizes[size]} />}
    </button>
  );
}

/* ─── IconButton ─────────────────────────────────────────── */
export function IconButton({ icon: Icon, onClick, title, size = 28, danger = false, disabled, className = '' }) {
  const iconSize = Math.round(size * 0.5);
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      disabled={disabled}
      style={{ width: size, height: size }}
      className={`inline-flex items-center justify-center rounded-[6px] border border-transparent transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed
        ${danger ? 'text-red-600 hover:bg-red-50 hover:text-red-700' : 'text-n-500 hover:bg-n-100 hover:text-n-800'} ${className}`}
    >
      <Icon size={iconSize} />
    </button>
  );
}

/* ─── Input ──────────────────────────────────────────────── */
export function Input({ value, onChange, placeholder, icon: Icon, type = 'text', className = '', size = 'md', autoFocus, disabled, name }) {
  const heights = { sm: 'h-[28px]', md: 'h-[32px]', lg: 'h-[36px]' };
  return (
    <div className={`flex items-center bg-n-0 border border-n-200 rounded-[6px] ${heights[size]} px-[10px] transition-all duration-150 ring-focus ${className}`}>
      {Icon && <Icon size={14} className="text-n-500 mr-[7px] shrink-0" />}
      <input
        type={type}
        value={value ?? ''}
        name={name}
        onChange={(e) => onChange && onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        disabled={disabled}
        className="flex-1 border-none outline-none bg-transparent text-[13px] text-n-900 min-w-0 disabled:opacity-50"
      />
    </div>
  );
}

/* ─── Select ─────────────────────────────────────────────── */
export function Select({ value, onChange, options, placeholder, className = '', size = 'md', disabled }) {
  const heights = { sm: 'h-[28px]', md: 'h-[32px]' };
  return (
    <div className={`relative inline-flex w-full ${className}`}>
      <select
        value={value ?? ''}
        onChange={(e) => onChange && onChange(e.target.value)}
        disabled={disabled}
        className={`appearance-none w-full ${heights[size]} pl-[10px] pr-[28px] text-[12.5px] text-n-800 bg-n-0 border border-n-200 rounded-[6px] cursor-pointer outline-none focus:border-brand-500 focus:shadow-[0_0_0_3px_rgba(79,70,229,0.18)] transition-all disabled:opacity-50`}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(opt => (
          <option key={opt.value ?? opt} value={opt.value ?? opt}>{opt.label ?? opt}</option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-[8px] top-1/2 -translate-y-1/2 text-n-500">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </span>
    </div>
  );
}

/* ─── Modal ──────────────────────────────────────────────── */
export function Modal({ open, onClose, title, children, width = 480, footer }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[100] bg-[rgba(20,22,28,0.45)] backdrop-blur-[2px] flex items-center justify-center p-6 animate-fade"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width, maxWidth: '100%', maxHeight: '90vh' }}
        className="bg-n-0 rounded-[12px] shadow-[var(--shadow-lg)] border border-n-200 flex flex-col overflow-hidden animate-scale"
      >
        <div className="flex items-center justify-between px-[18px] py-[14px] border-b border-n-150">
          <h2 className="text-[14px]">{title}</h2>
          <IconButton icon={X} onClick={onClose} title="Cerrar" />
        </div>
        <div className="p-[18px] overflow-y-auto flex-1">{children}</div>
        {footer && (
          <div className="px-[18px] py-[12px] border-t border-n-150 bg-n-25 flex justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Badge ──────────────────────────────────────────────── */
export function Badge({ children, color = 'default', size = 'md' }) {
  const pad = size === 'sm' ? 'py-[2px] px-[7px] text-[11px]' : 'py-[3px] px-[9px] text-[11.5px]';
  const colors = {
    default: 'bg-n-100 text-n-700',
    brand:   'bg-brand-50 text-brand-700',
    green:   'bg-green-50 text-green-700',
    red:     'bg-red-50 text-red-700',
    amber:   'bg-amber-50 text-amber-700',
    teal:    'bg-[#f0fdfa] text-teal-700',
    blue:    'bg-blue-50 text-blue-700',
  };
  return (
    <span className={`inline-flex items-center rounded-[6px] font-[550] leading-[1.2] tracking-[-0.005em] whitespace-nowrap ${pad} ${colors[color] || colors.default}`}>
      {children}
    </span>
  );
}

/* ─── Alert ──────────────────────────────────────────────── */
export function Alert({ severity = 'info', children, onClose, className = '' }) {
  const configs = {
    info:    { cls: 'bg-blue-50 border-blue-100 text-blue-800', Icon: Info,          iconCls: 'text-blue-600' },
    warning: { cls: 'bg-amber-50 border-amber-100 text-amber-800', Icon: AlertTriangle, iconCls: 'text-amber-600' },
    success: { cls: 'bg-green-50 border-green-100 text-green-800', Icon: CheckCircle,   iconCls: 'text-green-600' },
    error:   { cls: 'bg-red-50 border-red-100 text-red-700',    Icon: AlertTriangle, iconCls: 'text-red-500' },
  };
  const c = configs[severity] || configs.info;
  return (
    <div className={`flex items-start gap-[10px] border rounded-[10px] p-[12px] text-[12.5px] leading-[1.5] ${c.cls} ${className}`}>
      <c.Icon size={15} className={`mt-[1px] shrink-0 ${c.iconCls}`} />
      <div className="flex-1">{children}</div>
      {onClose && (
        <button onClick={onClose} className={`shrink-0 hover:opacity-70 ${c.iconCls}`}>
          <X size={13} />
        </button>
      )}
    </div>
  );
}

/* ─── Spinner ────────────────────────────────────────────── */
export function Spinner({ size = 18, className = '' }) {
  return <Loader2 size={size} className={`animate-spin text-brand-600 ${className}`} />;
}

/* ─── Toast ──────────────────────────────────────────────── */
const ToastCtx = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((t) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(ts => [...ts, { ...t, id }]);
    setTimeout(() => setToasts(ts => ts.filter(x => x.id !== id)), t.duration || 5000);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="fixed right-5 bottom-5 z-[200] flex flex-col gap-2 max-w-[380px]">
        {toasts.map(t => <ToastItem key={t.id} toast={t} />)}
      </div>
    </ToastCtx.Provider>
  );
}

function ToastItem({ toast }) {
  const configs = {
    info:    { cls: 'bg-n-0 border-n-200',          Icon: Info,          iconCls: 'text-brand-600 border-n-200 bg-n-0' },
    warning: { cls: 'bg-[#fff7ed] border-[#fed7aa]', Icon: AlertTriangle, iconCls: 'text-[#c2410c] border-[#fed7aa] bg-[#fff7ed]' },
    success: { cls: 'bg-green-50 border-green-100',  Icon: CheckCircle,   iconCls: 'text-green-600 border-green-100 bg-green-50' },
    error:   { cls: 'bg-red-50 border-red-100',      Icon: AlertTriangle, iconCls: 'text-red-600 border-red-100 bg-red-50' },
  };
  const c = configs[toast.kind] || configs.info;
  return (
    <div className={`border rounded-[10px] p-[10px_12px] shadow-[var(--shadow-md)] flex items-start gap-[10px] animate-slide ${c.cls}`}>
      <span className={`w-[22px] h-[22px] rounded-[6px] inline-flex items-center justify-center shrink-0 border ${c.iconCls}`}>
        <c.Icon size={13} />
      </span>
      <div className="flex-1">
        {toast.title && <div className="text-[12.5px] font-[600] text-n-900">{toast.title}</div>}
        <div className="text-[12px] text-n-700 leading-[1.5]">{toast.message}</div>
      </div>
    </div>
  );
}

export const useToast = () => useContext(ToastCtx);

/* ─── Empty State ────────────────────────────────────────── */
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center py-10 px-6 text-center text-n-600">
      {Icon && (
        <div className="w-11 h-11 rounded-[12px] bg-brand-50 text-brand-600 border border-brand-100 inline-flex items-center justify-center mb-3">
          <Icon size={20} />
        </div>
      )}
      <div className="text-[13.5px] font-[600] text-n-900 mb-1">{title}</div>
      {description && <div className="text-[12.5px] text-n-500 max-w-[340px] leading-[1.5]">{description}</div>}
      {action && <div className="mt-[14px]">{action}</div>}
    </div>
  );
}

/* ─── Tabs ───────────────────────────────────────────────── */
export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="flex border-b border-n-150 bg-n-0">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={`relative inline-flex items-center gap-[7px] h-[44px] px-[14px] text-[12.5px] transition-all duration-150 ${
            value === tab.value
              ? 'text-brand-700 font-[600]'
              : 'text-n-500 font-[500] hover:text-n-800'
          }`}
        >
          {tab.icon && <tab.icon size={15} />}
          {tab.label}
          {value === tab.value && (
            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-brand-600 rounded-t-sm" />
          )}
        </button>
      ))}
    </div>
  );
}

/* ─── Download Dialog ────────────────────────────────────── */
export function DownloadSuccessDialog({ open, onClose, filename, savedPath, onOpenFile, onShowInFolder, subtitle }) {
  return (
    <Modal open={open} onClose={onClose} title="Archivo guardado" width={460}
      footer={
        <>
          <Button variant="secondary" icon={FolderOpen} onClick={onShowInFolder}>Mostrar en carpeta</Button>
          <Button variant="primary" icon={ExternalLink} onClick={onOpenFile}>Abrir archivo</Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3 p-3 bg-n-50 border border-n-200 rounded-[8px]">
          <div className="w-9 h-9 rounded-[8px] bg-green-50 border border-green-100 flex items-center justify-center shrink-0">
            <CheckCircle size={18} className="text-green-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-[600] text-n-900 truncate">{filename}</div>
            {subtitle && <div className="text-[11.5px] text-n-500">{subtitle}</div>}
          </div>
        </div>
        <div>
          <div className="text-[11.5px] text-n-500 font-[500] mb-1">Guardado en:</div>
          <div className="p-[8px] bg-n-50 border border-n-200 rounded-[6px] font-mono text-[11.5px] text-n-600 break-all">
            {savedPath}
          </div>
        </div>
      </div>
    </Modal>
  );
}

