//Save timer state before exiting
window.addEventListener("beforeunload", saveTimeStatus)

//Add Task
document.querySelector("form").addEventListener("submit", (evt) => {
    evt.preventDefault()
    evt.stopPropagation()
    const key = Date.now()
    localStorage[key] = JSON.stringify({task: evt.target[0].value, pomodoro: evt.target.querySelector("span").innerText})
    appendTaskToList(key)
    allTasks.push(key)
})

//Increment/Decrement
document.querySelector("#pomodoroEstimation").addEventListener("click", (evt) => {
    evt.preventDefault()
    evt.stopPropagation()
    const value = document.querySelector("#pomodoroEstimation > span")
    const operation = evt.composedPath()[0].id ? evt.composedPath()[0].id : evt.composedPath()[1].id

    if(operation === "plus") {
        if (Number(value.innerText) < 10) value.innerText = Number(value.innerText) + 1
    }

    else if(operation === "minus") {
        if (Number(value.innerText) > 1) value.innerText = Number(value.innerText) - 1
    }

    if(Number(value.innerText) === 1) {
        document.querySelector("#minus").classList.add("disabled")
        document.querySelector("#plus").classList.remove("disabled")
    }else if(Number(value.innerText) === 10) {
        document.querySelector("#plus").classList.add("disabled")
        document.querySelector("#minus").classList.remove("disabled")
    }else{
        document.querySelector("#minus").classList.remove("disabled")
        document.querySelector("#plus").classList.remove("disabled")
    }
})

//Start Timer Button Event
document.querySelector("#startTimer").addEventListener("click", startTimer)

//Start Timer
function startTimer() {
    const btn = document.querySelector("#startTimer")
    btn.classList.add("d-none")

    const otherBtn = document.querySelector("#pauseTimer")
    otherBtn.classList.remove("d-none")

    timeInterval = setInterval(updateTimeEverySecond, 1000)
}

//Pause Timer Button Event
document.querySelector("#pauseTimer").addEventListener("click", pauseTimer)

//Pause Timer
function pauseTimer() {
    const btn = document.querySelector("#pauseTimer")
    btn.classList.add("d-none")

    const otherBtn = document.querySelector("#startTimer")
    otherBtn.classList.remove("d-none")

    clearInterval(timeInterval)
}

//Skip Task
document.querySelector("#skipTask").addEventListener("click", nextTask)


//Go to Next Task
function nextTask(){
    pauseTimer()
    if(allTasks.length && currentTimeState.currentTaskType !== 1){
        const currentTask = JSON.parse(localStorage[allTasks[0]])

        if(currentTask.pomodoro){
            currentTimeState.currentTaskType = 1
            currentTimeState.currentTime  = pomodoroTime
            currentTimeState.currentTask = currentTask.task
            --currentTask.pomodoro
            setAnimation(currentTimeState.currentTaskType)

            if(currentTask.pomodoro){
                document.querySelector(`#task-${allTasks[0]} span`).innerText = `Pomodoro: ${currentTask.pomodoro}`
                localStorage[allTasks[0]] = JSON.stringify(currentTask)
            }else{
                removeTaskFromList(allTasks[0])
            }
        }else{
            removeTaskFromList(allTasks[0])
            nextTask()
        }

    }
    else if(currentTimeState.currentTaskType === 1) {
        currentTimeState.currentTaskType = 2
        currentTimeState.currentTime = shortBreakTime
        currentTimeState.currentTask = "Short Break"
        setAnimation(currentTimeState.currentTaskType)
    }
    else {
        currentTimeState.currentTaskType = 0
        currentTimeState.currentTime = 0
        currentTimeState.currentTask = "Nothing"
        setAnimation(currentTimeState.currentTaskType)
        progressBarWidth(0)
    }

    setTimer();
    if(currentTimeState.currentTaskType !== 0) startTimer()
}

//Set Animation
function setAnimation(taskType) {
    const id = ["no-work", "work", "relax"]
    const animationTemplate = document.querySelector(`#${id[taskType]}`).content.cloneNode(true)
    if(animationTemplate.querySelector("lord-icon").getAttribute("src") !== document.querySelector("#animationContainer > lord-icon")?.getAttribute("src")) {
        document.querySelector("#animationContainer").innerHTML = ""
        document.querySelector("#animationContainer").appendChild(animationTemplate)
    }
}

//Save time status to local storage
function saveTimeStatus() {
    if(currentTimeState.currentTaskType === 1 && currentTimeState.currentTime){
        localStorage["time"] = JSON.stringify(currentTimeState)
    }
}

//Add new Task to List
function appendTaskToList(key){
    const list = document.querySelector("ul")
    const templateListItem = document.querySelector("template").content.cloneNode(true)
    const taskDetails = JSON.parse(localStorage[key])
    templateListItem.querySelector("li").id = `task-${key}`
    templateListItem.querySelector("li").prepend(taskDetails.task)
    templateListItem.querySelector("span").innerText = `Pomodoro: ${taskDetails.pomodoro}`
    list.appendChild(templateListItem)
}

//Remove Task from List
function removeTaskFromList(key){
    document.querySelector(`#task-${key}`).remove()
    localStorage.removeItem(allTasks[0])
    allTasks = allTasks.filter((keyID) => keyID !== key)
}

//Change progress Bar with time left
function progressBarWidth(percentage){
    document.querySelector(".progress-bar").style.width = `${percentage}%`
}

//Set Time in timer card
function setTimer() {
    const min = Math.floor(currentTimeState.currentTime / 60)
    const sec = currentTimeState.currentTime % 60
    document.querySelector("#time").innerText = (min < 10 ? "0" + min : min) + ":" + (sec < 10 ? "0" + sec : sec)
    document.querySelector("#currentTask").innerText = currentTimeState.currentTask

    for(const className of ["card", "card-header", "card-footer"]){
        const cardComponent = document.querySelector(`.${className}`)
        cardComponent.classList.remove("border-white", "border-danger", "border-success")
        switch (currentTimeState.currentTaskType){
            case 0:
                cardComponent.classList.add("border-white")
                break
            case 1:
                cardComponent.classList.add("border-danger")
                break
            case 2:
                cardComponent.classList.add("border-success")
        }
    }
}

//Update countdown timer every second
function updateTimeEverySecond() {
    switch (currentTimeState.currentTaskType){
        case 0:
            progressBarWidth(0)
            nextTask()
            break
        case 1:
            progressBarWidth((pomodoroTime - (--currentTimeState.currentTime)) * 100 / pomodoroTime)
            setTimer();
            break
        case 2:
            progressBarWidth((shortBreakTime - (--currentTimeState.currentTime)) * 100 / shortBreakTime)
            setTimer();
    }
}

//Initialize the clock and the task list
function initialize() {
    if(localStorage["time"]){
        currentTimeState = JSON.parse(localStorage["time"])
        localStorage.removeItem("time")
    }
    setAnimation(currentTimeState.currentTaskType)
    setTimer();

    allTasks = Object.keys(localStorage).sort((a, b) => a - b)
    allTasks.forEach((key) => {
        if(!isNaN(Number(key)))
            appendTaskToList(key)
    })
}

// Init
const shortBreakTime = 5*60, pomodoroTime = 25*60

let currentTimeState = {
    currentTime: 0,
    currentTaskType: 0,
    currentTask: "Nothing"
}

let allTasks, timeInterval

initialize()