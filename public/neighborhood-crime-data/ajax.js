function makeAjaxRequest(type, url, data, responseFunc) {
  if (window.XMLHttpRequest) {
    var httpRequest = new XMLHttpRequest();
  } else if (window.ActiveXObject) {
    var httpRequest = new ActiveXObject("Microsoft.XMLHTTP");
  }

  httpRequest.open(type, url, true);
  httpRequest.setRequestHeader('Content-Type', 'application/json');
  httpRequest.send(data);

  httpRequest.onreadystatechange = function() {
    if (httpRequest.readyState === 4) {
      if (httpRequest.status === 200) { 
        responseFunc(true, httpRequest);
      } else {
        responseFunc(false, httpRequest);
      }
    }
  };
} 