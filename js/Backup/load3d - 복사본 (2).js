//--                                Top 이미지 로드 중앙

(function () {
    const img = document.createElement("img");

    // 이미지 경로
    img.src = "./2d/top.png";

    // 스타일
    img.style.position = "fixed";
    img.style.top = "0px";
    img.style.left = "50%";
    img.style.transform = "translateX(-50%)";

    img.style.width = "700px"; // 필요하면 조절
    img.style.height = "70px";

    img.style.opacity = "1.6"; // 👈 여기서 투명도 조절 (0 ~ 1)

    img.style.zIndex = "9999";
    img.style.pointerEvents = "none"; // 클릭 방해 안함

    // 부드러운 등장
    img.style.transition = "opacity 0.3s ease";

    document.body.appendChild(img);
})();




//--                                헬프 이미지 로드 중앙

(function () {
    const img = document.createElement("img");

    // 이미지 경로
    img.src = "./2d/help mouse.png";

    // 스타일
    img.style.position = "fixed";
    img.style.bottom = "20px";
    img.style.left = "50%";
    img.style.transform = "translateX(-50%)";

    img.style.width = "140px"; // 필요하면 조절
    img.style.height = "64px";

    img.style.opacity = "1.6"; // 👈 여기서 투명도 조절 (0 ~ 1)

    img.style.zIndex = "9999";
    img.style.pointerEvents = "none"; // 클릭 방해 안함

    // 부드러운 등장
    img.style.transition = "opacity 0.3s ease";

    document.body.appendChild(img);
})();



import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// --- 기본 설정 및 변수 ---
let mixers = [];
const clock = new THREE.Clock();
const scene = new THREE.Scene();


//--                                                            배경 색상 설정
scene.background = new THREE.Color(0xffffff);


//--                                                            바닥(Floor) 블록을 아예 무력화 하면 바닥 자체가 없어짐
// const planeMesh = new THREE.Mesh(
//     new THREE.PlaneGeometry(100, 100), // << 바닥 크기 설정 (현재 회색)
//     new THREE.MeshStandardMaterial({ color: 0xffffff, depthWrite: true })                   // << -- 바닥 색상 설정 16진수 0x 다음 6자리를 바꿔야 함
// );
// planeMesh.rotation.x = -Math.PI / 2;
// planeMesh.receiveShadow = true;
// scene.add(planeMesh);



//--                                                                    Bitmap 배경 설정
scene.background = null; 

// 2. 텍스처 로더로 이미지를 입힙니다.
new THREE.TextureLoader().load('./2d/Background.jpg', (texture) => {
    scene.background = texture;
});


//--    렌더링 거리 어디까지 해줄껀지
const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 2000); // << 카메라 클리핑

camera.position.set(3, 0.5, 8);


// 렌더러(Renderer)
const renderer = new THREE.WebGLRenderer({ antialias: true });

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

//--                                                              조명/바닥/컨트롤 설정
const ambientLight = new THREE.AmbientLight(0xffd200, 0.5);     // << -- Environment 컬러 기본값 ffffff
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 4.5);
dirLight.position.set(15, 35, 17.5);
dirLight.castShadow = true;
dirLight.shadow.camera.top = 10;
dirLight.shadow.camera.bottom = -5;                            // << -- 이걸 수정하면 그림자 표현이 안되는 부분이 나타남
dirLight.shadow.camera.left = -7;                              // << -- 이걸 수정하면 그림자 표현이 안되는 부분이 나타남
dirLight.shadow.camera.right = 7;                              // << -- 이걸 수정하면 그림자 표현이 안되는 부분이 나타남
dirLight.shadow.mapSize.width = 4048;
dirLight.shadow.mapSize.height = 4048;
scene.add(dirLight);



//--                                            컨트롤 설정 ---
const controls = new OrbitControls(camera, renderer.domElement);

// 1. 부드러운 움직임 활성화
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// 2. 회전 중심 설정 (화면 중앙 기점)
// 기본적으로 (0, 0, 0)을 바라봅니다. 필요시 모델의 위치로 변경 가능합니다.
controls.target.set(1, 1, 0);           //-- 타겟 설정

// 3. 줌 거리 제한 해제 (무한히 멀어지거나 가까워질 수 있게 설정)
// PerspectiveCamera 환경에서는 zoom을 끄고 dolly를 사용하는 것이 일반적입니다.
controls.minDistance = 0;       // 최소 거리
controls.maxDistance = Infinity; // 최대 거리 (무한대)

