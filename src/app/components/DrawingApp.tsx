"use client"

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Define our TypeScript types
type Tool = 'brush' | 'eraser' | 'rectangle' | 'circle' | 'line' | 'square';
type Layer = {
id: string;
name: string;
visible: boolean;
locked: boolean;
canvas: HTMLCanvasElement | null; // ← Add this line
};

type DrawAction = {
  layerId: string;
  imageData: ImageData;
};

// SVG Icon components
const BrushIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" > <path d="M9.06 11.9l8.07-8.06a2.85 2.85 0 1 1 4.03 4.03l-8.06 8.08"></path> <path d="M7.07 14.94c-1.66 0-3 1.35-3 3.02 0 1.33-2.5 1.52-2 2.02 1.08 1.1 2.49 2.02 4 2.02 2.2 0 4-1.8 4-4.04a3.01 3.01 0 0 0-3-3.02z"></path> </svg>
);

const EraserIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"> <path d="M20 20H9"></path> <path d="M20 20H4l7-7"></path> <path d="M18 12l-6-6-8 8 6 6z"></path> </svg>
);

const RectangleIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"> <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect> </svg>
);

const CircleIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"> <circle cx="12" cy="12" r="10"></circle> </svg>
);

const LineIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"> <line x1="5" y1="19" x2="19" y2="5"></line> </svg>
);

const SquareIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"> <rect x="4" y="4" width="16" height="16"></rect> </svg>
);

const UndoIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"> <path d="M3 7v6h6"></path> <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"></path> </svg>
);

const RedoIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"> <path d="M21 7v6h-6"></path> <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"></path> </svg>
);

const TrashIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"> <path d="M3 6h18"></path> <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path> <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path> </svg>
);

const DownloadIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"> <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path> <polyline points="7 10 12 15 17 10"></polyline> <line x1="12" y1="15" x2="12" y2="3"></line> </svg>
);

const LayersIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"> <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon> <polyline points="2 17 12 22 22 17"></polyline> <polyline points="2 12 12 17 22 12"></polyline> </svg>
);

const EyeIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"> <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path> <circle cx="12" cy="12" r="3"></circle> </svg>
);

const EyeOffIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"> <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path> <line x1="1" y1="1" x2="23" y2="23"></line> </svg>
);

const LockIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"> <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect> <path d="M7 11V7a5 5 0 0 1 10 0v4"></path> </svg>
);

const UnlockIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"> <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect> <path d="M7 11V7a5 5 0 0 1 9.9-1"></path> </svg>
);

const DrawingApp = () => {
// State management
const [showLanding, setShowLanding] = useState(true);
const [activeTool, setActiveTool] = useState<Tool>('brush');
const [brushSize, setBrushSize] = useState(2);
const [color, setColor] = useState('#000000');
const [showColorPicker, setShowColorPicker] = useState(false);
const [showLayers, setShowLayers] = useState(false);
const [layers, setLayers] = useState<Layer[]>([]);

const [activeLayer, setActiveLayer] = useState<string>('1');
const [undoStack, setUndoStack] = useState<DrawAction[]>([]);
  const [redoStack, setRedoStack] = useState<DrawAction[]>([]);


  // Drawing state refs

  const displayCanvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const lastX = useRef(0);
  const lastY = useRef(0);
  const startX = useRef(0);
  const startY = useRef(0);
  const tempCanvasRef = useRef<HTMLCanvasElement | null>(null);

// UI Animation variants
const fadeInUp = {
hidden: { opacity: 0, y: 20 },
visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const staggerContainer = {
hidden: { opacity: 0 },
visible: {
opacity: 1,
transition: {
staggerChildren: 0.1
}
}
};
useEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 800; // or any dimensions you need
    canvas.height = 600;
  
    setLayers([
      {
        id: '1',
        name: 'Layer 1',
        visible: true,
        locked: false,
        canvas,
      },
    ]);
  }, []);
  
  const compositeCanvases = useCallback(() => {
    if (!displayCanvasRef.current) return;
    
    const displayCtx = displayCanvasRef.current.getContext('2d');
    if (!displayCtx) return;
    
    // Clear the display canvas
    displayCtx.clearRect(0, 0, displayCanvasRef.current.width, displayCanvasRef.current.height);
    
    // Composite all visible layers in order
    layers.forEach(layer => {
      if (layer.visible && layer.canvas) {
        displayCtx.drawImage(layer.canvas, 0, 0);
      }
    });
    
    // Draw the temp canvas on top if it exists
    if (tempCanvasRef.current) {
      displayCtx.drawImage(tempCanvasRef.current, 0, 0);
    }
  }, [layers]);

