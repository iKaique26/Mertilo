import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Upload, FileText, Trash2, Eye, X, Check, AlertCircle } from 'lucide-react';

const ALLOWED_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export function IRPFDocuments() {
  const { exerciseId } = useParams();
  const fileInputRef = useRef(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [reviewData, setReviewData] = useState(null);
  const [reviewMode, setReviewMode] = useState(false);
  const [error, setError] = useState(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (exerciseId) {
      loadDocuments();
    }
  }, [exerciseId]);

  async function loadDocuments() {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `http://127.0.0.1:5000/api/irpf/documents/exercise/${exerciseId}`
      );
      const docs = await response.json();
      setDocuments(docs || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleFileUpload(files) {
    if (!exerciseId) {
      setError('Exercício inválido');
      return;
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (!ALLOWED_TYPES.includes(file.type)) {
        setError(`Tipo não permitido: ${file.type}`);
        continue;
      }

      if (file.size > MAX_FILE_SIZE) {
        setError(`Arquivo muito grande: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
        continue;
      }

      await uploadFile(file);
    }
  }

  async function uploadFile(file) {
    try {
      setLoading(true);
      setUploadProgress(0);
      setError(null);

      const fileContent = await readFileAsBase64(file);
      setUploadProgress(50);

      const response = await fetch(
        `http://127.0.0.1:5000/api/irpf/documents/${exerciseId}/upload`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: file.name,
            mime_type: file.type,
            file_size: file.size,
            file_content: fileContent,
          }),
        }
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Upload falhou');
      }

      const result = await response.json();
      setUploadProgress(100);
      
      if (result.extraction && result.document) {
        setSelectedDoc(result.document);
        setReviewData(result.extraction);
        setReviewMode(true);
      }

      await loadDocuments();
      setUploadProgress(0);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload error';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function confirmDocument() {
    if (!selectedDoc || !reviewData) return;

    try {
      setConfirming(true);

      const response = await fetch(
        `http://127.0.0.1:5000/api/irpf/documents/${selectedDoc.id}/confirm`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            extracted_data: reviewData,
            corrections: {},
          }),
        }
      );

      if (!response.ok) throw new Error('Confirmação falhou');

      setReviewMode(false);
      setSelectedDoc(null);
      setReviewData(null);
      await loadDocuments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao confirmar');
    } finally {
      setConfirming(false);
    }
  }

  async function handleDelete(docId) {
    if (!window.confirm('Tem certeza?')) return;

    try {
      const response = await fetch(`http://127.0.0.1:5000/api/irpf/documents/${docId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Erro ao deletar');
      await loadDocuments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar');
    }
  }

  function handleDrag(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  }

  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFileUpload(e.dataTransfer.files);
  }

  return (
    <>
      <div style={{ marginBottom: '2rem' }}>
        <p className="eyebrow">Fiscal</p>
        <h1>Documentos</h1>
        <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>
          Importe holerites, informes de rendimento, extratos e outros documentos
        </p>
      </div>

      {error && (
        <div
          style={{
            background: 'var(--color-error)',
            color: 'white',
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>
      )}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: '2px dashed ' + (dragActive ? 'var(--color-primary)' : 'var(--color-border)'),
          borderRadius: 'var(--radius-md)',
          padding: '3rem',
          textAlign: 'center',
          cursor: 'pointer',
          background: dragActive ? 'var(--color-bg-tertiary)' : 'var(--color-bg-secondary)',
          transition: 'all 0.2s ease',
          marginBottom: '2rem',
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.png,.jpg,.jpeg,.csv,.xlsx,.xls"
          onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
          style={{ display: 'none' }}
        />

        <Upload size={48} style={{ marginBottom: '1rem', color: 'var(--color-primary)' }} />
        <h3 style={{ marginBottom: '0.5rem' }}>Arraste arquivos aqui</h3>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
          ou clique para selecionar. Máximo 10MB. Tipos aceitos: PDF, PNG, JPG, CSV, XLSX
        </p>

        {uploadProgress > 0 && uploadProgress < 100 && (
          <div style={{ marginTop: '1rem' }}>
            <div
              style={{
                width: '100%',
                height: '8px',
                background: 'var(--color-bg-tertiary)',
                borderRadius: 'var(--radius-sm)',
                overflow: 'hidden',
                marginBottom: '0.5rem',
              }}
            >
              <div
                style={{
                  width: `${uploadProgress}%`,
                  height: '100%',
                  background: 'var(--color-primary)',
                  transition: 'width 0.2s ease',
                }}
              />
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
              Enviando... {uploadProgress}%
            </p>
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-secondary)' }}>
          Carregando documentos...
        </div>
      ) : documents.length === 0 ? (
        <div
          style={{
            background: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: '3rem',
            textAlign: 'center',
          }}
        >
          <FileText size={48} style={{ marginBottom: '1rem', color: 'var(--color-text-tertiary)' }} />
          <h3 style={{ marginBottom: '0.5rem' }}>Nenhum documento importado</h3>
          <p style={{ color: 'var(--color-text-secondary)' }}>Comece com upload dos seus documentos</p>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: '1.5rem' }}>
            <h2>Documentos ({documents.length})</h2>
          </div>

          <div style={{ display: 'grid', gap: '1rem' }}>
            {documents.map((doc) => (
              <div
                key={doc.id}
                style={{
                  background: 'var(--color-bg-secondary)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.5rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                    <FileText size={20} style={{ color: 'var(--color-primary)' }} />
                    <div>
                      <h4 style={{ marginBottom: '0.25rem' }}>{doc.filename}</h4>
                      <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                        {doc.file_size > 1024 * 1024
                          ? `${(doc.file_size / 1024 / 1024).toFixed(2)}MB`
                          : `${(doc.file_size / 1024).toFixed(2)}KB`}
                        {' · '}
                        {doc.document_type || doc.file_type}
                        {' · '}
                        <span style={{ color: getStatusColor(doc.status) }}>
                          <strong>{doc.status}</strong>
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Confidence Score */}
                  {doc.confidence_score > 0 && (
                    <div style={{ marginTop: '0.75rem' }}>
                      <div style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                        Confiança: {doc.confidence_score}%
                      </div>
                      <div
                        style={{
                          width: '200px',
                          height: '4px',
                          background: 'var(--color-bg-tertiary)',
                          borderRadius: 'var(--radius-sm)',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${doc.confidence_score}%`,
                            height: '100%',
                            background:
                              doc.confidence_score >= 80
                                ? 'var(--color-success)'
                                : doc.confidence_score >= 50
                                  ? 'var(--color-warning)'
                                  : 'var(--color-error)',
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => setSelectedDoc(doc)}
                    title="Ver detalhes"
                  >
                    <Eye size={18} />
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(doc.id)}
                    title="Deletar"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {reviewMode && selectedDoc && reviewData && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1001,
          }}
          onClick={() => setReviewMode(false)}
        >
          <div
            style={{
              background: 'var(--color-bg-primary)',
              borderRadius: 'var(--radius-lg)',
              padding: '2rem',
              maxWidth: '700px',
              width: '95%',
              maxHeight: '90vh',
              overflow: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1.5rem' }}>
              <div>
                <h2>Revisar Extração</h2>
                <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                  {selectedDoc.filename}
                </p>
              </div>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setReviewMode(false)}
              >
                <X size={20} />
              </button>
            </div>

            {reviewData.errors && reviewData.errors.length > 0 && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid var(--color-error)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  marginBottom: '1rem',
                  display: 'flex',
                  gap: '0.75rem',
                }}
              >
                <AlertCircle size={20} style={{ color: 'var(--color-error)', flexShrink: 0 }} />
                <div>
                  <p style={{ fontWeight: 600, color: 'var(--color-error)', marginBottom: '0.5rem' }}>
                    Erros na Extração
                  </p>
                  {reviewData.errors.map((e, i) => (
                    <p key={i} style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                      {e}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {reviewData.warnings && reviewData.warnings.length > 0 && (
              <div
                style={{
                  background: 'rgba(249, 115, 22, 0.1)',
                  border: '1px solid var(--color-warning)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  marginBottom: '1rem',
                  display: 'flex',
                  gap: '0.75rem',
                }}
              >
                <AlertCircle size={20} style={{ color: 'var(--color-warning)', flexShrink: 0 }} />
                <div>
                  <p style={{ fontWeight: 600, color: 'var(--color-warning)', marginBottom: '0.5rem' }}>
                    Avisos
                  </p>
                  {reviewData.warnings.map((w, i) => (
                    <p key={i} style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                      {w}
                    </p>
                  ))}
                </div>
              </div>
            )}

            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ marginBottom: '1rem' }}>
                Informações Extraídas
                {reviewData.confidence && (
                  <span style={{ marginLeft: '1rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                    Confiança: {Math.round(reviewData.confidence)}%
                  </span>
                )}
              </h3>

              <div style={{ display: 'grid', gap: '1rem' }}>
                {(reviewData.fields || []).map((field, i) => (
                  <div
                    key={i}
                    style={{
                      background: 'var(--color-bg-secondary)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                      padding: '1rem',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.75rem' }}>
                      <label style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                        {field.name}
                      </label>
                      <div
                        style={{
                          background: field.confidence >= 80 ? 'rgba(34, 197, 94, 0.1)' : field.confidence >= 50 ? 'rgba(249, 115, 22, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                          color: field.confidence >= 80 ? 'var(--color-success)' : field.confidence >= 50 ? 'var(--color-warning)' : 'var(--color-error)',
                          padding: '0.25rem 0.75rem',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                        }}
                      >
                        {Math.round(field.confidence)}%
                      </div>
                    </div>
                    <input
                      type="text"
                      value={field.value || ''}
                      onChange={(e) => {
                        const updatedFields = [...(reviewData.fields || [])];
                        updatedFields[i] = { ...field, value: e.target.value };
                        setReviewData({ ...reviewData, fields: updatedFields });
                      }}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-sm)',
                        fontFamily: 'inherit',
                        fontSize: 'inherit',
                      }}
                      placeholder="Valor extraído"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setReviewMode(false)}
              >
                Cancelar
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={confirmDocument}
                disabled={confirming}
              >
                <Check size={16} style={{ marginRight: '0.5rem' }} />
                {confirming ? 'Confirmando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Detalhes */}
      {selectedDoc && !reviewMode && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setSelectedDoc(null)}
        >
          <div
            style={{
              background: 'var(--color-bg-primary)',
              borderRadius: 'var(--radius-lg)',
              padding: '2rem',
              maxWidth: '500px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1.5rem' }}>
              <h2>Detalhes do Documento</h2>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setSelectedDoc(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                  Nome do arquivo
                </label>
                <p style={{ marginTop: '0.25rem' }}>{selectedDoc.filename}</p>
              </div>

              <div>
                <label style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                  Tipo de documento
                </label>
                <p style={{ marginTop: '0.25rem' }}>{selectedDoc.document_type || 'Não identificado'}</p>
              </div>

              <div>
                <label style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                  Status
                </label>
                <p style={{ marginTop: '0.25rem', color: getStatusColor(selectedDoc.status) }}>
                  <strong>{selectedDoc.status}</strong>
                </p>
              </div>

              <div>
                <label style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                  Progresso de extração
                </label>
                <div
                  style={{
                    width: '100%',
                    height: '8px',
                    background: 'var(--color-bg-tertiary)',
                    borderRadius: 'var(--radius-sm)',
                    overflow: 'hidden',
                    marginTop: '0.5rem',
                  }}
                >
                  <div
                    style={{
                      width: `${selectedDoc.extraction_progress}%`,
                      height: '100%',
                      background: 'var(--color-primary)',
                    }}
                  />
                </div>
                <p style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>
                  {selectedDoc.extraction_progress}%
                </p>
              </div>

              <div>
                <label style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                  Confiança
                </label>
                <p style={{ marginTop: '0.25rem' }}>{selectedDoc.confidence_score}%</p>
              </div>

              <div>
                <label style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                  Adicionado em
                </label>
                <p style={{ marginTop: '0.25rem' }}>
                  {new Date(selectedDoc.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function getStatusColor(status) {
  switch (status) {
    case 'pending':
      return 'var(--color-text-secondary)';
    case 'processing':
      return 'var(--color-warning)';
    case 'extracted':
      return 'var(--color-success)';
    case 'verified':
      return 'var(--color-success)';
    case 'error':
      return 'var(--color-error)';
    default:
      return 'var(--color-text-secondary)';
  }
}

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result?.split(',')[1] || '');
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
