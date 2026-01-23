import { useEffect, useState, useMemo } from 'react';
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
  CircularProgress
} from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import axios from 'axios';

import { URI_API } from '../config/api';
const API_URL = URI_API;

const GeneralDashboard = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Opciones de filtros disponibles
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

  const colors = [
    '#1e3a8a', '#2563eb', '#3b82f6', '#60a5fa',
    '#93c5fd', '#dbeafe', '#96c024ff', '#108b71ff', '#b1951bff'
  ];

  const loadFilterOptions = async () => {
    try {
      const response = await axios.get(`${API_URL}/invoices/filtros`);
      setAvailableFilters({
        responsables: ['Todas', ...response.data.responsables],
        productos: ['Todas', ...response.data.productos],
        trimestres: [1, 2, 3, 4],
        anios: response.data.anios
      });
    } catch (error) {
      console.error('Error cargando filtros:', error);
    }
  };

  const loadInvoices = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (selectedPerson !== 'Todas') {
        params.append('responsable', selectedPerson);
      }
      if (selectedName !== 'Todas') {
        params.append('producto', selectedName);
      }
      params.append('trimestre', dateRange);
      params.append('anio', selectedYear);
      const response = await axios.get(
        `${API_URL}/invoices/dashboard?${params.toString()}`
      );
      console.log('178')
      setInvoices(response.data);
    } catch (error) {
      console.error('Error cargando facturas:', error);
      setError('Error al cargar las facturas. Por favor, intenta de nuevo.');
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFilterOptions();
  }, []);

  useEffect(() => {
    if (availableFilters.responsables.length > 0) {
      loadInvoices();
    }
  }, [selectedPerson, selectedName, dateRange, selectedYear, availableFilters]);

  const monthlyData = useMemo(() => {
    const monthNames = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];

    const monthlyTotals = {};

    invoices.forEach(inv => {
      const month = inv.mes;
      if (month >= 1 && month <= 12) {
        const monthName = monthNames[month - 1];
        if (!monthlyTotals[monthName]) {
          monthlyTotals[monthName] = 0;
        }
        monthlyTotals[monthName] += inv['monto_total'] || 0;
      }
    });

    return Object.entries(monthlyTotals)
      .map(([mes, total]) => ({
        mes,
        total: total / 1000000
      }))
      .sort((a, b) => monthNames.indexOf(a.mes) - monthNames.indexOf(b.mes));
  }, [invoices]);

  const detailedMonthlyData = useMemo(() => {
    const monthNames = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];

    const monthlyProductTotals = {};

    invoices.forEach(inv => {
      const month = inv.mes;
      const producto = inv['producto'];

      if (month >= 1 && month <= 12) {
        const monthName = monthNames[month - 1];

        if (!monthlyProductTotals[monthName]) {
          monthlyProductTotals[monthName] = {};
        }
        if (!monthlyProductTotals[monthName][producto]) {
          monthlyProductTotals[monthName][producto] = 0;
        }
        monthlyProductTotals[monthName][producto] += inv['monto_total'] || 0;
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
    invoices.forEach(inv => {
      const producto = inv['producto'] || 'Sin Producto';
      if (producto !== 0) products.add(producto);
    });
    return Array.from(products);
  }, [invoices]);

  const summaryData = useMemo(() => {
    const summary = {};

    invoices.forEach(inv => {
      const key = inv['producto'];
      if (!summary[key]) {
        summary[key] = 0;
      }
      summary[key] += inv['monto_total'] || 0;
    });

    return Object.entries(summary)
      .map(([name, total], index) => ({
        name,
        total,
        color: colors[index % colors.length]
      }))
      .sort((a, b) => b.total - a.total);
  }, [invoices]);

  const totalGeneral = useMemo(() => {
    return invoices.reduce((sum, inv) => sum + (inv['monto_total'] || 0), 0);
  }, [invoices]);

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

  return (
    <Box sx={{
      p: 3,
      bgcolor: '#f8fafc',
      minHeight: '100vh',
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif'
    }}>
      {/* Filtros */}
      <Paper sx={{ p: 2, mb: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 3 }}>
            <Typography variant="caption" sx={{ color: '#64748b', mb: 0.5, display: 'block' }}>
              Responsable
            </Typography>
            <FormControl fullWidth size="small">
              <Select
                value={selectedPerson}
                onChange={(e) => setSelectedPerson(e.target.value)}
              >
                {availableFilters.responsables.map(resp => (
                  <MenuItem key={resp} value={resp}>{resp}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, sm: 3 }}>
            <Typography variant="caption" sx={{ color: '#64748b', mb: 0.5, display: 'block' }}>
              Producto
            </Typography>
            <FormControl fullWidth size="small">
              <Select
                value={selectedName}
                onChange={(e) => setSelectedName(e.target.value)}
              >
                {availableFilters.productos.map(prod => (
                  <MenuItem key={prod} value={prod}>{prod}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, sm: 3 }}>
            <Typography variant="caption" sx={{ color: '#64748b', mb: 0.5, display: 'block' }}>
              Trimestre
            </Typography>
            <FormControl fullWidth size="small">
              <Select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
              >
                {availableFilters.trimestres.map(q => (
                  <MenuItem key={q} value={q}>Q{q}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, sm: 3 }}>
            <Typography variant="caption" sx={{ color: '#64748b', mb: 0.5, display: 'block' }}>
              Año
            </Typography>
            <FormControl fullWidth size="small">
              <Select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
              >
                {availableFilters.anios.map(year => (
                  <MenuItem key={year} value={year}>{year}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {invoices.length === 0 ? (
        <Alert severity="warning">
          No se encontraron facturas con los filtros seleccionados.
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {/* Panel de resumen */}
          <Grid size={{ xs: 12, sm: 3 }}>
            <Paper sx={{ p: 2, height: '100%', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#0f172a' }}>
                Total
              </Typography>

              <Box sx={{ mb: 3 }}>
                <Typography variant="h3" sx={{
                  fontWeight: 700,
                  color: '#0f172a',
                  mb: 0.5
                }}>
                  ${(totalGeneral / 1000000).toFixed(2)}M
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  Millones USD
                </Typography>
              </Box>

              <Box sx={{ maxHeight: 600, overflowY: 'auto' }}>
                <List sx={{ p: 0 }}>
                  {summaryData.map((item, index) => (
                    <ListItem
                      key={index}
                      sx={{
                        px: 0,
                        py: 1.5,
                        borderBottom: index < summaryData.length - 1 ? '1px solid #e2e8f0' : 'none'
                      }}
                    >
                      <Box sx={{
                        width: 4,
                        height: 24,
                        bgcolor: item.color,
                        mr: 2,
                        borderRadius: 1
                      }} />
                      <ListItemText
                        primary={
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#0f172a' }}>
                            {item.name}
                          </Typography>
                        }
                        secondary={
                          <Typography variant="caption" sx={{ color: '#64748b' }}>
                            ${item.total.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                          </Typography>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            </Paper>
          </Grid>

          {/* Gráficos */}
          <Grid size={{ xs: 12, sm: 9 }}>
            <Paper sx={{ p: 3, mb: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: '#0f172a' }}>
                Total por Mes
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="mes" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px'
                    }}
                    formatter={(value) => `$${value.toFixed(2)}M`}
                  />
                  <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Paper>

            <Paper sx={{ p: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 600, color: '#0f172a' }}>
                Total por Mes y Producto
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {uniqueProducts.map((name, idx) => (
                  <Chip
                    key={name}
                    label={name}
                    size="small"
                    sx={{
                      bgcolor: colors[idx % colors.length],
                      color: 'white',
                      fontWeight: 500
                    }}
                  />
                ))}
              </Box>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={detailedMonthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="mes" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px'
                    }}
                    formatter={(value) => `$${value.toFixed(2)}M`}
                  />
                  {uniqueProducts.map((product, idx) => (
                    <Bar
                      key={product}
                      dataKey={product}
                      stackId="a"
                      fill={colors[idx % colors.length]}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default GeneralDashboard;