//-- Top 이미지 로드 중앙
(function () {
    const img = document.createElement("img");
    img.src = "./2d/top.png";
    img.style.cssText = "position:fixed; top:0px; left:50%; transform:translateX(-50%); width:700px; height:70px; opacity:1; z-index:9999; pointer-events:none; transition:opacity 0.3s ease;";
    document.body.appendChild(img);
})();

//-- 헬프 이미지 로드 중앙
(function () {
    const img = document.createElement("img");
    img.src = "./2d/help mouse.png";
    img.style.cssText = "position:fixed; bottom:20px; left:50%; transform:translateX(-50%); width:140px; height:64px; opacity:1; z-index:9999; pointer-events:none; transition:opacity 0.3s ease;";
    document.body.appendChild(img);
})();

//-- Import
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';

//-- 기본 변수
let mixers = [];
const clock = new THREE.Clock();
const scene = new THREE.Scene();
let clickableObjects = [];
let backgroundMesh = null;

const linkMapping = {
    'Link_RandD': './RandD.html',
    'Link_Editorial5': './Editorial.html',
};

//-- Selective Bloom 레이어
const BLOOM_LAYER = 1;
const bloomLayer = new THREE.Layers();
bloomLayer.set(BLOOM_LAYER);

//-- 카메라
const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.set(3, 0.5, 8);

//-- 렌더러
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

//-- 배경 이미지 로드
const textureLoader = new THREE.TextureLoader();
textureLoader.load('./2d/Background.jpg', (texture) => {
    const geometry = new THREE.PlaneGeometry(1, 1);
    const material = new THREE.MeshBasicMaterial({ map: texture, depthTest: false, depthWrite: false });
    backgroundMesh = new THREE.Mesh(geometry, material);
    backgroundMesh.renderOrder = -1000;
    scene.add(backgroundMesh);
});

//-- Bloom Composer
const bloomComposer = new EffectComposer(renderer);
bloomComposer.renderToScreen = false;
bloomComposer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.5, 0.4, 0.0);
bloomComposer.addPass(bloomPass);

//-- Final Composer
const finalComposer = new EffectComposer(renderer);
finalComposer.addPass(new RenderPass(scene, camera));

const mixPass = new ShaderPass(
    new THREE.ShaderMaterial({
        uniforms: {
            baseTexture: { value: null },
            bloomTexture: { value: bloomComposer.renderTarget2.texture }
        },
        vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: `uniform sampler2D baseTexture; uniform sampler2D bloomTexture; varying vec2 vUv; void main() { gl_FragColor = texture2D(baseTexture, vUv) + texture2D(bloomTexture, vUv); }`,
    }),
    'baseTexture'
);
finalComposer.addPass(mixPass);

const smaaPass = new SMAAPass(window.innerWidth * renderer.getPixelRatio(), window.innerHeight * renderer.getPixelRatio());
finalComposer.addPass(smaaPass);
finalComposer.addPass(new OutputPass());

//-- 조명
const ambientLight = new THREE.AmbientLight(0xffd200, 0.5);
scene.add(ambientLight);
const dirLight = new THREE.DirectionalLight(0xffffff, 4.5);
dirLight.position.set(10, 20, 12);
dirLight.castShadow = true;

dirLight.shadow.camera.top = 10;
dirLight.shadow.camera.bottom = -15;                            // << -- 이걸 수정하면 그림자 표현이 안되는 부분이 나타남
dirLight.shadow.camera.left = -7;                              // << -- 이걸 수정하면 그림자 표현이 안되는 부분이 나타남
dirLight.shadow.camera.right = 27;                              // << -- 이걸 수정하면 그림자 표현이 안되는 부분이 나타남

// 그림자가 잘리지 않도록 카메라의 시작/끝 지점도 넉넉하게 설정
dirLight.shadow.camera.near = 0.1;
dirLight.shadow.camera.far = 30;

dirLight.shadow.mapSize.width = 4048;
dirLight.shadow.mapSize.height = 4048;

// 그림자 경계 부드럽게 (옵션)
dirLight.shadow.radius = 2;

// 코드 하단에 잠시 추가해서 확인해보세요
const helper = new THREE.CameraHelper(dirLight.shadow.camera);
scene.add(helper);

scene.add(dirLight);

//-- 컨트롤
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
// 화면 중앙 회전을 위해 초기 타겟 설정
controls.target.set(1, 1, 0); 

// 타겟과 카메라 사이의 "고정 거리"를 정의합니다. (원하는 회전 반경)
const fixedDistance = 7.0;



renderer.domElement.addEventListener('wheel', (event) => {
    // 휠 방향 확인 (deltaY > 0 이면 뒤로, < 0 이면 앞으로)
    const moveStep = event.deltaY * 0.01; // 이동 감도 조절
    
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction); // 카메라가 바라보는 방향 벡터

    // 1. 카메라 위치 이동
    camera.position.addScaledVector(direction, -moveStep);
    
    // 2. 타겟 위치도 동일하게 이동 (거리 유지)
    controls.target.addScaledVector(direction, -moveStep);

    // 3. (선택 사항) 바닥 뚫기 방지
    if (camera.position.y < 0.05) {
        const diff = 0.05 - camera.position.y;
        camera.position.y = 0.05;
        controls.target.y += diff;
    }
}, { passive: true });

/**
 * 변경된 change 이벤트: 
 * 여기서는 타겟을 밀어내는 대신, 타겟이 항상 화면 중앙(카메라 앞)에 오도록 유지합니다.
 */