// Add this useEffect hook to initialize canvases after mounting
useEffect(() => {
  if (!showLanding && displayCanvasRef.current) {
    const containerWidth = displayCanvasRef.current.parentElement?.clientWidth || 800;
    const containerHeight = displayCanvasRef.current.parentElement?.clientHeight || 600;
    
    // Set display canvas dimensions
    displayCanvasRef.current.width = containerWidth;
    displayCanvasRef.current.height = containerHeight;
    
    // Initialize all layer canvases with same dimensions
    const updatedLayers = layers.map(layer => {
      if (layer.canvas) {
        layer.canvas.width = containerWidth;
        layer.canvas.height = containerHeight;
      }
      return layer;
    });
    
    setLayers(updatedLayers);
    compositeCanvases();
  }
}, [showLanding, layers, compositeCanvases]);

// // Add this effect to handle window resize
useEffect(() => {
  const handleResize = () => {
    if (!displayCanvasRef.current || showLanding) return;
    
    const containerWidth = displayCanvasRef.current.parentElement?.clientWidth || 800;
    const containerHeight = displayCanvasRef.current.parentElement?.clientHeight || 600;
    
    // Update display canvas dimensions
    displayCanvasRef.current.width = containerWidth;
    displayCanvasRef.current.height = containerHeight;
    
    // Update all layer canvases with same dimensions
    layers.forEach(layer => {
      if (layer.canvas) {
        const ctx = layer.canvas.getContext('2d');
        const imageData = ctx?.getImageData(0, 0, layer.canvas.width, layer.canvas.height);
        
        layer.canvas.width = containerWidth;
        layer.canvas.height = containerHeight;
        
        if (ctx && imageData) {
          ctx.putImageData(imageData, 0, 0);
        }
      }
    });
    
    compositeCanvases();
  };
  
  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, [layers, showLanding, compositeCanvases]);

// Color palette
const colorPalette = [
'#000000', '#FFFFFF', '#FF0000', '#FFA500',
'#FFFF00', '#008000', '#0000FF', '#4B0082',
'#EE82EE', '#800000', '#808000', '#008080',
'#000080', '#800080', '#FFC0CB', '#A52A2A'
];


// Add touch event handling for mobile devices
const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
  e.preventDefault();
  if (!displayCanvasRef.current) return;
  
  const canvas = displayCanvasRef.current;
  const rect = canvas.getBoundingClientRect();
  const touch = e.touches[0];
  const x = touch.clientX - rect.left;
  const y = touch.clientY - rect.top;
  
  startX.current = x;
  startY.current = y;
  lastX.current = x;
  lastY.current = y;
  isDrawing.current = true;
  
  if (activeTool === 'brush' || activeTool === 'eraser') {
    const currentLayer = layers.find(layer => layer.id === activeLayer);
    if (!currentLayer || !currentLayer.canvas || currentLayer.locked) return;
    
    const ctx = currentLayer.canvas.getContext('2d');
    if (!ctx) return;
    
    saveCurrentStateForUndo();
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = brushSize;
    
    if (activeTool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color;
    }
  } else if (activeTool === 'rectangle' || activeTool === 'circle' || activeTool === 'line' || activeTool === 'square') {
    createTempCanvas();
  }
  
  compositeCanvases();
};

const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
  e.preventDefault();
  if (!isDrawing.current || !displayCanvasRef.current) return;
  
  const canvas = displayCanvasRef.current;
  const rect = canvas.getBoundingClientRect();
  const touch = e.touches[0];
  const x = touch.clientX - rect.left;
  const y = touch.clientY - rect.top;
  
  const currentLayer = layers.find(layer => layer.id === activeLayer);
  if (!currentLayer || !currentLayer.canvas || currentLayer.locked) return;
  
  if (activeTool === 'brush' || activeTool === 'eraser') {
    const ctx = currentLayer.canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.lineTo(x, y);
    ctx.stroke();
  } else if ((activeTool === 'rectangle' || activeTool === 'circle' || activeTool === 'line' || activeTool === 'square') && tempCanvasRef.current) {
    const tempCtx = tempCanvasRef.current.getContext('2d');
    if (!tempCtx) return;
    
    tempCtx.clearRect(0, 0, tempCanvasRef.current.width, tempCanvasRef.current.height);
    
    tempCtx.lineWidth = brushSize;
    tempCtx.strokeStyle = color;
    tempCtx.lineCap = 'round';
    tempCtx.lineJoin = 'round';
    
    if (activeTool === 'rectangle') {
      const width = x - startX.current;
      const height = y - startY.current;
      tempCtx.strokeRect(startX.current, startY.current, width, height);
    } else if (activeTool === 'square') {
      // Draw square preview - use the max of width/height to make a perfect square
      const side = Math.max(Math.abs(x - startX.current), Math.abs(y - startY.current));
      const signX = x >= startX.current ? 1 : -1;
      const signY = y >= startY.current ? 1 : -1;
      tempCtx.strokeRect(startX.current, startY.current, side * signX, side * signY);
    } else if (activeTool === 'circle') {
      const radius = Math.sqrt(
        Math.pow(x - startX.current, 2) + Math.pow(y - startY.current, 2)
      );
      tempCtx.beginPath();
      tempCtx.arc(startX.current, startY.current, radius, 0, Math.PI * 2);
      tempCtx.stroke();
    } else if (activeTool === 'line') {
      // Draw line preview
      tempCtx.beginPath();
      tempCtx.moveTo(startX.current, startY.current);
      tempCtx.lineTo(x, y);
      tempCtx.stroke();
    }
  }
  
  lastX.current = x;
  lastY.current = y;
  
  compositeCanvases();
};

