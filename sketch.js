// ==========================================
// CONFIGURACIÓN GLOBAL
// ==========================================

// percentatge del tamany de la pantalla que ocuparà el canvas
// (així s'adapta millor a mòbils i tablets)
const CANVAS_SIZE_PERCENT = 0.9;

// valors del acceleròmetre: s'actualitzen en temps real
let ax = 0, ay = 0, az = 0;

// velocitats de la bola: es calculen en funció de l'acceleració
// (serveixen per fer un moviment més físic i no tan sec)
let vx = 0, vy = 0;

// posició actual de la bola dins el canvas
let xpos, ypos;

// fricció aplicada cada frame perquè la bola no acceleri sense límit
let friction = 0.98;

// escala general del moviment (controla sensibilitat)
let accelScale = 1.5;

// opcions per invertir eixos si cal (depèn orientació del mòbil)
let invertX = false;
let invertY = false;


// ==========================================
// VARIABLES DE AUDIO
// ==========================================

// oscil·lador principal que genera la forma d’ona (so base)
let osc;

// filtre passa-baix per modificar el timbre segons posició
let filter;

// flag que indica si l'àudio ja està activat (necessari a mòbil)
let audioEnabled = false;

// freqüència base del so quan la bola està al centre
const BASE_FREQ = 300;


// ==========================================
// GESTIÓN DOM (HTML)
// ==========================================

// checkboxs opcionals per invertir eixos (no afecta funcionalitat base)
const invertXCheckbox = document.getElementById("invertX");
const invertYCheckbox = document.getElementById("invertY");

if (invertXCheckbox) invertXCheckbox.addEventListener("change", () => invertX = invertXCheckbox.checked);
if (invertYCheckbox) invertYCheckbox.addEventListener("change", () => invertY = invertYCheckbox.checked);

const permissionButton = document.getElementById("permissionButton");
const overlayDiv = document.getElementById("overlay");

if (permissionButton) {
  permissionButton.addEventListener("click", async (e) => {
    e.preventDefault();
    
    // s'assegura que el context d'àudio està actiu
    // (en mòbil no funciona res fins que l’usuari toca la pantalla)
    try {
        let audioContext = getAudioContext();
        if (audioContext.state !== 'running') {
            await audioContext.resume();
        }
        await userStartAudio(); 
        
        audioEnabled = true;

        // si l'oscil·lador ja està creat, es posa un volum inicial
        // per comprovar que realment sona (important en proves)
        if (osc) {
            osc.start();
            osc.amp(0.5, 0.1); 
        }

        permissionButton.innerText = "¡ACTIVADO!";
    } catch (err) {
        console.error("Error Audio:", err);
        alert("Error iniciant audio: " + err);
    }

    // funció auxiliar per amagar el overlay després del permís
    const removeOverlay = () => {
        if(overlayDiv) overlayDiv.style.display = "none"; 
    };

    // iOS 13+ obliga a demanar permís explícit per accedir al sensor de moviment
    if (typeof DeviceMotionEvent !== "undefined" && typeof DeviceMotionEvent.requestPermission === "function") {
      try {
        const response = await DeviceMotionEvent.requestPermission();
        if (response === "granted") {
          startMotion();  // comença la lectura de l’acceleròmetre
          removeOverlay();
        } else {
          alert("Permiso movimiento denegado.");
          removeOverlay();
        }
      } catch (error) {
        console.error(error);
        alert(error);
      }
    } else {
      // en Android i PC normalment ja funciona sense permís extra
      startMotion();
      removeOverlay();
    }
  });
}


// ==========================================
// P5.JS SETUP & DRAW
// ==========================================

function setup() {
  rectMode(CENTER);

  // mida del canvas proporcional al dispositiu
  const s = min(windowWidth, windowHeight) * CANVAS_SIZE_PERCENT;
  let cnv = createCanvas(s, s);

  if(document.getElementById("canvas-container")) cnv.parent("canvas-container");

  // posició inicial al centre del canvas
  xpos = width / 2;
  ypos = height / 2;

  // Configuración Audio
  // es crea un oscil·lador sawtooth perquè el so tingui més harmònics
  osc = new p5.Oscillator('sawtooth'); 
  osc.disconnect(); // es desconnecta de la sortida directa per poder posar filtre

  // filtre passa-baix per controlar el timbre amb la posició vertical
  filter = new p5.LowPass();
  osc.connect(filter); // es connecta oscil·lador -> filtre -> sortida
  
  filter.freq(1000);   // freq de tall inicial
  filter.res(10);      // ressonància alta per efecte més "metàl·lic"
}

