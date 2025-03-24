import { Row, Col, Form, Button, Image } from 'react-bootstrap';
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
      <Row className="h-100" style={{ fontFamily: 'Rawline' }}>
        <Col md={6} className="d-none d-md-flex flex-column">
        <div>
          <Button
              variant="danger"
              className="w-50 py-3 mb-2"
              style={{ backgroundColor: '#47117D', border: 'none', borderRadius: '8px' }}
              type="submit"
              onClick={()=> navigate('/login')}
            >
              Login
            </Button>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Image src={fundo_cadastro} alt="Chart Analysis" style={{ width: 'auto', maxWidth: '75%', height: 'auto' }} />
          </div>
        </div>
          
        </Col>

        <Col md={6} className="d-none d-md-flex flex-column" style={{ backgroundColor: '#f8f9fa', fontFamily: 'Rawline' }}>
          <div style={{ justifyContent: 'center' }}>
            <Image src={logo_fornec} alt="Logo Fornec" style={{ width: '100px' }} />
            <h2 style={{ fontSize: '1.75rem', marginBottom: '2rem' }}>
              Cadastro novo usuário Fornec
            </h2>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Form onSubmit={handleSubmit} style={{ maxWidth: '75%', minWidth: '75%' }}>
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
          </div>
        </Col>
      </Row>
  );
}

export default Cadastro;