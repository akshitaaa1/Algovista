import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyBcn5HIoy3pFkWsjhH580aMr4kKKSwwW8E",
    authDomain: "algovista-68445.firebaseapp.com",
    projectId: "algovista-68445",
    storageBucket: "algovista-68445.appspot.com",
    messagingSenderId: "786991204137",
    appId: "1:786991204137:web:e49abf731154f7193c1938"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth };