import { useState, useEffect } from 'react';
import { Search, ChevronDown, ChevronUp, Edit2 } from 'lucide-react';
import axios from 'axios';
import { Input, Select, Badge, IconButton, Spinner, EmptyState } from './ui';
import { EditFacturaDialog } from './EditFacturaDialog';
import { URI_API } from '../config/api';
import { FileText } from 'lucide-react';

const API_URL = URI_API;
const MESES   = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

const fmtCurrency = v => new Intl.NumberFormat('es-PE',{style:'currency',currency:'USD',minimumFractionDigits:2}).format(v||0);

function Pagination({ page, rowsPerPage, total, onPage, onRowsPerPage }) {
    const totalPages = Math.ceil(total / rowsPerPage);
    return (
        <div className="flex items-center justify-between px-4 py-2 border-t border-n-150 text-[12px] text-n-600">
            <div className="flex items-center gap-2">
                <span>Filas:</span>
                <Select value={rowsPerPage} onChange={v => onRowsPerPage(Number(v))} options={[10,15,25,50,100].map(v=>({value:v,label:String(v)}))} size="sm" className="w-[72px]" />
            </div>
            <div className="flex items-center gap-3">
                <span>{page*rowsPerPage+1}–{Math.min((page+1)*rowsPerPage,total)} de {total}</span>
                <div className="flex gap-1">
                    <button className="h-6 w-6 flex items-center justify-center rounded hover:bg-n-100 disabled:opacity-40" disabled={page===0} onClick={()=>onPage(page-1)}>‹</button>
                    <button className="h-6 w-6 flex items-center justify-center rounded hover:bg-n-100 disabled:opacity-40" disabled={page>=totalPages-1} onClick={()=>onPage(page+1)}>›</button>
                </div>
            </div>
        </div>
    );
}

