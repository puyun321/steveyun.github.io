import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, increment } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCMUf4-ODAegkRC1RMfzbuYGTtA6r_9gSY",
  authDomain: "py-page.firebaseapp.com",
  projectId: "py-page",
  storageBucket: "py-page.appspot.com",
  messagingSenderId: "1028528276815",
  appId: "1:1028528276815:web:ea15a014fa245f1e2e713a",
  measurementId: "G-8TBQEL76YE"
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 獲取訪客的國家資訊
async function getVisitorCountry() {
    try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        return data.country_name || "Unknown"; // 如果未獲取成功，回傳 "Unknown"
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
        const snapshot = await getFirestore(db).collection("visitors").get();
        const data = {};
        snapshot.forEach(doc => {
            data[doc.id] = doc.data().count;
        });

        // 顯示統計數據
        displayVisitorCounts(data);
    } catch (error) {
        console.error("Error updating visitor count:", error);
    }
}

// 顯示各國瀏覽數量
function displayVisitorCounts(data) {
    const visitorCountsElement = document.getElementById('visitor-counts');
    let html = '<h4>各國瀏覽數量:</h4>';
    html += '<ul>';
    for (const [country, count] of Object.entries(data)) {
        html += `<li>${country}: ${count} 次</li>`;
    }
    html += '</ul>';
    visitorCountsElement.innerHTML = html;
}

// 初始化
document.addEventListener('DOMContentLoaded', updateVisitorCount);