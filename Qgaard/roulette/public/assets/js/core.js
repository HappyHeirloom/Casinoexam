function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    var expires = "expires="+d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}
function customAlert(content,type,duration) {
    //  content = content of alert (string)
    //  type = type of alert (string):
    //  duration = duration of alert, unit milliseconds (int)
    //  Supported types:
    //  success (green)
    //  info (blue)
    //  warning (yellow)
    //  danger (red)
    var element = "<div class='alert alert-"+type+"' role='alert'>"+content+"</div>";
    $(".topbar").prepend(element);
    window.setTimeout(function(){$(".alert").fadeOut()}, duration);
}