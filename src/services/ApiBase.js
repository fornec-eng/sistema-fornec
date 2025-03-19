import axios from 'axios'

const ApiBase = axios.create({
    baseURL: 'https://api-fornec.vercel.app'
})

export default ApiBase;