import React from 'react';

/**
 * Arctic Frost - Aura Gradient Background
 * Category: aura | Theme: light
 * Backdrop: #faf8f2 (on body/page wrapper)
 * 2 layered linear gradients with multiply blend mode
 */
export default function AuraBackground({ className = '', style = {}, children, isFixed = false }) {
  if (isFixed) {
    return (
      <div
        className={`aura-fixed-backdrop ${className}`}
        aria-hidden="true"
        style={style}
      >
        {/* Layer 1 - multiply */}
        <div className="aura-layer-1" aria-hidden="true" />
        {/* Layer 2 - multiply */}
        <div className="aura-layer-2" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div
      className={`aura-bg relative min-h-screen ${className}`}
      style={{
        overflow: 'hidden',
        ...style
      }}
    >
      {/* Layer 1 - multiply */}
      <div className="aura-layer-1" aria-hidden="true" />
      {/* Layer 2 - multiply */}
      <div className="aura-layer-2" aria-hidden="true" />

      {/* Real content sitting above the layers */}
      {children && (
        <div className="relative z-10 w-full h-full flex flex-col">
          {children}
        </div>
      )}
    </div>
  );
}

