// === 음악 페이드 인/아웃 로직 (로컬 오디오 전용) ===
let localFadeInterval = null;
const fadeStepTime = 50; 
const fadeTotalSteps = 20; // 50ms * 20 = 1000ms (1초 페이드)

function doLocalPlay() {
    clearInterval(localFadeInterval);
    if (audio.paused) {
        audio.volume = 0;
        audio.play().catch(e => console.log("Auto-play prevented:", e));
    }
    let step = Math.floor(audio.volume * fadeTotalSteps);
    localFadeInterval = setInterval(() => {
        step++;
        if (step >= fadeTotalSteps) {
            audio.volume = 1;
            clearInterval(localFadeInterval);
        } else {
            audio.volume = step / fadeTotalSteps;
        }
    }, fadeStepTime);
}

function doLocalPause() {
    clearInterval(localFadeInterval);
    let step = Math.floor(audio.volume * fadeTotalSteps);
    localFadeInterval = setInterval(() => {
        step--;
        if (step <= 0) {
            audio.volume = 0;
            audio.pause();
            clearInterval(localFadeInterval);
        } else {
            audio.volume = step / fadeTotalSteps;
        }
    }, fadeStepTime);
}

// --- 메인 앱 로직 ---
const audio = document.getElementById('main-audio');
const cText = document.getElementById('cinematic-text');
const webDesc = document.getElementById('web-desc');
const divineImage = document.querySelector('.divine-cross-image'); 

const browser = document.getElementById('prayer-browser');
const searchContainer = document.getElementById('search-container');
const searchInput = document.getElementById('prayer-search-input');

const backContainer = document.getElementById('back-container');
const backBtn = document.getElementById('back-btn');

const playSvg = document.getElementById('play-svg');
const pauseSvg = document.getElementById('pause-svg');

const scripts = [
    { start: 0, text: "예수님은 누구신가" },
    { start: 6, text: "약한 자의 강함과" },
    { start: 13, text: "눈 먼 자의 빛이시며" },
    { start: 20, text: "병든 자의 고침과" },
    { start: 28, text: "죽은 자의 부활 되고" },
    { start: 35, text: "우리 생명 되시네" },
];

let animationFrameId = null;
let currentIdx = -1;

let currentFontSize = 1.1; 
let currentCategory = null; 
let isSearching = false; 

let currentPrayerList = []; 
let currentDetailIndex = -1; 

// 이벤트 리스너들
searchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase().trim();
    
    if (!term) {
        isSearching = false;
        renderCategoryIndex(false); 
        return;
    }

    isSearching = true;
    const results = [];
    
    if (typeof prayerData !== 'undefined') {
        prayerData.forEach(cat => {
            cat.list.forEach(item => {
                if (item.title.toLowerCase().includes(term) || item.content.toLowerCase().includes(term)) {
                    results.push({ item, category: cat });
                }
            });
        });
    }
    renderSearchResults(results, term);
});

function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => {
        p.classList.remove('active');
        p.style.display = 'none';
    });
    document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
    const targetPage = document.getElementById(`page-${pageId}`);
    const targetNav = document.getElementById(`nav-${pageId}`);
    
    if (targetPage) {
        targetPage.style.display = 'flex';
        requestAnimationFrame(() => targetPage.classList.add('active'));
    }
    if (targetNav) targetNav.classList.add('active');
    
    if(pageId === 'prayer') {
        searchInput.value = '';
        isSearching = false;
        currentDetailIndex = -1;
        renderCategoryIndex();
    } else {
        searchContainer.style.display = 'none'; 
        backContainer.style.display = 'none';
    }
    
    if(pageId === 'home') currentIdx = -1;
    applyFontSize();
}

function renderCategoryIndex(resetSearchInput = true) {
    if (typeof prayerData === 'undefined') return;
    
    searchContainer.style.display = 'block'; 
    backContainer.style.display = 'none'; 
    currentDetailIndex = -1;

    if(resetSearchInput) searchInput.value = ''; 

    browser.innerHTML = `<h2 class="browser-section-title">Index</h2>`;
    prayerData.forEach((cat, index) => {
        const div = document.createElement('div');
        div.className = 'browser-item';
        div.style.animation = `fadeInUp 0.6s ease forwards ${index * 0.1}s`;
        div.innerHTML = `<span class="idx">${cat.id}</span><span class="label">${cat.category}</span>`;
        div.onclick = () => renderPrayerList(cat);
        browser.appendChild(div);
    });
    
    browser.scrollTop = 0; 
}

