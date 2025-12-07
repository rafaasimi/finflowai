import React, { useState, useEffect, useContext } from 'react';
import { QueryClient, QueryClientProvider, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { HashRouter, Routes, Route, Navigate, NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Receipt, PiggyBank, LogOut, Menu, X, Sparkles, Sun, Moon } from 'lucide-react';
import { mockApi } from './services/mockDb';
import { supabaseService } from './services/supabaseService';
import { supabase } from './services/supabaseClient';
import { api, setApiProvider } from './services/api'; // Use unified API
import { Button, Input, Card, CardContent, CardHeader, CardTitle } from './components/ui';
import { Dashboard } from './pages/Dashboard';
import { Transactions } from './pages/Transactions';
import { Budgets } from './pages/Budgets';
import { User } from './types';
import { cn } from './lib/utils';
import { FinancialAdvisor } from './pages/FinancialAdvisor';

const queryClient = new QueryClient();

// --- Theme Context ---
type Theme = 'light' | 'dark';

const ThemeContext = React.createContext<{
  theme: Theme;
  toggleTheme: () => void;
}>({
  theme: 'light',
  toggleTheme: () => {},
});

function ThemeProvider({ children }: { children?: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem('finflow_theme');
    if (stored === 'dark' || stored === 'light') return stored;
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('finflow_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

const useTheme = () => useContext(ThemeContext);


// --- Auth Context ---
const AuthContext = React.createContext<{ user: User | null; login: (email: string, password: string) => Promise<void>; logout: () => Promise<void>; isLoading: boolean } | null>(null);

function AuthProvider({ children }: { children?: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const checkSession = async () => {
      // 1. Check Mock Session
      const mockUser = await mockApi.getSession();
      if (mockUser) {
        setApiProvider('mock');
        setUser(mockUser);
        setLoading(false);
        return;
      }

      // 2. Check Supabase Session
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setApiProvider('supabase');
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
        });
      }
      setLoading(false);
    };

    checkSession();

    // Listen to Supabase Auth Changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session) {
            // If supabase event fires, prioritize it unless we are explicitly in mock mode?
            // For simplicity, if Supabase authenticates, we use it.
            setApiProvider('supabase');
            setUser({
                id: session.user.id,
                email: session.user.email || '',
                name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
            });
        }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    // Hybrid Login Logic
    
    // 1. Check for Mock User
    if (email === 'finflow@teste.com') {
        try {
            const u = await mockApi.login(email, password);
            setApiProvider('mock');
            setUser(u);
            return;
        } catch (e) {
            throw new Error("Credenciais inválidas para conta de teste.");
        }
    }

    // 2. Try Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        console.error("Supabase login error:", error);
        throw new Error("Falha no login. Verifique suas credenciais.");
    }

    if (data.user) {
        setApiProvider('supabase');
        setUser({
            id: data.user.id,
            email: data.user.email || '',
            name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User',
        });
    }
  };

  const logout = async () => {
    const provider = api.getProvider();
    if (provider === 'mock') {
        await mockApi.logout();
    } else {
        await supabaseService.logout();
    }
    setUser(null);
    localStorage.removeItem('finflow_provider');
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-background"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;

  return <AuthContext.Provider value={{ user, login, logout, isLoading: loading }}>{children}</AuthContext.Provider>;
}

const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

// Login Page
function LoginPage() {
  const { login, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // If already logged in, redirect to dashboard
  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || "Erro ao realizar login");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-background p-4 transition-colors">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-primary">FinFlow AI</CardTitle>
          <p className="text-center text-muted-foreground">Entre para gerenciar suas finanças</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">E-mail</label>
              <Input 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required 
                placeholder="exemplo@email.com" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Senha</label>
              <Input 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
                placeholder="********" 
              />
            </div>
            {error && <div className="text-sm text-red-500">{error}</div>}
            
            <Button type="submit" className="w-full" isLoading={isSubmitting}>
              Entrar
            </Button>
            
            <div className="text-xs text-center text-muted-foreground mt-4 p-2 bg-muted rounded">
                <p><strong>Usuário Teste (Mock):</strong> finflow@teste.com / teste123</p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// Layout
function AppLayout({ children }: { children?: React.ReactNode }) {
  const { logout, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { icon: LayoutDashboard, label: 'Painel', path: '/' },
    { icon: Receipt, label: 'Transações', path: '/transactions' },
    { icon: PiggyBank, label: 'Orçamentos', path: '/budgets' },
    { icon: Sparkles, label: 'Consultor IA', path: '/advisor' },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row transition-colors duration-300">
      {/* Mobile Header */}
      <div className="md:hidden bg-sidebar border-b border-sidebar-border p-4 flex justify-between items-center sticky top-0 z-20 text-sidebar-foreground">
        <span className="font-bold text-lg">FinFlow</span>
        <button onClick={() => setSidebarOpen(!isSidebarOpen)}>
          {isSidebarOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-10 w-64 bg-sidebar border-r border-sidebar-border text-sidebar-foreground transform transition-transform duration-200 ease-in-out md:translate-x-0 md:relative",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-sidebar-border">
            <h1 className="text-2xl font-bold flex items-center gap-2">
                <div className="w-8 h-8 bg-sidebar-primary rounded-lg text-sidebar-primary-foreground flex items-center justify-center text-sm">FF</div>
                FinFlow
            </h1>
          </div>
          
          <nav className="flex-1 p-4 space-y-2">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) => cn(
                  "flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors",
                  isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                )}
              >
                <item.icon size={20} />
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="p-4 border-t border-sidebar-border bg-sidebar space-y-2">
            
            {/* User Info */}
            <div className="flex items-center gap-3 mb-2 px-2">
                <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center text-sidebar-foreground font-bold border border-sidebar-border">
                    {user?.name.charAt(0).toUpperCase()}
                </div>
                <div className="text-sm overflow-hidden">
                    <p className="font-medium truncate">{user?.name}</p>
                    <p className="text-xs text-sidebar-foreground/70 truncate">{user?.email}</p>
                </div>
            </div>

            {/* Theme Toggle */}
            <Button 
                variant="ghost" 
                className="w-full justify-start gap-2 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                onClick={toggleTheme}
            >
                {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
                <span>{theme === 'light' ? 'Modo Escuro' : 'Modo Claro'}</span>
            </Button>

            {/* Logout */}
            <Button variant="outline" className="w-full justify-start gap-2 border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" onClick={logout}>
              <LogOut size={16} /> Sair
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto h-[calc(100vh-64px)] md:h-screen">
        <div className="max-w-7xl mx-auto space-y-6">
            {children}
        </div>
      </main>

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
            className="fixed inset-0 bg-black/20 z-0 md:hidden"
            onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}

function PrivateRoute({ children }: { children?: React.ReactNode }) {
  const { user } = useAuth();
  return user ? <AppLayout>{children}</AppLayout> : <Navigate to="/login" />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
            <HashRouter>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                <Route path="/transactions" element={<PrivateRoute><Transactions /></PrivateRoute>} />
                <Route path="/budgets" element={<PrivateRoute><Budgets /></PrivateRoute>} />
                <Route path="/advisor" element={<PrivateRoute><FinancialAdvisor /></PrivateRoute>} />
            </Routes>
            </HashRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}