import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

let scene, camera, renderer, model, mixer;
const morphTargetIndex = 0; // first morph target for mouth

// Three.js setup
scene = new THREE.Scene();
camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Load GLB
const loader = new GLTFLoader();
loader.load("model.glb", (gltf) => {
    model = gltf.scene;
    scene.add(model);
    mixer = new THREE.AnimationMixer(model);
});

// Camera position
camera.position.z = 3;

// Animate loop
const clock = new THREE.Clock();
function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    if (mixer) mixer.update(delta);
    renderer.render(scene, camera);
}
animate();

// Lip sync function
async function playTTS(text) {
    const audio = new Audio(`/stream?text=${encodeURIComponent(text)}`);
    audio.play();

    // Web Audio API for mouth movement
    const context = new AudioContext();
    const source = context.createMediaElementSource(audio);
    const analyser = context.createAnalyser();
    source.connect(analyser);
    analyser.connect(context.destination);
    analyser.fftSize = 64;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    function lipSync() {
        if (!model) return;
        analyser.getByteFrequencyData(dataArray);
        const mouthOpen = dataArray.reduce((a,b)=>a+b)/dataArray.length / 255;
        model.traverse((child)=>{
            if(child.morphTargetInfluences){
                child.morphTargetInfluences[morphTargetIndex] = mouthOpen;
            }
        });
        requestAnimationFrame(lipSync);
    }
    lipSync();
}

// Button click
document.getElementById("speakBtn").addEventListener("click", ()=>{
    const text = document.getElementById("textInput").value;
    playTTS(text);
});