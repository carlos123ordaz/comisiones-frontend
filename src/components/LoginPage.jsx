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
import { colorTokens } from '../theme';

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
                const userData = JSON.parse(localStorage.getItem('user'));
                navigate(userData.esLider ? '/' : '/dashboard');
            } else {
                setError(result.message || 'Credenciales incorrectas');
            }
        } catch (err) {
            setError('Error al iniciar sesiÃ³n');
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
                px: 3,
                backgroundColor: 'background.default',
                backgroundImage: 'radial-gradient(circle at top left, rgba(78, 124, 221, 0.12), transparent 32%), linear-gradient(180deg, rgba(11, 61, 92, 0.05), transparent 42%)',
            }}
        >
            <Paper
                sx={{
                    width: '100%',
                    maxWidth: 460,
                    p: 5,
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                <Box sx={{ position: 'absolute', inset: 0, height: 6, bgcolor: colorTokens.brand }} />

                <Typography variant="h4" sx={{ color: colorTokens.brand, mb: 1, textAlign: 'center' }}>
                    Iniciar SesiÃ³n
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4, textAlign: 'center' }}>
                    Acceso seguro al panel corporativo de comisiones
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                        {error}
                    </Alert>
                )}

                <form onSubmit={handleSubmit}>
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="caption" sx={{ display: 'block', mb: 1, color: 'text.secondary', fontWeight: 600 }}>
                            Usuario
                        </Typography>
                        <TextField
                            fullWidth
                            placeholder="Ingresa tu usuario"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            disabled={loading}
                            sx={{ '& .MuiOutlinedInput-input': { padding: '12px 14px', fontSize: '0.95rem' } }}
                        />
                    </Box>

                    <Box sx={{ mb: 4 }}>
                        <Typography variant="caption" sx={{ display: 'block', mb: 1, color: 'text.secondary', fontWeight: 600 }}>
                            ContraseÃ±a
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
                                                color: 'text.secondary',
                                                '&:hover': { color: colorTokens.brand },
                                            }}
                                        >
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                            sx={{ '& .MuiOutlinedInput-input': { padding: '12px 14px', fontSize: '0.95rem' } }}
                        />
                    </Box>

                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        disabled={loading}
                        sx={{
                            py: 1.5,
                            fontSize: '0.95rem',
                            bgcolor: colorTokens.action,
                            '&:hover': { bgcolor: colorTokens.support },
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
