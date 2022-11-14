/* eslint-disable no-param-reassign */
import * as THREE from 'three'
import './style.css'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import * as dat from 'lil-gui'
import * as CANNON from 'cannon-es'
import CannonDebugger from 'cannon-es-debugger'
import stats from '../common/stats'
import { listenResize } from '../common/utils'

// Canvas
const canvas = document.querySelector('#mainCanvas') as HTMLCanvasElement

// Scene
const scene = new THREE.Scene()

// Gui
const gui = new dat.GUI()

// Size
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
}

// Camera
const camera = new THREE.PerspectiveCamera(20, sizes.width / sizes.height, 0.1, 1000)
camera.position.set(5, 50, 150)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true
controls.zoomSpeed = 0.3
controls.target.set(5, 10, 0)

// const axesHelper = new THREE.AxesHelper(5)
// scene.add(axesHelper)

/**
 * Environment map
 */
// const cubeTextureLoader = new THREE.CubeTextureLoader()
// const environmentMap = cubeTextureLoader.load([
//   '../assets/textures/environmentMaps/3/px.jpg',
//   '../assets/textures/environmentMaps/3/nx.jpg',
//   '../assets/textures/environmentMaps/3/py.jpg',
//   '../assets/textures/environmentMaps/3/ny.jpg',
//   '../assets/textures/environmentMaps/3/pz.jpg',
//   '../assets/textures/environmentMaps/3/nz.jpg',
// ])

// environmentMap.encoding = THREE.sRGBEncoding

/**
 * Objects
 */
// material
const materialPlane = new THREE.MeshStandardMaterial({
  metalness: 0.4,
  roughness: 0.5,
  color: '#90A4AE',
  // envMap: environmentMap,
  // envMapIntensity: 1,
})

// sphere
// const sphere = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 16), material)
// sphere.position.setY(1)
// sphere.castShadow = true
// scene.add(sphere)

// plane
const plane = new THREE.Mesh(new THREE.PlaneGeometry(150, 150), materialPlane)
plane.rotateX(-Math.PI / 2)
plane.receiveShadow = true
scene.add(plane)

/**
 * Light
 */
const directionLight = new THREE.DirectionalLight('#ffffff', 1)
directionLight.castShadow = true
directionLight.shadow.camera.top = 50
directionLight.shadow.camera.right = 50
directionLight.shadow.camera.bottom = -50
directionLight.shadow.camera.left = -50
directionLight.shadow.camera.near = 1
directionLight.shadow.camera.far = 200
directionLight.shadow.mapSize.set(2048, 2048)
const directionalLightCameraHelper = new THREE.CameraHelper(directionLight.shadow.camera)
directionalLightCameraHelper.visible = false
scene.add(directionalLightCameraHelper)

directionLight.position.set(-50, 80, 60)
const ambientLight = new THREE.AmbientLight(new THREE.Color('#ffffff'), 3)
scene.add(ambientLight, directionLight)

const directionLightHelper = new THREE.DirectionalLightHelper(directionLight, 2)
directionLightHelper.visible = false
scene.add(directionLightHelper)

// Renderer
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.physicallyCorrectLights = true
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap

/**
 * Sounds
 */
const hitSound = new Audio('../assets/sounds/hit.mp3')
const playHitSound = (collision: { contact: CANNON.ContactEquation }) => {
  const impactStrength = collision.contact.getImpactVelocityAlongNormal()
  if (impactStrength > 1.5) {
    hitSound.volume = Math.random()
    hitSound.currentTime = 0
    hitSound.play()
  }
}

/**
 * Physics
 */
const world = new CANNON.World()
world.gravity.set(0, -10, 0)

const floorMaterial = new CANNON.Material('floorMaterial')
const defaultMaterial = new CANNON.Material('default')
const defaultContactMaterial = new CANNON.ContactMaterial(defaultMaterial, defaultMaterial, {
  friction: 0.01,
  restitution: 0.3,
})
const floorContactMaterial = new CANNON.ContactMaterial(floorMaterial, defaultMaterial, {
  friction: 0.9,
  restitution: 0.6,
})
world.addContactMaterial(defaultContactMaterial)
world.addContactMaterial(floorContactMaterial)

const guiObj = {
  // drop() {
  //   sphereBody.position = new CANNON.Vec3(0, 4, 0)
  // },
  CannonDebugger: false,
  start: () => {},
}

