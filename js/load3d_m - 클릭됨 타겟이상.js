//-- HTML - Import
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { GroundProjectedSkybox } from 'three/addons/objects/GroundProjectedSkybox.js';

// --- 기본 설정 및 변수 ---
let mixers = [];
const clock = new THREE.Clock();
const scene = new THREE.Scene();
let clickableObjects = []; 

const linkMapping = {
    'Link_main': './main.html',
    'Link_vr_ar': './vr_ar.html',
    'Link_Editorial5': './editorial.html',
    'Link_game_engine': './game_engine.html',
    'Link_character': './character.html',
    'Link_interior': './interior.html',
    'Link_film': './film.html',
    'Link_system': './system.html'
};

scene.background = new THREE.Color(0x869091);

const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.set(0, 1.8, 2);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // 성능 최적화
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// --- 컨트롤 설정 ---
const controls = new OrbitControls(camera, renderer.domElement);

controls.enableDamping = true;      
controls.dampingFactor = 0.05;      // [수정] 수치를 낮춰서 더 쫀득하고 부드럽게 (0.15 -> 0.05)

// 줌(두 손가락 벌리기) 설정
controls.enableZoom = true;         
controls.zoomSpeed = 2.0;           // [수정] 모바일 대응을 위해 속도 상향 (1.5 -> 2.0)

// 패닝(두 손가락 이동) 설정
controls.enablePan = true;          
controls.panSpeed = 1.2;            // [수정] 패닝이 너무 튀지 않게 적정값 조절
controls.screenSpacePanning = true; // [필수] 카메라 시점 기준으로 직관적 이동

// 거리 및 각도 제한 (이게 없으면 모델이 사라질 수 있음)
controls.minDistance = 1;           
controls.maxDistance = 100;         
controls.maxPolarAngle = Math.PI / 2; // 바닥 아래로 카메라가 못 내려가게 제한

controls.target.set(0, 0.9, 0.2);

// --- 조명 및 바닥 ---
const ambientLight = new THREE.AmbientLight(0x869091, 3.1); 
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 4.001);
dirLight.position.set(8, 11, 7);
dirLight.castShadow = true;
dirLight.shadow.camera.top = 26;
dirLight.shadow.camera.bottom = -2;
dirLight.shadow.camera.left = -5;
dirLight.shadow.camera.right = 34;
dirLight.shadow.camera.near = 0.1;
dirLight.shadow.camera.far = 50;
dirLight.shadow.mapSize.set(2048, 2048);
scene.add(dirLight);

const floorMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(100, 100),
    new THREE.ShadowMaterial({ opacity: 0.3 })
);
floorMesh.rotation.x = -Math.PI / 2;
floorMesh.receiveShadow = true;
scene.add(floorMesh);

// --- 모델 로딩 로직 ---
const loader = new GLTFLoader();
const modelsToLoad = [
    { name: 'intro', path: './3d/intro.glb', position:                  [0, 0, 0] },
    { name: 'main', path: './3d/main.glb', position:                    [0, 0, 0] },
    { name: 'plate', path: './3d/plate.glb', position:                  [0, 0, 0] },

    { name: 'VR AR Holo', path: './3d/vr_ar_hologram.glb', position:    [4, 0, 0] },
    { name: 'plate', path: './3d/plate.glb', position:                  [4, 0, 0] },
    
    { name: 'game engine', path: './3d/game_engine.glb', position:      [8, 0, 0] },
    { name: 'plate', path: './3d/plate.glb', position:                  [8, 0, 0] },
    
    { name: 'editorial', path: './3d/editorial.glb', position:          [12, 0, 0] },
    { name: 'plate', path: './3d/plate.glb', position:                  [12, 0, 0] },
    
    { name: 'character', path: './3d/character.glb', position:          [16, 0, 0] },
    { name: 'plate', path: './3d/plate.glb', position:                  [16, 0, 0] },
    
    { name: 'interior', path: './3d/interior.glb', position:            [20, 0, 0] },
    { name: 'plate', path: './3d/plate.glb', position:                  [20, 0, 0] },
    
    { name: 'system', path: './3d/system.glb', position:                [24, 0, 0] },
    { name: 'plate', path: './3d/plate.glb', position:                  [24, 0, 0] },
];

