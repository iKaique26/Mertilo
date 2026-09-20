/**
 * Button Component - Botão reutilizável com variantes
 * Variantes: primary, secondary, ghost, danger
 * Tamanhos: sm, md, lg
 */

import React from 'react';

export function Button({
  children,
  onClick,
  className = '',
  variant = 'primary',
  size = 'md',
  icon: Icon,
  disabled = false,
  type = 'button',
  ariaLabel,
  ...props
}) {
  const baseClass = 'btn';
  const variantClass = `btn-${variant}`;
  const sizeClass = `btn-${size}`;
  const disabledClass = disabled ? 'btn-disabled' : '';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClass} ${variantClass} ${sizeClass} ${disabledClass} ${className}`.trim()}
      aria-label={ariaLabel}
      {...props}
    >
      {Icon && <span className="btn-icon"><Icon size={18} strokeWidth={2} /></span>}
      {children}
    </button>
  );
}

/**
 * Input Component - Campo de texto reutilizável
 */
export function Input({
  type = 'text',
  placeholder,
  value,
  onChange,
  disabled = false,
  error,
  label,
  icon: Icon,
  className = '',
  ...props
}) {
  return (
    <div className="input-wrapper">
      {label && <label className="input-label">{label}</label>}
      <div className="input-container">
        {Icon && <span className="input-icon"><Icon size={18} strokeWidth={2} /></span>}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`input ${error ? 'input-error' : ''} ${Icon ? 'input-with-icon' : ''} ${className}`.trim()}
          aria-invalid={error ? 'true' : 'false'}
          {...props}
        />
      </div>
      {error && <small className="input-error-text">{error}</small>}
    </div>
  );
}

/**
 * Card Component - Cartão reutilizável
 */
export function Card({
  children,
  className = '',
  header,
  footer,
  variant = 'default',
  onClick,
  ...props
}) {
  return (
    <div
      className={`card card-${variant} ${onClick ? 'card-interactive' : ''} ${className}`.trim()}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      {...props}
    >
      {header && <div className="card-header">{header}</div>}
      <div className="card-body">{children}</div>
      {footer && <div className="card-footer">{footer}</div>}
    </div>
  );
}

/**
 * Badge Component - Etiqueta/rótulo
 */
export function Badge({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  ...props
}) {
  return (
    <span
      className={`badge badge-${variant} badge-${size} ${className}`.trim()}
      {...props}
    >
      {children}
    </span>
  );
}

/**
 * Modal Component - Modal simples
 */
export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className={`modal modal-${size}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="modal-header">
          <h2 id="modal-title">{title}</h2>
          <button
            className="modal-close"
            onClick={onClose}
            aria-label="Fechar modal"
          >
            ✕
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

/**
 * Toast Component - Notificação temporária
 */
export function Toast({
  message,
  type = 'info',
  onClose,
}) {
  React.useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`toast toast-${type}`} role="alert">
      {message}
    </div>
  );
}
