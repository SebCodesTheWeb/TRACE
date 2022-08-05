const NOT_PROCESSED_DATA = [
    {
        x: 10,
        y: 5,
        z: 3,
        tid: 0,
    },
    {
        x: 3,
        y: 12,
        z: 1,
        tid: 10,
    }
]

let accleration = [0, 0, 0]
let velocity = [0, 0, 0]
let position = [0, 0, 0]

for(let i = 0; i < NOT_PROCESSED_DATA.length; i++) {
    const x = NOT_PROCESSED_DATA[i].x
    const y = NOT_PROCESSED_DATA[i].y
    const z = NOT_PROCESSED_DATA[i].z
    const tid = NOT_PROCESSED_DATA[i].tid
    const xVelocity = velocity[0] + accleration[0] * tid
    const yVelocity = velocity[1] + accleration[1] * tid
    const zVelocity = velocity[2] + accleration[2] * tid
    const xPosition = position[0] + xVelocity * tid
    const yPosition = position[1] + yVelocity * tid
    const zPosition = position[2] + zVelocity * tid
    console.log(xPosition, yPosition, zPosition)
}

