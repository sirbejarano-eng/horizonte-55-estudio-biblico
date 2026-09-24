"use client";

import { useEffect } from "react";

// Ampliación de las ilustraciones de los estudios (mismo comportamiento que context-study.js):
// el marcado del diálogo ya viene en el HTML; aquí solo se conectan los botones.
export default function StudyImageDialog() {
  useEffect(() => {
    const dialog = document.getElementById("contextImageDialog") as HTMLDialogElement | null;
    const image = document.getElementById("contextImageDialogImage") as HTMLImageElement | null;
    const title = document.getElementById("contextImageDialogTitle");
    const caption = document.getElementById("contextImageDialogCaption");
    if (!dialog || !image || !title || !caption) return;
    let opener: HTMLButtonElement | null = null;

    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const button = target.closest<HTMLButtonElement>(".context-image-open");
      if (button) {
        const thumbnail = button.querySelector("img");
        opener = button;
        image.src = button.dataset.imageSrc || thumbnail?.src || "";
        image.alt = thumbnail?.alt || "";
        title.textContent = button.dataset.imageTitle || "";
        caption.textContent = button.dataset.imageCaption || "";
        dialog.showModal();
        return;
      }
      if (target === dialog || target.closest('[data-action="close-image-dialog"]')) dialog.close();
    };
    const onClose = () => opener?.focus();

    document.addEventListener("click", onClick);
    dialog.addEventListener("close", onClose);
    return () => {
      document.removeEventListener("click", onClick);
      dialog.removeEventListener("close", onClose);
    };
  }, []);

  return null;
}
