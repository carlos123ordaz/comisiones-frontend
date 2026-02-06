import { Box, List, ListItem, ListItemButton, ListItemText, ListItemIcon, Paper, Divider, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Stack, CircularProgress } from '@mui/material'
import { Settings, Dashboard, People, Logout, Download, CheckCircle, FolderOpen, OpenInNew, Description, Close } from '@mui/icons-material';
import { useMemo, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { save } from '@tauri-apps/plugin-dialog';
import { writeFile } from '@tauri-apps/plugin-fs';
import { openPath, revealItemInDir } from '@tauri-apps/plugin-opener';
import axios from 'axios';
import moment from 'moment';
import { URI_API } from '../config/api';

export const AdminPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuth();

    // Estados para descarga
    const [downloading, setDownloading] = useState(false);
    const [downloadDialog, setDownloadDialog] = useState({
        open: false,
        filename: '',
        savedPath: '',
    });

    const menuItems = [
        { label: 'Configuración', icon: <Settings />, path: '/' },
        { label: 'General', icon: <Dashboard />, path: '/general' },
        { label: 'Por Usuario', icon: <People />, path: '/user' }
    ];

    const selectedIndex = useMemo(() => {
        return menuItems.findIndex(item => item.path === location.pathname);
    }, [location.pathname]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleDownloadReport = async () => {
        setDownloading(true);
        try {
            const response = await axios.get(`${URI_API}/invoices/export_report`, {
                responseType: 'blob',
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache',
                    'Expires': '0',
                },
            });
            console.log('Respuesta de la API:', response);
            const timestamp = moment().format('YYYYMMDD_HHmmss');
            const fileName = `reporte_invoices_${timestamp}.xlsx`;

            // Convertir blob a arrayBuffer
            const blob = response.data;
            const arrayBuffer = await blob.arrayBuffer();

            // Abrir diálogo para guardar archivo con Tauri
            const filePath = await save({
                defaultPath: fileName,
                filters: [{ name: 'Excel', extensions: ['xlsx'] }],
            });

            if (filePath) {
                // Guardar archivo usando Tauri
                await writeFile(filePath, new Uint8Array(arrayBuffer));

                // Mostrar diálogo de descarga exitosa
                setDownloadDialog({
                    open: true,
                    filename: fileName,
                    savedPath: filePath,
                });
            }
        } catch (error) {
            console.error('Error al descargar reporte:', error);
            alert(`Error al descargar: ${error.message}`);
        } finally {
            setDownloading(false);
        }
    };

    const handleCloseDownloadDialog = () => {
        setDownloadDialog({ open: false, filename: '', savedPath: '' });
    };

    const handleOpenFile = async () => {
        try {
            await openPath(downloadDialog.savedPath);
        } catch (error) {
            console.error('Error abriendo archivo:', error);
        }
    };

    const handleShowInFolder = async () => {
        try {
            await revealItemInDir(downloadDialog.savedPath);
        } catch (error) {
            console.error('Error mostrando carpeta:', error);
        }
    };

    return (
        <>
            <Box sx={{ display: 'flex', height: '100vh', bgcolor: '#f8f9fa', overflow: 'hidden' }}>
                <Paper
                    elevation={0}
                    sx={{
                        width: 280,
                        borderRight: '1px solid',
                        borderColor: 'divider',
                        bgcolor: 'white',
                        display: 'flex',
                        flexDirection: 'column',
                        position: 'sticky',
                        top: 0,
                        height: '100vh',
                        flexShrink: 0
                    }}
                >
                    {/* Logo/Header */}
                    <Box sx={{ p: 3, pb: 2 }}>
                        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                            Dashboard
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                            Panel de administración
                        </Typography>
                        {user && (
                            <Typography variant="caption" sx={{ mt: 1, display: 'block', color: '#3b82f6', fontWeight: 600 }}>
                                👤 {user.nombre}
                            </Typography>
                        )}
                    </Box>

                    <Divider />

                    {/* Botón de Descarga */}
                    <Box sx={{ px: 2, pt: 2 }}>
                        <Button
                            fullWidth
                            variant="contained"
                            startIcon={downloading ? <CircularProgress size={18} color="inherit" /> : <Download />}
                            onClick={handleDownloadReport}
                            disabled={downloading}
                            sx={{
                                borderRadius: 2,
                                textTransform: 'none',
                                fontWeight: 600,
                                py: 1.5,
                                bgcolor: '#10b981',
                                boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)',
                                '&:hover': {
                                    bgcolor: '#059669',
                                    boxShadow: '0 4px 8px rgba(16, 185, 129, 0.3)',
                                },
                                '&:disabled': {
                                    bgcolor: '#d1d5db',
                                    color: '#9ca3af',
                                }
                            }}
                        >
                            {downloading ? 'Descargando...' : 'Descargar Reporte'}
                        </Button>
                    </Box>

                    <Divider sx={{ mt: 2 }} />

                    {/* Menu Items */}
                    <List sx={{ px: 2, py: 2, flex: 1, overflow: 'auto' }}>
                        {menuItems.map((item, index) => (
                            <ListItem key={index} disablePadding sx={{ mb: 0.5 }}>
                                <ListItemButton
                                    selected={selectedIndex === index}
                                    onClick={() => navigate(item.path)}
                                    sx={{
                                        borderRadius: 2,
                                        py: 1.5,
                                        '&.Mui-selected': {
                                            background: '#667eea',
                                            color: 'white',
                                        },
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <ListItemIcon
                                        sx={{
                                            minWidth: 40,
                                            color: selectedIndex === index ? 'white' : 'text.secondary'
                                        }}
                                    >
                                        {item.icon}
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={item.label}
                                        primaryTypographyProps={{
                                            fontWeight: selectedIndex === index ? 600 : 500,
                                            fontSize: '0.95rem'
                                        }}
                                    />
                                </ListItemButton>
                            </ListItem>
                        ))}
                    </List>

                    {/* Botón de Logout */}
                    <Box sx={{ p: 2 }}>
                        <Button
                            fullWidth
                            variant="outlined"
                            startIcon={<Logout />}
                            onClick={handleLogout}
                            sx={{
                                borderRadius: 2,
                                textTransform: 'none',
                                fontWeight: 600,
                                borderColor: '#e2e8f0',
                                color: '#64748b',
                                '&:hover': {
                                    borderColor: '#ef4444',
                                    color: '#ef4444',
                                    bgcolor: '#fee2e2'
                                }
                            }}
                        >
                            Cerrar Sesión
                        </Button>
                    </Box>

                    {/* Footer */}
                    <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center' }}>
                            v1.0.0 • 2026
                        </Typography>
                    </Box>
                </Paper>

                <Box sx={{ flex: 1, overflow: 'auto', bgcolor: '#f8f9fa' }}>
                    <Box sx={{ minHeight: '100%', animation: 'fadeIn 0.3s ease-in' }}>
                        <Outlet />
                    </Box>
                </Box>
                <style>
                    {`
                        @keyframes fadeIn {
                            from {
                                opacity: 0;
                                transform: translateY(10px);
                            }
                            to {
                                opacity: 1;
                                transform: translateY(0);
                            }
                        }
                    `}
                </style>
            </Box>

            {/* Diálogo de descarga exitosa */}
            <Dialog
                open={downloadDialog.open}
                onClose={handleCloseDownloadDialog}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: '8px',
                        boxShadow: '0 16px 48px rgba(0,0,0,0.12)',
                    },
                }}
            >
                <DialogTitle
                    sx={{
                        p: 2.5,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderBottom: '1px solid #E5E7EB',
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <CheckCircle
                            sx={{
                                color: '#10b981',
                                mr: 1.5,
                                fontSize: 24,
                            }}
                        />
                        <Typography variant="h6" sx={{ fontWeight: 600, color: '#1F2937' }}>
                            Archivo guardado exitosamente
                        </Typography>
                    </Box>
                    <IconButton
                        size="small"
                        onClick={handleCloseDownloadDialog}
                        sx={{ color: '#6B7280' }}
                    >
                        <Close />
                    </IconButton>
                </DialogTitle>

                <DialogContent sx={{ p: 2.5 }}>
                    <Stack spacing={2}>
                        <Box
                            sx={{
                                p: 1.5,
                                bgcolor: '#F9FAFB',
                                border: '1px solid #E5E7EB',
                                borderRadius: '6px',
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Description
                                    sx={{
                                        fontSize: 32,
                                        color: '#10b981',
                                        mr: 1.5,
                                    }}
                                />
                                <Box sx={{ flex: 1 }}>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            fontWeight: 600,
                                            color: '#1F2937',
                                            wordBreak: 'break-all',
                                        }}
                                    >
                                        {downloadDialog.filename}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: '#6B7280' }}>
                                        Archivo Excel
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>
                        <Box>
                            <Typography
                                variant="caption"
                                sx={{
                                    color: '#6B7280',
                                    display: 'block',
                                    mb: 1,
                                    fontWeight: 500,
                                }}
                            >
                                Guardado en:
                            </Typography>
                            <Box
                                sx={{
                                    p: 1,
                                    bgcolor: '#F9FAFB',
                                    border: '1px solid #E5E7EB',
                                    borderRadius: '6px',
                                    fontFamily: 'monospace',
                                    fontSize: '12px',
                                    color: '#4B5563',
                                    wordBreak: 'break-all',
                                }}
                            >
                                {downloadDialog.savedPath}
                            </Box>
                        </Box>
                    </Stack>
                </DialogContent>

                <DialogActions
                    sx={{
                        p: 2.5,
                        borderTop: '1px solid #E5E7EB',
                        gap: 1,
                    }}
                >
                    <Button
                        variant="outlined"
                        startIcon={<FolderOpen />}
                        onClick={handleShowInFolder}
                        fullWidth
                        sx={{
                            py: 1,
                            fontWeight: 600,
                            fontSize: '14px',
                            textTransform: 'none',
                            borderColor: '#D1D5DB',
                            color: '#1F2937',
                            '&:hover': {
                                borderColor: '#9CA3AF',
                                bgcolor: '#F9FAFB',
                            },
                        }}
                    >
                        Mostrar en carpeta
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<OpenInNew />}
                        onClick={handleOpenFile}
                        fullWidth
                        sx={{
                            py: 1,
                            fontWeight: 600,
                            fontSize: '14px',
                            textTransform: 'none',
                            bgcolor: '#10b981',
                            '&:hover': {
                                bgcolor: '#059669',
                            },
                        }}
                    >
                        Abrir archivo
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    )
}