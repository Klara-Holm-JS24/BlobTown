const statusMax = 1000 //Completely arbitrary as we don't display numbers, but alas
const idleSlowDown = 10 //By how many times time is set to slow down when player is away

//Display elements
const titleStatus = document.querySelector('#title-status')
const hungerFill = document.querySelector('#hunger-fill')
const energyFill = document.querySelector('#energy-fill')
const happinessFill = document.querySelector('#happiness-fill')
const moneyDisplay = document.querySelector('#money')
const messageDisplay = document.querySelector('#message')

//Button elements
const feedButton = document.querySelector('#feed-button')
const sleepButton = document.querySelector('#sleep-button')
const playButton = document.querySelector('#play-button')
const pauseButton = document.querySelector('#pause-button')
const speedButton = document.querySelector('#speed-button')
const idleButton = document.querySelector('#idle-button')

//Hidden elements
const dimmer = document.querySelector('.dimmer')
const welcomeBackModal = document.querySelector('#welcome-back-modal')
const timeDisplay = document.querySelector('#time-display')
const removeModalButton = document.querySelector('#remove-modal-button')

let mainGameLoop
let mainLoopTime = 1000

//Status variables
let hunger
let energy
let happiness
let money

//if there is none it is likely the player's first time playing
hunger = localStorage.getItem('hunger') ? Number(localStorage.getItem('hunger')) : statusMax / 2
energy = localStorage.getItem('energy') ? Number(localStorage.getItem('energy')) : statusMax / 2
happiness = localStorage.getItem('happiness') ? Number(localStorage.getItem('happiness')) : statusMax / 2
money = localStorage.getItem('money') ? Number(localStorage.getItem('money')) : 100
updateStatusBars()
updateBlobOpacity()



//Starts or pauses game depending on where it was left off
if (localStorage.getItem('idleMode')) {
    pauseGame()
    idleButton.textContent = 'Idle Mode: On'
    handleTimeAway()
} else if (localStorage.getItem('gamePaused')){
    pauseGame() 
} else {
    mainGameLoop = setInterval(mainLoopFunction, mainLoopTime)
}

function mainLoopFunction() {
    decrementStatus()

    updateAll()

    if (hunger >= statusMax) {
        gameOver('starvation')
    } else if (energy == 0) {
        gameOver('exhaustion')
    }
}

function decrementStatus() {
    hunger = hunger < statusMax ? hunger + 1 : statusMax
    energy = energy > 0 ? energy - 1 : 0
    happiness = happiness > 0 ? happiness - 1 : 0 
}
function calculateHealth() {
    //Calculates overall health to a number between 0 and 1, based on hunger, energy and happiness
    const health = ((statusMax - hunger) + energy + happiness) / (statusMax * 3)
    return health
}

function updateStatusBars() {
    hungerFill.style.width = `${100*(hunger/statusMax)}%`
    energyFill.style.width = `${100*(energy/statusMax)}%`
    happinessFill.style.width = `${100*happiness/statusMax}%`

    //Sets color of hunger/energy to red if they're in critical condition
    hungerFill.style.backgroundColor = hunger/statusMax > 0.9 ? 'red' : 'rgb(145, 95, 160)'
    energyFill.style.backgroundColor = energy/statusMax < 0.1 ? 'red' : 'rgb(145, 95, 160)'
}
function updateBlobOpacity() {
    const blobHealth = calculateHealth() //Returns number from 0-1

    //Gets the element for our blob and sets it's opacity to blobHealth
    const blobImage = document.querySelector('#blob')
    blobImage.style.opacity = blobHealth
}

function updateLocalStorage() {
    localStorage.setItem('hunger', `${hunger}`)
    localStorage.setItem('energy', `${energy}`)
    localStorage.setItem('happiness', `${happiness}`)

    localStorage.setItem('lastTime', `${Date.now()}`)
}
function clearLocalStorage() {
    localStorage.removeItem('hunger')
    localStorage.removeItem('energy')
    localStorage.removeItem('happiness')

    localStorage.removeItem('lastTime')
}


