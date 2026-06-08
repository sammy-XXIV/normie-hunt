// ── Fire Texture (loaded from pixel art image, white bg removed) ───────────
var fireTex = new THREE.Texture();
(function() {
  var img = new Image();
  img.onload = function() {
    // crop to top 82% to remove watermark text at bottom
    var cropH = Math.floor(img.height * 0.82);
    var c = document.createElement('canvas');
    c.width = img.width; c.height = cropH;
    var ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0, img.width, cropH, 0, 0, img.width, cropH);
    var data = ctx.getImageData(0, 0, c.width, c.height);
    var d = data.data;
    for (var i = 0; i < d.length; i += 4) {
      var r=d[i], g=d[i+1], b=d[i+2];
      if (r > 220 && g > 220 && b > 220) d[i+3] = 0;
    }
    ctx.putImageData(data, 0, 0);
    fireTex.image = c;
    fireTex.needsUpdate = true;
  };
  img.src = 'fire.webp';
})();

// ── Procedural Textures ────────────────────────────────────────────────────
function makeStoneWallTex() {
  var c = document.createElement('canvas'); c.width = c.height = 64;
  var ctx = c.getContext('2d');
  ctx.fillStyle = '#111008'; ctx.fillRect(0,0,64,64);
  var bh = 16, bw = 32;
  for (var row = 0; row < Math.ceil(64/bh); row++) {
    var off = row % 2 === 0 ? 0 : bw/2;
    for (var col = -1; col < Math.ceil(64/bw)+1; col++) {
      var x = col*bw + off, y = row*bh;
      var shade = 38 + Math.floor(Math.random()*18);
      ctx.fillStyle = 'rgb('+shade+','+(shade-4)+','+(Math.max(0,shade-10))+')';
      ctx.fillRect(x+1, y+1, bw-2, bh-2);
      // cracks/noise
      for (var n=0;n<3;n++) {
        var nx=x+1+Math.random()*(bw-2), ny=y+1+Math.random()*(bh-2);
        var ns=Math.random()*14-7;
        ctx.fillStyle='rgba('+(shade+ns)+','+(shade+ns)+','+(shade+ns)+',0.4)';
        ctx.fillRect(nx,ny,1+Math.random()*4,1+Math.random()*2);
      }
      // mortar lines (dark)
      ctx.fillStyle='#0a0807';
      ctx.fillRect(x,y,bw,1); ctx.fillRect(x,y,1,bh);
    }
  }
  var t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

function makeFloorTex() {
  var c = document.createElement('canvas'); c.width = c.height = 64;
  var ctx = c.getContext('2d');
  ctx.fillStyle = '#0d0b09'; ctx.fillRect(0,0,64,64);
  for (var x=0;x<64;x+=16) {
    for (var y=0;y<64;y+=16) {
      var s = 22 + Math.floor(Math.random()*14);
      ctx.fillStyle='rgb('+s+','+(s-2)+','+(Math.max(0,s-6))+')';
      ctx.fillRect(x+1,y+1,14,14);
      ctx.fillStyle='#080604';
      ctx.fillRect(x,y,16,1); ctx.fillRect(x,y,1,16);
    }
  }
  var t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(6,6);
  return t;
}

function makeCeilTex() {
  var c = document.createElement('canvas'); c.width = c.height = 32;
  var ctx = c.getContext('2d');
  ctx.fillStyle = '#080604'; ctx.fillRect(0,0,32,32);
  for (var i=0;i<20;i++) {
    var s=10+Math.random()*8;
    ctx.fillStyle='rgba('+s+','+s+','+Math.max(0,s-4)+',0.5)';
    ctx.fillRect(Math.random()*32,Math.random()*32,1+Math.random()*4,1+Math.random()*3);
  }
  var t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(4,4);
  return t;
}

// ── Scene ──────────────────────────────────────────────────────────────────
var scene = new THREE.Scene();
scene.background = new THREE.Color(0x080402);
scene.fog = new THREE.FogExp2(0x080402, 0.07);

var camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 60);
camera.position.set(3*3+1.5, 1.65, 16*3+1.5); // START — S at row16,col3

var PIXEL_SCALE = 4; // render at 1/4 res, scale up — creates pixel art look
var renderer = new THREE.WebGLRenderer({ antialias:false });
renderer.setPixelRatio(1);
renderer.setSize(Math.floor(window.innerWidth/PIXEL_SCALE), Math.floor(window.innerHeight/PIXEL_SCALE));
renderer.shadowMap.enabled = false;
renderer.domElement.style.width  = window.innerWidth  + 'px';
renderer.domElement.style.height = window.innerHeight + 'px';
renderer.domElement.style.imageRendering = 'pixelated';
document.body.appendChild(renderer.domElement);

var ambientLight = new THREE.AmbientLight(0x664422, 2.5);
scene.add(ambientLight);

// ── Player Flashlight ──────────────────────────────────────────────────────
var flashlight = new THREE.SpotLight(0xffdd99, 28, 28, Math.PI * 0.2, 0.45, 1.5);
var flashlightTarget = new THREE.Object3D();
scene.add(flashlight);
scene.add(flashlightTarget);
flashlight.target = flashlightTarget;

// fill light — always visible around player
var playerFill = new THREE.PointLight(0xff9944, 4, 8);
scene.add(playerFill);

// ── Textures ───────────────────────────────────────────────────────────────
var wallTex  = makeStoneWallTex();
var floorTex = makeFloorTex();
var ceilTex  = makeCeilTex();

wallTex.repeat.set(2, 0.8);

var wallMat   = new THREE.MeshLambertMaterial({ map: wallTex });
var floorMat  = new THREE.MeshLambertMaterial({ map: floorTex });
var ceilMat   = new THREE.MeshLambertMaterial({ map: ceilTex, side: THREE.DoubleSide });
var pillarMat = new THREE.MeshLambertMaterial({ map: wallTex });

// ── LEVEL 1: THE FORGOTTEN HALLS ──────────────────────────────────────────
// Direct encoding of hand-drawn map. S=row16,col3. E=row4,col72.
var MAP_COLS = 80, MAP_ROWS = 24;
var grid = [];
var rawRows = [
  '##########            #########################            #################',
  '#........#            #.......................#            #...............#',
  '#........#            #.......................#            #...............#',
  '#........#            #....##############.....#            #...###.........#',
  '###....###########    #....#            #.....#            #...#........E..#',
  '  #..............#    #....#            #.....#            #...#...........#',
  '  #....########..######....#   ######   ###..###############..###..........#',
  '  #....#      #........#...#   #....#      .................#..............#',
  '  #....#      #........#...#   #....#   #...........#......................#',
  '###....#   #######....##...#   #....#   ##....#####..######....#...........#',
  '#......#   #..........#....#   #....#    #....#   #..#    #....#...######..#',
  '#......#   #..........#....#   #....#    #....#   #..#    #....#...#....#..#',
  '#......#   #.####.....#....#   #....#    #....#   #..#    #....#...#....#..#',
  '#......#####....#.....#....#   #....#    #....#####..#    #....#...###..#####',
  '#...............#.....#....#   ######    #...........#    #....#.....#......#',
  '#...............#.....#....##################....#####    #....#.....#......#',
  '#..S............#####.#....#.....................#        #....#.....#......#',
  '#################   #.#....#....#####....#####...#        ##...#######......#',
  '                    #.#....#....#   #....#   #...#         #.................#',
  '                    #.#....######   #....#   #...#         ###################',
  '                    #.#.............#....#   #...#',
  '                    #.###############....#   #...#',
  '                    #....................#   #...#',
  '                    ######################   #####'
];
for (var _r = 0; _r < MAP_ROWS; _r++) {
  var _rowStr = rawRows[_r] || '';
  var _row = [];
  for (var _c = 0; _c < MAP_COLS; _c++) {
    var _ch = (_c < _rowStr.length) ? _rowStr[_c] : ' ';
    _row.push((_ch === '.' || _ch === 'S' || _ch === 'E') ? '.' : 'W');
  }
  grid.push(_row);
}

var MAP = grid.map(function(r){ return r.join(''); });

var TILE = 3;
var ROWS = MAP.length;
var COLS = MAP[0].length;
var collidables = [];

// floor & ceiling span
var totalW = COLS * TILE, totalD = ROWS * TILE;
var floor = new THREE.Mesh(new THREE.PlaneGeometry(totalW, totalD), floorMat);
floor.rotation.x = -Math.PI/2;
floor.position.set(totalW/2, 0, totalD/2);
scene.add(floor);

var ceil = new THREE.Mesh(new THREE.PlaneGeometry(totalW, totalD), ceilMat);
ceil.rotation.x = Math.PI/2;
ceil.position.set(totalW/2, 3.6, totalD/2);
scene.add(ceil);

// build walls — single instanced draw call instead of one mesh per tile
var _wallCount = 0;
for (var row=0; row<ROWS; row++)
  for (var col=0; col<COLS; col++)
    if (MAP[row][col]==='W') _wallCount++;

