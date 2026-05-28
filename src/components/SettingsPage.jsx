import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Plus, Edit2, Trash2, RefreshCw, Users, FileText, Database } from 'lucide-react';
import { Button, IconButton, Input, Select, Modal, Alert, Badge, Spinner, Tabs, EmptyState } from './ui';
import { FacturasViewer } from './FacturasViewer';
import { UpdateData } from './UpdateData';
import { URI_API } from '../config/api';

const API_URL = URI_API;
const UNIDADES_NEGOCIO = ['-', 'UNAU', 'UNAI', 'UNVA'];
const UNColors = { 'UNAU': 'brand', 'UNAI': 'teal', 'UNVA': 'amber', '-': 'default' };

const formatCurrency = (v) =>
    new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'USD' }).format(v ?? 0);

/* ── Pagination helpers ─────────────────────────────────── */
function Pagination({ page, rowsPerPage, total, onPage, onRowsPerPage }) {
    const totalPages = Math.ceil(total / rowsPerPage);
    return (
        <div className="flex items-center justify-between px-4 py-2 border-t border-n-150 text-[12px] text-n-600">
            <div className="flex items-center gap-2">
                <span>Filas:</span>
                <Select
                    value={rowsPerPage}
                    onChange={v => onRowsPerPage(Number(v))}
                    options={[5, 10, 15, 25, 50].map(v => ({ value: v, label: String(v) }))}
                    size="sm"
                    className="w-[72px]"
                />
            </div>
            <div className="flex items-center gap-3">
                <span>{page * rowsPerPage + 1}–{Math.min((page + 1) * rowsPerPage, total)} de {total}</span>
                <div className="flex gap-1">
                    <Button variant="ghost" size="sm" disabled={page === 0} onClick={() => onPage(page - 1)}>‹</Button>
                    <Button variant="ghost" size="sm" disabled={page >= totalPages - 1} onClick={() => onPage(page + 1)}>›</Button>
                </div>
            </div>
        </div>
    );
}