const handleTouchEnd = () => {
  endDrawing();
};


const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
  if (!displayCanvasRef.current) return;
  
  const canvas = displayCanvasRef.current;
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  
  // Save starting point for shape tools
  startX.current = x;
  startY.current = y;
  lastX.current = x;
  lastY.current = y;
  isDrawing.current = true;

  // For brush and eraser, we start drawing immediately
  if (activeTool === 'brush' || activeTool === 'eraser') {
    const currentLayer = layers.find(layer => layer.id === activeLayer);
    if (!currentLayer || !currentLayer.canvas || currentLayer.locked) return;
    
    const ctx = currentLayer.canvas.getContext('2d');
    if (!ctx) return;
    
    // Save the current state for undo
    saveCurrentStateForUndo();
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = brushSize;
    
    if (activeTool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color;
    }
  } else if (activeTool === 'rectangle' || activeTool === 'circle' || activeTool === 'line' || activeTool === 'square') {
    // For shape tools, we'll create a temporary canvas for preview
    createTempCanvas();

  }
  
  compositeCanvases();
};

const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
  if (!isDrawing.current || !displayCanvasRef.current) return;
  
  const canvas = displayCanvasRef.current;
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  
  const currentLayer = layers.find(layer => layer.id === activeLayer);
  if (!currentLayer || !currentLayer.canvas || currentLayer.locked) return;
  
  if (activeTool === 'brush' || activeTool === 'eraser') {
    const ctx = currentLayer.canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.lineTo(x, y);
    ctx.stroke();
  }else if ((activeTool === 'rectangle' || activeTool === 'circle' || activeTool === 'line' || activeTool === 'square') && tempCanvasRef.current) {
    const tempCtx = tempCanvasRef.current.getContext('2d');
    if (!tempCtx) return;
    
    // Clear the temp canvas
    tempCtx.clearRect(0, 0, tempCanvasRef.current.width, tempCanvasRef.current.height);
    
    // Set drawing styles
    tempCtx.lineWidth = brushSize;
    tempCtx.strokeStyle = color;
    tempCtx.lineCap = 'round';
    tempCtx.lineJoin = 'round';
    
    if (activeTool === 'rectangle') {
      // Draw rectangle preview
      const width = x - startX.current;
      const height = y - startY.current;
      tempCtx.strokeRect(startX.current, startY.current, width, height);
    } else if (activeTool === 'square') {
      // Draw square preview - use the max of width/height to make a perfect square
      const side = Math.max(Math.abs(x - startX.current), Math.abs(y - startY.current));
      const signX = x >= startX.current ? 1 : -1;
      const signY = y >= startY.current ? 1 : -1;
      tempCtx.strokeRect(startX.current, startY.current, side * signX, side * signY);
    } else if (activeTool === 'circle') {
      // Draw circle preview
      const radius = Math.sqrt(
        Math.pow(x - startX.current, 2) + Math.pow(y - startY.current, 2)
      );
      tempCtx.beginPath();
      tempCtx.arc(startX.current, startY.current, radius, 0, Math.PI * 2);
      tempCtx.stroke();
    } else if (activeTool === 'line') {
      // Draw line preview
      tempCtx.beginPath();
      tempCtx.moveTo(startX.current, startY.current);
      tempCtx.lineTo(x, y);
      tempCtx.stroke();
    }
  }
  
  lastX.current = x;
  lastY.current = y;
  
  compositeCanvases();
};

const endDrawing = () => {
  if (!isDrawing.current) return;
  isDrawing.current = false;
  
  const currentLayer = layers.find(layer => layer.id === activeLayer);
  if (!currentLayer || !currentLayer.canvas || currentLayer.locked) return;
  
  if (activeTool === 'rectangle' || activeTool === 'circle' || activeTool === 'line' || activeTool === 'square') {
    // Apply the shape from temp canvas to the actual layer
    if (tempCanvasRef.current) {
      const ctx = currentLayer.canvas.getContext('2d');
      const tempCtx = tempCanvasRef.current.getContext('2d');
      
      if (ctx && tempCtx) {
        // Save current state for undo before applying shape
        saveCurrentStateForUndo();
        
        // Draw from temp canvas to actual layer
        ctx.globalCompositeOperation = 'source-over';
        ctx.drawImage(tempCanvasRef.current, 0, 0);
        
        // Clear temp canvas
        tempCtx.clearRect(0, 0, tempCanvasRef.current.width, tempCanvasRef.current.height);
        
        // Remove temp canvas
        if (tempCanvasRef.current.parentNode) {
          tempCanvasRef.current.parentNode.removeChild(tempCanvasRef.current);
        }
        tempCanvasRef.current = null;
      }
    }
  }
  
  // Finish the current path for brush/eraser
  if ((activeTool === 'brush' || activeTool === 'eraser') && currentLayer.canvas) {
    const ctx = currentLayer.canvas.getContext('2d');
    if (ctx) {
      ctx.closePath();
    }
  }
  
  compositeCanvases();
};

