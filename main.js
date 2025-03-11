

let selectedStage = null;

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
    new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.BackSide }) // <-- Use BackSide so it's visible inside
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



dragControls.addEventListener('dragend', (event) => {
    controls.enabled = true;

    // Snapping logic (round to nearest 0.5)
    const gridSize = 0.5;
    event.object.position.x = Math.round(event.object.position.x / gridSize) * gridSize;
    event.object.position.y = Math.round(event.object.position.y / gridSize) * gridSize;
    event.object.position.z = Math.round(event.object.position.z / gridSize) * gridSize;
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
    objects.forEach((obj, index) => {
        const objectData = {
            shape: obj.geometry.type,
            position: obj.position,
            rotation: obj.rotation,
            scale: obj.scale
        };

        database.ref(`roomObjects/object_${index}`).set(objectData);
    });
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
    console.log("🔹 addStage() function called!");

    const material = new THREE.MeshStandardMaterial({ color: 0x8B0000 });

    // ✅ Create the Stage (Width, Height, Depth)
    let newStage = new THREE.Mesh(
        new THREE.BoxGeometry(2, 0.3, 1),
        material
    );

    console.log("🛠️ Stage object created:", newStage);

    // ✅ Ensure the stage is inside the cube
    newStage.position.set(0, 0.15, 0); // Center of the cube

    // ✅ Add the stage to the scene and objects array
    scene.add(newStage);
    objects.push(newStage);

    // ✅ Assign newStage to the global selectedStage variable
    selectedStage = newStage;

    console.log("✅ selectedStage updated:", selectedStage);

    // ✅ Ensure it's movable
    selectedStage.userData.isMovable = true;

    // ✅ Re-enable Drag Controls for new objects
    dragControls.dispose();
    dragControls = new THREE.DragControls(objects, camera, renderer.domElement);
}

// ✅ Attach Function to Button
document.getElementById("addStage").addEventListener("click", addStage);

selectedStage.position.set(0, 0.5, 0); // Move it higher
selectedStage.material = new THREE.MeshBasicMaterial({ color: 0xff0000 }); // Bright red color

selectedStage.position.set(0, 0, 0); // Move to the exact center
const material = new THREE.MeshBasicMaterial({ color: 0xff0000 }); // Bright red



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

function openMenu() {
    document.getElementById("side-menu").style.left = "0"; // Slide menu in
}

function closeMenu() {
    document.getElementById("side-menu").style.left = "-250px"; // Slide menu out
}
document.addEventListener("click", (event) => {
    const menu = document.getElementById("side-menu");
    const menuButton = document.getElementById("menu-button");

    // If the click is outside the menu and not on the button, close it
    if (!menu.contains(event.target) && event.target !== menuButton) {
        closeMenu();
    }
});



document.getElementById("applyTVMedia").addEventListener("click", () => {
    let tvObject = selectedObject?.userData?.isTV ? selectedObject : objects.find(o => o.userData?.isTV);
    
    if (!tvObject) {
        alert("No TV found! Add a TV first.");
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
            tvObject.material.map = texture;
            tvObject.material.needsUpdate = true;
        });
    } else if (file.type.startsWith("video")) {
        const video = document.createElement("video");
        video.src = url;
        video.loop = true;
        video.muted = true;
        video.play();

        const videoTexture = new THREE.VideoTexture(video);
        tvObject.material.map = videoTexture;
        tvObject.material.needsUpdate = true;
    }
});



document.getElementById("addImage3D").addEventListener("click", function () {
    const fileInput = document.getElementById("imageUpload");
    const file = fileInput.files[0];
    const objectType = document.getElementById("objectType").value; // Selected shape

    if (!file) {
        alert("Please select an image first.");
        return;
    }

    const url = URL.createObjectURL(file); // Convert to a usable URL
    const loader = new THREE.TextureLoader();

    loader.load(url, (texture) => {
        let geometry;

        // ✅ Choose the geometry based on user selection
        if (objectType === "box") {
            geometry = new THREE.BoxGeometry(1, 1, 1); // Cube
        } else if (objectType === "sphere") {
            geometry = new THREE.SphereGeometry(0.5, 32, 32); // Sphere
        } else if (objectType === "cylinder") {
            geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 32); // Cylinder
        }

        // ✅ Create a 3D object with the uploaded image as texture
        const imageObject = new THREE.Mesh(
            geometry,
            new THREE.MeshStandardMaterial({ map: texture }) // Apply image texture
        );

        // ✅ Position the object in the scene
        imageObject.position.set(0, 1, -1.5); // Adjust position
        imageObject.userData.isMovable = true; // Mark as movable

        // ✅ Add to the scene & objects array
        scene.add(imageObject);
        objects.push(imageObject);

        // ✅ Re-enable Drag Controls for the new object
        dragControls.dispose();
        dragControls = new THREE.DragControls(objects, camera, renderer.domElement);
    });
});
