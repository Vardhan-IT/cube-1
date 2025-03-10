

// Scene, Camera, Renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 2, 5);

const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio); // Improves clarity on mobile
document.body.appendChild(renderer.domElement);

// Controls (Orbit for Camera) - Now Works with Touch
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enableZoom = true;
controls.enablePan = true;

// Lighting
const light = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(light);
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

// Cube with 6 Sides (1 Open)
const geometry = new THREE.BoxGeometry(3, 3, 3);
const materials = Array(6).fill().map(() => 
    new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })
);


const cube = new THREE.Mesh(geometry, materials);
scene.add(cube);

// Handle Image Uploads for Cube Sides (Fixed for Mobile)
document.getElementById('fileInput').addEventListener('change', (event) => {
    const files = event.target.files;
    if (files.length !== 6) {
        alert("Please upload exactly 6 images.");
        return;
    }

    const loader = new THREE.TextureLoader();
    Array.from(files).forEach((file, index) => {
        const url = URL.createObjectURL(file);
        loader.load(url, (texture) => {
            materials[index].map = texture;
            materials[index].needsUpdate = true;
        });
    });
});

document.getElementById("updateRoomSize").addEventListener("click", () => {
    const width = parseFloat(document.getElementById("roomWidth").value);
    const height = parseFloat(document.getElementById("roomHeight").value);
    const depth = parseFloat(document.getElementById("roomDepth").value);

    cube.geometry.dispose(); // Remove old geometry
    cube.geometry = new THREE.BoxGeometry(width, height, depth);

    cube.position.y = height / 2; // Keep cube on the ground
});


// Objects
const objects = [];
let selectedObject = null;
const objectSelection = document.getElementById("objectSelection");

// Object Types
const shapes = ["Sphere", "Cube", "Cylinder", "Cone", "Torus"];
shapes.forEach(shape => {
    const div = document.createElement("div");
    div.classList.add("object-sample");
    div.innerText = shape;
    div.draggable = true;

    // Touch Support for Drag & Drop
    div.addEventListener("touchstart", (event) => {
        event.preventDefault();
        createObject(shape);
    });

    div.addEventListener("dragstart", (event) => {
        event.dataTransfer.setData("shape", shape);
    });

    objectSelection.appendChild(div);
});

// Drag & Drop (Fixed for Mobile)
document.body.addEventListener("dragover", (event) => event.preventDefault());
document.body.addEventListener("drop", (event) => {
    event.preventDefault();
    const shape = event.dataTransfer.getData("shape");
    createObject(shape);
});

function createObject(shape) {
    let obj;
    if (shape === "Sphere") obj = new THREE.Mesh(new THREE.SphereGeometry(0.2, 32, 32), new THREE.MeshStandardMaterial({ color: Math.random() * 0xffffff }));
    else if (shape === "Cube") obj = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), new THREE.MeshStandardMaterial({ color: Math.random() * 0xffffff }));
    else if (shape === "Cylinder") obj = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.5, 32), new THREE.MeshStandardMaterial({ color: Math.random() * 0xffffff }));
    else if (shape === "Cone") obj = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.5, 32), new THREE.MeshStandardMaterial({ color: Math.random() * 0xffffff }));
    else if (shape === "Torus") obj = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.1, 16, 100), new THREE.MeshStandardMaterial({ color: Math.random() * 0xffffff }));

    obj.position.set(0, 0, 0);
    objects.push(obj);
    scene.add(obj);
    selectedObject = obj;
}
// Drag Controls for Objects
const dragControls = new THREE.DragControls(objects, camera, renderer.domElement);
dragControls.addEventListener('dragstart', () => controls.enabled = false);
dragControls.addEventListener('dragend', () => controls.enabled = true);
dragControls.addEventListener("dragstart", (event) => {
    controls.enabled = false;
});
dragControls.addEventListener("dragend", (event) => {
    controls.enabled = true;
});

// Object Scaling
document.getElementById("scaleUp").addEventListener("click", () => selectedObject?.scale.multiplyScalar(1.1));
document.getElementById("scaleDown").addEventListener("click", () => selectedObject?.scale.multiplyScalar(0.9));
// Download Cube as Image (Fixed)
document.getElementById("downloadBtn").addEventListener("click", () => {
    renderer.render(scene, camera);
    const link = document.createElement("a");
    link.download = "3D_Cube.png";
    link.href = renderer.domElement.toDataURL("image/png");
    link.click();
});
// Render Loop
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();
  


function addPainting(imageUrl, position) {
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(imageUrl, (texture) => {
        const material = new THREE.MeshBasicMaterial({ map: texture });

        // Create a "painting" plane
        const painting = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.75), material);
        painting.position.set(position.x, position.y, position.z);
        painting.rotation.y = position.rotationY || 0; // Rotate if necessary

        scene.add(painting);
    });
}