function renderPrayerList(category) {
    currentCategory = category;
    searchContainer.style.display = 'none'; 
    backContainer.style.display = 'block';
    backBtn.onclick = isSearching ? restoreSearch : () => renderCategoryIndex(false);
    currentDetailIndex = -1;
    
    currentPrayerList = category.list.map(item => ({ item, category }));

    browser.innerHTML = '';
    currentPrayerList.forEach((data, index) => {
        const div = document.createElement('div');
        div.className = 'browser-item';
        div.innerHTML = `<span class="idx">${data.item.id}</span><span class="label">${data.item.title}</span>`;
        div.onclick = () => renderPrayerDetail(index);
        browser.appendChild(div);
    });
    browser.scrollTop = 0;
}

function renderSearchResults(results, term) {
    searchContainer.style.display = 'block';
    backContainer.style.display = 'none'; 
    currentDetailIndex = -1;
    currentPrayerList = results; 

    browser.innerHTML = `<h2 class="browser-section-title" style="font-size: clamp(1.2rem, 4vw, 1.4rem);">검색 결과 (${results.length})</h2>`;
    
    if (results.length === 0) {
        browser.innerHTML += `<div style="text-align:center; color:var(--text-secondary); margin-top: 50px; font-family: 'Noto Serif KR', serif; line-height: 1.6;">'${term}'에 대한<br>검색 결과가 없습니다.</div>`;
        return;
    }

    results.forEach((res, index) => {
        const div = document.createElement('div');
        div.className = 'browser-item';
        div.style.animation = `fadeInUp 0.4s ease forwards ${index * 0.05}s`;
        div.innerHTML = `
            <span class="idx" style="font-size: clamp(1rem, 3.5vw, 1.1rem); min-width: clamp(30px, 8vw, 40px);">${res.item.id}</span>
            <div style="display:flex; flex-direction:column;">
                <span class="label">${res.item.title}</span>
                <span style="font-size:clamp(0.7rem, 2.5vw, 0.75rem); color:var(--accent-color); opacity:0.8; margin-top:6px;">${res.category.category}</span>
            </div>
        `;
        div.onclick = () => renderPrayerDetail(index);
        browser.appendChild(div);
    });
    browser.scrollTop = 0;
}

function renderPrayerDetail(index) {
    currentDetailIndex = index;
    const data = currentPrayerList[index];
    const prayer = data.item;
    const category = data.category;

    searchContainer.style.display = 'none'; 
    backContainer.style.display = 'block';
    backBtn.onclick = isSearching ? restoreSearch : () => renderPrayerList(currentCategory);
    
    const prevDisabled = index === 0 ? 'disabled' : '';
    const nextDisabled = index === currentPrayerList.length - 1 ? 'disabled' : '';

    browser.innerHTML = '';
    const detail = document.createElement('div');
    detail.className = 'prayer-view-content';
    
    detail.innerHTML = `
        <div class="prayer-category-label">${category.category}</div>
        <div class="font-controls-container" style="margin-top:-20px;">
            <button class="font-btn" onclick="adjustFontSize(-0.1)" title="글자 축소">
                <span class="material-symbols-outlined">remove</span>
            </button>
            <button class="font-btn" onclick="adjustFontSize(0.1)" title="글자 확대">
                <span class="material-symbols-outlined">add</span>
            </button>
        </div>
        <h3>${prayer.title}</h3>
        <div id="prayer-text">${prayer.content.replace(/\n/g, '<br>')}</div>
        <div class="prayer-ending" style="margin-top:50px; text-align:center; color:var(--accent-color); opacity:0.6;">예수님의 이름으로 기도합니다. 아멘.</div>
        
        <div class="prayer-nav-buttons">
            <button class="nav-action-btn" ${prevDisabled} onclick="renderPrayerDetail(${index - 1})">
                <span class="material-symbols-outlined">arrow_back_ios</span> 이전
            </button>
            <span class="prayer-counter">${index + 1} / ${currentPrayerList.length}</span>
            <button class="nav-action-btn" ${nextDisabled} onclick="renderPrayerDetail(${index + 1})">
                다음 <span class="material-symbols-outlined">arrow_forward_ios</span>
            </button>
        </div>
    `;
    browser.appendChild(detail);
    applyFontSize(); 
    browser.scrollTop = 0;
}

