//--                                Top 이미지 로드 중앙
(function () {
    const img = document.createElement("img");
    img.src = "./2d/top.png";
    img.style.cssText = "position:fixed; top:0px; left:50%; transform:translateX(-50%); width:700px; height:70px; opacity:1; z-index:9999; pointer-events:none; transition:opacity 0.3s ease;";
    document.body.appendChild(img);
})();

//--                                헬프 이미지 로드 중앙
(function () {
    const img = document.createElement("img");
    img.src = "./2d/help mouse.png";
    img.style.cssText = "position:fixed; bottom:20px; left:50%; transform:translateX(-50%); width:140px; height:64px; opacity:1; z-index:9999; pointer-events:none; transition:opacity 0.3s ease;";
    document.body.appendChild(img);
})();

//--                                   Import
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';




//-- 기본 변수
let mixers = [];
const clock = new THREE.Clock();
const scene = new THREE.Scene();
let clickableObjects = [];


//-- 링크 매핑 테이블
const linkMapping = {
    'Link_RandD': './RandD.html',
    'Link_Editorial5': './Editorial.html',
};

//-- Selective Bloom 레이어 설정
const BLOOM_LAYER = 1;
const bloomLayer = new THREE.Layers();
bloomLayer.set(BLOOM_LAYER);

//-- 배경
scene.background = null;
new THREE.TextureLoader().load('./2d/Background.jpg', (texture) => {
    scene.background = texture;
});


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

//-- Bloom 전용 Composer (Emissive 오브젝트만 렌더)
const bloomComposer = new EffectComposer(renderer);
bloomComposer.renderToScreen = false;
bloomComposer.addPass(new RenderPass(scene, camera));

const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.5,  // strength  — 빛 강도
    0.4,  // radius    — 번짐 반경
    0.0   // threshold — 레이어로 제어하므로 0으로
);
bloomComposer.addPass(bloomPass);

//-- 최종 합성 Composer
const finalComposer = new EffectComposer(renderer);
finalComposer.addPass(new RenderPass(scene, camera));

const mixPass = new ShaderPass(
    new THREE.ShaderMaterial({
        uniforms: {
            baseTexture: { value: null },
            bloomTexture: { value: bloomComposer.renderTarget2.texture }
        },
        vertexShader: `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform sampler2D baseTexture;
            uniform sampler2D bloomTexture;
            varying vec2 vUv;
            void main() {
                gl_FragColor = texture2D(baseTexture, vUv) + texture2D(bloomTexture, vUv);
            }
        `,
        defines: {}
    }),
    'baseTexture'
);
mixPass.needsSwap = true;
finalComposer.addPass(mixPass);
finalComposer.addPass(new OutputPass());

//-- 조명
const ambientLight = new THREE.AmbientLight(0xffd200, 0.5);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 4.5);
dirLight.position.set(15, 35, 17.5);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 4048;
dirLight.shadow.mapSize.height = 4048;
scene.add(dirLight);

//-- 컨트롤
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.target.set(1, 1, 0);
controls.minDistance = 0;
controls.maxDistance = Infinity;
controls.screenSpacePanning = true;

window.addEventListener('wheel', (event) => {
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    const moveStep = event.deltaY > 0 ? -1 : 1;
    const moveVector = direction.multiplyScalar(moveStep * 0.5);
    camera.position.add(moveVector);
    controls.target.add(moveVector);
}, { passive: false });

//-- 로딩 UI
const loadingOverlay = document.createElement('div');
loadingOverlay.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:white; display:flex; justify-content:center; align-items:center; z-index:10000; transition:opacity 0.4s ease;";
const loadingText = document.createElement('div');
loadingText.style.cssText = "font-size:20px; color:#333;";
loadingOverlay.appendChild(loadingText);
document.body.appendChild(loadingOverlay);

//-- 모델 목록
const loader = new GLTFLoader();
const modelsToLoad = [
    // { name: 'bg',   path: './3d/bg.glb',           position: [0,  0,  0]  },

    { name: '메인 모델',   path: './3d/main.glb',           position: [0,  0,  0]  },
    { name: 'VR AR Holo', path: './3d/vr_ar_hologram.glb', position: [3,  0, -3]  },
    { name: '빡스',        path: './3d/game_engine.glb',    position: [6,  0, -6]  },
    { name: 'editorial',  path: './3d/editorial.glb',       position: [9,  0, -9]  },
    { name: 'character',  path: './3d/character.glb',       position: [12, 0, -12] },
    { name: 'interior',   path: './3d/interior.glb',        position: [7,  0,  0]  },
    { name: 'film',       path: './3d/film.glb',            position: [12, 0,  0]  },
];

//-- Bloom 재질 처리용
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

