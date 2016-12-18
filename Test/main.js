var arr = [];

function output(inp) {
    document.getElementById('json').innerHTML = inp;
}
function incidentList(desc){
  var full_list = ""
  output(desc[desc.length-1].result)
  for(var i=desc.length-1; i>=0; i--){
      full_list = full_list + "<b>"+desc[i].time +"</b>    :   "+ desc[i].result+ '<br>'
  }
  document.getElementById('container').innerHTML = full_list;
}
function httpGetAsync(theUrl)
{
  var req = new XMLHttpRequest();

    // Feature detection for CORS
    if ('withCredentials' in req) {
      req.open('GET', theUrl, true);
      // Just like regular ol' XHR
      req.onreadystatechange = function() {
          if (req.readyState === 4) {
              var date  = new Date().toUTCString();
              arr.push({result:req.responseText,time:date})
              incidentList(arr)
          }
      };
      req.send();
    }
}




function runQuery()
{
  var e = document.getElementById("key")
  var key = e.options[e.selectedIndex].value;
  e = document.getElementById("order")
  var order = e.options[e.selectedIndex].value;
  var cityName = document.getElementById("cityName").value
  var numberRequest =document.getElementById("numberRequest").value
  var url  = "http://127.0.0.1:8080/listhotels?"
  if(key != "")
  {
     url+="key="+key
     if(cityName !="")
     url+="&"
  }
  if(cityName != "")
    url+="city="+cityName
    if(order != "")
    url+="&order="+order
    document.getElementById("query").innerHTML = "Query : "+url
  //console.log(url)
  for(var i = 0; i < numberRequest ; i++)
  {
     httpGetAsync(url)
  }
}
