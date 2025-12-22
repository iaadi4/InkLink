"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Pencil, Square, Circle, Type, Hand, Trash2, Download,
  Users, Undo, Redo, ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Point { x: number; y: number; }

interface DrawingElement {
  id: string;
  type: "pen" | "rectangle" | "circle" | "text";
  points?: Point[];
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  text?: string;
  color: string;
  strokeWidth: number;
  userId?: string;
}

interface RemoteCursor {
  x: number;
  y: number;
  userId: string;
  userName: string;
  color: string;
}

type Tool = "select" | "pen" | "rectangle" | "circle" | "text";

const COLORS = ["#000000", "#EF4444", "#3B82F6", "#10B981", "#F59E0B", "#8B5CF6"];

const CollaborativeDrawingRoom = () => {
  const params = useParams();
  const roomId = params?.roomId as string;
  const router = useRouter();

  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null); // New ref for the container
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 }); // State for dynamic size
  
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // State
  const [tool, setTool] = useState<Tool>("pen");
  const [color, setColor] = useState("#000000");
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [elements, setElements] = useState<DrawingElement[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentElement, setCurrentElement] = useState<DrawingElement | null>(null);
  const [history, setHistory] = useState<DrawingElement[][]>([[]]);
  const [historyStep, setHistoryStep] = useState(0);

  const [remoteCursors, setRemoteCursors] = useState<Map<string, RemoteCursor>>(new Map());
  const [connectedUsers, setConnectedUsers] = useState<number>(1);
  const currentUserIdRef = useRef<string>(`user-${Math.random().toString(36).substr(2, 9)}`);
  const currentUserColorRef = useRef<string>(COLORS[Math.floor(Math.random() * COLORS.length)]);

  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [scale] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setCanvasSize({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };

    // Initial size
    updateSize();

    // Observer for robust resizing
    const resizeObserver = new ResizeObserver(() => updateSize());
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, []);

  const screenToCanvas = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left - offset.x) / scale,
      y: (clientY - rect.top - offset.y) / scale,
    };
  }, [offset, scale]);

  // WebSocket Connection
  useEffect(() => {
    const websocket = new WebSocket("ws://localhost:8080");

    websocket.onopen = () => {
      setIsConnected(true);
      websocket.send(JSON.stringify({ type: "join-room", roomId }));
      toast.success("Connected to room");
    };

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.userId === currentUserIdRef.current) return;

      if (data.type === "drawing") {
        setElements(prev => {
          const filtered = prev.filter(el => el.id !== data.element.id);
          return [...filtered, data.element];
        });
      } else if (data.type === "cursor") {
        setRemoteCursors(prev => {
          const updated = new Map(prev);
          updated.set(data.userId, {
            x: data.x,
            y: data.y,
            userId: data.userId,
            userName: data.userName || "Peer",
            color: data.color || "#3B82F6",
          });
          return updated;
        });
      } else if (data.type === "clear") {
        setElements([]);
        setHistory([[]]);
        setHistoryStep(0);
      } else if (data.type === "user-count") {
        setConnectedUsers(data.count);
      }
    };

    setWs(websocket);
    return () => {
      if (websocket.readyState === WebSocket.OPEN) {
        websocket.send(JSON.stringify({ type: "leave-room", roomId }));
      }
      websocket.close();
    };
  }, [roomId]);

  const sendDrawingData = useCallback((element: DrawingElement) => {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: "send-data",
        roomId,
        message: { type: "drawing", element, userId: currentUserIdRef.current }
      }));
    }
  }, [ws, roomId]);

  const lastCursorSendRef = useRef<number>(0);
  const sendCursorPosition = useCallback((clientX: number, clientY: number) => {
    const now = Date.now();
    if (now - lastCursorSendRef.current < 50) return;
    lastCursorSendRef.current = now;

    if (ws?.readyState === WebSocket.OPEN) {
      const point = screenToCanvas(clientX, clientY);
      ws.send(JSON.stringify({
        type: "send-data",
        roomId,
        message: {
          type: "cursor",
          x: point.x,
          y: point.y,
          userId: currentUserIdRef.current,
          color: currentUserColorRef.current
        }
      }));
    }
  }, [ws, roomId, screenToCanvas]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (tool === "select") {
      setIsPanning(true);
      setPanStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
      return;
    }

    const point = screenToCanvas(e.clientX, e.clientY);
    setIsDrawing(true);

    const newElement: DrawingElement = {
      id: `${Date.now()}-${Math.random()}`,
      type: tool as any,
      color,
      strokeWidth,
      userId: currentUserIdRef.current,
    };

    if (tool === "pen") {
      newElement.points = [point];
    } else if (tool === "rectangle" || tool === "circle") {
      newElement.x = point.x;
      newElement.y = point.y;
      newElement.width = 0;
      newElement.height = 0;
    } else if (tool === "text") {
      const text = prompt("Enter text:");
      if (text) {
        newElement.x = point.x;
        newElement.y = point.y;
        newElement.text = text;
        const newElements = [...elements, newElement];
        setElements(newElements);
        addToHistory(newElements);
        sendDrawingData(newElement);
      }
      setIsDrawing(false);
      return;
    }
    setCurrentElement(newElement);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    sendCursorPosition(e.clientX, e.clientY);

    if (isPanning) {
      setOffset({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
      return;
    }

    if (!isDrawing || !currentElement) return;
    const point = screenToCanvas(e.clientX, e.clientY);

    if (tool === "pen" && currentElement.points) {
      setCurrentElement({ ...currentElement, points: [...currentElement.points, point] });
    } else if ((tool === "rectangle" || tool === "circle") && currentElement.x !== undefined && currentElement.y !== undefined) {
      setCurrentElement({ ...currentElement, width: point.x - currentElement.x, height: point.y - currentElement.y });
    }
  };

  const stopDrawing = () => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }
    if (isDrawing && currentElement) {
      const newElements = [...elements, currentElement];
      setElements(newElements);
      addToHistory(newElements);
      sendDrawingData(currentElement);
      setCurrentElement(null);
    }
    setIsDrawing(false);
  };

  const addToHistory = (newElements: DrawingElement[]) => {
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push(newElements);
    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
  };

  const undo = () => {
    if (historyStep > 0) {
      const newStep = historyStep - 1;
      setHistoryStep(newStep);
      setElements(history[newStep] || []);
    }
  };

  const redo = () => {
    if (historyStep < history.length - 1) {
      const newStep = historyStep + 1;
      setHistoryStep(newStep);
      setElements(history[newStep] || []);
    }
  };

  const clearCanvas = () => {
    setElements([]);
    setHistory([[]]);
    setHistoryStep(0);
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: "send-data",
        roomId,
        message: { type: "clear" }
      }));
    }
  };

  const downloadCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `whiteboard-${roomId}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  // Rendering Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear entire canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.save();
    ctx.translate(offset.x, offset.y);
    ctx.scale(scale, scale);

    // 2. Infinite Grid Implementation
    // Calculate start/end based on viewport offset to allow infinite panning
    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 1 / scale;
    
    const gridSize = 50;
    const startX = Math.floor((-offset.x / scale) / gridSize) * gridSize;
    const endX = Math.floor(((canvas.width - offset.x) / scale) / gridSize) * gridSize + gridSize;
    
    const startY = Math.floor((-offset.y / scale) / gridSize) * gridSize;
    const endY = Math.floor(((canvas.height - offset.y) / scale) / gridSize) * gridSize + gridSize;

    // Vertical lines
    for (let x = startX; x <= endX; x += gridSize) {
      ctx.beginPath(); 
      ctx.moveTo(x, startY); 
      ctx.lineTo(x, endY); 
      ctx.stroke();
    }
    
    // Horizontal lines
    for (let y = startY; y <= endY; y += gridSize) {
      ctx.beginPath(); 
      ctx.moveTo(startX, y); 
      ctx.lineTo(endX, y); 
      ctx.stroke();
    }

    // Draw Elements
    const allElements = currentElement ? [...elements, currentElement] : elements;
    allElements.forEach((element) => {
      ctx.strokeStyle = element.color;
      ctx.fillStyle = element.color;
      ctx.lineWidth = element.strokeWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      if (element.type === "pen" && element.points) {
        ctx.beginPath();
        if (element.points[0]) {
          ctx.moveTo(element.points[0].x, element.points[0].y);
          element.points.forEach(p => ctx.lineTo(p.x, p.y));
          ctx.stroke();
        }
      } else if (element.type === "rectangle" && element.x !== undefined && element.y !== undefined && element.width !== undefined && element.height !== undefined) {
        ctx.strokeRect(element.x, element.y, element.width, element.height);
      } else if (element.type === "circle" && element.x !== undefined && element.y !== undefined && element.width !== undefined && element.height !== undefined) {
        const radius = Math.sqrt(element.width ** 2 + element.height ** 2) / 2;
        ctx.beginPath();
        ctx.arc(element.x + element.width / 2, element.y + element.height / 2, radius, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (element.type === "text" && element.x !== undefined && element.y !== undefined && element.text) {
        ctx.font = `${element.strokeWidth * 8}px Arial`;
        ctx.fillText(element.text, element.x, element.y);
      }
    });

    remoteCursors.forEach((cursor) => {
      ctx.fillStyle = cursor.color;
      ctx.beginPath();
      ctx.arc(cursor.x, cursor.y, 6 / scale, 0, 2 * Math.PI);
      ctx.fill();
      ctx.font = `${12 / scale}px sans-serif`;
      ctx.fillText(cursor.userName, cursor.x + 10, cursor.y);
    });

    ctx.restore();
  }, [elements, currentElement, offset, scale, remoteCursors, canvasSize]); // Added canvasSize to dependencies

  return (
    <div className="h-screen flex flex-col bg-white">
      <header className="h-14 border-b flex items-center justify-between px-4 shrink-0 z-10 bg-white">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <div className="font-bold">Room: {roomId}</div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm bg-gray-100 px-3 py-1 rounded-full">
            <Users className="w-4 h-4" /> {connectedUsers} Online
          </div>
          <Button variant="outline" size="sm" onClick={downloadCanvas}>
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-16 border-r flex flex-col items-center py-4 gap-4 bg-gray-50 shrink-0 z-10">
          <Button variant={tool === "select" ? "default" : "ghost"} size="icon" onClick={() => setTool("select")}>
            <Hand className="w-5 h-5" />
          </Button>
          <Button variant={tool === "pen" ? "default" : "ghost"} size="icon" onClick={() => setTool("pen")}>
            <Pencil className="w-5 h-5" />
          </Button>
          <Button variant={tool === "rectangle" ? "default" : "ghost"} size="icon" onClick={() => setTool("rectangle")}>
            <Square className="w-5 h-5" />
          </Button>
          <Button variant={tool === "circle" ? "default" : "ghost"} size="icon" onClick={() => setTool("circle")}>
            <Circle className="w-5 h-5" />
          </Button>
          <Button variant={tool === "text" ? "default" : "ghost"} size="icon" onClick={() => setTool("text")}>
            <Type className="w-5 h-5" />
          </Button>
          <div className="w-8 border-t my-2" />
          <div className="flex flex-col gap-2">
            {COLORS.map(c => (
              <button key={c} onClick={() => setColor(c)} className={`w-6 h-6 rounded-full border ${color === c ? 'ring-2 ring-blue-500' : ''}`} style={{ backgroundColor: c }} />
            ))}
          </div>
          <div className="w-8 border-t my-2" />
          <Button variant="ghost" size="icon" onClick={undo} disabled={historyStep === 0}><Undo className="w-5 h-5" /></Button>
          <Button variant="ghost" size="icon" onClick={redo} disabled={historyStep === history.length - 1}><Redo className="w-5 h-5" /></Button>
          <Button variant="ghost" size="icon" onClick={clearCanvas} className="text-red-500"><Trash2 className="w-5 h-5" /></Button>
        </aside>

        <main 
          ref={containerRef} 
          className="flex-1 bg-white relative overflow-hidden"
        >
          <canvas
            ref={canvasRef}
            width={canvasSize.width}
            height={canvasSize.height}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            className="block touch-none"
            style={{ cursor: tool === "select" ? "grab" : "crosshair" }}
          />
        </main>
      </div>
    </div>
  );
};

export default CollaborativeDrawingRoom;