// (function () {
//     const iframe = document.createElement("iframe");
//     iframe.src = "./top.html";
//     // pointer-events를 auto로 변경하여 클릭이 가능하게 만듭니다.
//     iframe.style.cssText = "position:fixed; top:0px; left:50%; transform:translateX(-50%); width:1000px; height:70px; opacity:1; z-index:9999; pointer-events:auto; transition:opacity 0.3s ease; border:none; background:transparent;";
//     iframe.setAttribute("frameborder", "0");
//     iframe.setAttribute("scrolling", "no");
//     iframe.setAttribute("allowtransparency", "true");
//     document.body.appendChild(iframe);
// })();



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
    img.src = "./2d/help_m.png";
    img.style.cssText = "position:fixed; bottom:50px; left:50%; transform:translateX(-50%); width:188px; height:52px; opacity:1; z-index:9999; pointer-events:none; transition:opacity 0.3s ease;";
    document.body.appendChild(img);
})();


//--                                            이메일 하단 버튼

(function () {
    // 1. 이미지 생성 및 설정
    const img = document.createElement("img");
    img.src = "./2d/email.png";
    img.style.cssText = "position:fixed; bottom:0px; left:50%; transform:translateX(-50%); width:180px; height:34px; opacity:1; z-index:9999; cursor:pointer; transition:opacity 0.3s ease;";
    document.body.appendChild(img);

    // 2. 클릭 시 실행될 함수
    img.onclick = function() {
        const existingPopup = document.getElementById('three-html-popup');
        if (existingPopup) existingPopup.remove();

        const overlay = document.createElement('div');
        overlay.id = 'three-html-popup';
        overlay.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:20000; display:flex; justify-content:center; align-items:center;";

        const container = document.createElement('div');
        container.style.cssText = "width:800px; height:700px; background:white; border-radius:15px; position:relative; overflow:hidden; box-shadow:0 0 20px rgba(0,0,0,0.3);";

        // --- [수정] 공통 닫기 함수 정의 ---
        const closePopup = () => {
            overlay.remove();
            window.removeEventListener('popstate', onPopState); // 이벤트 리스너 해제
            if (window.history.state === 'email_popup') {
                window.history.back(); // 가짜 히스토리 제거
            }
        };

        const closeBtn = document.createElement('button');
        closeBtn.textContent = '✕';
        closeBtn.style.cssText = "position:absolute; top:10px; right:10px; background:none; border:none; font-size:20px; cursor:pointer; z-index:1;";
        closeBtn.onclick = closePopup; // 정의한 닫기 함수 연결
        
        closeBtn.onmouseover = () => { closeBtn.style.background = '#f0f0f0'; };
        closeBtn.onmouseleave = () => { closeBtn.style.background = 'white'; };

        const iframe = document.createElement('iframe');
        iframe.src = "email.html";
        iframe.style.cssText = "width:100%; height:100%; border:none;";

        container.appendChild(closeBtn);
        container.appendChild(iframe);
        overlay.appendChild(container);
        document.body.appendChild(overlay);

        // --- [핵심] 뒤로가기 제어 추가 ---
        // 1. 가짜 히스토리 기록 추가
        window.history.pushState('email_popup', null, null);

        // 2. 뒤로가기 감지 시 호출될 함수
        function onPopState() {
            overlay.remove(); // 팝업 닫기
            window.removeEventListener('popstate', onPopState);
        }

        // 3. 윈도우에 뒤로가기 이벤트 등록
        window.addEventListener('popstate', onPopState);

        // 배경 클릭 시 닫기
        overlay.onclick = (e) => { 
            if (e.target === overlay) closePopup(); 
        };
    };
})();