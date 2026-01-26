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
    InputAdornment,
    Tooltip,
    Stack
} from '@mui/material';
import {
    Close as CloseIcon,
    Save as SaveIcon,
    Add as AddIcon,
    Delete as DeleteIcon,
    Info as InfoIcon
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
    const [utilidad, setUtilidad] = useState(0);

    // Array de responsables
    const [responsables, setResponsables] = useState([
        { nombre: '', porcentaje: 100, comision: 0 }
    ]);

    useEffect(() => {
        if (open && facturaId) {
            cargarFactura();
            cargarResponsables();
        }
    }, [open, facturaId]);

    useEffect(() => {
        if (utilidad < 0.22) {
            setMontoActualizado(montoTotal * utilidad / 0.22);
        } else {
            setMontoActualizado(montoTotal);
        }
    }, [montoTotal, utilidad]);

    // Recalcular comisiones cuando cambia el monto o los porcentajes
    useEffect(() => {
        const comisionBase = montoActualizado * 0.01;
        const nuevosResponsables = responsables.map(r => ({
            ...r,
            comision: comisionBase * (r.porcentaje / 100)
        }));
        setResponsables(nuevosResponsables);
    }, [montoActualizado]);

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
            setUtilidad(data.utilidad_bruta);
            setMontoTotal(data.monto_total);

            // Cargar responsables desde el nuevo formato
            if (data.responsables && data.responsables.length > 0) {
                setResponsables(
                    data.responsables.map(r => ({
                        nombre: r.nombre,
                        porcentaje: r.porcentaje * 100, // Convertir a porcentaje
                        comision: r.comision || 0
                    }))
                );
            } else {
                // Fallback al formato antiguo si existe
                const responsablesLegacy = [];
                if (data.responsable_1) {
                    responsablesLegacy.push({
                        nombre: data.responsable_1,
                        porcentaje: (data.porcentaje_1 || 0.7) * 100,
                        comision: data.comision_1 || 0
                    });
                }
                if (data.responsable_2) {
                    responsablesLegacy.push({
                        nombre: data.responsable_2,
                        porcentaje: (data.porcentaje_2 || 0.3) * 100,
                        comision: data.comision_2 || 0
                    });
                }
                setResponsables(responsablesLegacy.length > 0 ? responsablesLegacy : [
                    { nombre: '', porcentaje: 100, comision: 0 }
                ]);
            }
        } catch (error) {
            console.error('Error cargando factura:', error);
            setError(error.response?.data?.detail || 'Error al cargar la factura');
        } finally {
            setLoading(false);
        }
    };

    const agregarResponsable = () => {
        setResponsables([
            ...responsables,
            { nombre: '', porcentaje: 50, comision: 0 }
        ]);
    };

    const eliminarResponsable = (index) => {
        if (responsables.length > 1) {
            const nuevosResponsables = responsables.filter((_, i) => i !== index);
            setResponsables(nuevosResponsables);
        }
    };

    const actualizarResponsable = (index, campo, valor) => {
        const nuevosResponsables = [...responsables];
        nuevosResponsables[index] = {
            ...nuevosResponsables[index],
            [campo]: valor
        };

        // Recalcular comisión
        if (campo === 'porcentaje') {
            const comisionBase = montoActualizado * 0.01;
            nuevosResponsables[index].comision = comisionBase * (valor / 100);
        }

        setResponsables(nuevosResponsables);
    };

    const calcularPorcentajeTotal = () => {
        return responsables.reduce((sum, r) => sum + (parseFloat(r.porcentaje) || 0), 0);
    };

    const calcularComisionTotal = () => {
        return responsables.reduce((sum, r) => sum + (r.comision || 0), 0);
    };

    const validarFormulario = () => {
        if (montoTotal < 0 || montoActualizado < 0) {
            return { valido: false, mensaje: 'Los montos no pueden ser negativos' };
        }

        if (responsables.length === 0) {
            return { valido: false, mensaje: 'Debe haber al menos un responsable' };
        }

        for (let i = 0; i < responsables.length; i++) {
            const resp = responsables[i];

            if (!resp.nombre || resp.nombre.trim() === '') {
                return { valido: false, mensaje: `El responsable ${i + 1} debe tener un nombre` };
            }

            if (resp.porcentaje < 0) {
                return { valido: false, mensaje: `El porcentaje del responsable ${i + 1} no puede ser negativo` };
            }

            if (resp.porcentaje > 200) {
                return { valido: false, mensaje: `El porcentaje del responsable ${i + 1} no puede superar 200%` };
            }
        }

        // Verificar nombres duplicados
        const nombres = responsables.map(r => r.nombre);
        const nombresDuplicados = nombres.filter((nombre, index) => nombres.indexOf(nombre) !== index);
        if (nombresDuplicados.length > 0) {
            return { valido: false, mensaje: 'No puede haber responsables duplicados' };
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
                responsables: responsables.map(r => ({
                    nombre: r.nombre,
                    porcentaje: r.porcentaje / 100, // Convertir a decimal
                    comision: r.comision
                }))
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

    const porcentajeTotal = calcularPorcentajeTotal();
    const comisionTotal = calcularComisionTotal();
    const comisionBase = montoActualizado * 0.01;
    const porcentajeTotalReal = comisionBase > 0 ? (comisionTotal / comisionBase) * 100 : 0;

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
                                {formatCurrency(comisionBase)}
                            </Typography>
                        </Box>

                        {/* Info sobre porcentajes independientes */}
                        <Alert
                            severity="info"
                            icon={<InfoIcon />}
                            sx={{ mb: 3, borderRadius: 2 }}
                        >
                            Los porcentajes son <strong>independientes</strong> y se calculan sobre el 1% base.
                            Pueden sumar más de 100% (ej: Responsable 1: 70% + Responsable 2: 50% = 120% del 1% base).
                        </Alert>

                        {/* Sección de Responsables */}
                        <Box sx={{ mb: 3 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="subtitle1" fontWeight={700}>
                                    👥 Responsables y Comisiones
                                </Typography>
                                <Button
                                    size="small"
                                    startIcon={<AddIcon />}
                                    onClick={agregarResponsable}
                                    sx={{ textTransform: 'none' }}
                                >
                                    Agregar Responsable
                                </Button>
                            </Box>

                            {responsables.map((responsable, index) => (
                                <Paper
                                    key={index}
                                    sx={{
                                        p: 2,
                                        mb: 2,
                                        border: '1px solid',
                                        borderColor: 'divider',
                                        position: 'relative'
                                    }}
                                >
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                        <Typography variant="subtitle2" fontWeight={600} color={index === 0 ? "primary.main" : "secondary.main"}>
                                            {index === 0 ? 'Responsable Principal' : `Responsable ${index + 1}`}
                                        </Typography>
                                        {responsables.length > 1 && (
                                            <Tooltip title="Eliminar responsable">
                                                <IconButton
                                                    size="small"
                                                    color="error"
                                                    onClick={() => eliminarResponsable(index)}
                                                >
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                    </Box>

                                    <Grid container spacing={2}>
                                        <Grid item xs={12} sm={7}>
                                            <FormControl fullWidth>
                                                <InputLabel>Nombre</InputLabel>
                                                <Select
                                                    value={responsable.nombre}
                                                    onChange={(e) => actualizarResponsable(index, 'nombre', e.target.value)}
                                                    label="Nombre"
                                                >
                                                    <MenuItem value="">
                                                        <em>Seleccionar...</em>
                                                    </MenuItem>
                                                    {listaResponsables.map((resp) => (
                                                        <MenuItem
                                                            key={resp.nombre}
                                                            value={resp.nombre}
                                                            disabled={responsables.some((r, i) => i !== index && r.nombre === resp.nombre)}
                                                        >
                                                            {resp.nombre}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        </Grid>
                                        <Grid item xs={12} sm={5}>
                                            <TextField
                                                label="Porcentaje del 1% base"
                                                fullWidth
                                                type="number"
                                                value={responsable.porcentaje}
                                                onChange={(e) => actualizarResponsable(index, 'porcentaje', parseFloat(e.target.value) || 0)}
                                                InputProps={{
                                                    endAdornment: (
                                                        <InputAdornment position="end">
                                                            <Typography>%</Typography>
                                                        </InputAdornment>
                                                    )
                                                }}
                                                inputProps={{
                                                    min: 0,
                                                    max: 200,
                                                    step: 0.1
                                                }}
                                                helperText="Puede superar 100%"
                                            />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <Box sx={{ p: 1.5, bgcolor: 'success.50', borderRadius: 1 }}>
                                                <Typography variant="caption" color="success.700">
                                                    Comisión calculada ({responsable.porcentaje}% de {formatCurrency(comisionBase)})
                                                </Typography>
                                                <Typography variant="h6" fontWeight={700} color="success.900">
                                                    {formatCurrency(responsable.comision)}
                                                </Typography>
                                            </Box>
                                        </Grid>
                                    </Grid>
                                </Paper>
                            ))}
                        </Box>

                        {/* Resumen de porcentajes */}
                        <Alert
                            severity={porcentajeTotal <= 100 ? 'info' : 'warning'}
                            sx={{ borderRadius: 2, mb: 3 }}
                        >
                            <Stack spacing={0.5}>
                                <Box>
                                    <strong>Suma de porcentajes:</strong> {porcentajeTotal.toFixed(1)}%
                                </Box>
                                <Box>
                                    <strong>Porcentaje real del monto:</strong> {porcentajeTotalReal.toFixed(2)}%
                                    {porcentajeTotalReal > 1 && ' (Supera el 1% base) ⚠️'}
                                </Box>
                            </Stack>
                        </Alert>

                        {/* Resumen total */}
                        <Box sx={{ p: 2, bgcolor: 'primary.50', borderRadius: 2, border: '2px solid', borderColor: 'primary.200' }}>
                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <Typography variant="caption" color="text.secondary">
                                        Comisión base (1%)
                                    </Typography>
                                    <Typography variant="h6" fontWeight={600} color="text.secondary">
                                        {formatCurrency(comisionBase)}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="caption" color="primary.main" fontWeight={700}>
                                        Comisión Total a Pagar
                                    </Typography>
                                    <Typography variant="h5" fontWeight={700} color="primary.dark">
                                        {formatCurrency(comisionTotal)}
                                    </Typography>
                                </Grid>
                            </Grid>

                            {comisionTotal > comisionBase && (
                                <Alert severity="warning" sx={{ mt: 2 }}>
                                    La comisión total ({formatCurrency(comisionTotal)}) supera el 1% base ({formatCurrency(comisionBase)})
                                    en {formatCurrency(comisionTotal - comisionBase)} ({((comisionTotal / comisionBase - 1) * 100).toFixed(1)}% más)
                                </Alert>
                            )}
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