const createTempCanvas = () => {
  if (!displayCanvasRef.current) return;
  
  // Clean up any existing temp canvas
  if (tempCanvasRef.current && tempCanvasRef.current.parentNode) {
    tempCanvasRef.current.parentNode.removeChild(tempCanvasRef.current);
  }
  
  // Create a new temp canvas
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = displayCanvasRef.current.width;
  tempCanvas.height = displayCanvasRef.current.height;
  tempCanvas.style.position = 'absolute';
  tempCanvas.style.top = '0';
  tempCanvas.style.left = '0';
  tempCanvas.style.pointerEvents = 'none'; // Allow events to pass through
  
  // Add it as a sibling to the display canvas
  if (displayCanvasRef.current.parentNode) {
    displayCanvasRef.current.parentNode.appendChild(tempCanvas);
  }
  
  tempCanvasRef.current = tempCanvas;
};



const saveCurrentStateForUndo = () => {
  const currentLayer = layers.find(layer => layer.id === activeLayer);
  if (!currentLayer || !currentLayer.canvas) return;
  
  const ctx = currentLayer.canvas.getContext('2d');
  if (!ctx) return;
  
  const imageData = ctx.getImageData(0, 0, currentLayer.canvas.width, currentLayer.canvas.height);
  
  // Add to undo stack
  setUndoStack(prev => [
    ...prev,
    { layerId: currentLayer.id, imageData }
  ]);
  
  // Clear redo stack when a new action is performed
  setRedoStack([]);
};

const undoAction = () => {
  if (undoStack.length === 0) return;
  
  const lastAction = undoStack[undoStack.length - 1];
  const layerToUpdate = layers.find(layer => layer.id === lastAction.layerId);
  
  if (!layerToUpdate || !layerToUpdate.canvas) return;
  
  const ctx = layerToUpdate.canvas.getContext('2d');
  if (!ctx) return;
  
  // Save current state to redo stack
  const currentImageData = ctx.getImageData(
    0, 0, layerToUpdate.canvas.width, layerToUpdate.canvas.height
  );
  
  setRedoStack(prev => [
    ...prev,
    { layerId: layerToUpdate.id, imageData: currentImageData }
  ]);
  
  // Apply the previous state
  ctx.putImageData(lastAction.imageData, 0, 0);
  
  // Remove the action from undo stack
  setUndoStack(prev => prev.slice(0, -1));
  
  compositeCanvases();
};

const redoAction = () => {
  if (redoStack.length === 0) return;
  
  const nextAction = redoStack[redoStack.length - 1];
  const layerToUpdate = layers.find(layer => layer.id === nextAction.layerId);
  
  if (!layerToUpdate || !layerToUpdate.canvas) return;
  
  const ctx = layerToUpdate.canvas.getContext('2d');
  if (!ctx) return;
  
  // Save current state to undo stack
  const currentImageData = ctx.getImageData(
    0, 0, layerToUpdate.canvas.width, layerToUpdate.canvas.height
  );
  
  setUndoStack(prev => [
    ...prev,
    { layerId: layerToUpdate.id, imageData: currentImageData }
  ]);
  
  // Apply the redo state
  ctx.putImageData(nextAction.imageData, 0, 0);
  
  // Remove the action from redo stack
  setRedoStack(prev => prev.slice(0, -1));
  
  compositeCanvases();
};

const initializeDrawing = () => {
  setShowLanding(false);
};

const handleToolChange = (tool: Tool) => {
setActiveTool(tool);
};

const handleColorChange = (newColor: string) => {
setColor(newColor);
setShowColorPicker(false);
};

const createNewLayer = (width: number, height: number) => {
  const newCanvas = document.createElement('canvas');
  newCanvas.width = width;
  newCanvas.height = height;
  
  return {
    id: `${layers.length + 1}`,
    name: `Layer ${layers.length + 1}`,
    visible: true,
    locked: false,
    canvas: newCanvas
  };
};

const handleAddLayer = () => {
  if (!displayCanvasRef.current) return;
  
  const newLayer = createNewLayer(
    displayCanvasRef.current.width,
    displayCanvasRef.current.height
  );
  
  setLayers(prev => [...prev, newLayer]);
  setActiveLayer(newLayer.id);
};

const toggleLayerVisibility = (layerId: string) => {
  setLayers(layers.map(layer =>
    layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
  ));
  
  compositeCanvases();
};

const toggleLayerLock = (layerId: string) => {
  setLayers(layers.map(layer =>
    layer.id === layerId ? { ...layer, locked: !layer.locked } : layer
  ));
};