function updateTitle() {
    if (hunger == statusMax || energy == 0) {
        titleStatus.textContent = 'DEAD'
        titleStatus.style.color = 'maroon'
        return
    } 

    const currentString = titleStatus.textContent
    
    const blobHealth = calculateHealth() //Returns number between 0-1

    let statusStrings //To be assigned an array depending on blobHealth

    if (blobHealth > 0.75) {
        statusStrings = ['Doing Amazing', 'Feeling Fantastic', 'Overjoyed', 'in Seventh Heaven', 'on Cloud Nine']
        titleStatus.style.color = 'forestgreen'
    } else if (blobHealth > 0.5) {
        statusStrings = ['Feeling Pretty Good', 'A-OK', 'Just Fine', 'Doing Okay', 'Content']
        titleStatus.style.color = 'lightgreen'
    } else if (blobHealth > 0.25) {
        statusStrings = ['Starting to Struggle', 'not Feeling Great', 'a bit Queasy', 'in Need of Attention']
        titleStatus.style.color = 'yellow'
    } else {
        statusStrings = ['Feeling Terrible', 'Close to Dying', 'on its Last Breath', 'Begging for Help']
        titleStatus.style.color = 'red'
    }

    //Does nothing if mood hasn't changed
    if (statusStrings.includes(currentString)) {
        return
    }

    //Picks a random string from statusStrings
    const stringToDisplay = statusStrings[Math.floor(Math.random()*statusStrings.length)]
    titleStatus.textContent = stringToDisplay
}

function updateAll() {
    updateStatusBars()
    updateBlobOpacity()
    updateLocalStorage()
    updateTitle()
}


function feedBlob() {
    loseMoney(1)
    if (hunger >= 100) {
        hunger -= 100
    } else {
        hunger = 0
    }
    updateAll()
}
function blobSleeps() {
    if (energy <= statusMax - 100) {
        energy += 100
    } else {
        energy = statusMax
    }
    updateAll()
}
function playWithBlob() {
    if (happiness <= statusMax - 100) {
        happiness += 100
    } else {
        happiness = statusMax
    }
    updateAll()
}

function pauseGame() {
    console.log('Game Was Paused')

    clearInterval(mainGameLoop)

    feedButton.disabled = true
    sleepButton.disabled = true
    playButton.disabled = true
    speedButton.disabled = true

    localStorage.setItem('gamePaused', 'true')
    pauseButton.textContent = 'Unpause Game'

    titleStatus.textContent = 'Paused'
    titleStatus.style.color = 'black'
}
function unPauseGame() {
    console.log('Game Was Unpaused')

    feedButton.disabled = false
    sleepButton.disabled = false
    playButton.disabled = false
    speedButton.disabled = false

    updateTitle()
    mainGameLoop = setInterval(mainLoopFunction, mainLoopTime)

    localStorage.removeItem('gamePaused')
    pauseButton.textContent = 'Pause Game'
}

function handleTimeAway() {
    //Calculates how many seconds the player has been away for
    const timeAway = (Date.now() - Number(localStorage.getItem('lastTime'))) / 1000

    //Calculates how much BlobStatus should change by, determined by time away and how much time is set to slow when idle 
    const statusChange = Math.floor(timeAway/idleSlowDown)

    console.log('before:', hunger, energy, happiness)

    //Updates hunger, energy and happiness based on time away, not letting hunger or energy closer to death than 100pts and not letting happiness reach below 0
    hunger = hunger + statusChange < statusMax - 100 ? hunger + statusChange : statusMax - 100
    energy = energy - statusChange > 100 ? energy - statusChange : 100
    happiness = happiness - statusChange > 0 ? happiness - statusChange : 0

    console.log('after:', hunger, energy, happiness)

    updateAll()

    //Notifies player on what's happened since last time
    timeDisplay.textContent = timeAway
    dimmer.classList.remove('hidden')
    welcomeBackModal.classList.remove('hidden')
}

function addMoney(amount) {
    money += amount
    moneyDisplay.textContent = money
}
function loseMoney(amount) {
    money -= amount
    moneyDisplay.textContent = money
}

function gameOver() {
    updateTitle()
}

feedButton.addEventListener('click', feedBlob)
sleepButton.addEventListener('click', blobSleeps)
playButton.addEventListener('click', playWithBlob)


pauseButton.addEventListener('click', () => {
    if (!localStorage.getItem('gamePaused')) {
        pauseGame()
    } else {
        unPauseGame()
    }
})

speedButton.addEventListener('click', () => {
    if (mainLoopTime < 50) {
        mainLoopTime = 1000
    } else {
        mainLoopTime /= 2
    }

    clearInterval(mainGameLoop)
    mainGameLoop = setInterval(mainLoopFunction, mainLoopTime)

    speedButton.textContent = `Game Speed: ${1000/mainLoopTime}`
})

idleButton.addEventListener('click', () => {
    if (localStorage.getItem('idleMode')) {
        idleButton.textContent = 'Idle Mode: Off'
        localStorage.removeItem('idleMode')
    } else {
        idleButton.textContent = 'Idle Mode: On'
        localStorage.setItem('idleMode', 'true')
    }
})

removeModalButton.addEventListener('click', () => {
    dimmer.classList.add('hidden')
    welcomeBackModal.classList.add('hidden')
})

