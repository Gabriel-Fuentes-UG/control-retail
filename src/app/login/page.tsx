// src/app/login/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import { Button, Form, Container, Card, Alert, Row, Col } from 'react-bootstrap';
import LoadingIndicator from '@/components/common/LoadingIndicator'; // Mantenemos tu loader

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/redirect-hub');
    }

    // Lógica para leer el error de la URL
    const errorType = searchParams.get('error');
    if (errorType === 'CredentialsSignin') {
        setError('Las credenciales son incorrectas. Por favor, inténtalo de nuevo.');
    } else if (errorType === 'AccountInactive') {
        setError('Tu usuario ha sido bloqueado. Contacta a tu administrador para verificar el estado de tu cuenta.');
    }
  }, [searchParams, status, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Ahora `signIn` gestionará la redirección por sí mismo
    await signIn('credentials', {
      email,
      password,
      callbackUrl: '/redirect-hub', // A dónde ir si el login es exitoso
      redirect: true, // Permitimos que NextAuth maneje la redirección
    });
  };

  // Mantenemos tu LoadingIndicator para los estados de carga
  if (status === 'loading' || status === 'authenticated') {
    return <LoadingIndicator />;
  }

  return (
    <Container>
      <Row className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
        <Col md={5} lg={4}>
          <h1 className="text-center mb-4">Iniciar sesión</h1>
          <Form onSubmit={handleLogin}>
            {error && <Alert variant="danger">{error}</Alert>}
            
            <Form.Floating className="mb-3">
              <Form.Control
                id="floatingEmail"
                type="email"
                placeholder="correo@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <label htmlFor="floatingEmail">Correo electrónico</label>
            </Form.Floating>

            <Form.Floating className="mb-3">
              <Form.Control
                id="floatingPassword"
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <label htmlFor="floatingPassword">Contraseña</label>
            </Form.Floating>
            
            <Form.Check 
              type="checkbox"
              id="rememberMeCheckbox"
              label="Recordarme"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="mb-3"
            />
            
            <div className="d-grid">
              <Button variant="primary" type="submit" size="lg" className="w-100">
                Entrar
              </Button>
            </div>
          </Form>
        </Col>
      </Row>
    </Container>
  );
}