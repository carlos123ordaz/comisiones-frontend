import React, { useEffect, useRef, useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    Grid,
    FormControl,
    Select,
    MenuItem,
    CircularProgress,
    Alert,
    Button,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Stack
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    PieChart,
    Pie,
    ReferenceLine,
    Legend
} from 'recharts';
import {
    Logout,
    Download,
    CheckCircle,
    FolderOpen,
    OpenInNew,
    Description,
    Close
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { save } from '@tauri-apps/plugin-dialog';
import { writeFile } from '@tauri-apps/plugin-fs';
import { openPath, revealItemInDir } from '@tauri-apps/plugin-opener';
import moment from 'moment';
import { URI_API } from '../config/api';
import { chartColors, colorTokens } from '../theme';

const UserDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [userSelected, setUserSelected] = useState('');
    const [trimestreSelected, setTrimestreSelected] = useState('3');
    const [selectedYear, setSelectedYear] = useState(2025);
    const [usuarios, setUsuarios] = useState([]);
    const [resume, setResume] = useState(null);
    const [tipoVista, setTipoVista] = useState('umbral');
    const [comisiones, setComisiones] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const availableYears = [2025, 2026];
    const API_BASE_URL = URI_API;
    const [downloading, setDownloading] = useState(false);
    const [downloadDialog, setDownloadDialog] = useState({
        open: false,
        filename: '',
        savedPath: '',
    });
    const hasInitialized = useRef(false);
    const skipNextReactiveFetch = useRef(false);

    const fetchData = async (selectedUserName, { silent = false } = {}) => {
        if (!selectedUserName) return;
        try {
            if (!silent) setLoading(true);
            setError(null);

            const [resumeResponse, comisionesResponse] = await Promise.all([
                axios.get(`${API_BASE_URL}/resumen/${selectedUserName}/${trimestreSelected}`, {
                    params: { anio: selectedYear }
                }),
                axios.get(`${API_BASE_URL}/comisiones/${selectedUserName}/${trimestreSelected}`, {
                    params: { anio: selectedYear }
                })
            ]);
            setTipoVista(resumeResponse.data.unidad_negocio);
            setResume({
                productos: resumeResponse.data.data_productos || [],
                endress: resumeResponse.data.data_endress || null,
                unidad_negocio: resumeResponse.data.unidad_negocio
            });
            setComisiones(comisionesResponse.data || null);

        } catch (error) {
            console.error('Error al obtener datos:', error);
            setError(error.response?.data?.detail || 'Error al cargar los datos');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!user) return;

        let cancelled = false;

        const initializeDashboard = async () => {
            try {
                setLoading(true);
                setError(null);

                let initialUsers = [];
                let initialSelectedUser = '';

                if (!user.esLider) {
                    initialUsers = [{
                        nombre: user.nombre,
                        unidad_negocio: user.unidad_negocio || 'N/A'
                    }];
                    initialSelectedUser = user.nombre;
                } else {
                    const response = await axios.get(`${API_BASE_URL}/usuarios`);
                    if (cancelled) return;
                    initialUsers = response.data;
                    initialSelectedUser = response.data[0]?.nombre || '';
                }

                if (cancelled) return;

                setUsuarios(initialUsers);
                skipNextReactiveFetch.current = true;
                setUserSelected(initialSelectedUser);

                if (!initialSelectedUser) {
                    hasInitialized.current = true;
                    setLoading(false);
                    return;
                }

                const [resumeResponse, comisionesResponse] = await Promise.all([
                    axios.get(`${API_BASE_URL}/resumen/${initialSelectedUser}/${trimestreSelected}`, {
                        params: { anio: selectedYear }
                    }),
                    axios.get(`${API_BASE_URL}/comisiones/${initialSelectedUser}/${trimestreSelected}`, {
                        params: { anio: selectedYear }
                    })
                ]);

                if (cancelled) return;

                setTipoVista(resumeResponse.data.unidad_negocio);
                setResume({
                    productos: resumeResponse.data.data_productos || [],
                    endress: resumeResponse.data.data_endress || null,
                    unidad_negocio: resumeResponse.data.unidad_negocio
                });
                setComisiones(comisionesResponse.data || null);
                hasInitialized.current = true;
            } catch (error) {
                if (cancelled) return;
                console.error('Error al inicializar dashboard de usuario:', error);
                setError(error.response?.data?.detail || 'Error al cargar los datos');
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        initializeDashboard();

        return () => {
            cancelled = true;
        };
    }, [user]);

    useEffect(() => {
        if (!hasInitialized.current || !selectedYear) return;
        if (skipNextReactiveFetch.current) {
            skipNextReactiveFetch.current = false;
            return;
        }
        fetchData(userSelected, { silent: false });
    }, [userSelected, trimestreSelected, selectedYear]);

    const handleDownloadUserReport = async () => {
        if (!userSelected) return;

        setDownloading(true);
        try {
            const response = await axios.get(
                `${API_BASE_URL}/invoices/execute_report_by_user`,
                {
                    params: { name_user: userSelected },
                    responseType: 'blob',
                    headers: {
                        'Cache-Control': 'no-cache',
                        'Pragma': 'no-cache',
                        'Expires': '0',
                    },
                }
            );

            const timestamp = moment().format('YYYYMMDD_HHmmss');
            const fileName = `reporte_${userSelected.replace(/\s+/g, '_')}_${timestamp}.xlsx`;

            const blob = response.data;
            const arrayBuffer = await blob.arrayBuffer();

            const filePath = await save({
                defaultPath: fileName,
                filters: [{ name: 'Excel', extensions: ['xlsx'] }],
            });

            if (filePath) {
                await writeFile(filePath, new Uint8Array(arrayBuffer));

                setDownloadDialog({
                    open: true,
                    filename: fileName,
                    savedPath: filePath,
                });
            }
        } catch (error) {
            console.error('Error al descargar reporte:', error);
            const errorMsg = error.response?.data?.detail || error.message || 'Error al descargar';
            alert(`Error: ${errorMsg}`);
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

    const getMonthlyData = () => {
        if (!resume || !resume.endress) return [];

        const trimestreMeses = {
            '1': { 1: 'enero', 2: 'febrero', 3: 'marzo' },
            '2': { 4: 'abril', 5: 'mayo', 6: 'junio' },
            '3': { 7: 'julio', 8: 'agosto', 9: 'septiembre' },
            '4': { 10: 'octubre', 11: 'noviembre', 12: 'diciembre' }
        };

        const mesesMap = trimestreMeses[trimestreSelected];
        const umbralMensual = resume.endress['Umbral Mensual'] || 0;

        return Object.keys(mesesMap).map(mes => {
            const mesNum = parseInt(mes);
            const total = resume.endress[mesNum] || 0;

            return {
                mes: mesesMap[mes],
                total: total / 1000,
                totalOriginal: total,
                color: total >= umbralMensual ? colorTokens.action : colorTokens.accentOrange
            };
        });
    };

    // ============================================================================
    // NUEVA FUNCIÓN: Filtrar productos positivos para gráficos
    // ============================================================================
    const getProductosPositivos = () => {
        if (!resume || !resume.productos || !Array.isArray(resume.productos)) return [];

        // Filtrar solo productos con total positivo
        return resume.productos.filter(producto => (producto['Total'] || 0) > 0);
    };

    const getProductoMesData = () => {
        // Usar productos filtrados (solo positivos) para el gráfico
        const productosPositivos = getProductosPositivos();

        if (productosPositivos.length === 0) return [];

        const trimestreMeses = {
            '1': { 1: 'enero', 2: 'febrero', 3: 'marzo' },
            '2': { 4: 'abril', 5: 'mayo', 6: 'junio' },
            '3': { 7: 'julio', 8: 'agosto', 9: 'septiembre' },
            '4': { 10: 'octubre', 11: 'noviembre', 12: 'diciembre' }
        };

        const mesesMap = trimestreMeses[trimestreSelected];
        const mesesNums = Object.keys(mesesMap).map(m => parseInt(m));

        const data = Object.values(mesesMap).map((nombreMes, idx) => {
            const mesNum = mesesNums[idx];
            const dataPoint = { mes: nombreMes };

            // Solo usar productos positivos
            productosPositivos.forEach(producto => {
                const productoNombre = producto['Producto'];
                const valorMes = producto[mesNum] || 0;
                // Solo agregar si el valor del mes también es positivo
                dataPoint[productoNombre] = valorMes > 0 ? valorMes / 1000 : 0;
            });

            return dataPoint;
        });

        return data;
    };

    const getProductoColors = () => {
        // Usar productos filtrados (solo positivos) para los colores
        const productosPositivos = getProductosPositivos();

        if (productosPositivos.length === 0) return [];

        const colors = chartColors;

        return productosPositivos.map((_, idx) => colors[idx % colors.length]);
    };

    const getGaugeData = () => {
        if (!resume || !resume.endress) return { value: 0, max: 0 };

        const value = (resume.endress['Total'] || 0) / 1000;
        const max = (resume.endress['Umbral Trimestral'] || 0) / 1000;

        return { value, max };
    };

    const CustomGauge = ({ value, max }) => {
        const percentage = max > 0 ? (value / max) * 100 : 0;
        const gaugeData = [
            { value: value, fill: percentage >= 100 ? colorTokens.accentTeal : percentage >= 80 ? colorTokens.action : colorTokens.accentOrange },
            { value: Math.max(0, max - value), fill: colorTokens.surfaceMuted }
        ];

        return (
            <Box sx={{ position: 'relative', width: '100%', height: 280, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={gaugeData}
                            cx="50%"
                            cy="70%"
                            startAngle={180}
                            endAngle={0}
                            innerRadius="70%"
                            outerRadius="90%"
                            dataKey="value"
                            stroke="none"
                        >
                            {gaugeData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>

                <Box sx={{
                    position: 'absolute',
                    bottom: '25%',
                    textAlign: 'center'
                }}>
                    <Typography variant="h3" sx={{
                        fontWeight: 700,
                        color: colorTokens.brand,
                        fontFamily: '"Satoshi", sans-serif',
                        fontSize: '3rem'
                    }}>
                        {value.toFixed(2)}
                    </Typography>
                    <Typography sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
                        mil
                    </Typography>
                </Box>

                <Typography sx={{
                    position: 'absolute',
                    bottom: '15%',
                    left: '15%',
                    color: 'text.secondary',
                    fontSize: '0.875rem'
                }}>
                    0.00
                </Typography>

                <Typography sx={{
                    position: 'absolute',
                    bottom: '15%',
                    right: '15%',
                    color: 'text.secondary',
                    fontSize: '0.875rem'
                }}>
                    {max.toFixed(2)}
                </Typography>

                <Box sx={{
                    position: 'absolute',
                    top: '10%',
                    textAlign: 'center'
                }}>
                    <Typography sx={{
                        fontSize: '1.2rem',
                        fontWeight: 600,
                        color: percentage >= 100 ? colorTokens.accentTeal : colorTokens.textSecondary
                    }}>
                        {percentage.toFixed(1)}%
                    </Typography>
                </Box>
            </Box>
        );
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                <CircularProgress size={60} />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">{error}</Alert>
            </Box>
        );
    }

    const monthlyData = getMonthlyData();
    const productoMesData = getProductoMesData();
    const productoColors = getProductoColors();
    const productosPositivos = getProductosPositivos(); // Para usar en el gráfico
    const gaugeInfo = getGaugeData();

    // Total amount usa TODOS los productos (incluyendo negativos)
    const totalAmount = resume?.productos
        ? resume.productos.reduce((sum, p) => sum + (p['Total'] || 0), 0)
        : 0;

    const esUNAU = tipoVista === 'UNAU';

    return (
        <>
            <Box sx={{
                p: { xs: 2, md: 4 },
                bgcolor: 'background.default',
                minHeight: '100vh',
            }}>
                {/* Header con botones */}
                <Box sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 3,
                    pb: 2,
                    borderBottom: '1px solid',
                    borderColor: 'divider'
                }}>
                    <Box>
                        <Typography variant="h5" sx={{ fontWeight: 700, color: colorTokens.brand }}>
                            {user.esLider ? 'Dashboard de Equipo' : 'Mi Dashboard'}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                            {user.esLider ? `Visualizando: ${userSelected}` : `Bienvenido, ${user.nombre}`}
                        </Typography>
                    </Box>

                    {
                        !user.esLider && (
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <Button
                                    variant="contained"
                                    startIcon={downloading ? <CircularProgress size={18} color="inherit" /> : <Download />}
                                    onClick={handleDownloadUserReport}
                                    disabled={downloading || !userSelected}
                                    sx={{
                                        bgcolor: colorTokens.action,
                                        '&:hover': {
                                            bgcolor: colorTokens.support,
                                        },
                                        '&:disabled': {
                                            bgcolor: alpha(colorTokens.border, 0.8),
                                            color: colorTokens.textSecondary,
                                        }
                                    }}
                                >
                                    {downloading ? 'Descargando...' : 'Exportar Reporte'}
                                </Button>

                                <Button
                                    variant="outlined"
                                    startIcon={<Logout />}
                                    onClick={handleLogout}
                                    sx={{
                                        borderColor: colorTokens.borderStrong,
                                        color: colorTokens.textPrimary,
                                        '&:hover': {
                                            borderColor: colorTokens.accentOrange,
                                            color: colorTokens.accentOrange,
                                            bgcolor: alpha(colorTokens.accentOrange, 0.08)
                                        }
                                    }}
                                >
                                    Cerrar Sesión
                                </Button>
                            </Box>
                        )
                    }
                </Box>

                {/* Header con selectores */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid size={{ xs: 12, md: 3 }}>
                        <Paper sx={{ p: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                            <Typography variant="caption" sx={{ color: '#64748b', mb: 1, display: 'block', fontWeight: 500 }}>
                                Vendedor
                            </Typography>
                            <FormControl fullWidth size="small">
                                <Select
                                    value={userSelected}
                                    onChange={(e) => setUserSelected(e.target.value)}
                                    sx={{ bgcolor: '#f8fafc' }}
                                    disabled={usuarios.length === 0 || !user.esLider}
                                >
                                    {usuarios.map((usuario) => (
                                        <MenuItem key={usuario.nombre} value={usuario.nombre}>
                                            {usuario.nombre}
                                            {usuario.unidad_negocio !== 'N/A' && (
                                                <Typography component="span" sx={{ ml: 1, color: '#64748b', fontSize: '0.75rem' }}>
                                                    ({usuario.unidad_negocio})
                                                </Typography>
                                            )}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Paper>
                    </Grid>

                    <Grid size={{ xs: 12, md: 3 }}>
                        <Paper sx={{ p: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                            <Typography variant="caption" sx={{ color: '#64748b', mb: 1, display: 'block', fontWeight: 500 }}>
                                Trimestre
                            </Typography>
                            <FormControl fullWidth size="small">
                                <Select
                                    value={trimestreSelected}
                                    onChange={(e) => setTrimestreSelected(e.target.value)}
                                    sx={{ bgcolor: '#f8fafc' }}
                                >
                                    <MenuItem value="1">Q1 (Ene-Mar)</MenuItem>
                                    <MenuItem value="2">Q2 (Abr-Jun)</MenuItem>
                                    <MenuItem value="3">Q3 (Jul-Sep)</MenuItem>
                                    <MenuItem value="4">Q4 (Oct-Dic)</MenuItem>
                                </Select>
                            </FormControl>
                        </Paper>
                    </Grid>

                    <Grid size={{ xs: 12, md: 3 }}>
                        <Paper sx={{ p: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                            <Typography variant="caption" sx={{ color: '#64748b', mb: 1, display: 'block', fontWeight: 500 }}>
                                Año
                            </Typography>
                            <FormControl fullWidth size="small">
                                <Select
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(e.target.value)}
                                    sx={{ bgcolor: '#f8fafc' }}
                                >
                                    {availableYears.map(year => (
                                        <MenuItem key={year} value={year}>{year}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Paper>
                    </Grid>
                </Grid>

                {/* Main Content Grid */}
                <Grid container spacing={3}>
                    {/* Left Section - Summary Card */}
                    <Grid size={{ xs: 12, md: 3 }}>
                        <Paper sx={{ p: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', height: '100%' }}>
                            <Typography variant="h6" sx={{
                                fontWeight: 600,
                                color: '#3b82f6',
                                mb: 3,
                                fontSize: '1.1rem'
                            }}>
                                Todos los Productos
                            </Typography>

                            <Box>
                                <Typography variant="h4" sx={{
                                    fontWeight: 700,
                                    color: '#0f172a',
                                    fontFamily: '"Satoshi", sans-serif',
                                    mb: 0.5
                                }}>
                                    {totalAmount.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.875rem' }}>
                                    Total Q{trimestreSelected} {selectedYear}
                                </Typography>
                            </Box>

                            {/* Top 5 productos - Muestra TODOS los productos (incluyendo negativos) */}
                            {resume?.productos && resume.productos.length > 0 && (
                                <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #e2e8f0' }}>
                                    <Typography variant="body2" sx={{ color: '#3b82f6', fontSize: '0.875rem', fontWeight: 600, mb: 2 }}>
                                        📦 Top Productos
                                    </Typography>
                                    {resume.productos.slice(0, 5).map((producto, idx) => {
                                        const total = producto['Total'] || 0;
                                        const esNegativo = total < 0;

                                        return (
                                            <Box key={idx} sx={{ mb: 2 }}>
                                                <Typography variant="body2" sx={{
                                                    color: '#64748b',
                                                    fontSize: '0.7rem',
                                                    mb: 0.3,
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis'
                                                }}>
                                                    {idx + 1}. {producto['Producto']}
                                                    {esNegativo && ' ⚠️'}
                                                </Typography>
                                                <Typography variant="body1" sx={{
                                                    fontWeight: 600,
                                                    color: esNegativo ? '#ef4444' : '#0f172a',
                                                    fontSize: '0.9rem'
                                                }}>
                                                    {total.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                                                </Typography>
                                            </Box>
                                        );
                                    })}
                                </Box>
                            )}

                            {/* Comisiones */}
                            {comisiones && (
                                <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #e2e8f0' }}>
                                    <Typography variant="body2" sx={{ color: '#3b82f6', fontSize: '0.875rem', fontWeight: 600, mb: 2 }}>
                                        💰 Comisiones Q{trimestreSelected} {selectedYear}
                                    </Typography>

                                    <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#f0f9ff', border: '1px solid #bae6fd' }}>
                                        <Typography variant="body2" sx={{ color: '#0369a1', fontSize: '0.7rem', mb: 0.3 }}>
                                            Comisión Total
                                        </Typography>
                                        <Typography variant="h5" sx={{ fontWeight: 700, color: '#0369a1' }}>
                                            {comisiones.comision_total.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                                        </Typography>
                                    </Box>
                                </Box>
                            )}
                        </Paper>
                    </Grid>

                    {/* Center & Right Section - Gráfico de productos por mes */}
                    <Grid size={{ xs: 12, md: 9 }}>
                        <Paper sx={{ p: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: '#0f172a', fontSize: '1rem' }}>
                                Ventas por Producto y Mes (en miles) - {selectedYear}
                            </Typography>
                            {productoMesData.length > 0 && productosPositivos.length > 0 ? (
                                <ResponsiveContainer width="100%" height={400}>
                                    <BarChart data={productoMesData}>
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            stroke="#e2e8f0"
                                            horizontal={true}
                                            vertical={false}
                                        />
                                        <XAxis
                                            dataKey="mes"
                                            stroke="#64748b"
                                            axisLine={false}
                                            tickLine={false}
                                            style={{ fontSize: '0.875rem' }}
                                        />
                                        <YAxis
                                            stroke="#64748b"
                                            axisLine={false}
                                            tickLine={false}
                                            style={{ fontSize: '0.875rem' }}
                                            label={{
                                                value: 'Total (miles)',
                                                angle: -90,
                                                position: 'insideLeft',
                                                style: { fontSize: '0.75rem', fill: '#64748b' }
                                            }}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#fff',
                                                border: '1px solid #e2e8f0',
                                                borderRadius: '8px',
                                                fontSize: '0.875rem'
                                            }}
                                            formatter={(value) => `${(value * 1000).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`}
                                        />
                                        <Legend />
                                        {/* Usar solo productos positivos en el gráfico */}
                                        {productosPositivos.map((producto, idx) => (
                                            <Bar
                                                key={idx}
                                                dataKey={producto['Producto']}
                                                stackId="a"
                                                fill={productoColors[idx]}
                                            />
                                        ))}
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
                                    <Typography color="text.secondary">No hay datos disponibles</Typography>
                                </Box>
                            )}
                        </Paper>
                    </Grid>
                </Grid>

                {/* Sección adicional de Umbrales - Solo para UNAU */}
                {esUNAU && resume?.endress && (
                    <Grid container spacing={3} sx={{ mt: 1 }}>
                        <Grid size={{ xs: 12 }}>
                            <Paper sx={{ p: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: '#3b82f6', fontSize: '1.2rem' }}>
                                    📊 Análisis de Umbrales Endress - {selectedYear}
                                </Typography>

                                <Grid container spacing={3}>
                                    {/* Métricas de Umbral */}
                                    <Grid size={{ xs: 12, md: 3 }}>
                                        <Box>
                                            <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.875rem', mb: 1 }}>
                                                Total Endress
                                            </Typography>
                                            <Typography variant="h4" sx={{ fontWeight: 700, color: '#0f172a', mb: 2 }}>
                                                {(resume.endress['Total'] || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                                            </Typography>

                                            <Box sx={{ mt: 3 }}>
                                                <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.75rem', mb: 0.5 }}>
                                                    Umbral Mensual
                                                </Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 600, color: '#0f172a' }}>
                                                    {resume.endress['Umbral Mensual']?.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                                                </Typography>
                                            </Box>

                                            <Box sx={{ mt: 2 }}>
                                                <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.75rem', mb: 0.5 }}>
                                                    Umbral Trimestral
                                                </Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 600, color: '#0f172a' }}>
                                                    {resume.endress['Umbral Trimestral']?.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                                                </Typography>
                                            </Box>

                                            <Box sx={{ mt: 3, p: 2, borderRadius: 2, bgcolor: resume.endress['Paso'] ? '#dcfce7' : '#fee2e2' }}>
                                                <Typography sx={{
                                                    color: resume.endress['Paso'] ? '#16a34a' : '#dc2626',
                                                    fontSize: '0.875rem',
                                                    fontWeight: 600,
                                                    textAlign: 'center'
                                                }}>
                                                    {resume.endress['Paso'] ? '✓ Umbral Alcanzado' : '✗ Umbral No Alcanzado'}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Grid>

                                    {/* Gráfico de barras mensuales */}
                                    <Grid size={{ xs: 12, md: 5 }}>
                                        <Typography variant="body1" sx={{ mb: 2, fontWeight: 600, color: '#0f172a', fontSize: '0.95rem' }}>
                                            Endress por Mes (en miles)
                                        </Typography>
                                        {monthlyData.length > 0 ? (
                                            <>
                                                <ResponsiveContainer width="100%" height={280}>
                                                    <BarChart data={monthlyData} barSize={60}>
                                                        <CartesianGrid
                                                            strokeDasharray="3 3"
                                                            stroke="#e2e8f0"
                                                            horizontal={true}
                                                            vertical={false}
                                                        />
                                                        <XAxis
                                                            dataKey="mes"
                                                            stroke="#64748b"
                                                            axisLine={false}
                                                            tickLine={false}
                                                            style={{ fontSize: '0.75rem' }}
                                                        />
                                                        <YAxis
                                                            stroke="#64748b"
                                                            axisLine={false}
                                                            tickLine={false}
                                                            style={{ fontSize: '0.75rem' }}
                                                        />
                                                        <Tooltip
                                                            contentStyle={{
                                                                backgroundColor: '#fff',
                                                                border: '1px solid #e2e8f0',
                                                                borderRadius: '8px',
                                                                fontSize: '0.875rem'
                                                            }}
                                                            formatter={(value, name, props) => [
                                                                `${props.payload.totalOriginal.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`,
                                                                'Total'
                                                            ]}
                                                        />

                                                        {resume.endress['Umbral Mensual'] && (
                                                            <ReferenceLine
                                                                y={resume.endress['Umbral Mensual'] / 1000}
                                                                stroke="#ef4444"
                                                                strokeDasharray="8 4"
                                                                strokeWidth={2}
                                                                label={{
                                                                    value: 'Umbral',
                                                                    position: 'right',
                                                                    fill: '#ef4444',
                                                                    fontSize: 11,
                                                                    fontWeight: 600
                                                                }}
                                                            />
                                                        )}

                                                        {resume.endress['Umbral Meta'] && (
                                                            <ReferenceLine
                                                                y={resume.endress['Umbral Meta'] / 1000}
                                                                stroke="#3b82f6"
                                                                strokeDasharray="8 4"
                                                                strokeWidth={2}
                                                                label={{
                                                                    value: 'Meta',
                                                                    position: 'right',
                                                                    fill: '#3b82f6',
                                                                    fontSize: 11,
                                                                    fontWeight: 600
                                                                }}
                                                            />
                                                        )}

                                                        <Bar
                                                            dataKey="total"
                                                            radius={[4, 4, 0, 0]}
                                                            label={{
                                                                position: 'top',
                                                                formatter: (value) => `${value.toFixed(1)}k`,
                                                                style: { fontSize: '0.75rem', fill: '#0f172a', fontWeight: 600 }
                                                            }}
                                                        >
                                                            {monthlyData.map((entry, index) => (
                                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                                            ))}
                                                        </Bar>
                                                    </BarChart>
                                                </ResponsiveContainer>

                                                <Box sx={{ mt: 1, display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                        <Box sx={{
                                                            width: 20,
                                                            height: 2,
                                                            bgcolor: '#ef4444',
                                                            borderRadius: 1,
                                                            borderStyle: 'dashed'
                                                        }} />
                                                        <Typography sx={{ fontSize: '0.7rem', color: '#64748b' }}>
                                                            Umbral: {(resume.endress['Umbral Mensual'] / 1000).toFixed(1)}k
                                                        </Typography>
                                                    </Box>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                        <Box sx={{
                                                            width: 20,
                                                            height: 2,
                                                            bgcolor: '#3b82f6',
                                                            borderRadius: 1,
                                                            borderStyle: 'dashed'
                                                        }} />
                                                        <Typography sx={{ fontSize: '0.7rem', color: '#64748b' }}>
                                                            Meta: {(resume.endress['Umbral Meta'] / 1000).toFixed(1)}k
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </>
                                        ) : (
                                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 280 }}>
                                                <Typography color="text.secondary" fontSize="0.875rem">No hay datos</Typography>
                                            </Box>
                                        )}
                                    </Grid>

                                    {/* Gauge */}
                                    <Grid size={{ xs: 12, md: 4 }}>
                                        <Typography variant="body1" sx={{ mb: 2, fontWeight: 600, color: '#0f172a', fontSize: '0.95rem' }}>
                                            Progreso vs Umbral Trimestral
                                        </Typography>
                                        <CustomGauge value={gaugeInfo.value} max={gaugeInfo.max} />
                                    </Grid>
                                </Grid>
                            </Paper>
                        </Grid>
                    </Grid>
                )}
            </Box>

            {/* Diálogo de descarga exitosa (sin cambios) */}
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
                                        Reporte de {userSelected}
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
    );
};

export default UserDashboard;
