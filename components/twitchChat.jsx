import React from 'react'

class TwitchChat extends React.Component {
    constructor(props){
        super(props)
        this.state = {
            messages: []
        }
        this.username = 'interpretivedashdance'
        this.password = 'oauth:v4h9bcymhi1ztx135tidwic31pwffu'
        this.channel = '#legend0flucky';
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
    }

    componentDidMount(){
        this.openChat()
    }

    openChat(){
        this.webSocket.onmessage = this.onMessage.bind(this)
        this.webSocket.onerror = this.onError.bind(this)
        this.webSocket.onclose = this.onClose
        this.webSocket.onopen = this.onOpen.bind(this)
    }

    onMessage(message){
        // console.log("Message: ", message.data)
        if(message !== null){
            var parsed = this.parseMessage(message.data);
            if(parsed !== null){
                if(parsed.command === "PRIVMSG") {
                    // console.log("PRIVMSG: ", parsed)
                } else if(parsed.command === "PING") {
                    this.webSocket.send("PONG :" + parsed.message);
                }

                if(parsed.username !== null) {
                    let {messages} = this.state
                    // cap messages
                    if (messages.length > 100) {
                        messages = messages.slice(0, 10)
                    }
                    messages.push(parsed.username + ":" + parsed.message)
                    this.setState({messages: messages})
                }
            }
        }
    }

    parseMessage(rawMessage) {
        var parsedMessage = {
            message: null,
            tags: null,
            command: null,
            original: rawMessage,
            channel: null,
            username: null
        };
    
        if(rawMessage[0] === '@'){
            var tagIndex = rawMessage.indexOf(' '),
            userIndex = rawMessage.indexOf(' ', tagIndex + 1),
            commandIndex = rawMessage.indexOf(' ', userIndex + 1),
            channelIndex = rawMessage.indexOf(' ', commandIndex + 1),
            messageIndex = rawMessage.indexOf(':', channelIndex + 1);
    
            parsedMessage.tags = rawMessage.slice(0, tagIndex);
            parsedMessage.username = rawMessage.slice(tagIndex + 2, rawMessage.indexOf('!'));
            parsedMessage.command = rawMessage.slice(userIndex + 1, commandIndex);
            parsedMessage.channel = rawMessage.slice(commandIndex + 1, channelIndex);
            parsedMessage.message = rawMessage.slice(messageIndex + 1);
        } else if(rawMessage.startsWith("PING")) {
            parsedMessage.command = "PING";
            parsedMessage.message = rawMessage.split(":")[1];
        }
    
        return parsedMessage;
    }

    onClose(){
        console.log('Disconnected from the chat server.');
    }

    closeChat(){
        if(this.webSocket){
            this.webSocket.close();
        }
    }

    onOpen(){
        let socket = this.webSocket;
    
        if (socket !== null && socket.readyState === 1) {
            console.log('Connecting and authenticating...');
    
            socket.send('CAP REQ :twitch.tv/tags twitch.tv/commands twitch.tv/membership');
            socket.send('PASS ' + this.password);
            socket.send('NICK ' + this.username);
            socket.send('JOIN ' + this.channel);
            socket.send('PRIVMSG ' + this.channel + ':Testing!');
        }
    }

    onError(msg) {
        console.log('Twitch Chat Error: ', msg)
    }

    render() {
        let chat = this.state.messages.map((msg, idx)=>{
            return <li key={idx}>{msg}</li>
        })

        return(
            <div id="twitch_chat">
                <ul>
                    {chat.slice(Math.max(chat.length - 10, 1))}
                </ul>
                <ul>
                    {chat.slice(Math.max(chat.length - 10, 1))}
                </ul>
                <ul>
                    {chat.slice(Math.max(chat.length - 10, 1))}
                </ul>
                <ul>
                    {chat.slice(Math.max(chat.length - 10, 1))}
                </ul>
                <ul>
                    {chat.slice(Math.max(chat.length - 10, 1))}
                </ul>
            </div>
        )
    }
}

export default TwitchChat