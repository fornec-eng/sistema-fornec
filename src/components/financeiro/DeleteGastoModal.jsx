"use client"

import { Modal, Button, Spinner, Alert } from "react-bootstrap"
import { Trash2 } from "lucide-react"

const DeleteGastoModal = ({ show, onHide, deletingItem, onSubmit, isDeleting, formatCurrency }) => {
  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title className="text-danger">Confirmar Exclusão</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="text-center">
          <Trash2 size={48} className="text-danger mb-3" />
          <h5>Tem certeza que deseja excluir este item?</h5>
          {deletingItem && (
            <div className="mt-3 text-start">
              <p>
                <strong>Tipo:</strong> {deletingItem.tipo}
              </p>
              <p>
                <strong>Descrição:</strong> {deletingItem.nome || deletingItem.descricao || "Sem descrição"}
              </p>
              <p>
                <strong>Valor:</strong> {formatCurrency(deletingItem.valor)}
              </p>
              <Alert variant="warning" className="mt-3">
                <strong>Atenção:</strong> Esta ação não pode ser desfeita!
              </Alert>
            </div>
          )}
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={isDeleting}>
          Cancelar
        </Button>
        <Button variant="danger" onClick={onSubmit} disabled={isDeleting}>
          {isDeleting ? (
            <>
              <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
              <span className="ms-2">Excluindo...</span>
            </>
          ) : (
            "Excluir"
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

export default DeleteGastoModal
