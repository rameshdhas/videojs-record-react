import React, { useEffect, useRef, useState, useMemo } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import '../node_modules/videojs-overlay/dist/videojs-overlay.css';
import 'videojs-overlay';
import { DndContext, useDraggable } from '@dnd-kit/core';
import { restrictToParentElement } from '@dnd-kit/modifiers';
import { CSS } from '@dnd-kit/utilities';

const VideoOverlay = ({ videoBlob, onClose, aspectRatio = '16:9' }) => {
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [overlays, setOverlays] = useState([]);
  const [showDraggableOverlay, setShowDraggableOverlay] = useState(false);
  const [overlayPosition, setOverlayPosition] = useState({ x: 20, y: 20 });
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [currentOverlay, setCurrentOverlay] = useState({
    content: '',
    start: 0,
    end: 5,
    align: 'top-left'
  });

  const getAspectRatioDimensions = (ratio) => {
    const baseSize = 320;
    switch (ratio) {
      case '16:9':
        return { width: baseSize * 2, height: (baseSize * 2) * (9/16) };
      case '1:1':
        return { width: baseSize * 2, height: baseSize * 2 };
      case '9:16':
        return { width: (baseSize * 2) * (9/16), height: baseSize * 2 };
      default:
        return { width: baseSize * 2, height: (baseSize * 2) * (9/16) };
    }
  };

  const dimensions = useMemo(() => getAspectRatioDimensions(aspectRatio), [aspectRatio]);

  useEffect(() => {
    if (videoBlob) {
      const url = URL.createObjectURL(videoBlob);
      setVideoUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [videoBlob]);

  useEffect(() => {
    if (videoUrl && !playerRef.current) {
      const videoElement = document.createElement('video-js');
      videoElement.className = 'video-js vjs-default-skin';
      videoRef.current.appendChild(videoElement);

      const player = playerRef.current = videojs(videoElement, {
        controls: true,
        responsive: true,
        fluid: false,
        width: dimensions.width,
        height: dimensions.height,
        sources: [{
          src: videoUrl,
          type: videoBlob.type || 'video/webm'
        }]
      });

      player.ready(() => {
        console.log('Player ready for overlay editing');
        // Show draggable overlay
        setShowDraggableOverlay(true);
        
        // Add time update listener to control overlay visibility
        player.on('timeupdate', () => {
          const currentTime = player.currentTime();
          const overlayStart = 0; // Start time in seconds
          const overlayEnd = 5;   // End time in seconds
          
          const shouldShow = currentTime >= overlayStart && currentTime <= overlayEnd;
          setOverlayVisible(shouldShow);
        });
      });
    }
  }, [videoUrl, videoBlob, dimensions]);

  useEffect(() => {
    const player = playerRef.current;
    return () => {
      if (player && !player.isDisposed()) {
        player.dispose();
        playerRef.current = null;
      }
    };
  }, []);

  const addOverlay = () => {
    if (!currentOverlay.content.trim()) {
      alert('Please enter overlay content');
      return;
    }

    const newOverlay = {
      ...currentOverlay,
      id: Date.now() // Simple ID generation
    };

    const updatedOverlays = [...overlays, newOverlay];
    setOverlays(updatedOverlays);

    // Update player with new overlays
    if (playerRef.current && playerRef.current.overlay) {
      try {
        console.log('Updating overlays:', updatedOverlays);
        
        // Update the overlay plugin with new overlays
        const overlayData = updatedOverlays.map(overlay => ({
          content: overlay.content,
          start: overlay.start,
          end: overlay.end,
          align: overlay.align
        }));
        
        console.log('Overlay data:', overlayData);
        
        // Clear existing overlays and set new ones
        playerRef.current.overlay({
          overlays: overlayData
        });
        
      } catch (error) {
        console.error('Error adding overlay:', error);
      }
    }

    // Reset form
    setCurrentOverlay({
      content: '',
      start: 0,
      end: 5,
      align: 'top-left'
    });
  };

  const removeOverlay = (overlayId) => {
    const updatedOverlays = overlays.filter(overlay => overlay.id !== overlayId);
    setOverlays(updatedOverlays);

    // Update player with remaining overlays
    if (playerRef.current && playerRef.current.overlay) {
      try {
        console.log('Removing overlay, updated overlays:', updatedOverlays);
        
        const overlayData = updatedOverlays.map(overlay => ({
          content: overlay.content,
          start: overlay.start,
          end: overlay.end,
          align: overlay.align
        }));
        
        playerRef.current.overlay({
          overlays: overlayData
        });
        
      } catch (error) {
        console.error('Error removing overlay:', error);
      }
    }
  };

  const handleDownloadOriginal = () => {
    if (videoBlob) {
      const url = URL.createObjectURL(videoBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `recorded-video-${Date.now()}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const getCurrentTime = () => {
    if (playerRef.current) {
      return Math.floor(playerRef.current.currentTime());
    }
    return 0;
  };

  const setCurrentTimeAsStart = () => {
    setCurrentOverlay(prev => ({
      ...prev,
      start: getCurrentTime()
    }));
  };

  const setCurrentTimeAsEnd = () => {
    setCurrentOverlay(prev => ({
      ...prev,
      end: getCurrentTime()
    }));
  };

  const handleDragEnd = (event) => {
    const { delta } = event;
    if (delta && playerRef.current) {
      const videoElement = playerRef.current.el();
      const videoRect = videoElement.getBoundingClientRect();
      const overlayWidth = 250; // Approximate overlay width
      const overlayHeight = 80; // Approximate overlay height
      
      const newX = Math.max(0, Math.min(videoRect.width - overlayWidth, overlayPosition.x + delta.x));
      const newY = Math.max(0, Math.min(videoRect.height - overlayHeight, overlayPosition.y + delta.y));
      
      setOverlayPosition({
        x: newX,
        y: newY
      });
    }
  };

  const DraggableOverlay = ({ position }) => {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
      id: 'video-overlay'
    });
    
    const style = {
      position: 'absolute',
      left: position.x,
      top: position.y,
      zIndex: 1000,
      fontSize: '18px',
      fontWeight: 'bold',
      color: 'white',
      textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
      cursor: 'move',
      userSelect: 'none',
      backgroundColor: 'rgba(0,0,0,0.5)',
      padding: '10px',
      borderRadius: '8px',
      animation: 'zoomIn 0.8s ease-out',
      transform: CSS.Translate.toString(transform)
    };

    const handleLinkClick = (e) => {
      e.stopPropagation();
      e.preventDefault();
      window.open('https://videojs.com', '_blank', 'noopener,noreferrer');
    };

    const handleButtonClick = (e) => {
      e.stopPropagation();
      e.preventDefault();
      alert('Overlay button clicked!');
    };

    return (
      <div ref={setNodeRef} style={style}>
        <style>
          {`@keyframes zoomIn {
            from { opacity: 0; transform: scale(0.5); }
            to { opacity: 1; transform: scale(1); }
          }`}
        </style>
        <div {...listeners} {...attributes} style={{ cursor: 'move' }}>
          <h2 style={{ margin: 0, fontSize: '24px' }}>Test Overlay - Plugin Working!</h2>
          <br />
        </div>
        <a 
          href="https://videojs.com" 
          target="_blank" 
          rel="noopener noreferrer"
          style={{ 
            color: '#60a5fa', 
            textDecoration: 'underline',
            cursor: 'pointer',
            pointerEvents: 'auto',
            marginRight: '10px'
          }}
          onClick={handleLinkClick}
        >
          Visit VideoJS
        </a>
        <button
          onClick={handleButtonClick}
          style={{
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '6px 12px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
            pointerEvents: 'auto'
          }}
        >
          Action
        </button>
      </div>
    );
  };

  return (
    <div className="mt-8 p-6 border border-gray-300 rounded-lg bg-gray-50">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">Add Video Overlays</h3>
        <button
          onClick={onClose}
          className="px-3 py-1 text-gray-500 hover:text-gray-700 text-xl"
        >
          ✕
        </button>
      </div>
      
      <div className="mb-6">
        <div data-vjs-player style={{ position: 'relative' }}>
          <div ref={videoRef} />
          
          {/* Draggable Overlay using dnd-kit */}
          {showDraggableOverlay && overlayVisible && (
            <DndContext 
              onDragEnd={handleDragEnd}
              modifiers={[restrictToParentElement]}
            >
              <DraggableOverlay position={overlayPosition} />
            </DndContext>
          )}
        </div>
      </div>


    </div>
  );
};

export default VideoOverlay;