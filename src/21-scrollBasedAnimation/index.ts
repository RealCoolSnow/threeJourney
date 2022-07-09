import * as THREE from 'three'
import './style.css'
import * as dat from 'lil-gui'
import stats from '../common/stats'
import { listenResize, dbClkfullScreen } from '../common/utils'

/**
 * Debug
 */
const parameters = {
  materialColor: '#ffffff',
}

// Canvas
const canvas = document.querySelector('#mainCanvas') as HTMLCanvasElement

// Scene
const scene = new THREE.Scene()

// Size
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
}

const objectsDistance = 5

// Group
const cameraGroup = new THREE.Group()
scene.add(cameraGroup)
// Camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.set(0, 0, 4)
cameraGroup.add(camera)

/**
 * Objects
 */
// Texture
const textureLoader = new THREE.TextureLoader()
const gradientTexture = textureLoader.load(
  'https://gw.alicdn.com/imgextra/i1/O1CN01Kv3xWT1kImpSDZI8n_!!6000000004661-0-tps-5-1.jpg'
)
gradientTexture.magFilter = THREE.NearestFilter

// Material
const material = new THREE.MeshToonMaterial({
  color: parameters.materialColor,
  gradientMap: gradientTexture,
})

// Meshes
const mesh1 = new THREE.Mesh(new THREE.TorusGeometry(1, 0.4, 16, 60), material)
const mesh2 = new THREE.Mesh(new THREE.ConeGeometry(1, 2, 32), material)
const mesh3 = new THREE.Mesh(new THREE.TorusKnotGeometry(0.8, 0.35, 100, 16), material)

scene.add(mesh1, mesh2, mesh3)

const sectionMeshes: THREE.Mesh<THREE.BufferGeometry, THREE.MeshToonMaterial>[] = [
  mesh1,
  mesh2,
  mesh3,
]

sectionMeshes.forEach((item, index) => {
  item.position.setY(-objectsDistance * index)
  item.position.setX(index % 2 === 0 ? 2 : -2)
})

/**
 * Lights
 */
const directionalLight = new THREE.DirectionalLight('#ffffff', 1)
directionalLight.position.set(1, 1, 0)
scene.add(directionalLight)

const ambientLight = new THREE.AmbientLight('#ffffff', 0.28)
scene.add(ambientLight)

// Renderer
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

listenResize(sizes, camera, renderer)
dbClkfullScreen(document.documentElement)

/**
 * Scroll
 */
let { scrollY } = window
window.addEventListener('scroll', () => {
  scrollY = window.scrollY
})

/**
 * Mouse
 */
const mouse: {
  x: number | null
  y: number | null
} = { x: null, y: null }

window.addEventListener('mousemove', (event) => {
  mouse.x = (event.clientX / sizes.width) * 2 - 1
  mouse.y = -(event.clientY / sizes.height) * 2 + 1
})

// Animations
const clock = new THREE.Clock()
const tick = () => {
  stats.begin()

  const elapsedTime = clock.getElapsedTime()
  // Animate meshes
  sectionMeshes.forEach((mesh) => {
    mesh.rotation.set(elapsedTime * 0.1, elapsedTime * 0.12, 0)
  })

  // animate camera
  camera.position.setY((-scrollY / sizes.height) * objectsDistance)

  if (mouse.x && mouse.y) {
    cameraGroup.position.setX(mouse.x)
    cameraGroup.position.setY(mouse.y)
  }

  // Render
  renderer.render(scene, camera)
  stats.end()
  requestAnimationFrame(tick)
}

tick()

const gui = new dat.GUI()
gui.addColor(parameters, 'materialColor').onChange(() => {
  material.color.set(parameters.materialColor)
})