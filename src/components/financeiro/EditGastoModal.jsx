"use client"

import { Modal } from "react-bootstrap"
import MaterialForm from "../forms/MaterialForm"
import MaoObraForm from "../forms/MaoObraForm"
import EquipamentoForm from "../forms/EquipamentoForm"
import ContratoForm from "../forms/ContratoForm"
import OutroGastoForm from "../forms/OutroGastoForm"

const EditGastoModal = ({ show, onHide, editingItem, onSubmit, onCancel }) => {
  const getEditFormComponent = () => {
    if (!editingItem) return null
    switch (editingItem.tipo) {
      case "Materiais":
      case "Material":
        return MaterialForm
      case "Mão de Obra":
        return MaoObraForm
      case "Equipamentos":
      case "Equipamento":
        return EquipamentoForm
      case "Contratos":
      case "Contrato":
        return ContratoForm
      case "Outros":
        return OutroGastoForm
      default:
        return null
    }
  }

  const EditForm = getEditFormComponent()

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Editar {editingItem?.tipo}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {EditForm && (
          <EditForm initialData={editingItem} onSubmit={onSubmit} onCancel={onCancel} obraId={editingItem?.obraId} />
        )}
      </Modal.Body>
    </Modal>
  )
}

export default EditGastoModal
