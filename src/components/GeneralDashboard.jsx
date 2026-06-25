import { useEffect, useMemo, useRef, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import { URI_API } from '../config/api';
import { Spinner, Alert, Select, Badge } from './ui';
import { useTheme } from '../contexts/ThemeContext';

const API_URL = URI_API;

const CHART_COLORS = ['#4f46e5','#14b8a6','#f59e0b','#ef4444','#3b82f6','#a855f7'];

const GeneralDashboard = () => {
    const { isDark } = useTheme();
    const gridColor    = isDark ? '#2e3248' : '#e1e4ea';
    const axisColor    = isDark ? '#5a6070' : '#7a818f';
    const tooltipStyle = {
        backgroundColor: isDark ? '#15181f' : '#fff',
        border: `1px solid ${isDark ? '#2e3248' : '#e1e4ea'}`,
        borderRadius: 10,
        fontSize: 12,
        color: isDark ? '#dde2e9' : '#242832',
    };
    const [invoices, setInvoices]             = useState([]);
    const [loading, setLoading]               = useState(true);
    const [error, setError]                   = useState(null);
    const [availableFilters, setAvailableFilters] = useState({ responsables: [], productos: [], trimestres: [1,2,3,4], anios: [] });
    const [selectedPerson, setSelectedPerson] = useState('Todas');
    const [selectedName, setSelectedName]     = useState('Todas');
    const [dateRange, setDateRange]           = useState(1);
    const [selectedYear, setSelectedYear]     = useState(2026);
    const hasInitialized = useRef(false);

    const loadInvoices = async ({ silent = false } = {}) => {
        try {
            if (!silent) setLoading(true);
            setError(null);
            const params = new URLSearchParams();
            if (selectedPerson !== 'Todas') params.append('responsable', selectedPerson);
            if (selectedName  !== 'Todas') params.append('producto', selectedName);
            params.append('trimestre', dateRange);
            params.append('anio', selectedYear);
            const r = await axios.get(`${API_URL}/invoices/dashboard?${params}`);
            setInvoices(r.data);
        } catch {
            setError('Error al cargar facturas.');
            setInvoices([]);
        } finally { setLoading(false); }
    };

    useEffect(() => {
        let cancelled = false;
        const init = async () => {
            try {
                setLoading(true);
                const [fR, iR] = await Promise.all([
                    axios.get(`${API_URL}/invoices/filtros`),
                    axios.get(`${API_URL}/invoices/dashboard?trimestre=${dateRange}&anio=${selectedYear}`),
                ]);
                if (cancelled) return;
                setAvailableFilters({
                    responsables: ['Todas', ...fR.data.responsables],
                    productos:    ['Todas', ...fR.data.productos],
                    trimestres:   [1,2,3,4],
                    anios:        fR.data.anios,
                });
                setInvoices(iR.data);
                hasInitialized.current = true;
            } catch { if (!cancelled) setError('Error al cargar la información general.'); }
            finally  { if (!cancelled) setLoading(false); }
        };
        init();
        return () => { cancelled = true; };
    }, []);

    useEffect(() => {
        if (!hasInitialized.current) return;
        loadInvoices({ silent: false });
    }, [selectedPerson, selectedName, dateRange, selectedYear]);

    const monthNames = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];

    const monthlyData = useMemo(() => {
        const totals = {};
        invoices.forEach(inv => {
            const m = inv.mes;
            if (m >= 1 && m <= 12) totals[monthNames[m-1]] = (totals[monthNames[m-1]] || 0) + (inv.monto_total || 0);
        });
        return Object.entries(totals).map(([mes, total]) => ({ mes, total: total / 1_000_000 }))
            .sort((a, b) => monthNames.indexOf(a.mes) - monthNames.indexOf(b.mes));
    }, [invoices]);

    const detailedMonthlyData = useMemo(() => {
        const map = {};
        invoices.forEach(inv => {
            const m = inv.mes; const prod = inv.producto;
            if (m < 1 || m > 12) return;
            const mn = monthNames[m-1];
            map[mn] ??= {};
            map[mn][prod] = (map[mn][prod] || 0) + (inv.monto_total || 0);
        });
        return Object.entries(map)
            .map(([mes, prods]) => ({ mes, ...Object.fromEntries(Object.entries(prods).map(([k,v]) => [k, v/1_000_000])) }))
            .sort((a, b) => monthNames.indexOf(a.mes) - monthNames.indexOf(b.mes));
    }, [invoices]);

    const uniqueProducts = useMemo(() => {
        const s = new Set();
        invoices.forEach(inv => { if (inv.producto) s.add(inv.producto); });
        return [...s];
    }, [invoices]);

    const summaryData = useMemo(() =>
        Object.entries(
            invoices.reduce((acc, inv) => { acc[inv.producto] = (acc[inv.producto] || 0) + (inv.monto_total || 0); return acc; }, {})
        ).map(([name, total], i) => ({ name, total, color: CHART_COLORS[i % CHART_COLORS.length] }))
        .sort((a, b) => b.total - a.total),
    [invoices]);

    const totalGeneral = useMemo(() => invoices.reduce((s, i) => s + (i.monto_total || 0), 0), [invoices]);

    if (loading) return <div className="flex justify-center items-center h-60"><Spinner size={40} /></div>;

    return (
        <div className="p-4 md:p-6">
            {/* Header */}
            <div className="mb-5">
                <h1 className="text-[17px] font-[700] text-n-900 tracking-[-0.014em]">Dashboard General</h1>
                <p className="text-[12.5px] text-n-500 mt-0.5">Vista consolidada por responsable, producto y periodo.</p>
            </div>

            {error && <Alert severity="error" className="mb-4">{error}</Alert>}

            {/* Filters */}
            <div className="card p-4 mb-5">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                        { label: 'Responsable', value: selectedPerson, onChange: setSelectedPerson, options: availableFilters.responsables.map(v => ({ value: v, label: v })) },
                        { label: 'Producto',    value: selectedName,   onChange: setSelectedName,   options: availableFilters.productos.map(v => ({ value: v, label: v })) },
                        { label: 'Trimestre',   value: dateRange,      onChange: v => setDateRange(Number(v)), options: [1,2,3,4].map(q => ({ value: q, label: `Q${q}` })) },
                        { label: 'Año',         value: selectedYear,   onChange: v => setSelectedYear(Number(v)), options: availableFilters.anios.map(y => ({ value: y, label: String(y) })) },
                    ].map(f => (
                        <div key={f.label}>
                            <label className="block text-[11px] font-[600] text-n-500 uppercase tracking-[0.06em] mb-1.5">{f.label}</label>
                            <Select value={f.value} onChange={f.onChange} options={f.options} />
                        </div>
                    ))}
                </div>
            </div>

            {invoices.length === 0 ? (
                <Alert severity="warning">No se encontraron facturas con los filtros seleccionados.</Alert>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5">
                    {/* Summary column */}
                    <div className="card p-4">
                        <div className="text-[10.5px] text-n-500 uppercase tracking-[0.07em] font-[600] mb-2">Resumen</div>
                        <div className="mono tnum text-[28px] font-[700] text-n-900 tracking-[-0.025em] leading-[1]">
                            ${(totalGeneral / 1_000_000).toFixed(2)}M
                        </div>
                        <div className="text-[12px] text-n-500 mt-1 mb-4">Monto total acumulado</div>

                        <div className="flex flex-col gap-0">
                            {summaryData.map((item, i) => (
                                <div key={i} className={`flex items-center gap-3 py-3 ${i < summaryData.length - 1 ? 'border-b border-n-100' : ''}`}>
                                    <div style={{ background: item.color }} className="w-2 h-8 rounded-[2px] shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <div className="text-[12.5px] font-[600] text-n-900 truncate">{item.name}</div>
                                        <div className="text-[11.5px] text-n-500 mono tnum">${item.total.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Charts column */}
                    <div className="flex flex-col gap-5">
                        {/* Chart 1 */}
                        <div className="card p-4">
                            <div className="text-[13px] font-[700] text-n-900 mb-4">Total por Mes</div>
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={monthlyData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                                    <XAxis dataKey="mes" stroke={axisColor} axisLine={false} tickLine={false} style={{ fontSize: 11 }} />
                                    <YAxis stroke={axisColor} axisLine={false} tickLine={false} style={{ fontSize: 11 }} />
                                    <Tooltip contentStyle={tooltipStyle} formatter={v => `$${v.toFixed(2)}M`} />
                                    <Bar dataKey="total" fill="#4f46e5" radius={[4,4,0,0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Chart 2 */}
                        <div className="card p-4">
                            <div className="text-[13px] font-[700] text-n-900 mb-3">Total por Mes y Producto</div>
                            <div className="flex flex-wrap gap-1.5 mb-4">
                                {uniqueProducts.map((name, idx) => (
                                    <Badge key={name} style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] + '20', color: CHART_COLORS[idx % CHART_COLORS.length] }}>
                                        {name}
                                    </Badge>
                                ))}
                            </div>
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={detailedMonthlyData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                                    <XAxis dataKey="mes" stroke={axisColor} axisLine={false} tickLine={false} style={{ fontSize: 11 }} />
                                    <YAxis stroke={axisColor} axisLine={false} tickLine={false} style={{ fontSize: 11 }} />
                                    <Tooltip contentStyle={tooltipStyle} formatter={v => `$${v.toFixed(2)}M`} />
                                    {uniqueProducts.map((p, idx) => (
                                        <Bar key={p} dataKey={p} stackId="a" fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                                    ))}
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GeneralDashboard;
