

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, increment, collection, getDocs } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";


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


// 將國家名稱轉換為 ISO 代碼
function getCountryCode(countryName) {
    const countryCodes = {
        "Canada": "ca",
		"China": "cn",
		"Japan": "jp",
        "Malaysia": "my",
		"Taiwan": "tw",
		"United Kingdom": "gb",
		"United States": "us"

	
        // 添加更多國家名稱和對應的 ISO 代碼
    };
    return countryCodes[countryName] || "Unknown";
}

// 顯示所有國家的瀏覽數量
async function displayAllVisitorCounts() {
    const visitorCountsElement = document.getElementById('visitor-counts');
    visitorCountsElement.innerHTML = ''; // 清空現有內容

    try {
        const querySnapshot = await getDocs(collection(db, "visitors"));
        querySnapshot.forEach((doc) => {
            const country = doc.id;
            const count = doc.data().count;
            const countryCode = getCountryCode(country);

            if (countryCode !== "Unknown") {
                const div = document.createElement('div');
                div.classList.add('visitor-count-item');
                div.innerHTML = `<span class="fi fi-${countryCode.toLowerCase()}"></span> <h4>${country}: ${count} 次</h4>`;
                visitorCountsElement.appendChild(div);
            }
        });
    } catch (error) {
        console.error("Error fetching visitor counts:", error);
    }
}


// 初始化
document.addEventListener('DOMContentLoaded', async () => {
    await updateVisitorCount();
    await displayAllVisitorCounts();
});