var _wallInst = new THREE.InstancedMesh(new THREE.BoxGeometry(TILE,3.6,TILE), wallMat, _wallCount);
_wallInst.receiveShadow = false;
var _dum = new THREE.Object3D();
var _wi = 0;
for (var row=0; row<ROWS; row++) {
  for (var col=0; col<COLS; col++) {
    if (MAP[row][col]==='W') {
      var _wx = col*TILE+TILE/2, _wz = row*TILE+TILE/2;
      _dum.position.set(_wx, 1.8, _wz);
      _dum.updateMatrix();
      _wallInst.setMatrixAt(_wi++, _dum.matrix);
      collidables.push(new THREE.Box3(
        new THREE.Vector3(_wx-TILE/2, 0,   _wz-TILE/2),
        new THREE.Vector3(_wx+TILE/2, 3.6, _wz+TILE/2)
      ));
    }
  }
}
_wallInst.instanceMatrix.needsUpdate = true;
scene.add(_wallInst);

// ── Wall-mounted Torches ───────────────────────────────────────────────────
var torchLights = [];
var woodMat = new THREE.MeshLambertMaterial({color:0x5c3317});

// dirs: [dRow, dCol, offsetX, offsetZ, rotY]
var dirs = [
  [-1, 0,  0,     -0.35,  0      ],  // wall to north
  [ 1, 0,  0,      0.35,  Math.PI],  // wall to south
  [ 0,-1, -0.35,   0,     -Math.PI/2],  // wall to west
  [ 0, 1,  0.35,   0,      Math.PI/2],  // wall to east
];

var torchCount = 0;
for (var r=1; r<ROWS-1; r++) {
  for (var c=1; c<COLS-1; c++) {
    if (MAP[r][c] !== '.') continue;
    dirs.forEach(function(d) {
      var nr = r+d[0], nc = c+d[1];
      if (nr<0||nr>=ROWS||nc<0||nc>=COLS) return;
      if (MAP[nr][nc] !== 'W') return;
      // space torches out — only every ~7 tiles
      if ((r*COLS+c) % 7 !== 0) return;

      var cx = c*TILE + TILE/2, cz = r*TILE + TILE/2;
      var tx = cx + d[2]*TILE, tz = cz + d[3]*TILE;
      var ty = 1.9;

      // bracket arm (horizontal bar sticking out of wall)
      var arm = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.4), woodMat);
      arm.position.set(tx, ty, tz);
      arm.rotation.y = d[4];
      scene.add(arm);

      // vertical handle
      var handle = new THREE.Mesh(new THREE.CylinderGeometry(0.04,0.05,0.5,6), woodMat);
      handle.position.set(tx, ty - 0.1, tz);
      scene.add(handle);

      // fire bowl
      var bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.1,0.06,0.1,8), woodMat);
      bowl.position.set(tx, ty + 0.12, tz);
      scene.add(bowl);

      // pixel art fire sprite — billboard plane
      var fMat = new THREE.MeshBasicMaterial({
        map: fireTex, transparent: true, depthWrite: false,
        side: THREE.DoubleSide, alphaTest: 0.05
      });
      var fGeo = new THREE.PlaneGeometry(0.5, 0.5);
      var flame  = new THREE.Mesh(fGeo, fMat);
      var flame2 = new THREE.Mesh(fGeo, fMat);
      flame.position.set(tx, ty + 0.35, tz);
      flame2.position.set(tx, ty + 0.35, tz);
      flame2.rotation.y = Math.PI / 2;
      scene.add(flame); scene.add(flame2);

      // torch color by zone
      var torchCol = c < 11 ? 0xff8833 : (c < 22 ? 0x44ccbb : 0xcc2233);
      // point light — starts disabled, enabled when player is near
      var light = new THREE.PointLight(torchCol, 10, 18);
      light.position.set(tx, ty + 0.5, tz);
      light.visible = false;
      scene.add(light);

      torchLights.push({
        light: light, flame: flame, flame2: flame2,
        mat1: fMat, mat2: fMat,
        base: light.intensity, t: Math.random()*100,
        ox: tx, oy: ty+0.38, oz: tz
      });
      torchCount++;
    });
  }
}

// ── Pillars in Central Chamber ────────────────────────────────────────────
[[14,7],[16,7],[14,9],[16,9]].forEach(function(p) {
  var col=p[0], row=p[1];
  if (MAP[row] && MAP[row][col] === '.') {
    var mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.22,0.25,3.2,8), pillarMat);
    mesh.position.set(col*TILE+TILE/2, 1.6, row*TILE+TILE/2);
    scene.add(mesh);
    collidables.push(new THREE.Box3().setFromObject(mesh));
  }
});

