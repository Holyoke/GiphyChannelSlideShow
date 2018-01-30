import React from 'react'
import $ from "jquery";

class TitleCard extends React.Component {
    super(props) {
        this.state = { on: false }
        this.toggle = this.toggle.bind(this)
        this.handleClick = this.handleClick.bind(this)
    }
    componentDidMount() {

        const turnOff = () => {
            $("#titleCard").hide()
        }
        
        let duration = window.audioAnalysis.sections[0].duration * 1000
        let progressMs = window.currentTrack.progress_ms
        duration = duration - progressMs - window.networkDelay
        window.setTimeout(turnOff, duration)
    }

    render() {
        let {artist, songTitle} = this.props
        return <div id="titleCard">
        <h1>"{songTitle}"</h1>
        <h2>{artist}</h2>
        </div>
    }
  }

export default TitleCard;
