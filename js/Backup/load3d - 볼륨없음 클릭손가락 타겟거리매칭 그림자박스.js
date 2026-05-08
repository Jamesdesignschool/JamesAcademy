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

// --- 기본 설정 및 변수 ---
let mixers = [];
const clock = new THREE.Clock();
const scene = new THREE.Scene();

// 👈 1. [변경] 클릭 전용 검사 배열 (성능 최적화용)
let clickableObjects = []; 

// 👈 2. [신규 핵심] 3ds Max 오브젝트 이름과 HTML URL 매핑 테이블
// 3ds Max에서 지은 이름과 매핑될 URL을 여기에 정의합니다.
// 3D 파일을 수정하지 않고도 여기서 URL을 쉽게 바꿀 수 있습니다.
const linkMapping = {
    'Link_RandD': './RandD.html',         // 3ds Max 이름 : URL
    'Link_Editorial5': './Editorial.html',  // 3ds Max 이름 : URL
    // 추가 링크는 여기에 고대로 넣으세요
};


//--                                                            배경 색상 설정
scene.background = new THREE.Color(0xffffff);

//--                                                                    Bitmap 배경 설정
scene.background = null; 
new THREE.TextureLoader().load('./2d/Background.jpg', (texture) => {
    scene.background = texture;
});

//--    렌더링 거리 설정
const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.set(3, 0.5, 8);

//--                                                               렌더러(Renderer)
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

//--                                                              조명/바닥/컨트롤 설정
const ambientLight = new THREE.AmbientLight(0xffd200, 0.5); 
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 4.5);
dirLight.position.set(8, 11, 7);
dirLight.castShadow = true;

dirLight.shadow.camera.top = 6;
dirLight.shadow.camera.bottom = -10;                            // << -- 이걸 수정하면 그림자 표현이 안되는 부분이 나타남
dirLight.shadow.camera.left = -5;                              // << -- 이걸 수정하면 그림자 표현이 안되는 부분이 나타남
dirLight.shadow.camera.right = 24;                              // << -- 이걸 수정하면 그림자 표현이 안되는 부분이 나타남

// 그림자가 잘리지 않도록 카메라의 시작/끝 지점도 넉넉하게 설정
dirLight.shadow.camera.near = 0.1;
dirLight.shadow.camera.far = 20;

// 그림자 경계 부드럽게 (옵션)
dirLight.shadow.radius = 2;

dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;

// 코드 하단에 잠시 추가해서 확인해보세요
// const helper = new THREE.CameraHelper(dirLight.shadow.camera);
// scene.add(helper);

scene.add(dirLight);

//--                                                            컨트롤 설정 --- 타겟 거리 카메라와 매칭 고정임
// 1. 컨트롤 설정
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enableZoom = false; // 중요: 기본 줌을 꺼야 커스텀 휠 로직과 충돌 안 함
controls.target.set(1, 1, 0); // 사용자가 원하는 초기 타겟 고정

// 2. 휠 이벤트 로직 (카메라 이동분만큼 타겟에 오프셋 부여)
window.addEventListener('wheel', (event) => {
    // 카메라가 바라보는 방향 벡터 계산
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);

    // 이동 거리 계산 (마우스 휠 방향에 따라 + / -)
    // event.deltaY가 양수면 뒤로(줌 아웃), 음수면 앞으로(줌 인)
    const moveDistance = event.deltaY * -0.005; // 0.005는 속도 조절값

    // 이동할 벡터 (방향 * 거리)
    const moveVector = direction.multiplyScalar(moveDistance);

    // [핵심] 카메라가 움직인 만큼 타겟도 똑같이 더해줌 (오프셋 동기화)
    camera.position.add(moveVector);
    controls.target.add(moveVector);
    
}, { passive: false });

// --- 로딩 UI ---
const loadingOverlay = document.createElement('div');
loadingOverlay.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:white; display:flex; justify-content:center; align-items:center; z-index:10000; transition:opacity 0.4s ease;";
const loadingText = document.createElement('div');
loadingText.style.cssText = "font-size:20px; color:#333;";
loadingOverlay.appendChild(loadingText);
document.body.appendChild(loadingOverlay);