let touchStartX = 0;
let touchEndX = 0;

browser.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
}, {passive: true});

browser.addEventListener('touchend', e => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
}, {passive: true});

function handleSwipe() {
    if (currentDetailIndex === -1 || !document.querySelector('.prayer-view-content')) return;
    const swipeThreshold = 60; 
    
    if (touchEndX < touchStartX - swipeThreshold) {
        if (currentDetailIndex < currentPrayerList.length - 1) {
            renderPrayerDetail(currentDetailIndex + 1);
        }
    }
    if (touchEndX > touchStartX + swipeThreshold) {
        if (currentDetailIndex > 0) {
            renderPrayerDetail(currentDetailIndex - 1);
        }
    }
}

function restoreSearch() {
    searchContainer.style.display = 'block';
    currentDetailIndex = -1;
    searchInput.dispatchEvent(new Event('input')); 
}

function adjustFontSize(delta) {
    const newSize = currentFontSize + delta;
    if (newSize >= 0.8 && newSize <= 2.5) {
        currentFontSize = newSize;
        applyFontSize();
    }
}

function applyFontSize() {
    const lordsText = document.querySelector('.lords-prayer-text');
    if (lordsText) {
        lordsText.style.fontSize = `${currentFontSize}rem`;
        lordsText.style.lineHeight = `${currentFontSize * 2.2}rem`;
    }
    const prayerText = document.getElementById('prayer-text');
    if (prayerText) {
        prayerText.style.fontSize = `${currentFontSize}rem`;
        prayerText.style.lineHeight = `${currentFontSize * 2.2}rem`;
    }
}

function updateImageColor() {
    if (divineImage && audio.duration) {
        const progress = audio.currentTime / audio.duration;
        const grayscale = Math.max(0, 100 - (progress * 100));
        divineImage.style.filter = `grayscale(${grayscale}%) brightness(1.2) contrast(1.1)`;
    }
}

function updateLyrics() {
    if (audio.paused || audio.ended) return; 
    updateImageColor();

    const now = audio.currentTime;
    let targetIdx = -1;
    for (let i = 0; i < scripts.length; i++) {
        const nextStart = scripts[i+1] ? scripts[i+1].start : Infinity;
        if (now >= scripts[i].start && now < nextStart - 0.3) {
            targetIdx = i; break;
        }
    }
    if (targetIdx !== currentIdx) {
        currentIdx = targetIdx;
        if (currentIdx !== -1) {
            cText.classList.remove('active');
            setTimeout(() => {
                cText.innerText = scripts[currentIdx].text;
                cText.classList.add('active');
            }, 400);
        } else {
            cText.classList.remove('active');
        }
    }
    animationFrameId = requestAnimationFrame(updateLyrics);
}

function toggleAudio() {
    if (audio.paused) doLocalPlay();
    else doLocalPause();
}

audio.addEventListener('play', () => {
    playSvg.style.display = 'none';
    pauseSvg.style.display = 'block';
    if (!animationFrameId) updateLyrics();

    // 상호 배제: 유튜브 재생 중일 경우 즉시 일시정지
    if (ytPlayer && typeof ytPlayer.getPlayerState === 'function') {
        if (ytPlayer.getPlayerState() === YT.PlayerState.PLAYING) {
            ytPlayer.pauseVideo();
        }
    }
});

audio.addEventListener('pause', () => {
    playSvg.style.display = 'block';
    pauseSvg.style.display = 'none';
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null; 
    }
});

audio.addEventListener('seeked', updateImageColor);

function startExperience() {
    const splash = document.getElementById('splash-screen');
    const splashContent = document.querySelector('.splash-content');
    
    splash.style.pointerEvents = 'none'; 
    splash.style.transition = 'opacity 1.5s ease-in-out';
    splash.style.opacity = '0';
    
    if (splashContent) {
        splashContent.style.transition = 'transform 1.5s ease-in-out, opacity 1.5s ease-in-out';
        splashContent.style.transform = 'scale(1.1)';
        splashContent.style.opacity = '0';
    }

    setTimeout(() => {
        splash.remove();
        if(webDesc) webDesc.classList.add('show');
    }, 1500);
    
    // 자연스러운 로컬 플레이어 페이드인 시작
    doLocalPlay();
}