function draw() {
  background(30);

  // ------------------------------------------------
  // 1. FÍSICA DE LA BOLA
  // ------------------------------------------------

  // es transforma el moviment real del mòbil en eixos del canvas
  const { sx, sy } = mapMotionToScreen(ax || 0, ay || 0);

  // s'aplica acceleració a la velocitat amb un factor de sensibilitat
  vx += sx * accelScale;
  vy += -sy * accelScale;

  // fricció perquè el moviment es vagi apagant a poc a poc
  vx *= friction;
  vy *= friction;

  // actualització real de la posició
  xpos += vx;
  ypos += vy;

  // límits del canvas: si toca la vora, rebota amb menys força
  const r = 20;
  if (xpos > width - r) { xpos = width - r; vx *= -0.6; }
  if (xpos < r) { xpos = r; vx *= -0.6; }
  if (ypos > height - r) { ypos = height - r; vy *= -0.6; }
  if (ypos < r) { ypos = r; vy *= -0.6; }


  // ------------------------------------------------
  // 2. AUDIO LOGIC (MAPEIG MOVIMENT → SO)
  // ------------------------------------------------

  if (audioEnabled) {

      // intensitat general del moviment: velocitat total
      let speed = Math.sqrt(vx * vx + vy * vy);
      
      // volum mínim assegurat perquè el so no desaparegui del tot
      let targetAmp = map(speed, 0, 25, 0.05, 0.5, true);
      osc.amp(targetAmp, 0.1);

      // pitch segons posició X: esquerra greu, dreta agut
      let freqVal = map(xpos, 0, width, BASE_FREQ - 100, BASE_FREQ + 200);
      osc.freq(freqVal, 0.1);

      // obertura del filtre segons posició Y: dalt més tancat, baix més brillant
      let filterFreq = map(ypos, 0, height, 200, 5000);
      filter.freq(filterFreq, 0.1);
  }


  // ------------------------------------------------
  // 3. VISUALES
  // ------------------------------------------------

  // quadrat de referència al centre
  noFill();
  stroke(100);
  strokeWeight(2);
  rect(width/2, height/2, width/4, height/4);

  // punt indicador per saber si l'àudio està actiu
  noStroke();
  if(audioEnabled) fill(0, 255, 0);
  else fill(255, 0, 0);
  ellipse(width/2, height/2, 5, 5);

  // bola principal amb color depenent de la intensitat del moviment
  let intensity = map(abs(vx)+abs(vy), 0, 20, 100, 255);
  fill(255, intensity, 0);
  ellipse(xpos, ypos, r * 2, r * 2);

  // text de debug útil mentre es desenvolupava
  fill(255);
  noStroke();
  textSize(12);
  text("Audio Enabled: " + audioEnabled, 20, 20);
  if(audioEnabled) {
      text("Amp (Vol): " + nf(osc.getAmp(), 1, 3), 20, 40);
      text("Speed: " + nf(Math.sqrt(vx*vx + vy*vy), 1, 2), 20, 60);
  }
}

function windowResized() {
  // el canvas s'adapta si canvia l'orientació del dispositiu
  const s = min(windowWidth, windowHeight) * CANVAS_SIZE_PERCENT;
  resizeCanvas(s, s);

  // es garanteix que la bola no surt dels marges
  xpos = constrain(xpos, 0, width);
  ypos =
constrain(ypos, 0, height);
}

function startMotion() {
  // lector principal del sensor d'acceleració (inclou gravetat)
  window.addEventListener("devicemotion", (e) => {
      const a = e.accelerationIncludingGravity || e.acceleration;
      if (!a) return;
      ax = typeof a.x === "number" ? a.x : 0;
      ay = typeof a.y === "number" ? a.y : 0;
      az = typeof a.z === "number" ? a.z : 0;
    }, true);
}

function getScreenAngle() {
  // orientació actual de la pantalla (important per fer coincidir eixos)
  if (screen.orientation && typeof screen.orientation.angle === "number") return screen.orientation.angle;
  if (typeof window.orientation === "number") return window.orientation;
  return 0;
}

function rotate2D(x, y, deg) {
  // rotació d’un vector 2D (transformació estàndard)
  const rad = (deg * Math.PI) / 180;
  const cosA = Math.cos(rad);
  const sinA = Math.sin(rad);
  return { x: x * cosA - y * sinA, y: x * sinA + y * cosA };
}

function mapMotionToScreen(axDev, ayDev) {
  // converteix els eixos del dispositiu als del canvas segons l’orientació
  const ang = getScreenAngle();
  const r = rotate2D(axDev, ayDev, ang);

  // s’aplica la inversió d’eixos si està activada
  let sx = r.x * (invertX ? -1 : 1);
  let sy = r.y * (invertY ? -1 : 1);

  return { sx, sy };
}

function keyPressed() {
  // toggles ràpids per provar el comportament a ordinador
  if (key === "x" || key === "X") invertX = !invertX;
  if (key === "y" || key === "Y") invertY = !invertY;
  if (key === "f" || key === "F") { invertX = !invertX; invertY = !invertY; }

  // sincronització amb checkboxs del DOM
  if(invertXCheckbox) invertXCheckbox.checked = invertX;
  if(invertYCheckbox) invertYCheckbox.checked = invertY;
}