//--                                                            [수정] 순차 로딩 로직 ---
const loader = new GLTFLoader();
const modelsToLoad = [
    { name: '메인 모델', path: './3d/main.glb', position: [0, 0, 0] },
    { name: 'VR AR Holo', path: './3d/vr_ar_hologram.glb', position: [3, 0, -3] },
    { name: '빡스', path: './3d/game_engine.glb', position: [6, 0, -6] },
    { name: 'editorial', path: './3d/editorial.glb', position: [9, 0, -9] },
    { name: 'character', path: './3d/character.glb', position: [12, 0, -12] },
    { name: 'character', path: './3d/interior.glb', position: [7, 0, 0] },
    { name: 'character', path: './3d/film.glb', position: [12, 0, 0] },
];

function loadModel(item) {
    return new Promise((resolve, reject) => {
        loader.load(
            item.path,
            (gltf) => {
                const model = gltf.scene;
                model.position.set(...item.position);

                // 전수조사 및 설정
                model.traverse((node) => {
                    if (node.isMesh) {
                        // 그림자 설정 (기존 유지)
                        const rawData = JSON.stringify(node.userData).toLowerCase();
                        const hasNoShadow = node.name.toLowerCase().includes("noshadow") || rawData.includes("noshadow");
                        node.castShadow = !hasNoShadow;
                        node.receiveShadow = !hasNoShadow;

                        // 👈 3. [변경] 3ds Max 이름을 기반으로 클릭 오브젝트 식별
                        // 매핑 테이블(linkMapping)에 존재하는 이름인지 확인합니다.
                        if (linkMapping[node.name]) {
                            console.log(`[클릭 가능 발견] 오브젝트: ${node.name}, 매핑 URL: ${linkMapping[node.name]}`);
                            
                            // 클릭 전용 검사 배열에 추가 (성능 최적화)
                            clickableObjects.push(node);
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

// 순차 실행
async function loadAllModels() {
    try {
        for (const item of modelsToLoad) { await loadModel(item); }
        loadingOverlay.style.opacity = '0';
        setTimeout(() => loadingOverlay.remove(), 400);
    } catch (error) { loadingText.textContent = "로딩 실패"; }
}
loadAllModels();


// --- Raycaster 및 마우스 UX/클릭 설정 ---
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// OrbitControls 회전과 클릭 구분을 위한 로직 (기존 유지)
let mouseMoved = false; 
renderer.domElement.addEventListener('mousedown', () => { mouseMoved = false; });
renderer.domElement.addEventListener('mousemove', (event) => {
    mouseMoved = true; 
    // 호버 UX용 좌표 업데이트
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
});

renderer.domElement.addEventListener('mouseup', (event) => {
    if (mouseMoved) return; 

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    // 👈 4. [변경] scene 전체 대신 clickableObjects 배열만 검사 (성능 최적화)
    const intersects = raycaster.intersectObjects(clickableObjects, false);

    if (intersects.length > 0) {
        // 가장 먼저 맞은 오브젝트
        const clickedObject = intersects[0].object;

        // 👈 5. [변경] 매핑 테이블에서 클릭된 오브젝트 이름으로 URL을 가져와서 열기
        const urlToOpen = linkMapping[clickedObject.name];
        
        if (urlToOpen) {
            console.log(`${clickedObject.name} 클릭됨, URL 열기: ${urlToOpen}`);

            // 예시: iframe 팝업 함수 호출
            openHtmlPopup(urlToOpen);
          
            // 또는 새 탭으로 열기:
            // window.open(urlToOpen, '_blank');
        }
    }
});


//--                                                    HTML 팝업(iframe) 함수 (기존 유지)
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


// --- 루프 및 리사이즈 ---
function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    mixers.forEach(m => m.update(delta));
    controls.update();
    if (camera.position.y < 0.05) camera.position.y = 0.05;
    

    // 👈 6. [변경] 마우스 호버 UX (pointer 커서) 대상 변경
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(clickableObjects, false);
    if (intersects.length > 0) {
        document.body.style.cursor = 'pointer'; 
    } else {
        document.body.style.cursor = 'default';
    }

    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});