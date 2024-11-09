const samples = [];

const sampleFiles = [
    { src: "audio/bass.mp3", name: "bass" },
    { src: "audio/acid-bass.mp3", name: "acid bass" },
    { src: "audio/drum.mp3", name: "drum" },
    { src: "audio/piano.mp3", name: "piano" },
    { src: "audio/pop-piano.mp3", name: "pop piano" },
    { src: "audio/silence.mp3", name: "silence" },
    { src: "audio/strange-beat.mp3", name: "strange-beat" },
    { src: "audio/violin.mp3", name: "violin" },
    { src: "audio/hi-hat.mp3", name: "hi-hat" },
    { src: "audio/electric guitar.mp3", name: "electric guitar" },
    { src: "audio/ukulele.mp3", name: "ukulele" },
];

sampleFiles.forEach(file => {
    getAudioDuration(file.src, duration => {
        samples.push({ ...file, duration });
        createSampleButton(file.name, samples.length - 1);
    });
});
//handling track creation in js
let tracks = [];
for (let i = 0; i < 4; i++) {
    tracks.push([]);
}

const tracksDiv = document.getElementById("tracks");

function createTrack(trackIndex) {
    let trackDiv = document.createElement("div");
    trackDiv.setAttribute("id", "trackDiv" + trackIndex);
    trackDiv.classList.add("track");

    let trackDivHeader = document.createElement("h2");
    trackDivHeader.innerText = "Track " + (trackIndex + 1);
    trackDivHeader.classList.add("track-header");

    let volumeContainer = document.createElement("div");
    volumeContainer.classList.add("volume-container");

    let volumeLabel = document.createElement("label");
    volumeLabel.setAttribute("for", "volumeControl" + trackIndex);
    volumeLabel.innerText = "Volume";
    volumeLabel.classList.add("volume-label");

    let volumeControl = document.createElement("input");
    volumeControl.type = "range";
    volumeControl.id = "volumeControl" + trackIndex;
    volumeControl.min = "0";
    volumeControl.max = "1";
    volumeControl.step = "0.01";
    volumeControl.value = "1"; // default volume is 100%
    volumeControl.classList.add("volume-slider");

    volumeContainer.appendChild(volumeLabel);
    volumeContainer.appendChild(volumeControl);
    trackDiv.appendChild(volumeContainer);
    tracksDiv.appendChild(trackDiv);
    

    volumeControl.addEventListener("input", (event) => {
        const volume = parseFloat(event.target.value);
        updateTrackVolume(trackIndex, volume);
    });

    trackDiv.addEventListener("dragover", event => event.preventDefault());
    trackDiv.addEventListener("drop", event => handleDrop(event, trackIndex));
}

function updateTrackVolume(trackIndex, volume) {
    const trackDiv = document.getElementById("trackDiv" + trackIndex);
    const audioElements = trackDiv.querySelectorAll("audio");
    audioElements.forEach(audio => {
        audio.volume = volume;
    });
}

for (let i = 0; i < tracks.length; i++) {
    createTrack(i);
}

const addButtons = document.getElementById("addButtons");

function createSampleButton(name, id) {
    let newButton = document.createElement("button");
    newButton.setAttribute("data-id", id);
    newButton.setAttribute("draggable", "true");
    newButton.addEventListener("dragstart", event => {
        event.dataTransfer.setData("text/plain", id);
    });
    newButton.innerText = name;
    addButtons.appendChild(newButton);
    newButton.addEventListener("touchstart", touchStart);
    newButton.addEventListener("touchmove", touchMove);
    newButton.addEventListener("touchend", touchEnd);
}

let touchData = {};

function touchStart(event) {
    const touch = event.touches[0];
    touchData = {
        id: event.target.getAttribute("data-id"),
        startX: touch.pageX,
        startY: touch.pageY,
        originalButton: event.target.cloneNode(true)
    };
    document.body.appendChild(touchData.originalButton);
    touchData.originalButton.style.position = "absolute";
    touchData.originalButton.style.left = `${touch.pageX}px`;
    touchData.originalButton.style.top = `${touch.pageY}px`;
}

function touchMove(event) {
    const touch = event.touches[0];
    touchData.originalButton.style.left = `${touch.pageX}px`;
    touchData.originalButton.style.top = `${touch.pageY}px`;
}

function touchEnd(event) {
    const touch = event.changedTouches[0];
    document.body.removeChild(touchData.originalButton);

    const dropTarget = document.elementFromPoint(touch.pageX, touch.pageY);
    if (dropTarget && (dropTarget.classList.contains("track") || dropTarget.classList.contains("track-item"))) {
        const trackIndex = Array.from(tracksDiv.children).indexOf(dropTarget.closest(".track"));
        addSampleToTrack(trackIndex, touchData.id);
    }

    touchData = {};
}

function addSampleToTrack(trackIndex, sampleNumber) {
    const sample = samples[sampleNumber];
    tracks[trackIndex].push(sample);

    let trackDiv = document.getElementById("trackDiv" + trackIndex);
    let newItem = document.createElement("div");
    newItem.innerText = sample.name;
    newItem.style.width = (sample.duration * 10 + 30) + "px"; // scale width by duration with small base value
    newItem.classList.add("track-item");
    newItem.addEventListener("click", () => removeSample(newItem));
    newItem.addEventListener("dragover", event => event.preventDefault());
    newItem.addEventListener("drop", event => handleDrop(event, trackIndex));

    trackDiv.appendChild(newItem);
}

