
/**
 * SENDBIRD PART
 */

const APP_ID = document.getElementById('appId');
const USER_ID = document.getElementById('userId');
const CHANNEL_URL = document.getElementById('channelUrl');
const butConnect = document.getElementById('butConnect');
var sb;
var connected = false;

/**
 * Connects to Sendbird Chat
 */
function connect() {
    sb = new SendBird({appId: APP_ID.value});
    sb.connect(USER_ID.value, (user, error) => {
        if (error) {
            alert(error);
        } else {
            setChannelHandler();
            connected = true;
            recordingArea.style.display = 'inline-block';
            butConnect.style.display = 'none';
        }
    });
}
/**
 * Listens for arriving messages
 */
function setChannelHandler() {
    var channelHandler = new sb.ChannelHandler();
    channelHandler.onMessageReceived = (channel, message) => {
        if (message.customType == 'audio_message') {
            audioMessageAsBase64 = message.data;
            cardListenMessages.style.display = 'inline-block';
        }
    };
    sb.addChannelHandler('UNIQUE_HANDLER_ID', channelHandler);
}



/**
 * RECORDING PART
 */

var recorder;
var audioMessageAsBase64;
const cardListenMessages = document.getElementById('cardListenMessages');
const recordingArea = document.getElementById('recordingArea');
const butStartRecording = document.getElementById('butStartRecording');
const butStopRecording = document.getElementById('butStopRecording');

/**
 * Small implementation for recording audio
 */
const recordAudio = () => {
    return new Promise(resolve => {
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                const mediaRecorder = new MediaRecorder(stream);
                const audioChunks = [];
                let audioBlob;
                mediaRecorder.addEventListener("dataavailable", event => {
                    audioChunks.push(event.data);
                });
                const start = () => {
                    mediaRecorder.start();
                };
                const stop = () => {
                    return new Promise(resolve => {
                        mediaRecorder.addEventListener("stop", () => {
                            audioBlob = new Blob(audioChunks);
                            const audioUrl = URL.createObjectURL(audioBlob);
                            const audio = new Audio(audioUrl);
                            const play = () => {
                                audio.play();
                            };
                            resolve({ audioBlob, audioUrl, play });
                        });
                        mediaRecorder.stop();
                    });
                };
                resolve({ start, stop });
            });
    });
};

/**
 * When clicking on the button from the HTML, start recording...
 */
async function record() {
    if (!connected) {
        alert('Not connected to Sendbird!');
    } else {
        butStartRecording.style.display = 'none';
        butStopRecording.style.display = 'inline-block';
        recorder = await recordAudio();
        recorder.start();    
    }
}

/**
 * Stop recording and...
 */
async function stop() {
    if (recorder) {
        const audio = await recorder.stop();
        var reader = new FileReader();
        reader.readAsDataURL(audio.audioBlob); 
        reader.onload = () => {
            var base64data = reader.result.split(',')[1];         
            sendAudioMessage(base64data);
        }
    }
}

/**
 * ... send message to chat
 */
function sendAudioMessage(base64) {
    const params = new sb.UserMessageParams();
    params.message = 'Audio message';
    params.customType = 'audio_message';
    params.data = base64;
    sb.GroupChannel.getChannel(CHANNEL_URL.value, (groupChannel, error) => {
        if (error) {
            alert(error);
        } else {
            groupChannel.sendUserMessage(params, (userMessage, error) => {
                if (error) {
                    alert(error);
                } else {
                    butStartRecording.style.display = 'inline-block';
                    butStopRecording.style.display = 'none';
                    alert('Message sent');
                }
            });
        }
    });
}

/**
 * Once message is received, play the audio
 */
function playAudioFromMessage() {
    if (!audioMessageAsBase64) {
        return;
    } else {
        var finalAudio = new Audio('data:audio/ogg;base64,' + audioMessageAsBase64)
        finalAudio.play();
    }
}

