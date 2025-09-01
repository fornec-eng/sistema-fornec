"use client"

import { useState } from "react"
import { Modal, Alert } from "react-bootstrap"
import EntradaForm from "../forms/EntradaForm"
import apiService from "../../services/apiService"

function EntradaModal({ show, onHide, onSuccess, initialData = null, obraId = null }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (formData) => {
    setLoading(true)
    setError("")

    try {
      // Se obraId foi passado como prop, usar ele
      const dataToSubmit = {
        ...formData,
        obraId: formData.obraId || obraId || null,
      }

      let response
      if (initialData) {
        // Editando entrada existente
        response = await apiService.entradas.update(initialData._id, dataToSubmit)
      } else {
        // Criando nova entrada
        response = await apiService.entradas.create(dataToSubmit)
      }

      if (!response.error) {
        onSuccess && onSuccess(response.entrada)
        onHide()
      } else {
        setError(response.message || "Erro ao salvar entrada")
      }
    } catch (error) {
      console.error("Erro ao salvar entrada:", error)
      setError("Erro ao salvar entrada. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setError("")
    onHide()
  }

  return (
    <Modal show={show} onHide={onHide} size="lg" backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>{initialData ? "Editar Entrada" : "Nova Entrada"}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && (
          <Alert variant="danger" className="mb-3">
            {error}
          </Alert>
        )}

        <EntradaForm onSubmit={handleSubmit} onCancel={handleCancel} initialData={initialData} loading={loading} />
      </Modal.Body>
    </Modal>
  )
}

export default EntradaModal
