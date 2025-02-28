
const firebaseConfig = {
  apiKey: "AIzaSyCMUf4-ODAegkRC1RMfzbuYGTtA6r_9gSY",
  authDomain: "py-page.firebaseapp.com",
  projectId: "py-page",
  storageBucket: "py-page.firebasestorage.app",
  messagingSenderId: "1028528276815",
  appId: "1:1028528276815:web:ea15a014fa245f1e2e713a",
  measurementId: "G-8TBQEL76YE"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

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
    visitorCountsElement.innerHTML = `<h4>${country}: ${count} 次</h4>`;
}

// 初始化
document.addEventListener('DOMContentLoaded', updateVisitorCount);
