"use client";

import { useState } from "react";
import { ImagePlus, X } from "lucide-react";

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

export function PhotoInput({
  name = "photos",
  multiple = true,
  max = 6,
  required = false,
  label = "Add photos",
  hint = "JPG, PNG or WebP. Up to 5 MB each.",
}: {
  name?: string;
  multiple?: boolean;
  max?: number;
  required?: boolean;
  label?: string;
  hint?: string;
}) {
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);

  function onChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? []);

    if (selected.length > max) {
      setError(`Choose up to ${max} photos.`);
      event.target.value = "";
      setFiles([]);
      return;
    }

    for (const file of selected) {
      if (!ACCEPTED.includes(file.type)) {
        setError("Add a JPG, PNG or WebP photo.");
        event.target.value = "";
        setFiles([]);
        return;
      }
      if (file.size > MAX_BYTES) {
        setError("That photo is over 5 MB. Choose a smaller photo or resize it.");
        event.target.value = "";
        setFiles([]);
        return;
      }
    }

    setError(null);
    setFiles(selected);
  }

  return (
    <div>
      <label
        htmlFor={name}
        className="flex min-h-24 cursor-pointer items-center justify-center gap-2 rounded-surface border-2 border-dashed border-line-strong bg-surface px-4 py-6 text-center font-bold hover:border-primary"
      >
        <ImagePlus className="size-5" aria-hidden />
        {label}
        <input
          id={name}
          name={name}
          type="file"
          accept={ACCEPTED.join(",")}
          multiple={multiple}
          required={required}
          className="sr-only"
          onChange={onChange}
          aria-describedby={`${name}-hint`}
        />
      </label>
      <p id={`${name}-hint`} className="mt-1.5 text-sm text-muted">
        {hint}
      </p>

      {error ? (
        <p role="alert" className="mt-1.5 text-sm font-bold text-danger-fg">
          {error}
        </p>
      ) : null}

      {files.length > 0 ? (
        <ul className="mt-3 space-y-1.5">
          {files.map((file) => (
            <li
              key={`${file.name}-${file.size}`}
              className="s-row flex items-center justify-between gap-2 rounded-control bg-slate-100 px-3 py-2 text-sm"
            >
              <span className="truncate">{file.name}</span>
              <span className="shrink-0 text-muted">
                {(file.size / 1024 / 1024).toFixed(1)} MB
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function PhotoRemoveButton({ label = "Remove" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-sm font-bold text-danger-fg">
      <X className="size-4" aria-hidden />
      {label}
    </span>
  );
}