document.getElementById("addPaintingBtn").addEventListener("click", () => {
    const fileInput = document.getElementById("paintingUpload");
    const file = fileInput.files[0];

    if (!file) {
        alert("Please select an image.");
        return;
    }

    const url = URL.createObjectURL(file);

    // Choose a wall position (modify these values to adjust placement)
    const positions = [
        { x: -1.4, y: 1, z: -1.4, rotationY: Math.PI / 2 }, // Left Wall
        { x: 1.4, y: 1, z: -1.4, rotationY: -Math.PI / 2 }, // Right Wall
        { x: 0, y: 1, z: -2.9, rotationY: 0 } // Back Wall
    ];
    
    // Add the painting at a random position
    const position = positions[Math.floor(Math.random() * positions.length)];
    addPainting(url, position);
});


const flickerLight = new THREE.PointLight(0xffaa00, 1, 5);
flickerLight.position.set(0, 2.5, 0);
scene.add(flickerLight);

function animateLight() {
    requestAnimationFrame(animateLight);
    
    // Simulate flickering by changing intensity slightly
    flickerLight.intensity = 0.8 + Math.random() * 0.4;
}
animateLight();


const ledLight = new THREE.PointLight(0x00ff00, 0.8, 5);
ledLight.position.set(1, 2, 1);
scene.add(ledLight);

let colorHue = 0;
function changeLightColor() {
    requestAnimationFrame(changeLightColor);
    
    colorHue += 0.01;
    ledLight.color.setHSL(colorHue % 1, 1, 0.5);
}
changeLightColor();

function addFurniture(type) {
    let obj;
    const material = new THREE.MeshStandardMaterial({ color: 0x8B4513 }); // Wooden look

    if (type === "Table") {
        obj = new THREE.Mesh(new THREE.BoxGeometry(1, 0.1, 1), material); // Tabletop
        const leg1 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.6, 16), material);
        const leg2 = leg1.clone(), leg3 = leg1.clone(), leg4 = leg1.clone();
        
        leg1.position.set(-0.4, -0.3, -0.4);
        leg2.position.set(0.4, -0.3, -0.4);
        leg3.position.set(-0.4, -0.3, 0.4);
        leg4.position.set(0.4, -0.3, 0.4);
        
        obj.add(leg1, leg2, leg3, leg4);
    }
    else if (type === "Chair") {
        obj = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, 0.5), material); // Seat
        const backrest = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.1), material);
        const leg1 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.4, 16), material);
        const leg2 = leg1.clone(), leg3 = leg1.clone(), leg4 = leg1.clone();
        
        backrest.position.set(0, 0.25, -0.2);
        leg1.position.set(-0.2, -0.2, -0.2);
        leg2.position.set(0.2, -0.2, -0.2);
        leg3.position.set(-0.2, -0.2, 0.2);
        leg4.position.set(0.2, -0.2, 0.2);

        obj.add(backrest, leg1, leg2, leg3, leg4);
    }

    obj.position.set(Math.random() * 2 - 1, 0, Math.random() * 2 - 1);
    scene.add(obj);
    objects.push(obj);
}

document.getElementById("applyTextureBtn").addEventListener("click", () => {
    if (!selectedObject) {
        alert("Select an object first!");
        return;
    }

    const fileInput = document.getElementById("objectTextureUpload");
    const file = fileInput.files[0];

    if (!file) {
        alert("Please select an image.");
        return;
    }

    const url = URL.createObjectURL(file);
    const textureLoader = new THREE.TextureLoader();

    textureLoader.load(url, (texture) => {
        selectedObject.material.map = texture;
        selectedObject.material.needsUpdate = true;
    });
});

function addWallFeature(type) {
    const material = new THREE.MeshBasicMaterial({ color: 0x8B5A2B });
    if (type === "Window") material.color.set(0x87CEEB);

    const feature = new THREE.Mesh(new THREE.PlaneGeometry(1, 2), material);
    feature.position.set(0, 1, -2.9); // Default back wall placement
    feature.userData.isMovable = true; // Allow dragging

    scene.add(feature);
    objects.push(feature);

    // Re-enable drag controls for new objects
    dragControls.dispose();
    dragControls = new THREE.DragControls(objects, camera, renderer.domElement);
}


function addTV() {
    const screenMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1), screenMaterial);

    screen.position.set(0, 1.5, -2.89); // Default placement on back wall
    screen.userData.isMovable = true; // Allow dragging
    screen.userData.isTV = true; // Mark as a TV

    scene.add(screen);
    objects.push(screen);

    // Re-enable drag controls for new objects
    dragControls.dispose();
    dragControls = new THREE.DragControls(objects, camera, renderer.domElement);
}