//-- 모델 로드
function loadModel(item) {
    return new Promise((resolve, reject) => {
        loader.load(
            item.path,
            (gltf) => {
                const model = gltf.scene;
                model.position.set(...item.position);

                model.traverse((node) => {
                    if (node.isMesh) {
                        // 그림자 설정
                        const rawData = JSON.stringify(node.userData).toLowerCase();
                        const hasNoShadow = node.name.toLowerCase().includes("noshadow") || rawData.includes("noshadow");
                        node.castShadow = !hasNoShadow;
                        node.receiveShadow = !hasNoShadow;

                        // 클릭 오브젝트 등록
                        if (linkMapping[node.name]) {
                            console.log(`[클릭 가능] ${node.name} → ${linkMapping[node.name]}`);
                            clickableObjects.push(node);
                        }

                        // ★ Emissive 오브젝트 → Bloom 레이어 활성화
                        const mat = node.material;
                        if (mat && mat.emissive) {
                            const e = mat.emissive;
                            if ((e.r + e.g + e.b) > 0 && mat.emissiveIntensity > 0) {
                                node.layers.enable(BLOOM_LAYER);
                            }
                        }
                    }
                });

                scene.add(model);

                if (gltf.animations && gltf.animations.length > 0) {
                    const mixer = new THREE.AnimationMixer(model);
                    mixer.clipAction(gltf.animations[0]).play();
                    mixers.push(mixer);
                }
                resolve();
            },
            (xhr) => {
                if (xhr.lengthComputable) {
                    const percent = Math.round((xhr.loaded / xhr.total) * 100);
                    loadingText.textContent = `${item.name} 로딩 중... ${percent}%`;
                }
            },
            (error) => reject(error)
        );
    });
}

async function loadAllModels() {
    try {
        for (const item of modelsToLoad) { await loadModel(item); }
        loadingOverlay.style.opacity = '0';
        setTimeout(() => loadingOverlay.remove(), 400);
    } catch (error) {
        loadingText.textContent = "로딩 실패";
    }
}
loadAllModels();

//-- Raycaster / 마우스
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let mouseMoved = false;

renderer.domElement.addEventListener('mousedown', () => { mouseMoved = false; });
renderer.domElement.addEventListener('mousemove', (event) => {
    mouseMoved = true;
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
});

renderer.domElement.addEventListener('mouseup', (event) => {
    if (mouseMoved) return;
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(clickableObjects, false);

    if (intersects.length > 0) {
        const clickedObject = intersects[0].object;
        const urlToOpen = linkMapping[clickedObject.name];
        if (urlToOpen) {
            console.log(`${clickedObject.name} 클릭됨 → ${urlToOpen}`);
            openHtmlPopup(urlToOpen);
        }
    }
});

//-- iframe 팝업
function openHtmlPopup(url) {
    const existingPopup = document.getElementById('three-html-popup');
    if (existingPopup) existingPopup.remove();

    const overlay = document.createElement('div');
    overlay.id = 'three-html-popup';
    overlay.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:20000; display:flex; justify-content:center; align-items:center;";

    const container = document.createElement('div');
    container.style.cssText = "width:1280px; height:80%; background:white; border-radius:10px; position:relative; overflow:hidden; box-shadow:0 0 20px rgba(0,0,0,0.3);";

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✕';
    closeBtn.style.cssText = "position:absolute; top:10px; right:10px; background:none; border:none; font-size:20px; cursor:pointer; z-index:1;";
    closeBtn.onclick = () => overlay.remove();
    container.appendChild(closeBtn);

    const iframe = document.createElement('iframe');
    iframe.src = url;
    iframe.style.cssText = "width:100%; height:100%; border:none;";
    container.appendChild(iframe);

    overlay.appendChild(container);
    document.body.appendChild(overlay);
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
}

//-- 애니메이션 루프
function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    mixers.forEach(m => m.update(delta));
    controls.update();
    if (camera.position.y < 0.05) camera.position.y = 0.05;

    // 호버 커서
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(clickableObjects, false);
    document.body.style.cursor = intersects.length > 0 ? 'pointer' : 'default';

    // ★ Selective Bloom 렌더 순서
    darkenNonBloomed();           // 1. Emissive 아닌 것 → 검정
    bloomComposer.render();       // 2. Emissive만 Bloom 텍스처 생성
    restoreMaterials();           // 3. 원본 재질 복원
    finalComposer.render();       // 4. 전체 씬 + Bloom 합성 → 화면 출력
}
animate();

//-- 리사이즈
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    bloomComposer.setSize(window.innerWidth, window.innerHeight);
    finalComposer.setSize(window.innerWidth, window.innerHeight);
});