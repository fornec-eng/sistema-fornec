import axios from 'axios';

const token = localStorage.getItem('token') || sessionStorage.getItem('token');

const ApiBase = axios.create({
  baseURL: 'https://api-fornec.vercel.app',
  headers: {
    Authorization: token ? `Bearer ${token}` : ''
  }
});

export default ApiBase;
