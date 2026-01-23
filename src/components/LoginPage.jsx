import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    TextField,
    Button,
    Typography,
    Paper,
    InputAdornment,
    IconButton,
    Box,
    Alert
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';

import { useAuth } from '../contexts/AuthContext';

const LoginPage = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await login(username, password);

            if (result.success) {
                // Redirigir según el tipo de usuario
                const userData = JSON.parse(localStorage.getItem('user'));
                if (userData.esLider) {
                    navigate('/');
                } else {
                    navigate('/dashboard');
                }
            } else {
                setError(result.message || 'Credenciales incorrectas');
            }
        } catch (err) {
            setError('Error al iniciar sesión');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh',
                backgroundColor: '#f8fafc',
            }}
        >
            <Paper
                elevation={0}
                sx={{
                    width: '100%',
                    maxWidth: '420px',
                    p: 5,
                    mx: 3,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    borderRadius: '12px',
                }}
            >
                <Typography
                    variant="h4"
                    sx={{
                        fontWeight: 700,
                        color: '#0f172a',
                        mb: 1,
                        fontFamily: '"Satoshi", sans-serif',
                        letterSpacing: '-0.02em',
                        textAlign: 'center'
                    }}
                >
                    Iniciar Sesión
                </Typography>
                <Typography
                    variant="body2"
                    sx={{
                        color: '#64748b',
                        mb: 4,
                        textAlign: 'center'
                    }}
                >
                    Ingresa tus credenciales para acceder
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                        {error}
                    </Alert>
                )}

                <form onSubmit={handleSubmit}>
                    <Box sx={{ mb: 3 }}>
                        <Typography
                            variant="caption"
                            sx={{
                                display: 'block',
                                mb: 1,
                                color: '#64748b',
                                fontWeight: 500,
                            }}
                        >
                            Nombre de usuario
                        </Typography>
                        <TextField
                            fullWidth
                            placeholder="Usuario"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            disabled={loading}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    backgroundColor: '#ffffff',
                                    borderRadius: '8px',
                                    '& fieldset': {
                                        borderColor: '#e2e8f0',
                                    },
                                    '&:hover fieldset': {
                                        borderColor: '#cbd5e1',
                                    },
                                    '&.Mui-focused fieldset': {
                                        borderColor: '#3b82f6',
                                    },
                                },
                                '& .MuiOutlinedInput-input': {
                                    padding: '12px 14px',
                                    fontSize: '0.95rem',
                                },
                            }}
                        />
                    </Box>

                    <Box sx={{ mb: 4 }}>
                        <Typography
                            variant="caption"
                            sx={{
                                display: 'block',
                                mb: 1,
                                color: '#64748b',
                                fontWeight: 500,
                            }}
                        >
                            Contraseña
                        </Typography>
                        <TextField
                            fullWidth
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={loading}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={() => setShowPassword(!showPassword)}
                                            edge="end"
                                            sx={{
                                                color: '#64748b',
                                                '&:hover': {
                                                    color: '#0f172a',
                                                },
                                            }}
                                        >
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    backgroundColor: '#ffffff',
                                    borderRadius: '8px',
                                    '& fieldset': {
                                        borderColor: '#e2e8f0',
                                    },
                                    '&:hover fieldset': {
                                        borderColor: '#cbd5e1',
                                    },
                                    '&.Mui-focused fieldset': {
                                        borderColor: '#3b82f6',
                                    },
                                },
                                '& .MuiOutlinedInput-input': {
                                    padding: '12px 14px',
                                    fontSize: '0.95rem',
                                },
                            }}
                        />
                    </Box>

                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        disabled={loading}
                        sx={{
                            py: 1.5,
                            borderRadius: '8px',
                            fontSize: '0.95rem',
                            fontWeight: 600,
                            textTransform: 'none',
                            backgroundColor: '#3b82f6',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                            '&:hover': {
                                backgroundColor: '#2563eb',
                            },
                        }}
                    >
                        {loading ? 'Ingresando...' : 'Ingresar'}
                    </Button>
                </form>
            </Paper>
        </Box>
    );
};

export default LoginPage;