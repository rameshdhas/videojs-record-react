import './App.css';
import React from 'react';

import VideoJSComponent from './VideoJSComponent';
import VideoOverlay from './VideoOverlay';

function App() {
  const playerRef = React.useRef(null);
  const [isMirrored, setIsMirrored] = React.useState(true);
  const [videoDevices, setVideoDevices] = React.useState([]);
  const [audioDevices, setAudioDevices] = React.useState([]);
  const [selectedVideoDeviceId, setSelectedVideoDeviceId] = React.useState('');
  const [selectedAudioDeviceId, setSelectedAudioDeviceId] = React.useState('');
  const [isMicrophoneMuted, setIsMicrophoneMuted] = React.useState(false);
  const [isRecording, setIsRecording] = React.useState(false);
  const [isCameraStopped, setIsCameraStopped] = React.useState(false);
  const [originalStream, setOriginalStream] = React.useState(null);
  const [recordedBlob, setRecordedBlob] = React.useState(null);
  const [showOverlayEditor, setShowOverlayEditor] = React.useState(false);
  
  const videoJsOptions = {
    controls: true,
    bigPlayButton: true,
    width: 320,
    height: 240,
    fluid: false,
    plugins: {
      /*
      // wavesurfer section is only needed when recording audio-only
      wavesurfer: {
        backend: 'WebAudio',
        waveColor: '#36393b',
        progressColor: 'black',
        debug: true,
        cursorWidth: 1,
        msDisplayMax: 20,
        hideScrollbar: true,
        displayMilliseconds: true,
        plugins: [
          // enable microphone plugin
          WaveSurfer.microphone.create({
            bufferSize: 4096,
            numberOfInputChannels: 1,
            numberOfOutputChannels: 1,
            constraints: {
              video: false,
              audio: true
            }
          })
        ]
      },
      */
      record: {
        audio: true,
        video: true,
        pip: true,
        screen: true,
        maxLength: 120,
        debug: true
      }
    }
  };

  const toggleMirrorMode = () => {
    if (playerRef.current) {
      const video = playerRef.current.el().querySelector('video');
      if (video) {
        if (isMirrored) {
          video.style.transform = 'scaleX(1)';
        } else {
          video.style.transform = 'scaleX(-1)';
        }
        setIsMirrored(!isMirrored);
      }
    }
  };

  const changeVideoInput = (event) => {
    const deviceId = event.target.value;
    setSelectedVideoDeviceId(deviceId);
    
    if (playerRef.current && playerRef.current.record && deviceId) {
      try {
        playerRef.current.record().setVideoInput(deviceId);
        console.log('Changed video input to device:', deviceId);
      } catch (error) {
        console.warn('Error changing video input:', error);
      }
    }
  };

  const changeAudioInput = (event) => {
    const deviceId = event.target.value;
    setSelectedAudioDeviceId(deviceId);
    
    if (playerRef.current && playerRef.current.record && deviceId) {
      try {
        playerRef.current.record().setAudioInput(deviceId);
        console.log('Changed audio input to device:', deviceId);
      } catch (error) {
        console.warn('Error changing audio input:', error);
      }
    }
  };

  const toggleMicrophone = () => {
    if (playerRef.current && playerRef.current.record) {
      try {
        const stream = playerRef.current.record().stream;
        if (stream) {
          const audioTracks = stream.getAudioTracks();
          audioTracks.forEach(track => {
            track.enabled = !track.enabled;
          });
          setIsMicrophoneMuted(!isMicrophoneMuted);
          console.log(isMicrophoneMuted ? 'Microphone unmuted' : 'Microphone muted');
        }
      } catch (error) {
        console.warn('Error toggling microphone:', error);
      }
    }
  };

  const toggleCamera = () => {
    if (playerRef.current && playerRef.current.record) {
      try {
        const stream = playerRef.current.record().stream;
        if (stream) {
          const videoTracks = stream.getVideoTracks();
          videoTracks.forEach(track => {
            track.enabled = !track.enabled;
          });
          setIsCameraStopped(!isCameraStopped);
          console.log(isCameraStopped ? 'Camera enabled' : 'Camera disabled');
        }
      } catch (error) {
        console.warn('Error toggling camera:', error);
      }
    }
  };

  const handleCloseOverlayEditor = () => {
    setShowOverlayEditor(false);
    setRecordedBlob(null);
  };

  const handlePlayerReady = (player) => {
    playerRef.current = player;

    // Apply initial mirror mode since it defaults to true
    const video = player.el().querySelector('video');
    if (video) {
      video.style.transform = 'scaleX(-1)';
    }

    // handle player events
    // device is ready
    player.on('deviceReady', () => {
      console.log('device is ready!');
      // Try to enumerate devices
      try {
        playerRef.current.record().enumerateDevices();
      } catch (error) {
        console.error('Error enumerating devices:', error);
        // Fallback: try to get devices manually
        setTimeout(() => {
          if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
            navigator.mediaDevices.enumerateDevices()
              .then(devices => {
                console.log('Fallback enumeration - All devices:', devices);
                const videoInputDevices = devices.filter(device => device.kind === 'videoinput');
                const audioInputDevices = devices.filter(device => device.kind === 'audioinput');
                console.log('Fallback enumeration - Video input devices:', videoInputDevices);
                console.log('Fallback enumeration - Audio input devices:', audioInputDevices);
                setVideoDevices(videoInputDevices);
                setAudioDevices(audioInputDevices);
                if (videoInputDevices.length > 0) {
                  setSelectedVideoDeviceId(videoInputDevices[0].deviceId);
                }
                if (audioInputDevices.length > 0) {
                  setSelectedAudioDeviceId(audioInputDevices[0].deviceId);
                }
              })
              .catch(err => console.error('Fallback enumeration failed:', err));
          }
        }, 1000);
      }
    });

    // enumerate devices ready
    player.on('enumerateReady', () => {
      console.log('enumerateReady event fired');
      const devices = player.record().devices;
      console.log('All devices:', devices);
      const videoInputDevices = devices.filter(device => device.kind === 'videoinput');
      const audioInputDevices = devices.filter(device => device.kind === 'audioinput');
      console.log('Video input devices:', videoInputDevices);
      console.log('Audio input devices:', audioInputDevices);
      setVideoDevices(videoInputDevices);
      setAudioDevices(audioInputDevices);
      
      if (videoInputDevices.length > 0) {
        setSelectedVideoDeviceId(videoInputDevices[0].deviceId);
        console.log('Selected default video device:', videoInputDevices[0].deviceId);
      }
      
      if (audioInputDevices.length > 0) {
        setSelectedAudioDeviceId(audioInputDevices[0].deviceId);
        console.log('Selected default audio device:', audioInputDevices[0].deviceId);
      }
      
      console.log('Video input devices found:', videoInputDevices.length);
      console.log('Audio input devices found:', audioInputDevices.length);
    });

    // enumerate error handling
    player.on('enumerateError', () => {
      console.warn('enumerate error:', player.enumerateErrorCode);
      // Fallback on error
      if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        navigator.mediaDevices.enumerateDevices()
          .then(devices => {
            console.log('Error fallback - All devices:', devices);
            const videoInputDevices = devices.filter(device => device.kind === 'videoinput');
            const audioInputDevices = devices.filter(device => device.kind === 'audioinput');
            console.log('Error fallback - Video input devices:', videoInputDevices);
            console.log('Error fallback - Audio input devices:', audioInputDevices);
            setVideoDevices(videoInputDevices);
            setAudioDevices(audioInputDevices);
            if (videoInputDevices.length > 0) {
              setSelectedVideoDeviceId(videoInputDevices[0].deviceId);
            }
            if (audioInputDevices.length > 0) {
              setSelectedAudioDeviceId(audioInputDevices[0].deviceId);
            }
          })
          .catch(err => console.error('Error fallback failed:', err));
      }
    });

    // user clicked the record button and started recording
    player.on('startRecord', () => {
      console.log('started recording!');
      setIsRecording(true);
    });

    // user completed recording and stream is available
    player.on('finishRecord', () => {
      // recordedData is a blob object containing the recorded data that
      // can be downloaded by the user, stored on server etc.
      console.log('finished recording: ', player.recordedData);
      
      // Store the recorded blob and show overlay editor
      setRecordedBlob(player.recordedData);
      setShowOverlayEditor(true);
      
      setIsRecording(false);
      setIsMicrophoneMuted(false); // Reset mute state when recording stops
      setIsCameraStopped(false); // Reset camera state when recording stops
      setOriginalStream(null); // Clear original stream reference
    });


    // error handling
    player.on('error', (element, error) => {
      console.warn(error);
    });

    player.on('deviceError', () => {
      console.error('device error:', player.deviceErrorCode);
    });
  };

  return (
    <div className="App flex flex-col justify-center items-center mt-20">
      <div className="mb-4 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <label className="text-gray-700 font-medium">Select Video Input:</label>
          <select
            value={selectedVideoDeviceId}
            onChange={changeVideoInput}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={videoDevices.length === 0}
          >
            {videoDevices.length === 0 ? (
              <option value="">Loading devices...</option>
            ) : (
              videoDevices.map((device) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `Camera ${device.deviceId.substring(0, 8)}...`}
                </option>
              ))
            )}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-gray-700 font-medium">Select Audio Input:</label>
          <select
            value={selectedAudioDeviceId}
            onChange={changeAudioInput}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={audioDevices.length === 0}
          >
            {audioDevices.length === 0 ? (
              <option value="">Loading devices...</option>
            ) : (
              audioDevices.map((device) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `Microphone ${device.deviceId.substring(0, 8)}...`}
                </option>
              ))
            )}
          </select>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-gray-700">Mirror Mode:</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isMirrored}
              onChange={toggleMirrorMode}
              className="sr-only"
            />
            <div className={`w-11 h-6 rounded-full transition-colors ${
              isMirrored ? 'bg-blue-600' : 'bg-gray-300'
            }`}>
              <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                isMirrored ? 'translate-x-5' : 'translate-x-0'
              } mt-0.5 ml-0.5`}></div>
            </div>
          </label>
        </div>
      </div>
      <VideoJSComponent options={videoJsOptions} onReady={handlePlayerReady} />
      {isRecording && (
        <div className="mt-4 flex gap-3">
          <button
            onClick={toggleMicrophone}
            className="border border-gray-300 px-4 py-2 rounded"
          >
            {isMicrophoneMuted ? '🎤 Unmute' : '🔇 Mute'}
          </button>
          <button
            onClick={toggleCamera}
            className="border border-gray-300 px-4 py-2 rounded"
          >
            {isCameraStopped ? '📹 Start Camera' : '📹 Stop Camera'}
          </button>
        </div>
      )}
      
      {showOverlayEditor && recordedBlob && (
        <VideoOverlay
          videoBlob={recordedBlob}
          onClose={handleCloseOverlayEditor}
        />
      )}
    </div>
  );
}

export default App;