// floor
const floorShape = new CANNON.Plane()
const floorBody = new CANNON.Body({
  type: CANNON.Body.STATIC,
  shape: floorShape,
  material: floorMaterial,
})
floorBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2)
world.addBody(floorBody)

const dominoeDepth = 0.2
const dominoeHeight = 3
const dominoeWidth = 1.5

const objectsToUpdate: Array<{
  mesh: THREE.Mesh
  body: CANNON.Body
}> = []

const addOneDominoe = (x: number, y: number, z: number) => {
  const dominoe = new THREE.Mesh(
    new THREE.BoxGeometry(dominoeDepth, dominoeHeight, dominoeWidth),
    new THREE.MeshStandardMaterial({
      metalness: 0.3,
      roughness: 0.8,
      // color: '#37474F',
      // envMap: environmentMap,
      // envMapIntensity: 1,
    })
  )
  dominoe.position.set(x, y, z)
  dominoe.castShadow = true
  dominoe.receiveShadow = true
  scene.add(dominoe)

  // Cannon body
  const shape = new CANNON.Box(
    new CANNON.Vec3(dominoeDepth * 0.5, dominoeHeight * 0.5, dominoeWidth * 0.5)
  )
  const body = new CANNON.Body({
    mass: 0.2,
    shape,
    material: defaultMaterial,
  })
  // @ts-ignore
  body.position.copy(dominoe.position)
  world.addBody(body)
  objectsToUpdate.push({
    mesh: dominoe,
    body,
  })
  body.addEventListener('collide', playHitSound)
}

const addLine = ({ gap }: { gap: number }) => {
  for (let i = 0; i < 20; i += 1) {
    addOneDominoe((i * dominoeHeight) / 2, dominoeHeight / 2, gap)
  }
}

for (let i = 0; i < 10; i += 1) {
  addLine({
    gap: 1.5 * dominoeWidth * i,
  })
}

const addTriangle = () => {
  for (let row = 0; row < 9; row += 1) {
    for (let i = 0; i <= row; i += 1) {
      addOneDominoe(
        (-dominoeHeight / 2) * (9 - row),
        dominoeHeight / 2,
        1.5 * dominoeWidth * i + dominoeWidth * 0.8 * (9 - row)
      )
    }
  }

  // start line
  for (let i = 0; i < 10; i += 1) {
    addOneDominoe(
      (-dominoeHeight / 2) * 10 - (i * dominoeHeight) / 2,
      dominoeHeight / 2,
      dominoeWidth * 0.8 * 9
    )
  }
}

addTriangle()

// console.log(scene);
// console.log(world)
// world.removeBody(world.bodies[1])
guiObj.start = () => {
  world.bodies[world.bodies.length - 1].applyForce(
    new CANNON.Vec3(30, 0, 0),
    new CANNON.Vec3(0, 0, 0)
  )
}

// cannonDebugger
const cannonMeshes: THREE.Mesh[] = []
const cannonDebugger = CannonDebugger(scene, world, {
  onInit(body, mesh) {
    mesh.visible = false
    cannonMeshes.push(mesh)
  },
})
gui
  .add(guiObj, 'CannonDebugger')
  .name('CannonDebugger mesh visible')
  .onChange((value: boolean) => {
    if (value) {
      cannonMeshes.forEach((item) => {
        item.visible = true
      })
    } else {
      cannonMeshes.forEach((item) => {
        item.visible = false
      })
    }
  })

// Animations
const tick = () => {
  stats.begin()
  controls.update()
  world.fixedStep()
  cannonDebugger.update() // Update the CannonDebugger meshes

  objectsToUpdate.forEach((object) => {
    // @ts-ignore
    object.mesh.position.copy(object.body.position)
    // @ts-ignore
    object.mesh.quaternion.copy(object.body.quaternion)
  })

  // Render
  renderer.render(scene, camera)
  stats.end()
  requestAnimationFrame(tick)
}

tick()

listenResize(sizes, camera, renderer)
// dbClkfullScreen(document.documentElement)

/**
 * Debug
 */

// gui.add(controls, 'autoRotate')
// gui.add(controls, 'autoRotateSpeed', 0.1, 10, 0.01)
// gui.add(materialPlane, 'wireframe')
gui.add(directionLightHelper, 'visible').name('directionLightHelper visible')
gui.add(directionalLightCameraHelper, 'visible').name('directionalLightCameraHelper visible')

gui.add(guiObj, 'start')
