import React, { useEffect, useState } from "react";
import * as THREE from "three";
import "./App.css";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import alphaMap from "./textures/earth/Earth_Diffuse_6K.jpg";
import normalMap from "./textures/earth/Earth_NormalNRM_6K.jpg";
import ambientOcclusionMap from "./textures/earth/Earth_Glossiness_6K.jpg";
import * as dat from "dat.gui";
const App = () => {
  const [image, setImage] = useState("");
  const [temp, setTemp] = useState("");
  const [city, setCity] = useState("Rennes");
  const [input, setInput] = useState("");
  const [lat, setLat] = useState(48.1667);
  const [lon, setLon] = useState(-1.6667);

  const logo = "https://openweathermap.org/img/w/" + image + ".png";
  const tempFinal = Math.round(temp);

  const sphereCity = new THREE.Mesh(
    new THREE.SphereGeometry(0.03, 32, 32),
    new THREE.MeshStandardMaterial({ roughness: 0.7, color: "red" })
  );

  //const cityFinal = city.charAt(0).toUpperCase() + city.slice(1);

  async function fetchData() {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${input}&lang=fr&units=metric&appid=2948eccdc30baaeb3ad5a74151b84eb1`
    );
    const json = await response.json();
    setLat(json.coord.lat);
    setLon(json.coord.lon);
    if (json.message === "city not found") {
      setTemp(null);
      setImage(null);
    } else {
      setTemp(json.main.temp);
      setImage(json.weather[0].icon);
    }
  }

  useEffect(() => {
    //const gui = new dat.GUI();
    const canvas = document.querySelector("canvas.webgl");
    const scene = new THREE.Scene();

    const loadingManager = new THREE.LoadingManager();
    const textureLoader = new THREE.TextureLoader(loadingManager);
    const normalTexture = textureLoader.load(normalMap);
    const alphaTexture = textureLoader.load(alphaMap);
    const ambientOcclusionTexture = textureLoader.load(ambientOcclusionMap);

    // Temporary sphere
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(3, 50, 50),
      new THREE.MeshStandardMaterial({
        roughness: 0.7,
        map: alphaTexture,
        aoMap: ambientOcclusionTexture,
        normalMap: normalTexture,
      })
    );
    scene.add(sphere);
    scene.add(sphereCity);

    /**
     * Lights
     */
    // Ambient light
    const ambientLight = new THREE.AmbientLight("#ffffff", 2);
    //gui.add(ambientLight, "intensity").min(0).max(1).step(0.001);
    scene.add(ambientLight);

    // Directional light
    const moonLight = new THREE.DirectionalLight("#ffffff", 1.5);
    //gui.add(moonLight, "intensity").min(0).max(2).step(0.001);
    //gui.add(moonLight.position, "x").min(-5).max(5).step(0.001);
    //gui.add(moonLight.position, "y").min(-5).max(5).step(0.001);
    //gui.add(moonLight.position, "z").min(-5).max(5).step(0.001);

    /**
     * Sizes
     */
    const sizes = {
      width: window.innerWidth,
      height: window.innerHeight,
    };

    window.addEventListener("resize", () => {
      // Update sizes
      sizes.width = window.innerWidth;
      sizes.height = window.innerHeight;

      // Update camera
      camera.aspect = sizes.width / sizes.height;
      camera.updateProjectionMatrix();

      // Update renderer
      renderer.setSize(sizes.width, sizes.height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    });

    /**
     * Camera
     */
    // Base camera
    const camera = new THREE.PerspectiveCamera(
      10,
      sizes.width / sizes.height,
      0.1,
      100
    );
    camera.position.set(2, 2, 2);
    scene.add(camera);

    // Controls
    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;

    /**
     * Calcul de la position vec3 à partir des coordonnées long lat
     */
    function calcPosFromLatLonRad() {
      let phi = (90 - lat) * (Math.PI / 180);
      let theta = (lon + 180) * (Math.PI / 180);
      let x = -(3 * Math.sin(phi) * Math.cos(theta));
      let z = 3 * Math.sin(phi) * Math.sin(theta);
      let y = 3 * Math.cos(phi);

      return { x, y, z };
    }

    function createSphere() {
      const { x, y, z } = calcPosFromLatLonRad();
      sphereCity.position.set(x, y, z);
      camera.position.set(x * 8, y * 8, z * 8);
      moonLight.position.set(x, y, z);
      scene.add(moonLight);
    }

    createSphere();
    /**
     * Renderer
     */
    const renderer = new THREE.WebGLRenderer({
      canvas: canvas,
    });
    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    /**
     * Animate
     */
    const clock = new THREE.Clock();

    const tick = () => {
      const elapsedTime = clock.getElapsedTime();

      // Update controls
      controls.update();

      // Render
      renderer.render(scene, camera);

      // Call tick again on the next frame
      window.requestAnimationFrame(tick);
    };

    tick();
  }, [lon, lat]);

  return (
    <div>
      <canvas className="webgl"></canvas>
      <div className="form">
        <div className="inputLink">
          <input
            id="inputweather"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            type="text"
            placeholder="City..."
          />
          <button
            onClick={(e) => {
              e.preventDefault();
              fetchData();
            }}
          >
            GO
          </button>
        </div>
      </div>
      <div id="temperature" className="temperature">
        <img src={logo} alt="" />
        <h3>
          {tempFinal}
          <span id="span">°C</span>
        </h3>
      </div>
    </div>
  );
};

export default App;
