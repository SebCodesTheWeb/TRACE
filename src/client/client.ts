import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
const data = require('./data.json')

const scene = new THREE.Scene()

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
camera.position.set(50, 50, 50)

const renderer = new THREE.WebGLRenderer()
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

const controls = new OrbitControls(camera, renderer.domElement)
controls.maxDistance = 600 
controls.minDistance = 10

const gridHelperZ = new THREE.GridHelper(1000, 50, 0xffffff, 0xffffff)
gridHelperZ.rotation.z = Math.PI / 2
scene.add(gridHelperZ)
const gridHelperX = new THREE.GridHelper(1000, 50, 0xffffff, 0xffffff)
gridHelperX.rotation.z = Math.PI / 2
gridHelperX.rotation.y = Math.PI / 2
scene.add(gridHelperX)
console.log(gridHelperZ.material)

const ambientLight = new THREE.AmbientLight(0xffffff)
scene.add(ambientLight)

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

const loader = new GLTFLoader();

loader.load( '3d/rocket.glb', function ( rocket ) {
    rocket.scene.scale.set(5, 5, 5)
    rocket.scene.position.y = -1
	scene.add( rocket.scene );
}, undefined, function ( error ) {
	console.error( error );
} );

const numberOfSnowFlakes = 100
const positions: number[][] = []
for(let i = 0; i < numberOfSnowFlakes; i++) {
    positions.push(getRandomCoordinates()) 
}
function updateSnowFlakePosition() {
    for(let i = 0; i < numberOfSnowFlakes; i++) {
        positions[i] = [positions[i][0] + 1, positions[i][1] + 1, positions[i][2] + 1]
    }
}
function renderSnowFlakes() {
    for(let i = 0; i < numberOfSnowFlakes; i++) {
    const geometry = new THREE.SphereGeometry(0.25, 24, 24)
    const material = new THREE.MeshStandardMaterial({
        color: 0xffffff,
    })
    const snowFlake = new THREE.Mesh(geometry, material)
    snowFlake.position.set(positions[i][0], positions[i][1], positions[i][2])
    scene.add(snowFlake)
    }
}
renderSnowFlakes()

function addTree() {
    const [x,, z] = getRandomCoordinates(500)
    loader.load( '3d/tree.glb', function ( tree ) {
        tree.scene.position.set(x, 0, z)
        tree.scene.scale.set(3, 3, 3)
        scene.add( tree.scene );
    }, undefined, function ( error ) {
        console.error( error );
    } );
}

for(let i = 0; i < 30; i++) {
    addTree()
}

function getRandomCoordinates(spread=200) {
    const x = THREE.MathUtils.randFloatSpread(spread)
    const y = THREE.MathUtils.randFloatSpread(spread)
    const z = THREE.MathUtils.randFloatSpread(spread)
    return [x, y + 100, z]
} 

function displayData() {
    for(let i = 0; i < data.length; i++) {
        const geometry = new THREE.SphereGeometry(1, 24, 24)
        const material = new THREE.MeshStandardMaterial({
            color: 0xFF8000,
        })
        const point = new THREE.Mesh(geometry, material)
        point.position.set(data[i].x, data[i].y, data[i].z)
        scene.add(point)
    }
}
displayData()

const material = new THREE.LineBasicMaterial( {
     linewidth: 10,
     color: 0x00ff00,
    } )
const points = []
for(let i = 0; i < data.length; i++) {
    points.push(new THREE.Vector3(data[i].x, data[i].y, data[i].z))
}
const geometry = new THREE.BufferGeometry().setFromPoints( points )
const line = new THREE.Line( geometry, material );
scene.add(line)

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