// ── Input ──────────────────────────────────────────────────────────────────
var keys = {};
window.addEventListener('keydown', function(e) {
  keys[e.code] = true;
  if (['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))
    e.preventDefault();
});
window.addEventListener('keyup', function(e) { keys[e.code] = false; });

// ── Mouse look + pointer lock ──────────────────────────────────────────────
var yaw=0, pitch=0;
renderer.domElement.addEventListener('click', function() {
  renderer.domElement.requestPointerLock();
});
document.addEventListener('pointerlockchange', function() {
  var locked = document.pointerLockElement === renderer.domElement;
  document.getElementById('crosshair').style.display = locked ? 'block' : 'none';
});
window.addEventListener('mousemove', function(e) {
  if (document.pointerLockElement !== renderer.domElement) return;
  yaw   -= e.movementX * 0.0022;
  pitch -= e.movementY * 0.0022;
  pitch  = Math.max(-1.1, Math.min(1.1, pitch));
  camera.rotation.order = 'YXZ';
  camera.rotation.y = yaw;
  camera.rotation.x = pitch;
});

// ── Start button ───────────────────────────────────────────────────────────
// ── Wallet connect — EIP-6963 multi-wallet detection ─────────────────────
var walletAddress = '';
var eip6963Providers = [];

// collect EIP-6963 announcements
window.addEventListener('eip6963:announceProvider', function(e) {
  var already = eip6963Providers.some(function(p) { return p.info.uuid === e.detail.info.uuid; });
  if (!already) eip6963Providers.push(e.detail);
});
// trigger all installed wallets to announce themselves
window.dispatchEvent(new Event('eip6963:requestProvider'));

function gatherWallets() {
  var wallets = [];
  // EIP-6963 wallets (MetaMask, Rabby, Coinbase, OKX, Phantom EVM, etc.)
  eip6963Providers.forEach(function(p) {
    wallets.push({ name: p.info.name, icon: p.info.icon, provider: p.provider });
  });
  // fallback: window.ethereum.providers array (some older setups)
  if (wallets.length === 0 && window.ethereum) {
    var provs = window.ethereum.providers || [window.ethereum];
    provs.forEach(function(p) {
      var name = p.isMetaMask ? 'MetaMask'
               : p.isCoinbaseWallet ? 'Coinbase Wallet'
               : p.isBraveWallet   ? 'Brave Wallet'
               : p.isRabby         ? 'Rabby'
               : p.isTrust         ? 'Trust Wallet'
               : 'Browser Wallet';
      wallets.push({ name: name, icon: null, provider: p });
    });
  }
  return wallets;
}

function onWalletConnected(addr) {
  walletAddress = addr;
  var short = addr.slice(0,6) + '...' + addr.slice(-4);
  document.getElementById('walletAddress').textContent = short.toUpperCase();
  document.getElementById('connectWalletBtn').textContent = 'CONNECTED';
  document.getElementById('connectWalletBtn').style.borderColor = '#44aa66';
  document.getElementById('connectWalletBtn').style.color = '#44aa66';
  document.getElementById('nameWrap').style.display = 'flex';
  var btn = document.getElementById('startBtn');
  btn.disabled = false;
  btn.style.opacity = '1';
  btn.style.cursor = 'pointer';
  document.getElementById('wallet-picker').style.display = 'none';
}

function buildWalletPicker(wallets) {
  var list = document.getElementById('wallet-list');
  var noWallet = document.getElementById('wallet-no-wallet');
  list.innerHTML = '';
  if (wallets.length === 0) {
    noWallet.style.display = 'block';
    return;
  }
  noWallet.style.display = 'none';
  wallets.forEach(function(w) {
    var btn = document.createElement('button');
    btn.className = 'wallet-option';
    var iconHtml = w.icon
      ? '<img src="'+w.icon+'" alt=""/>'
      : '<div class="wallet-icon-placeholder">◈</div>';
    btn.innerHTML = iconHtml + '<span>' + w.name.toUpperCase() + '</span>';
    btn.addEventListener('click', function() {
      w.provider.request({ method: 'eth_requestAccounts' })
        .then(function(accounts) { onWalletConnected(accounts[0]); })
        .catch(function(err) { console.error(err); });
    });
    list.appendChild(btn);
  });
}

document.getElementById('connectWalletBtn').addEventListener('click', function() {
  // re-request announcements in case wallets load late
  window.dispatchEvent(new Event('eip6963:requestProvider'));
  setTimeout(function() {
    var wallets = gatherWallets();
    if (wallets.length === 1) {
      // only one wallet — connect directly, skip picker
      wallets[0].provider.request({ method: 'eth_requestAccounts' })
        .then(function(accounts) { onWalletConnected(accounts[0]); })
        .catch(function(err) { console.error(err); });
    } else {
      buildWalletPicker(wallets);
      document.getElementById('wallet-picker').style.display = 'flex';
    }
  }, 80);
});

document.getElementById('wallet-picker-cancel').addEventListener('click', function() {
  document.getElementById('wallet-picker').style.display = 'none';
});

document.getElementById('startBtn').addEventListener('click', function() {
  var nameInput = document.getElementById('playerNameInput').value.trim().toUpperCase();
  playerName = nameInput || 'ANON';
  gameStarted = true;
  sfx.boot();
  document.getElementById('instructions').style.display = 'none';
  document.getElementById('hud').style.display = 'flex';
  document.getElementById('timer').style.display = 'block';
  document.getElementById('fragment-bar').style.display = 'block';
  document.getElementById('vignette').style.display = 'block';
  document.getElementById('compass').style.display = 'block';
  wraith.active = true;
  timerRunning = true;
  try { renderer.domElement.requestPointerLock(); } catch(e) {}
});

document.getElementById('lbBtn').addEventListener('click', function() { showLeaderboard(); });
document.getElementById('lb-close').addEventListener('click', function() {
  document.getElementById('lb-overlay').style.display = 'none';
});

// ── Collision ─────────────────────────────────────────────────────────────
var SPEED=5, HALF=0.25;
var pBox = new THREE.Box3();

function collides(pos) {
  pBox.set(
    new THREE.Vector3(pos.x-HALF, 0.1, pos.z-HALF),
    new THREE.Vector3(pos.x+HALF, 3,   pos.z+HALF)
  );
  for (var i=0;i<collidables.length;i++) {
    if (pBox.intersectsBox(collidables[i])) return true;
  }
  return false;
}

// ── Health ─────────────────────────────────────────────────────────────────
var hp = 3, invincible = 0, isDead = false;
var gameStarted = false, playerName = 'ANON';

function takeDamage() {
  if (invincible > 0 || isDead) return;
  hp--;
  invincible = 2.0;
  sfx.damage();
  document.body.style.background = '#ff0000';
  setTimeout(function(){ document.body.style.background = '#000'; }, 120);
  // update hearts
  var hearts = ['h1','h2','h3'];
  for (var i=0; i<3; i++) {
    document.getElementById(hearts[i]).style.color = i < hp ? '#cc3333' : '#333';
  }
  if (hp <= 0) die();
}

function die() {
  isDead = true;
  timerRunning = false;
  document.exitPointerLock();
  var d = document.createElement('div');
  d.id = 'dead';
  d.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);display:flex;flex-direction:column;align-items:center;justify-content:center;color:#ff3333;font-family:monospace;z-index:99;gap:16px';
  d.innerHTML = '<h1 style="font-size:3rem;letter-spacing:8px">YOU DIED</h1><p style="color:#aaa">The dungeon claimed your soul.</p><button onclick="location.reload()" style="padding:12px 32px;background:transparent;border:1px solid #ff3333;color:#ff3333;font-family:monospace;font-size:1rem;letter-spacing:3px;cursor:pointer">TRY AGAIN</button>';
  document.body.appendChild(d);
}

// ── Zone System ────────────────────────────────────────────────────────────
var ZONES = [
  { id:0, name:'THE FORGOTTEN HALLS', colMax:21, fogColor:0x1a0a04, fogDensity:0.055, ambColor:new THREE.Color(0x664422), ambInt:2.5 },
  { id:1, name:'THE DEEP',            colMax:58, fogColor:0x040e14, fogDensity:0.065, ambColor:new THREE.Color(0x0a2030), ambInt:1.6 },
  { id:2, name:'THE CURSED CORE',     colMax:99, fogColor:0x100006, fogDensity:0.08,  ambColor:new THREE.Color(0x280008), ambInt:0.9 },
];
var currentZone = -1;
var zoneAmbTarget = new THREE.Color(0x3a1a08);
var zoneAmbCurrent = new THREE.Color(0x3a1a08);

function getZoneIdx(worldX) {
  var col = Math.floor(worldX / TILE);
  for (var i = 0; i < ZONES.length; i++) if (col < ZONES[i].colMax) return i;
  return 2;
}

function updateZone() {
  var zi = getZoneIdx(camera.position.x);
  if (zi !== currentZone) {
    currentZone = zi;
    var z = ZONES[zi];
    scene.fog.color.setHex(z.fogColor);
    targetFogDensity = z.fogDensity;
    zoneAmbTarget.copy(z.ambColor);
    // flash zone name only after game has started
    if (!gameStarted) return;
    var nameEl = document.createElement('div');
    nameEl.style.cssText = 'position:fixed;top:38%;left:50%;transform:translateX(-50%);font-family:monospace;font-size:0.75rem;letter-spacing:6px;z-index:50;pointer-events:none;opacity:1;transition:opacity 1.5s;';
    nameEl.style.color = zi === 0 ? '#ff9944' : zi === 1 ? '#44ccbb' : '#cc2233';
    nameEl.textContent = '— ' + z.name + ' —';
    document.body.appendChild(nameEl);
    setTimeout(function(){ nameEl.style.opacity='0'; }, 1800);
    setTimeout(function(){ nameEl.remove(); }, 3400);
  }
  // smooth ambient transition
  zoneAmbCurrent.lerp(zoneAmbTarget, 0.03);
  ambientLight.color.copy(zoneAmbCurrent);
  ambientLight.intensity += (ZONES[zi].ambInt - ambientLight.intensity) * 0.03;
}

// ── Obstacles ──────────────────────────────────────────────────────────────
var obstacles = [];
var spikeMat  = new THREE.MeshLambertMaterial({ color: 0xaabbcc, emissive: 0x223344 });
var metalMat  = new THREE.MeshLambertMaterial({ color: 0x777788 });
var stoneMat  = new THREE.MeshLambertMaterial({ color: 0x554433 });
var glowBlade  = new THREE.MeshLambertMaterial({ color: 0xd0d8e8, emissive: 0x112244 });
var ironMat    = new THREE.MeshLambertMaterial({ color: 0x222233, emissive: 0x050510 });
var chainMat2  = new THREE.MeshLambertMaterial({ color: 0x444455, emissive: 0x111122 });

// Floor spikes — shoot up on a timer
function makeFloorSpike(x, z) {
  var base = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.07, 1.4), new THREE.MeshLambertMaterial({color:0x444455}));
  base.position.set(x, 0.035, z);
  scene.add(base);
  var spikes = [];
  for (var si=-1; si<=1; si++) {
    for (var sj=-1; sj<=1; sj++) {
      var sp = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.65, 4), spikeMat);
      sp.position.set(x + si*0.4, -0.3, z + sj*0.4);
      scene.add(sp);
      spikes.push(sp);
    }
  }
  obstacles.push({ type:'floorspike', spikes:spikes, x:x, z:z, t:Math.random()*Math.PI*2 });
}

// Pendulum scythe — swings across the corridor from ceiling
function makePendulum(x, z, axis) {
  var pivot = new THREE.Object3D();
  pivot.position.set(x, 3.3, z);

  // ceiling bracket
  var bracket = new THREE.Mesh(new THREE.BoxGeometry(0.3,0.2,0.3), ironMat);
  bracket.position.y = 0.04;
  pivot.add(bracket);

  // chain
  var chain = new THREE.Mesh(new THREE.CylinderGeometry(0.032,0.032,0.8,6), chainMat2);
  chain.position.y = -0.4;
  pivot.add(chain);
  for (var li=0; li<3; li++) {
    var link = new THREE.Mesh(new THREE.TorusGeometry(0.07,0.025,4,6), chainMat2);
    link.position.y = -0.12 - li*0.28;
    link.rotation.x = li%2===0 ? 0 : Math.PI/2;
    pivot.add(link);
  }

  // handle rod
  var hndl = new THREE.Mesh(new THREE.CylinderGeometry(0.04,0.05,0.22,6), ironMat);
  hndl.position.y = -0.9;
  pivot.add(hndl);

  // fan-shaped axe blade — sector pointing downward, like a scythe head
  var bladeR = 2.1;
  var ha = 1.1; // half-spread ~63 degrees each side
  // right edge point angle in standard math coords
  var rA = ha - Math.PI / 2;
  // left edge point angle in standard math coords
  var lA = -Math.PI / 2 - ha;
  var bShape = new THREE.Shape();
  bShape.moveTo(0, 0);
  bShape.lineTo(Math.cos(rA) * bladeR, Math.sin(rA) * bladeR); // right edge
  bShape.absarc(0, 0, bladeR, rA, lA, true);                    // clockwise arc through bottom
  bShape.lineTo(0, 0);                                           // back to top
  var bladeGeo = new THREE.ExtrudeGeometry(bShape, { depth: 0.14, bevelEnabled: false });
  var bladeMesh = new THREE.Mesh(bladeGeo, new THREE.MeshLambertMaterial({
    color: 0xc8d4e8, emissive: 0x1a2234, side: THREE.DoubleSide
  }));
  bladeMesh.position.y = -1.0;
  // ExtrudeGeometry shape is in XY plane → face normal points ±Z
  // axis='x': swings in X, corridor runs in Z, player faces Z → face already points Z → NO rotation
  // axis='z': swings in Z, corridor runs in X, player faces X → rotate Y 90° so face points X
  if (axis === 'z') bladeMesh.rotation.y = Math.PI / 2;
  pivot.add(bladeMesh);

  scene.add(pivot);
  obstacles.push({ type:'pendulum', pivot:pivot, x:x, z:z, axis:axis, t:Math.random()*Math.PI*2, amp:0.65 });
}