const deleteLayer = (layerId: string) => {
  if (layers.length > 1) {
    const newLayers = layers.filter(layer => layer.id !== layerId);
    setLayers(newLayers);

    // If the active layer was deleted, set the first layer as active
    if (activeLayer === layerId) {
      setActiveLayer(newLayers[0].id);
    }
    
    compositeCanvases();
  }
};




// Replace the saveImage function with this:
const saveImage = () => {
  if (displayCanvasRef.current) {
    const link = document.createElement('a');
    link.download = 'drawing.png';
    link.href = displayCanvasRef.current.toDataURL('image/png');
    link.click();
  }
};

const clearCanvas = () => {
  const currentLayer = layers.find(layer => layer.id === activeLayer);
  if (!currentLayer || !currentLayer.canvas || currentLayer.locked) return;
  
  const ctx = currentLayer.canvas.getContext('2d');
  if (!ctx) return;
  
  // Save current state before clearing
  saveCurrentStateForUndo();
  
  // Clear the canvas
  ctx.clearRect(0, 0, currentLayer.canvas.width, currentLayer.canvas.height);
  
  compositeCanvases();
};


if (showLanding) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-800 to-purple-900 flex flex-col items-center justify-center overflow-hidden font-sans">
    {/* Animated background elements */}
    <div className="absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-pink-500/20 blur-3xl"
        animate={{
          x: [0, 100, 0],
          y: [0, 50, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          repeatType: "reverse",
        }}
      />
      <motion.div
        className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-indigo-500/20 blur-3xl"
        animate={{
          x: [0, -100, 0],
          y: [0, -50, 0],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          repeatType: "reverse",
        }}
      />
      <motion.div
        className="absolute top-1/2 left-1/2 w-96 h-96 rounded-full bg-blue-500/20 blur-3xl"
        animate={{
          x: [0, 70, 0],
          y: [0, -70, 0],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          repeatType: "reverse",
        }}
      />
    </div>

    {/* Content container with glassmorphism */}
    <div className="relative w-full max-w-screen-xl px-8 py-16 text-center z-10">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="space-y-16"
      >
        {/* Logo mark */}
        <motion.div
          variants={fadeInUp}
          className="mx-auto w-24 h-24 mb-8"
        >
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <motion.path
              d="M50,10 C70,10 90,30 90,50 C90,70 70,90 50,90 C30,90 10,70 10,50 C10,30 30,10 50,10 Z"
              fill="none"
              stroke="url(#gradient)"
              strokeWidth="4"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2, ease: "easeInOut" }}
            />
            <motion.path
              d="M30,50 Q50,20 70,50 Q50,80 30,50"
              fill="none"
              stroke="url(#gradient)"
              strokeWidth="4"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2, delay: 0.5, ease: "easeInOut" }}
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#60A5FA" />
                <stop offset="100%" stopColor="#EC4899" />
              </linearGradient>
            </defs>
          </svg>
        </motion.div>

        {/* Main heading with text reveal animation */}
        <motion.div variants={fadeInUp} className="relative">
          <h1 className="text-6xl md:text-8xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-pink-400 pb-2 leading-tight">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="inline-block"
            >
              Create.
            </motion.span>{" "}
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="inline-block"
            >
              Sketch.
            </motion.span>{" "}
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="inline-block"
            >
              Express.
            </motion.span>
          </h1>
          <motion.div
            className="h-1 w-40 bg-gradient-to-r from-blue-400 to-pink-400 rounded-full mx-auto mt-4"
            initial={{ width: 0 }}
            animate={{ width: "10rem" }}
            transition={{ duration: 1, delay: 1 }}
          />
        </motion.div>

        {/* Subheading with glow effect */}
        <motion.p
          variants={fadeInUp}
          className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto font-light drop-shadow-lg"
        >
          A powerful canvas for casual doodles and professional concept art.{" "}
          <span className="font-medium text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-pink-300">
            Unlock your creativity today.
          </span>
        </motion.p>

        {/* CTA button with glow effect */}
        <motion.div variants={fadeInUp}>
          <motion.button
            onClick={initializeDrawing}
            className="group relative px-10 py-5 cursor-pointer bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-full text-xl font-medium shadow-lg transition-all ease-out duration-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.span
              className="absolute inset-0 w-full h-full rounded-full bg-gradient-to-r from-blue-400 to-pink-500 opacity-0 group-hover:opacity-80 blur-xl transition-opacity duration-300"
              animate={{
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
              }}
            />
            <span className="relative z-10 flex items-center justify-center gap-2">
              Start Drawing
              <motion.svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
                animate={{
                  x: [0, 5, 0],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                }}
              >
                <path
                  fillRule="evenodd"
                  d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </motion.svg>
            </span>
          </motion.button>
        </motion.div>

        {/* Feature cards with hover interactions */}
        <motion.div
          variants={fadeInUp}
          className="flex flex-wrap justify-center gap-8 mt-16 px-4"
        >
          {[
            {
              title: "Intuitive Tools",
              icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                  <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z" />
                </svg>
              ),
              delay: 0,
            },
            {
              title: "Layer Management",
              icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM14 11a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1v-1a1 1 0 011-1z" />
                </svg>
              ),
              delay: 0.1,
            },
            {
              title: "Export Options",
              icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              ),
              delay: 0.2,
            },
          ].map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1 + feature.delay }}
              className="w-64 p-6 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg shadow-xl border border-white/10"
              whileHover={{ 
                y: -10,
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                transition: { duration: 0.2 }
              }}
            >
              <motion.div 
                className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-600 mb-6 mx-auto flex items-center justify-center text-white"
                whileHover={{ rotate: 5 }}
              >
                {feature.icon}
              </motion.div>
              <p className="text-blue-100 font-medium text-lg tracking-wide">{feature.title}</p>
              <motion.div
                className="h-1 w-12 bg-gradient-to-r from-blue-400 to-pink-400 rounded-full mx-auto mt-4"
                initial={{ width: 0 }}
                whileInView={{ width: "3rem" }}
                transition={{ duration: 0.5 }}
              />
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </div>

    {/* Footer with subtle animation */}
    <footer className="relative w-full py-8 text-center text-blue-200/80 text-sm z-10">
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 2 }}
        className="flex items-center justify-center gap-1"
      >
        <motion.span
          animate={{ 
            textShadow: ["0 0 4px rgba(96, 165, 250, 0)", "0 0 10px rgba(96, 165, 250, 0.5)", "0 0 4px rgba(96, 165, 250, 0)"]
          }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          &copy; 2025 Drawing Interface
        </motion.span>
        <span className="mx-2">•</span>
        <span>All rights reserved</span>
      </motion.p>
    </footer>
    </div>
  );
}

