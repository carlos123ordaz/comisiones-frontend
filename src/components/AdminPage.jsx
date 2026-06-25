import { useMemo, useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { invoke } from '@tauri-apps/api/core';
import { save } from '@tauri-apps/plugin-dialog';
import { writeFile } from '@tauri-apps/plugin-fs';
import { openPath, revealItemInDir } from '@tauri-apps/plugin-opener';
import axios from 'axios';
import moment from 'moment';
import { URI_API } from '../config/api';
import { Button, IconButton, Spinner, DownloadSuccessDialog, Alert } from './ui';
import { useTheme } from '../contexts/ThemeContext';
import {
    Settings, LayoutDashboard, Users, LogOut,
    Download, ChevronLeft, ChevronRight, Layers, Menu, X, Moon, Sun, RefreshCw
} from 'lucide-react';

const NAV = [
    { label: 'Configuración', icon: Settings,       path: '/'        },
    { label: 'General',       icon: LayoutDashboard, path: '/general' },
    { label: 'Por Usuario',   icon: Users,           path: '/user'    },
];

export const AdminPage = () => {
    const navigate  = useNavigate();
    const location  = useLocation();
    const { user, logout } = useAuth();
    const [collapsed, setCollapsed]     = useState(false);
    const [mobileOpen, setMobileOpen]   = useState(false);
    const [isMobile, setIsMobile]       = useState(false);

    const { isDark, toggleTheme } = useTheme();
    const [downloading, setDownloading] = useState(false);
    const [downloadDialog, setDownloadDialog] = useState({ open: false, filename: '', savedPath: '' });
    const [syncing, setSyncing]     = useState(false);
    const [syncMsg, setSyncMsg]     = useState({ type: '', text: '' });

    // Responsive sidebar: overlay on mobile, auto-collapse at medium widths
    useEffect(() => {
        const onResize = () => {
            const w = window.innerWidth;
            if (w < 768) {
                setIsMobile(true);
                setMobileOpen(false);
            } else {
                setIsMobile(false);
                if (w < 1100) setCollapsed(true);
            }
        };
        onResize();
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    const selectedIndex = useMemo(
        () => NAV.findIndex(item => item.path === location.pathname),
        [location.pathname]
    );

    const handleLogout = () => { logout(); navigate('/login'); };

    const handleSyncBitrix = async () => {
        setSyncing(true);
        setSyncMsg({ type: 'info', text: 'Consultando base de datos local...' });
        try {
            let dbData = null;
            try {
                dbData = await invoke('query_database');
                setSyncMsg({ type: 'info', text: `Obteniendo invoices de Bitrix24...` });
            } catch {
                setSyncMsg({ type: 'info', text: 'Obteniendo invoices de Bitrix24...' });
            }
            const fd = new FormData();
            if (dbData) fd.append('ventas_data', JSON.stringify(dbData));
            const r = await axios.post(`${URI_API}/invoices/sync-bitrix`, fd, {
                headers: { 'Content-Type': 'multipart/form-data' },
                timeout: 120000,
            });
            setSyncMsg({ type: 'success', text: r.data.message || 'Sincronización exitosa' });
        } catch (e) {
            setSyncMsg({ type: 'error', text: e.response?.data?.detail || e.message || 'Error al sincronizar' });
        } finally {
            setSyncing(false);
            setTimeout(() => setSyncMsg({ type: '', text: '' }), 5000);
        }
    };

    const handleNavigate = (path) => {
        navigate(path);
        setMobileOpen(false); // close drawer after navigation on mobile
    };

    const handleDownloadReport = async () => {
        setDownloading(true);
        try {
            const response = await axios.get(`${URI_API}/invoices/export_report`, {
                responseType: 'blob',
                headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache', Expires: '0' },
            });
            const timestamp = moment().format('YYYYMMDD_HHmmss');
            const fileName  = `reporte_invoices_${timestamp}.xlsx`;
            const arrayBuffer = await response.data.arrayBuffer();
            const filePath = await save({ defaultPath: fileName, filters: [{ name: 'Excel', extensions: ['xlsx'] }] });
            if (filePath) {
                await writeFile(filePath, new Uint8Array(arrayBuffer));
                setDownloadDialog({ open: true, filename: fileName, savedPath: filePath });
            }
        } catch (error) {
            console.error('Error al descargar reporte:', error);
            alert(`Error al descargar: ${error.message}`);
        } finally {
            setDownloading(false);
        }
    };

    // On mobile the sidebar is always "expanded" (232px) but shown as overlay
    const isCollapsed = !isMobile && collapsed;
    const W = isCollapsed ? 64 : 232;

    const sidebarStyle = isMobile
        ? {
            position: 'fixed',
            top: 0, left: 0,
            height: '100%',
            width: 232,
            transform: mobileOpen ? 'translateX(0)' : 'translateX(-240px)',
            transition: 'transform .25s cubic-bezier(.4,0,.2,1)',
            zIndex: 20,
          }
        : {
            width: W,
            flexShrink: 0,
            transition: 'width .25s cubic-bezier(.4,0,.2,1)',
          };

    return (
        <div className="flex h-screen bg-n-50 overflow-hidden">
            {/* Mobile backdrop */}
            {isMobile && mobileOpen && (
                <div
                    className="fixed inset-0 z-[19] bg-[rgba(10,12,20,0.35)]"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* ── Sidebar ── */}
            <aside style={sidebarStyle} className="flex flex-col border-r border-n-150 bg-n-25">
                {/* Header */}
                <div
                    style={{ height: 56 }}
                    className={`flex items-center border-b border-n-150 ${isCollapsed ? 'justify-center px-0' : 'justify-between px-4'}`}
                >
                    {!isCollapsed ? (
                        <div className="flex items-center gap-[9px]">
                            <span className="w-6 h-6 rounded-[6px] bg-gradient-to-br from-brand-500 to-brand-700 inline-flex items-center justify-center text-white shadow-[0_1px_2px_rgba(79,70,229,0.3)]">
                                <Layers size={13} />
                            </span>
                            <span className="text-[13px] font-[600] text-n-900 tracking-[-0.012em]">Comisiones</span>
                        </div>
                    ) : (
                        <span className="w-[26px] h-[26px] rounded-[7px] bg-gradient-to-br from-brand-500 to-brand-700 inline-flex items-center justify-center text-white">
                            <Layers size={14} />
                        </span>
                    )}
                    {isMobile && (
                        <IconButton icon={X} onClick={() => setMobileOpen(false)} title="Cerrar menú" />
                    )}
                </div>

                {/* User info */}
                {!isCollapsed && user && (
                    <div className="px-4 pt-3 pb-2">
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-[11px] font-[700] shrink-0">
                                {user.nombre?.charAt(0)?.toUpperCase()}
                            </div>
                            <div className="min-w-0">
                                <div className="text-[12px] font-[600] text-n-900 truncate">{user.nombre}</div>
                                <div className="text-[11px] text-n-500">Administrador</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Download button */}
                <div className={`px-2 pt-2 pb-1 ${isCollapsed ? 'flex justify-center' : ''}`}>
                    {isCollapsed ? (
                        <IconButton
                            icon={downloading ? () => <Spinner size={16} /> : Download}
                            onClick={handleDownloadReport}
                            disabled={downloading}
                            title="Descargar Reporte"
                        />
                    ) : (
                        <Button
                            variant="primary"
                            size="sm"
                            icon={downloading ? () => <Spinner size={13} className="text-white" /> : Download}
                            onClick={handleDownloadReport}
                            disabled={downloading}
                            className="w-full justify-center"
                        >
                            {downloading ? 'Descargando...' : 'Descargar Reporte'}
                        </Button>
                    )}
                </div>

                {/* Separator */}
                <div className="mx-3 my-1 border-t border-n-150" />

                {/* Nav */}
                <nav className={`flex-1 flex flex-col gap-[1px] overflow-auto py-2 ${isCollapsed ? 'px-2' : 'px-3'}`}>
                    {!isCollapsed && (
                        <div className="text-[10.5px] text-n-500 uppercase tracking-[0.08em] font-[600] px-[10px] py-[6px] mb-[2px]">
                            Menú
                        </div>
                    )}
                    {NAV.map((item, index) => {
                        const active = selectedIndex === index;
                        return (
                            <div
                                key={item.path}
                                onClick={() => handleNavigate(item.path)}
                                title={item.label}
                                className={`relative flex items-center gap-[10px] h-8 rounded-[7px] cursor-pointer text-[12.5px] tracking-[-0.005em] transition-all duration-150 select-none
                                    ${isCollapsed ? 'justify-center px-0' : 'px-[10px]'}
                                    ${active ? 'bg-brand-50 text-brand-700 font-[600]' : 'text-n-700 font-[500] hover:bg-n-100 hover:text-n-900'}`}
                            >
                                {active && !isCollapsed && (
                                    <span className="absolute left-[-8px] top-[6px] bottom-[6px] w-[2px] bg-brand-600 rounded-[2px]" />
                                )}
                                <item.icon size={16} />
                                {!isCollapsed && <span>{item.label}</span>}
                            </div>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div className={`border-t border-n-150 flex flex-col gap-1 py-3 ${isCollapsed ? 'px-2 items-center' : 'px-3'}`}>
                    {isCollapsed ? (
                        <IconButton icon={LogOut} onClick={handleLogout} title="Cerrar Sesión" danger />
                    ) : (
                        <div
                            onClick={handleLogout}
                            className="flex items-center gap-[10px] h-8 px-[10px] rounded-[7px] cursor-pointer text-[12.5px] font-[500] text-n-700 hover:bg-red-50 hover:text-red-600 transition-all duration-150"
                        >
                            <LogOut size={16} />
                            <span>Cerrar Sesión</span>
                        </div>
                    )}

                    {/* Theme toggle */}
                    {isCollapsed ? (
                        <IconButton icon={isDark ? Sun : Moon} onClick={toggleTheme} title={isDark ? 'Modo claro' : 'Modo oscuro'} />
                    ) : (
                        <div
                            onClick={toggleTheme}
                            className="flex items-center gap-[10px] h-8 px-[10px] rounded-[7px] cursor-pointer text-[12.5px] font-[500] text-n-700 hover:bg-n-100 hover:text-n-900 transition-all duration-150"
                        >
                            {isDark ? <Sun size={16} /> : <Moon size={16} />}
                            <span>{isDark ? 'Modo Claro' : 'Modo Oscuro'}</span>
                        </div>
                    )}

                    {/* Collapse toggle — desktop only */}
                    {!isMobile && (
                        <button
                            onClick={() => setCollapsed(c => !c)}
                            title={isCollapsed ? 'Expandir' : 'Colapsar'}
                            className={`flex items-center gap-[10px] h-[30px] rounded-[7px] text-n-500 text-[11.5px] font-[500] hover:bg-n-100 hover:text-n-800 transition-all duration-150 cursor-pointer
                                ${isCollapsed ? 'justify-center w-full px-0' : 'px-[10px]'}`}
                        >
                            {isCollapsed ? <ChevronRight size={14} /> : <><ChevronLeft size={14} /><span>Colapsar</span></>}
                        </button>
                    )}

                    {!isCollapsed && (
                        <div className="text-[11px] text-n-400 text-center mt-1">v1.0.0 · 2026</div>
                    )}
                </div>
            </aside>

            {/* ── Main content ── */}
            <div className="flex-1 flex flex-col overflow-hidden min-w-0">
                {/* Header bar */}
                <header style={{ height: 56 }} className="flex items-center justify-between px-4 sm:px-5 border-b border-n-150 bg-n-0 shrink-0 gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                        {isMobile && (
                            <IconButton icon={Menu} onClick={() => setMobileOpen(true)} title="Abrir menú" />
                        )}
                        <h1 className="text-[15px] font-[700] text-n-900 tracking-[-0.014em] truncate">
                            {NAV[selectedIndex]?.label ?? 'Panel'}
                        </h1>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        {user && !isCollapsed && !isMobile && (
                            <span className="text-[12px] text-n-500 truncate max-w-[160px]">
                                {user.nombre}
                            </span>
                        )}
                        <Button
                            variant="secondary"
                            size="sm"
                            icon={syncing ? () => <Spinner size={13} /> : RefreshCw}
                            onClick={handleSyncBitrix}
                            disabled={syncing}
                            title="Obtener invoices desde Bitrix24 y actualizar datos"
                        >
                            {syncing ? 'Actualizando...' : 'Actualizar Datos'}
                        </Button>
                    </div>
                </header>

                {syncMsg.text && (
                    <div className="px-4 sm:px-5 pt-3">
                        <Alert severity={syncMsg.type || 'info'} onClose={() => setSyncMsg({ type: '', text: '' })}>
                            {syncMsg.text}
                        </Alert>
                    </div>
                )}

                <main className="flex-1 overflow-auto">
                    <div style={{ animation: 'fadeIn 0.2s ease' }}>
                        <Outlet />
                    </div>
                </main>
            </div>

            {/* Download Dialog */}
            <DownloadSuccessDialog
                open={downloadDialog.open}
                onClose={() => setDownloadDialog({ open: false, filename: '', savedPath: '' })}
                filename={downloadDialog.filename}
                savedPath={downloadDialog.savedPath}
                onOpenFile={async () => { try { await openPath(downloadDialog.savedPath); } catch (e) { console.error(e); } }}
                onShowInFolder={async () => { try { await revealItemInDir(downloadDialog.savedPath); } catch (e) { console.error(e); } }}
            />
        </div>
    );
};
