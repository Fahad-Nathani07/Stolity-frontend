import React, { useEffect, useState } from "react";
import SideNav from "../components/SideNav";
import {
  RipplePulseMark,
  DualRingMark,
  OrbitDotsMark,
  ArcSpinnerMark,
  SoftProgressMark,
} from "../components/brandLoaders";
import "../css/PageLoaders.css";

const LOADERS = [
  {
    id: "ripple",
    title: "Ripple pulse",
    description: "Soft expanding rings around the mini logo.",
    Preview: RipplePulseMark,
    previewSize: 40,
    fullSize: 56,
  },
  {
    id: "dual",
    title: "Dual ring",
    description: "Two counter-rotating brand rings.",
    Preview: DualRingMark,
    previewSize: 40,
    fullSize: 52,
  },
  {
    id: "orbit",
    title: "Orbit dots",
    description: "Three brand dots orbit the mini logo.",
    Preview: OrbitDotsMark,
    previewSize: 40,
    fullSize: 52,
  },
  {
    id: "arc",
    title: "Arc spinner",
    description: "Indeterminate circular progress ring around the mini logo.",
    Preview: ArcSpinnerMark,
    previewSize: 36,
    fullSize: 52,
  },
  {
    id: "progress",
    title: "Soft progress bar",
    description: "Logo above a sliding indeterminate progress bar.",
    Preview: SoftProgressMark,
    previewSize: 44,
    fullSize: 64,
  },
];

const PageLoaders = () => {
  const [activeId, setActiveId] = useState(null);
  const active = LOADERS.find((item) => item.id === activeId) || null;

  useEffect(() => {
    if (!activeId) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") setActiveId(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeId]);

  return (
    <div className="pl-page-shell">
      <SideNav />
      <div className="pl-page">
        <div className="pl-breadcrumb">
          <span>Examples</span>
          <span className="pl-breadcrumb-sep" aria-hidden="true">
            /
          </span>
          <span className="pl-breadcrumb-current">Page loaders</span>
        </div>

        <div className="pl-shell">
          <header className="pl-hero">
            <p className="pl-eyebrow">Loader gallery</p>
            <h1 className="pl-title">Page loader examples</h1>
            <p className="pl-subtitle">
              Saved loaders live in <code>Client/src/components</code> alongside
              the other loaders. Preview any style full screen.
            </p>
          </header>

          <div className="pl-grid">
            {LOADERS.map((item) => {
              const Preview = item.Preview;
              return (
                <article className="pl-card" key={item.id}>
                  <div className="pl-stage pl-stage--light">
                    <Preview size={item.previewSize} />
                  </div>
                  <div className="pl-card-body">
                    <h2 className="pl-card-title">{item.title}</h2>
                    <p className="pl-card-desc">{item.description}</p>
                    <button
                      type="button"
                      className="pl-preview-btn"
                      onClick={() => setActiveId(item.id)}
                    >
                      Preview full screen
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>

      {active ? (
        <div
          className="pl-overlay pl-overlay--light"
          role="dialog"
          aria-modal="true"
          aria-label={`${active.title} page loader`}
        >
          <button
            type="button"
            className="pl-overlay-close"
            onClick={() => setActiveId(null)}
          >
            Close
          </button>
          <active.Preview size={active.fullSize} />
          <p className="pl-overlay-label">{active.title}</p>
        </div>
      ) : null}
    </div>
  );
};

export default PageLoaders;