export const SettingsPage = () => {
    const [vendedores, setVendedores]     = useState([]);
    const [loading, setLoading]           = useState(true);
    const [openDialog, setOpenDialog]     = useState(false);
    const [editingVendedor, setEditingVendedor] = useState(null);
    const [isSaving, setIsSaving]         = useState(false);
    const [formData, setFormData]         = useState({ nombre: '', meta_mensual: '', porcentaje_umbral: 80, unidad_negocio: 'UNAU' });
    const [toast, setToast]               = useState(null);
    const [recalculando, setRecalculando] = useState(false);
    const [tabValue, setTabValue]         = useState('vendedores');
    const [page, setPage]                 = useState(0);
    const [rowsPerPage, setRowsPerPage]   = useState(15);
    const [searchTerm, setSearchTerm]     = useState('');

    useEffect(() => { fetchVendedores(); }, []);

    const fetchVendedores = async () => {
        try {
            setLoading(true);
            const r = await axios.get(`${API_URL}/vendedores`);
            setVendedores(r.data);
        } catch { showToast('Error al cargar vendedores', 'error'); }
        finally { setLoading(false); }
    };

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 4000);
    };

    const handleOpenDialog = (v = null) => {
        setEditingVendedor(v);
        setFormData(v
            ? { nombre: v.nombre, meta_mensual: v.meta_mensual, porcentaje_umbral: v.porcentaje_umbral, unidad_negocio: v.unidad_negocio }
            : { nombre: '', meta_mensual: '', porcentaje_umbral: 80, unidad_negocio: 'UNAU' }
        );
        setOpenDialog(true);
    };

    const handleSave = async () => {
        try {
            setIsSaving(true);
            if (editingVendedor) {
                await axios.put(`${API_URL}/vendedores/${editingVendedor.id}`, {
                    meta_mensual: parseFloat(formData.meta_mensual),
                    porcentaje_umbral: parseFloat(formData.porcentaje_umbral),
                    unidad_negocio: formData.unidad_negocio,
                });
                showToast('Vendedor actualizado');
            } else {
                await axios.post(`${API_URL}/vendedores`, {
                    nombre: formData.nombre,
                    meta_mensual: parseFloat(formData.meta_mensual),
                    porcentaje_umbral: parseFloat(formData.porcentaje_umbral),
                    unidad_negocio: formData.unidad_negocio,
                });
                showToast('Vendedor creado');
            }
            setOpenDialog(false);
            fetchVendedores();
        } catch (err) {
            showToast(err.response?.data?.detail || 'Error al guardar', 'error');
        } finally { setIsSaving(false); }
    };

    const handleDelete = async (id, nombre) => {
        if (!window.confirm(`¿Eliminar a ${nombre}?`)) return;
        try {
            await axios.delete(`${API_URL}/vendedores/${id}`);
            showToast('Vendedor eliminado');
            fetchVendedores();
        } catch { showToast('Error al eliminar', 'error'); }
    };

    const handleRecalcular = async () => {
        if (!window.confirm('¿Recalcular todas las comisiones?')) return;
        try {
            setRecalculando(true);
            await axios.post(`${API_URL}/recalcular-comisiones`);
            showToast('Comisiones recalculadas');
        } catch { showToast('Error al recalcular', 'error'); }
        finally { setRecalculando(false); }
    };

    const filtered   = vendedores.filter(v => v.nombre.toLowerCase().includes(searchTerm.toLowerCase()));
    const paginated  = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
    const umbralM    = formData.meta_mensual && formData.porcentaje_umbral
        ? (formData.meta_mensual * formData.porcentaje_umbral / 100) : null;

    const TABS = [
        { value: 'vendedores', label: 'Vendedores',    icon: Users },
        { value: 'facturas',   label: 'Facturas',      icon: FileText },
        { value: 'carga',      label: 'Carga de Datos', icon: Database },
    ];

    return (
        <div className="p-4 md:p-6">
            {/* Page header */}
            <div className="mb-5">
                <h1 className="text-[17px] font-[700] text-n-900 tracking-[-0.014em]">Configuración</h1>
                <p className="text-[12.5px] text-n-500 mt-0.5">Gestiona vendedores, facturas y carga de datos.</p>
            </div>

            {/* Toast */}
            {toast && (
                <Alert severity={toast.type === 'error' ? 'error' : 'success'} onClose={() => setToast(null)} className="mb-4">
                    {toast.msg}
                </Alert>
            )}

            {/* Card */}
            <div className="card overflow-hidden">
                <Tabs tabs={TABS} value={tabValue} onChange={v => { setTabValue(v); setPage(0); }} />

                {/* ── Tab: Vendedores ─────────────────────────── */}
                {tabValue === 'vendedores' && (
                    <div className="p-5">
                        {/* Toolbar */}
                        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                            <Input
                                icon={Search}
                                value={searchTerm}
                                onChange={v => { setSearchTerm(v); setPage(0); }}
                                placeholder="Buscar vendedor..."
                                className="w-full sm:w-[260px]"
                            />
                            <div className="flex gap-2 flex-wrap">
                                <Button variant="secondary" icon={recalculando ? () => <Spinner size={13} /> : RefreshCw} onClick={handleRecalcular} disabled={recalculando}>
                                    {recalculando ? 'Recalculando...' : 'Recalcular'}
                                </Button>
                                <Button variant="primary" icon={Plus} onClick={() => handleOpenDialog()}>Nuevo Vendedor</Button>
                            </div>
                        </div>

                        {loading ? (
                            <div className="flex justify-center py-12"><Spinner size={32} /></div>
                        ) : (
                            <div className="border border-n-150 rounded-[8px] overflow-hidden">
                                <div className="overflow-x-auto">
                                <table className="w-full text-[12.5px] min-w-[680px]">
                                    <thead>
                                        <tr className="bg-n-50 border-b border-n-150">
                                            {['Vendedor','Meta Mensual','% Umbral','Umbral Mensual','Umbral Trimestral','Unidad Neg.',''].map(h => (
                                                <th key={h} className="px-3 py-2.5 text-left font-[700] text-n-600 whitespace-nowrap">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginated.length === 0 ? (
                                            <tr><td colSpan={7}>
                                                <EmptyState icon={Users} title="Sin vendedores" description={searchTerm ? 'No se encontraron resultados' : 'Agrega el primer vendedor'} />
                                            </td></tr>
                                        ) : paginated.map(v => (
                                            <tr key={v.id} className="border-b border-n-100 hover:bg-n-50 transition-colors">
                                                <td className="px-3 py-2.5 font-[600] text-n-900">{v.nombre}</td>
                                                <td className="px-3 py-2.5 mono tnum text-n-700">{formatCurrency(v.meta_mensual)}</td>
                                                <td className="px-3 py-2.5">
                                                    <Badge color="brand">{v.porcentaje_umbral}%</Badge>
                                                </td>
                                                <td className="px-3 py-2.5 mono tnum text-n-500">{formatCurrency(v.umbral_mensual)}</td>
                                                <td className="px-3 py-2.5 mono tnum text-n-500">{formatCurrency(v.umbral_trimestral)}</td>
                                                <td className="px-3 py-2.5">
                                                    <Badge color={UNColors[v.unidad_negocio] || 'default'}>{v.unidad_negocio}</Badge>
                                                </td>
                                                <td className="px-3 py-2.5">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <IconButton icon={Edit2} size={26} onClick={() => handleOpenDialog(v)} title="Editar" />
                                                        <IconButton icon={Trash2} size={26} onClick={() => handleDelete(v.id, v.nombre)} title="Eliminar" danger />
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                </div>
                                <Pagination page={page} rowsPerPage={rowsPerPage} total={filtered.length} onPage={setPage} onRowsPerPage={v => { setRowsPerPage(v); setPage(0); }} />
                            </div>
                        )}
                    </div>
                )}

                {/* ── Tab: Facturas ─────────────────────────── */}
                {tabValue === 'facturas' && (
                    <div className="p-5"><FacturasViewer /></div>
                )}

                {/* ── Tab: Carga ───────────────────────────── */}
                {tabValue === 'carga' && (
                    <div className="p-5"><UpdateData /></div>
                )}
            </div>

            {/* ── Modal: Add/Edit Vendedor ─────────────────── */}
            <Modal
                open={openDialog}
                onClose={() => setOpenDialog(false)}
                title={editingVendedor ? 'Editar Vendedor' : 'Nuevo Vendedor'}
                width={440}
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setOpenDialog(false)}>Cancelar</Button>
                        <Button
                            variant="primary"
                            onClick={handleSave}
                            disabled={!formData.nombre || !formData.meta_mensual || !formData.porcentaje_umbral || isSaving}
                        >
                            {isSaving ? 'Guardando...' : (editingVendedor ? 'Actualizar' : 'Crear')}
                        </Button>
                    </>
                }
            >
                <div className="flex flex-col gap-3.5">
                    {/* Nombre */}
                    <div>
                        <label className="block text-[11.5px] font-[600] text-n-600 mb-1">Nombre Completo</label>
                        <Input
                            value={formData.nombre}
                            onChange={v => setFormData(f => ({ ...f, nombre: v }))}
                            placeholder="Nombre del vendedor"
                            disabled={!!editingVendedor}
                        />
                    </div>
                    {/* Meta */}
                    <div>
                        <label className="block text-[11.5px] font-[600] text-n-600 mb-1">Meta Mensual (USD)</label>
                        <div className="ring-focus flex items-center bg-n-0 border border-n-200 rounded-[6px] h-[32px] px-[10px] transition-all">
                            <span className="text-n-500 text-[12.5px] mr-2">$</span>
                            <input
                                type="number"
                                value={formData.meta_mensual}
                                onChange={e => setFormData(f => ({ ...f, meta_mensual: e.target.value }))}
                                className="flex-1 bg-transparent border-none outline-none text-[13px] text-n-900"
                            />
                        </div>
                    </div>
                    {/* Umbral */}
                    <div>
                        <label className="block text-[11.5px] font-[600] text-n-600 mb-1">Porcentaje Umbral</label>
                        <div className="ring-focus flex items-center bg-n-0 border border-n-200 rounded-[6px] h-[32px] px-[10px] transition-all">
                            <input
                                type="number"
                                value={formData.porcentaje_umbral}
                                onChange={e => setFormData(f => ({ ...f, porcentaje_umbral: e.target.value }))}
                                className="flex-1 bg-transparent border-none outline-none text-[13px] text-n-900"
                            />
                            <span className="text-n-500 text-[12.5px] ml-2">%</span>
                        </div>
                    </div>
                    {/* Unidad */}
                    <div>
                        <label className="block text-[11.5px] font-[600] text-n-600 mb-1">Unidad de Negocio</label>
                        <Select
                            value={formData.unidad_negocio}
                            onChange={v => setFormData(f => ({ ...f, unidad_negocio: v }))}
                            options={UNIDADES_NEGOCIO.map(u => ({ value: u, label: u }))}
                        />
                    </div>
                    {/* Calculated preview */}
                    {umbralM && (
                        <div className="bg-brand-50 border border-brand-100 rounded-[8px] p-3 text-[12px]">
                            <div className="font-[600] text-brand-800 mb-1">Umbrales calculados</div>
                            <div className="text-brand-700">• Mensual: {formatCurrency(umbralM)}</div>
                            <div className="text-brand-700">• Trimestral: {formatCurrency(umbralM * 3)}</div>
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    );
};
