import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Camera, Heart, RotateCcw, Download, Sparkles, Timer, Images, Check, ArrowLeft, Flower2, Sun, Moon } from 'lucide-react';
import './style.css';

const FILTERS = [
  { id: 'original', label: 'Original', css: 'none' },
  { id: 'soft', label: 'Softie', css: 'brightness(1.06) saturate(.82) sepia(.08)' },
  { id: 'film', label: 'Film', css: 'contrast(1.08) saturate(.78) sepia(.18)' },
  { id: 'mono', label: 'B&W', css: 'grayscale(1) contrast(1.06)' },
];
const FRAMES = [
  { id: 'pink', label: 'Strawberry Milk', bg: '#f7cbd4', ink: '#9c5266', accent: '#fff6f4' },
  { id: 'cream', label: 'Vanilla Cream', bg: '#f3e6d2', ink: '#856b50', accent: '#fffaf2' },
  { id: 'lilac', label: 'Little Lilac', bg: '#e3d7f2', ink: '#78618f', accent: '#fbf7ff' },
  { id: 'mint', label: 'Mint Cookie', bg: '#d8e8dc', ink: '#527762', accent: '#f7fff8' },
];

function App() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [photos, setPhotos] = useState([]);
  const [filter, setFilter] = useState('soft');
  const [frame, setFrame] = useState(FRAMES[0]);
  const [countdown, setCountdown] = useState(null);
  const [shooting, setShooting] = useState(false);
  const [view, setView] = useState('home');
  const [dark, setDark] = useState(false);
  const [flash, setFlash] = useState(false);
  const [sessionCount, setSessionCount] = useState(4);
  const [decor, setDecor] = useState(true);

  const activeFilter = FILTERS.find((item) => item.id === filter) || FILTERS[0];

  const stopCamera = useCallback(() => {
    if (streamRef.current) streamRef.current.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraOn(false);
  }, []);

  useEffect(() => () => {
    if (streamRef.current) streamRef.current.getTracks().forEach((track) => track.stop());
  }, []);

  const startCamera = async () => {
    setCameraError('');
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Browser ini belum mendukung akses kamera. Coba buka melalui localhost atau HTTPS.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 960 } }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraOn(true);
      setView('booth');
    } catch (error) {
      setCameraError(error.name === 'NotAllowedError' ? 'Izin kamera belum diberikan. Izinkan akses kamera di browser, lalu coba lagi ya.' : 'Kamera belum bisa dibuka. Pastikan kamera tidak sedang dipakai aplikasi lain.');
    }
  };

  useEffect(() => {
    if (cameraOn && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [cameraOn, view]);

  const captureFrame = () => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return null;
    const canvas = document.createElement('canvas');
    canvas.width = 720;
    canvas.height = 540;
    const ctx = canvas.getContext('2d');
    ctx.save();
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    const videoRatio = video.videoWidth / video.videoHeight;
    const targetRatio = canvas.width / canvas.height;
    let sx = 0, sy = 0, sw = video.videoWidth, sh = video.videoHeight;
    if (videoRatio > targetRatio) { sw = video.videoHeight * targetRatio; sx = (video.videoWidth - sw) / 2; }
    else { sh = video.videoWidth / targetRatio; sy = (video.videoHeight - sh) / 2; }
    ctx.filter = activeFilter.css;
    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
    ctx.restore();
    return canvas.toDataURL('image/jpeg', 0.92);
  };

  const takePhoto = async () => {
    if (shooting || photos.length >= sessionCount) return;
    setShooting(true);
    for (let n = 3; n >= 1; n--) {
      setCountdown(n);
      await new Promise((resolve) => setTimeout(resolve, 750));
    }
    setCountdown('✦');
    setFlash(true);
    const shot = captureFrame();
    if (shot) setPhotos((previous) => [...previous, shot]);
    await new Promise((resolve) => setTimeout(resolve, 180));
    setFlash(false);
    setCountdown(null);
    setShooting(false);
  };

  const drawPhotoStrip = (targetCanvas) => {
    const ctx = targetCanvas.getContext('2d');
    const width = 660;
    const photoW = 560;
    const photoH = 420;
    const gap = 24;
    const top = 70;
    const bottom = decor ? 155 : 100;
    targetCanvas.width = width;
    targetCanvas.height = top + photos.length * photoH + Math.max(0, photos.length - 1) * gap + bottom;
    ctx.fillStyle = frame.bg;
    ctx.fillRect(0, 0, targetCanvas.width, targetCanvas.height);
    ctx.fillStyle = frame.accent;
    ctx.fillRect(22, 22, targetCanvas.width - 44, targetCanvas.height - 44);
    ctx.fillStyle = frame.bg;
    ctx.fillRect(40, 40, targetCanvas.width - 80, targetCanvas.height - 80);
    ctx.textAlign = 'center';
    ctx.fillStyle = frame.ink;
    ctx.font = 'bold 28px Arial, sans-serif';
    ctx.fillText('POOKIE BOOTH', width / 2, 48);
    photos.forEach((src, index) => {
      const img = new Image();
      // Images are generated locally by this page, so data URLs load without a network request.
      img.src = src;
      const y = top + index * (photoH + gap);
      ctx.fillStyle = frame.accent;
      ctx.fillRect(48, y - 8, photoW + 16, photoH + 16);
      ctx.drawImage(img, 56, y, photoW, photoH);
      ctx.fillStyle = frame.ink;
      ctx.beginPath();
      ctx.arc(77, y + 20, 5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath();
      ctx.arc(width - 77, y + photoH - 20, 5, 0, Math.PI * 2); ctx.fill();
    });
    const footerY = targetCanvas.height - 70;
    ctx.fillStyle = frame.ink;
    ctx.font = '22px Arial, sans-serif';
    ctx.fillText(decor ? '♡ little moments, cute memories ♡' : 'little moments, cute memories', width / 2, footerY);
    ctx.font = '15px Arial, sans-serif';
    ctx.fillText(new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }), width / 2, targetCanvas.height - 42);
  };

  const downloadStrip = () => {
    if (!photos.length) return;
    const canvas = canvasRef.current;
    drawPhotoStrip(canvas);
    const link = document.createElement('a');
    link.download = 'pookie-booth-photo-strip.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const resetSession = () => {
    setPhotos([]);
    setView('booth');
  };

  const openResults = () => {
    if (!photos.length) return;
    setView('result');
  };

  return (
    <main className={`app ${dark ? 'dark' : ''}`}>
      <header className="topbar">
        <button className="brand" onClick={() => { setView('home'); stopCamera(); }} aria-label="Pookie Booth home">
          <span className="brand-icon"><Camera size={19} /></span><span>pookie<span className="brand-light">booth</span><i>♡</i></span>
        </button>
        <div className="nav-right"><span className="tiny-status"><span /> your little photo corner</span><button className="icon-button" onClick={() => setDark(!dark)} aria-label="Ganti tema">{dark ? <Sun size={18} /> : <Moon size={18} />}</button></div>
      </header>

      {view === 'home' && <section className="hero page-width">
        <div className="hero-copy">
          <div className="eyebrow"><Sparkles size={14} /> YOUR OWN LITTLE PHOTOBOOTH</div>
          <h1>Little moments,<br /><em>cute memories.</em></h1>
          <p className="hero-desc">A tiny corner of the internet to take cute photos, make memories, and keep them forever. Just you, your camera, and a little bit of magic.</p>
          <div className="hero-actions"><button className="primary-button" onClick={startCamera}><Camera size={18} /> Let's take photos <span>↗</span></button><span className="no-upload"><Heart size={14} fill="currentColor" /> photos stay on your device</span></div>
          {cameraError && <p className="error-message">{cameraError}</p>}
          <div className="hero-note"><span className="note-star">✳</span><span><strong>Made for your happy little moments</strong><small>No account, no fuss. Just cute photos.</small></span></div>
        </div>
        <div className="hero-art" aria-label="Contoh photo strip Pookie Booth">
          <div className="sparkle sparkle-one">✦</div><div className="sparkle sparkle-two">✧</div><div className="doodle-heart">♡</div>
          <div className="photo-stack stack-back"><div className="fake-photo fake-one"><span>✿</span></div><div className="fake-photo fake-two"><span>♡</span></div><div className="fake-photo fake-three"><span>✧</span></div><b>little days</b></div>
          <div className="photo-stack stack-front"><div className="strip-title">POOKIE BOOTH <span>♡</span></div><div className="sample-shot shot-one"><div className="face face-one"><span className="eye left"/><span className="eye right"/><span className="blush left"/><span className="blush right"/><span className="smile">⌣</span><span className="hair"/></div><span className="shot-sticker">✿</span></div><div className="sample-shot shot-two"><div className="face face-two"><span className="eye left"/><span className="eye right"/><span className="blush left"/><span className="blush right"/><span className="smile">ᴗ</span><span className="hair"/></div><span className="shot-sticker">♡</span></div><div className="sample-shot shot-three"><div className="face face-three"><span className="eye left"/><span className="eye right"/><span className="blush left"/><span className="blush right"/><span className="smile">⌣</span><span className="hair"/></div><span className="shot-sticker">✧</span></div><div className="strip-footer">♡ made with love ♡</div></div>
          <div className="floating-pill"><span>✿</span> strawberry milk</div>
        </div>
        <div className="hero-bottom"><span>01 / A LITTLE PHOTO STUDIO</span><span>SNAP · SMILE · SAVE <span className="arrow-down">↓</span></span></div>
      </section>}

      {view === 'booth' && <section className="booth-page page-width">
        <div className="section-heading"><button className="back-button" onClick={() => { setView('home'); stopCamera(); }}><ArrowLeft size={16} /> Back home</button><div><span className="eyebrow">✿ YOUR PHOTO SESSION</span><h2>Ready, <em>cutie?</em></h2></div><span className="photo-count"><Images size={15} /> {photos.length}/{sessionCount} snaps</span></div>
        <div className="booth-layout">
          <div className="camera-card"><div className="camera-topline"><span><i /> LIVE CAMERA</span><span className="frame-name">{frame.label}</span></div><div className="camera-view">
            <video ref={videoRef} autoPlay playsInline muted className="camera-video" style={{ filter: activeFilter.css }} />
            {!cameraOn && <div className="camera-placeholder"><Camera size={34} /><span>Camera is getting ready...</span></div>}
            <div className="view-corner corner-tl"/><div className="view-corner corner-tr"/><div className="view-corner corner-bl"/><div className="view-corner corner-br"/>
            {countdown !== null && <div className="countdown-overlay"><span>{countdown}</span></div>}{flash && <div className="flash-overlay"/>}
            <span className="camera-tag">♡ say cheese!</span>
          </div><div className="camera-controls"><div className="control-meta"><span>POSE {String(photos.length + 1).padStart(2, '0')}</span><small>{photos.length === sessionCount ? 'All snaps captured!' : 'Find your cutest angle'}</small></div><button className="shutter" onClick={takePhoto} disabled={!cameraOn || shooting || photos.length >= sessionCount} aria-label="Take photo"><span><Camera size={23}/></span></button><button className="retake-button" onClick={() => setPhotos([])} disabled={!photos.length || shooting}><RotateCcw size={16}/> Retake all</button></div></div>
          <aside className="booth-options"><div className="option-card"><div className="option-title"><span className="option-icon"><Flower2 size={17}/></span><div><strong>Your photo strip</strong><small>Choose your little style</small></div></div><div className="frame-grid">{FRAMES.map((f) => <button key={f.id} className={`frame-option ${frame.id === f.id ? 'selected' : ''}`} onClick={() => setFrame(f)}><span className="frame-swatch" style={{ background: f.bg }}><i style={{ background: f.accent }}/><i style={{ background: f.accent }}/><i style={{ background: f.accent }}/></span><span>{f.label}</span>{frame.id === f.id && <Check size={13} className="frame-check"/>}</button>)}</div><div className="option-divider"/><div className="option-title small-title"><span className="option-icon"><Sparkles size={16}/></span><div><strong>Photo mood</strong><small>Pick your filter</small></div></div><div className="filter-list">{FILTERS.map((f) => <button key={f.id} onClick={() => setFilter(f.id)} className={`filter-chip ${filter === f.id ? 'active' : ''}`}>{f.label}</button>)}</div><div className="option-divider"/><div className="option-row"><div><strong>Photo count</strong><small>Snaps in your strip</small></div><select value={sessionCount} onChange={(e) => { setSessionCount(Number(e.target.value)); setPhotos([]); }} aria-label="Jumlah foto"><option value={3}>3 photos</option><option value={4}>4 photos</option></select></div><div className="option-row"><div><strong>Little decorations</strong><small>Footer on your photo strip</small></div><button className={`toggle ${decor ? 'on' : ''}`} onClick={() => setDecor(!decor)} aria-label="Toggle decorations"><span/></button></div></div>
            <div className="preview-card"><div className="preview-heading"><strong>Your little memories</strong><span>{photos.length} captured</span></div><div className="mini-strip" style={{ background: frame.bg }}><div className="mini-strip-label" style={{ color: frame.ink }}>POOKIE BOOTH ♡</div>{Array.from({ length: sessionCount }, (_, i) => <div className={`mini-photo ${photos[i] ? 'has-photo' : ''}`} key={i} style={{ background: frame.accent }}>{photos[i] ? <img src={photos[i]} alt={`Hasil foto ${i + 1}`} /> : <span>{i + 1}</span>}</div>)}<div className="mini-strip-footer" style={{ color: frame.ink }}>♡ little moments ♡</div></div><button className="secondary-button full-button" onClick={openResults} disabled={!photos.length}>Preview & save <span>↗</span></button></div>
          </aside>
        </div>
        {cameraError && <p className="error-message">{cameraError}</p>}
      </section>}

      {view === 'result' && <section className="result-page page-width"><button className="back-button" onClick={() => setView('booth')}><ArrowLeft size={16}/> Back to booth</button><div className="result-heading"><span className="eyebrow"><Sparkles size={14}/> YOUR LITTLE MASTERPIECE</span><h2>Made with <em>love.</em></h2><p>Here's your tiny bundle of happy. Save it before you go!</p></div><div className="result-layout"><div className="result-strip-wrap"><div className="result-strip" style={{ background: frame.bg }}><div className="result-strip-title" style={{ color: frame.ink }}>POOKIE BOOTH <span>♡</span></div>{photos.map((src, i) => <div className="result-photo" style={{ background: frame.accent }} key={`${src}-${i}`}><img src={src} alt={`Foto hasil ${i + 1}`}/><span style={{ color: frame.ink }}>✿</span></div>)}<div className="result-strip-footer" style={{ color: frame.ink }}>{decor ? '♡ little moments, cute memories ♡' : 'little moments, cute memories'}<small>{new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</small></div></div></div><div className="result-info"><div className="success-badge"><Check size={16}/> All done, cutie!</div><h3>Your memories are ready.</h3><p>Your photos are processed right here in your browser. Nothing gets uploaded to a server.</p><button className="primary-button download-button" onClick={downloadStrip}><Download size={18}/> Download photo strip <span>↓</span></button><button className="secondary-button full-button" onClick={resetSession}><RotateCcw size={16}/> Take another session</button><div className="privacy-note"><Heart size={15} fill="currentColor"/> Your photos stay on your device.</div></div></div><canvas ref={canvasRef} className="hidden-canvas"/></section>}

      <footer className="footer"><span>pookiebooth <span className="footer-heart">♡</span></span><span>A tiny place for your happy little moments.</span><span>MADE WITH LOVE · 2026</span></footer>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
