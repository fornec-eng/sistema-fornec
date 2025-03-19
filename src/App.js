import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import Menu from './components/menu';
import { BrowserRouter as Router } from 'react-router-dom';
import Routers from './routes/Routers';
import { AuthProvider } from './routes/AuthContext';


function App() {
  return (
    <AuthProvider>
      <div className="App">
        <Router>
          <Menu />
          <Routers />
        </Router>
      </div>
    </AuthProvider>
  );
}

export default App;
