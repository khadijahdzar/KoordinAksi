import React from "react";
import { Link } from "react-router-dom";

export function Notice({ message, success = false }) {
  return <div className={`notice ${success ? "notice-success" : ""}`} role="status">{message}</div>;
}

export function InlineFieldError({ id, children }) {
  return <span className="registration-field-error" id={id} role="alert">{children}</span>;
}

export function focusFirstInvalidField() {
  window.requestAnimationFrame(() => {
    const invalidField = document.querySelector('[aria-invalid="true"]');
    const focusTarget = invalidField?.querySelector("input, select, button") || invalidField;
    focusTarget?.focus();
  });
}

export function NotFound() {
  return (
    <div className="container page-space not-found">
      <span className="eyebrow">404 · Halaman tidak ditemukan</span>
      <h1>Sepertinya jalan ini<br /><em>belum tersedia.</em></h1>
      <Link className="button" to="/">Kembali ke beranda →</Link>
    </div>
  );
}
