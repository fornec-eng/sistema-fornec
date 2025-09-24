import React, { useState, useEffect } from 'react'
import { Modal, Button, Form, Alert, Spinner, Card, Row, Col } from 'react-bootstrap'
import { Building, CheckCircle, Circle, Save, X } from 'lucide-react'
import userService from '../../services/userService'

const ManageUserObrasModal = ({ show, onHide, user, onSuccess }) => {
  const [obrasAtivas, setObrasAtivas] = useState([])
  const [obrasPermitidas, setObrasPermitidas] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [alert, setAlert] = useState({ show: false, message: '', variant: '' })

  const showAlert = (message, variant = 'success') => {
    setAlert({ show: true, message, variant })
    setTimeout(() => setAlert({ show: false, message: '', variant: '' }), 4000)
  }

  useEffect(() => {
    if (show && user) {
      fetchData()
    }
  }, [show, user])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Buscar todas as obras ativas usando o mesmo endpoint de obras_ativas
      const obrasResponse = await userService.listarObrasAtivas()
      console.log('ManageUserObrasModal - Resposta das obras:', obrasResponse)
      setObrasAtivas(obrasResponse.obras || [])

      // Buscar obras já permitidas para este usuário
      try {
        const permitidasResponse = await userService.buscarObrasPermitidas(user._id)
        setObrasPermitidas(permitidasResponse.obrasPermitidas || [])
      } catch (error) {
        // Se não encontrar obras permitidas, inicializa como array vazio
        setObrasPermitidas([])
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Erro desconhecido'
      showAlert(`Erro ao carregar dados das obras: ${errorMessage}`, 'danger')
    } finally {
      setLoading(false)
    }
  }

  const handleObraToggle = (obraId) => {
    setObrasPermitidas(prev => {
      if (prev.includes(obraId)) {
        // Remove a obra se já estiver selecionada
        return prev.filter(id => id !== obraId)
      } else {
        // Adiciona a obra se não estiver selecionada
        return [...prev, obraId]
      }
    })
  }

  const handleSelectAll = () => {
    if (obrasPermitidas.length === obrasAtivas.length) {
      // Se todas estão selecionadas, desseleciona todas
      setObrasPermitidas([])
    } else {
      // Seleciona todas
      setObrasPermitidas(obrasAtivas.map(obra => obra._id))
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await userService.gerenciarObrasPermitidas(user._id, obrasPermitidas)
      showAlert('Permissões de obras atualizadas com sucesso!', 'success')
      
      // Chama callback de sucesso após um breve delay
      setTimeout(() => {
        if (onSuccess) onSuccess()
        onHide()
      }, 1500)
    } catch (error) {
      console.error('Erro ao salvar permissões:', error)
      showAlert('Erro ao salvar permissões. Tente novamente.', 'danger')
    } finally {
      setSaving(false)
    }
  }

  const formatCurrency = (value) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)

  if (!user) return null

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <Building className="me-2" />
          Gerenciar Obras para {user.nome}
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
        {alert.show && (
          <Alert variant={alert.variant} className="mb-3">
            {alert.message}
          </Alert>
        )}

        <div className="mb-3">
          <p className="text-muted">
            Selecione quais obras o usuário <strong>{user.nome}</strong> poderá visualizar e acessar no sistema.
          </p>
        </div>

        {loading ? (
          <div className="text-center p-4">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2">Carregando obras...</p>
          </div>
        ) : (
          <>
            {/* Controles de seleção */}
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <strong>
                  {obrasPermitidas.length} de {obrasAtivas.length} obras selecionadas
                </strong>
              </div>
              <Button 
                variant="outline-primary" 
                size="sm" 
                onClick={handleSelectAll}
              >
                {obrasPermitidas.length === obrasAtivas.length ? 'Desselecionar Todas' : 'Selecionar Todas'}
              </Button>
            </div>

            {/* Lista de obras */}
            {obrasAtivas.length === 0 ? (
              <div className="text-center p-4">
                <Building size={48} className="text-muted mb-3" />
                <h5>Nenhuma obra encontrada</h5>
                <p className="text-muted">
                  Não há obras ativas disponíveis no sistema.
                </p>
              </div>
            ) : (
              <Row>
                {obrasAtivas.map((obra) => {
                  const isSelected = obrasPermitidas.includes(obra._id)
                  
                  return (
                    <Col md={6} key={obra._id} className="mb-3">
                      <Card 
                        className={`h-100 ${isSelected ? 'border-success' : 'border-light'}`}
                        style={{ 
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onClick={() => handleObraToggle(obra._id)}
                      >
                        <Card.Body className="p-3">
                          <div className="d-flex align-items-start">
                            <div className="me-3 mt-1">
                              {isSelected ? (
                                <CheckCircle size={20} className="text-success" />
                              ) : (
                                <Circle size={20} className="text-muted" />
                              )}
                            </div>
                            <div className="flex-grow-1">
                              <h6 className="mb-1">{obra.nome}</h6>
                              <p className="text-muted small mb-1">
                                <strong>Cliente:</strong> {obra.cliente || 'Não informado'}
                              </p>
                              {obra.valorContrato && (
                                <p className="text-muted small mb-1">
                                  <strong>Valor:</strong> {formatCurrency(obra.valorContrato)}
                                </p>
                              )}
                              <small className="text-muted">
                                Status: {obra.status || 'N/A'}
                              </small>
                            </div>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  )
                })}
              </Row>
            )}
          </>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={saving}>
          <X size={16} className="me-1" />
          Cancelar
        </Button>
        <Button 
          variant="success" 
          onClick={handleSave} 
          disabled={loading || saving}
        >
          {saving ? (
            <>
              <Spinner as="span" animation="border" size="sm" className="me-2" />
              Salvando...
            </>
          ) : (
            <>
              <Save size={16} className="me-1" />
              Salvar Permissões
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

export default ManageUserObrasModal