// 4. [중요] 휠을 돌릴 때 카메라 자체가 이동하는 느낌을 주려면 
// OrbitControls의 기본 줌 동작을 사용하되, 타겟과 카메라가 같이 이동해야 합니다.
// 하지만 일반적인 '전진' 기능을 원하신다면 아래와 같이 속도를 높이거나 
// 'Screen Space Panning'을 활용할 수 있습니다.
controls.screenSpacePanning = true; // 평면 이동 시 화면 공간 기준 이동

// 만약 '줌'이 아니라 카메라가 실제로 앞으로 '달려가는(Move)' 기능을 원한다면
// 아래의 이벤트를 추가하여 휠 스크롤 시 타겟을 앞으로 밀어주는 로직을 넣을 수 있습니다.
window.addEventListener('wheel', (event) => {
    // 휠을 돌릴 때 카메라가 바라보는 방향 벡터를 구함
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);

    // 휠 방향에 따라 이동 강도 조절
    const moveStep = event.deltaY > 0 ? -1 : 1;
    const factor = 0.5; // 이동 속도

    // 카메라와 컨트롤 타겟을 동시에 이동시켜 '무한 전진' 구현
    const moveVector = direction.multiplyScalar(moveStep * factor);
    camera.position.add(moveVector);
    controls.target.add(moveVector);
}, { passive: false });
// --- 로딩 UI ---
const loadingOverlay = document.createElement('div');
// ... (스타일 설정은 기존과 동일하므로 생략)
const loadingText = document.createElement('div');
loadingOverlay.appendChild(loadingText);
document.body.appendChild(loadingOverlay);



//--                                                            [수정] 순차 로딩 로직 ---

const loader = new GLTFLoader();

// 1. 모델 리스트 정의
const modelsToLoad = [
    { name: '메인 모델', path: './3d/main.glb', position: [0, 0, 0] },
    { name: 'VR AR Holo', path: './3d/vr_ar_hologram.glb', position: [3, 0, -3] },
    { name: '빡스', path: './3d/game_engine.glb', position: [6, 0, -6] },
    { name: 'editorial', path: './3d/editorial.glb', position: [9, 0, -9] },
    { name: 'character', path: './3d/character.glb', position: [12, 0, -12] },

   
    // 추가 모델을 여기에 계속 넣으세요
    
];

// 2. 개별 로드를 Promise로 감싸는 함수
function loadModel(item) {
    return new Promise((resolve, reject) => {
        loader.load(
            item.path,
            (gltf) => {
                const model = gltf.scene;
                model.position.set(...item.position);

                // 그림자 설정 로직
                model.traverse((node) => {
                    if (node.isMesh) {

                        // 2. 카메라가 아주 가까이 가도 사라지지 않도록 컬링 비활성화 (핵심)
                        node.frustumCulled = false; // << (무리없으면 그냥 씀) 카메라 시야 계산에서 제외하여 항상 렌더링
                 
                        const rawData = JSON.stringify(node.userData).toLowerCase();
                        const hasNoShadow = node.name.toLowerCase().includes("noshadow") || rawData.includes("noshadow");
                        node.castShadow = !hasNoShadow;
                        node.receiveShadow = !hasNoShadow;
                    }
                });

                scene.add(model);

                // 애니메이션 설정
                if (gltf.animations && gltf.animations.length > 0) {
                    const mixer = new THREE.AnimationMixer(model);
                    mixer.clipAction(gltf.animations[0]).play();
                    mixers.push(mixer);
                }

                console.log(`${item.name} 로드 완료`);
                resolve(); // 성공 시 다음으로 넘어감
            },
            (xhr) => {
                // 개별 모델의 로딩 진행률 표시 (선택 사항)
                if (xhr.lengthComputable) {
                    const percent = Math.round((xhr.loaded / xhr.total) * 100);
                    loadingText.textContent = `${item.name} 로딩 중... ${percent}%`;
                }
            },
            (error) => reject(error)
        );
    });
}

// 3. 순차 실행 함수
async function loadAllModels() {
    try {
        for (const item of modelsToLoad) {
            await loadModel(item); // 현재 모델 로드가 끝날 때까지 대기
        }
        
        // 모든 로드가 끝난 후 처리
        console.log("모든 모델 로드 완료!");
        loadingOverlay.style.opacity = '0';
        setTimeout(() => loadingOverlay.remove(), 400);
        
    } catch (error) {
        console.error("모델 로딩 중 에러 발생:", error);
        loadingText.textContent = "로딩 실패";
    }
}

// 로딩 시작
loadAllModels();

// --- 루프 및 리사이즈 (기존과 동일) ---
function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    mixers.forEach(m => m.update(delta));
    controls.update();
    if (camera.position.y < 0.05) camera.position.y = 0.05;
    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});