// Pressure plate — hidden floor tile that bursts spikes when stepped on
function makePressurePlate(x, z) {
  var plate = new THREE.Mesh(new THREE.BoxGeometry(1.0,0.05,1.0), stoneMat);
  plate.position.set(x, 0.025, z);
  scene.add(plate);
  // subtle groove lines on plate
  var groove = new THREE.Mesh(new THREE.BoxGeometry(0.85,0.06,0.08), new THREE.MeshLambertMaterial({color:0x3a2a1a}));
  groove.position.set(x, 0.06, z);
  scene.add(groove);
  var burstSpikes = [];
  for (var bi=0; bi<8; bi++) {
    var angle = (bi/8)*Math.PI*2;
    var bsp = new THREE.Mesh(new THREE.ConeGeometry(0.09,0.85,4), spikeMat);
    bsp.position.set(x+Math.cos(angle)*0.9, -0.4, z+Math.sin(angle)*0.9);
    scene.add(bsp);
    burstSpikes.push(bsp);
  }
  var csp = new THREE.Mesh(new THREE.ConeGeometry(0.11,1.0,4), spikeMat);
  csp.position.set(x, -0.45, z);
  scene.add(csp);
  burstSpikes.push(csp);
  var warnLight = new THREE.PointLight(0xff6600, 0, 7);
  warnLight.position.set(x, 0.5, z);
  scene.add(warnLight);
  obstacles.push({ type:'pressureplate', plate:plate, spikes:burstSpikes, warnLight:warnLight, x:x, z:z, triggered:false, triggerT:0, cooldown:0 });
}

// ── Dungeon Bears (GLB model) ──────────────────────────────────────────────
var bears = [];
var BEAR_SCALE = 0.013; // tweak if model is too big/small

function spawnBear(template, x, z, speed, detectionRange) {
  var root = new THREE.Object3D();
  var model = template.clone();
  model.scale.setScalar(BEAR_SCALE);
  // most bear models face +Z by default; flip if needed
  model.rotation.y = Math.PI;
  root.add(model);

  var eyeLight = new THREE.PointLight(0xff1100, 0, 8);
  eyeLight.position.set(0, 1.6, 0);
  root.add(eyeLight);

  root.position.set(x, 0, z);
  scene.add(root);

  bears.push({
    root: root,
    x: x, z: z,
    speed: speed,
    detectionRange: detectionRange,
    attackRange: 1.4,
    chasing: false,
    eyeLight: eyeLight,
    patrolT: Math.random() * Math.PI * 2,
    patrolCx: x, patrolCz: z,
    patrolR: 3 + Math.random() * 2
  });
}

// load once via dynamic import, then clone for each bear
import('https://unpkg.com/three@0.160.0/examples/jsm/loaders/GLTFLoader.js').then(function(mod) {
  var loader = new mod.GLTFLoader();
  loader.load('Bear.glb', function(gltf) {
    var template = gltf.scene;
    template.traverse(function(child) {
      if (child.isMesh) {
        child.castShadow = false;
        child.receiveShadow = false;
      }
    });
    spawnBear(template, 4*TILE,  5*TILE,  3.2, 12);  // left section upper
    spawnBear(template, 44*TILE, 2*TILE,  3.5, 12);  // top-center room
    spawnBear(template, 65*TILE, 10*TILE, 3.0, 12);  // right section
    spawnBear(template, 38*TILE, 21*TILE, 2.8, 12);  // bottom section
  }, undefined, function(err) {
    console.warn('Bear.glb failed', err);
  });
}).catch(function(e) {
  console.warn('GLTFLoader failed to load', e);
});

function updateBears(dt) {
  var px = camera.position.x, pz = camera.position.z;
  bears.forEach(function(b) {
    var dx = px - b.x, dz = pz - b.z;
    var dist = Math.sqrt(dx*dx + dz*dz);
    b.chasing = dist < b.detectionRange;

    if (b.chasing) {
      var spd = b.speed * (1 + (b.detectionRange - dist) / b.detectionRange * 0.6);
      var nx = b.x + (dx/dist) * spd * dt;
      var nz = b.z + (dz/dist) * spd * dt;
      var testPos = new THREE.Vector3(nx, 1.65, b.z);
      if (!collides(testPos)) b.x = nx;
      testPos.set(b.x, 1.65, nz);
      if (!collides(testPos)) b.z = nz;

      b.eyeLight.intensity = 2.5 + Math.sin(Date.now()*0.01)*0.5;
      b.root.rotation.y = Math.atan2(dx, dz);

      if (dist < b.attackRange) takeDamage();

    } else {
      b.patrolT += dt * 0.5;
      var tx = b.patrolCx + Math.cos(b.patrolT) * b.patrolR;
      var tz = b.patrolCz + Math.sin(b.patrolT) * b.patrolR;
      var pdx = tx - b.x, pdz = tz - b.z;
      var pd = Math.sqrt(pdx*pdx + pdz*pdz) || 1;
      var nx2 = b.x + (pdx/pd) * 1.5 * dt;
      var nz2 = b.z + (pdz/pd) * 1.5 * dt;
      var tp2 = new THREE.Vector3(nx2, 1.65, b.z);
      if (!collides(tp2)) b.x = nx2;
      tp2.set(b.x, 1.65, nz2);
      if (!collides(tp2)) b.z = nz2;

      b.root.rotation.y = Math.atan2(pdx, pdz);
      b.eyeLight.intensity = 0;
    }

    b.root.position.set(b.x, 0, b.z);
    b.root.position.y = Math.abs(Math.sin(Date.now()*0.006)) * 0.06;
  });
}

// ── Spinning blade — cross shape from 2 boxes
function makeBlade(x, z, speed) {
  var pivot = new THREE.Object3D();
  pivot.position.set(x, 1.4, z);
  var b1 = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.08, 0.18), bladeMat);
  var b2 = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.08, 1.8), bladeMat);
  var center = new THREE.Mesh(new THREE.CylinderGeometry(0.12,0.12,0.2,8), new THREE.MeshLambertMaterial({color:0x666688}));
  pivot.add(b1); pivot.add(b2); pivot.add(center);
  // pole
  var pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04,0.04,1.4,6), new THREE.MeshLambertMaterial({color:0x555555}));
  pole.position.set(x, 0.7, z);
  scene.add(pole);
  scene.add(pivot);
  // warning light
  var warnLight = new THREE.PointLight(0xff2200, 4, 7);
  warnLight.position.set(x, 1.4, z);
  scene.add(warnLight);
  obstacles.push({ type:'blade', mesh:pivot, x:x, z:z, speed:speed, warnLight:warnLight });
}

// Patrol hazard — bouncing spike ball
function makePatrol(x1, z1, x2, z2) {
  var ball = new THREE.Mesh(new THREE.IcosahedronGeometry(0.35, 0), spikeMat);
  ball.position.set(x1, 0.6, z1);
  var glow = new THREE.PointLight(0xff4400, 9, 14);
  glow.position.set(x1, 0.6, z1);
  scene.add(ball); scene.add(glow);
  obstacles.push({ type:'patrol', mesh:ball, glow:glow, x1:x1, z1:z1, x2:x2, z2:z2, t:0, speed:2.5 });
}

// Pendulum axes — verified floor positions for 80×24 map
makePendulum(5*TILE,  4*TILE,  'x');  // left vertical upper
makePendulum(3*TILE,  7*TILE,  'z');  // left vertical mid
makePendulum(5*TILE,  10*TILE, 'x');  // left vertical lower
makePendulum(3*TILE,  13*TILE, 'z');  // left vertical bottom
makePendulum(10*TILE, 5*TILE,  'z');  // left horizontal passage
makePendulum(26*TILE, 2*TILE,  'x');  // mid-top room — 3 axes across long room
makePendulum(34*TILE, 2*TILE,  'x');  //   mid-top room centre
makePendulum(40*TILE, 2*TILE,  'z');  //   mid-top room far end
makePendulum(24*TILE, 5*TILE,  'x');  // mid vertical upper
makePendulum(24*TILE, 7*TILE,  'z');  // mid vertical mid
makePendulum(24*TILE, 11*TILE, 'x');  // mid vertical lower — 3rd in column
makePendulum(43*TILE, 7*TILE,  'x');  // mid-top far corridor
makePendulum(50*TILE, 7*TILE,  'z');  // mid-east wide passage — 3 axes
makePendulum(55*TILE, 7*TILE,  'z');  //   mid-east passage mid
makePendulum(64*TILE, 7*TILE,  'z');  //   mid-east passage far
makePendulum(25*TILE, 11*TILE, 'z');  // mid-bottom entry
makePendulum(35*TILE, 16*TILE, 'x');  // mid-bottom corridor
makePendulum(28*TILE, 20*TILE, 'z');  // bottom passage
makePendulum(33*TILE, 22*TILE, 'z');  // bottom passage mid — 3rd
makePendulum(40*TILE, 22*TILE, 'x');  // bottom far end
makePendulum(63*TILE, 2*TILE,  'x');  // right upper — 2 axes
makePendulum(70*TILE, 2*TILE,  'x');  //   right upper far
makePendulum(68*TILE, 7*TILE,  'z');  // right mid passage
makePendulum(60*TILE, 8*TILE,  'x');  // right corridor
makePendulum(66*TILE, 14*TILE, 'z');  // right lower