function handleDrop(event, trackIndex) {
    event.preventDefault();
    event.stopPropagation(); // otherwise two samples are added on drop
    const sampleNumber = event.dataTransfer.getData("text/plain");
    const dropTarget = event.target;
    
    // to allow also dropping on samples on track
    if (dropTarget.classList.contains("track-item")) {
        const trackDiv = dropTarget.closest(".track");
        if (trackDiv) {
            trackIndex = Array.from(tracksDiv.children).indexOf(trackDiv);
        }
    }
    
    addSampleToTrack(trackIndex, sampleNumber);
}

function removeSample(itemElement) {
    const trackDiv = itemElement.parentElement;
    const trackIndex = trackDiv.id.replace("trackDiv", "");
    const track = tracks[trackIndex];
    const sampleName = itemElement.innerText;
    const sampleIndex = track.findIndex(sample => sample.name === sampleName);
    if (sampleIndex > -1) {
        track.splice(sampleIndex, 1);
    }
    trackDiv.removeChild(itemElement);
}



let audioElements = [];
let isPlaying = false;
let isPaused = false;

const playButton = document.getElementById("play");
playButton.addEventListener("click", () => {
    if (isPaused) {
        resumeSong();
    } else if (!isPlaying) {
        playSong();
    }
});

const pauseButton = document.getElementById("pause");
pauseButton.addEventListener("click", () => pauseSong());

function playSong() {
    audioElements = [];
    tracks.forEach((track, i) => {
        if (track.length > 0) {
            playTrack(track, i);
        }
    });

    isPlaying = true;
    isPaused = false;
}

function playTrack(track, trackNumber) {
    let i = 0;
    const audio = new Audio(track[i].src);
    audio.volume = parseFloat(document.getElementById("volumeControl" + trackNumber).value);
    document.getElementById("trackDiv" + trackNumber).appendChild(audio);
    audioElements.push(audio);

    audio.addEventListener("ended", () => {
        i = (i + 1) % track.length;
        audio.src = track[i].src;
        audio.volume = parseFloat(document.getElementById("volumeControl" + trackNumber).value);
        audio.play();
    });
    audio.play();   
}

function pauseSong() {
    if (!isPlaying || isPaused) return;

    audioElements.forEach(audio => {
        audio.pause();
    });
    isPaused = true;
}

function resumeSong() {
    if (!isPaused) return;

    audioElements.forEach(audio => {
        audio.play();
    });
    isPaused = false;
    isPlaying = true;
}

const uploadBtn = document.getElementById("upload");
uploadBtn.addEventListener("click", () => {
    const file = document.getElementById("input-sample").files[0];
    if (!file) return;

    const audioSrc = URL.createObjectURL(file);
    getAudioDuration(audioSrc, duration => {
        const sample = { src: audioSrc, name: "new Sample", duration };
        samples.push(sample);
        createSampleButton(sample.name, samples.length - 1);
    });
});

//read audio duration to display width of items according to it
function getAudioDuration(src, callback) {
    const audio = new Audio();
    audio.addEventListener("loadedmetadata", () => {
        callback(audio.duration);
    });
    audio.src = src;
}

const addTrackBtn = document.getElementById("addTrack");
addTrackBtn.addEventListener("click", () => {
    const newTrackIndex = tracks.length;
    tracks.push([]);
    createTrack(newTrackIndex);
});

const removeTrackBtn = document.getElementById("removeTrack");
removeTrackBtn.addEventListener("click", () => {
    if (tracks.length > 1) {
        const trackRemove = tracks.length - 1;
        tracks.pop();
        
        const trackDivRemove = document.getElementById("trackDiv" + trackRemove);
        if (trackDivRemove) {
            tracksDiv.removeChild(trackDivRemove);
        }
    }
});

//adding mic recording
let audioContext;
let recorder;
let recording = [];
let recordingCount = 1; // counter for recording names

async function startRecording() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const input = audioContext.createMediaStreamSource(stream);
    recorder = new MediaRecorder(stream);
    
    recorder.ondataavailable = event => {
        if (event.data.size > 0) {
            recording.push(event.data);
        }
    };

    recorder.onstop = () => {
        const blob = new Blob(recording, { type: 'audio/webm' });
        const audioURL = URL.createObjectURL(blob);
        
        const sampleName = `Recording ${recordingCount++}`;
        
        getAudioDuration(audioURL, duration => {
            const sample = { src: audioURL, name: sampleName, duration };
            samples.push(sample);
            createSampleButton(sample.name, samples.length - 1);
        });

        recording = []; // reset the chunks for the next recording
    };

    recorder.start();
    document.getElementById("startRecording").disabled = true;
    document.getElementById("stopRecording").disabled = false;
    document.getElementById("recordingStatus").style.display = "inline";
}

function stopRecording() {
    recorder.stop();
    document.getElementById("startRecording").disabled = false;
    document.getElementById("stopRecording").disabled = true;
    document.getElementById("recordingStatus").style.display = "none";
}

document.getElementById("startRecording").addEventListener("click", startRecording);
document.getElementById("stopRecording").addEventListener("click", stopRecording);

