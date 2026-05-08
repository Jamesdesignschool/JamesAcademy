

//--                                   HTML - Import
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';


//--  E1 set 환경맵과 그라운드
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { GroundProjectedSkybox } from 'three/addons/objects/GroundProjectedSkybox.js';





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
    'Link_main': './main.html',  // 3ds Max 이름 : URL

    'Link_vr_ar':           './vr_ar.html',
    'Link_Editorial5':      './editorial.html',
    'Link_game_engine':     './game_engine.html',
    'Link_character':       './character.html',
    'Link_interior':        './interior.html',
    'Link_film':            './film.html',




    // 추가 링크는 여기에 고대로 넣으세요
};



//--                                                          E1  환경맵(HDR) 및 바닥 투영 설정 ---
// const rgbeLoader = new RGBELoader();
// rgbeLoader.load('./reflection/rogland_clear_night_1k.hdr', (texture) => {
//     texture.mapping = THREE.EquirectangularReflectionMapping;

//     // 1. 씬 전체의 환경광 및 배경으로 설정
//     scene.background = texture;
//     scene.environment = texture;

//     // 2. 환경맵을 바닥으로 사용 (Ground Projected Skybox)
//     const skybox = new GroundProjectedSkybox(texture);
//     skybox.scale.setScalar(1000); // 환경맵의 크기 (공간에 맞춰 조절)
//     skybox.radius = 1000;          // 투영될 바닥의 곡률/반지름
//     skybox.height = 12;           // 카메라 높이에 따른 바닥 위치 조절
//     scene.add(skybox);


    
//     // [참고] 배경 밝기 조절이 필요한 경우
//     scene.backgroundIntensity = 0.1; 
//     scene.environmentIntensity = 0.1;
// }); // E1의 끝


//--                                                            배경 색상 설정
scene.background = new THREE.Color(0x869091);

//--                                                                    Bitmap 배경 설정
// scene.background = null; 
// new THREE.TextureLoader().load('./2d/Background.jpg', (texture) => {
//     scene.background = texture;

// // 👈 배경 밝기 조절 (기본값: 1.0)
//     // 0.5는 절반 밝기, 0.2는 매우 어둡게 설정됩니다.
//     scene.backgroundIntensity = 1.0;

// });

//--    렌더링 거리 설정
const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.set(0, 1.8, 8);

//--                                                               렌더러(Renderer)
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// renderer.toneMapping = THREE.ACESFilmicToneMapping; // 또는 THREE.ReinhardToneMapping
// renderer.toneMappingExposure = 0.5 ; // 전체적인 노출값 조절 (이걸로도 밝기 조절 가능)

document.body.appendChild(renderer.domElement);

//--                                                              조명/바닥/컨트롤 설정
const ambientLight = new THREE.AmbientLight(0x869091, 3.1); 
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 4.001);
dirLight.position.set(8, 11, 7);
dirLight.castShadow = true;

dirLight.shadow.camera.top = 26;
dirLight.shadow.camera.bottom = -2;                            // << -- 이걸 수정하면 그림자 표현이 안되는 부분이 나타남
dirLight.shadow.camera.left = -5;                              // << -- 이걸 수정하면 그림자 표현이 안되는 부분이 나타남
dirLight.shadow.camera.right = 34;                              // << -- 이걸 수정하면 그림자 표현이 안되는 부분이 나타남

// 그림자가 잘리지 않도록 카메라의 시작/끝 지점도 넉넉하게 설정
dirLight.shadow.camera.near = 0.1;
dirLight.shadow.camera.far = 50;

// 그림자 경계 부드럽게 (옵션)
dirLight.shadow.radius = 2;

dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;

// 코드 하단에 잠시 추가해서 확인해보세요
// const helper = new THREE.CameraHelper(dirLight.shadow.camera);
// scene.add(helper);

scene.add(dirLight);


//--                                                그림자 매트