// Floor spike traps — scattered across all three sections
makeFloorSpike(4*TILE,  2*TILE);    // left top room
makeFloorSpike(4*TILE,  6*TILE);    // left vertical — between axes
makeFloorSpike(4*TILE,  9*TILE);    // left vertical — between axes
makeFloorSpike(4*TILE,  11*TILE);   // left mid
makeFloorSpike(3*TILE,  14*TILE);   // left lower
makeFloorSpike(8*TILE,  5*TILE);    // left horizontal passage
makeFloorSpike(30*TILE, 2*TILE);    // mid-top room
makeFloorSpike(37*TILE, 2*TILE);    // mid-top room long stretch
makeFloorSpike(43*TILE, 2*TILE);    // mid-top room far end
makeFloorSpike(24*TILE, 3*TILE);    // mid vertical upper
makeFloorSpike(26*TILE, 7*TILE);    // mid-top east corridor
makeFloorSpike(50*TILE, 7*TILE);    // mid-east wide passage
makeFloorSpike(26*TILE, 15*TILE);   // mid-bottom corridor
makeFloorSpike(35*TILE, 20*TILE);   // bottom path
makeFloorSpike(21*TILE, 20*TILE);   // bottom entry corridor
makeFloorSpike(30*TILE, 22*TILE);   // bottom passage mid
makeFloorSpike(71*TILE, 5*TILE);    // right upper room
makeFloorSpike(70*TILE, 8*TILE);    // right mid corridor
makeFloorSpike(65*TILE, 12*TILE);   // right section mid
makeFloorSpike(62*TILE, 11*TILE);   // right section lower passage

// Pressure plates — at corridor mouths, trigger spike burst on step
makePressurePlate(10*TILE, 5*TILE);   // left section south entry
makePressurePlate(3*TILE,  6*TILE);   // left section inner passage
makePressurePlate(4*TILE,  8*TILE);   // left lower corridor mouth
makePressurePlate(23*TILE, 6*TILE);   // mid-top entry from west
makePressurePlate(24*TILE, 14*TILE);  // mid-bottom north entry
makePressurePlate(42*TILE, 8*TILE);   // mid-top east passage
makePressurePlate(65*TILE, 7*TILE);   // right section entry
makePressurePlate(72*TILE, 8*TILE);   // right section far corridor

// Patrol balls sweep across corridors (perpendicular to walk direction)
makePatrol(4*TILE,  5*TILE,  6*TILE,  5*TILE);   // left section — sweeps E-W across N-S corridor
makePatrol(4*TILE,  7*TILE,  6*TILE,  7*TILE);   // left section lower — sweeps E-W
makePatrol(24*TILE, 4*TILE,  24*TILE, 6*TILE);   // mid-top — sweeps N-S across E-W corridor
makePatrol(43*TILE, 4*TILE,  43*TILE, 6*TILE);   // mid-top far — sweeps N-S
makePatrol(60*TILE, 2*TILE,  62*TILE, 2*TILE);   // right section — sweeps E-W
makePatrol(66*TILE, 2*TILE,  68*TILE, 2*TILE);   // right section far — sweeps E-W

function updateObstacles(dt) {
  var px = camera.position.x, pz = camera.position.z;
  obstacles.forEach(function(o) {

    if (o.type === 'floorspike') {
      o.t += dt * 1.4;
      var phase = Math.sin(o.t);
      var up = phase > 0.2;
      var h = up ? Math.max(0, phase * 0.6) : -0.3;
      o.spikes.forEach(function(s) { s.position.y = h; });
      if (up) {
        var dx = o.x-px, dz = o.z-pz;
        if (dx*dx+dz*dz < 1.8) takeDamage();
      }

    } else if (o.type === 'pendulum') {
      o.t += dt * 1.1;
      var swing = Math.sin(o.t) * o.amp;
      if (o.axis === 'x') o.pivot.rotation.z = swing;
      else                 o.pivot.rotation.x = swing;
      var tipX = o.x + (o.axis === 'x' ? Math.sin(swing)*3.0 : 0);
      var tipZ = o.z + (o.axis === 'z' ? Math.sin(swing)*3.0 : 0);
      var dx = tipX-px, dz = tipZ-pz;
      if (dx*dx+dz*dz < 1.1) takeDamage();

    } else if (o.type === 'pressureplate') {
      var dx = o.x-px, dz = o.z-pz;
      if (dx*dx+dz*dz < 0.65 && o.cooldown <= 0 && !o.triggered) {
        o.triggered = true;
        o.triggerT = 0;
      }
      if (o.cooldown > 0) o.cooldown -= dt;
      if (o.triggered) {
        o.triggerT += dt;
        var sh;
        if      (o.triggerT < 0.25) sh = (o.triggerT/0.25)*0.85;
        else if (o.triggerT < 1.8)  sh = 0.85;
        else {
          sh = 0.85 - (o.triggerT-1.8)*1.0;
          if (sh < -0.4) { o.triggered=false; o.cooldown=4.0; sh=-0.4; }
        }
        o.spikes.forEach(function(s) { s.position.y = sh; });
        o.warnLight.intensity = sh > 0 ? 6 : 0;
        if (sh > 0.3) {
          var ddx = o.x-px, ddz = o.z-pz;
          if (ddx*ddx+ddz*ddz < 2.2) takeDamage();
        }
      }

    } else if (o.type === 'patrol') {
      o.t += dt * o.speed;
      var t = (Math.sin(o.t)+1)/2;
      var nx = o.x1+(o.x2-o.x1)*t;
      var nz = o.z1+(o.z2-o.z1)*t;
      o.mesh.position.set(nx, 0.6+Math.abs(Math.sin(o.t*2))*0.3, nz);
      o.mesh.rotation.y += dt*3;
      o.glow.position.copy(o.mesh.position);
      var dx = nx-px, dz = nz-pz;
      if (dx*dx+dz*dz < 1.0) takeDamage();
      o.glow.intensity = 7 + Math.sin(o.t*4)*2;
    }
  });
}

// ── The Wraith ─────────────────────────────────────────────────────────────
var wraith = (function() {
  var root = new THREE.Object3D();

  // body — dark wispy form
  var bodyMat = new THREE.MeshLambertMaterial({ color: 0x110022, emissive: 0x220033, transparent: true, opacity: 0.92 });
  var body = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 6), bodyMat);
  body.scale.set(0.9, 1.5, 0.9);
  root.add(body);

  // lower wisp tendrils
  var wispMat = new THREE.MeshLambertMaterial({ color: 0x220044, emissive: 0x330055, transparent: true, opacity: 0.6 });
  [-0.25, 0, 0.25].forEach(function(ox) {
    var wisp = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.7, 5), wispMat);
    wisp.rotation.x = Math.PI; // point downward
    wisp.position.set(ox, -0.7, 0);
    root.add(wisp);
  });

  // glowing purple eyes
  var eyeMat = new THREE.MeshBasicMaterial({ color: 0xcc44ff });
  [-0.16, 0.16].forEach(function(ex) {
    var eye = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 6), eyeMat);
    eye.position.set(ex, 0.15, 0.45);
    root.add(eye);
  });

  // single purple light — one is fine, it's atmospheric
  var light = new THREE.PointLight(0x9900ff, 5, 10);
  light.position.set(0, 0.5, 0);
  root.add(light);

  // spawns in left section — close behind the player's start
  var x = 5*TILE, z = 8*TILE;
  root.position.set(x, 1.2, z);
  scene.add(root);

  var vignette = document.getElementById('vignette');

  return {
    root: root,
    light: light,
    x: x, z: z,
    speed: 4.2,
    t: 0,
    active: false,
    spawnDelay: 5,
    warned: false,
    farTimer: 0      // tracks how long it has been stuck far from player
  };
})();

