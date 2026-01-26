import { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    TextField,
    InputAdornment,
    Chip,
    CircularProgress,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    Grid,
    IconButton,
    Tooltip,
    Stack,
    Collapse
} from '@mui/material';
import {
    Search as SearchIcon,
    Clear as ClearIcon,
    Refresh as RefreshIcon,
    Edit as EditIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import axios from 'axios';
import { EditFacturaDialog } from './EditFacturaDialog';

import { URI_API } from '../config/api';
const API_URL = URI_API;

export const FacturasViewer = () => {
    const [facturas, setFacturas] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [total, setTotal] = useState(0);
    const [expandedRows, setExpandedRows] = useState(new Set());

    // Filtros
    const [searchTerm, setSearchTerm] = useState('');
    const [filterProducto, setFilterProducto] = useState('');
    const [filterResponsable, setFilterResponsable] = useState('');
    const [filterMes, setFilterMes] = useState('');
    const [filterAnio, setFilterAnio] = useState('');

    // Opciones para filtros
    const [productos, setProductos] = useState([]);
    const [responsables, setResponsables] = useState([]);
    const [anios, setAnios] = useState([]);

    // Modal de edición
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [selectedFacturaId, setSelectedFacturaId] = useState(null);

    useEffect(() => {
        fetchFiltros();
    }, []);

    useEffect(() => {
        fetchFacturas();
    }, [page, rowsPerPage, searchTerm, filterProducto, filterResponsable, filterMes, filterAnio]);

    const fetchFiltros = async () => {
        try {
            const response = await axios.get(`${API_URL}/invoices/filtros`);
            setProductos(response.data.productos || []);
            setResponsables(response.data.responsables || []);
            setAnios(response.data.anios || []);
        } catch (error) {
            console.error('Error al cargar filtros:', error);
        }
    };

    const fetchFacturas = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                skip: (page * rowsPerPage).toString(),
                limit: rowsPerPage.toString()
            });
            if (searchTerm) params.append('search', searchTerm);
            if (filterProducto) params.append('producto', filterProducto);
            if (filterResponsable) params.append('responsable', filterResponsable);
            if (filterMes) params.append('mes', filterMes);
            if (filterAnio) params.append('anio', filterAnio);

            const response = await axios.get(`${API_URL}/invoices?${params}`);
            setFacturas(response.data.facturas || []);
            setTotal(response.data.total || 0);
        } catch (error) {
            console.error('Error al cargar facturas:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleEditFactura = (facturaId) => {
        setSelectedFacturaId(facturaId);
        setEditDialogOpen(true);
    };

    const handleCloseEditDialog = () => {
        setEditDialogOpen(false);
        setSelectedFacturaId(null);
    };

    const handleSaveFactura = () => {
        fetchFacturas();
    };

    const toggleRowExpanded = (facturaId) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(facturaId)) {
            newExpanded.delete(facturaId);
        } else {
            newExpanded.add(facturaId);
        }
        setExpandedRows(newExpanded);
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('es-PE', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(value || 0);
    };

    const getMesNombre = (mes) => {
        const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        return meses[mes - 1] || mes;
    };

    // Función para obtener responsables de una factura (soporta ambos formatos)
    const getResponsables = (factura) => {
        // Formato nuevo: array de responsables
        if (factura.responsables && Array.isArray(factura.responsables)) {
            return factura.responsables;
        }

        // Formato antiguo: responsable_1 y responsable_2
        const responsables = [];
        if (factura.responsable_1) {
            responsables.push({
                nombre: factura.responsable_1,
                porcentaje: factura.porcentaje_1 || 0.7,
                comision: factura.comision_1 || 0
            });
        }
        if (factura.responsable_2) {
            responsables.push({
                nombre: factura.responsable_2,
                porcentaje: factura.porcentaje_2 || 0.3,
                comision: factura.comision_2 || 0
            });
        }
        return responsables;
    };

    // Función para calcular comisión total
    const getComisionTotal = (factura) => {
        if (factura.comision_total !== undefined) {
            return factura.comision_total;
        }
        // Fallback al formato antiguo
        return (factura.comision_1 || 0) + (factura.comision_2 || 0);
    };

    return (
        <Box>
            <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 3
            }}>
            </Box>

            <Paper sx={{ p: 2.5, mb: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <TextField
                            placeholder="Buscar por empresa, vendedor, deal, producto..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setPage(0);
                            }}
                            size="small"
                            fullWidth
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon fontSize="small" />
                                    </InputAdornment>
                                )
                            }}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                        <FormControl size="small" fullWidth>
                            <InputLabel>Producto</InputLabel>
                            <Select
                                value={filterProducto}
                                label="Producto"
                                onChange={(e) => {
                                    setFilterProducto(e.target.value);
                                    setPage(0);
                                }}
                            >
                                <MenuItem value="">Todos</MenuItem>
                                {productos.map(prod => (
                                    <MenuItem key={prod} value={prod}>{prod}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                        <FormControl size="small" fullWidth>
                            <InputLabel>Vendedor</InputLabel>
                            <Select
                                value={filterResponsable}
                                label="Vendedor"
                                onChange={(e) => {
                                    setFilterResponsable(e.target.value);
                                    setPage(0);
                                }}
                            >
                                <MenuItem value="">Todos</MenuItem>
                                {responsables.map(resp => (
                                    <MenuItem key={resp} value={resp}>{resp}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                        <FormControl size="small" fullWidth>
                            <InputLabel>Mes</InputLabel>
                            <Select
                                value={filterMes}
                                label="Mes"
                                onChange={(e) => {
                                    setFilterMes(e.target.value);
                                    setPage(0);
                                }}
                            >
                                <MenuItem value="">Todos</MenuItem>
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(mes => (
                                    <MenuItem key={mes} value={mes}>{getMesNombre(mes)}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                        <FormControl size="small" fullWidth>
                            <InputLabel>Año</InputLabel>
                            <Select
                                value={filterAnio}
                                label="Año"
                                onChange={(e) => {
                                    setFilterAnio(e.target.value);
                                    setPage(0);
                                }}
                            >
                                <MenuItem value="">Todos</MenuItem>
                                {anios.map(anio => (
                                    <MenuItem key={anio} value={anio}>{anio}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>
            </Paper>

            {/* Tabla */}
            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                    <CircularProgress size={60} />
                </Box>
            ) : (
                <TableContainer
                    component={Paper}
                    elevation={0}
                    sx={{
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        position: 'relative',
                        minHeight: 400
                    }}
                >
                    <Table size="small" stickyHeader>
                        <TableHead>
                            <TableRow>
                                <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.75rem', bgcolor: 'grey.50', width: 50 }}></TableCell>
                                <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.75rem', bgcolor: 'grey.50' }}>Mes/Año</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.75rem', bgcolor: 'grey.50' }}>Cotización</TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', bgcolor: 'grey.50' }}>Empresa</TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', bgcolor: 'grey.50' }}>Producto</TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', bgcolor: 'grey.50' }}>Responsables</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.75rem', bgcolor: 'grey.50' }}>Monto Total</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.75rem', bgcolor: 'grey.50' }}>Actualizado</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.75rem', bgcolor: 'grey.50' }}>Comisión Total</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.75rem', bgcolor: 'grey.50' }}>Comisiona</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.75rem', bgcolor: 'grey.50' }}>Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {facturas.length === 0 && !loading ? (
                                <TableRow>
                                    <TableCell colSpan={11} align="center" sx={{ py: 4 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            No se encontraron facturas
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                facturas.map((factura, index) => {
                                    const responsables = getResponsables(factura);
                                    const isExpanded = expandedRows.has(factura._id);
                                    const comisionTotal = getComisionTotal(factura);

                                    return (
                                        <>
                                            <TableRow
                                                key={factura._id || index}
                                                sx={{ '&:hover': { bgcolor: 'action.hover' } }}
                                            >
                                                {/* Botón expandir/contraer */}
                                                <TableCell align="center">
                                                    {responsables.length > 1 && (
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => toggleRowExpanded(factura._id)}
                                                        >
                                                            {isExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                                                        </IconButton>
                                                    )}
                                                </TableCell>

                                                <TableCell align="center">
                                                    <Typography variant="body2" fontSize="0.8rem">
                                                        {factura.mes}
                                                    </Typography>
                                                </TableCell>

                                                <TableCell align="center">
                                                    <Typography variant="body2" fontSize="0.8rem">
                                                        {factura.cotizacion_num}
                                                    </Typography>
                                                </TableCell>

                                                <TableCell sx={{ maxWidth: 200 }}>
                                                    <Typography variant="body2" fontSize="0.8rem" fontWeight={500} noWrap title={factura.nombre_empresa}>
                                                        {factura.nombre_empresa || 'N/A'}
                                                    </Typography>
                                                </TableCell>

                                                <TableCell>
                                                    <Chip
                                                        label={factura.producto || 'N/A'}
                                                        size="small"
                                                        sx={{
                                                            fontSize: '0.7rem',
                                                            height: 22,
                                                            bgcolor: factura.producto === 'Endress' ? 'primary.50' : 'grey.100',
                                                            color: factura.producto === 'Endress' ? 'primary.700' : 'text.secondary'
                                                        }}
                                                    />
                                                </TableCell>

                                                {/* Columna de Responsables */}
                                                <TableCell>
                                                    {responsables.length > 0 ? (
                                                        <Stack direction="column" spacing={0.5}>
                                                            {/* Mostrar solo el primero en la fila principal */}
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                                <Typography variant="body2" fontSize="0.8rem" fontWeight={500} noWrap>
                                                                    {responsables[0].nombre}
                                                                </Typography>
                                                                <Chip
                                                                    label={`${(responsables[0].porcentaje * 100).toFixed(0)}%`}
                                                                    size="small"
                                                                    sx={{
                                                                        fontSize: '0.65rem',
                                                                        height: 18,
                                                                        bgcolor: 'primary.50',
                                                                        color: 'primary.700'
                                                                    }}
                                                                />
                                                            </Box>
                                                            {/* Indicador de más responsables */}
                                                            {responsables.length > 1 && !isExpanded && (
                                                                <Typography variant="caption" fontSize="0.7rem" color="text.secondary">
                                                                    +{responsables.length - 1} más
                                                                </Typography>
                                                            )}
                                                        </Stack>
                                                    ) : (
                                                        <Typography variant="body2" fontSize="0.8rem" color="text.secondary">
                                                            N/A
                                                        </Typography>
                                                    )}
                                                </TableCell>

                                                <TableCell align="right">
                                                    <Typography variant="body2" fontSize="0.8rem" fontWeight={600}>
                                                        {formatCurrency(factura.monto_total)}
                                                    </Typography>
                                                </TableCell>

                                                <TableCell align="right">
                                                    <Typography variant="body2" fontSize="0.8rem" fontWeight={600}>
                                                        {formatCurrency(factura.monto_actualizado)}
                                                    </Typography>
                                                </TableCell>

                                                <TableCell align="right">
                                                    <Typography variant="body2" fontSize="0.8rem" color="success.main" fontWeight={600}>
                                                        {formatCurrency(comisionTotal)}
                                                    </Typography>
                                                </TableCell>

                                                <TableCell align="center">
                                                    <Chip
                                                        label={factura.comisiona ? 'Sí' : 'No'}
                                                        size="small"
                                                        color={factura.comisiona ? 'success' : 'default'}
                                                        sx={{
                                                            fontSize: '0.7rem',
                                                            height: 22,
                                                            minWidth: 40
                                                        }}
                                                    />
                                                </TableCell>

                                                <TableCell align="center">
                                                    <Tooltip title="Editar comisiones">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleEditFactura(factura._id)}
                                                            sx={{
                                                                color: 'primary.main',
                                                                '&:hover': { bgcolor: 'primary.50' }
                                                            }}
                                                        >
                                                            <EditIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                </TableCell>
                                            </TableRow>

                                            {/* Fila expandida con detalles de todos los responsables */}
                                            {responsables.length > 1 && (
                                                <TableRow>
                                                    <TableCell
                                                        colSpan={11}
                                                        sx={{
                                                            py: 0,
                                                            borderBottom: isExpanded ? '1px solid' : 'none',
                                                            borderColor: 'divider'
                                                        }}
                                                    >
                                                        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                                                            <Box sx={{ py: 2, px: 3, bgcolor: 'grey.50' }}>
                                                                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>
                                                                    Distribución de Comisiones:
                                                                </Typography>
                                                                <Stack spacing={1.5}>
                                                                    {responsables.map((resp, idx) => (
                                                                        <Paper
                                                                            key={idx}
                                                                            sx={{
                                                                                p: 1.5,
                                                                                display: 'flex',
                                                                                justifyContent: 'space-between',
                                                                                alignItems: 'center',
                                                                                bgcolor: 'white'
                                                                            }}
                                                                        >
                                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                                <Typography
                                                                                    variant="body2"
                                                                                    fontWeight={600}
                                                                                    color={idx === 0 ? 'primary.main' : 'text.primary'}
                                                                                >
                                                                                    {idx === 0 ? '👤 ' : '👥 '}
                                                                                    {resp.nombre}
                                                                                </Typography>
                                                                                <Chip
                                                                                    label={`${(resp.porcentaje * 100).toFixed(1)}%`}
                                                                                    size="small"
                                                                                    sx={{
                                                                                        fontSize: '0.7rem',
                                                                                        height: 20,
                                                                                        bgcolor: idx === 0 ? 'primary.50' : 'secondary.50',
                                                                                        color: idx === 0 ? 'primary.700' : 'secondary.700'
                                                                                    }}
                                                                                />
                                                                            </Box>
                                                                            <Typography
                                                                                variant="body2"
                                                                                fontWeight={700}
                                                                                color="success.main"
                                                                            >
                                                                                {formatCurrency(resp.comision)}
                                                                            </Typography>
                                                                        </Paper>
                                                                    ))}
                                                                </Stack>
                                                            </Box>
                                                        </Collapse>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                    <TablePagination
                        component="div"
                        count={total}
                        page={page}
                        onPageChange={handleChangePage}
                        rowsPerPage={rowsPerPage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                        rowsPerPageOptions={[10, 25, 50, 100]}
                        labelRowsPerPage="Filas por página:"
                        labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
                    />
                </TableContainer>
            )}

            <EditFacturaDialog
                open={editDialogOpen}
                onClose={handleCloseEditDialog}
                facturaId={selectedFacturaId}
                onSave={handleSaveFactura}
            />
        </Box>
    );
};