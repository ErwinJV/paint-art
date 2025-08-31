"use client";
import { useScrollLock } from "@/hooks/use-scroll-lock";
import {
  useState,
  useRef,
  useEffect,
  MouseEvent,
  TouchEvent,
  JSX,
} from "react";
import {
  FaPaintBrush,
  FaMarker,
  FaSprayCan,
  FaEraser,
  FaTrash,
  FaDownload,
} from "react-icons/fa";

type ToolType = "brush" | "marker" | "spray" | "eraser";
type Coordinates = { offsetX: number; offsetY: number };

// Tamaño fijo del canvas
const CANVAS_WIDTH = 854;
const CANVAS_HEIGHT = 480;

export default function DrawingCanvas() {
  const [blockScroll, allowScroll] = useScrollLock();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);

  // Estados
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [color, setColor] = useState<string>("#000000");
  const [tool, setTool] = useState<ToolType>("brush");
  const [brushSize, setBrushSize] = useState<number>(5);

  // Inicializar canvas con tamaño fijo
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    // Configurar tamaño fijo
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    // Configuración inicial
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = color;
    ctx.lineWidth = brushSize;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    contextRef.current = ctx;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Actualizar propiedades al cambiar config
  useEffect(() => {
    if (!contextRef.current) return;

    if (tool === "eraser") {
      contextRef.current.strokeStyle = "#ffffff";
    } else {
      contextRef.current.strokeStyle = color;
    }

    contextRef.current.lineWidth = brushSize;
  }, [brushSize, color, tool]);

  // Función para obtener coordenadas
  const getCoordinates = (
    e: MouseEvent<HTMLCanvasElement> | TouchEvent<HTMLCanvasElement>
  ): Coordinates => {
    if (!canvasRef.current) return { offsetX: 0, offsetY: 0 };

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    // Calcular relación de escala
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ("touches" in e) {
      return {
        offsetX: (e.touches[0].clientX - rect.left) * scaleX,
        offsetY: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }

    return {
      offsetX: e.nativeEvent.offsetX * scaleX,
      offsetY: e.nativeEvent.offsetY * scaleY,
    };
  };

  // Funciones de dibujo
  const startDrawing = (
    e: MouseEvent<HTMLCanvasElement> | TouchEvent<HTMLCanvasElement>
  ) => {
    if (!contextRef.current) return;

    const { offsetX, offsetY } = getCoordinates(e);
    contextRef.current.beginPath();
    contextRef.current.moveTo(offsetX, offsetY);
    setIsDrawing(true);
    blockScroll();
  };

  const draw = (
    e: MouseEvent<HTMLCanvasElement> | TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawing || !contextRef.current) return;

    const { offsetX, offsetY } = getCoordinates(e);

    switch (tool) {
      case "brush":
        drawBrush(offsetX, offsetY);
        break;
      case "marker":
        drawMarker(offsetX, offsetY);
        break;
      case "spray":
        drawSpray(offsetX, offsetY);
        break;
      case "eraser":
        drawEraser(offsetX, offsetY);
        break;
      default:
        drawBrush(offsetX, offsetY);
    }
  };

  const endDrawing = () => {
    if (!contextRef.current) return;

    contextRef.current.closePath();
    setIsDrawing(false);
    allowScroll();
  };

  // Funciones específicas de herramientas
  const drawBrush = (x: number, y: number) => {
    if (!contextRef.current) return;

    const ctx = contextRef.current;
    const currentX = x;
    const currentY = y;

    // Guardar configuración previa
    const prevStrokeStyle = ctx.strokeStyle;
    const prevLineWidth = ctx.lineWidth;

    // Crear gradiente radial para efecto de pincel suave
    const gradient = ctx.createRadialGradient(
      currentX,
      currentY,
      0,
      currentX,
      currentY,
      brushSize
    );
    gradient.addColorStop(0, `${color}cc`); // 80% de opacidad
    gradient.addColorStop(0.5, `${color}99`); // 60% de opacidad
    gradient.addColorStop(1, `${color}00`); // 0% de opacidad

    // Configurar propiedades de dibujo
    ctx.strokeStyle = gradient;
    ctx.lineWidth = brushSize * 1.5; // Ligeramente más ancho para el gradiente

    // Dibujar
    ctx.lineTo(currentX, currentY);
    ctx.stroke();

    // Restaurar configuración
    ctx.strokeStyle = prevStrokeStyle;
    ctx.lineWidth = prevLineWidth;
  };

  const drawMarker = (x: number, y: number) => {
    if (!contextRef.current) return;

    const ctx = contextRef.current;
    const prevAlpha = ctx.globalAlpha;

    ctx.globalAlpha = 0.6;
    ctx.lineTo(x, y);
    ctx.stroke();

    ctx.globalAlpha = prevAlpha;
  };

  const drawSpray = (x: number, y: number) => {
    if (!contextRef.current) return;

    const ctx = contextRef.current;
    const density = brushSize * 2;
    const radius = brushSize * 5;

    const prevFillStyle = ctx.fillStyle;
    ctx.fillStyle = color;

    for (let i = 0; i < density; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * radius;
      const sprayX = x + Math.cos(angle) * distance;
      const sprayY = y + Math.sin(angle) * distance;

      ctx.beginPath();
      ctx.arc(sprayX, sprayY, brushSize / 3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = prevFillStyle;
  };

  const drawEraser = (x: number, y: number) => {
    if (!contextRef.current || !canvasRef.current) return;

    const ctx = contextRef.current;
    const prevStrokeStyle = ctx.strokeStyle;

    // Configurar borrador
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = brushSize * 3;

    // Dibujar
    ctx.lineTo(x, y);
    ctx.stroke();

    // Restaurar configuración
    ctx.strokeStyle = prevStrokeStyle;
    ctx.lineWidth = brushSize;
  };

  // Limpiar canvas
  const clearCanvas = () => {
    if (!canvasRef.current || !contextRef.current) return;

    contextRef.current.fillStyle = "#ffffff";
    contextRef.current.fillRect(
      0,
      0,
      canvasRef.current.width,
      canvasRef.current.height
    );

    // Restaurar configuración
    if (tool === "eraser") {
      contextRef.current.strokeStyle = "#ffffff";
    } else {
      contextRef.current.strokeStyle = color;
    }
    contextRef.current.lineWidth = brushSize;
  };

  // Descargar canvas como PNG
  const downloadCanvas = () => {
    if (!canvasRef.current) return;

    const link = document.createElement("a");
    link.download = `paint-${new Date()
      .toISOString()
      .slice(0, 19)
      .replace(/:/g, "-")}.png`;
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
  };

  // Iconos para herramientas
  const tools: { id: ToolType; icon: JSX.Element; label: string }[] = [
    {
      id: "brush",
      icon: <FaPaintBrush size={24} className="text-white" />,
      label: "Pincel",
    },
    {
      id: "marker",
      icon: <FaMarker size={24} className="text-white" />,
      label: "Marcador",
    },
    {
      id: "spray",
      icon: <FaSprayCan size={24} className="text-white" />,
      label: "Spray",
    },
    {
      id: "eraser",
      icon: <FaEraser size={24} className="text-white" />,
      label: "Borrador",
    },
  ];

  return (
    <div className="flex flex-col items-center p-2 w-full h-full">
      {/* Menú de herramientas responsive */}
      <div className="flex flex-wrap justify-center gap-2 md:gap-4 mb-4 p-3 bg-black/50 rounded-lg shadow-md w-full max-w-4xl">
        {/* Selector de herramientas con iconos */}
        <div className="flex flex-wrap gap-1 md:gap-2 justify-center">
          {tools.map((t) => (
            <button
              key={t.id}
              onClick={() => setTool(t.id)}
              className={`p-2 rounded-lg transition-all
                ${
                  tool === t.id
                    ? "bg-blue-500 text-white shadow-md"
                    : "bg-transparent hover:bg-gray-200"
                }`}
              title={t.label}
            >
              <span className="text-xl md:text-2xl">{t.icon}</span>
            </button>
          ))}
        </div>

        {/* Separador */}
        <div className="border-l border-gray-300 mx-1 md:mx-2 h-auto self-stretch" />

        {/* Selector de color */}
        <div className="flex flex-col items-center">
          <label className="text-xs md:text-sm mb-1 font-medium text-white">
            Color
          </label>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-8 h-8 md:w-10 md:h-10 cursor-pointer rounded"
            disabled={tool === "eraser"}
          />
        </div>

        {/* Tamaño del trazo */}
        <div className="flex flex-col items-center font-bold">
          <label className="text-xs md:text-sm mb-1 font-medium text-white">
            Size
          </label>
          <div className="flex items-center">
            <input
              type="range"
              min="1"
              max="20"
              value={brushSize}
              onChange={(e) => setBrushSize(parseInt(e.target.value))}
              className="w-24 md:w-32"
            />
            <span className="ml-2 w-6 text-sm md:text-base text-white">
              {brushSize}
            </span>
          </div>
        </div>

        {/* Botones adicionales */}
        <div className="flex flex-wrap gap-1 md:gap-2 justify-center">
          {/* Botón para limpiar */}
          <button
            onClick={clearCanvas}
            className="p-2 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors"
            title="Clear canvas"
          >
            <FaTrash size={24} />
          </button>

          {/* Botón para descargar */}
          <button
            onClick={downloadCanvas}
            className=" p-2 rounded-lg bg-green-600 hover:bg-green-700 text-white transition-colors"
            title="Download drawing"
          >
            <FaDownload size={24} />
          </button>
        </div>
      </div>

      {/* Canvas de dibujo con tamaño fijo y responsive */}
      <div className="w-full max-w-4xl flex justify-center">
        <canvas
          ref={canvasRef}
          width={1920}
          height={1080}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={endDrawing}
          onMouseOut={endDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={endDrawing}
          className="border border-gray-300 bg-white rounded-lg shadow-lg cursor-crosshair"
          style={{
            width: "100%",
            height: "auto",
            maxWidth: "100%",
            aspectRatio: `${CANVAS_WIDTH}/${CANVAS_HEIGHT}`,
          }}
        />
      </div>

      {/* Indicador de herramienta activa */}
      <div className="mt-4 text-center">
        <p className="text-sm md:text-base text-white font-bold">
          Current tool:{" "}
          <span className="capitalize px-2 py-1 bg-blue-100 text-black rounded">
            {tool}
          </span>
        </p>
      </div>
    </div>
  );
}