function updateWraith(dt) {
  if (!wraith.active || isDead) return;

  // head-start countdown
  if (wraith.spawnDelay > 0) {
    wraith.spawnDelay -= dt;
    // flash warning at 3 seconds remaining
    if (wraith.spawnDelay <= 3 && !wraith.warned) {
      wraith.warned = true;
      var warn = document.createElement('div');
      warn.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);color:#cc44ff;font-family:monospace;font-size:1.4rem;letter-spacing:6px;z-index:50;pointer-events:none;text-shadow:0 0 20px #cc44ff';
      warn.textContent = 'IT WAKES';
      document.body.appendChild(warn);
      setTimeout(function(){ warn.remove(); }, 2500);
    }
    return;
  }

  wraith.t += dt;

  var px = camera.position.x, pz = camera.position.z;
  var dx = px - wraith.x, dz = pz - wraith.z;
  var dist = Math.sqrt(dx*dx + dz*dz);

  // teleport behind player if stuck far away for too long
  if (dist > 30) {
    wraith.farTimer += dt;
    if (wraith.farTimer > 22) {
      wraith.farTimer = 0;
      // try offsets behind player until a non-wall tile is found
      var offsets = [
        [-6, 0], [6, 0], [0, -6], [0, 6],
        [-9, 0], [9, 0], [0, -9], [0, 9]
      ];
      for (var oi = 0; oi < offsets.length; oi++) {
        var tx = px + offsets[oi][0], tz = pz + offsets[oi][1];
        var tp2 = new THREE.Vector3(tx, 1.2, tz);
        if (!collides(tp2)) { wraith.x = tx; wraith.z = tz; break; }
      }
    }
  } else {
    wraith.farTimer = 0;
  }

  // move toward player
  if (dist > 0.1) {
    var spd = wraith.speed;
    var nx = wraith.x + (dx/dist) * spd * dt;
    var nz = wraith.z + (dz/dist) * spd * dt;
    var tp = new THREE.Vector3(nx, 1.2, wraith.z);
    if (!collides(tp)) wraith.x = nx;
    tp.set(wraith.x, 1.2, nz);
    if (!collides(tp)) wraith.z = nz;
  }

  wraith.root.position.set(wraith.x, 1.2 + Math.sin(wraith.t*2)*0.15, wraith.z);
  wraith.root.rotation.y = Math.atan2(dx, dz);

  // wisp bob
  wraith.root.children.forEach(function(c, i) {
    if (i >= 1 && i <= 3) c.position.y = -0.7 + Math.sin(wraith.t*3 + i)*0.1;
  });

  // eye pulse
  wraith.light.intensity = 4 + Math.sin(wraith.t*5)*1.5;

  // vignette + audio warning — intensifies as wraith gets closer
  var maxDist = 20, danger = Math.max(0, 1 - dist/maxDist);
  wraith.vignette.style.background = 'radial-gradient(ellipse at center, transparent 30%, rgba(80,0,120,'+(danger*0.85)+') 100%)';
  wraith.vignette.style.opacity = danger > 0.05 ? '1' : '0';
  sfx.wraithProximity(danger);

  // kill on contact
  if (dist < 1.1) die();
}

// activate wraith when game starts, speed up on each fragment
var _origCollectFragment = null; // patched below after collectFragment is defined

// ── Soul Fragments ─────────────────────────────────────────────────────────
var fragments = [];
var fragmentsCollected = 0;
var TOTAL_FRAGMENTS = 6;

// ── Exit Gate ─────────────────────────────────────────────────────────────
var EXIT_X = 72*TILE, EXIT_Z = 4*TILE;  // EXIT — E at row4,col72

// materials
var gateStoneMat = new THREE.MeshLambertMaterial({ color:0x55443a, emissive:0x110900 });
var ironBarMat2  = new THREE.MeshLambertMaterial({ color:0x4a4a58, emissive:0x0e0e18 });

var exitGate = new THREE.Object3D();

// stone pillars each side
var pillarGeo = new THREE.BoxGeometry(0.32, 3.8, 0.32);
[-TILE+0.16, TILE-0.16].forEach(function(ox) {
  var p = new THREE.Mesh(pillarGeo, gateStoneMat);
  p.position.set(ox, 0, 0);
  exitGate.add(p);
});
// stone lintel across top
var lintel = new THREE.Mesh(new THREE.BoxGeometry(TILE*2, 0.32, 0.32), gateStoneMat);
lintel.position.y = 1.74;
exitGate.add(lintel);

// iron bars — 8 round bars
var gateBars = [];
var _barW = (TILE*2 - 0.64) / 7;
for (var _gi = 0; _gi < 8; _gi++) {
  var _bar = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 3.3, 7), ironBarMat2);
  _bar.position.set(-TILE + 0.32 + _gi * _barW, -0.08, 0);
  exitGate.add(_bar);
  gateBars.push(_bar);
}
// two horizontal cross-rails
[-0.85, 0.7].forEach(function(oy) {
  var rail = new THREE.Mesh(new THREE.BoxGeometry(TILE*1.68, 0.09, 0.09), ironBarMat2);
  rail.position.y = oy;
  exitGate.add(rail);
  gateBars.push(rail);
});

// lock in the middle
var _lockMat = new THREE.MeshLambertMaterial({ color:0xffaa00, emissive:0xcc5500 });
var gateLock = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.28, 0.22), _lockMat);
gateBars.push(gateLock);
exitGate.add(gateLock);

// orange locked glow
var gateLight = new THREE.PointLight(0xff7700, 5, 12);
gateLight.position.set(0, 0, 0.8);
exitGate.add(gateLight);

exitGate.position.set(EXIT_X, 1.9, EXIT_Z);
scene.add(exitGate);

// ── green grass backdrop — daylight visible through the bars ──────────────
var _grassMat = new THREE.MeshBasicMaterial({ color: 0x22dd44, side: THREE.DoubleSide });
var grassBg = new THREE.Mesh(new THREE.PlaneGeometry(TILE*2, 3.8), _grassMat);
grassBg.position.set(EXIT_X, 1.9, EXIT_Z - 0.28);  // just behind the bars
scene.add(grassBg);

// soft green light bleeding through from outside
var grassLight = new THREE.PointLight(0x33ff55, 5, 20);
grassLight.position.set(EXIT_X, 1.6, EXIT_Z - 2);
scene.add(grassLight);

// gate collision — blocks until open
var gateBox = new THREE.Box3(
  new THREE.Vector3(EXIT_X - TILE + 0.1, 0, EXIT_Z - 0.45),
  new THREE.Vector3(EXIT_X + TILE - 0.1, 3.8, EXIT_Z + 0.45)
);
collidables.push(gateBox);
var gateOpen = false;

function openGate() {
  if (gateOpen) return;
  gateOpen = true;
  // remove wall collision
  var idx = collidables.indexOf(gateBox);
  if (idx !== -1) collidables.splice(idx, 1);
  // bars vanish instantly
  gateBars.forEach(function(b) { exitGate.remove(b); });
  // green floods in
  gateLight.color.setHex(0x44ff88);
  gateLight.intensity = 12;
  grassLight.intensity = 16;
  // message
  var msg = document.createElement('div');
  msg.style.cssText = 'position:fixed;top:38%;left:50%;transform:translateX(-50%);color:#44ff88;font-family:monospace;font-size:1rem;letter-spacing:6px;z-index:50;pointer-events:none;text-shadow:0 0 20px #44ff88';
  msg.textContent = 'THE EXIT IS OPEN — RUN';
  document.body.appendChild(msg);
  setTimeout(function(){ msg.remove(); }, 3000);
}

// ── Normies ───────────────────────────────────────────────────────────────
var normieBodyMat = new THREE.MeshLambertMaterial({ color:0xffe066, emissive:0xcc8800 });
var normieEyeMat  = new THREE.MeshBasicMaterial({ color:0x000000 });
var normieGlowMat = new THREE.MeshBasicMaterial({ color:0xffee88 });

var normieLoader = new THREE.TextureLoader();
normieLoader.crossOrigin = 'anonymous';

function makeNormie(x, z, isMimic, tokenId) {
  var group = new THREE.Object3D();

  // card — Normie face on both sides, no frame
  var faceMat;
  if (tokenId !== undefined) {
    var tex = normieLoader.load('https://api.normies.art/normie/' + tokenId + '/image.png');
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    faceMat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide });
  } else {
    faceMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
  }
  var card = new THREE.Mesh(new THREE.PlaneGeometry(0.75, 0.75), faceMat);
  group.add(card);

  // soft white glow halo behind card
  var halMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.12, side: THREE.DoubleSide });
  var halo = new THREE.Mesh(new THREE.PlaneGeometry(1.05, 1.05), halMat);
  halo.position.z = -0.01;
  group.add(halo);

  // ethereal glow light — white for real, red for mimic
  var nLight = new THREE.PointLight(isMimic ? 0xff2200 : 0xffffff, 5, 9);
  group.add(nLight);

  group.position.set(x, 1.3, z);
  scene.add(group);
  fragments.push({ group:group, x:x, z:z, t:Math.random()*Math.PI*2, collected:false, isMimic:!!isMimic, light:nLight, tokenId:tokenId });
}

makeNormie(4*TILE,  2*TILE,  false, 42);    // top-left room
makeNormie(34*TILE, 2*TILE,  false, 7438);  // top-center (has hat)
makeNormie(68*TILE, 4*TILE,  false, 4908);  // top-right room
makeNormie(5*TILE,  12*TILE, false, 1337);  // left section mid
makeNormie(34*TILE, 13*TILE, false, 3081);  // mid section lower (bowler hat)
makeNormie(65*TILE, 11*TILE, false, 777);   // right section
makeNormie(34*TILE, 7*TILE,  true,  9987);  // MIMIC — looks like a real Normie