async function loadAllModels() {
    const loadPromises = modelsToLoad.map(item => {
        return new Promise((resolve) => {
            loader.load(item.path, (gltf) => {
                const model = gltf.scene;
                model.position.set(...item.position);
                model.traverse((node) => {
                    if (node.isMesh) {
                        node.castShadow = true;
                        node.receiveShadow = true;
                        // 매핑된 이름이거나 부모가 매핑된 이름인 경우 추가
                        if (linkMapping[node.name]) {
                            clickableObjects.push(node);
                        }
                    }
                });
                scene.add(model);
                if (gltf.animations.length > 0) {
                    const mixer = new THREE.AnimationMixer(model);
                    mixer.clipAction(gltf.animations[0]).play();
                    mixers.push(mixer);
                }
                resolve();
            });
        });
    });
    await Promise.all(loadPromises);
    console.log("모든 모델 로드 완료. 클릭 가능 오브젝트 수:", clickableObjects.length);
}
loadAllModels();

// --- [핵심] Raycaster 및 클릭/터치 통합 로직 ---
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let startX, startY;

const handleAction = (clientX, clientY) => {
    // 캔버스 상대 좌표 계산 (주소창 등 오차 방지)
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(clickableObjects, true);

    if (intersects.length > 0) {
        let target = intersects[0].object;
        let finalName = null;

        // 본인 및 부모 이름 체크
        if (linkMapping[target.name]) finalName = target.name;
        else {
            target.traverseAncestors(parent => {
                if (linkMapping[parent.name]) finalName = parent.name;
            });
        }

        if (finalName) {
            console.log("클릭 감지:", finalName);
            openHtmlPopup(linkMapping[finalName]);
        }
    }
};

// PC 및 모바일 공용 포인터 이벤트
renderer.domElement.addEventListener('pointerdown', (e) => {
    startX = e.clientX;
    startY = e.clientY;
}, { passive: true });

renderer.domElement.addEventListener('pointerup', (e) => {
    const diffX = Math.abs(e.clientX - startX);
    const diffY = Math.abs(e.clientY - startY);
    
    // 드래그(회전)하지 않고 가만히 탭했을 때만 실행 (오차 5px 허용)
    if (diffX < 5 && diffY < 5) {
        handleAction(e.clientX, e.clientY);
    }
});

// --- 팝업 및 기타 함수 ---
function openHtmlPopup(url) {
    const existing = document.getElementById('three-html-popup');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'three-html-popup';
    // 모바일 대응: container 너비를 90% 등으로 유연하게 설정
    overlay.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.7); z-index:99999; display:flex; justify-content:center; align-items:center;";
    
    const container = document.createElement('div');
    container.style.cssText = "width:90%; max-width:1280px; height:80%; background:white; border-radius:10px; position:relative; overflow:hidden;";

    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '✕';
    closeBtn.style.cssText = "position:absolute; top:15px; right:15px; background:white; border:none; font-size:25px; cursor:pointer; z-index:10; width:40px; height:40px; border-radius:50%; box-shadow:0 0 10px rgba(0,0,0,0.2);";
    closeBtn.onclick = () => overlay.remove();

    const iframe = document.createElement('iframe');
    iframe.src = url;
    iframe.style.cssText = "width:100%; height:100%; border:none;";

    container.appendChild(closeBtn);
    container.appendChild(iframe);
    overlay.appendChild(container);
    document.body.appendChild(overlay);
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
}

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    mixers.forEach(m => m.update(delta));
    controls.update();
    
    if (camera.position.y < 0.1) camera.position.y = 0.1;

    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});