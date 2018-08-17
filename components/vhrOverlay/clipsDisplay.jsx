import React from 'react'

class ClipsDisplay extends React.Component {
    constructor(props) {
        super(props)
    }

    componentDidMount() {
        console.log("Current Track and Display Mounted")
    }

    render() {
        let {data} = this.props

        let clips = !!data ? data.clips : [{duration:0}]
        let currentClip = !!data ? data.currentClip : {}
        let currentClipIdx = !!data ? data.currentClipIdx : 0

        let clipsTotal = !!clips ? clips.length : 0
        let currentViews = !!currentClip ? currentClip.views : 0
        let clipOrder = !!data ? data.clipOrder : true
        let clipsDuration = clips.slice(currentClipIdx, clips.length -1).reduce((a,b) => a + b.duration, 0)

        let hours = Math.floor(clipsDuration / 3600)
        let minutes = Math.floor((clipsDuration - (hours * 3600)) / 60)

        return <ul className="clips_display">
            <li>{clipOrder ? '⋱' : '⋰' }</li>
            <li>✇ {currentClipIdx}</li>
            <li>⧖ {hours}h</li>
            <li>⧗ {minutes}m</li>
            <li>🖭 {clipsTotal}</li>
            <li>👁 {currentViews}</li>
        </ul>
    }
}

export default ClipsDisplay