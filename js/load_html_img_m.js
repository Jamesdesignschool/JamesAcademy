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
    // 클릭 가능하도록 pointer-events: auto 및 cursor 설정
    img.style.cssText = "position:fixed; bottom:0px; left:50%; transform:translateX(-50%); width:180px; height:34px; opacity:1; z-index:9999; cursor:pointer; transition:opacity 0.3s ease;";
    document.body.appendChild(img);

    // 2. 클릭 시 실행될 함수
    img.onclick = function() {
        // 중복 생성 방지
        const existingPopup = document.getElementById('three-html-popup');
        if (existingPopup) existingPopup.remove();

        // [배경 레이어]
        const overlay = document.createElement('div');
        overlay.id = 'three-html-popup';
        overlay.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:20000; display:flex; justify-content:center; align-items:center;";

        // [컨테이너 - 라운드 적용]
        const container = document.createElement('div');
        // 가로 1000, 세로 700 고정 (혹은 80% 등으로 유동적 조절 가능)
        container.style.cssText = "width:800px; height:700px; background:white; border-radius:15px; position:relative; overflow:hidden; box-shadow:0 0 20px rgba(0,0,0,0.3);";

        // [X 버튼]
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '✕';
        closeBtn.style.cssText = "position:absolute; top:10px; right:10px; background:none; border:none; font-size:20px; cursor:pointer; z-index:1;";
        closeBtn.onclick = () => overlay.remove();
        container.appendChild(closeBtn);
        
        // 버튼 마우스 오버 효과 (선택사항)
        closeBtn.onmouseover = () => { closeBtn.style.background = '#f0f0f0'; };
        closeBtn.onmouseleave = () => { closeBtn.style.background = 'white'; };

        // [iframe 설정]
        const iframe = document.createElement('iframe');
        iframe.src = "email.html";
        iframe.style.cssText = "width:100%; height:100%; border:none;";

        // 요소 조립
        container.appendChild(closeBtn);
        container.appendChild(iframe);
        overlay.appendChild(container);
        document.body.appendChild(overlay);

        // 배경 클릭 시 닫기
        overlay.onclick = (e) => { 
            if (e.target === overlay) overlay.remove(); 
        };
    };
})();