function copyShareLink(btnElement) {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
        const originalText = btnElement.innerHTML;
        btnElement.innerHTML = `<span class="material-symbols-outlined" style="font-size: 18px;">check</span> 복사 완료`;
        btnElement.style.color = 'var(--bg-color)';
        btnElement.style.backgroundColor = 'var(--accent-color)';
        
        setTimeout(() => {
            btnElement.innerHTML = originalText;
            btnElement.style.color = 'var(--accent-color)';
            btnElement.style.backgroundColor = 'transparent';
        }, 2000);
    }).catch(err => {
        console.error('복사 실패:', err);
        alert('주소 복사를 지원하지 않는 브라우저입니다.');
    });
}

function toggleEmailPolicy() {
    const policyText = document.getElementById('email-policy-text');
    if (!policyText) return;
    
    if (policyText.style.display === 'none') {
        policyText.style.display = 'block';
        policyText.animate([
            { opacity: 0, transform: 'translateY(-5px)' },
            { opacity: 1, transform: 'translateY(0)' }
        ], { duration: 300, easing: 'ease-out', fill: 'forwards' });
    } else {
        policyText.style.display = 'none';
    }
}

document.getElementById('splash-screen').addEventListener('click', startExperience, { once: true });


// === 글로벌 뮤직 플레이어 기능 (YouTube IFrame API 연동) ===
const ytPlaylistData = [
    { id: 'pZuW2CV0mXY', title: '은혜 (Grace)', artist: '손경민 (Vocal. 지선, 이윤화, 하니, 강찬)' },
    { id: '2O_w1Am9cq0', title: '복음밖에 없습니다', artist: '손경민 (feat.지선, 이윤화, 아이빅밴드)' },
    { id: 'acS4DAMFGWA', title: '내가 매일 해야 하는 말', artist: '손경민 (With 아이빅밴드, 지선, 이윤화)' },

    { id: 'ovjWMKsks2Y', title: '하나님의 부르심', artist: '피아워십 (F.I.A Worship)' },
    { id: 'KS4wNLfGD1s', title: '나는 일어섭니다', artist: '피아워십 (F.I.A Worship)' },
    { id: 'Qek0xGCTCIc', title: '나는 믿네 (I Do Believe)', artist: '피아워십 (F.I.A Worship)' },
    { id: 'AmwX2-BIpRU', title: '나는 주를 섬기는 것에 후회가 없습니다', artist: '피아워십 (F.I.A Worship)' },

    { id: 'lToefu_xLQI', title: '예수 우리 왕이여', artist: '제이어스 (J-US)' },
    { id: 'MMzUCCn6aQ4', title: 'Amazing Grace (나 같은 죄인 살리신)', artist: '제이어스 (J-US)' },
    { id: 'NYiH9ftHjWo', title: 'Love Never Fails (여호와께 돌아가자)', artist: '제이어스 (J-US)' },

    { id: 'yj1yyLyPiBE', title: '내일 일은 난 몰라요', artist: '마커스워십 (Markers Worship)' },
    { id: '9vS0aGxVHjk', title: '전능하신 나의 주 하나님은', artist: '마커스워십 (Markers Worship)' },

    { id: '9NhESBIGvWc', title: '비 준비하시니', artist: '예람워십 (Yeram Worship)' },
    { id: '8PEKtpFsWiI', title: '주가 일하시네', artist: '예람워십 (Yeram Worship)' },

    { id: 'c216NU8183o', title: '영접송 (내 맘을 엽니다)', artist: '팀룩워십 (Team Luke Worship)' },
    { id: 'pqDTRgaY8q0', title: '고요한 밤 하늘 별들 반짝일 때', artist: '팀룩워십 (Team Luke Worship)' },

    { id: '3ZFnSEH6Hfk', title: '나의 안에 거하라', artist: '달빛마을 (Moonlight Village)' },

    { id: 'CDeWAlagzQc', title: '주님을 바라봅니다', artist: '위클레시아 (WECCLESIA)' },

    { id: 'ctP6td3vTpo', title: 'Living Hope (주 예수 내 산 소망)', artist: '데이빗밴드 (Daybeat Band)' },
];

let ytPlayer;
let isYtPlayerReady = false;
let currentYtIdx = 0;
let isPlayerVisible = false;
    
let ytIsShuffle = false;
let ytRepeatMode = 0; // 0: 전체 반복, 1: 한곡 반복
let ytPlayHistory = []; 

let ytAnimFrameId = null;

