"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  Pencil,
  Square,
  Circle,
  Type,
  Hand,
  Trash2,
  Download,
  Upload,
  Users,
  Undo,
  Redo,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface Point {
  x: number;
  y: number;
}

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
const STROKE_WIDTHS = [2, 4, 6, 8];

const CollaborativeDrawingRoom = () => {
  const params = useParams();
  const roomId = params?.roomId as string;
  const router = useRouter();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Drawing state
  const [tool, setTool] = useState<Tool>("pen");
  const [color, setColor] = useState("#000000");
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [elements, setElements] = useState<DrawingElement[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentElement, setCurrentElement] = useState<DrawingElement | null>(null);
  const [history, setHistory] = useState<DrawingElement[][]>([[]]);
  const [historyStep, setHistoryStep] = useState(0);

  // Collaboration state
  const [remoteCursors, setRemoteCursors] = useState<Map<string, RemoteCursor>>(new Map());
  const [connectedUsers, setConnectedUsers] = useState<number>(1);
  const currentUserIdRef = useRef<string>(`user-${Math.random().toString(36).substr(2, 9)}`);
  const currentUserColorRef = useRef<string>(COLORS[Math.floor(Math.random() * COLORS.length)]);

  // Pan and zoom
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // WebSocket connection
  useEffect(() => {
    // Get JWT token from localStorage or cookie
    const token = localStorage.getItem("token") || "";
    
    if (!token) {
      console.warn("No authentication token found");
      return;
    }

    const websocket = new WebSocket("ws://localhost:8080");

    websocket.onopen = () => {
      console.log("WebSocket connected");
      setIsConnected(true);
      
      // Join room
      websocket.send(JSON.stringify({
        type: "join-room",
        roomId,
      }));
    };

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === "drawing") {
        // Receive drawing data from other users
        if (data.userId !== currentUserIdRef.current) {
          setElements(prev => {
            const exists = prev.find(el => el.id === data.element.id);
            if (exists) {
              return prev.map(el => el.id === data.element.id ? data.element : el);
            }
            return [...prev, data.element];
          });
        }
      } else if (data.type === "cursor") {
        // Receive cursor position from other users
        if (data.userId !== currentUserIdRef.current) {
          setRemoteCursors(prev => {
            const updated = new Map(prev);
            updated.set(data.userId, {
              x: data.x,
              y: data.y,
              userId: data.userId,
              userName: data.userName || "User",
              color: data.color || "#3B82F6",
            });
            return updated;
          });
        }
      } else if (data.type === "clear") {
        setElements([]);
      } else if (data.type === "user-count") {
        setConnectedUsers(data.count);
      }
    };

    websocket.onclose = () => {
      console.log("WebSocket disconnected");
      setIsConnected(false);
    };

    setWs(websocket);

    return () => {
      if (websocket.readyState === WebSocket.OPEN) {
        websocket.send(JSON.stringify({
          type: "leave-room",
          roomId,
        }));
      }
      websocket.close();
    };
  }, [roomId]);

  // Send drawing data via WebSocket
  const sendDrawingData = useCallback((element: DrawingElement) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: "send-data",
        roomId,
        message: JSON.stringify({
          type: "drawing",
          element,
          userId: currentUserIdRef.current,
        }),
      }));
    }
  }, [ws, roomId]);

  // Send cursor position
  const sendCursorPosition = useCallback((x: number, y: number) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: "send-data",
        roomId,
        message: JSON.stringify({
          type: "cursor",
          x,
          y,
          userId: currentUserIdRef.current,
          userName: "You",
          color: currentUserColorRef.current,
        }),
      }));
    }
  }, [ws, roomId]);

  // Transform screen coordinates to canvas coordinates
  const screenToCanvas = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left - offset.x) / scale,
      y: (clientY - rect.top - offset.y) / scale,
    };
  };

  // Drawing functions
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
        setElements(prev => [...prev, newElement]);
        addToHistory([...elements, newElement]);
        sendDrawingData(newElement);
      }
      return;
    }

    setCurrentElement(newElement);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    sendCursorPosition(e.clientX, e.clientY);

    if (isPanning) {
      setOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
      return;
    }

    if (!isDrawing || !currentElement) return;

    const point = screenToCanvas(e.clientX, e.clientY);

    if (tool === "pen" && currentElement.points) {
      setCurrentElement({
        ...currentElement,
        points: [...currentElement.points, point],
      });
    } else if ((tool === "rectangle" || tool === "circle") && currentElement.x !== undefined && currentElement.y !== undefined) {
      setCurrentElement({
        ...currentElement,
        width: point.x - currentElement.x,
        height: point.y - currentElement.y,
      });
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
      setHistoryStep(historyStep - 1);
      setElements(history[historyStep - 1] || []);
    }
  };

  const redo = () => {
    if (historyStep < history.length - 1) {
      setHistoryStep(historyStep + 1);
      setElements(history[historyStep + 1] || []);
    }
  };

  const clearCanvas = () => {
    setElements([]);
    setHistory([[]]);
    setHistoryStep(0);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: "send-data",
        roomId,
        message: JSON.stringify({
          type: "clear",
        }),
      }));
    }
  };

  const downloadCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const link = document.createElement("a");
    link.download = `inklink-${roomId}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  // Render canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply transformations
    ctx.save();
    ctx.translate(offset.x, offset.y);
    ctx.scale(scale, scale);

    // Draw grid
    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 1;
    const gridSize = 50;
    for (let x = 0; x < canvas.width / scale; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height / scale);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height / scale; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width / scale, y);
      ctx.stroke();
    }

    // Draw all elements
    const allElements = currentElement ? [...elements, currentElement] : elements;
    
    allElements.forEach((element) => {
      ctx.strokeStyle = element.color;
      ctx.fillStyle = element.color;
      ctx.lineWidth = element.strokeWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      if (element.type === "pen" && element.points && element.points.length > 0) {
        ctx.beginPath();
        const firstPoint = element.points[0];
        if (firstPoint) {
          ctx.moveTo(firstPoint.x, firstPoint.y);
          element.points.forEach((point) => {
            ctx.lineTo(point.x, point.y);
          });
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

    ctx.restore();

    // Draw remote cursors on top
    remoteCursors.forEach((cursor) => {
      const canvasPoint = {
        x: cursor.x * scale + offset.x,
        y: cursor.y * scale + offset.y,
      };
      
      ctx.save();
      ctx.fillStyle = cursor.color;
      ctx.beginPath();
      ctx.arc(canvasPoint.x, canvasPoint.y, 8, 0, 2 * Math.PI);
      ctx.fill();
      
      ctx.fillStyle = "#000000";
      ctx.font = "12px Arial";
      ctx.fillText(cursor.userName, canvasPoint.x + 12, canvasPoint.y + 5);
      ctx.restore();
    });
  }, [elements, currentElement, offset, scale, remoteCursors]);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/home")}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Room: {roomId}</h1>
            <p className="text-xs text-gray-500">
              {isConnected ? "Connected" : "Connecting..."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2">
            <Users className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">
              {connectedUsers} online
            </span>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={downloadCanvas}
            className="text-gray-600 hover:text-gray-900"
          >
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Toolbar */}
        <aside className="w-20 bg-white border-r border-gray-200 flex flex-col items-center py-4 gap-2">
          <Button
            variant={tool === "select" ? "default" : "ghost"}
            size="icon"
            onClick={() => setTool("select")}
            className="w-12 h-12"
            title="Pan (Hand)"
          >
            <Hand className="w-5 h-5" />
          </Button>
          
          <Button
            variant={tool === "pen" ? "default" : "ghost"}
            size="icon"
            onClick={() => setTool("pen")}
            className="w-12 h-12"
            title="Pen"
          >
            <Pencil className="w-5 h-5" />
          </Button>
          
          <Button
            variant={tool === "rectangle" ? "default" : "ghost"}
            size="icon"
            onClick={() => setTool("rectangle")}
            className="w-12 h-12"
            title="Rectangle"
          >
            <Square className="w-5 h-5" />
          </Button>
          
          <Button
            variant={tool === "circle" ? "default" : "ghost"}
            size="icon"
            onClick={() => setTool("circle")}
            className="w-12 h-12"
            title="Circle"
          >
            <Circle className="w-5 h-5" />
          </Button>
          
          <Button
            variant={tool === "text" ? "default" : "ghost"}
            size="icon"
            onClick={() => setTool("text")}
            className="w-12 h-12"
            title="Text"
          >
            <Type className="w-5 h-5" />
          </Button>

          <div className="border-t border-gray-200 w-full my-2"></div>

          {/* Color picker */}
          <div className="flex flex-col gap-2">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-8 h-8 rounded-full border-2 ${
                  color === c ? "border-indigo-600" : "border-gray-300"
                }`}
                style={{ backgroundColor: c }}
                title={c}
              />
            ))}
          </div>

          <div className="border-t border-gray-200 w-full my-2"></div>

          {/* Stroke width */}
          <div className="flex flex-col gap-2">
            {STROKE_WIDTHS.map((width) => (
              <button
                key={width}
                onClick={() => setStrokeWidth(width)}
                className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                  strokeWidth === width ? "border-indigo-600 bg-indigo-50" : "border-gray-300"
                }`}
                title={`${width}px`}
              >
                <div
                  className="rounded-full bg-gray-800"
                  style={{ width: width, height: width }}
                />
              </button>
            ))}
          </div>

          <div className="border-t border-gray-200 w-full my-2"></div>

          <Button
            variant="ghost"
            size="icon"
            onClick={undo}
            disabled={historyStep === 0}
            className="w-12 h-12"
            title="Undo"
          >
            <Undo className="w-5 h-5" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={redo}
            disabled={historyStep === history.length - 1}
            className="w-12 h-12"
            title="Redo"
          >
            <Redo className="w-5 h-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={clearCanvas}
            className="w-12 h-12 text-red-600 hover:text-red-700 hover:bg-red-50"
            title="Clear Canvas"
          >
            <Trash2 className="w-5 h-5" />
          </Button>
        </aside>

        {/* Canvas */}
        <div className="flex-1 overflow-hidden relative">
          <canvas
            ref={canvasRef}
            width={window.innerWidth - 80}
            height={window.innerHeight - 60}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            className="cursor-crosshair bg-white"
            style={{ cursor: tool === "select" ? "grab" : "crosshair" }}
          />
        </div>
      </div>
    </div>
  );
};

export default CollaborativeDrawingRoom;
