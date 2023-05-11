import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { GUI } from 'dat.gui'

let acceleration = [0, 0, 0]
let velocityCount = [0, 0, 0]
let position = [0, 0, 0]
let trackedPositions: number[][] = []
let pathRenderCompleted = false
let averageOffset = [0, 0, 0]
let animationPlaying = false

const INITIAL_ROCKET_VELOCITY = 0.4

let data = require('./data.json')
function csvToJson(str: any, delimiter = ',') {
    const headers = str.slice(0, str.indexOf('\n')).split(delimiter)
    const rows = str.slice(str.indexOf('\n') + 1).split('\n')
    const arr = rows.map(function (row: any) {
        const values = row.split(delimiter)
        const el = headers.reduce(function (object: any, header: any, index: any) {
            object[header] = parseFloat(values[index])
            return object
        }, {})
        return el
    })

    arr.pop()
    return [...arr]
}

const myForm = document.getElementById('csv-form')
const csvFile: any = document.getElementById('uploadFile')

fetch('https://space-voyage-data-api.onrender.com/data/1', {
    method: 'GET',
    headers: {
        Accept: 'text/plain',
    },
})
    .then((response) => {
        return response.text()
    })
    .then((txt) => {
        data = csvToJson(txt)
        averageOffset = calibrateSensor(data)
        plotPath(data)
    })
    .catch((error) => {
        console.log('There was a problem with the fetch operation: ' + error.message)
    })

myForm?.addEventListener('submit', function (e) {
    e.preventDefault()
    const input = csvFile?.files[0]
    const reader = new FileReader()
    reader.onload = function (event) {
        const text = event?.target?.result
        data = csvToJson(text)
        averageOffset = calibrateSensor(data)
        plotPath(data)
    }
    reader.readAsText(input)
})

function calibrateSensor(data: any) {
    let averageX = 0
    let averageY = 0
    let averageZ = 0
    for (let i = 0; i < 100; i++) {
        averageX += data[i][' x']
        averageY += data[i][' y']
        averageZ += data[i][' z']
    }
    return [averageX / 100, averageY / 100, averageZ / 100]
}

const mouse = new THREE.Vector2()
const raycaster = new THREE.Raycaster()

const scene = new THREE.Scene()

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
camera.position.set(25, 100, 25)

const renderer = new THREE.WebGLRenderer()
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

const controls = new OrbitControls(camera, renderer.domElement)
controls.maxDistance = 800
controls.minDistance = 10
controls.maxPolarAngle = (Math.PI / 2) * 0.99

const gridHelperZ = new THREE.GridHelper(1000, 50, 0xffffff, 0xffffff)
gridHelperZ.rotation.z = Math.PI / 2
scene.add(gridHelperZ)
const gridHelperX = new THREE.GridHelper(1000, 50, 0xffffff, 0xffffff)
gridHelperX.rotation.z = Math.PI / 2
gridHelperX.rotation.y = Math.PI / 2
scene.add(gridHelperX)

const ambientLight = new THREE.AmbientLight(0xffffff)
scene.add(ambientLight)

const groundGeometry = new THREE.BoxGeometry(1000, 1000, 2)
const groundTexture = new THREE.TextureLoader().load('img/snow-texture/snow.jpg')
const groundNormalTexture = new THREE.TextureLoader().load('img/snow-texture/snow-normal.jpg')
const ground = new THREE.Mesh(
    groundGeometry,
    new THREE.MeshStandardMaterial({
        map: groundTexture,
        normalMap: groundNormalTexture,
    })
)

ground.rotation.x = Math.PI / 2
ground.position.y = -1
scene.add(ground)

scene.background = new THREE.CubeTextureLoader()
    .setPath('img/skybox-3/')
    .load(['front.png', 'back.png', 'up.png', 'down.png', 'right.png', 'left.png'])

const loader = new GLTFLoader()

let rocketModel: any
loader.load(
    '3d/raket1.glb',
    function (rocket) {
        rocketModel = rocket.scene
        rocket.scene.scale.set(0.5, 0.5, 0.5)
        rocket.scene.position.y = -1
        scene.add(rocket.scene)
    },
    undefined,
    function (error) {
        console.error(error)
    }
)