function onYouTubeIframeAPIReady() {
    ytPlayer = new YT.Player('yt-player-container', {
        height: '0',
        width: '0',
        videoId: ytPlaylistData[currentYtIdx].id,
        playerVars: { 
            'autoplay': 0, 'controls': 0, 'playsinline': 1, 'rel': 0 
        },
        events: {
            'onReady': onYtPlayerReady,
            'onStateChange': onYtPlayerStateChange,
            'onError': onYtPlayerError
        }
    });
}

function onYtPlayerReady(event) {
    isYtPlayerReady = true;
    updateYtUIInfo();
    renderYtPlaylistUI();
}

function onYtPlayerStateChange(event) {
    const playpauseIcon = document.getElementById('gmp-playpause-icon');
    
    if (event.data === YT.PlayerState.PLAYING) {
        playpauseIcon.textContent = 'pause_circle';
        startYtProgressLoop();
        
        // 상호 배제: 로컬 플레이어 부드럽게 페이드아웃 정지
        if (!audio.paused) {
            doLocalPause();
        }
    } else {
        playpauseIcon.textContent = 'play_circle';
        stopYtProgressLoop();
    }
    
    if (event.data === YT.PlayerState.ENDED) {
        playNextYt(true);
    }
}

function onYtPlayerError(event) {
    console.error("YouTube Player Error", event.data);
    playNextYt();
}

function toggleGlobalPlayer() {
    const playerEl = document.getElementById('global-music-player');
    const icon = document.getElementById('header-music-icon');
    
    isPlayerVisible = !isPlayerVisible;
    if (isPlayerVisible) {
        playerEl.classList.add('show');
        icon.style.color = 'var(--accent-color)';
    } else {
        playerEl.classList.remove('show');
        icon.style.color = 'var(--text-secondary)';
        
        const popup = document.getElementById('gmp-playlist-popup');
        if (popup.classList.contains('show')) popup.classList.remove('show');
    }
}

function toggleYtPlayPause() {
    if (!isYtPlayerReady) return;
    const state = ytPlayer.getPlayerState();
    if (state === YT.PlayerState.PLAYING) {
        // 모바일 호환성을 위해 직접 즉시 일시정지 호출
        ytPlayer.pauseVideo();
    } else {
        // 볼륨 초기화(setVolume) 없이 바로 재생 호출
        ytPlayer.playVideo();
    }
}

function loadAndPlayYt(index) {
    if (!isYtPlayerReady) return;
    if (index < 0 || index >= ytPlaylistData.length) return;
    
    if (ytIsShuffle && index !== currentYtIdx) {
        ytPlayHistory.push(currentYtIdx);
    }

    currentYtIdx = index;
    // 볼륨 초기화 없이 로드
    ytPlayer.loadVideoById(ytPlaylistData[currentYtIdx].id);
    updateYtUIInfo();
    renderYtPlaylistUI();
}

function playNextYt(isAutoPlay = false) {
    if (!isYtPlayerReady) return;
    
    let nextIdx = currentYtIdx;
    
    if (isAutoPlay && ytRepeatMode === 1) {
        ytPlayer.seekTo(0);
        ytPlayer.playVideo();
        return;
    }

    if (ytIsShuffle) {
        ytPlayHistory.push(currentYtIdx);
        if (ytPlaylistData.length > 1) {
            do {
                nextIdx = Math.floor(Math.random() * ytPlaylistData.length);
            } while (nextIdx === currentYtIdx);
        }
    } else {
        nextIdx = (currentYtIdx + 1) % ytPlaylistData.length;
    }
    
    loadAndPlayYt(nextIdx);
}

function playPrevYt() {
    if (!isYtPlayerReady) return;

    if (ytPlayer.getCurrentTime() > 3) {
        ytPlayer.seekTo(0);
        return;
    }

    let prevIdx = currentYtIdx;

    if (ytIsShuffle && ytPlayHistory.length > 0) {
        prevIdx = ytPlayHistory.pop();
    } else {
        prevIdx = (currentYtIdx - 1 + ytPlaylistData.length) % ytPlaylistData.length;
    }

    currentYtIdx = prevIdx;
    ytPlayer.loadVideoById(ytPlaylistData[currentYtIdx].id);
    updateYtUIInfo();
    renderYtPlaylistUI();
}

function toggleYtShuffle() {
    ytIsShuffle = !ytIsShuffle;
    const btn = document.getElementById('gmp-shuffle');
    if (ytIsShuffle) {
        btn.classList.add('active');
        ytPlayHistory = [];
    } else {
        btn.classList.remove('active');
    }
}

