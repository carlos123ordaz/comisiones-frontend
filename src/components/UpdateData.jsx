import React, { useState, useRef } from 'react';
import axios from 'axios';
import { invoke } from '@tauri-apps/api/core';
import { UploadCloud, File, X, CheckCircle } from 'lucide-react';
import { Button, Alert, Spinner } from './ui';
import { URI_API } from '../config/api';

export const UpdateData = () => {
    const [file, setFile]           = useState(null);
    const [loading, setLoading]     = useState(false);
    const [message, setMessage]     = useState({ type:'', text:'' });
    const [isDragging, setDragging] = useState(false);
    const fileInputRef = useRef(null);

    const handleFileChange = (f) => {
        if (!f) return;
        if (!f.name.endsWith('.csv'))       { setMessage({ type:'error', text:'Selecciona un archivo CSV válido' }); return; }
        if (f.size > 25*1024*1024)          { setMessage({ type:'error', text:'El archivo excede 25 MB' }); return; }
        setFile(f); setMessage({ type:'', text:'' });
    };

    const handleDrop = (e) => { e.preventDefault(); setDragging(false); handleFileChange(e.dataTransfer.files[0]); };

    const executeReport = async () => {
        try {
            setLoading(true); setMessage({ type:'info', text:'Consultando base de datos local...' });
            let dbData = null;
            try {
                dbData = await invoke('query_database');
                setMessage({ type:'info', text:`✅ ${dbData.length} registros obtenidos. Enviando al servidor...` });
            } catch (e) {
                setMessage({ type:'warning', text:`⚠️ No se pudo consultar la BD: ${e}. Continuando con CSV...` });
            }
            const fd = new FormData();
            if (file)   fd.append('file', file);
            if (dbData) fd.append('ventas_data', JSON.stringify(dbData));
            if (!file && !dbData) { setMessage({ type:'error', text:'No hay datos disponibles' }); setLoading(false); return; }
            const r = await axios.post(`${URI_API}/invoices/execute_report`, fd, { headers:{ 'Content-Type':'multipart/form-data' } });
            setMessage({ type:'success', text: r.data.message || '✅ Reporte generado exitosamente' });
            setFile(null);
        } catch (e) {
            setMessage({ type:'error', text: e.response?.data?.detail || e.message || 'Error al actualizar' });
        } finally { setLoading(false); }
    };

    return (
        <div className="max-w-[680px] mx-auto">
            <div className="mb-5">
                <h2 className="text-[15px] font-[700] text-n-900">Actualizar Datos de Invoices</h2>
                <p className="text-[12.5px] text-n-500 mt-1">
                    Sube el reporte CSV desde Bitrix (opcional). Al iniciar el proceso, la app también consultará la base de datos local.
                </p>
            </div>

            <div className="flex flex-col gap-4">
                {/* Drop zone */}
                {!file ? (
                    <div
                        onDragOver={e=>{e.preventDefault();setDragging(true);}}
                        onDragLeave={e=>{e.preventDefault();setDragging(false);}}
                        onDrop={handleDrop}
                        className={`border-2 border-dashed rounded-[10px] p-10 text-center cursor-pointer transition-all duration-200
                            ${isDragging ? 'border-brand-400 bg-brand-50' : 'border-n-200 bg-n-25 hover:border-brand-300 hover:bg-brand-50/40'}`}
                    >
                        <UploadCloud size={44} className={`mx-auto mb-3 ${isDragging ? 'text-brand-600' : 'text-n-400'}`} />
                        <div className="text-[14px] font-[600] text-n-900 mb-1">Arrastra y suelta el archivo aquí</div>
                        <div className="text-[12.5px] text-n-500 mb-1">Tamaño máximo: 25 MB · Formato: CSV</div>
                        <div className="text-[12px] text-n-400 mb-4">Si no subes archivo, se usará la información de la BD local.</div>
                        <Button variant="secondary" disabled={loading} onClick={() => fileInputRef.current?.click()}>
                            Buscar Archivo
                        </Button>
                        <input ref={fileInputRef} type="file" className="hidden" accept=".csv" onChange={e=>handleFileChange(e.target.files[0])} />
                    </div>
                ) : (
                    /* File preview */
                    <div className="flex items-center gap-3 p-3 bg-n-50 border border-n-200 rounded-[8px]">
                        <div className="w-10 h-10 rounded-[8px] bg-brand-50 border border-brand-100 flex items-center justify-center shrink-0">
                            <File size={20} className="text-brand-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-[13px] font-[600] text-n-900 truncate">{file.name}</div>
                            <div className="text-[11.5px] text-n-500">{(file.size/1024).toFixed(2)} KB</div>
                        </div>
                        <CheckCircle size={18} className="text-green-500 shrink-0" />
                        <button onClick={()=>{setFile(null);setMessage({type:'',text:''}); }} disabled={loading}
                            className="p-1 rounded hover:bg-n-100 text-n-400 hover:text-n-700 transition-colors disabled:opacity-40">
                            <X size={15} />
                        </button>
                    </div>
                )}

                {/* Message */}
                {message.text && (
                    <Alert severity={message.type||'info'} onClose={()=>setMessage({type:'',text:''})}>
                        {message.text}
                    </Alert>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-2">
                    <Button variant="secondary" onClick={()=>{setFile(null);setMessage({type:'',text:''}); }} disabled={loading||!file}>
                        Cancelar
                    </Button>
                    <Button variant="primary" onClick={executeReport} disabled={loading}>
                        {loading ? <><Spinner size={14} className="text-white mr-1.5" />Procesando...</> : 'Actualizar Datos'}
                    </Button>
                </div>
            </div>
        </div>
    );
};
