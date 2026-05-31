// 인증키 및 고정 정보 설정
const SERVICE_KEY = "OaRLlfpKOXJH%2BFeghkAojoaSAQbb1bkFF9COvGfjixpiLkEYTHFLqIcBYqFb0HCrcX8H3A47X9QNiRpgcCXAOA%3D%3D";
const NX = 98;
const NY = 77;

// API 날짜 및 시간 계산 함수 (기상청 초단기실황용)
function getBaseDateTime() {
    const now = new Date();
    let year = now.getFullYear();
    let month = now.getMonth() + 1;
    let date = now.getDate();
    let hours = now.getHours();
    let minutes = now.getMinutes();

    // 초단기실황은 매시 40분에 생성되므로, 40분 전이면 이전 시간 데이터를 조회해야 함
    if (minutes < 40) {
        hours = hours - 1;
        if (hours < 0) {
            // 자정 이전인 경우 전날 23시로 설정
            now.setDate(now.getDate() - 1);
            year = now.getFullYear();
            month = now.getMonth() + 1;
            date = now.getDate();
            hours = 23;
        }
    }

    // 포맷팅 (자리수 맞추기)
    const baseDate = `${year}${String(month).padStart(2, '0')}${String(date).padStart(2, '0')}`;
    const baseTime = `${String(hours).padStart(2, '0')}00`;

    return { baseDate, baseTime };
}

// 강수형태(PTY) 코드 변환 함수
function getPtyString(code) {
    const ptyMap = {
        "0": "맑음(비 안옴)",
        "1": "비",
        "2": "비/눈",
        "3": "눈",
        "5": "빗방울",
        "6": "빗방울눈날림",
        "7": "눈날림"
    };
    return ptyMap[code] || "정보 없음";
}

// 날씨 데이터 가져오기 실행 함수
async function fetchWeather() {
    const loadingEl = document.getElementById('loading');
    const cardEl = document.getElementById('weather-card');
    
    loadingEl.classList.remove('hidden');
    cardEl.classList.add('hidden');

    const { baseDate, baseTime } = getBaseDateTime();

    // API URL 조립
    const url = `https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtNcst?serviceKey=${SERVICE_KEY}&pageNo=1&numOfRows=1000&dataType=JSON&base_date=${baseDate}&base_time=${baseTime}&nx=${NX}&ny=${NY}`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('네트워크 응답에 문제가 있습니다.');
        
        const data = await response.json();
        
        // 기상청 에러 체크
        if (!data.response || data.response.header.resultCode !== "00") {
            alert(`기상청 API 에러: ${data.response?.header.resultMsg || '알 수 없는 오류'}`);
            return;
        }

        const items = data.response.body.items.item;
        
        // 화면 표기용 시간 포맷팅 (예: 2026-05-31 15:00)
        const formattedTime = `${baseDate.substring(0,4)}-${baseDate.substring(4,6)}-${baseDate.substring(6,8)} ${baseTime.substring(0,2)}:00`;
        document.getElementById('base-time-text').innerText = formattedTime;

        // 데이터 분류 및 화면 UI 매핑
        items.forEach(item => {
            switch(item.category) {
                case "T1H": // 기온
                    document.getElementById('temp-val').innerText = item.obsrValue;
                    break;
                case "PTY": // 강수형태
                    document.getElementById('pty-val').innerText = getPtyString(item.obsrValue);
                    break;
                case "RN1": // 1시간 강수량
                    const rn1 = parseFloat(item.obsrValue);
                    document.getElementById('rn1-val').innerText = rn1 === 0 ? "없음" : `${item.obsrValue}mm`;
                    break;
                case "REH": // 습도
                    document.getElementById('reh-val').innerText = `${item.obsrValue}%`;
                    break;
                case "WSD": // 풍속
                    document.getElementById('wind-val').innerText = `${item.obsrValue}m/s`;
                    break;
            }
        });

        // 로딩 숨기고 카드 보이기
        loadingEl.classList.add('hidden');
        cardEl.classList.remove('hidden');

    } catch (error) {
        console.error('Fetch Error:', error);
        loadingEl.innerText = "날씨 정보를 불러오는데 실패했습니다. (CORS 권한 혹은 인증키 확인 필요)";
    }
}

// 이벤트 리스너 등록
document.getElementById('refresh-btn').addEventListener('click', fetchWeather);

// 페이지 로드 시 최초 1회 실행
window.addEventListener('DOMContentLoaded', fetchWeather);
