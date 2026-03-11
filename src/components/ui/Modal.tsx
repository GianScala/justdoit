"use client";

import { ReactNode, useEffect, useRef, useCallback, useState } from "react";
import { createPortal } from "react-dom";

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

const DRAG_THRESHOLD = 80;

export default function Modal({ open, onClose, title, children }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const dragState = useRef({ startY: 0, currentY: 0, dragging: false });
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  // --- portal mount guard ---
  useEffect(() => setMounted(true), []);

  // --- animate in / out ---
  useEffect(() => {
    if (open) {
      // force a frame so the enter class applies after mount
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
    } else {
      setVisible(false);
    }
  }, [open]);

  // --- scroll lock + escape ---
  useEffect(() => {
    if (!open) return;

    const scrollY = window.scrollY;
    const { body } = document;
    const prev = body.style.cssText;

    body.style.cssText += `
      overflow:hidden;
      position:fixed;
      top:-${scrollY}px;
      left:0;
      right:0;
    `;

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    window.addEventListener("keydown", onKey);

    return () => {
      body.style.cssText = prev;
      window.scrollTo(0, scrollY);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  // --- focus trap ---
  useEffect(() => {
    if (!open || !contentRef.current) return;

    const el = contentRef.current;
    const focusable = el.querySelectorAll<HTMLElement>(
      'a[href],button:not([disabled]),textarea,input,select,[tabindex]:not([tabindex="-1"])'
    );

    if (focusable.length) focusable[0].focus();

    function trap(e: KeyboardEvent) {
      if (e.key !== "Tab" || !focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    el.addEventListener("keydown", trap);
    return () => el.removeEventListener("keydown", trap);
  }, [open]);

  // --- drag to dismiss (mobile bottom sheet) ---
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    // only drag from header area or if content is scrolled to top
    const isHeader = target.closest(".modal-drag-zone");
    const isScrolledTop = contentRef.current ? contentRef.current.scrollTop <= 0 : true;

    if (!isHeader && !isScrolledTop) return;

    dragState.current = {
      startY: e.touches[0].clientY,
      currentY: e.touches[0].clientY,
      dragging: true,
    };
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!dragState.current.dragging || !contentRef.current) return;

    const y = e.touches[0].clientY;
    const delta = Math.max(0, y - dragState.current.startY);

    dragState.current.currentY = y;
    contentRef.current.style.transform = `translateY(${delta}px)`;
    contentRef.current.style.transition = "none";
  }, []);

  const onTouchEnd = useCallback(() => {
    if (!dragState.current.dragging || !contentRef.current) return;

    const delta = dragState.current.currentY - dragState.current.startY;
    contentRef.current.style.transition = "";
    contentRef.current.style.transform = "";

    dragState.current.dragging = false;

    if (delta > DRAG_THRESHOLD) onClose();
  }, [onClose]);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      ref={overlayRef}
      className={`modal-overlay ${visible ? "modal-overlay--visible" : ""}`}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div
        ref={contentRef}
        className={`modal-content ${visible ? "modal-content--visible" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={title || "Modal"}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* drag indicator — mobile only */}
        <div className="modal-drag-zone">
          <div className="modal-drag-handle" />
        </div>

        {title && (
          <div className="modal-header">
            <h3 className="modal-title">{title}</h3>
            <button
              type="button"
              className="modal-close"
              onClick={onClose}
              aria-label="Close modal"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path
                  d="M12.5 3.5L3.5 12.5M3.5 3.5L12.5 12.5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        )}

        <div className="modal-body">{children}</div>
      </div>
    </div>,
    document.body
  );
}