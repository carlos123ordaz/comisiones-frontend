import { useEffect, useState } from 'react';
import axios from 'axios';
import {
    UserX, DollarSign, Package, TrendingDown, FileQuestion,
    GitCompare, UserMinus, ChevronDown, ChevronUp, RefreshCw
} from 'lucide-react';
import { Spinner, Alert } from './ui';
import { URI_API } from '../config/api';

const CARDS_CONFIG = [
    {
        key: 'sin_responsable',
        label: 'Sin Responsable',
        description: 'Facturas sin responsable asignado en Bitrix',
        icon: UserX,
        color: 'red',
    },
    {
        key: 'sin_monto',
        label: 'Sin Monto',
        description: 'Facturas con monto nulo o cero',
        icon: DollarSign,
        color: 'orange',
    },
    {
        key: 'sin_producto',
        label: 'Sin Producto',
        description: 'Facturas sin producto CRM registrado',
        icon: Package,
        color: 'amber',
    },
    {
        key: 'sin_margen',
        label: 'Sin Margen',
        description: 'Facturas sin utilidad bruta registrada',
        icon: TrendingDown,
        color: 'purple',
    },
    {
        key: 'sin_opci',
        label: 'Sin OPCI',
        description: 'Facturas sin número de cotización (OPCI)',
        icon: FileQuestion,
        color: 'blue',
    },
    {
        key: 'erp_mismatch',
        label: 'ERP ≠ Facturación',
        description: 'Montos ERP no coinciden con el Excel',
        icon: GitCompare,
        color: 'teal',
    },
    {
        key: 'sin_resp_por_opci',
        label: 'Sin Resp. por OPCI',
        description: 'Sin responsable en Bitrix porque no hay OPCI en la factura',
        icon: UserMinus,
        color: 'gray',
    },
];

const COLOR_MAP = {
    red: { bg: 'bg-red-50', border: 'border-red-100', icon: 'text-red-500', badge: 'bg-red-100 text-red-700' },
    orange: { bg: 'bg-orange-50', border: 'border-orange-100', icon: 'text-orange-500', badge: 'bg-orange-100 text-orange-700' },
    amber: { bg: 'bg-amber-50', border: 'border-amber-100', icon: 'text-amber-500', badge: 'bg-amber-100 text-amber-700' },
    purple: { bg: 'bg-purple-50', border: 'border-purple-100', icon: 'text-purple-500', badge: 'bg-purple-100 text-purple-700' },
    blue: { bg: 'bg-blue-50', border: 'border-blue-100', icon: 'text-blue-500', badge: 'bg-blue-100 text-blue-700' },
    teal: { bg: 'bg-teal-50', border: 'border-teal-100', icon: 'text-teal-600', badge: 'bg-teal-100 text-teal-700' },
    gray: { bg: 'bg-n-50', border: 'border-n-150', icon: 'text-n-500', badge: 'bg-n-100 text-n-600' },
};

// Generic rows for "missing field" cards
const ITEM_COLS = [
    { key: 'numero', label: 'Número' },
    { key: 'nombre_empresa', label: 'Empresa' },
    { key: 'producto_crm', label: 'Producto' },
    { key: 'cotizacion_num', label: 'OPCI' },
    { key: 'monto_total', label: 'Monto' },
    { key: 'mes', label: 'Mes' },
    { key: 'anio', label: 'Año' },
];

function AnalisisCard({ config, data }) {
    const [open, setOpen] = useState(false);
    const { bg, border, icon: iconCls, badge } = COLOR_MAP[config.color] || COLOR_MAP.gray;
    const Icon = config.icon;
    const count = data?.count ?? 0;
    const items = data?.items ?? [];

    // Detect ERP mismatch card (has different columns)
    const isErp = config.key === 'erp_mismatch';
    const erpCols = items.length > 0 ? Object.keys(items[0]) : [];

    return (
        <div className={`rounded-[10px] border ${border} overflow-hidden`}>
            {/* Card header */}
            <div
                className={`flex items-center gap-3 p-4 cursor-pointer ${bg} select-none`}
                onClick={() => count > 0 && setOpen(o => !o)}
            >
                <div className={`w-8 h-8 rounded-[8px] ${bg} border ${border} flex items-center justify-center shrink-0`}>
                    <Icon size={16} className={iconCls} />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-[700] text-n-900">{config.label}</div>
                    <div className="text-[11.5px] text-n-500 truncate">{config.description}</div>
                </div>
                <div className={`text-[13px] font-[700] px-2.5 py-0.5 rounded-full ${badge} shrink-0`}>
                    {count}
                </div>
                {count > 0 && (
                    <div className="text-n-400 shrink-0">
                        {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                    </div>
                )}
            </div>

            {/* Expandable table */}
            {open && count > 0 && (
                <div className="overflow-x-auto border-t border-n-100">
                    <table className="w-full text-[11.5px]">
                        <thead>
                            <tr className="bg-n-50 border-b border-n-100">
                                {(isErp ? erpCols : ITEM_COLS.map(c => c.label)).map(h => (
                                    <th key={h} className="px-3 py-2 text-left font-[600] text-n-600 whitespace-nowrap">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item, i) => (
                                <tr key={i} className="border-b border-n-50 hover:bg-n-25 transition-colors">
                                    {isErp
                                        ? erpCols.map(col => (
                                            <td key={col} className="px-3 py-2 text-n-700 whitespace-nowrap">{item[col]}</td>
                                        ))
                                        : ITEM_COLS.map(col => (
                                            <td key={col.key} className="px-3 py-2 text-n-700 whitespace-nowrap">
                                                {item[col.key] || <span className="text-n-300">—</span>}
                                            </td>
                                        ))
                                    }
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export function AnalisisTab() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const load = async () => {
        try {
            setLoading(true);
            setError(null);
            const r = await axios.get(`${URI_API}/invoices/analisis`);
            setData(r.data);
        } catch (e) {
            setError(e.response?.data?.detail || e.message || 'Error al cargar análisis');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    if (loading) return (
        <div className="flex justify-center items-center py-16"><Spinner size={32} /></div>
    );

    return (
        <div>
            {error && <Alert severity="error" className="mb-4">{error}</Alert>}

            <div className="flex items-center justify-between mb-4">
                <p className="text-[12px] text-n-500">
                    Haz clic en una tarjeta para ver el detalle. Los datos se actualizan al sincronizar con Bitrix24.
                </p>
                <button
                    onClick={load}
                    className="flex items-center gap-1.5 text-[12px] text-n-500 hover:text-n-900 transition-colors"
                >
                    <RefreshCw size={13} />
                    Actualizar
                </button>
            </div>

            <div className="flex flex-col gap-3">
                {CARDS_CONFIG.map(cfg => (
                    <AnalisisCard key={cfg.key} config={cfg} data={data?.[cfg.key]} />
                ))}
            </div>
        </div>
    );
}
