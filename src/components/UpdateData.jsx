import React, { useState } from 'react';
import axios from 'axios';
import { invoke } from '@tauri-apps/api/core';
import {
    Box,
    Button,
    Typography,
    Alert,
    CircularProgress,
    Paper,
    Stack,
    styled
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { URI_API } from '../config/api';
import { colorTokens } from '../theme';

const DropZone = styled(Box)(({ theme, isDragging }) => ({
    border: `1px dashed ${isDragging ? colorTokens.support : colorTokens.borderStrong}`,
    borderRadius: theme.spacing(1.5),
    padding: theme.spacing(6),
    textAlign: 'center',
    backgroundColor: isDragging ? alpha(colorTokens.support, 0.08) : colorTokens.surfaceMuted,
    transition: 'all 0.25s ease',
    cursor: 'pointer',
    '&:hover': {
        borderColor: colorTokens.support,
        backgroundColor: alpha(colorTokens.support, 0.08),
    },
}));

export const UpdateData = () => {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [isDragging, setIsDragging] = useState(false);

    const handleFileChange = (selectedFile) => {
        if (!selectedFile) return;

        if (!selectedFile.name.endsWith('.csv')) {
            setMessage({ type: 'error', text: 'Por favor selecciona un archivo CSV vÃ¡lido' });
            return;
        }

        if (selectedFile.size > 25 * 1024 * 1024) {
            setMessage({ type: 'error', text: 'El archivo excede el tamaÃ±o mÃ¡ximo de 25 MB' });
            return;
        }

        setFile(selectedFile);
        setMessage({ type: '', text: '' });
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        handleFileChange(e.dataTransfer.files[0]);
    };

    const handleInputChange = (event) => {
        handleFileChange(event.target.files[0]);
    };

    const removeFile = () => {
        setFile(null);
        setMessage({ type: '', text: '' });
    };

    const executeReport = async () => {
        try {
            setLoading(true);
            setMessage({ type: 'info', text: 'Consultando base de datos local...' });

            let dbData = null;
            try {
                dbData = await invoke('query_database');
                setMessage({
                    type: 'info',
                    text: `âœ… ${dbData.length} registros obtenidos. Enviando al servidor...`
                });
            } catch (error) {
                console.error('Error consultando BD:', error);
                setMessage({
                    type: 'warning',
                    text: `âš ï¸ No se pudo consultar la BD: ${error}. Continuando solo con archivo CSV...`
                });
            }

            const formData = new FormData();
            if (file) formData.append('file', file);
            if (dbData) formData.append('ventas_data', JSON.stringify(dbData));

            if (!file && !dbData) {
                setMessage({ type: 'error', text: 'No se pudo obtener datos ni del archivo ni de la base de datos' });
                setLoading(false);
                return;
            }

            const response = await axios.post(`${URI_API}/invoices/execute_report`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            setMessage({
                type: 'success',
                text: response.data.message || 'âœ… Reporte generado exitosamente'
            });
            setFile(null);
        } catch (error) {
            setMessage({
                type: 'error',
                text: error.response?.data?.detail || error.message || 'Error al actualizar los datos'
            });
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ maxWidth: 760, mx: 'auto', mt: 4, p: 3 }}>
            <Paper sx={{ p: 5, borderRadius: 3 }}>
                <Typography variant="h5" component="h2" fontWeight={600} gutterBottom color={colorTokens.brand}>
                    Actualizar Datos de Invoices
                </Typography>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                    Sube el reporte actualizado desde Bitrix de forma opcional. Al iniciar el proceso, la app tambiÃ©n consultarÃ¡ la base de datos local.
                </Typography>

                <Stack spacing={3}>
                    {!file ? (
                        <DropZone
                            isDragging={isDragging}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                        >
                            <CloudUploadIcon sx={{ fontSize: 60, color: isDragging ? colorTokens.action : colorTokens.textSecondary, mb: 2 }} />

                            <Typography variant="h6" gutterBottom fontWeight={600} color={colorTokens.textPrimary}>
                                Arrastra y suelta el archivo aquÃ­
                            </Typography>

                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                TamaÃ±o mÃ¡ximo: 25 MB • Formato: CSV
                            </Typography>

                            <Typography variant="caption" color="text.secondary" sx={{ mb: 3, display: 'block' }}>
                                Si no subes un archivo, se intentarÃ¡ trabajar con la informaciÃ³n disponible localmente.
                            </Typography>

                            <Button component="label" variant="outlined" disabled={loading} sx={{ px: 4, py: 1 }}>
                                Buscar Archivo
                                <input type="file" hidden accept=".csv" onChange={handleInputChange} />
                            </Button>
                        </DropZone>
                    ) : (
                        <Paper sx={{ p: 3, borderRadius: 2, backgroundColor: colorTokens.surfaceMuted }}>
                            <Stack direction="row" alignItems="center" spacing={2}>
                                <Box sx={{ p: 1.5, backgroundColor: alpha(colorTokens.info, 0.10), borderRadius: 2, display: 'flex' }}>
                                    <InsertDriveFileIcon sx={{ color: colorTokens.info, fontSize: 30 }} />
                                </Box>

                                <Box sx={{ flexGrow: 1 }}>
                                    <Typography variant="body1" fontWeight={600}>
                                        {file.name}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {(file.size / 1024).toFixed(2)} KB
                                    </Typography>
                                </Box>

                                <CheckCircleIcon sx={{ color: colorTokens.accentTeal, fontSize: 28 }} />

                                <Button size="small" onClick={removeFile} disabled={loading} sx={{ minWidth: 'auto', p: 0.5 }}>
                                    <CloseIcon />
                                </Button>
                            </Stack>
                        </Paper>
                    )}

                    {message.text && (
                        <Alert severity={message.type} onClose={() => setMessage({ type: '', text: '' })}>
                            {message.text}
                        </Alert>
                    )}

                    <Stack direction="row" spacing={2} justifyContent="flex-end">
                        <Button variant="outlined" onClick={removeFile} disabled={loading || !file} sx={{ px: 4, py: 1.5 }}>
                            Cancelar
                        </Button>

                        <Button variant="contained" onClick={executeReport} disabled={loading} sx={{ px: 4, py: 1.5 }}>
                            {loading ? (
                                <>
                                    <CircularProgress size={20} sx={{ mr: 1, color: 'inherit' }} />
                                    Procesando...
                                </>
                            ) : (
                                'Actualizar Datos'
                            )}
                        </Button>
                    </Stack>
                </Stack>
            </Paper>
        </Box>
    );
};
