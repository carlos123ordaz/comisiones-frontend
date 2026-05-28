import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, Save } from 'lucide-react';
import { Modal, Button, IconButton, Alert, Select, Spinner } from './ui';
import { URI_API } from '../config/api';

const API_URL = URI_API;
const fmtCurrency = v => new Intl.NumberFormat('es-PE',{style:'currency',currency:'USD',minimumFractionDigits:2}).format(v||0);

export const EditFacturaDialog = ({ open, onClose, facturaId, onSave }) => {
    const [loading, setLoading]           = useState(false);
    const [saving, setSaving]             = useState(false);
    const [error, setError]               = useState(null);
    const [factura, setFactura]           = useState(null);
    const [listaResponsables, setListaR]  = useState([]);
    const [montoTotal, setMontoTotal]     = useState(0);
    const [montoActualizado, setMontoAct] = useState(0);
    const [utilidad, setUtilidad]         = useState(0);
    const [responsables, setResponsables] = useState([{ nombre:'', porcentaje:100, comision:0 }]);

    useEffect(() => { if (open && facturaId) { cargarFactura(); cargarResponsables(); } }, [open, facturaId]);

    useEffect(() => {
        setMontoAct(utilidad < 0.22 ? montoTotal * utilidad / 0.22 : montoTotal);
    }, [montoTotal, utilidad]);

    useEffect(() => {
        const base = montoActualizado * 0.01;
        setResponsables(rs => rs.map(r => ({ ...r, comision: base * (r.porcentaje / 100) })));
    }, [montoActualizado]);

    const cargarResponsables = async () => {
        try { const r = await axios.get(`${API_URL}/usuarios`); setListaR(r.data||[]); } catch(e){console.error(e);}
    };

    const cargarFactura = async () => {
        try {
            setLoading(true); setError(null);
            const r = await axios.get(`${API_URL}/invoice/${facturaId}`);
            const d = r.data;
            setFactura(d); setUtilidad(d.utilidad_bruta); setMontoTotal(d.monto_total);
            if (d.responsables?.length > 0) {
                setResponsables(d.responsables.map(r => ({ nombre: r.nombre, porcentaje: r.porcentaje*100, comision: r.comision||0 })));
            } else {
                const legacy = [];
                if (d.responsable_1) legacy.push({ nombre: d.responsable_1, porcentaje: (d.porcentaje_1||0.7)*100, comision: d.comision_1||0 });
                if (d.responsable_2) legacy.push({ nombre: d.responsable_2, porcentaje: (d.porcentaje_2||0.3)*100, comision: d.comision_2||0 });
                setResponsables(legacy.length > 0 ? legacy : [{ nombre:'', porcentaje:100, comision:0 }]);
            }
        } catch(e) { setError(e.response?.data?.detail||'Error al cargar'); }
        finally { setLoading(false); }
    };

    const addResp    = () => setResponsables(rs => [...rs, { nombre:'', porcentaje:50, comision:0 }]);
    const removeResp = i  => responsables.length > 1 && setResponsables(rs => rs.filter((_,x) => x!==i));
    const updateResp = (i, field, val) => {
        setResponsables(rs => {
            const next = [...rs]; next[i] = { ...next[i], [field]: val };
            if (field === 'porcentaje') next[i].comision = montoActualizado * 0.01 * (val/100);
            return next;
        });
    };

    const pctTotal   = responsables.reduce((s, r) => s + (parseFloat(r.porcentaje)||0), 0);
    const comTotal   = responsables.reduce((s, r) => s + (r.comision||0), 0);
    const comBase    = montoActualizado * 0.01;
    const pctReal    = comBase > 0 ? (comTotal/comBase)*100 : 0;

    const validate = () => {
        if (montoTotal < 0 || montoActualizado < 0) return 'Los montos no pueden ser negativos';
        if (!responsables.length) return 'Debe haber al menos un responsable';
        for (let i=0; i<responsables.length; i++) {
            const r = responsables[i];
            if (!r.nombre?.trim()) return `Responsable ${i+1} sin nombre`;
            if (r.porcentaje < 0)  return `Porcentaje ${i+1} negativo`;
            if (r.porcentaje > 200) return `Porcentaje ${i+1} supera 200%`;
        }
        const nombres = responsables.map(r => r.nombre);
        if (new Set(nombres).size !== nombres.length) return 'Hay responsables duplicados';
        return null;
    };

    const handleGuardar = async () => {
        const err = validate();
        if (err) { setError(err); return; }
        try {
            setSaving(true); setError(null);
            await axios.put(`${API_URL}/invoice/${facturaId}`, {
                monto_total: montoTotal,
                responsables: responsables.map(r => ({ nombre: r.nombre, porcentaje: r.porcentaje/100, comision: r.comision })),
            });
            onSave && onSave();
            onClose();
        } catch(e) { setError(e.response?.data?.detail||'Error al guardar'); }
        finally { setSaving(false); }
    };

    if (!factura && !loading) return null;

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Editar Factura"
            width={560}
            footer={
                <>
                    <Button variant="ghost" onClick={onClose}>Cancelar</Button>
                    <Button variant="primary" icon={Save} onClick={handleGuardar} disabled={saving||loading}>
                        {saving ? 'Guardando...' : 'Guardar Cambios'}
                    </Button>
                </>
            }
        >
            {loading ? (
                <div className="flex justify-center py-8"><Spinner size={28}/></div>
            ) : factura ? (
                <div className="flex flex-col gap-4">
                    {error && <Alert severity="error" onClose={()=>setError(null)}>{error}</Alert>}

                    {/* Info factura */}
                    <div className="bg-n-50 border border-n-150 rounded-[8px] p-3 grid grid-cols-2 gap-2 text-[12px]">
                        {[['Empresa', factura.nombre_empresa], ['Producto', factura.producto], ['Fecha', factura.fecha], ['Mes', factura.mes]].map(([k,v]) => (
                            <div key={k}><div className="text-n-500 mb-0.5">{k}</div><div className="font-[600] text-n-900">{v||'N/A'}</div></div>
                        ))}
                    </div>

                    {/* Monto */}
                    <div>
                        <label className="block text-[11.5px] font-[600] text-n-600 mb-1">Monto Total</label>
                        <div className="ring-focus flex items-center bg-n-0 border border-n-200 rounded-[6px] h-[32px] px-[10px] transition-all w-1/2">
                            <span className="text-n-500 text-[12.5px] mr-1.5">$</span>
                            <input type="number" value={montoTotal} onChange={e=>setMontoTotal(parseFloat(e.target.value)||0)}
                                className="flex-1 bg-transparent border-none outline-none text-[13px] text-n-900" />
                        </div>
                    </div>

                    {/* Comisión base */}
                    <div className="bg-brand-50 border border-brand-100 rounded-[8px] p-3">
                        <div className="text-[11.5px] font-[600] text-brand-700 mb-0.5">Comisión base (1% del monto actualizado)</div>
                        <div className="mono tnum text-[18px] font-[700] text-brand-800">{fmtCurrency(comBase)}</div>
                    </div>

                    {/* Info aviso */}
                    <Alert severity="info">
                        Los porcentajes son <strong>independientes</strong> y se calculan sobre el 1% base. Pueden sumar más de 100%.
                    </Alert>

                    {/* Responsables */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <div className="text-[13px] font-[700] text-n-900">Responsables y Comisiones</div>
                            <Button variant="ghost" size="sm" icon={Plus} onClick={addResp}>Agregar</Button>
                        </div>

                        <div className="flex flex-col gap-2">
                            {responsables.map((r, i) => (
                                <div key={i} className="border border-n-150 rounded-[8px] p-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className={`text-[12px] font-[600] ${i===0?'text-brand-700':'text-teal-600'}`}>
                                            {i===0 ? 'Responsable Principal' : `Responsable ${i+1}`}
                                        </span>
                                        {responsables.length > 1 && <IconButton icon={Trash2} size={24} danger onClick={()=>removeResp(i)} title="Eliminar" />}
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="block text-[11px] text-n-500 mb-1">Nombre</label>
                                            <Select
                                                value={r.nombre}
                                                onChange={v=>updateResp(i,'nombre',v)}
                                                placeholder="Seleccionar..."
                                                options={listaResponsables.map(lr => ({
                                                    value: lr.nombre,
                                                    label: lr.nombre,
                                                    disabled: responsables.some((rr,x) => x!==i && rr.nombre===lr.nombre)
                                                }))}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] text-n-500 mb-1">% del 1% base</label>
                                            <div className="ring-focus flex items-center bg-n-0 border border-n-200 rounded-[6px] h-[32px] px-[10px] transition-all">
                                                <input type="number" min={0} max={200} step={0.1} value={r.porcentaje}
                                                    onChange={e=>updateResp(i,'porcentaje',parseFloat(e.target.value)||0)}
                                                    className="flex-1 bg-transparent border-none outline-none text-[13px] text-n-900" />
                                                <span className="text-n-500 ml-1">%</span>
                                            </div>
                                            <div className="text-[10.5px] text-n-400 mt-0.5">Puede superar 100%</div>
                                        </div>
                                        <div className="col-span-2 bg-teal-50 border border-teal-100 rounded-[6px] p-2">
                                            <div className="text-[11px] text-teal-600">Comisión calculada ({r.porcentaje}% de {fmtCurrency(comBase)})</div>
                                            <div className="mono tnum text-[15px] font-[700] text-teal-700">{fmtCurrency(r.comision)}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Summary */}
                    <Alert severity={pctTotal<=100?'info':'warning'}>
                        <div><strong>Suma de porcentajes:</strong> {pctTotal.toFixed(1)}%</div>
                        <div><strong>Porcentaje real del monto:</strong> {pctReal.toFixed(2)}%{pctReal>1&&' (Supera el 1% base) ⚠️'}</div>
                    </Alert>

                    <div className="bg-brand-50 border border-brand-100 rounded-[8px] p-3 grid grid-cols-2 gap-2">
                        <div>
                            <div className="text-[11px] text-n-500 mb-0.5">Comisión base (1%)</div>
                            <div className="mono tnum text-[15px] font-[600] text-n-600">{fmtCurrency(comBase)}</div>
                        </div>
                        <div>
                            <div className="text-[11px] font-[700] text-brand-700 mb-0.5">Comisión Total a Pagar</div>
                            <div className="mono tnum text-[18px] font-[700] text-brand-800">{fmtCurrency(comTotal)}</div>
                        </div>
                        {comTotal > comBase && (
                            <div className="col-span-2">
                                <Alert severity="warning">La comisión total ({fmtCurrency(comTotal)}) supera el 1% base ({fmtCurrency(comBase)})</Alert>
                            </div>
                        )}
                    </div>
                </div>
            ) : null}
        </Modal>
    );
};