const numberOfSnowFlakes = 100
const positions: number[][] = []
for (let i = 0; i < numberOfSnowFlakes; i++) {
    positions.push(getRandomCoordinates())
}
function updateSnowFlakePosition() {
    for (let i = 0; i < numberOfSnowFlakes; i++) {
        positions[i] = [positions[i][0] + 1, positions[i][1] + 1, positions[i][2] + 1]
    }
}
function renderSnowFlakes() {
    for (let i = 0; i < numberOfSnowFlakes; i++) {
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
    const [x, , z] = getRandomCoordinates(500)
    loader.load(
        '3d/tree-6.glb',
        function (tree) {
            tree.scene.position.set(x, 0, z)
            tree.scene.scale.set(1.5, 1.5, 1.5)
            scene.add(tree.scene)
        },
        undefined,
        function (error) {
            console.error(error)
        }
    )
}

for (let i = 0; i < 30; i++) {
    addTree()
}

function getRandomCoordinates(spread = 200) {
    const x = THREE.MathUtils.randFloatSpread(spread)
    const y = THREE.MathUtils.randFloatSpread(spread)
    const z = THREE.MathUtils.randFloatSpread(spread)
    return [x, y + 100, z]
}

function onMouseMove(event: any) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1
}

let selectedPoint: THREE.Vector3 | undefined = undefined
function hoverDataPoint() {
    raycaster.setFromCamera(mouse, camera)
    const intersects = raycaster.intersectObjects(scene.children)
    if (intersects.length > 0) {
        selectedPoint = intersects[0].object.position
    }
}

let selectedIndex: number | null
function findSelectedData() {
    if (selectedPoint) {
        for (let i = 0; i < trackedPositions.length; i++) {
            if (
                trackedPositions[i][0] === selectedPoint.x &&
                trackedPositions[i][1] === selectedPoint.y &&
                trackedPositions[i][2] === selectedPoint.z
            ) {
                selectedIndex = i
            }
        }
    }
}

function pointsClose(point1: number[], point2: number[]) {
    const x = point1[0] - point2[0]
    const y = point1[1] - point2[1]
    const z = point1[2] - point2[2]
    const length = Math.sqrt(x * x + y * y + z * z)
    return length < 1
}

window.addEventListener('resize', onWindowResize, false)
window.addEventListener('click', onMouseMove, false)
window.addEventListener('load', () => {
    setTimeout(() => {
        animate()
        const loader = document.querySelector('.loader')
        if (loader) loader.innerHTML = ''
        else throw new Error('Loader not found')
        const infobox = document.getElementById('info-box')
        if (infobox) infobox.style.visibility = 'visible'
        else throw new Error('Infobox not found')
    }, 250)
})

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
    render()
}

function updateInfoBox() {
    findSelectedData()
    if (selectedIndex != null) {
        const infoBox = document.getElementById('info-box')
        console.log(data[selectedIndex])
        if (infoBox) {
            infoBox.innerText =
                'x: ' +
                trackedPositions[selectedIndex][0] +
                'm' +
                '\n y: ' +
                trackedPositions[selectedIndex][1] +
                'm' +
                '\n z: ' +
                trackedPositions[selectedIndex][2] +
                'm' +
                '\n light strength: ' +
                data[selectedIndex][' lightStrength'] +
                '\n temperature: ' +
                data[selectedIndex][' temp'] +
                'C' +
                '\n humidity: ' +
                data[selectedIndex][' humidity '] +
                '%' +
                '\n time:  ' +
                data[selectedIndex].time +
                'ms'
        }
    }
}

const gui = new GUI()
let rocketAnimationButton = {
    playAnimation: function () {
        startRocketAnimation()
    },
}
let rocketVelocity = {
    velocity: INITIAL_ROCKET_VELOCITY,
}
let centerCamera = {
    focusOnRocket: true,
}
let calibrateArduinoAccelerator = {
    xCalibration: false,
    yCalibration: false,
    zCalibration: false,
}

let rotationAnimation = {
    rotate: false,
}

const rocketFolder = gui.addFolder('Rocket')
rocketFolder.add(rocketAnimationButton, 'playAnimation')
rocketFolder.add(rocketVelocity, 'velocity', 0.01, 2)
rocketFolder.add(centerCamera, 'focusOnRocket')
rocketFolder.add(rotationAnimation, 'rotate')
rocketFolder.add(calibrateArduinoAccelerator, 'xCalibration')
rocketFolder.add(calibrateArduinoAccelerator, 'yCalibration')
rocketFolder.add(calibrateArduinoAccelerator, 'zCalibration')
rocketFolder.open()
const cameraFolder = gui.addFolder('Camera')
cameraFolder.add(camera.position, 'x', -1000, 1000)
cameraFolder.add(camera.position, 'y', 0, 1000)
cameraFolder.add(camera.position, 'z', -1000, 1000)
cameraFolder.add(camera, 'zoom', 0.1, 10)
cameraFolder.open()

function resetPath() {
    accleration = [0, 0, 0]
    velocityCount = [0, 0, 0]
    position = [0, 0, 0]
    trackedPositions = []
    pathRenderCompleted = false
}

