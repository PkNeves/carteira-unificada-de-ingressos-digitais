import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Card, Input, Button, Alert, Container } from '../components/ui';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await api.post('/auth/user/login', { email, password });
      const { token, user } = response.data;
      
      login(token, user);
      navigate('/dashboard');
    } catch (error: any) {
      setMessage(error.response?.data?.error || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  const isError = message.includes('Erro') || message.includes('inválid');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Container maxWidth="sm">
        <Card className="p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">
            Login
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="seu@email.com"
            />
            <Input
              type="password"
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Digite sua senha"
            />
            <Button
              type="submit"
              variant="primary"
              className="w-full"
              isLoading={loading}
              disabled={loading}
            >
              Entrar
            </Button>
          </form>
          {message && (
            <Alert
              variant={isError ? 'error' : 'success'}
              className="mt-4"
              onClose={() => setMessage('')}
            >
              {message}
            </Alert>
          )}
          <p className="mt-6 text-center text-sm text-gray-600">
            Não tem conta?{' '}
            <Link
              to="/register"
              className="font-medium text-primary hover:text-primary-dark transition-colors"
            >
              Cadastre-se
            </Link>
          </p>
        </Card>
      </Container>
    </div>
  );
}

