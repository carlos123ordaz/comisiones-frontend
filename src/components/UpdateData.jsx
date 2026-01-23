// src/components/UpdateData.jsx

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
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { URI_API } from '../config/api';

const DropZone = styled(Box)(({ theme, isDragging }) => ({
    border: `2px dashed ${isDragging ? theme.palette.primary.main : '#cbd5e1'}`,
    borderRadius: theme.spacing(2),
    padding: theme.spacing(6),
    textAlign: 'center',
    backgroundColor: isDragging ? '#f0f9ff' : '#f8fafc',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
    '&:hover': {
        borderColor: theme.palette.primary.main,
        backgroundColor: '#f0f9ff',
    },
}));

export const UpdateData = () => {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [isDragging, setIsDragging] = useState(false);

    const handleFileChange = (selectedFile) => {
        if (selectedFile) {
            if (!selectedFile.name.endsWith('.csv')) {
                setMessage({
                    type: 'error',
                    text: 'Por favor selecciona un archivo CSV válido'
                });
                return;
            }

            if (selectedFile.size > 25 * 1024 * 1024) {
                setMessage({
                    type: 'error',
                    text: 'El archivo excede el tamaño máximo de 25 MB'
                });
                return;
            }

            setFile(selectedFile);
            setMessage({ type: '', text: '' });
        }
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
        const droppedFile = e.dataTransfer.files[0];
        handleFileChange(droppedFile);
    };

    const handleInputChange = (event) => {
        const selectedFile = event.target.files[0];
        handleFileChange(selectedFile);
    };

    const removeFile = () => {
        setFile(null);
        setMessage({ type: '', text: '' });
    };

    const executeReport = async () => {
        try {
            setLoading(true);
            setMessage({ type: 'info', text: 'Consultando base de datos local...' });

            // 1. Consultar la base de datos automáticamente
            let dbData = null;
            try {
                dbData = await invoke('query_database');
                setMessage({
                    type: 'info',
                    text: `✅ ${dbData.length} registros obtenidos. Enviando al servidor...`
                });
            } catch (error) {
                console.error('Error consultando BD:', error);
                setMessage({
                    type: 'warning',
                    text: `⚠️ No se pudo consultar la BD: ${error}. Continuando solo con archivo CSV...`
                });
            }
            const formData = new FormData();
            if (file) {
                formData.append('file', file);
            }

            if (dbData) {
                formData.append('ventas_data', JSON.stringify(dbData));
            }

            if (!file && !dbData) {
                setMessage({
                    type: 'error',
                    text: 'No se pudo obtener datos ni del archivo ni de la base de datos'
                });
                setLoading(false);
                return;
            }
            console.log(dbData);

            const response = await axios.post(
                `${URI_API}/invoices/execute_report`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );

            setMessage({
                type: 'success',
                text: response.data.message || '✅ Reporte generado exitosamente'
            });

            // Limpiar archivo
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
        <Box sx={{ maxWidth: 700, mx: 'auto', mt: 4, p: 3 }}>
            <Paper elevation={0} sx={{ p: 5, border: '1px solid #e2e8f0', borderRadius: 3 }}>
                <Typography variant="h5" component="h2" fontWeight={600} gutterBottom>
                    Actualizar Datos de Invoices
                </Typography>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                    Sube el reporte actualizado desde Bitrix (opcional). Al hacer clic en "Actualizar Datos",
                    se consultará automáticamente la base de datos local.
                </Typography>

                <Stack spacing={3}>
                    {/* Drop Zone para CSV */}
                    {!file ? (
                        <DropZone
                            isDragging={isDragging}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                        >
                            <CloudUploadIcon
                                sx={{
                                    fontSize: 60,
                                    color: isDragging ? 'primary.main' : '#94a3b8',
                                    mb: 2
                                }}
                            />

                            <Typography variant="h6" gutterBottom fontWeight={500}>
                                Arrastra y suelta tu archivo aquí
                            </Typography>

                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                Tamaño máximo: 25 MB • Formato: CSV
                            </Typography>

                            <Typography variant="caption" color="text.secondary" sx={{ mb: 3, display: 'block' }}>
                                (Opcional - Si no subes archivo, se usará el anterior)
                            </Typography>

                            <Button
                                component="label"
                                variant="outlined"
                                disabled={loading}
                                sx={{
                                    textTransform: 'none',
                                    px: 4,
                                    py: 1,
                                    borderRadius: 2
                                }}
                            >
                                Buscar Archivo
                                <input
                                    type="file"
                                    hidden
                                    accept=".csv"
                                    onChange={handleInputChange}
                                />
                            </Button>
                        </DropZone>
                    ) : (
                        <Paper
                            elevation={0}
                            sx={{
                                p: 3,
                                border: '1px solid #e2e8f0',
                                borderRadius: 2,
                                backgroundColor: '#f8fafc'
                            }}
                        >
                            <Stack direction="row" alignItems="center" spacing={2}>
                                <Box
                                    sx={{
                                        p: 1.5,
                                        backgroundColor: '#e0f2fe',
                                        borderRadius: 2,
                                        display: 'flex'
                                    }}
                                >
                                    <InsertDriveFileIcon sx={{ color: '#0284c7', fontSize: 30 }} />
                                </Box>

                                <Box sx={{ flexGrow: 1 }}>
                                    <Typography variant="body1" fontWeight={500}>
                                        {file.name}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {(file.size / 1024).toFixed(2)} KB
                                    </Typography>
                                </Box>

                                <CheckCircleIcon sx={{ color: '#22c55e', fontSize: 28 }} />

                                <Button
                                    size="small"
                                    onClick={removeFile}
                                    disabled={loading}
                                    sx={{ minWidth: 'auto', p: 0.5 }}
                                >
                                    <CloseIcon />
                                </Button>
                            </Stack>
                        </Paper>
                    )}

                    {/* Mensajes */}
                    {message.text && (
                        <Alert
                            severity={message.type}
                            onClose={() => setMessage({ type: '', text: '' })}
                            sx={{ borderRadius: 2 }}
                        >
                            {message.text}
                        </Alert>
                    )}
                    {/* Botones de acción */}
                    <Stack direction="row" spacing={2} justifyContent="flex-end">
                        <Button
                            variant="outlined"
                            onClick={removeFile}
                            disabled={loading || !file}
                            sx={{
                                textTransform: 'none',
                                px: 4,
                                py: 1.5,
                                borderRadius: 2
                            }}
                        >
                            Cancelar
                        </Button>

                        <Button
                            variant="contained"
                            onClick={executeReport}
                            disabled={loading}
                            sx={{
                                textTransform: 'none',
                                px: 4,
                                py: 1.5,
                                borderRadius: 2,
                                boxShadow: 2
                            }}
                        >
                            {loading ? (
                                <>
                                    <CircularProgress size={20} sx={{ mr: 1 }} />
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