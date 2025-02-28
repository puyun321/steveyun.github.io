import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, increment } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCMUf4-ODAegkRC1RMfzbuYGTtA6r_9gSY",
  authDomain: "py-page.firebaseapp.com",
  projectId: "py-page",
  storageBucket: "py-page.appspot.com",
  messagingSenderId: "1028528276815",
  appId: "1:1028528276815:web:ea15a014fa245f1e2e713a",
  measurementId: "G-8TBQEL76YE"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 獲取訪客的國家資訊
async function getVisitorCountry() {
    try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        return data.country_name || "Unknown"; // 如果獲取失敗，回傳 "Unknown"
    } catch (error) {
        console.error('Error fetching country:', error);
        return "Unknown";
    }
}

// 更新各國瀏覽數量
async function updateVisitorCount() {
    const country = await getVisitorCountry();
    const visitorRef = doc(db, "visitors", country);

    try {
        const visitorSnap = await getDoc(visitorRef);
        if (visitorSnap.exists()) {
            await updateDoc(visitorRef, { count: increment(1) });
        } else {
            await setDoc(visitorRef, { count: 1 });
        }

        // 讀取所有國家的計數
        const snapshot = await getDoc(visitorRef);
        const data = snapshot.data();

        // 顯示統計數據
        displayVisitorCounts(country, data.count);
    } catch (error) {
        console.error("Error updating visitor count:", error);
    }
}

// 顯示各國瀏覽數量
function displayVisitorCounts(country, count) {
    const visitorCountsElement = document.getElementById('visitor-counts');
    
    // 獲取國家的 ISO 代碼（例如，US 代表美國）
    const countryCode = getCountryCode(country);
    
    // 使用 Flagpack 顯示國旗
    visitorCountsElement.innerHTML = `
        <div class="visitor-count-item">
            <span class="flagpack flagpack-${countryCode.toLowerCase()}"></span>
            <h4>${country}: ${count} 次</h4>
        </div>
    `;
}

// 將國家名稱轉換為 ISO 代碼
function getCountryCode(countryName) {
    const countryCodes = {
        "United States": "us",
        "Canada": "ca",
        "United Kingdom": "gb",
        "Malaysia": "my",
		"Taiwan": "tw",
		"China": "cn"
	
        // 添加更多國家名稱和對應的 ISO 代碼
    };
    return countryCodes[countryName] || "Unknown";
}

// 初始化
document.addEventListener('DOMContentLoaded', updateVisitorCount);