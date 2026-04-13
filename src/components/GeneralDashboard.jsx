import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  List,
  ListItem,
  ListItemText,
  Chip,
  FormControl,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Stack
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import axios from 'axios';

import { URI_API } from '../config/api';
import { chartColors, colorTokens } from '../theme';

const API_URL = URI_API;

const cardSx = { p: 3, borderRadius: 3, height: '100%' };
const chartGrid = { strokeDasharray: '3 3', stroke: colorTokens.border, vertical: false };
const axisStyle = { stroke: colorTokens.textSecondary, axisLine: false, tickLine: false, style: { fontSize: '0.75rem' } };
const tooltipStyle = {
  backgroundColor: colorTokens.surface,
  border: `1px solid ${colorTokens.border}`,
  borderRadius: '10px'
};

const GeneralDashboard = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [availableFilters, setAvailableFilters] = useState({
    responsables: [],
    productos: [],
    trimestres: [1, 2, 3, 4],
    anios: []
  });

  const [selectedPerson, setSelectedPerson] = useState('Todas');
  const [selectedName, setSelectedName] = useState('Todas');
  const [dateRange, setDateRange] = useState(1);
  const [selectedYear, setSelectedYear] = useState(2025);
  const hasInitialized = useRef(false);

  const loadInvoices = async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (selectedPerson !== 'Todas') params.append('responsable', selectedPerson);
      if (selectedName !== 'Todas') params.append('producto', selectedName);
      params.append('trimestre', dateRange);
      params.append('anio', selectedYear);
      const response = await axios.get(`${API_URL}/invoices/dashboard?${params.toString()}`);
      setInvoices(response.data);
    } catch (loadError) {
      console.error('Error cargando facturas:', loadError);
      setError('Error al cargar las facturas. Por favor, intenta de nuevo.');
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const initializeDashboard = async () => {
      try {
        setLoading(true);
        setError(null);

        const [filtersResponse, invoicesResponse] = await Promise.all([
          axios.get(`${API_URL}/invoices/filtros`),
          axios.get(`${API_URL}/invoices/dashboard?trimestre=${dateRange}&anio=${selectedYear}`)
        ]);

        if (cancelled) return;

        setAvailableFilters({
          responsables: ['Todas', ...filtersResponse.data.responsables],
          productos: ['Todas', ...filtersResponse.data.productos],
          trimestres: [1, 2, 3, 4],
          anios: filtersResponse.data.anios
        });
        setInvoices(invoicesResponse.data);
        hasInitialized.current = true;
      } catch (loadError) {
        if (cancelled) return;
        console.error('Error inicializando dashboard general:', loadError);
        setError('Error al cargar la informaciÃ³n general.');
        setInvoices([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    initializeDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hasInitialized.current) return;
    loadInvoices({ silent: false });
  }, [selectedPerson, selectedName, dateRange, selectedYear]);

  const monthlyData = useMemo(() => {
    const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    const monthlyTotals = {};

    invoices.forEach((inv) => {
      const month = inv.mes;
      if (month >= 1 && month <= 12) {
        const monthName = monthNames[month - 1];
        monthlyTotals[monthName] = (monthlyTotals[monthName] || 0) + (inv.monto_total || 0);
      }
    });

    return Object.entries(monthlyTotals)
      .map(([mes, total]) => ({ mes, total: total / 1000000 }))
      .sort((a, b) => monthNames.indexOf(a.mes) - monthNames.indexOf(b.mes));
  }, [invoices]);

  const detailedMonthlyData = useMemo(() => {
    const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    const monthlyProductTotals = {};

    invoices.forEach((inv) => {
      const month = inv.mes;
      const producto = inv.producto;
      if (month >= 1 && month <= 12) {
        const monthName = monthNames[month - 1];
        monthlyProductTotals[monthName] ??= {};
        monthlyProductTotals[monthName][producto] = (monthlyProductTotals[monthName][producto] || 0) + (inv.monto_total || 0);
      }
    });

    return Object.entries(monthlyProductTotals)
      .map(([mes, productos]) => {
        const data = { mes };
        Object.entries(productos).forEach(([producto, total]) => {
          data[producto] = total / 1000000;
        });
        return data;
      })
      .sort((a, b) => monthNames.indexOf(a.mes) - monthNames.indexOf(b.mes));
  }, [invoices]);

  const uniqueProducts = useMemo(() => {
    const products = new Set();
    invoices.forEach((inv) => {
      const producto = inv.producto || 'Sin Producto';
      if (producto !== 0) products.add(producto);
    });
    return Array.from(products);
  }, [invoices]);

  const summaryData = useMemo(() => {
    const summary = {};
    invoices.forEach((inv) => {
      summary[inv.producto] = (summary[inv.producto] || 0) + (inv.monto_total || 0);
    });

    return Object.entries(summary)
      .map(([name, total], index) => ({ name, total, color: chartColors[index % chartColors.length] }))
      .sort((a, b) => b.total - a.total);
  }, [invoices]);

  const totalGeneral = useMemo(() => invoices.reduce((sum, inv) => sum + (inv.monto_total || 0), 0), [invoices]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress size={56} />
      </Box>
    );
  }

  if (error) {
    return <Box sx={{ p: 3 }}><Alert severity="error">{error}</Alert></Box>;
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: 'background.default', minHeight: '100vh' }}>
      <Stack spacing={0.75} sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ color: colorTokens.brand }}>
          Dashboard General
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Vista consolidada por responsable, producto y periodo.
        </Typography>
      </Stack>

      <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', mb: 0.75, display: 'block', fontWeight: 600 }}>Responsable</Typography>
            <FormControl fullWidth size="small">
              <Select value={selectedPerson} onChange={(e) => setSelectedPerson(e.target.value)}>
                {availableFilters.responsables.map((resp) => <MenuItem key={resp} value={resp}>{resp}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', mb: 0.75, display: 'block', fontWeight: 600 }}>Producto</Typography>
            <FormControl fullWidth size="small">
              <Select value={selectedName} onChange={(e) => setSelectedName(e.target.value)}>
                {availableFilters.productos.map((prod) => <MenuItem key={prod} value={prod}>{prod}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', mb: 0.75, display: 'block', fontWeight: 600 }}>Trimestre</Typography>
            <FormControl fullWidth size="small">
              <Select value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
                {availableFilters.trimestres.map((q) => <MenuItem key={q} value={q}>Q{q}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', mb: 0.75, display: 'block', fontWeight: 600 }}>AÃ±o</Typography>
            <FormControl fullWidth size="small">
              <Select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
                {availableFilters.anios.map((year) => <MenuItem key={year} value={year}>{year}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {invoices.length === 0 ? (
        <Alert severity="warning">No se encontraron facturas con los filtros seleccionados.</Alert>
      ) : (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, lg: 3.5 }}>
            <Paper sx={cardSx}>
              <Typography variant="overline" sx={{ color: colorTokens.info, fontWeight: 700 }}>
                Resumen
              </Typography>
              <Typography variant="h3" sx={{ color: colorTokens.brand, mt: 1 }}>
                ${(totalGeneral / 1000000).toFixed(2)}M
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Monto total acumulado
              </Typography>

              <List sx={{ p: 0 }}>
                {summaryData.map((item, index) => (
                  <ListItem key={index} sx={{ px: 0, py: 1.25, borderBottom: index < summaryData.length - 1 ? `1px solid ${colorTokens.border}` : 'none' }}>
                    <Box sx={{ width: 8, height: 32, mr: 2, borderRadius: 1, bgcolor: item.color }} />
                    <ListItemText
                      primary={<Typography variant="body2" sx={{ fontWeight: 600 }}>{item.name}</Typography>}
                      secondary={<Typography variant="caption" color="text.secondary">${item.total.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</Typography>}
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, lg: 8.5 }}>
            <Stack spacing={3}>
              <Paper sx={cardSx}>
                <Typography variant="h6" sx={{ color: colorTokens.brand, mb: 3 }}>
                  Total por Mes
                </Typography>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid {...chartGrid} />
                    <XAxis dataKey="mes" {...axisStyle} />
                    <YAxis {...axisStyle} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(value) => `$${value.toFixed(2)}M`} />
                    <Bar dataKey="total" fill={colorTokens.action} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Paper>

              <Paper sx={cardSx}>
                <Typography variant="h6" sx={{ color: colorTokens.brand, mb: 1.5 }}>
                  Total por Mes y Producto
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2.5 }}>
                  {uniqueProducts.map((name, idx) => (
                    <Chip
                      key={name}
                      label={name}
                      size="small"
                      sx={{
                        bgcolor: alpha(chartColors[idx % chartColors.length], 0.12),
                        color: chartColors[idx % chartColors.length],
                      }}
                    />
                  ))}
                </Box>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={detailedMonthlyData}>
                    <CartesianGrid {...chartGrid} />
                    <XAxis dataKey="mes" {...axisStyle} />
                    <YAxis {...axisStyle} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(value) => `$${value.toFixed(2)}M`} />
                    {uniqueProducts.map((product, idx) => (
                      <Bar key={product} dataKey={product} stackId="a" fill={chartColors[idx % chartColors.length]} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            </Stack>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default GeneralDashboard;
