import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
    Typography,
    IconButton,
    Divider,
    Alert,
    Grid,
    Paper,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    InputAdornment
} from '@mui/material';
import {
    Close as CloseIcon,
    Save as SaveIcon
} from '@mui/icons-material';
import axios from 'axios';
import { URI_API } from '../config/api';

const API_URL = URI_API;

export const EditFacturaDialog = ({ open, onClose, facturaId, onSave }) => {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [factura, setFactura] = useState(null);
    const [listaResponsables, setListaResponsables] = useState([]);
    const [montoTotal, setMontoTotal] = useState(0);
    const [montoActualizado, setMontoActualizado] = useState(0);
    const [responsable1, setResponsable1] = useState('');
    const [responsable2, setResponsable2] = useState('');
    const [porcentaje1, setPorcentaje1] = useState(70);
    const [porcentaje2, setPorcentaje2] = useState(30);
    const [utilidad, setUtilidad] = useState(0);
    useEffect(() => {
        if (open && facturaId) {
            cargarFactura();
            cargarResponsables();
        }
    }, [open, facturaId]);
    useEffect(() => {
        if (utilidad < 0.22) {
            setMontoActualizado(montoTotal * utilidad / 0.22)
        } else {
            setMontoActualizado(montoTotal)
        }
    }, [montoTotal])
    const cargarResponsables = async () => {
        try {
            const response = await axios.get(`${API_URL}/usuarios`);
            setListaResponsables(response.data || []);
        } catch (error) {
            console.error('Error cargando responsables:', error);
        }
    };

    const cargarFactura = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await axios.get(`${API_URL}/invoice/${facturaId}`);
            const data = response.data;
            setFactura(data);
            setUtilidad(data.utilidad_bruta)
            setMontoTotal(data.monto_total);
            setResponsable1(data.responsable_1);
            setResponsable2(data.responsable_2);
            setPorcentaje1(data.porcentaje_1 * 100);
            setPorcentaje2(data.porcentaje_2 * 100);
        } catch (error) {
            console.error('Error cargando factura:', error);
            setError(error.response?.data?.detail || 'Error al cargar la factura');
        } finally {
            setLoading(false);
        }
    };

    const calcularComision = (monto, porcentaje) => {
        const comisionBase = monto * 0.01;
        return comisionBase * (porcentaje / 100);
    };

    const validarFormulario = () => {
        if (montoTotal < 0 || montoActualizado < 0) {
            return { valido: false, mensaje: 'Los montos no pueden ser negativos' };
        }

        if (!responsable1 || responsable1.trim() === '') {
            return { valido: false, mensaje: 'Debe especificar al menos un responsable principal' };
        }

        if (porcentaje1 <= 0 || porcentaje1 > 100) {
            return { valido: false, mensaje: 'El porcentaje del responsable 1 debe estar entre 0 y 100' };
        }

        if (responsable2 && responsable2.trim() !== '') {
            if (porcentaje2 <= 0 || porcentaje2 > 100) {
                return { valido: false, mensaje: 'El porcentaje del responsable 2 debe estar entre 0 y 100' };
            }
        } else {
            // Si no hay responsable 2, el porcentaje 1 debe ser 100
            if (Math.abs(porcentaje1 - 100) > 0.01) {
                return { valido: false, mensaje: 'Sin responsable secundario, el porcentaje debe ser 100%' };
            }
        }

        return { valido: true };
    };

    const handleGuardar = async () => {
        const validacion = validarFormulario();
        if (!validacion.valido) {
            setError(validacion.mensaje);
            return;
        }

        try {
            setSaving(true);
            setError(null);

            const payload = {
                monto_total: montoTotal,
                responsable_1: responsable1,
                responsable_2: responsable2 || '',
                porcentaje_1: porcentaje1 / 100,
                porcentaje_2: (responsable2 && responsable2.trim() !== '') ? porcentaje2 / 100 : 0
            };

            await axios.put(`${API_URL}/invoice/${facturaId}`, payload);

            if (onSave) {
                onSave();
            }
            onClose();
        } catch (error) {
            console.error('Error guardando cambios:', error);
            setError(error.response?.data?.detail || 'Error al guardar los cambios');
        } finally {
            setSaving(false);
        }
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('es-PE', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(value || 0);
    };

    if (!factura && !loading) return null;

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: { borderRadius: 3 }
            }}
        >
            <DialogTitle sx={{ pb: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" fontWeight={700}>
                        Editar Factura
                    </Typography>
                    <IconButton onClick={onClose} size="small">
                        <CloseIcon />
                    </IconButton>
                </Box>
            </DialogTitle>

            <Divider />

            <DialogContent sx={{ pt: 3 }}>
                {loading ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography>Cargando...</Typography>
                    </Box>
                ) : error ? (
                    <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                        {error}
                    </Alert>
                ) : factura ? (
                    <>
                        {/* Información básica de la factura */}
                        <Paper sx={{ p: 2, mb: 3, bgcolor: 'grey.50', border: '1px solid', borderColor: 'divider' }}>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="caption" color="text.secondary">
                                        Empresa
                                    </Typography>
                                    <Typography variant="body2" fontWeight={600}>
                                        {factura.nombre_empresa || 'N/A'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="caption" color="text.secondary">
                                        Producto
                                    </Typography>
                                    <Typography variant="body2" fontWeight={600}>
                                        {factura.producto || 'N/A'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="caption" color="text.secondary">
                                        Fecha
                                    </Typography>
                                    <Typography variant="body2" fontWeight={600}>
                                        {factura.fecha || 'N/A'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="caption" color="text.secondary">
                                        Mes
                                    </Typography>
                                    <Typography variant="body2" fontWeight={600}>
                                        {factura.mes || 'N/A'}
                                    </Typography>
                                </Grid>
                            </Grid>
                        </Paper>

                        {/* Sección de Montos */}
                        <Box sx={{ mb: 4 }}>
                            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
                                💰 Montos
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        label="Monto Total"
                                        fullWidth
                                        type="number"
                                        value={montoTotal}
                                        onChange={(e) => setMontoTotal(parseFloat(e.target.value) || 0)}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <Typography color="text.secondary">$</Typography>
                                                </InputAdornment>
                                            )
                                        }}
                                    />
                                </Grid>
                            </Grid>
                        </Box>

                        {/* Comisión base */}
                        <Box sx={{ mb: 3, p: 2, bgcolor: 'info.50', borderRadius: 2, border: '1px solid', borderColor: 'info.200' }}>
                            <Typography variant="caption" color="info.700" fontWeight={600}>
                                💡 Comisión base (1% del monto actualizado)
                            </Typography>
                            <Typography variant="h6" fontWeight={700} color="info.900">
                                {formatCurrency(montoActualizado * 0.01)}
                            </Typography>
                        </Box>

                        {/* Sección de Responsables */}
                        <Box sx={{ mb: 3 }}>
                            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
                                👥 Responsables y Comisiones
                            </Typography>

                            {/* Responsable 1 */}
                            <Paper sx={{ p: 2, mb: 2, border: '1px solid', borderColor: 'divider' }}>
                                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }} color="primary.main">
                                    Responsable Principal
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={7}>
                                        <FormControl fullWidth>
                                            <InputLabel>Nombre</InputLabel>
                                            <Select
                                                value={responsable1}
                                                onChange={(e) => setResponsable1(e.target.value)}
                                                label="Nombre"
                                            >
                                                <MenuItem value="">
                                                    <em>Seleccionar...</em>
                                                </MenuItem>
                                                {listaResponsables.map((resp) => (
                                                    <MenuItem key={resp.nombre} value={resp.nombre}>
                                                        {resp.nombre}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid item xs={12} sm={5}>
                                        <TextField
                                            label="Porcentaje de comisión"
                                            fullWidth
                                            type="number"
                                            value={porcentaje1}
                                            onChange={(e) => setPorcentaje1(parseFloat(e.target.value) || 0)}
                                            InputProps={{
                                                endAdornment: (
                                                    <InputAdornment position="end">
                                                        <Typography>%</Typography>
                                                    </InputAdornment>
                                                )
                                            }}
                                            inputProps={{
                                                min: 0,
                                                max: 100,
                                                step: 1
                                            }}
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Box sx={{ p: 1.5, bgcolor: 'success.50', borderRadius: 1 }}>
                                            <Typography variant="caption" color="success.700">
                                                Comisión calculada
                                            </Typography>
                                            <Typography variant="h6" fontWeight={700} color="success.900">
                                                {formatCurrency(calcularComision(montoActualizado, porcentaje1))}
                                            </Typography>
                                        </Box>
                                    </Grid>
                                </Grid>
                            </Paper>

                            {/* Responsable 2 */}
                            <Paper sx={{ p: 2, border: '1px solid', borderColor: 'divider' }}>
                                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }} color="secondary.main">
                                    Responsable Secundario
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={7}>
                                        <FormControl fullWidth>
                                            <InputLabel>Nombre</InputLabel>
                                            <Select
                                                value={responsable2}
                                                onChange={(e) => setResponsable2(e.target.value)}
                                                label="Nombre"
                                            >
                                                <MenuItem value="">
                                                    <em>Ninguno</em>
                                                </MenuItem>
                                                {listaResponsables
                                                    .map((resp) => (
                                                        <MenuItem key={resp.nombre} value={resp.nombre}>
                                                            {resp.nombre}
                                                        </MenuItem>
                                                    ))}
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid item xs={12} sm={5}>
                                        <TextField
                                            label="Porcentaje de comisión"
                                            fullWidth
                                            type="number"
                                            value={porcentaje2}
                                            onChange={(e) => setPorcentaje2(parseFloat(e.target.value) || 0)}
                                            disabled={!responsable2 || responsable2.trim() === ''}
                                            InputProps={{
                                                endAdornment: (
                                                    <InputAdornment position="end">
                                                        <Typography>%</Typography>
                                                    </InputAdornment>
                                                )
                                            }}
                                            inputProps={{
                                                min: 0,
                                                max: 100,
                                                step: 1
                                            }}
                                        />
                                    </Grid>
                                    {responsable2 && responsable2.trim() !== '' && (
                                        <Grid item xs={12}>
                                            <Box sx={{ p: 1.5, bgcolor: 'success.50', borderRadius: 1 }}>
                                                <Typography variant="caption" color="success.700">
                                                    Comisión calculada
                                                </Typography>
                                                <Typography variant="h6" fontWeight={700} color="success.900">
                                                    {formatCurrency(calcularComision(montoActualizado, porcentaje2))}
                                                </Typography>
                                            </Box>
                                        </Grid>
                                    )}
                                </Grid>
                            </Paper>
                        </Box>

                        {/* Resumen de porcentajes */}
                        {responsable2 && responsable2.trim() !== '' && (
                            <Alert
                                severity={Math.abs((porcentaje1 + porcentaje2) - 100) < 0.01 ? 'success' : 'warning'}
                                sx={{ borderRadius: 2 }}
                            >
                                Total de porcentajes: <strong>{(porcentaje1 + porcentaje2).toFixed(2)}%</strong>
                                {Math.abs((porcentaje1 + porcentaje2) - 100) < 0.01
                                    ? ' ✓ Correcto'
                                    : ' ⚠️ Debe sumar 100%'}
                            </Alert>
                        )}

                        {/* Resumen total */}
                        <Box sx={{ mt: 3, p: 2, bgcolor: 'primary.50', borderRadius: 2, border: '2px solid', borderColor: 'primary.200' }}>
                            <Typography variant="subtitle2" fontWeight={700} color="primary.main" sx={{ mb: 1 }}>
                                Comisión Total
                            </Typography>
                            <Typography variant="h5" fontWeight={700} color="primary.dark">
                                {formatCurrency(
                                    calcularComision(montoActualizado, porcentaje1) +
                                    (responsable2 && responsable2.trim() !== '' ? calcularComision(montoActualizado, porcentaje2) : 0)
                                )}
                            </Typography>
                        </Box>
                    </>
                ) : null}
            </DialogContent>

            <Divider />

            <DialogActions sx={{ p: 3 }}>
                <Button onClick={onClose} sx={{ textTransform: 'none' }}>
                    Cancelar
                </Button>
                <Button
                    variant="contained"
                    onClick={handleGuardar}
                    disabled={saving || loading}
                    startIcon={<SaveIcon />}
                    sx={{
                        textTransform: 'none',
                        fontWeight: 600
                    }}
                >
                    {saving ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};