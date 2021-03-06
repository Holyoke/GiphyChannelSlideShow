import React from 'react'
import { parse } from 'querystring';

class TwitchChat extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            messages: [],
            channel: "#interpretivedashdance",
            broadcast: false
        }
        this.username = 'bidoubot'
        this.password = 'oauth:oasncugad4uhokjxuzr00u1o1q2daf'
        this.server = 'irc-ws.chat.twitch.tv';
        this.port = 443;
        this.webSocket = new WebSocket('wss://' + this.server + ':' + this.port + '/', 'irc');

        this.onMessage = this.onMessage.bind(this);
        this.onError = this.onError.bind(this);
        this.onClose = this.onClose.bind(this);
        this.onOpen = this.onOpen.bind(this);

        this.parseMessage = this.parseMessage.bind(this)
        this.closeChat = this.closeChat.bind(this)
        this.openChat = this.openChat.bind(this)

        //clips
        this.clipMessageID = 0
    }

    componentDidMount() {
        this.openChat()
    }

    componentWillUnmount() {
        this.closeChat()
    }

    componentWillReceiveProps(nextProps) {
        //look for new clipsinfo props and update
        if(this.state.broadcast) {
            if (!!nextProps.clipsInfo && !!nextProps.clipsInfo.currentClip && nextProps.clipsInfo.currentClip !== this.props.clipsInfo.currentClip) {
                clearInterval(this.clipMessageID)
                let {currentClip} = nextProps.clipsInfo
                let {title, broadcaster, duration} = currentClip
                let {name} = broadcaster
                let clipUrl = currentClip.url.slice(0, currentClip.url.indexOf("?"))

                let message = `"${title}" from ${name}'s channel... ${clipUrl}`
                duration = 7000
                this.clipMessageID = setTimeout(()=>{
                    this.webSocket.send(`PRIVMSG ${this.state.channel} : ${message}`);
                }, duration)
            }

            //current song changes
            if (nextProps.currentTrack.item.id !== this.props.currentTrack.item.id){
                clearInterval(this.clipMessageID)

                let {name, artists} = nextProps.currentTrack.item
                let artist = artists.map((artist) => { return artist.name }).join(", ")
                let message = `the song is now "${name}" by ${artist}`
                let duration = 7000
                this.clipMessageID = setTimeout(()=>{
                    this.webSocket.send(`PRIVMSG ${this.state.channel} : ${message}`);
                }, duration)
            }
        }

    }

    openChat() {
        this.webSocket.onmessage = this.onMessage.bind(this)
        this.webSocket.onerror = this.onError.bind(this)
        this.webSocket.onclose = this.onClose
        this.webSocket.onopen = this.onOpen.bind(this)
    }

    onMessage(message) {
        // console.log("Message: ", message.data)
        if (message !== null) {
            let parsed = this.parseMessage(message.data);
            if (parsed !== null) {
                if (parsed.command === "PRIVMSG") {
                    // console.log("PRIVMSG: ", parsed)
                } else if (parsed.command === "PING") {
                    this.webSocket.send("PONG :" + parsed.message);
                }

                if (parsed.username !== null) {
                    let { messages } = this.state
                    // cap messages
                    if (messages.length > 100) {
                        messages = messages.slice(0, 10)
                    }
                    messages.push(parsed)

                    //ToDO investigate using prevState update
                    this.setState({ messages: messages })
                }

                // query handler
                if (parsed.message && parsed.message.startsWith("?song")) {
                    let { currentTrack } = this.props
                    let { name, artists } = currentTrack.item
                    let artist = artists.map((artist) => { return artist.name }).join(", ")

                    this.webSocket.send(`PRIVMSG ${this.state.channel} :The song is "${name}", by ${artist} `);
                }

                //twitch clips
                if (parsed.message && parsed.username == 'interpretivedashdance' && parsed.message.startsWith("??clips")) {
                    let idx = parsed.message.indexOf("search")
                    let searchString = parsed.message.substring(idx + "search".length, parsed.message.length).trim()
                    this.props.searchGiphy(searchString)
                }


                if (parsed.message && parsed.username == 'interpretivedashdance' && parsed.message.startsWith("??shuffle")) {
                    return this.props.shuffleCurrentCards()
                }

                //giphy
                if (parsed.message && parsed.username == 'interpretivedashdance' && parsed.message.startsWith("??search")) {
                    let idx = parsed.message.indexOf("search")
                    let searchString = parsed.message.substring(idx + "search".length, parsed.message.length).trim()
                    this.props.searchGiphy(searchString)
                }


                if (parsed.message && parsed.username == 'interpretivedashdance' && parsed.message.startsWith("??shuffle")) {
                    return this.props.shuffleCurrentCards()
                }
            }
        }
    }

    parseMessage(rawMessage) {
        let parsedMessage = {
            message: null,
            tags: null,
            command: null,
            original: rawMessage,
            channel: null,
            username: null
        };

        if (rawMessage[0] === '@') {
            let tagIndex = rawMessage.indexOf(' '),
                userIndex = rawMessage.indexOf(' ', tagIndex + 1),
                commandIndex = rawMessage.indexOf(' ', userIndex + 1),
                channelIndex = rawMessage.indexOf(' ', commandIndex + 1),
                messageIndex = rawMessage.indexOf(':', channelIndex + 1);

            parsedMessage.tags = rawMessage.slice(0, tagIndex);
            parsedMessage.username = rawMessage.slice(tagIndex + 2, rawMessage.indexOf('!'));
            parsedMessage.command = rawMessage.slice(userIndex + 1, commandIndex);
            parsedMessage.channel = rawMessage.slice(commandIndex + 1, channelIndex);
            parsedMessage.message = rawMessage.slice(messageIndex + 1);
        } else if (rawMessage.startsWith("PING")) {
            parsedMessage.command = "PING";
            parsedMessage.message = rawMessage.split(":")[1];
        }

        return parsedMessage;
    }

    onClose() {
        console.log('Disconnected from the chat server.');
    }

    closeChat() {
        if (this.webSocket) {
            this.webSocket.close();
        }
    }

    onOpen() {
        let socket = this.webSocket;

        if (socket !== null && socket.readyState === 1) {
            console.log('Connecting and authenticating...');

            socket.send('CAP REQ :twitch.tv/tags twitch.tv/commands twitch.tv/membership');
            socket.send('PASS ' + this.password);
            socket.send('NICK ' + this.username);
            socket.send('JOIN ' + this.state.channel);
        }
    }

    onError(msg) {
        console.log('Twitch Chat Error: ', msg)
    }

    componentDidUpdate(prevProps, prevState) {
        if (this.state.channel !== prevState.channel) {
            this.closeChat()
            this.openChat()
        }
    }

    render() {
        let side;
        let chatMsg;
        let lastMsg = { props: { username: '' } };
        let style = {
            visibility: this.props.visibility ? "visible" : "hidden",
            mixBlendMode: this.props.blendMode
        }

        let chat = this.state.messages.map((msg, idx) => {
            // logic here is that chat messages should alternate left and right
            // UNLESS there's repeated messages by the same user, then it should be the same
            if (lastMsg.props.username === msg.username) {
                side = lastMsg.props.className
            } else if (idx % 2 === 0) {
                side = 'left'
            } else {
                side = 'right'
            }

            if (side === 'left') {
                chatMsg = <li key={idx} className='left' username={msg.username}>{msg.username}{' -> '}{msg.message}</li>
            } else {
                chatMsg = <li key={idx} className='right' username={msg.username}>{msg.message}{' <- '}{msg.username}</li>
            }

            lastMsg = chatMsg
            return chatMsg
        })

        chat = chat.slice(Math.max(chat.length - 10, 1))

        return (
            <div id="twitch_chat" style={style}>
                <ul>
                    {chat}
                </ul>
                <ul>
                    {chat}
                </ul>
                <ul>
                    {chat}
                </ul>
                <ul>
                    {chat}
                </ul>
                <ul>
                    {chat}
                </ul>
            </div>
        )
    }
}

export default TwitchChat