function updateFragments(dt) {
  var px = camera.position.x, pz = camera.position.z;
  fragments.forEach(function(f) {
    if (f.collected) return;
    f.t += dt * 2;
    f.group.rotation.y = f.t;
    f.group.position.y = 1.2 + Math.sin(f.t * 0.8) * 0.2;
    var dx = f.x - px, dz = f.z - pz;
    if (dx*dx + dz*dz < 1.5) collectFragment(f);
  });
  // check exit reached
  if (gateOpen) {
    var exdx = EXIT_X - px, exdz = EXIT_Z - pz;
    if (exdx*exdx + exdz*exdz < (TILE*1.5)*(TILE*1.5)) showWin();
  }
}

function collectFragment(f) {
  f.collected = true;
  scene.remove(f.group);

  if (f.isMimic) {
    sfx.mimicAlert();
    document.body.style.background = '#550000';
    setTimeout(function(){ document.body.style.background = '#000'; }, 200);
    var msg = document.createElement('div');
    msg.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);color:#ff2222;font-family:monospace;font-size:1.6rem;letter-spacing:6px;z-index:50;pointer-events:none;text-shadow:0 0 20px #ff0000';
    msg.textContent = 'IT WAS A TRAP';
    document.body.appendChild(msg);
    setTimeout(function(){ msg.remove(); }, 2200);
    // wraith teleports close and gets a speed spike
    wraith.x = camera.position.x + (Math.random()-0.5)*10;
    wraith.z = camera.position.z + (Math.random()-0.5)*10;
    wraith.speed += 1.2;
    return;
  }

  fragmentsCollected++;
  sfx.pickup();
  document.body.style.background = '#e8c96d';
  setTimeout(function(){ document.body.style.background = '#000'; }, 100);
  wraith.speed = 4.2 + fragmentsCollected * 0.22;
  document.getElementById('frag-count').textContent = fragmentsCollected + ' / ' + TOTAL_FRAGMENTS;
  if (fragmentsCollected >= TOTAL_FRAGMENTS) openGate();
}

function saveToLeaderboard(name, timeStr, seconds) {
  var lb = JSON.parse(localStorage.getItem('normie_hunt_lb') || '[]');
  var today = new Date();
  var dateStr = (today.getMonth()+1)+'/'+today.getDate()+'/'+String(today.getFullYear()).slice(2);
  lb.push({ name: name, wallet: walletAddress, timeStr: timeStr, seconds: seconds, date: dateStr });
  lb.sort(function(a,b){ return a.seconds - b.seconds; });
  lb = lb.slice(0, 20);
  localStorage.setItem('normie_hunt_lb', JSON.stringify(lb));
}

function showLeaderboard() {
  var lb = JSON.parse(localStorage.getItem('normie_hunt_lb') || '[]');
  var tbody = document.getElementById('lb-body');
  tbody.innerHTML = '';
  if (lb.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" style="color:#444;text-align:center;padding:20px;letter-spacing:2px;">NO ENTRIES YET</td></tr>';
  } else {
    lb.forEach(function(e, i) {
      var shortW = e.wallet ? e.wallet.slice(0,6)+'..'+e.wallet.slice(-3) : '—';
      var tr = document.createElement('tr');
      tr.innerHTML = '<td>'+(i+1)+'</td><td>'+e.name+'</td><td style="color:#556644;font-size:0.7rem">'+shortW.toUpperCase()+'</td><td>'+e.timeStr+'</td><td>'+e.date+'</td>';
      tbody.appendChild(tr);
    });
  }
  document.getElementById('lb-overlay').style.display = 'flex';
}

function showWin() {
  isDead = true;
  timerRunning = false;
  document.exitPointerLock();
  var m = Math.floor(elapsed/60), s = Math.floor(elapsed%60);
  var timeStr = (m<10?'0':'')+m+':'+(s<10?'0':'')+s;

  saveToLeaderboard(playerName, timeStr, Math.floor(elapsed));

  // build gallery of collected normies
  var collectedTokens = fragments.filter(function(f){ return f.collected && !f.isMimic && f.tokenId !== undefined; });
  var galleryHtml = collectedTokens.map(function(f) {
    return '<img src="https://api.normies.art/normie/'+f.tokenId+'/image.png" '
      + 'style="width:52px;height:52px;image-rendering:pixelated;border:1px solid #443300;background:#111;" '
      + 'title="#'+f.tokenId+'" crossorigin="anonymous"/>';
  }).join('');

  var w = document.createElement('div');
  w.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.95);display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:99;gap:14px;font-family:monospace;';
  w.innerHTML = [
    '<h1 style="font-size:2.6rem;letter-spacing:8px;color:#e8c96d;text-shadow:0 0 30px #e8c96d">SOUL RESTORED</h1>',
    '<p style="color:#aaa;font-size:0.85rem;max-width:420px;text-align:center;line-height:1.8">You reassembled the Normie\'s soul fragments.<br>The dungeon releases its grip.</p>',
    '<p style="color:#e8c96d;letter-spacing:4px;font-size:1.1rem">TIME: '+timeStr+'</p>',
    '<div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;max-width:400px;margin:4px 0;">'+galleryHtml+'</div>',
    '<div style="display:flex;gap:12px;margin-top:8px;">',
    '<button onclick="showLeaderboard()" style="padding:10px 26px;background:transparent;border:1px solid #554422;color:#886633;font-family:monospace;font-size:0.8rem;letter-spacing:3px;cursor:pointer">LEADERBOARD</button>',
    '<button onclick="location.reload()" style="padding:10px 26px;background:transparent;border:1px solid #e8c96d;color:#e8c96d;font-family:monospace;font-size:0.8rem;letter-spacing:3px;cursor:pointer">HUNT AGAIN</button>',
    '</div>'
  ].join('');
  document.body.appendChild(w);
}

