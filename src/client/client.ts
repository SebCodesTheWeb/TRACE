import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

const scene = new THREE.Scene()

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
camera.position.z = 20
camera.position.y = 20
camera.position.x = 20

const renderer = new THREE.WebGLRenderer()
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

const controls = new OrbitControls(camera, renderer.domElement)
controls.maxDistance = 500
controls.minDistance = 10

const gridHelper = new THREE.GridHelper(500, 100)
scene.add(gridHelper)

const ambientLight = new THREE.AmbientLight(0xffffff)
scene.add(ambientLight)

for(let i = 0; i < 100; i++) {
    addStar()
}

const groundGeometry = new THREE.BoxGeometry( 1000, 1000, 2 );
const groundTexture = new THREE.TextureLoader().load('img/snow-texture/snow.jpg')
const groundNormalTexture = new THREE.TextureLoader().load('img/snow-texture/snow-normal.jpg')
const ground = new THREE.Mesh( groundGeometry, 
    new THREE.MeshStandardMaterial({
        map: groundTexture,
        normalMap: groundNormalTexture,
    })
)

ground.rotation.x = Math.PI / 2
scene.add( ground );


scene.background = new THREE.CubeTextureLoader()
	.setPath( 'img/skybox-3/' )
	.load( [
		'front.png',
		'back.png',
		'up.png',
		'down.png',
		'right.png',
		'left.png'
	] );

const moonTexture = new THREE.TextureLoader().load('img/moon.jpeg')
const moonNormal = new THREE.TextureLoader().load('img/normal.jpeg')
const moon = new THREE.Mesh(
    new THREE.SphereGeometry(3, 32, 32),
    new THREE.MeshStandardMaterial({
        map: moonTexture,
        normalMap: moonNormal,
    })
)
moon.position.y =  4
scene.add(moon)

function addStar() {
    const geometry = new THREE.SphereGeometry(0.25, 24, 24)
    const material = new THREE.MeshStandardMaterial({
        color: 0xffffff,
    })
    const star = new THREE.Mesh(geometry, material)

    const [x, y, z] = getRandomCoordinates()
    star.position.set(x, y, z)
    scene.add(star)
}

function getRandomCoordinates() {
    const x = THREE.MathUtils.randFloatSpread(200)
    const y = THREE.MathUtils.randFloatSpread(200)
    const z = THREE.MathUtils.randFloatSpread(200)
    return [x, y + 100, z]
} 

window.addEventListener('resize', onWindowResize, false)
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
    render()
}

function animate() {
    requestAnimationFrame(animate)
    controls.update()
    render()
}

function render() {
    renderer.render(scene, camera)
}

animate()
