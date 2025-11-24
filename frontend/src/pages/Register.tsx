import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { Card, Input, Button, Alert, Container } from "../components/ui";

export function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const navigate = useNavigate();
  const { login } = useAuth();

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!email) {
      newErrors.email = "Email é obrigatório";
    }

    if (!password) {
      newErrors.password = "Senha é obrigatória";
    } else if (password.length < 6) {
      newErrors.password = "Senha deve ter no mínimo 6 caracteres";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Confirmação de senha é obrigatória";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Senhas não coincidem";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setErrors({});

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/auth/user/register", {
        email,
        password,
        confirmPassword,
      });

      const { token, user } = response.data;
      login(token, user);
      navigate("/dashboard");
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || "Erro ao criar conta";
      setMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const isError =
    message.includes("Erro") ||
    message.includes("já existe") ||
    message.includes("não coincidem");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Container maxWidth="sm">
        <Card className="p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">
            Criar Conta
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              label="Email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors({ ...errors, email: "" });
              }}
              error={errors.email}
              required
              placeholder="seu@email.com"
            />
            <Input
              type="password"
              label="Password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors({ ...errors, password: "" });
                if (
                  errors.confirmPassword &&
                  e.target.value === confirmPassword
                ) {
                  setErrors({ ...errors, confirmPassword: "" });
                }
              }}
              error={errors.password}
              helperText="Mínimo 6 caracteres"
              required
              placeholder="Digite sua senha"
            />
            <Input
              type="password"
              label="Confirm Password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (errors.confirmPassword) {
                  setErrors({ ...errors, confirmPassword: "" });
                }
              }}
              error={errors.confirmPassword}
              required
              placeholder="Digite a senha novamente"
            />
            <Button
              type="submit"
              variant="primary"
              className="w-full"
              isLoading={loading}
              disabled={loading}
            >
              Cadastrar
            </Button>
          </form>
          {message && (
            <Alert
              variant={isError ? "error" : "success"}
              className="mt-4"
              onClose={() => setMessage("")}
            >
              {message}
            </Alert>
          )}
          <p className="mt-6 text-center text-sm text-gray-600">
            Já tem conta?{" "}
            <Link
              to="/login"
              className="font-medium text-primary hover:text-primary-dark transition-colors"
            >
              Faça login
            </Link>
          </p>
        </Card>
      </Container>
    </div>
  );
}