document.getElementById("applyTVMedia").addEventListener("click", () => {
    if (!selectedObject || !selectedObject.userData.isTV) {
        alert("Select the TV first!");
        return;
    }

    const fileInput = document.getElementById("tvUpload");
    const file = fileInput.files[0];

    if (!file) {
        alert("Please select a media file.");
        return;
    }

    const url = URL.createObjectURL(file);
    const textureLoader = new THREE.TextureLoader();

    if (file.type.startsWith("image")) {
        textureLoader.load(url, (texture) => {
            selectedObject.material.map = texture;
            selectedObject.material.needsUpdate = true;
        });
    } else if (file.type.startsWith("video")) {
        const video = document.createElement("video");
        video.src = url;
        video.loop = true;
        video.muted = true;
        video.play();

        const videoTexture = new THREE.VideoTexture(video);
        selectedObject.material.map = videoTexture;
        selectedObject.material.needsUpdate = true;
    }
});



document.getElementById("saveRoom").addEventListener("click", () => {
    const savedData = objects.map(obj => ({
        shape: obj.geometry.type,
        position: obj.position,
        rotation: obj.rotation,
        scale: obj.scale
    }));

    localStorage.setItem("savedRoom", JSON.stringify(savedData));
    alert("Room layout saved!");
});

document.getElementById("loadRoom").addEventListener("click", () => {
    const savedData = localStorage.getItem("savedRoom");

    if (!savedData) {
        alert("No saved room found!");
        return;
    }

    // Clear existing objects
    objects.forEach(obj => scene.remove(obj));
    objects.length = 0;

    const parsedData = JSON.parse(savedData);
    parsedData.forEach(data => {
        let obj;
        const material = new THREE.MeshStandardMaterial({ color: Math.random() * 0xffffff });

        if (data.shape === "SphereGeometry") obj = new THREE.Mesh(new THREE.SphereGeometry(0.2, 32, 32), material);
        else if (data.shape === "BoxGeometry") obj = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), material);
        else if (data.shape === "CylinderGeometry") obj = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.5, 32), material);
        else if (data.shape === "ConeGeometry") obj = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.5, 32), material);
        else if (data.shape === "TorusGeometry") obj = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.1, 16, 100), material);

        obj.position.copy(data.position);
        obj.rotation.copy(data.rotation);
        obj.scale.copy(data.scale);

        scene.add(obj);
        objects.push(obj);
    });

    alert("Room layout loaded!");
});


const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT_ID.firebaseio.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();


function syncObjects() {
    const objectData = objects.map(obj => ({
        shape: obj.geometry.type,
        position: obj.position,
        rotation: obj.rotation,
        scale: obj.scale
    }));

    database.ref("roomObjects").set(objectData);
}


database.ref("roomObjects").on("value", (snapshot) => {
    if (!snapshot.exists()) return;

    // Clear old objects
    objects.forEach(obj => scene.remove(obj));
    objects.length = 0;

    const data = snapshot.val();
    data.forEach(objData => {
        let obj;
        const material = new THREE.MeshStandardMaterial({ color: Math.random() * 0xffffff });

        if (objData.shape === "SphereGeometry") obj = new THREE.Mesh(new THREE.SphereGeometry(0.2, 32, 32), material);
        else if (objData.shape === "BoxGeometry") obj = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), material);
        else if (objData.shape === "CylinderGeometry") obj = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.5, 32), material);

        obj.position.copy(objData.position);
        obj.rotation.copy(objData.rotation);
        obj.scale.copy(objData.scale);

        scene.add(obj);
        objects.push(obj);
    });
});

document.addEventListener("keydown", (event) => {
    if (selectedObject) {
        if (event.key === "ArrowLeft") selectedObject.rotation.y -= 0.1;
        if (event.key === "ArrowRight") selectedObject.rotation.y += 0.1;
    }
});
document.getElementById("roomSize").addEventListener("input", (event) => {
    cube.scale.set(event.target.value, event.target.value, event.target.value);
});


function addStage() {
    const stage = new THREE.Mesh(
        new THREE.BoxGeometry(2, 0.3, 1), // Smaller stage to fit inside the room
        new THREE.MeshStandardMaterial({ color: 0xff0000 }) // Red color
    );
    stage.position.set(0, 0.15, -1); // Inside the room
    scene.add(stage);
    objects.push(stage);
}

function addPodium() {
    const podium = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 1, 0.5), // Small enough for the room
        new THREE.MeshStandardMaterial({ color: 0xff0000 }) // Red color
    );
    podium.position.set(0, 0.5, -1.2); // Positioned near the stage
    scene.add(podium);
    objects.push(podium);
}

