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
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    MenuItem,
    Chip,
    Alert,
    Snackbar,
    Tooltip,
    CircularProgress,
    Tabs,
    Tab,
    TablePagination,
    InputAdornment
} from '@mui/material';
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    Add as AddIcon,
    Refresh as RefreshIcon,
    Save as SaveIcon,
    People as PeopleIcon,
    Receipt as ReceiptIcon,
    Search as SearchIcon
} from '@mui/icons-material';
import axios from 'axios';
import { FacturasViewer } from './FacturasViewer';
import { UpdateData } from './UpdateData';

import { URI_API } from '../config/api';
const API_URL = URI_API;

const UNIDADES_NEGOCIO = ['-', 'UNAU', 'UNAI', 'UNVA'];

function TabPanel({ children, value, index, ...other }) {
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`settings-tabpanel-${index}`}
            aria-labelledby={`settings-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ py: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

export const SettingsPage = () => {
    const [vendedores, setVendedores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingVendedor, setEditingVendedor] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        nombre: '',
        meta_mensual: '',
        porcentaje_umbral: 80,
        unidad_negocio: 'UNAU'
    });
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success'
    });
    const [recalculando, setRecalculando] = useState(false);
    const [tabValue, setTabValue] = useState(0);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchVendedores();
    }, []);

    const fetchVendedores = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_URL}/vendedores`);
            setVendedores(response.data);
        } catch (error) {
            showSnackbar('Error al cargar vendedores', 'error');
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const showSnackbar = (message, severity = 'success') => {
        setSnackbar({ open: true, message, severity });
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
        setPage(0); // Resetear a la primera página al buscar
    };

    const handleOpenDialog = (vendedor = null) => {
        if (vendedor) {
            setEditingVendedor(vendedor);
            setFormData({
                nombre: vendedor.nombre,
                meta_mensual: vendedor.meta_mensual,
                porcentaje_umbral: vendedor.porcentaje_umbral,
                unidad_negocio: vendedor.unidad_negocio
            });
        } else {
            setEditingVendedor(null);
            setFormData({
                nombre: '',
                meta_mensual: '',
                porcentaje_umbral: 80,
                unidad_negocio: 'UNAU'
            });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingVendedor(null);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSave = async () => {
        try {
            setIsSaving(true);
            if (editingVendedor) {
                // Actualizar
                await axios.put(
                    `${API_URL}/vendedores/${editingVendedor.id}`,
                    {
                        meta_mensual: parseFloat(formData.meta_mensual),
                        porcentaje_umbral: parseFloat(formData.porcentaje_umbral),
                        unidad_negocio: formData.unidad_negocio
                    }
                );
                showSnackbar('Vendedor actualizado correctamente');
            } else {
                // Crear
                await axios.post(`${API_URL}/vendedores`, {
                    nombre: formData.nombre,
                    meta_mensual: parseFloat(formData.meta_mensual),
                    porcentaje_umbral: parseFloat(formData.porcentaje_umbral),
                    unidad_negocio: formData.unidad_negocio
                });
                showSnackbar('Vendedor creado correctamente');
            }

            handleCloseDialog();
            fetchVendedores();
        } catch (error) {
            showSnackbar(
                error.response?.data?.detail || 'Error al guardar vendedor',
                'error'
            );
            console.error('Error:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id, nombre) => {
        if (window.confirm(`¿Estás seguro de eliminar a ${nombre}?`)) {
            try {
                await axios.delete(`${API_URL}/vendedores/${id}`);
                showSnackbar('Vendedor eliminado correctamente');
                fetchVendedores();
            } catch (error) {
                showSnackbar('Error al eliminar vendedor', 'error');
                console.error('Error:', error);
            }
        }
    };

    const handleRecalcularComisiones = async () => {
        if (window.confirm('¿Estás seguro de recalcular todas las comisiones? Este proceso puede tardar varios segundos.')) {
            try {
                setRecalculando(true);
                await axios.post(`${API_URL}/recalcular-comisiones`);
                showSnackbar('Comisiones recalculadas correctamente');
            } catch (error) {
                showSnackbar('Error al recalcular comisiones', 'error');
                console.error('Error:', error);
            } finally {
                setRecalculando(false);
            }
        }
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('es-PE', {
            style: 'currency',
            currency: 'USD'
        }).format(value);
    };

    // Filtrar vendedores por búsqueda
    const filteredVendedores = vendedores.filter(vendedor =>
        vendedor.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Calcular vendedores paginados
    const paginatedVendedores = filteredVendedores.slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage
    );

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            {/* Tabs */}
            <Paper
                elevation={0}
                sx={{
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                    overflow: 'hidden'
                }}
            >
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs
                        variant='fullWidth'
                        value={tabValue}
                        onChange={handleTabChange}
                        sx={{
                            px: 2,
                            '& .MuiTab-root': {
                                textTransform: 'none',
                                fontWeight: 600,
                                fontSize: '0.95rem',
                                minHeight: 56
                            }
                        }}
                    >
                        <Tab
                            icon={<PeopleIcon />}
                            iconPosition="start"
                            label="Vendedores"
                        />
                        <Tab
                            icon={<ReceiptIcon />}
                            iconPosition="start"
                            label="Facturas"
                        />
                        <Tab
                            icon={<ReceiptIcon />}
                            iconPosition="start"
                            label="Carga de Datos"
                        />
                    </Tabs>
                </Box>
                <TabPanel value={tabValue} index={0}>
                    <Box sx={{ px: 3 }}>
                        {/* Barra de búsqueda y botones */}
                        <Box sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            mb: 3,
                            gap: 2
                        }}>
                            <TextField
                                placeholder="Buscar vendedor..."
                                value={searchTerm}
                                onChange={handleSearchChange}
                                size="small"
                                sx={{
                                    width: 300,
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 2
                                    }
                                }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon color="action" />
                                        </InputAdornment>
                                    )
                                }}
                            />
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <Tooltip title="Recalcular todas las comisiones">
                                    <Button
                                        variant="outlined"
                                        startIcon={recalculando ? <CircularProgress size={20} /> : <RefreshIcon />}
                                        onClick={handleRecalcularComisiones}
                                        disabled={recalculando}
                                        sx={{
                                            borderRadius: 2,
                                            textTransform: 'none',
                                            fontWeight: 600
                                        }}
                                    >
                                        {recalculando ? 'Recalculando...' : 'Recalcular Comisiones'}
                                    </Button>
                                </Tooltip>
                                <Button
                                    variant="contained"
                                    startIcon={<AddIcon />}
                                    onClick={() => handleOpenDialog()}
                                    sx={{
                                        borderRadius: 2,
                                        textTransform: 'none',
                                        fontWeight: 600
                                    }}
                                >
                                    Nuevo Vendedor
                                </Button>
                            </Box>
                        </Box>

                        {/* Tabla */}
                        <TableContainer
                            component={Paper}
                            elevation={0}
                            sx={{
                                borderRadius: 2,
                                border: '1px solid',
                                borderColor: 'divider',
                                overflow: 'hidden'
                            }}
                        >
                            <Table stickyHeader size="small">
                                <TableHead>
                                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                                        <TableCell sx={{ fontWeight: 700, fontSize: '0.875rem', bgcolor: 'grey.50' }}>
                                            Vendedor
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 700, fontSize: '0.875rem', bgcolor: 'grey.50' }}>
                                            Meta Mensual
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 700, fontSize: '0.875rem', bgcolor: 'grey.50' }}>
                                            % Umbral
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 700, fontSize: '0.875rem', bgcolor: 'grey.50' }}>
                                            Umbral Mensual
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 700, fontSize: '0.875rem', bgcolor: 'grey.50' }}>
                                            Umbral Trimestral
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 700, fontSize: '0.875rem', bgcolor: 'grey.50' }}>
                                            Unidad Negocio
                                        </TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.875rem', bgcolor: 'grey.50' }}>
                                            Acciones
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {paginatedVendedores.length > 0 ? (
                                        paginatedVendedores.map((vendedor) => (
                                            <TableRow
                                                key={vendedor.id}
                                                sx={{
                                                    '&:hover': { bgcolor: 'action.hover' },
                                                    transition: 'background-color 0.2s'
                                                }}
                                            >
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight={600} fontSize="0.8rem" >
                                                        {vendedor.nombre}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight={500} fontSize="0.8rem" >
                                                        {formatCurrency(vendedor.meta_mensual)}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={`${vendedor.porcentaje_umbral}%`}
                                                        size="small"
                                                        sx={{
                                                            bgcolor: 'primary.50',
                                                            color: 'primary.700',
                                                            fontWeight: 600
                                                        }}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" color="text.secondary" fontSize="0.8rem" >
                                                        {formatCurrency(vendedor.umbral_mensual)}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" color="text.secondary" fontSize="0.8rem" >
                                                        {formatCurrency(vendedor.umbral_trimestral)}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={vendedor.unidad_negocio}
                                                        size="small"
                                                        color={
                                                            vendedor.unidad_negocio === 'UNAU' ? 'primary' :
                                                                vendedor.unidad_negocio === 'UNAI' ? 'secondary' :
                                                                    'default'
                                                        }
                                                        sx={{ fontWeight: 600 }}
                                                    />
                                                </TableCell>
                                                <TableCell align="center">
                                                    <Tooltip title="Editar">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleOpenDialog(vendedor)}
                                                            sx={{
                                                                color: 'primary.main',
                                                                '&:hover': { bgcolor: 'primary.50' }
                                                            }}
                                                        >
                                                            <EditIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Eliminar">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleDelete(vendedor.id, vendedor.nombre)}
                                                            sx={{
                                                                color: 'error.main',
                                                                '&:hover': { bgcolor: 'error.50' }
                                                            }}
                                                        >
                                                            <DeleteIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                                                <Typography variant="body2" color="text.secondary">
                                                    {searchTerm ? 'No se encontraron vendedores con ese nombre' : 'No hay vendedores registrados'}
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                            <TablePagination
                                rowsPerPageOptions={[5, 10, 25, 50]}
                                component="div"
                                count={filteredVendedores.length}
                                rowsPerPage={rowsPerPage}
                                page={page}
                                onPageChange={handleChangePage}
                                onRowsPerPageChange={handleChangeRowsPerPage}
                                labelRowsPerPage="Filas por página:"
                                labelDisplayedRows={({ from, to, count }) =>
                                    `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
                                }
                                sx={{
                                    borderTop: '1px solid',
                                    borderColor: 'divider',
                                    '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': {
                                        fontSize: '0.875rem'
                                    }
                                }}
                            />
                        </TableContainer>
                    </Box>
                </TabPanel>

                {/* Panel de Facturas */}
                <TabPanel value={tabValue} index={1}>
                    <Box sx={{ px: 3 }}>
                        <FacturasViewer />
                    </Box>
                </TabPanel>
                <TabPanel value={tabValue} index={2}>
                    <Box sx={{ px: 3 }}>
                        <UpdateData />
                    </Box>
                </TabPanel>
            </Paper>

            {/* Dialog */}
            <Dialog
                open={openDialog}
                onClose={handleCloseDialog}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: { borderRadius: 3 }
                }}
            >
                <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
                    {editingVendedor ? 'Editar Vendedor' : 'Nuevo Vendedor'}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 2 }}>
                        <TextField
                            label="Nombre Completo"
                            name="nombre"
                            value={formData.nombre}
                            onChange={handleInputChange}
                            fullWidth
                            disabled={!!editingVendedor}
                            required
                        />
                        <TextField
                            label="Meta Mensual (USD)"
                            name="meta_mensual"
                            type="number"
                            value={formData.meta_mensual}
                            onChange={handleInputChange}
                            fullWidth
                            required
                            InputProps={{
                                startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>
                            }}
                        />
                        <TextField
                            label="Porcentaje Umbral"
                            name="porcentaje_umbral"
                            type="number"
                            value={formData.porcentaje_umbral}
                            onChange={handleInputChange}
                            fullWidth
                            required
                            InputProps={{
                                endAdornment: <Typography sx={{ ml: 1 }}>%</Typography>
                            }}
                        />
                        <TextField
                            label="Unidad de Negocio"
                            name="unidad_negocio"
                            select
                            value={formData.unidad_negocio}
                            onChange={handleInputChange}
                            fullWidth
                            required
                        >
                            {UNIDADES_NEGOCIO.map(unidad => (
                                <MenuItem key={unidad} value={unidad}>
                                    {unidad}
                                </MenuItem>
                            ))}
                        </TextField>

                        {formData.meta_mensual && formData.porcentaje_umbral && (
                            <Alert severity="info" sx={{ borderRadius: 2 }}>
                                <Typography variant="body2" fontWeight={600} gutterBottom>
                                    Umbrales calculados:
                                </Typography>
                                <Typography variant="body2">
                                    • Umbral Mensual: {formatCurrency(formData.meta_mensual * formData.porcentaje_umbral / 100)}
                                </Typography>
                                <Typography variant="body2">
                                    • Umbral Trimestral: {formatCurrency(formData.meta_mensual * formData.porcentaje_umbral / 100 * 3)}
                                </Typography>
                            </Alert>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 3, pt: 2 }}>
                    <Button
                        onClick={handleCloseDialog}
                        sx={{ textTransform: 'none' }}
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSave}
                        variant="contained"
                        startIcon={<SaveIcon />}
                        disabled={!formData.nombre || !formData.meta_mensual || !formData.porcentaje_umbral || isSaving}
                        sx={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            textTransform: 'none',
                            fontWeight: 600
                        }}
                    >
                        {isSaving ? 'Guardando...' : (editingVendedor ? 'Actualizar' : 'Crear')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert
                    onClose={handleCloseSnackbar}
                    severity={snackbar.severity}
                    sx={{ borderRadius: 2 }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};