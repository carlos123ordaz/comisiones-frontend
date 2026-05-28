import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Spinner } from './ui';

export const ProtectedRoute = ({ children, requireAdmin = false }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Spinner size={36} />
            </div>
        );
    }

    if (!user) return <Navigate to="/login" replace />;
    if (requireAdmin && !user.esLider) return <Navigate to="/dashboard" replace />;

    return children;
};
