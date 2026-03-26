import React from "react";

const h = React.createElement;

const formatFileSize = (bytes) => {
  if (!bytes && bytes !== 0) return "-";
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const formatDateTime = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
};

export default function PDFUploader({ pdfs, onUpload, onDelete }) {
  const handleFileChange = async (event) => {
    const fileList = Array.from(event.target.files || []);
    const MAX_SIZE = 50 * 1024 * 1024; // 50 MB
    const pdfFiles = fileList.filter(
      (file) => file.type === "application/pdf" && file.size <= MAX_SIZE
    );
    if (pdfFiles.length < fileList.length) {
      console.warn("Some files were skipped — only PDFs under 50 MB are accepted.");
    }

    const randomId = () =>
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2);

    let readFiles;
    try {
      readFiles = await Promise.all(
        pdfFiles.map(
          (file) =>
            new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => {
                resolve({
                  id: randomId(),
                  name: file.name,
                  size: file.size,
                  uploadedAt: new Date(),
                  dataUrl: reader.result,
                });
              };
              reader.onerror = () => reject(new Error(`Failed to read "${file.name}"`));
              reader.readAsDataURL(file);
            })
        )
      );
    } catch (err) {
      console.error("File read error:", err?.message || err);
      event.target.value = "";
      return;
    }

    if (readFiles.length > 0) {
      onUpload(readFiles);
    }

    event.target.value = "";
  };

  const uploadCard = h(
    "div",
    {
      className:
        "rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-lg backdrop-blur transition hover:shadow-xl",
    },
    h(
      "div",
      {
        className: "flex flex-col gap-4 md:flex-row md:items-center md:justify-between",
      },
      h(
        "div",
        null,
        h("h3", { className: "text-lg font-semibold text-slate-800" }, "Upload PDFs"),
        h(
          "p",
          { className: "text-sm text-slate-500" },
          "Add your ISTQB study materials to generate targeted quizzes."
        )
      ),
      h(
        "label",
        {
          className:
            "inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition duration-200 hover:-translate-y-0.5 hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2",
        },
        h(
          "svg",
          {
            xmlns: "http://www.w3.org/2000/svg",
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "currentColor",
            className: "h-4 w-4",
          },
          h("path", {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: "1.5",
            d: "M12 4v16m8-8H4",
          })
        ),
        "Upload PDF",
        h("input", {
          type: "file",
          accept: "application/pdf",
          multiple: true,
          onChange: handleFileChange,
          className: "hidden",
        })
      )
    )
  );

  const emptyState = h(
    "div",
    {
      className:
        "rounded-3xl border border-dashed border-slate-300 bg-white/70 p-10 text-center text-slate-500 shadow-inner",
    },
    h(
      "p",
      { className: "text-base font-medium" },
      "No PDFs uploaded yet. Upload your ISTQB study materials to get started!"
    )
  );

  const pdfCards =
    pdfs.length === 0
      ? emptyState
      : h(
          "div",
          { className: "grid gap-6 md:grid-cols-2 xl:grid-cols-3" },
          pdfs.map((pdf) =>
            h(
              "article",
              {
                key: pdf.id,
                className:
                  "group flex h-full flex-col justify-between rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-md transition duration-200 hover:-translate-y-1 hover:shadow-xl",
              },
              h(
                "div",
                { className: "space-y-4" },
                h(
                  "div",
                  { className: "flex items-center justify-between" },
                  h(
                    "h4",
                    { className: "text-lg font-semibold text-slate-800" },
                    pdf.name
                  ),
                  h(
                    "span",
                    {
                      className:
                        "inline-flex items-center rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent",
                    },
                    formatFileSize(pdf.size)
                  )
                ),
                h(
                  "div",
                  { className: "space-y-2 text-sm text-slate-500" },
                  h(
                    "p",
                    null,
                    h(
                      "span",
                      { className: "font-medium text-slate-700" },
                      "Uploaded:"
                    ),
                    " ",
                    formatDateTime(pdf.uploadedAt)
                  )
                )
              ),
              h(
                "button",
                {
                  type: "button",
                  onClick: () => onDelete(pdf.id),
                  className:
                    "mt-6 inline-flex items-center justify-center rounded-full bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-600 transition duration-200 hover:bg-red-500/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50 focus-visible:ring-offset-2",
                },
                "Delete"
              )
            )
          )
        );

  return h("section", { className: "space-y-6" }, uploadCard, pdfCards);
}
