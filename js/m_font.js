






//--          맑은 고딕 폴더에서 열음

async function loadCustomFonts() {
  const fonts = [
    { name: 'Malgun Gothic', url: 'url(./font/malgun.ttf)', weight: 'normal' },
    { name: 'Malgun Gothic', url: 'url(./font/malgunbd.ttf)', weight: 'bold' },
    { name: 'Malgun Gothic', url: 'url(./font/malgunsl.ttf)', weight: 'lighter' } 
  ];

  try {
    const loadedFonts = await Promise.all(fonts.map(async (f) => {
      const fontFace = new FontFace(f.name, f.url, { weight: f.weight });
      const loadedFace = await fontFace.load();
      document.fonts.add(loadedFace);
      return loadedFace;
    }));

    console.log("모든 폰트가 로드되었습니다.");
    
    // test.html의 전체 컨테이너인 #test 또는 body에 폰트 적용
    document.body.style.fontFamily = "'Malgun Gothic', 'Malgun Gothic', sans-serif";
  } catch (error) {
    console.error("폰트 로드 중 오류 발생:", error);
  }
}

loadCustomFonts();
