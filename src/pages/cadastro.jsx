import { Container, Row, Col, Form, Button, Image } from 'react-bootstrap';
import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import ApiBase from '../services/ApiBase';
import fundo_cadastro from '../images/fundo_cadastro.jpg';
import logo_fornec from '../images/logo_mini_fornec.png';
import { useNavigate } from 'react-router-dom';

function Cadastro() {
  const [showPassword, setShowPassword] = useState(false);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const navigate = useNavigate();

  function handleSubmit(event) {
    event.preventDefault();
    const novoUsuario = {
      nome: nome,
      email: email,
      senha: senha
    };

    ApiBase.post(`/user`, { novoUsuario })
      .then(() => {
        alert("Cadastrado com sucesso!");
        navigate('/login');
      })
      .catch((error) => {
        alert(error.response.data.message);
      });
  }

  return (
    <Container fluid className="vh-100" style={{ fontFamily: 'Rawline' }}>
      <Row className="h-100">
        <Col md={6} className="d-none d-md-flex flex-column p-4" style={{ backgroundColor: 'white' }}>
          <div className="d-flex flex-column justify-content-center h-100">
            <h1 style={{ fontSize: '2rem', textAlign: 'center', marginBottom: '2rem' }}>
              Sistema Fornec
            </h1>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <Image src={fundo_cadastro} alt="Chart Analysis" style={{ width: 'auto', maxWidth: '100%', height: 'auto' }} />
            </div>
          </div>
        </Col>

        <Col md={6} className="p-4 align-items-center" style={{ backgroundColor: '#f8f9fa' }}>
          <div className="d-flex align-items-center mb-5">
            <h2 style={{ fontSize: '1.75rem', marginBottom: '2rem' }}>
              Cadastro novo usuário
            </h2>
            
            <Image src={logo_fornec} alt="Logo Fornec" style={{ width: '100px' }} />
          </div>

          <Form onSubmit={handleSubmit} style={{ maxWidth: '500px' }}>
            <Form.Group className="mb-4">
              <Form.Label>Nome</Form.Label>
              <Form.Control type="text" placeholder="Seu nome" className="py-3" style={{ backgroundColor: '#f2f2f2', border: 'none' }} value={nome} onChange={(e) => setNome(e.target.value)} required />
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label>Email</Form.Label>
              <Form.Control type="email" placeholder="exemplo@gmail.com" className="py-3" style={{ backgroundColor: '#f2f2f2', border: 'none' }} value={email} onChange={(e) => setEmail(e.target.value)} required />
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label>Senha</Form.Label>
              <div className="position-relative">
                <Form.Control type={showPassword ? "text" : "password"} placeholder="Sua senha" className="py-3" style={{ backgroundColor: '#f2f2f2', border: 'none' }} value={senha} onChange={(e) => setSenha(e.target.value)} required />
                <Button variant="link" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', border: 'none', padding: 0, color: '#6c757d' }}>
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </Button>
              </div>
            </Form.Group>

            <Button type="submit" variant="danger" className="w-100 py-3" style={{ backgroundColor: '#FF0000', border: 'none', borderRadius: '8px' }}>
              Cadastrar
            </Button>
          </Form>
        </Col>
      </Row>
    </Container>
  );
}

export default Cadastro;