import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Moon, Sun } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Button, Alert } from './ui';

const LoginPage = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const { isDark, toggleTheme } = useTheme();
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
        } catch {
            setError('Error al iniciar sesión');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-n-50 px-4 relative"
            style={{ backgroundImage: 'radial-gradient(circle at top left, rgba(79,70,229,0.10), transparent 40%)' }}>

            {/* Theme toggle */}
            <button
                onClick={toggleTheme}
                title={isDark ? 'Modo claro' : 'Modo oscuro'}
                className="fixed top-4 right-4 w-8 h-8 rounded-full bg-n-0 border border-n-200 flex items-center justify-center text-n-500 hover:text-n-800 hover:border-n-300 transition-all shadow-sm"
            >
                {isDark ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            {/* Card */}
            <div className="card w-full max-w-[420px] p-8 relative overflow-hidden">
                {/* accent bar */}
                <div className="absolute inset-x-0 top-0 h-[3px] bg-brand-600 rounded-t-[12px]" />

                {/* Logo + title */}
                <div className="flex flex-col items-center mb-7 mt-1">
                    <div className="w-10 h-10 rounded-[10px] bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center mb-4 shadow-[0_4px_12px_rgba(79,70,229,0.3)]">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M2 17l10 5 10-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M2 12l10 5 10-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </div>
                    <h1 className="text-[18px] font-[700] text-n-900 tracking-[-0.014em]">Iniciar Sesión</h1>
                    <p className="text-[12.5px] text-n-500 mt-1">Panel corporativo de comisiones</p>
                </div>

                {error && (
                    <Alert severity="error" onClose={() => setError('')} className="mb-4">
                        {error}
                    </Alert>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    {/* Usuario */}
                    <div>
                        <label className="block text-[11.5px] font-[600] text-n-600 mb-1.5">Usuario</label>
                        <div className="ring-focus flex items-center bg-n-0 border border-n-200 rounded-[6px] h-[36px] px-[10px] transition-all">
                            <input
                                type="text"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                placeholder="Ingresa tu usuario"
                                required
                                disabled={loading}
                                className="flex-1 bg-transparent border-none outline-none text-[13px] text-n-900 min-w-0"
                            />
                        </div>
                    </div>

                    {/* Contraseña */}
                    <div>
                        <label className="block text-[11.5px] font-[600] text-n-600 mb-1.5">Contraseña</label>
                        <div className="ring-focus flex items-center bg-n-0 border border-n-200 rounded-[6px] h-[36px] px-[10px] transition-all">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                disabled={loading}
                                className="flex-1 bg-transparent border-none outline-none text-[13px] text-n-900 min-w-0"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(v => !v)}
                                className="text-n-400 hover:text-n-600 transition-colors ml-2 shrink-0"
                            >
                                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                            </button>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                        disabled={loading}
                        className="w-full justify-center mt-1"
                    >
                        {loading ? <><Loader2 size={15} className="animate-spin mr-1.5" />Ingresando...</> : 'Ingresar'}
                    </Button>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;