// Main drawing application UI
return ( <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-900 via-indigo-800 to-purple-900 text-blue-100">
    {/* Top navigation bar */}
    <header className="bg-white/10 backdrop-blur-md border-b border-white/20 shadow-lg">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <motion.span 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="font-bold text-xl text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-pink-400"
            >
              Drawing Interface
            </motion.span>
          </div>
  
          <div className="flex items-center space-x-3">
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={undoAction}
              className="p-2 rounded-full bg-white/10 cursor-pointer hover:bg-white/20 text-blue-200 transition-all duration-200"
              title="Undo"
            >
              <UndoIcon />
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={redoAction}
              className="p-2 rounded-full cursor-pointer bg-white/10 hover:bg-white/20 text-blue-200 transition-all duration-200"
              title="Redo"
            >
              <RedoIcon />
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={clearCanvas}
              className="p-2 rounded-full cursor-pointer bg-white/10 hover:bg-white/20 text-blue-200 transition-all duration-200"
              title="Clear Canvas"
            >
              <TrashIcon />
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.05, boxShadow: "0 0 15px rgba(96, 165, 250, 0.5)" }}
              whileTap={{ scale: 0.95 }}
              onClick={saveImage}
              className="flex items-center cursor-pointer px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-full hover:from-blue-400 hover:to-indigo-500 transition-all duration-300 shadow-md"
            >
              <motion.span
                animate={{ x: [0, 2, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <DownloadIcon />
              </motion.span>
              <span className="ml-2 ">Save</span>
            </motion.button>
          </div>
        </div>
      </div>
    </header>
  
    {/* Main Content */}
    <div className="flex flex-1 overflow-hidden relative">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-pink-500/10 blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, 50, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        />
        <motion.div
          className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl"
          animate={{
            x: [0, -100, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        />
      </div>
  
      {/* Left Toolbar */}
      <div className="w-16 md:w-20 bg-white/10 backdrop-blur-md border-r border-white/20 flex flex-col items-center py-6 shadow-lg space-y-4 z-10">
        {/* Tool Buttons */}
        <div className="flex flex-col items-center space-y-5">
          {[ 
            { tool: 'brush', Icon: BrushIcon, title: 'Brush Tool' },
            { tool: 'eraser', Icon: EraserIcon, title: 'Eraser Tool' },
            { tool: 'rectangle', Icon: RectangleIcon, title: 'Rectangle Tool' },
            { tool: 'circle', Icon: CircleIcon, title: 'Circle Tool' },
            { tool: 'square', Icon: SquareIcon, title: 'Square Tool' },
            { tool: 'line', Icon: LineIcon, title: 'Line Tool' },
          ].map(({ tool, Icon, title }, index) => (
            <motion.button
              key={tool}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleToolChange(tool as Tool)}
              className={`p-3 rounded-xl cursor-pointer transition-all duration-300 ${
                activeTool === tool 
                  ? 'bg-gradient-to-r  from-blue-400/30 to-indigo-500/30 text-blue-300 shadow-md' 
                  : 'text-blue-200 hover:bg-white/10'
              }`}
              title={title}
            >
              <Icon />
              {activeTool === tool && (
                <motion.div
                  layoutId="activeToolIndicator"
                  className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-400/20 to-indigo-500/20 -z-10"
                  initial={false}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </motion.button>
          ))}
        </div>
  
        {/* Divider */}
        <motion.div 
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="w-10 h-0.5 bg-blue-300/30 my-2 rounded-full"
        />
  
        {/* Color Picker */}
        <div className="relative">
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.7 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="p-3 rounded-xl cursor-pointer hover:bg-white/10 transition-all duration-300"
            title="Color Picker"
          >
            <div 
              className="w-8 h-8 rounded-full border border-white/30 shadow-md" 
              style={{ backgroundColor: color }}
            >
              <motion.div
                animate={{ 
                  boxShadow: [
                    `0 0 0px ${color}`, 
                    `0 0 8px ${color}`, 
                    `0 0 0px ${color}`
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-full h-full rounded-full"
              />
            </div>
          </motion.button>
  
    {/* Color Picker Panel - Enhanced Design */}
<AnimatePresence>
  {showColorPicker && (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, x: 50 }}
      animate={{ opacity: 1, scale: 1, x: 70 }}
      exit={{ opacity: 0, scale: 0.9, x: 50 }}
      className="absolute ml-4 top-0 z-20 w-56 bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/30 overflow-hidden"
    >
      {/* Header with gradient */}
      <div className="bg-gradient-to-r from-blue-600/40 to-indigo-700/40 px-4 py-3 border-b border-white/20">
        <h3 className="text-white font-medium text-sm">Color Palette</h3>
      </div>
      
      {/* Main content */}
      <div className="p-4">
        {/* Color swatches with animation */}
        <div className="grid grid-cols-5 gap-2 mb-4">
          {colorPalette.map((c, index) => (
            <motion.button
              key={c}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03, duration: 0.2 }}
              whileHover={{ scale: 1.15, y: -2 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleColorChange(c)}
              className="w-8 h-8 rounded-full cursor-pointer border border-white/30 relative group"
              style={{ backgroundColor: c }}
            >
              {color === c && (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute inset-0 rounded-full border-2 border-white"
                />
              )}
              <motion.div
                animate={{ 
                  boxShadow: color === c ? 
                    [`0 0 0px ${c}`, `0 0 10px ${c}`, `0 0 0px ${c}`] : 
                    "none"
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-full h-full rounded-full"
              />
            </motion.button>
          ))}
        </div>
        
        {/* Recent colors section */}
        <div className="mb-4">
          <div className="flex items-center mb-2">
            <div className="w-1 h-4 bg-blue-400 rounded mr-2"></div>
            <h4 className="text-white font-medium text-xs">Recent Colors</h4>
          </div>
          <div className="flex space-x-2">
            {[color, "#FF5733", "#33FF57", "#3357FF"].slice(0, 4).map((c, i) => (
              <motion.button
                key={i} 
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setColor(c)}
                className="w-6 h-6 rounded-full cursor-pointer border border-white/30 shadow-md"
                style={{ backgroundColor: c }}
              ></motion.button>
            ))}
          </div>
        </div>
        
        {/* Custom color picker with improved styling */}
        <div>
          <div className="flex items-center mb-2">
            <div className="w-1 h-4 bg-blue-400 rounded mr-2"></div>
            <h4 className="text-white font-medium text-xs">Custom Color</h4>
          </div>
          <div className="relative h-10 rounded-lg overflow-hidden border border-white/40 bg-gray-700/70 p-1">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="flex h-full items-center">
              <div 
                className="w-8 h-8 rounded-md border border-white/30"
                style={{ backgroundColor: color }}
              ></div>
            <div className="ml-3 text-xs font-mono text-white uppercase font-medium">
              {color}
            </div>
            </div>
          </div>
        </div>
        
        {/* Brush Size slider (instead of opacity) */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <div className="w-1 h-4 bg-blue-400 rounded mr-2"></div>
              <h4 className="text-white font-medium  text-xs">Brush Size</h4>
            </div>
            <span className="text-white font-medium text-xs">{brushSize}px</span>
          </div>
          <div className="relative h-6 flex items-center">
            <input
              type="range"
              min="1"
              max="30"
              step="1"
              value={brushSize}
              onChange={(e) => setBrushSize(parseInt(e.target.value))}
              className="w-full cursor-pointer appearance-none bg-white/30 h-2 rounded-full outline-none"
            />
            <div
              className="absolute w-4 h-4 rounded-full bg-white shadow-lg transform -translate-y-1/2 top-1/2 pointer-events-none border border-indigo-300"
              style={{ left: `calc(${((brushSize-1)/29) * 100}% - 8px)` }}
            ></div>
          </div>
        </div>
      </div>
      
      <div className="px-4 py-3 bg-gradient-to-r from-indigo-600/30 to-blue-600/30 border-t border-white/20 flex justify-between">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowColorPicker(false)}
          className="text-xs font-medium cursor-pointer text-white hover:text-blue-50 transition-colors"
        >
          Close
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            // Reset to default color logic here
            setColor("#1E88E5");
            setBrushSize(5);
          }}
          className="text-xs font-medium text-white cursor-pointer hover:text-blue-50 transition-colors"
        >
          Reset
        </motion.button>
      </div>
    </motion.div>
  )}
</AnimatePresence>
</div>
  
        {/* Layers Button */}
        <div className="relative">
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.8 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation();
              setShowLayers(!showLayers);
            }}
            className={`p-3 rounded-xl cursor-pointer transition-all duration-300 ${
              showLayers 
                ? 'bg-gradient-to-r from-blue-400/30 to-indigo-500/30 text-blue-300 shadow-md' 
                : 'text-blue-200 hover:bg-white/10'
            }`}
            title="Layers"
          >
            <LayersIcon />
            {showLayers && (
              <motion.div
                layoutId="activeLayersIndicator"
                className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-400/20 to-indigo-500/20 -z-10"
                initial={false}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
          </motion.button>
        </div>
      </div>
     
      {/* Canvas Area */}
      <div className="flex-1 relative">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0 m-4 rounded-lg overflow-hidden shadow-2xl border border-white/20"
        >
          <canvas
            ref={displayCanvasRef}
            className="absolute inset-0 bg-white"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={endDrawing}
            onMouseLeave={endDrawing}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          />
        </motion.div>
      </div>
  
      {/* Right Panel - Layers and Brush Size */}
     {/* Right Panel - Layers and Brush Size */}
     <AnimatePresence>
        {showLayers && (
          <motion.div
            initial={{ width: 0, opacity: 0, x: 300 }}
            animate={{ width: 300, opacity: 1, x: 0 }}
            exit={{ width: 0, opacity: 0, x: 300 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-0 right-0 h-full z-50 bg-gradient-to-b from-indigo-900/80 to-purple-900/80 backdrop-blur-md border-l border-white/20 shadow-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              whileHover={{ scale: 1.1, backgroundColor: "rgba(255, 255, 255, 0.15)" }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowLayers(false)}
              className="absolute top-4 cursor-pointer right-6 p-2 rounded-full bg-white/10 text-white/90 hover:text-white transition-all duration-300 flex items-center justify-center"
              aria-label="Close panel"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18"></path>
                <path d="M6 6l12 12"></path>
              </svg>
            </motion.button>

            <div className="p-6 py-16">
              <div className="flex justify-between items-center mb-6">
                <motion.h3 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="font-medium text-xl text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-pink-300"
                >
                  Layers
                </motion.h3>
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  whileHover={{ scale: 1.05, boxShadow: "0 0 15px rgba(96, 165, 250, 0.3)" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleAddLayer}
                  className="px-4 py-2 text-sm bg-gradient-to-r cursor-pointer from-blue-500 to-indigo-600 text-white rounded-full hover:from-blue-400 hover:to-indigo-500 transition-all duration-300 shadow-md"
                >
                  Add Layer
                </motion.button>
              </div>
              
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="space-y-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar"
              >
                {layers.map((layer, index) => (
                  <motion.div 
                   key={`layer-${index}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index + 0.4 }}
                    className={`p-3 rounded-xl border backdrop-blur-sm transition-all duration-300 ${
                      activeLayer === layer.id 
                        ? 'border-blue-400/50 bg-blue-500/20 shadow-md' 
                        : 'border-white/10 bg-white/5 hover:bg-white/10'
                    }`}
                    onClick={() => setActiveLayer(layer.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <motion.button 
                          whileHover={{ scale: 1.2 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleLayerVisibility(layer.id);
                          }}
                          className={`text-blue-200 hover:text-blue-400 transition-colors ${
                            !layer.visible && 'opacity-50'
                          }`}
                        >
                          {layer.visible ? <EyeIcon /> : <EyeOffIcon />}
                        </motion.button>
                        <span className="text-sm font-medium text-blue-100">{layer.name}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <motion.button 
                          whileHover={{ scale: 1.2 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleLayerLock(layer.id);
                          }}
                          className={`text-blue-200 cursor-pointer hover:text-blue-400 transition-colors ${
                            layer.locked && 'text-pink-300'
                          }`}
                        >
                          {layer.locked ? <LockIcon /> : <UnlockIcon />}
                        </motion.button>
                        {layers.length > 1 && (
                          <motion.button 
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteLayer(layer.id);
                            }}
                            className="text-blue-200 hover:text-pink-400 transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className='cursor-pointer' width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M18 6L6 18"></path>
                              <path d="M6 6l12 12"></path>
                            </svg>
                          </motion.button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  
    {/* Footer */}
    <footer className="bg-white/10 backdrop-blur-md border-t border-white/20 py-3 text-center text-sm text-blue-200">
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1 }}
        className="flex items-center justify-center gap-1"
      >
        <motion.span
          animate={{ 
            textShadow: ["0 0 4px rgba(96, 165, 250, 0)", "0 0 10px rgba(96, 165, 250, 0.5)", "0 0 4px rgba(96, 165, 250, 0)"]
          }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          &copy; 2025 Drawing Interface
        </motion.span>
        <span className="mx-2">•</span>
        <span>All rights reserved</span>
      </motion.p>
    </footer>
  </div>


);
};

export default DrawingApp;
