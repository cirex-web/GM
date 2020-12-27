window.default_MeetingsUi.di = function(a, b) {
    if(a.getAttribute("jscontroller")=="pGdfBb"){
        console.log("removing class "+b+" from "+a.getAttribute("jscontroller"));
    }
    if(b == "kjZr4"){
        return;
    }
    a.classList ? a.classList.remove(b) : window.default_MeetingsUi.ai(a, b) && window.default_MeetingsUi.gia(a, window.default_MeetingsUi.fd(window.default_MeetingsUi.fia(a), function(c) {
        return c != b
    }).join(" "))
}





window.default_MeetingsUi.ii = function (a) {
    console.log(a.width);
    let width = 0;
    if (typeof (window.innerWidth) == 'number') {
        width = window.innerWidth;
    } else if (document.documentElement && (document.documentElement.clientWidth || document.documentElement.clientHeight)) {
        width = document.documentElement.clientWidth;
    } else if (document.body && (document.body.clientWidth || document.body.clientHeight)) {
        width = document.body.clientWidth;
    }
    return new window.default_MeetingsUi.Ef(a.width, a.height);
}
_.ei = function(a, b, c) {
    c ? _.bi(a, b) : _.di(a, b)
}

//bi adds, di removes