function addScreen() {
    const screenMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 }); // Red color
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1), screenMaterial);
    screen.position.set(0, 1.5, -2.4); // On the back wall inside the room
    scene.add(screen);
    objects.push(screen);
}

// Button event listeners
document.getElementById("addStage").addEventListener("click", addStage);
document.getElementById("addPodium").addEventListener("click", addPodium);
document.getElementById("addScreen").addEventListener("click", addScreen);

// Handle media upload for screen
document.getElementById("applyScreenMedia").addEventListener("click", () => {
    const fileInput = document.getElementById("screenUpload");
    const file = fileInput.files[0];

    if (!file) {
        alert("Please select an image or video.");
        return;
    }

    const url = URL.createObjectURL(file);
    const loader = new THREE.TextureLoader();

    if (file.type.startsWith("image")) {
        loader.load(url, (texture) => {
            selectedObject.material.map = texture;
            selectedObject.material.needsUpdate = true;
        });
    } else if (file.type.startsWith("video")) {
        const video = document.createElement("video");
        video.src = url;
        video.loop = true;
        video.muted = true;
        video.play();

        const videoTexture = new THREE.VideoTexture(video);
        selectedObject.material.map = videoTexture;
        selectedObject.material.needsUpdate = true;
    }
});

// Button event listeners
document.getElementById("addStage").addEventListener("click", addStage);
document.getElementById("addPodium").addEventListener("click", addPodium);
document.getElementById("addScreen").addEventListener("click", addScreen);

const eventLight = new THREE.PointLight(0xffffff, 1, 10);
eventLight.position.set(0, 3, 0);
scene.add(eventLight);

document.getElementById("lightColor").addEventListener("input", (event) => {
    eventLight.color.set(event.target.value);
});

document.getElementById("lightIntensity").addEventListener("input", (event) => {
    eventLight.intensity = parseFloat(event.target.value);
});

// Flickering Light Effect
let flickering = false;
function flickerEffect() {
    if (!flickering) return;
    eventLight.intensity = 0.8 + Math.random() * 0.4;
    setTimeout(flickerEffect, 200);
}

document.getElementById("toggleFlicker").addEventListener("click", () => {
    flickering = !flickering;
    if (flickering) flickerEffect();
});

// Floor Texture Upload
document.getElementById("floorTextureUpload").addEventListener("change", (event) => {
    const file = event.target.files[0];

    if (!file) {
        alert("Please select an image.");
        return;
    }

    const url = URL.createObjectURL(file);
    const loader = new THREE.TextureLoader();

    loader.load(url, (texture) => {
        const floor = new THREE.Mesh(
            new THREE.PlaneGeometry(10, 10),
            new THREE.MeshStandardMaterial({ map: texture })
        );
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = 0;
        scene.add(floor);
    });
});

window.addEventListener("touchstart", (event) => {
    const touch = event.touches[0];
    const mouse = new THREE.Vector2(
        (touch.clientX / window.innerWidth) * 2 - 1,
        -(touch.clientY / window.innerHeight) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(objects);

    if (intersects.length > 0) {
        selectedObject = intersects[0].object;
    }
});


dragControls.addEventListener('dragend', (event) => {
    const gridSize = 0.5; // Snap objects to nearest 0.5 unit
    event.object.position.x = Math.round(event.object.position.x / gridSize) * gridSize;
    event.object.position.y = Math.round(event.object.position.y / gridSize) * gridSize;
    event.object.position.z = Math.round(event.object.position.z / gridSize) * gridSize;
});


let lastTap = 0;
window.addEventListener("touchstart", (event) => {
    const now = new Date().getTime();
    if (now - lastTap < 300 && selectedObject) {
        scene.remove(selectedObject);
        objects.splice(objects.indexOf(selectedObject), 1);
        selectedObject = null;
    }
    lastTap = now;
});



database.ref("roomObjects").on("value", (snapshot) => {
    if (!snapshot.exists()) return;
    objects.forEach(obj => scene.remove(obj)); // Clear old objects
    objects.length = 0;

    const data = snapshot.val();
    data.forEach(objData => {
        let obj;
        const material = new THREE.MeshStandardMaterial({ color: objData.color || 0xffffff });

        if (objData.shape.includes("Sphere")) obj = new THREE.Mesh(new THREE.SphereGeometry(0.2, 32, 32), material);
        else if (objData.shape.includes("Box")) obj = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), material);
        else if (objData.shape.includes("Cylinder")) obj = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.5, 32), material);

        obj.position.copy(objData.position);
        obj.rotation.copy(objData.rotation);
        obj.scale.copy(objData.scale);
        scene.add(obj);
        objects.push(obj);
    });
});


const clickSound = new Audio("sounds/click.mp3");
window.addEventListener("click", () => {
    clickSound.play();
});

