export function renderCopyButton(
  textToCopy: string,
  label: string = "Copy",
  className: string = "btn-sm btn-outline"
): string {
  const encodedText = encodeURIComponent(textToCopy);
  return `
    <button 
      type="button" 
      class="btn ${className} copy-btn" 
      data-clipboard="${encodedText}" 
      aria-label="Copy ${label} to clipboard"
    >
      <svg class="copy-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
      </svg>
      <span class="copy-label">${label}</span>
    </button>
  `;
}

export function attachCopyListeners(): void {
  document.querySelectorAll<HTMLButtonElement>(".copy-btn").forEach((btn) => {
    btn.onclick = async (e) => {
      e.stopPropagation();
      const rawText = btn.getAttribute("data-clipboard");
      if (!rawText) return;
      const decodedText = decodeURIComponent(rawText);
      try {
        await navigator.clipboard.writeText(decodedText);
        const labelSpan = btn.querySelector(".copy-label");
        const originalText = labelSpan ? labelSpan.textContent : "Copy";
        if (labelSpan) {
          labelSpan.textContent = "Copied ✓";
        }
        btn.classList.add("copied");
        setTimeout(() => {
          if (labelSpan) {
            labelSpan.textContent = originalText;
          }
          btn.classList.remove("copied");
        }, 2000);
      } catch {
        // Fallback for environments where clipboard API is restricted
        const textArea = document.createElement("textarea");
        textArea.value = decodedText;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
    };
  });
}
