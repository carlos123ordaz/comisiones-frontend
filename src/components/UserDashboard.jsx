import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Cell, PieChart, Pie, ReferenceLine, Legend
} from 'recharts';
import { LogOut, Download, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { save } from '@tauri-apps/plugin-dialog';
import { writeFile } from '@tauri-apps/plugin-fs';
import { openPath, revealItemInDir } from '@tauri-apps/plugin-opener';
import moment from 'moment';
import { URI_API } from '../config/api';
import { Button, Select, Alert, Spinner, DownloadSuccessDialog, IconButton } from './ui';
import { useTheme } from '../contexts/ThemeContext';
import { Moon, Sun } from 'lucide-react';

const CHART_COLORS = ['#4f46e5','#14b8a6','#f59e0b','#ef4444','#3b82f6','#a855f7'];

const TRIM_MESES = {
    '1': { 1: 'enero', 2: 'febrero', 3: 'marzo' },
    '2': { 4: 'abril', 5: 'mayo', 6: 'junio' },
    '3': { 7: 'julio', 8: 'agosto', 9: 'septiembre' },
    '4': { 10: 'octubre', 11: 'noviembre', 12: 'diciembre' },
};

const CustomGauge = ({ value, max }) => {
    const pct = max > 0 ? (value / max) * 100 : 0;
    const gaugeData = [
        { value, fill: pct >= 100 ? '#10b981' : pct >= 80 ? '#4f46e5' : '#f59e0b' },
        { value: Math.max(0, max - value), fill: '#f1f2f5' },
    ];
    return (
        <div className="relative w-full" style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%" debounce={100}>
                <PieChart>
                    <Pie data={gaugeData} cx="50%" cy="72%" startAngle={180} endAngle={0} innerRadius="68%" outerRadius="88%" dataKey="value" stroke="none">
                        {gaugeData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                    </Pie>
                </PieChart>
            </ResponsiveContainer>
            <div className="absolute bottom-[26%] left-0 right-0 flex flex-col items-center">
                <span className="mono tnum text-[28px] font-[700] text-n-900 leading-[1]">{value.toFixed(2)}</span>
                <span className="text-[11px] text-n-500 mt-0.5">mil</span>
            </div>
            <span className="absolute bottom-[14%] left-[14%] text-[11px] text-n-500">0.00</span>
            <span className="absolute bottom-[14%] right-[14%] text-[11px] text-n-500">{max.toFixed(2)}</span>
            <span className="absolute top-[8%] left-0 right-0 text-center mono tnum text-[15px] font-[600]"
                style={{ color: pct >= 100 ? '#10b981' : pct >= 80 ? '#4f46e5' : '#f59e0b' }}>
                {pct.toFixed(1)}%
            </span>
        </div>
    );
};

const UserDashboard = () => {
    const { isDark, toggleTheme } = useTheme();
    const { user, logout }              = useAuth();
    const navigate                      = useNavigate();
    const [userSelected, setUserSelected]         = useState('');
    const [trimestreSelected, setTrimestreSelected] = useState('1');
    const [selectedYear, setSelectedYear]         = useState(2026);
    const [usuarios, setUsuarios]                 = useState([]);
    const [resume, setResume]                     = useState(null);
    const [tipoVista, setTipoVista]               = useState('umbral');
    const [comisiones, setComisiones]             = useState(null);
    const [loading, setLoading]                   = useState(true);
    const [refreshing, setRefreshing]             = useState(false);
    const [error, setError]                       = useState(null);
    const [downloading, setDownloading]           = useState(false);
    const [downloadDialog, setDownloadDialog]     = useState({ open:false, filename:'', savedPath:'' });
    const hasInitialized   = useRef(false);
    const skipNextReactive = useRef(false);
    const availableYears   = [2025, 2026];

    const fetchData = useCallback(async (name) => {
        if (!name) return;
        try {
            setRefreshing(true);
            setError(null);
            const [rR, cR] = await Promise.all([
                axios.get(`${URI_API}/resumen/${name}/${trimestreSelected}`,  { params: { anio: selectedYear } }),
                axios.get(`${URI_API}/comisiones/${name}/${trimestreSelected}`,{ params: { anio: selectedYear } }),
            ]);
            setTipoVista(rR.data.unidad_negocio);
            setResume({ productos: rR.data.data_productos || [], endress: rR.data.data_endress || null, unidad_negocio: rR.data.unidad_negocio });
            setComisiones(cR.data || null);
        } catch (e) {
            setError(e.response?.data?.detail || 'Error al cargar datos');
        } finally { setRefreshing(false); }
    }, [trimestreSelected, selectedYear]);

    useEffect(() => {
        if (!user) return;
        let cancelled = false;
        const init = async () => {
            try {
                setLoading(true); setError(null);
                let users = [], selected = '';
                if (!user.esLider) {
                    users    = [{ nombre: user.nombre, unidad_negocio: user.unidad_negocio || 'N/A' }];
                    selected = user.nombre;
                } else {
                    const r = await axios.get(`${URI_API}/usuarios`);
                    if (cancelled) return;
                    users    = r.data;
                    selected = r.data[0]?.nombre || '';
                }
                if (cancelled) return;
                setUsuarios(users);
                skipNextReactive.current = true;
                setUserSelected(selected);
                if (!selected) { hasInitialized.current = true; setLoading(false); return; }
                const [rR, cR] = await Promise.all([
                    axios.get(`${URI_API}/resumen/${selected}/${trimestreSelected}`,  { params: { anio: selectedYear } }),
                    axios.get(`${URI_API}/comisiones/${selected}/${trimestreSelected}`,{ params: { anio: selectedYear } }),
                ]);
                if (cancelled) return;
                setTipoVista(rR.data.unidad_negocio);
                setResume({ productos: rR.data.data_productos || [], endress: rR.data.data_endress || null, unidad_negocio: rR.data.unidad_negocio });
                setComisiones(cR.data || null);
                hasInitialized.current = true;
                skipNextReactive.current = false;
            } catch (e) {
                if (!cancelled) setError(e.response?.data?.detail || 'Error al cargar datos');
            } finally { if (!cancelled) setLoading(false); }
        };
        init();
        return () => { cancelled = true; };
    }, [user]);

    useEffect(() => {
        if (!hasInitialized.current || !selectedYear) return;
        if (skipNextReactive.current) { skipNextReactive.current = false; return; }
        fetchData(userSelected);
    }, [userSelected, trimestreSelected, selectedYear]);

    const handleDownloadUserReport = async () => {
        if (!userSelected) return;
        setDownloading(true);
        try {
            const r = await axios.get(`${URI_API}/invoices/execute_report_by_user`, {
                params: { name_user: userSelected }, responseType: 'blob',
                headers: { 'Cache-Control':'no-cache', Pragma:'no-cache', Expires:'0' },
            });
            const ts       = moment().format('YYYYMMDD_HHmmss');
            const fileName = `reporte_${userSelected.replace(/\s+/g,'_')}_${ts}.xlsx`;
            const ab       = await r.data.arrayBuffer();
            const fp       = await save({ defaultPath: fileName, filters: [{ name:'Excel', extensions:['xlsx'] }] });
            if (fp) {
                await writeFile(fp, new Uint8Array(ab));
                setDownloadDialog({ open:true, filename:fileName, savedPath:fp });
            }
        } catch (e) {
            alert(`Error: ${e.response?.data?.detail || e.message}`);
        } finally { setDownloading(false); }
    };

    /* ── Memoized data ─────────────────────────────────────── */
    const productosPositivos = useMemo(() =>
        resume?.productos?.filter(p => (p['Total'] || 0) > 0) || [],
    [resume]);

    const productoMesData = useMemo(() => {
        if (!productosPositivos.length) return [];
        const mesesMap = TRIM_MESES[trimestreSelected];
        const mesesNums = Object.keys(mesesMap).map(Number);
        return Object.values(mesesMap).map((nombre, i) => {
            const mesNum = mesesNums[i];
            const dp = { mes: nombre };
            productosPositivos.forEach(p => { dp[p['Producto']] = (p[mesNum] || 0) > 0 ? (p[mesNum] || 0) / 1000 : 0; });
            return dp;
        });
    }, [productosPositivos, trimestreSelected]);

    const monthlyData = useMemo(() => {
        if (!resume?.endress) return [];
        const mesesMap = TRIM_MESES[trimestreSelected];
        const umbralM = resume.endress['Umbral Mensual'] || 0;
        return Object.keys(mesesMap).map(mes => {
            const total = resume.endress[parseInt(mes)] || 0;
            return { mes: mesesMap[mes], total: total / 1000, totalOriginal: total, color: total >= umbralM ? '#4f46e5' : '#f59e0b' };
        });
    }, [resume, trimestreSelected]);

    const gaugeInfo = useMemo(() => {
        if (!resume?.endress) return { value: 0, max: 0 };
        return { value: (resume.endress['Total'] || 0) / 1000, max: (resume.endress['Umbral Trimestral'] || 0) / 1000 };
    }, [resume]);

    const totalAmount = useMemo(() =>
        resume?.productos?.reduce((s, p) => s + (p['Total'] || 0), 0) || 0,
    [resume]);

    const esUNAU = tipoVista === 'UNAU';

    const gridColor    = useMemo(() => isDark ? '#2e3248' : '#e1e4ea', [isDark]);
    const axisColor    = useMemo(() => isDark ? '#5a6070' : '#7a818f', [isDark]);
    const tooltipStyle = useMemo(() => ({
        backgroundColor: isDark ? '#15181f' : '#fff',
        border: `1px solid ${isDark ? '#2e3248' : '#e1e4ea'}`,
        borderRadius: 10,
        fontSize: 12,
        color: isDark ? '#dde2e9' : '#242832',
    }), [isDark]);

    if (loading) return <div className="flex justify-center items-center h-60"><Spinner size={40} /></div>;

    return (
        <>
        <div className="p-4 md:p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-5 pb-4 border-b border-n-150">
                <div>
                    <h1 className="text-[17px] font-[700] text-n-900">{user.esLider ? 'Dashboard de Equipo' : 'Mi Dashboard'}</h1>
                    <p className="text-[12.5px] text-n-500 mt-0.5">{user.esLider ? `Visualizando: ${userSelected}` : `Bienvenido, ${user.nombre}`}</p>
                </div>
                <div className="flex flex-wrap gap-2 shrink-0">
                    <Button variant="primary" icon={downloading ? () => <Loader2 size={14} className="animate-spin" /> : Download}
                        onClick={handleDownloadUserReport} disabled={downloading || !userSelected}>
                        {downloading ? 'Descargando...' : 'Exportar Reporte'}
                    </Button>
                    {!user.esLider && (
                        <>
                            <Button variant="ghost" icon={LogOut} onClick={() => { logout(); navigate('/login'); }}>
                                Cerrar Sesión
                            </Button>
                            <IconButton icon={isDark ? Sun : Moon} onClick={toggleTheme} title={isDark ? 'Modo claro' : 'Modo oscuro'} />
                        </>
                    )}
                </div>
            </div>

            {/* Filters row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                {[
                    { label: 'Vendedor', el: (
                        <Select
                            value={userSelected}
                            onChange={setUserSelected}
                            disabled={!user.esLider || usuarios.length === 0}
                            options={usuarios.map(u => ({ value: u.nombre, label: u.unidad_negocio && u.unidad_negocio !== 'N/A' ? `${u.nombre} (${u.unidad_negocio})` : u.nombre }))}
                        />
                    )},
                    { label: 'Trimestre', el: (
                        <Select value={trimestreSelected} onChange={setTrimestreSelected}
                            options={[{value:'1',label:'Q1 (Ene-Mar)'},{value:'2',label:'Q2 (Abr-Jun)'},{value:'3',label:'Q3 (Jul-Sep)'},{value:'4',label:'Q4 (Oct-Dic)'}]}
                        />
                    )},
                    { label: 'Año', el: (
                        <Select value={selectedYear} onChange={v => setSelectedYear(Number(v))}
                            options={availableYears.map(y => ({ value: y, label: String(y) }))}
                        />
                    )},
                ].map(f => (
                    <div key={f.label} className="card p-3">
                        <label className="block text-[11px] font-[600] text-n-500 uppercase tracking-[0.06em] mb-1.5">{f.label}</label>
                        {f.el}
                    </div>
                ))}
            </div>

            {error && <Alert severity="error" className="mb-4">{error}</Alert>}

            {/* Content wrapper with refresh overlay */}
            <div className="relative">
                {refreshing && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-n-0/60 rounded-[10px]" style={{ backdropFilter: 'blur(2px)' }}>
                        <Spinner size={32} />
                    </div>
                )}

            {/* Main grid */}
            <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-5">
                {/* Left: summary */}
                <div className="card p-4">
                    <div className="text-[12.5px] font-[700] text-brand-700 mb-3">Todos los Productos</div>
                    <div className="mono tnum text-[26px] font-[700] text-n-900 leading-[1]">{totalAmount.toLocaleString('es-PE',{minimumFractionDigits:2})}</div>
                    <div className="text-[11.5px] text-n-500 mt-1">Total Q{trimestreSelected} {selectedYear}</div>

                    {resume?.productos?.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-n-100">
                            <div className="text-[11.5px] font-[600] text-brand-700 mb-2">Top Productos</div>
                            {resume.productos.slice(0,5).map((p, i) => {
                                const total = p['Total'] || 0;
                                const neg   = total < 0;
                                return (
                                    <div key={i} className="mb-2.5">
                                        <div className="text-[11px] text-n-500 truncate mb-0.5">{i+1}. {p['Producto']}{neg && ' ⚠️'}</div>
                                        <div className={`mono tnum text-[13px] font-[600] ${neg ? 'text-red-600' : 'text-n-900'}`}>
                                            {total.toLocaleString('es-PE',{minimumFractionDigits:2})}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {comisiones && (
                        <div className="mt-4 pt-3 border-t border-n-100">
                            <div className="text-[11.5px] font-[600] text-brand-700 mb-2">Comisiones Q{trimestreSelected} {selectedYear}</div>
                            <div className="p-2.5 rounded-[8px] bg-brand-50 border border-brand-100">
                                <div className="text-[11px] text-brand-600 mb-0.5">Comisión Total</div>
                                <div className="mono tnum text-[18px] font-[700] text-brand-700">{comisiones.comision_total.toLocaleString('es-PE',{minimumFractionDigits:2})}</div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right: chart */}
                <div className="card p-4">
                    <div className="text-[13px] font-[700] text-n-900 mb-4">Ventas por Producto y Mes (en miles) — {selectedYear}</div>
                    {productoMesData.length > 0 && productosPositivos.length > 0 ? (
                        <ResponsiveContainer width="100%" height={340} debounce={100}>
                            <BarChart data={productoMesData}>
                                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                                <XAxis dataKey="mes" stroke={axisColor} axisLine={false} tickLine={false} style={{fontSize:11}} />
                                <YAxis stroke={axisColor} axisLine={false} tickLine={false} style={{fontSize:11}} label={{value:'Total (miles)',angle:-90,position:'insideLeft',style:{fontSize:10,fill:'#7a818f'}}} />
                                <Tooltip contentStyle={tooltipStyle} formatter={v => `${(v*1000).toLocaleString('es-PE',{minimumFractionDigits:2})}`} />
                                <Legend />
                                {productosPositivos.map((p, i) => (
                                    <Bar key={i} dataKey={p['Producto']} stackId="a" fill={CHART_COLORS[i % CHART_COLORS.length]} />
                                ))}
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-[340px] text-n-500 text-[13px]">No hay datos disponibles</div>
                    )}
                </div>
            </div>

            {/* Endress section */}
            {esUNAU && resume?.endress && (
                <div className="card p-5 mt-5">
                    <div className="text-[14px] font-[700] text-brand-700 mb-5">Análisis de Umbrales Endress — {selectedYear}</div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {/* Metrics */}
                        <div>
                            <div className="text-[11.5px] text-n-500 mb-1">Total Endress</div>
                            <div className="mono tnum text-[24px] font-[700] text-n-900 mb-4">{(resume.endress['Total']||0).toLocaleString('es-PE',{minimumFractionDigits:2})}</div>
                            <div className="mb-2">
                                <div className="text-[11px] text-n-500 mb-0.5">Umbral Mensual</div>
                                <div className="font-[600] text-n-800 mono tnum">{resume.endress['Umbral Mensual']?.toLocaleString('es-PE',{minimumFractionDigits:2})}</div>
                            </div>
                            <div className="mb-4">
                                <div className="text-[11px] text-n-500 mb-0.5">Umbral Trimestral</div>
                                <div className="font-[600] text-n-800 mono tnum">{resume.endress['Umbral Trimestral']?.toLocaleString('es-PE',{minimumFractionDigits:2})}</div>
                            </div>
                            <div className={`p-2.5 rounded-[8px] text-center font-[600] text-[12.5px] ${resume.endress['Paso'] ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                                {resume.endress['Paso'] ? '✓ Umbral Alcanzado' : '✗ Umbral No Alcanzado'}
                            </div>
                        </div>

                        {/* Bar chart */}
                        <div>
                            <div className="text-[12.5px] font-[600] text-n-900 mb-3">Endress por Mes (en miles)</div>
                            {monthlyData.length > 0 ? (
                                <>
                                    <ResponsiveContainer width="100%" height={220} debounce={100}>
                                        <BarChart data={monthlyData} barSize={50}>
                                            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                                            <XAxis dataKey="mes" stroke={axisColor} axisLine={false} tickLine={false} style={{fontSize:11}} />
                                            <YAxis stroke={axisColor} axisLine={false} tickLine={false} style={{fontSize:11}} />
                                            <Tooltip contentStyle={tooltipStyle} formatter={(v,n,p) => [`${p.payload.totalOriginal.toLocaleString('es-PE',{minimumFractionDigits:2})}`,'Total']} />
                                            {resume.endress['Umbral Mensual'] && <ReferenceLine y={resume.endress['Umbral Mensual']/1000} stroke="#ef4444" strokeDasharray="8 4" strokeWidth={2} label={{value:'Umbral',position:'right',fill:'#ef4444',fontSize:10,fontWeight:600}} />}
                                            {resume.endress['Umbral Meta'] && <ReferenceLine y={resume.endress['Umbral Meta']/1000} stroke="#4f46e5" strokeDasharray="8 4" strokeWidth={2} label={{value:'Meta',position:'right',fill:'#4f46e5',fontSize:10,fontWeight:600}} />}
                                            <Bar dataKey="total" radius={[4,4,0,0]}>
                                                {monthlyData.map((e,i) => <Cell key={i} fill={e.color} />)}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                    <div className="flex justify-center gap-4 mt-2 text-[11px] text-n-500">
                                        <span className="flex items-center gap-1"><span className="w-4 h-0.5 bg-red-500 inline-block" style={{borderTop:'2px dashed #ef4444'}} />Umbral: {(resume.endress['Umbral Mensual']/1000).toFixed(1)}k</span>
                                        <span className="flex items-center gap-1"><span className="w-4 h-0.5 bg-brand-500 inline-block" style={{borderTop:'2px dashed #4f46e5'}} />Meta: {(resume.endress['Umbral Meta']/1000).toFixed(1)}k</span>
                                    </div>
                                </>
                            ) : <div className="flex items-center justify-center h-[220px] text-n-500">Sin datos</div>}
                        </div>

                        {/* Gauge */}
                        <div>
                            <div className="text-[12.5px] font-[600] text-n-900 mb-3">Progreso vs Umbral Trimestral</div>
                            <CustomGauge value={gaugeInfo.value} max={gaugeInfo.max} />
                        </div>
                    </div>
                </div>
            )}
            </div>{/* end content wrapper */}
        </div>

        {/* Download dialog */}
        <DownloadSuccessDialog
            open={downloadDialog.open}
            onClose={() => setDownloadDialog({open:false,filename:'',savedPath:''})}
            filename={downloadDialog.filename}
            savedPath={downloadDialog.savedPath}
            subtitle={`Reporte de ${userSelected}`}
            onOpenFile={async () => { try { await openPath(downloadDialog.savedPath); } catch(e){console.error(e);} }}
            onShowInFolder={async () => { try { await revealItemInDir(downloadDialog.savedPath); } catch(e){console.error(e);} }}
        />
        </>
    );
};

export default UserDashboard;
