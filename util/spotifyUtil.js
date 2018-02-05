import $ from 'jquery'

export const setupHeaders = () => {
    //change this eventually
    let authToken = window.spotifyAuthToken;

    $.ajaxSetup({
        headers: { 'Content-Type': 'application/json',
                   'Accept': 'application/json',
                   'Authorization': `Bearer ${authToken}` }
    });
}

export const getAuthTokenImplicit = () => {
    // Get the hash of the url
    const hash = window.location.hash
        .substring(1)
        .split('&')
        .reduce(function (initial, item) {
                if (item) {
                    var parts = item.split('=');
                    initial[parts[0]] = decodeURIComponent(parts[1]);
                }
                return initial;
        }, {});
    window.location.hash = '';

    // Set token
    let _token = hash.access_token;

    const authEndpoint = 'https://accounts.spotify.com/authorize'

    const clientId = 'a1725413073e48a697827b4895650356'
    const redirectUri = 'http://localhost:8000'
    const scopes = [
        'user-read-currently-playing'
    ];

    // If there is no token, redirect to Spotify authorization
    if (!_token) {
        window.location = `${authEndpoint}?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scopes.join('%20')}&response_type=token`;
    }
}

export const getAuthToken = () => {
    let url = "http://localhost:3000/token"
    return $.ajax({
        type: "GET",
        crossDomain: true,
        contentType: 'json',
        headers: {  'Access-Control-Allow-Origin': 'http://localhost:3000' },
        xhrFields: { withCredentials: true },
        url: url
    }).done(function (data) {
        this.spotifyAuthToken = data.token
        console.log("spotify token")
    });
}

export const setAuthToken = () => {
    let str = window.location.hash.slice(14,182)
    window.spotifyAuthToken = str
}

export const getCurrentTrack = (fn) => {
    let succ = fn || function(res) { window.currentTrack = res }

    return $.ajax({
      method: 'GET',
      url: `https://api.spotify.com/v1/me/player/currently-playing`,
      success: succ
    })
};

export const getAudioAnalysis = (id, fn) => {
    let succ = fn || function(res) {
        window.audioAnalysis = res
    }

    return $.ajax({
        method: 'GET',
        url: `https://api.spotify.com/v1/audio-analysis/${id}`,
        success: succ
    }) 
}

export function getCurrentAudioAnalysis () {
    return getCurrentTrack().then( (res) => getAudioAnalysis(res.item.id))
}