function toggleYtRepeat() {
    ytRepeatMode = (ytRepeatMode + 1) % 2;
    const icon = document.getElementById('gmp-repeat-icon');
    const btn = document.getElementById('gmp-repeat');
    
    if (ytRepeatMode === 1) {
        icon.textContent = 'repeat_one';
        btn.classList.add('active');
    } else {
        icon.textContent = 'repeat';
        btn.classList.remove('active');
    }
}

function renderYtPlaylistUI() {
    const ul = document.getElementById('gmp-playlist-ul');
    ul.innerHTML = '';
    
    ytPlaylistData.forEach((song, index) => {
        const li = document.createElement('li');
        li.className = `gmp-playlist-item ${index === currentYtIdx ? 'active' : ''}`;
        li.onclick = () => {
            loadAndPlayYt(index);
            togglePlaylist();
        };
        li.innerHTML = `
            <div class="p-title">${song.title}</div>
            <div class="p-artist">${song.artist}</div>
        `;
        ul.appendChild(li);
    });
}

function togglePlaylist() {
    const popup = document.getElementById('gmp-playlist-popup');
    const btn = document.getElementById('gmp-playlist-btn');
    
    if (popup.classList.contains('show')) {
        popup.classList.remove('show');
        btn.classList.remove('active');
    } else {
        popup.classList.add('show');
        btn.classList.add('active');
    }
}

function updateYtUIInfo() {
    const song = ytPlaylistData[currentYtIdx];
    document.getElementById('gmp-title').textContent = song.title;
    document.getElementById('gmp-artist').textContent = song.artist;
    document.getElementById('gmp-thumbnail').src = `https://img.youtube.com/vi/${song.id}/mqdefault.jpg`;
}

function startYtProgressLoop() {
    if (!ytAnimFrameId) {
        updateYtProgress();
    }
}

function stopYtProgressLoop() {
    if (ytAnimFrameId) {
        cancelAnimationFrame(ytAnimFrameId);
        ytAnimFrameId = null;
    }
}

function updateYtProgress() {
    if (ytPlayer && isYtPlayerReady) {
        const dur = ytPlayer.getDuration();
        const cur = ytPlayer.getCurrentTime();
        if (dur > 0) {
            const percent = (cur / dur) * 100;
            document.getElementById('gmp-progress-bar').style.width = `${percent}%`;
        }
    }
    ytAnimFrameId = requestAnimationFrame(updateYtProgress);
}

// 터치 시 즉각 반응 및 깜빡임 수정 포함
function seekYtProgress(e) {
    if (!ytPlayer || !isYtPlayerReady) return;
    const container = document.getElementById('gmp-progress-container');
    const rect = container.getBoundingClientRect();
    let pos = (e.clientX - rect.left) / rect.width;
    
    // 클릭 범위(0~1)를 벗어나지 않도록 고정
    pos = Math.max(0, Math.min(1, pos));
    
    // 즉각적인 시각적 업데이트 (깜빡임 완벽 차단)
    document.getElementById('gmp-progress-bar').style.width = `${pos * 100}%`;
    
    const dur = ytPlayer.getDuration();
    if (dur > 0) {
        ytPlayer.seekTo(dur * pos, true);
        if (ytPlayer.getPlayerState() !== YT.PlayerState.PLAYING) {
            // 볼륨 초기화 코드 삭제
            ytPlayer.playVideo();
        }
    }
}

window.addEventListener('beforeunload', () => {
    if(animationFrameId) cancelAnimationFrame(animationFrameId);
    stopYtProgressLoop();
});

DisableDevtool({
    disableMenu: true,
    interval: 1000,
});

window.addEventListener('keydown', function(e) {
    if ((e.ctrlKey && (e.key === 'u' || e.key === 'U')) || 
        (e.metaKey && e.altKey && (e.key === 'u' || e.key === 'U'))) {
        e.preventDefault();
        return false;
    }
    if ((e.ctrlKey && (e.key === 's' || e.key === 'S')) || 
        (e.metaKey && (e.key === 's' || e.key === 'S'))) {
        e.preventDefault();
        return false;
    }
    if ((e.ctrlKey && (e.key === 'p' || e.key === 'P')) || 
        (e.metaKey && (e.key === 'p' || e.key === 'P'))) {
        e.preventDefault();
        return false;
    }
});