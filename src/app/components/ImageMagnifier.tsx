import { useState, useRef, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";

/**
 * Props del componente ImageMagnifier
 */
interface ImageMagnifierProps {
  /** URL de la imagen a magnificar */
  src: string;
  /** Texto alternativo para la imagen */
  alt: string;
  /** Factor de zoom aplicado al magnificador */
  zoom?: number;
  /** Tamaño del lente en píxeles */
  lensSize?: number;
  /** Clases CSS adicionales para el contenedor */
  className?: string;
}

/**
 * Componente de magnificador de imágenes estilo Amazon
 * Muestra un lente de seguimiento sobre la imagen y una vista ampliada en un portal flotante
 * La sincronización es 1:1 - lo que se ve en el lente es exactamente lo que aparece ampliado
 */
export default function ImageMagnifier({
  src,
  alt,
  zoom = 2.5,
  lensSize = 150,
  className = "",
}: ImageMagnifierProps) {
  // Referencia al contenedor de la imagen
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Estado que indica si el magnificador está activo (mouse sobre la imagen)
  const [active, setActive] = useState(false);

  // Posición del lente (esquina superior izquierda)
  const [lens, setLens] = useState({ x: 0, y: 0 });

  // Estado del portal de preview (posición, tamaño y offset del background)
  const [portal, setPortal] = useState({
    top: 0,
    left: 0,
    bgX: 0,
    bgY: 0,
    size: 0,
  });

  /**
   * Maneja el movimiento del mouse sobre la imagen
   * Calcula la posición del lente y del preview ampliado con sincronización perfecta
   */
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const container = containerRef.current;
      const img = imgRef.current;
      if (!container || !img) return;

      // Obtener las dimensiones del contenedor renderizado
      const rect = container.getBoundingClientRect();

      // Mitad del tamaño del lente (para centrarlo en el cursor)
      const halfLens = lensSize / 2;

      // Posición del cursor relativa a la imagen
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Posición superior-izquierda del lente, limitada para que no se salga de la imagen
      const lensX = Math.max(0, Math.min(mouseX - halfLens, rect.width - lensSize));
      const lensY = Math.max(0, Math.min(mouseY - halfLens, rect.height - lensSize));

      // Calcular el tamaño del preview (ventana de ampliación)
      const previewSize = lensSize * zoom;

      // CLAVE: Calcular la posición del background
      // El lente cubre un área desde (lensX, lensY) hasta (lensX + lensSize, lensY + lensSize)
      // Esa área debe aparecer ampliada en el preview
      // La fórmula: -lensX * zoom posiciona el background para que el inicio del lente
      // coincida con el inicio del preview
      const bgX = -lensX * zoom;
      const bgY = -lensY * zoom;

      // Actualizar estado del lente
      setLens({ x: lensX, y: lensY });

      // Actualizar estado del portal
      setPortal({
        top: rect.top,
        left: rect.right + 16, // Separación del borde derecho
        bgX,
        bgY,
        size: previewSize,
      });
    },
    [lensSize, zoom]
  );

  /**
   * Elemento del preview ampliado que se renderiza en un portal
   * Solo se muestra cuando el magnificador está activo
   */
  const previewBox = active && portal.size > 0 && containerRef.current && (
    <div
      className="rounded-xl overflow-hidden shadow-2xl border-2 border-border pointer-events-none bg-white"
      style={{
        position: "fixed",
        top: portal.top,
        left: portal.left,
        width: portal.size,
        height: portal.size,
        backgroundImage: `url(${src})`,
        // El background se escala por el factor de zoom
        backgroundSize: `${containerRef.current.offsetWidth * zoom}px ${containerRef.current.offsetHeight * zoom}px`,
        backgroundPosition: `${portal.bgX}px ${portal.bgY}px`,
        backgroundRepeat: "no-repeat",
        zIndex: 9999,
      }}
    />
  );

  return (
    <>
      {/* Contenedor de la imagen con el lente */}
      <div
        ref={containerRef}
        className={`relative select-none cursor-crosshair ${className}`}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setActive(true)}
        onMouseLeave={() => setActive(false)}
      >
        {/* Imagen principal */}
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
          draggable={false}
        />

        {/* Lente de seguimiento (cuadro pequeño sobre la imagen) */}
        {active && (
          <div
            className="absolute pointer-events-none border-2 border-white/90 bg-white/10"
            style={{
              width: lensSize,
              height: lensSize,
              left: lens.x,
              top: lens.y,
              boxShadow: "0 0 0 1px rgba(0,0,0,0.3), 0 4px 20px rgba(0,0,0,0.2)",
            }}
          />
        )}
      </div>

      {/* Portal que renderiza el preview ampliado en el body */}
      {typeof document !== "undefined" && createPortal(previewBox, document.body)}
    </>
  );
}
