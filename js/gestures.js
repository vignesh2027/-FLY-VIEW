class GestureManager {
  constructor() {
    this.active = false;
    this.lastGesture = null;
    this.cooldown = false;
    this.hands = null;
    this.camera = null;
    this.canvas = document.getElementById('gestureCanvas');
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.statusEl = document.getElementById('gestureStatus');
  }

  async init() {
    if (typeof Hands === 'undefined') {
      console.warn('MediaPipe Hands not loaded');
      return;
    }

    this.hands = new Hands({
      locateFile: (f) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`
    });

    this.hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 0,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.6
    });

    this.hands.onResults((results) => this._onResults(results));

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } });
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();
      if (typeof Camera !== 'undefined') {
        this.camera = new Camera(video, {
          onFrame: async () => { await this.hands.send({ image: video }); },
          width: 320, height: 240
        });
        this.camera.start();
        this.active = true;
        this._setStatus('GESTURE: ARMED');
      }
    } catch (e) {
      console.warn('Webcam unavailable:', e.message);
      this._setStatus('GESTURE: NO CAM');
    }
  }

  _onResults(results) {
    if (!this.ctx || !this.canvas) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) return;

    const lm = results.multiHandLandmarks[0];
    this._drawHand(lm);

    if (this.cooldown) return;

    const gesture = this._classify(lm);
    if (gesture && gesture !== this.lastGesture) {
      this.lastGesture = gesture;
      this.cooldown = true;
      setTimeout(() => { this.cooldown = false; }, 1500);
      this._setStatus(`GESTURE: ${gesture.toUpperCase()} DETECTED`);
      window.dispatchEvent(new CustomEvent('gesture', { detail: { type: gesture } }));
      setTimeout(() => this._setStatus('GESTURE: ARMED'), 2000);
    }
  }

  _classify(lm) {
    const wrist = lm[0];
    const indexTip = lm[8];
    const middleTip = lm[12];
    const ringTip = lm[16];
    const pinkyTip = lm[20];
    const thumbTip = lm[4];
    const indexMcp = lm[5];
    const middleMcp = lm[9];

    // Finger up check
    const indexUp = indexTip.y < indexMcp.y;
    const middleUp = middleTip.y < middleMcp.y;
    const ringDown = ringTip.y > lm[13].y;
    const pinkyDown = pinkyTip.y > lm[17].y;

    // PLANE gesture: index + middle up, ring + pinky down, spread apart
    const spread = Math.abs(indexTip.x - middleTip.x);
    if (indexUp && middleUp && ringDown && pinkyDown && spread > 0.08) {
      return 'plane';
    }

    // SHIELD gesture: all fingers up and close together (flat hand push)
    const allUp = indexUp && middleUp && ringTip.y < lm[13].y && pinkyTip.y < lm[17].y;
    const compact = Math.abs(indexTip.x - pinkyTip.x) < 0.15;
    const flat = Math.abs(indexTip.y - pinkyTip.y) < 0.08;
    if (allUp && compact && flat) {
      return 'shield';
    }

    return null;
  }

  _drawHand(lm) {
    if (!this.ctx) return;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const connections = [
      [0,1],[1,2],[2,3],[3,4],
      [0,5],[5,6],[6,7],[7,8],
      [5,9],[9,10],[10,11],[11,12],
      [9,13],[13,14],[14,15],[15,16],
      [13,17],[0,17],[17,18],[18,19],[19,20]
    ];
    this.ctx.strokeStyle = CONFIG.COLORS.FLIGHT;
    this.ctx.lineWidth = 1.5;
    connections.forEach(([a, b]) => {
      this.ctx.beginPath();
      this.ctx.moveTo(lm[a].x * w, lm[a].y * h);
      this.ctx.lineTo(lm[b].x * w, lm[b].y * h);
      this.ctx.stroke();
    });
    lm.forEach(p => {
      this.ctx.beginPath();
      this.ctx.arc(p.x * w, p.y * h, 3, 0, Math.PI * 2);
      this.ctx.fillStyle = CONFIG.COLORS.THREAT;
      this.ctx.fill();
    });
  }

  _setStatus(msg) {
    if (this.statusEl) this.statusEl.textContent = msg;
  }

  toggle() {
    const panel = document.getElementById('gesturePanel');
    if (panel) panel.classList.toggle('hidden');
  }
}
