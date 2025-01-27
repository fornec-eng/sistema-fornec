import 'bootstrap/dist/css/bootstrap.min.css';
import { Col, Container, Row } from 'react-bootstrap';
import './App.css';
import Menu from './components/menu';
import Home from './pages/home';

function App() {
  return (
    
    <div className="App">
      <Menu />
      <Container>
        <Row>
          <Col>
            <Home />
            <br/>
          </Col>
        </Row>
      </Container>
      
    </div>
  );
}

export default App;