controls.addEventListener('change', () => {
    const currentDistance = camera.position.distanceTo(controls.target);
    
    // 타겟이 너무 가깝거나 멀어지지 않도록 고정 거리로 강제 조정
    // 이 작업이 있어야 "화면 중앙"을 기점으로 회전하게 됩니다.
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    
    // 타겟을 카메라 위치에서 정확히 fixedDistance만큼 떨어진 곳으로 재배치
    controls.target.copy(camera.position).addScaledVector(direction, fixedDistance);
});






//-- Bloom 처리용 재질 관리
const darkMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
const materialsMap = {};

function darkenNonBloomed() {
    scene.traverse((node) => {
        if (node.isMesh && !bloomLayer.test(node.layers)) {
            materialsMap[node.uuid] = node.material;
            node.material = darkMaterial;
        }
    });
}

function restoreMaterials() {
    scene.traverse((node) => {
        if (node.isMesh && materialsMap[node.uuid]) {
            node.material = materialsMap[node.uuid];
            delete materialsMap[node.uuid];
        }
    });
}

//-- 레이캐스터 및 마우스 변수
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let mouseMoved = false;

/**
 * 기능 2: 클릭 가능한 오브젝트 위에 있을 때 마우스 커서 모양 변경
 */
function updateCursor() {
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(clickableObjects, false);
    renderer.domElement.style.cursor = intersects.length > 0 ? 'pointer' : 'default';
}

//-- 모델 로딩
const loadingOverlay = document.createElement('div');
loadingOverlay.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:white; display:flex; justify-content:center; align-items:center; z-index:10000; transition:opacity 0.4s ease;";
const loadingText = document.createElement('div');
loadingText.style.cssText = "font-size:20px; color:#333;";
loadingOverlay.appendChild(loadingText);
document.body.appendChild(loadingOverlay);

const loader = new GLTFLoader();
const modelsToLoad = [
    { name: '메인 모델', path: './3d/main.glb', position: [0, 0, 0] },
    { name: 'VR AR Holo', path: './3d/vr_ar_hologram.glb', position: [3, 0, -3] },
    { name: '빡스', path: './3d/game_engine.glb', position: [6, 0, -6] },
    { name: 'editorial', path: './3d/editorial.glb', position: [9, 0, -9] },
    { name: 'character', path: './3d/character.glb', position: [12, 0, -12] },
    { name: 'interior', path: './3d/interior.glb', position: [7, 0, 0] },
    { name: 'film', path: './3d/film.glb', position: [12, 0, 0] },
];

async function loadAllModels() {
    for (const item of modelsToLoad) {
        await new Promise((resolve) => {
            loader.load(item.path, (gltf) => {
                const model = gltf.scene;
                model.position.set(...item.position);
                model.traverse((node) => {
                    if (node.isMesh) {
                        node.castShadow = node.receiveShadow = !node.name.toLowerCase().includes("noshadow");
                        if (linkMapping[node.name]) clickableObjects.push(node);
                        const mat = node.material;
                        if (mat && mat.emissive && (mat.emissive.r + mat.emissive.g + mat.emissive.b) > 0) node.layers.enable(BLOOM_LAYER);
                    }
                });
                scene.add(model);
                if (gltf.animations.length > 0) {
                    const mixer = new THREE.AnimationMixer(model);
                    mixer.clipAction(gltf.animations[0]).play();
                    mixers.push(mixer);
                }
                resolve();
            }, (xhr) => {
                if (xhr.lengthComputable) loadingText.textContent = `${item.name} 로딩 중... ${Math.round((xhr.loaded / xhr.total) * 100)}%`;
            });
        });
    }
    loadingOverlay.style.opacity = '0';
    setTimeout(() => loadingOverlay.remove(), 400);
}
loadAllModels();

//-- 애니메이션 루프
function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    mixers.forEach(m => m.update(delta));
    
    controls.update();
    updateCursor(); // 커서 상태 매 프레임 업데이트

    if (backgroundMesh) {
        backgroundMesh.position.copy(camera.position);
        backgroundMesh.quaternion.copy(camera.quaternion);
        backgroundMesh.translateZ(-100);
        const dist = 100;
        const vFOV = THREE.MathUtils.degToRad(camera.fov);
        const height = 2 * Math.tan(vFOV / 2) * dist;
        backgroundMesh.scale.set(height * camera.aspect, height, 1);
    }

    if (camera.position.y < 0.05) camera.position.y = 0.05;

    // Selective Bloom 렌더링
    darkenNonBloomed();
    bloomComposer.render();
    restoreMaterials();
    finalComposer.render();
}
animate();

//-- 이벤트 핸들러
window.addEventListener('resize', () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    bloomComposer.setSize(w, h);
    finalComposer.setSize(w, h);
    smaaPass.setSize(w * renderer.getPixelRatio(), h * renderer.getPixelRatio());
});

renderer.domElement.addEventListener('mousedown', () => { mouseMoved = false; });
renderer.domElement.addEventListener('mousemove', (e) => {
    mouseMoved = true;
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
});
renderer.domElement.addEventListener('mouseup', (e) => {
    if (mouseMoved) return;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(clickableObjects, false);
    if (intersects.length > 0) {
        const url = linkMapping[intersects[0].object.name];
        if (url) openHtmlPopup(url);
    }
});

function openHtmlPopup(url) {
    const overlay = document.createElement('div');
    overlay.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:20000; display:flex; justify-content:center; align-items:center;";
    overlay.innerHTML = `<div style="width:1280px; height:80%; background:white; border-radius:10px; position:relative; overflow:hidden;">
        <button style="position:absolute; top:10px; right:10px; background:none; border:none; font-size:20px; cursor:pointer; z-index:1;" onclick="this.parentElement.parentElement.remove()">✕</button>
        <iframe src="${url}" style="width:100%; height:100%; border:none;"></iframe>
    </div>`;
    document.body.appendChild(overlay);
}