import React from "react";
import { Download, FileWarning, FileX2, Ban, Info } from "lucide-react";
import "./UnsupportedUIPreview.css";

const SAMPLE_EXT = "exe";
const SAMPLE_NAME = "setup_installer.exe";

/**
 * Temporary gallery — pick a design, then we wire it into CustomFileModal.
 * Route: /unsupportedUI
 */
export default function UnsupportedUIPreview() {
  return (
    <div className="uui-page">
      <header className="uui-page-header">
        <h1>Unsupported file preview — UI options</h1>
        <p>
          Temporary page. Open a tile, note the number (1–10), and tell me which
          to ship. Dark panels match the file preview modal backdrop.
        </p>
        <code>/unsupportedUI</code>
      </header>

      <div className="uui-grid">
        {/* 1 — File badge + title */}
        <article className="uui-card">
          <div className="uui-card-label">Option 1 — File badge + title</div>
          <div className="uui-stage">
            <div className="uui-opt1">
              <span className="uui-opt1-badge">.{SAMPLE_EXT}</span>
              <h2>Can&apos;t preview this file</h2>
              <p>Download to open it on your device.</p>
            </div>
          </div>
        </article>

        {/* 2 — Ghost document */}
        <article className="uui-card">
          <div className="uui-card-label">Option 2 — Ghost document</div>
          <div className="uui-stage">
            <div className="uui-opt2">
              <div className="uui-opt2-ghost" aria-hidden="true">
                <span className="uui-opt2-slash" />
              </div>
              <h2>Preview unavailable</h2>
              <p>This file type can&apos;t be shown here.</p>
            </div>
          </div>
        </article>

        {/* 3 — Download-first card */}
        <article className="uui-card">
          <div className="uui-card-label">Option 3 — Download-first card</div>
          <div className="uui-stage">
            <div className="uui-opt3">
              <FileWarning size={28} strokeWidth={1.75} />
              <p>This format isn&apos;t supported in Stolity preview.</p>
              <button type="button" className="uui-opt3-btn">
                <Download size={16} /> Download file
              </button>
            </div>
          </div>
        </article>

        {/* 4 — Split panel */}
        <article className="uui-card">
          <div className="uui-card-label">Option 4 — Split panel</div>
          <div className="uui-stage">
            <div className="uui-opt4">
              <div className="uui-opt4-left">
                <FileX2 size={32} strokeWidth={1.5} />
                <strong>{SAMPLE_NAME}</strong>
                <span>.{SAMPLE_EXT}</span>
              </div>
              <div className="uui-opt4-right">
                <h2>Not previewable</h2>
                <p>Open it after downloading — in-browser preview isn&apos;t available for this type.</p>
              </div>
            </div>
          </div>
        </article>

        {/* 5 — Minimal toast-in-modal */}
        <article className="uui-card">
          <div className="uui-card-label">Option 5 — Minimal toast-in-modal</div>
          <div className="uui-stage">
            <div className="uui-opt5">
              <Ban size={16} strokeWidth={2} />
              <span>Unsupported format</span>
            </div>
          </div>
        </article>

        {/* 6 — Illustration empty-state */}
        <article className="uui-card">
          <div className="uui-card-label">Option 6 — Illustration empty-state</div>
          <div className="uui-stage">
            <div className="uui-opt6">
              <div className="uui-opt6-art" aria-hidden="true">
                <div className="uui-opt6-folder" />
                <div className="uui-opt6-file" />
              </div>
              <h2>No in-app preview</h2>
              <p>Download the file to view it with an app on your computer.</p>
            </div>
          </div>
        </article>

        {/* 7 — Type-aware message */}
        <article className="uui-card">
          <div className="uui-card-label">Option 7 — Type-aware message</div>
          <div className="uui-stage">
            <div className="uui-opt7">
              <p className="uui-opt7-type">
                <code>.{SAMPLE_EXT}</code> files can&apos;t be opened here
              </p>
              <p className="uui-opt7-sub">
                Stolity preview supports images, video, audio, PDF, and office docs.
              </p>
            </div>
          </div>
        </article>

        {/* 8 — Soft alert strip */}
        <article className="uui-card">
          <div className="uui-card-label">Option 8 — Soft alert strip</div>
          <div className="uui-stage uui-stage--fill">
            <div className="uui-opt8">
              <Info size={18} strokeWidth={2} />
              <div>
                <strong>Format not supported</strong>
                <span>Download to open · {SAMPLE_NAME}</span>
              </div>
              <button type="button" className="uui-opt8-link">
                Download
              </button>
            </div>
          </div>
        </article>

        {/* 9 — Glass card */}
        <article className="uui-card">
          <div className="uui-card-label">Option 9 — Glass card</div>
          <div className="uui-stage">
            <div className="uui-opt9">
              <div className="uui-opt9-accent" />
              <h2>Format not supported</h2>
              <p>This file can&apos;t be previewed in the browser.</p>
            </div>
          </div>
        </article>

        {/* 10 — Friendly helper */}
        <article className="uui-card">
          <div className="uui-card-label">Option 10 — Friendly helper</div>
          <div className="uui-stage">
            <div className="uui-opt10">
              <div className="uui-opt10-icon" aria-hidden="true">
                🙂
              </div>
              <h2>We can&apos;t show this here</h2>
              <p>
                Try previewing PDF, images, video, or docs. For other types,
                download the file instead.
              </p>
              <button type="button" className="uui-opt10-btn">
                Download
              </button>
            </div>
          </div>
        </article>

        {/* Current v1 for comparison */}
        <article className="uui-card uui-card--current">
          <div className="uui-card-label">Current (v1) — for comparison</div>
          <div className="uui-stage">
            <p className="uui-opt-current">File format not supported!</p>
          </div>
        </article>
      </div>
    </div>
  );
}
