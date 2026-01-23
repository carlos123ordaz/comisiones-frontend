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
    Tooltip
} from '@mui/material';
import {
    Search as SearchIcon,
    Clear as ClearIcon,
    Refresh as RefreshIcon,
    Edit as EditIcon
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
        // Recargar la lista de facturas
        fetchFacturas();
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
            {
                loading ?
                    (
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
                            {loading && (
                                <Box sx={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    bgcolor: 'rgba(255,255,255,0.8)',
                                    zIndex: 1
                                }}>
                                    <CircularProgress />
                                </Box>
                            )}

                            <Table size="small" stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.75rem', bgcolor: 'grey.50' }}>Mes/Año</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.75rem', bgcolor: 'grey.50' }}>Cotización</TableCell>
                                        <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', bgcolor: 'grey.50' }}>Empresa</TableCell>
                                        <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', bgcolor: 'grey.50' }}>Producto</TableCell>
                                        <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', bgcolor: 'grey.50' }}>Vendedor 1</TableCell>
                                        <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', bgcolor: 'grey.50' }}>Vendedor 2</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.75rem', bgcolor: 'grey.50' }}>Monto Total</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.75rem', bgcolor: 'grey.50' }}>Actualizado</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.75rem', bgcolor: 'grey.50' }}>Com. P</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.75rem', bgcolor: 'grey.50' }}>Com. S</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.75rem', bgcolor: 'grey.50' }}>Comisiona</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.75rem', bgcolor: 'grey.50' }}>Acciones</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {facturas.length === 0 && !loading ? (
                                        <TableRow>
                                            <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                                                <Typography variant="body2" color="text.secondary">
                                                    No se encontraron facturas
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        facturas.map((factura, index) => (
                                            <TableRow
                                                key={factura._id || index}
                                                sx={{ '&:hover': { bgcolor: 'action.hover' } }}
                                            >
                                                <TableCell align="center" >
                                                    <Typography variant="body2" fontSize="0.8rem" >
                                                        {factura.mes}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="center" >
                                                    <Typography variant="body2" fontSize="0.8rem" >
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
                                                <TableCell>
                                                    <Typography variant="body2" fontSize="0.8rem" noWrap>
                                                        {factura.responsable_1 || 'N/A'}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" fontSize="0.8rem" color="text.secondary" noWrap>
                                                        {factura.responsable_2 || '-'}
                                                    </Typography>
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
                                                    <Typography variant="body2" fontSize="0.8rem" color="success.main" fontWeight={500}>
                                                        {formatCurrency(factura.comision_1)}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Typography variant="body2" fontSize="0.8rem" color="info.main" fontWeight={500}>
                                                        {formatCurrency(factura.comision_2)}
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
                                        ))
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
                    )
            }

            <EditFacturaDialog
                open={editDialogOpen}
                onClose={handleCloseEditDialog}
                facturaId={selectedFacturaId}
                onSave={handleSaveFactura}
            />
        </Box>
    );
};