// ── Audio System ─────────────────────────────────────────────────────────
var sfx = (function() {
  var ctx = null, masterVol = null, wraithGainNode = null, footTimer = 0;

  function boot() {
    if (ctx) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    masterVol = ctx.createGain();
    masterVol.gain.value = 0.7;
    masterVol.connect(ctx.destination);
    _ambient();
    _wraithDrone();
    _music();
  }

  function _noise(dur, vol, fLow, fHigh) {
    var buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    var src = ctx.createBufferSource(); src.buffer = buf;
    var filt = ctx.createBiquadFilter();
    filt.type = 'bandpass';
    filt.frequency.value = (fLow + fHigh) / 2;
    filt.Q.value = 0.6;
    var g = ctx.createGain();
    g.gain.setValueAtTime(vol, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    src.connect(filt); filt.connect(g); g.connect(masterVol);
    src.start(); src.stop(ctx.currentTime + dur);
  }

  function _tone(freq, dur, vol, type) {
    var osc = ctx.createOscillator();
    osc.type = type || 'sine';
    osc.frequency.value = freq;
    var g = ctx.createGain();
    g.gain.setValueAtTime(vol, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    osc.connect(g); g.connect(masterVol);
    osc.start(); osc.stop(ctx.currentTime + dur);
  }

  function _ambient() {
    // deep dungeon drone
    var osc = ctx.createOscillator();
    osc.type = 'sawtooth'; osc.frequency.value = 38;
    var lfo = ctx.createOscillator(); lfo.frequency.value = 0.08;
    var lfoG = ctx.createGain(); lfoG.gain.value = 4;
    lfo.connect(lfoG); lfoG.connect(osc.frequency);
    var filt = ctx.createBiquadFilter(); filt.type = 'lowpass'; filt.frequency.value = 110;
    var g = ctx.createGain(); g.gain.value = 0.05;
    osc.connect(filt); filt.connect(g); g.connect(masterVol);
    osc.start(); lfo.start();
    // torch crackle loop
    var cbuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    var cd = cbuf.getChannelData(0);
    for (var i = 0; i < cd.length; i++) cd[i] = Math.random() * 2 - 1;
    var crackle = ctx.createBufferSource(); crackle.buffer = cbuf; crackle.loop = true;
    var cf = ctx.createBiquadFilter(); cf.type = 'bandpass'; cf.frequency.value = 900; cf.Q.value = 0.4;
    var cg = ctx.createGain(); cg.gain.value = 0.012;
    crackle.connect(cf); cf.connect(cg); cg.connect(masterVol);
    crackle.start();
  }

  function _music() {
    // A natural minor scale — dark dungeon melody
    var scale = [110, 123.5, 130.8, 146.8, 164.8, 174.6, 196, 220, 246.9, 261.6];
    // bass pulse pattern (root + fifth alternating)
    var bassNotes = [55, 55, 82.4, 55, 55, 65.4, 55, 82.4];
    var BPM = 72, beat = 60 / BPM;
    var bassStep = 0;

    function playBass() {
      var osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = bassNotes[bassStep % bassNotes.length];
      bassStep++;
      var g = ctx.createGain();
      g.gain.setValueAtTime(0.18, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + beat * 0.85);
      var filt = ctx.createBiquadFilter(); filt.type = 'lowpass'; filt.frequency.value = 280;
      osc.connect(filt); filt.connect(g); g.connect(masterVol);
      osc.start(); osc.stop(ctx.currentTime + beat * 0.9);
      setTimeout(playBass, beat * 1000);
    }

    // eerie melody — plays every 2 beats, picks notes from scale
    var melStep = 0;
    var melPattern = [0, 3, 2, 5, 4, 3, 7, 5, 4, 2, 0, 4];
    function playMelody() {
      if (Math.random() < 0.3) { // occasional silence for tension
        setTimeout(playMelody, beat * 2000);
        return;
      }
      var freq = scale[melPattern[melStep % melPattern.length]];
      melStep++;
      var osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      var g = ctx.createGain();
      g.gain.setValueAtTime(0.09, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + beat * 1.8);
      // slight reverb via delay
      var delay = ctx.createDelay(); delay.delayTime.value = 0.22;
      var dg = ctx.createGain(); dg.gain.value = 0.28;
      osc.connect(g); g.connect(masterVol);
      osc.connect(delay); delay.connect(dg); dg.connect(masterVol);
      osc.start(); osc.stop(ctx.currentTime + beat * 2);
      setTimeout(playMelody, beat * 2000);
    }

    // low percussion hit — every 4 beats
    function playKick() {
      var osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(120, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(28, ctx.currentTime + 0.22);
      var g = ctx.createGain();
      g.gain.setValueAtTime(0.4, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
      osc.connect(g); g.connect(masterVol);
      osc.start(); osc.stop(ctx.currentTime + 0.4);
      setTimeout(playKick, beat * 4000);
    }

    setTimeout(playBass, 800);
    setTimeout(playMelody, 1600);
    setTimeout(playKick, 2400);
  }

  function _wraithDrone() {
    var osc = ctx.createOscillator();
    osc.type = 'sawtooth'; osc.frequency.value = 52;
    var lfo = ctx.createOscillator(); lfo.frequency.value = 0.5;
    var lfoG = ctx.createGain(); lfoG.gain.value = 10;
    lfo.connect(lfoG); lfoG.connect(osc.frequency);
    var dist = ctx.createWaveShaper();
    var curve = new Float32Array(256);
    for (var i = 0; i < 256; i++) {
      var x = (i * 2) / 256 - 1;
      curve[i] = (Math.PI + 100) * x / (Math.PI + 100 * Math.abs(x));
    }
    dist.curve = curve;
    var g = ctx.createGain(); g.gain.value = 0;
    osc.connect(dist); dist.connect(g); g.connect(masterVol);
    osc.start(); lfo.start();
    wraithGainNode = g;
  }

  function footstep() {
    _noise(0.09, 0.45, 90, 320);
    _noise(0.03, 0.12, 1400, 3200);
  }

  function pickup() {
    [523, 659, 784, 1047].forEach(function(f, i) {
      setTimeout(function() { _tone(f, 0.45, 0.18); }, i * 75);
    });
  }

  function mimicAlert() {
    [220, 180, 150].forEach(function(f, i) {
      setTimeout(function() { _tone(f, 0.5, 0.35, 'sawtooth'); }, i * 55);
    });
    _noise(0.5, 0.5, 80, 600);
  }

  function damage() {
    _noise(0.14, 0.8, 120, 900);
    _tone(100, 0.18, 0.35, 'sawtooth');
  }

  function wraithProximity(p) { // 0..1
    if (wraithGainNode) wraithGainNode.gain.value = p * 0.14;
  }

  function tick(dt, moving) {
    if (!ctx) return;
    if (moving) {
      footTimer -= dt;
      if (footTimer <= 0) { footstep(); footTimer = 0.36; }
    } else {
      footTimer = 0;
    }
  }

  return { boot: boot, pickup: pickup, mimicAlert: mimicAlert, damage: damage, wraithProximity: wraithProximity, tick: tick };
})();

// ── Darkness Zones (fog thickens inside these rooms) ─────────────────────
var DARK_ZONES = [
  { c1:59, r1:10, c2:78, r2:19 },  // Right section lower rooms
  { c1:20, r1:17, c2:47, r2:23 },  // Bottom corridor area
];
var currentFogDensity = 0.07;
var targetFogDensity  = 0.07;

function updateDarkness() {
  var col = Math.floor(camera.position.x / TILE);
  var row = Math.floor(camera.position.z / TILE);
  var inDark = false;
  for (var i = 0; i < DARK_ZONES.length; i++) {
    var z = DARK_ZONES[i];
    if (col >= z.c1 && col <= z.c2 && row >= z.r1 && row <= z.r2) { inDark = true; break; }
  }
  targetFogDensity = inDark ? 0.28 : 0.07;
  currentFogDensity += (targetFogDensity - currentFogDensity) * 0.04;
  scene.fog.density = currentFogDensity;
}


// ── Compass ─────────────────────────────────────────────────────────────────
var compassEl  = document.getElementById('compass');
var compassDir = document.getElementById('compass-dir');
var DIRS = ['N','NE','E','SE','S','SW','W','NW'];

function updateCompass() {
  // yaw=0 → facing -Z → North
  var angle = ((yaw % (Math.PI*2)) + Math.PI*2) % (Math.PI*2); // 0..2π
  var idx = Math.round(angle / (Math.PI/4)) % 8;
  compassDir.textContent = DIRS[idx];
}


// ── Timer ──────────────────────────────────────────────────────────────────
var elapsed=0, timerRunning=false;
function updateTimer(dt) {
  if (!timerRunning) return;
  elapsed += dt;
  var m = Math.floor(elapsed/60), s = Math.floor(elapsed%60);
  document.getElementById('timer').textContent =
    (m<10?'0':'')+m+':'+(s<10?'0':'')+s;
}

// ── Game loop ──────────────────────────────────────────────────────────────
var clock = new THREE.Clock();
var frameCount = 0;

function animate() {
  requestAnimationFrame(animate);
  var dt = Math.min(clock.getDelta(), 0.05);

  // movement
  var prev = camera.position.clone();
  var fwd    = (keys['KeyW']||keys['ArrowUp']    ?1:0)-(keys['KeyS']||keys['ArrowDown'] ?1:0);
  var strafe = (keys['KeyD']||keys['ArrowRight'] ?1:0)-(keys['KeyA']||keys['ArrowLeft'] ?1:0);

  camera.position.x += (-Math.sin(yaw)*fwd + Math.cos(yaw)*strafe) * SPEED * dt;
  camera.position.z += (-Math.cos(yaw)*fwd - Math.sin(yaw)*strafe) * SPEED * dt;
  camera.position.y  = 1.65;

  if (collides(camera.position)) camera.position.copy(prev);

  // flashlight follows camera look direction
  flashlight.position.copy(camera.position);
  var fl = new THREE.Vector3(0, 0, -1).applyEuler(camera.rotation);
  flashlightTarget.position.copy(camera.position).addScaledVector(fl, 10);
  playerFill.position.copy(camera.position);

  var isMoving = (fwd !== 0 || strafe !== 0);
  sfx.tick(dt, isMoving && !isDead);

  if (invincible > 0) invincible -= dt;
  if (!isDead) updateObstacles(dt);
  if (!isDead) updateBears(dt);
  if (!isDead) updateFragments(dt);
  if (!isDead) updateWraith(dt);
  if (!isDead) updateDarkness();
  if (!isDead) updateZone();
  updateCompass();

  // torch flicker — only update lights within 14 units of player
  var px = camera.position.x, pz = camera.position.z;
  torchLights.forEach(function(t) {
    var dx = t.ox - px, dz = t.oz - pz;
    var dist = dx*dx + dz*dz;
    var near = dist < 196; // 14^2
    t.light.visible = near;
    if (!near) return;

    t.t += dt * 3;
    var flicker = t.base + Math.sin(t.t*9)*2.0 + Math.sin(t.t*14)*0.8;
    t.light.intensity = Math.max(1.5, flicker);
    // billboard — always face camera
    t.flame.lookAt(camera.position);
    t.flame2.lookAt(camera.position);
    t.flame2.rotateY(Math.PI/2);
    // scale pulse to simulate flickering
    var pulse = 1 + Math.sin(t.t*6)*0.07;
    t.flame.scale.set(pulse, pulse + Math.sin(t.t*4)*0.05, pulse);
    t.flame2.scale.copy(t.flame.scale);
    var sway = Math.sin(t.t*3)*0.012;
    t.flame.position.set(t.ox+sway, t.oy, t.oz+sway);
  });

  frameCount++;
  updateTimer(dt);
  renderer.render(scene, camera);
}

window.addEventListener('resize', function() {
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(Math.floor(window.innerWidth/PIXEL_SCALE), Math.floor(window.innerHeight/PIXEL_SCALE));
  renderer.domElement.style.width  = window.innerWidth  + 'px';
  renderer.domElement.style.height = window.innerHeight + 'px';
});

animate();
