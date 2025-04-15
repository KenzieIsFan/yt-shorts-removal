
//MANIFEST: content script ties directly to 
const short_limit = 3;

var viewed = 0;
var currentURL = window.location.href

//popstate doesnt work with shorts because the history stack does not change
window.setInterval(function(){
    if (currentURL != window.location.href){
        viewed = viewed + 1;
        currentURL = window.location.href
        if (viewed >= short_limit){
            //sends you to homepage
            window.location.href = "www.youtube.com"
        }
    } 
},250)
