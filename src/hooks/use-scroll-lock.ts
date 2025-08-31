import { useEffect, useRef } from "react";

export const useScrollLock = (): [() => void, () => void] => {
  const originalStyles = useRef<{
    overflow: string;
    paddingRight: string;
    position: string;
  }>({
    overflow: "",
    paddingRight: "",
    position: "",
  });

  const scrollBlocked = useRef(false);

  const blockScroll = (): void => {
    if (typeof document === "undefined" || scrollBlocked.current) return;

    const html = document.documentElement;
    const body = document.body;

    // Calcular el ancho de la barra de scroll
    const scrollBarWidth = window.innerWidth - html.clientWidth;

    // Guardar los estilos originales
    originalStyles.current = {
      overflow: body.style.overflow,
      paddingRight: body.style.paddingRight,
      position: body.style.position,
    };

    // Aplicar estilos para bloquear el scroll
    body.style.overflow = "hidden";
    body.style.paddingRight = `${scrollBarWidth}px`;

    // Para dispositivos móviles (iOS/Safari)
    body.style.position = "relative";

    scrollBlocked.current = true;
  };

  const allowScroll = (): void => {
    if (typeof document === "undefined" || !scrollBlocked.current) return;

    const body = document.body;

    // Restaurar estilos originales
    body.style.overflow = originalStyles.current.overflow;
    body.style.paddingRight = originalStyles.current.paddingRight;
    body.style.position = originalStyles.current.position;

    scrollBlocked.current = false;
  };

  // Limpieza automática al desmontar
  useEffect(() => {
    return () => {
      if (scrollBlocked.current) {
        allowScroll();
      }
    };
  }, []);

  return [blockScroll, allowScroll];
};