function plotPath(data: any) {
    for (let i = 0; i < data.length - 1; i++) {
        const passedTime = data[i + 1].time - data[i].time
        for (let j = 0; j < passedTime; j++) {
            position[0] = position[0] + velocityCount[0] * (1 / 1000)
            position[1] = position[1] + velocityCount[1] * (1 / 1000)
            position[2] = position[2] + velocityCount[2] * (1 / 1000)

            velocityCount[0] = velocityCount[0] + acceleration[0] * (1 / 1000)
            velocityCount[1] = velocityCount[1] + acceleration[1] * (1 / 1000)
            velocityCount[2] = velocityCount[2] + acceleration[2] * (1 / 1000)

            if (calibrateArduinoAccelerator.xCalibration) {
                acceleration[0] = data[i][' x'] - averageOffset[0]
            } else {
                acceleration[0] = data[i][' x']
            }
            if (calibrateArduinoAccelerator.yCalibration) {
                acceleration[1] = data[i][' y'] - averageOffset[1]
            } else {
                acceleration[1] = data[i][' y']
            }
            if (calibrateArduinoAccelerator.zCalibration) {
                acceleration[2] = data[i][' z'] - averageOffset[2]
            } else {
                acceleration[2] = data[i][' z']
            }
        }

        trackedPositions.push([...position])
    }
    displayDataPoints(trackedPositions)
    displayTrackerLine(trackedPositions)
    pathRenderCompleted = true
}

function displayDataPoints(pos: number[][]) {
    for (let i = 0; i < pos.length; i++) {
        const geometry = new THREE.SphereGeometry(0.25, 24, 24)
        const material = new THREE.MeshStandardMaterial({
            color: 0xff8000,
        })
        const point = new THREE.Mesh(geometry, material)
        point.position.set(pos[i][0], pos[i][1], pos[i][2])
        scene.add(point)
    }
}

function displayTrackerLine(pos: number[][]) {
    const material = new THREE.LineBasicMaterial({
        linewidth: 10,
        color: 0x00ff00,
    })
    const points = []
    for (let i = 0; i < pos.length; i++) {
        points.push(new THREE.Vector3(pos[i][0], pos[i][1], pos[i][2]))
    }
    const geometry = new THREE.BufferGeometry().setFromPoints(points)
    const line = new THREE.Line(geometry, material)
    scene.add(line)
}

let rocketPosition: number[]
let currentTarget: number
function startRocketAnimation(
    startPos: number[] = [0, 0, 0],
    startVelocity: number = INITIAL_ROCKET_VELOCITY
) {
    rocketPosition = [...startPos]
    rocketVelocity.velocity = startVelocity
    currentTarget = 0
    animationPlaying = true
}
function updateRocketPosition() {
    if (currentTarget !== null && currentTarget < trackedPositions.length && pathRenderCompleted) {
        const x = trackedPositions[currentTarget][0] - rocketPosition[0]
        const y = trackedPositions[currentTarget][1] - rocketPosition[1]
        const z = trackedPositions[currentTarget][2] - rocketPosition[2]
        const length = Math.sqrt(x * x + y * y + z * z)
        if (length === 0) return
        const xVelocity = (x / length) * rocketVelocity.velocity
        const yVelocity = (y / length) * rocketVelocity.velocity
        const zVelocity = (z / length) * rocketVelocity.velocity
        rocketPosition[0] += xVelocity
        rocketPosition[1] += yVelocity
        rocketPosition[2] += zVelocity
        rocketModel.position.set(rocketPosition[0], rocketPosition[1], rocketPosition[2])
        if (animationPlaying) {
            selectedIndex = currentTarget
            updateInfoBox()
        }

        let angleZ: number
        let angleX: number

        if (xVelocity > 0) {
            angleZ = Math.PI / 2 - Math.atan(y / x)
        } else if (xVelocity === 0) {
            angleZ = 0
        } else {
            angleZ = Math.atan(y / x)
        }
        if (zVelocity > 0) {
            angleX = Math.PI / 2 - Math.atan(y / z)
        } else if (zVelocity === 0) {
            angleX = 0
        } else {
            angleX = Math.atan(y / z)
        }

        if (rotationAnimation.rotate) {
            rocketModel.rotation.z = -angleZ
            rocketModel.rotation.x = angleX
        }

        if (pointsClose(rocketPosition, trackedPositions[currentTarget])) {
            currentTarget++
        }
    }
}

function animate() {
    requestAnimationFrame(animate)
    hoverDataPoint()
    controls.update()
    updateInfoBox()
    updateRocketPosition()
    render()
    if (centerCamera.focusOnRocket) {
        controls.target.copy(rocketModel.position)
    }
}

function render() {
    camera.updateProjectionMatrix()
    renderer.render(scene, camera)
}
