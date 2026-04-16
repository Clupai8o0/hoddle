"use client";

import { useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import { CheckCircle, X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PublishSuccessModalProps {
  title: string;
  slug?: string;
  onClose: () => void;
}

export function PublishSuccessModal({ title, slug, onClose }: PublishSuccessModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const fire = confetti.create(canvas, { resize: true, useWorker: true });

    const colors = ["#001842", "#2d6a4f", "#4a7ab5", "#a8c4e8", "#b7d4c4"];

    fire({
      particleCount: 80,
      spread: 70,
      origin: { x: 0.3, y: 0.6 },
      colors,
      scalar: 1.1,
    });
    fire({
      particleCount: 80,
      spread: 70,
      origin: { x: 0.7, y: 0.6 },
      colors,
      scalar: 1.1,
    });

    return () => {
      fire.reset();
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="publish-modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-primary/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Confetti canvas — full viewport, behind modal card */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-10"
      />

      {/* Modal card */}
      <div className="relative z-20 bg-surface rounded-2xl shadow-ambient max-w-md w-full p-8 text-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary rounded-md"
          aria-label="Close"
        >
          <X size={18} strokeWidth={1.5} />
        </button>

        <div className="flex justify-center mb-5">
          <span className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-secondary-container">
            <CheckCircle size={28} strokeWidth={1.5} className="text-secondary" aria-hidden="true" />
          </span>
        </div>

        <h2
          id="publish-modal-title"
          className="font-display text-2xl font-bold text-primary mb-2"
        >
          Article published!
        </h2>
        <p className="font-body text-on-surface-variant text-sm mb-1 leading-relaxed">
          <span className="font-semibold text-on-surface">{title}</span> is now
          live and visible to students.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 mt-7 justify-center">
          {slug && (
            <Button variant="primary" size="default" asChild>
              <a href={`/content/${slug}`} target="_blank" rel="noopener noreferrer">
                <ExternalLink size={14} strokeWidth={1.5} aria-hidden="true" />
                View article
              </a>
            </Button>
          )}
          <Button variant="secondary" size="default" onClick={onClose}>
            Back to editor
          </Button>
        </div>
      </div>
    </div>
  );
}
