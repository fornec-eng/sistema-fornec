import React, { useState, useEffect } from 'react';
import { Card, Table, Spinner } from 'react-bootstrap';
import ApiBase from '../services/ApiBase';

const Inventario = () => {
  const [title, setTitle] = useState('');
  const [header, setHeader] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  // Verifica qual é o papel (role) do usuário
  // Pode estar em localStorage ou sessionStorage, dependendo de como você salvou
  const role = localStorage.getItem('_role') || sessionStorage.getItem('_role');
  const isAdmin = role === 'Admin';

  // Função para extrair apenas o número de uma string, ex.: "70 sacos" -> 70, "R$ 25,00" -> 25
  const parseNumber = (str = '') => {
    // Remove tudo que não for dígito, ponto ou vírgula, depois troca vírgula por ponto
    const numeric = str.replace(/[^\d,.-]/g, '').replace(',', '.');
    return parseFloat(numeric) || 0; // retorna 0 se não conseguir converter
  };

  // Formata número como moeda em R$ (Ex.: 1750 -> "R$ 1.750,00")
  const formatCurrency = (num) =>
    num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const res = await ApiBase.post('/google/sheets/data', {
          data: {
            spreadsheetId: '1gisXYf9qckWe54c1w0EoGI222gfGvOteZ0hyJ42BtsE',
            range: 'inventario',
          },
        });
        const values = res.data.values;

        // Verifica se há ao menos 2 linhas: linha 0 -> título, linha 1 -> cabeçalho
        if (values && values.length > 1) {
          // A linha 0 (primeira) contém o título
          setTitle(values[0][0]);

          // A linha 1 contém o cabeçalho original
          const originalHeader = values[1];

          // As linhas a partir da 2 são os dados
          const originalRows = values.slice(2);

          // Se for Admin, adicionamos "Valor Unitário" e "Valor Total"
          if (isAdmin) {
            // O cabeçalho original deve ter "Valor Unitário" como última coluna
            // e acrescentaremos manualmente "Valor Total"
            // Ex.: ["Nome do Item", "Qtn. Comprada", "Qtn. Usada", "Qtn. Restante", "Local de armazenamento", "Valor Unitário"]
            // Então adicionamos "Valor Total"
            const adminHeader = [...originalHeader, 'Valor Total'];

            // Agora processamos cada linha para calcular "Valor Total"
            // originalRows[i] deve ter, por exemplo:
            // row[0] -> "Cimento CP II"
            // row[1] -> "100 sacos"
            // row[2] -> "30 sacos"
            // row[3] -> "70 sacos"
            // row[4] -> "Armazém Central"
            // row[5] -> "R$ 25,00"
            // Queremos inserir em row[6] o "Valor Total" = parseNumber(row[3]) * parseNumber(row[5])
            const adminRows = originalRows.map((row) => {
              const qtnRestante = parseNumber(row[3]);
              const valorUnitario = parseNumber(row[5]);
              const valorTotal = qtnRestante * valorUnitario; // ex.: 70 * 25 = 1750

              // Formatamos como R$ 1.750,00
              const valorTotalFormatado = formatCurrency(valorTotal);

              // Retornamos a linha original + o valor total como última coluna
              return [...row, valorTotalFormatado];
            });

            setHeader(adminHeader);
            setRows(adminRows);
          } else {
            // Se não for Admin (ou seja, role = "User"), removemos a última coluna (Valor Unitário)
            // do cabeçalho e das linhas. Assim não exibimos "Valor Unitário" nem "Valor Total"
            // (que nem sequer calculamos).
            // Ex.: originalHeader[0..4] = ["Nome do Item", "Qtn. Comprada", "Qtn. Usada", "Qtn. Restante", "Local de armazenamento"]
            const userHeader = originalHeader.slice(0, 5);

            // E para cada linha, pegamos apenas as 5 primeiras colunas
            const userRows = originalRows.map((row) => row.slice(0, 5));

            setHeader(userHeader);
            setRows(userRows);
          }
        }
      } catch (error) {
        console.error('Erro ao buscar o inventário:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInventory();
  }, [isAdmin]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center mt-4">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <Card style={{ borderRadius: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
        <Card.Body>
          {/* Título vindo da primeira linha da planilha */}
          <Card.Title className="mb-4">{title}</Card.Title>

          {/* Tabela responsiva */}
          <div className="table-responsive">
            <Table striped bordered hover>
              <thead>
                <tr>
                  {header.map((col, index) => (
                    <th key={index}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default Inventario;