export const FacturasViewer = () => {
    const [facturas, setFacturas]             = useState([]);
    const [loading, setLoading]               = useState(false);
    const [page, setPage]                     = useState(0);
    const [rowsPerPage, setRowsPerPage]       = useState(15);
    const [total, setTotal]                   = useState(0);
    const [expandedRows, setExpandedRows]     = useState(new Set());
    const [searchTerm, setSearchTerm]         = useState('');
    const [filterProducto, setFilterProducto] = useState('');
    const [filterResponsable, setFilterResponsable] = useState('');
    const [filterMes, setFilterMes]           = useState('');
    const [filterAnio, setFilterAnio]         = useState('');
    const [productos, setProductos]           = useState([]);
    const [responsables, setResponsables]     = useState([]);
    const [anios, setAnios]                   = useState([]);
    const [editOpen, setEditOpen]             = useState(false);
    const [selectedId, setSelectedId]         = useState(null);

    useEffect(() => { fetchFiltros(); }, []);
    useEffect(() => { fetchFacturas(); }, [page, rowsPerPage, searchTerm, filterProducto, filterResponsable, filterMes, filterAnio]);

    const fetchFiltros = async () => {
        try {
            const r = await axios.get(`${API_URL}/invoices/filtros`);
            setProductos(r.data.productos || []);
            setResponsables(r.data.responsables || []);
            setAnios(r.data.anios || []);
        } catch (e) { console.error(e); }
    };

    const fetchFacturas = async () => {
        try {
            setLoading(true);
            const p = new URLSearchParams({ skip: (page*rowsPerPage).toString(), limit: rowsPerPage.toString() });
            if (searchTerm)        p.append('search', searchTerm);
            if (filterProducto)    p.append('producto', filterProducto);
            if (filterResponsable) p.append('responsable', filterResponsable);
            if (filterMes)         p.append('mes', filterMes);
            if (filterAnio)        p.append('anio', filterAnio);
            const r = await axios.get(`${API_URL}/invoices?${p}`);
            setFacturas(r.data.facturas || []);
            setTotal(r.data.total || 0);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const getResponsables = f => {
        if (f.responsables && Array.isArray(f.responsables)) return f.responsables;
        const list = [];
        if (f.responsable_1) list.push({ nombre: f.responsable_1, porcentaje: f.porcentaje_1||0.7, comision: f.comision_1||0 });
        if (f.responsable_2) list.push({ nombre: f.responsable_2, porcentaje: f.porcentaje_2||0.3, comision: f.comision_2||0 });
        return list;
    };

    const getComisionTotal = f => f.comision_total !== undefined ? f.comision_total : (f.comision_1||0)+(f.comision_2||0);

    const toggleRow = id => {
        const next = new Set(expandedRows);
        next.has(id) ? next.delete(id) : next.add(id);
        setExpandedRows(next);
    };

    return (
        <div>
            {/* Filters */}
            <div className="border border-n-150 rounded-[8px] p-3 mb-4">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    <div className="col-span-2 md:col-span-2">
                        <Input icon={Search} value={searchTerm} onChange={v=>{setSearchTerm(v);setPage(0);}} placeholder="Buscar empresa, vendedor, deal..." />
                    </div>
                    <Select value={filterProducto} onChange={v=>{setFilterProducto(v);setPage(0);}} placeholder="Producto" options={productos.map(p=>({value:p,label:p}))} />
                    <Select value={filterResponsable} onChange={v=>{setFilterResponsable(v);setPage(0);}} placeholder="Vendedor" options={responsables.map(r=>({value:r,label:r}))} />
                    <div className="grid grid-cols-2 gap-2">
                        <Select value={filterMes} onChange={v=>{setFilterMes(v);setPage(0);}} placeholder="Mes" options={[1,2,3,4,5,6,7,8,9,10,11,12].map(m=>({value:m,label:MESES[m-1]}))} />
                        <Select value={filterAnio} onChange={v=>{setFilterAnio(v);setPage(0);}} placeholder="Año" options={anios.map(a=>({value:a,label:String(a)}))} />
                    </div>
                </div>
            </div>

            {/* Table */}
            {loading ? (
                <div className="flex justify-center py-12"><Spinner size={32} /></div>
            ) : (
                <div className="border border-n-150 rounded-[8px] overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-[12px]">
                            <thead>
                                <tr className="bg-n-50 border-b border-n-150">
                                    <th className="w-8 px-2 py-2.5" />
                                    {['Mes/Año','Cotización','Empresa','Producto','Responsables','Monto Total','Actualizado','Comisión','Comisiona',''].map(h => (
                                        <th key={h} className="px-3 py-2.5 text-left font-[700] text-n-600 whitespace-nowrap">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {facturas.length === 0 ? (
                                    <tr><td colSpan={11}><EmptyState icon={FileText} title="Sin facturas" description="No se encontraron facturas con los filtros actuales" /></td></tr>
                                ) : facturas.map((f, idx) => {
                                    const resps   = getResponsables(f);
                                    const isExp   = expandedRows.has(f._id);
                                    const comTot  = getComisionTotal(f);
                                    return (
                                        <>
                                        <tr key={f._id||idx} className="border-b border-n-100 hover:bg-n-50 transition-colors">
                                            <td className="px-2 py-2 text-center">
                                                {resps.length > 1 && (
                                                    <button onClick={() => toggleRow(f._id)} className="p-0.5 rounded hover:bg-n-100 text-n-500">
                                                        {isExp ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                                                    </button>
                                                )}
                                            </td>
                                            <td className="px-3 py-2 text-n-700 whitespace-nowrap">{MESES[(f.mes||1)-1]} {f.anio||''}</td>
                                            <td className="px-3 py-2 text-n-700">{f.cotizacion_num}</td>
                                            <td className="px-3 py-2 max-w-[180px]">
                                                <span className="font-[500] text-n-900 truncate block" title={f.nombre_empresa}>{f.nombre_empresa||'N/A'}</span>
                                            </td>
                                            <td className="px-3 py-2">
                                                <Badge color={f.producto==='Endress'?'brand':'default'} size="sm">{f.producto||'N/A'}</Badge>
                                            </td>
                                            <td className="px-3 py-2">
                                                {resps.length > 0 ? (
                                                    <div>
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="font-[500] text-n-900">{resps[0].nombre}</span>
                                                            <Badge color="teal" size="sm">{(resps[0].porcentaje*100).toFixed(0)}%</Badge>
                                                        </div>
                                                        {resps.length > 1 && !isExp && <span className="text-[11px] text-n-500">+{resps.length-1} más</span>}
                                                    </div>
                                                ) : <span className="text-n-400">N/A</span>}
                                            </td>
                                            <td className="px-3 py-2 text-right mono tnum font-[600] text-n-800">{fmtCurrency(f.monto_total)}</td>
                                            <td className="px-3 py-2 text-right mono tnum font-[600] text-n-800">{fmtCurrency(f.monto_actualizado)}</td>
                                            <td className="px-3 py-2 text-right mono tnum font-[600] text-teal-600">{fmtCurrency(comTot)}</td>
                                            <td className="px-3 py-2 text-center">
                                                <Badge color={f.comisiona?'green':'default'} size="sm">{f.comisiona?'Sí':'No'}</Badge>
                                            </td>
                                            <td className="px-3 py-2 text-center">
                                                <IconButton icon={Edit2} size={26} onClick={() => { setSelectedId(f._id); setEditOpen(true); }} title="Editar comisiones" />
                                            </td>
                                        </tr>
                                        {resps.length > 1 && isExp && (
                                            <tr key={`${f._id}-exp`} className="bg-n-50">
                                                <td colSpan={11} className="px-6 py-3">
                                                    <div className="text-[12px] font-[600] text-n-700 mb-2">Distribución de Comisiones:</div>
                                                    <div className="flex flex-col gap-2">
                                                        {resps.map((r, ri) => (
                                                            <div key={ri} className="flex items-center justify-between bg-n-0 border border-n-150 rounded-[6px] px-3 py-2">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-[600] text-n-900">{ri===0?'👤 ':'👥 '}{r.nombre}</span>
                                                                    <Badge color={ri===0?'brand':'teal'} size="sm">{(r.porcentaje*100).toFixed(1)}%</Badge>
                                                                </div>
                                                                <span className="mono tnum font-[700] text-teal-600">{fmtCurrency(r.comision)}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                        </>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    <Pagination page={page} rowsPerPage={rowsPerPage} total={total} onPage={setPage} onRowsPerPage={v=>{setRowsPerPage(v);setPage(0);}} />
                </div>
            )}

            <EditFacturaDialog open={editOpen} onClose={()=>{setEditOpen(false);setSelectedId(null);}} facturaId={selectedId} onSave={fetchFacturas} />
        </div>
    );
};
