import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService, User } from '../services/auth.service';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

interface RegisterData {
  name: string;
  document: string;
  documentType?: 'CPF' | 'CNPJ' | 'ID_ESTRANGEIRO';
  email: string;
  password: string;
  confirmPassword: string;
  bio?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const checkAuth = async () => {
    try {
      const token = authService.getToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      const userData = await authService.getProfile();
      
      if (userData.role !== 'CHEF') {
        authService.logout();
        setUser(null);
        setIsLoading(false);
        return;
      }

      setUser(userData);
      authService.setUser(userData);
    } catch (error) {
      authService.logout();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await authService.login({ email, password });
      authService.setToken(response.access_token);

      const userData = await authService.getProfile();
      
      if (userData.role !== 'CHEF') {
        authService.logout();
        throw new Error('Apenas chefs podem acessar a plataforma');
      }

      setUser(userData);
      authService.setUser(userData);
      navigate('/dashboard');
    } catch (error) {
      throw error;
    }
  };

  const register = async (data: RegisterData) => {
    try {
      if (data.password !== data.confirmPassword) {
        throw new Error('As senhas não coincidem');
      }

      const documentType = data.documentType || determineDocumentType(data.document);

      const registerData = {
        name: data.name,
        document: data.document.replace(/\D/g, ''),
        documentType,
        email: data.email,
        passwordHash: data.password,
        role: 'CHEF' as const,
        chefProfile: {
          bio: data.bio || '',
        },
      };

      await authService.register(registerData);
      
      await login(data.email, data.password);
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    navigate('/');
  };

  const determineDocumentType = (document: string): 'CPF' | 'CNPJ' | 'ID_ESTRANGEIRO' => {
    const cleanDoc = document.replace(/\D/g, '');
    
    if (cleanDoc.length === 11) {
      return 'CPF';
    } else if (cleanDoc.length === 14) {
      return 'CNPJ';
    } else {
      return 'ID_ESTRANGEIRO';
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

