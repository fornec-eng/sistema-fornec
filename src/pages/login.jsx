import { Row, Col, Form, Button, Image } from 'react-bootstrap';
import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ApiBase from '../services/ApiBase';
import login_fundo from '../images/fundo_login.png';
import logo_fornec from '../images/logo_fornec.png';

const Login = () => {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [stayLogged, setStayLogged] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorEmail, setErrorEmail] = useState('');
  const [errorSenha, setErrorSenha] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoading(true);
    setErrorEmail('');
    setErrorSenha('');

    try {
      const data = { email, senha };
      const response = await ApiBase.post('/login', { data });
    
      if (response.data) {
        if (response.data.token) {
          // Login realizado com sucesso
          const storage = stayLogged ? localStorage : sessionStorage;
    
          storage.setItem('_id', response.data.user._id);
          storage.setItem('token', response.data.token);
          storage.setItem('_role', response.data.user.role);
          storage.setItem('email', response.data.user.email);
    
          window.location.reload(navigate('/home'));
        } else if (
          response.data.message &&
          response.data.user &&
          response.data.user.role === 'PreAprovacao'
        ) {
          // Usuário aguardando aprovação - exibe a mensagem da API
          setErrorEmail(response.data.message);
        } else {
          throw new Error('Resposta inválida da API');
        }
      } else {
        throw new Error('Resposta inválida da API');
      }
    } catch (error) {
      if (error.response && error.response.data?.message) {
        const errorMessage = error.response.data.message.toLowerCase();
        if (errorMessage.includes('email')) {
          setErrorEmail('E-mail incorreto.');
        } else if (errorMessage.includes('senha')) {
          setErrorSenha('Senha incorreta.');
        } else {
          setErrorEmail('Erro ao tentar fazer login.');
        }
      } else {
        setErrorEmail('Erro ao conectar ao servidor.');
      }
    } finally {
      setLoading(false);
    }
    
  };

  return (
    <Row className="h-100" style={{ fontFamily: 'Rawline' }}>
      <Col md={6} className="d-none d-md-flex flex-column p-4" style={{ backgroundColor: 'white' }}>
        <div className="d-flex flex-column justify-content-center h-100">
          <h1 style={{ fontSize: '2rem', textAlign: 'center', marginBottom: '2rem' }}>
            Sistema Fornec
          </h1>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Image src={login_fundo} alt="Fundo" style={{ width: 'auto', maxWidth: '100%', height: 'auto' }} />
          </div>
        </div>
      </Col>

      <Col md={6} className="p-4" style={{ backgroundColor: '#f8f9fa' }}>
        <Image src={logo_fornec} alt="Fornec Engenharia" style={{ width: '280px', marginBottom: '3rem' }} className="d-block mx-auto" />

        <Form style={{ maxWidth: '500px', margin: '0 auto' }} onSubmit={handleLogin}>
          <Form.Group className="mb-4">
            <Form.Label>Login</Form.Label>
            <Form.Control
              type="text"
              placeholder="Usuário de login"
              className="py-3"
              style={{ backgroundColor: '#f2f2f2', border: 'none' }}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              isInvalid={!!errorEmail}
            />
            <Form.Control.Feedback type="invalid">{errorEmail}</Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Label>Senha</Form.Label>
            <div className="position-relative">
              <Form.Control
                type={showPassword ? 'text' : 'password'}
                placeholder="Sua senha"
                className="py-3"
                style={{ backgroundColor: '#f2f2f2', border: 'none' }}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                isInvalid={!!errorSenha}
              />
              <Button
                variant="link"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  border: 'none',
                  padding: 0,
                  color: '#6c757d',
                }}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </Button>
              <Form.Control.Feedback type="invalid">{errorSenha}</Form.Control.Feedback>
            </div>
          </Form.Group>

          <Form.Group className="mb-4 d-flex align-items-center gap-2">
            <Form.Check 
              type="switch" 
              id="stay-logged" 
              checked={stayLogged}
              onChange={(e) => setStayLogged(e.target.checked)}
            />
            <Form.Label htmlFor="stay-logged" className="mb-0">
              Permanecer logado
            </Form.Label>
          </Form.Group>

          <Button
            variant="danger"
            className="w-100 py-3 mb-2"
            style={{ backgroundColor: '#FF0000', border: 'none', borderRadius: '8px' }}
            type="submit"
            disabled={loading}
          >
            {loading ? 'Carregando...' : 'Login'}
          </Button>
        </Form>
      </Col>
    </Row>
  );
};

export default Login;