// 1. 바닥 기하학 생성 (크기는 모델에 맞춰 조절)
const floorGeometry = new THREE.PlaneGeometry(100, 100);
// 2. 쉐도우 매트 재질 생성
const floorMaterial = new THREE.ShadowMaterial();
floorMaterial.opacity = 0.3; // 그림자의 진하기 조절 (0.0 ~ 1.0)
// 3. 메쉬 생성 및 배치
const floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
floorMesh.rotation.x = -Math.PI / 2; // 바닥이므로 90도 눕힘
floorMesh.position.y = 0; // 모델의 발바닥 위치에 맞춤
// 4. 그림자를 받을 수 있도록 설정
floorMesh.receiveShadow = true;

scene.add(floorMesh);


//--                                                            컨트롤 설정 --- 타겟 거리 카메라와 매칭 고정임
// 1. 컨트롤 설정
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enableZoom = false; // 중요: 기본 줌을 꺼야 커스텀 휠 로직과 충돌 안 함
controls.target.set(0, 0.9, 2); //-- 사용자가 원하는 초기 타겟 고정

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



//--                                                            [수정] 순차 로딩 로직 ---
const loader = new GLTFLoader();
const modelsToLoad = [
    // { name: 'BG', path: './3d/bg.glb', position: [0, 0, 0] },

    { name: 'intro', path: './3d/intro.glb', position:                   [0, 0, 0] },

    { name: 'main', path: './3d/main.glb', position:                     [0, 0, 0] },
    { name: 'plate', path: './3d/plate.glb', position:                   [0, 0, 0] },

    { name: 'VR AR Holo', path: './3d/vr_ar_hologram.glb', position:     [0, 0, -5] },
    { name: 'plate', path: './3d/plate.glb', position:                   [0, 0, -5] },

    { name: 'game engine', path: './3d/game_engine.glb', position:       [0, 0, -10] },
    { name: 'plate', path: './3d/plate.glb', position:                   [0, 0, -10] },
    
    { name: 'editorial', path: './3d/editorial.glb', position:           [0, 0, -15] },
    { name: 'plate', path: './3d/plate.glb', position:                   [0, 0, -15] },

    { name: 'character', path: './3d/character.glb', position:           [0, 0, -20] },
    { name: 'plate', path: './3d/plate.glb', position:                   [0, 0, -20] },

    { name: 'interior', path: './3d/interior.glb', position:             [0, 0, -25] },
    { name: 'plate', path: './3d/plate.glb', position:                   [0, 0, -25] },

    // { name: 'film', path: './3d/film.glb', position:                     [0, 0, -30] },
    // { name: 'plate', path: './3d/plate.glb', position:                   [0, 0, -30] },

    { name: 'system', path: './3d/system.glb', position:                 [0, 0, -30] },
    { name: 'plate', path: './3d/plate.glb', position:                   [0, 0, -30] },

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

            (error) => reject(error)
        );
    });
}

// 순차 실행
async function loadAllModels() {
    let loadedCount = 0;
    const totalModels = modelsToLoad.length;

    // map을 사용하여 모든 프로미스를 동시에 시작합니다 (병렬 로딩)
    const loadPromises = modelsToLoad.map(async (item) => {
        try {
            await loadModel(item);
            loadedCount++;
            
            // 한 개라도 로드되면 로딩 메시지 업데이트
            loadingText.textContent = `진행 중... (${loadedCount}/${totalModels})`;
            
            // 첫 번째 모델이 로드되는 순간부터 화면에 보이기 시작합니다.
            // 만약 로딩창을 아예 빨리 치우고 싶다면 여기서 opacity를 조절할 수 있습니다.
            if (loadedCount === 1) {
                // 선택사항: 첫 모델 로드 시 로딩창 투명도를 낮춰 배경이 보이게 함
                loadingOverlay.style.background = "rgba(255,255,255,0.5)";
            }

        } catch (error) {
            console.error(`${item.name} 로드 실패:`, error);
        }
    });

    // 모든 모델 로딩이 완료될 때까지 기다림
    await Promise.all(loadPromises);

    // 전부 완료되면 로딩창 제거
    loadingOverlay.style.opacity = '0';
    setTimeout(() => loadingOverlay.remove(), 400);
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