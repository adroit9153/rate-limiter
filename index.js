var express = require('express')
var csvjson = require('csvjson')
var path = require('path')
var app = express();
var fs = require("fs");

var hotelList = {}   // container to hold the hotel details from csv
var city = {};       //a modified map of city with details
var key_configurations = {}  // container to hold the key configuration from json
var loadHotelList = function()
{
    var data = fs.readFileSync(path.join(__dirname, 'resources','hoteldb.csv'), { encoding : 'utf8'}); // read data from file
    var options = { delimiter : ','};
    hotelList = csvjson.toObject(data, options); // conver data to json for easy manipulation
    //console.log(hotelList)
    for(var i = 0; i < hotelList.length ; i++) // converting to modified json for eady queriying
    {
        if(city[hotelList[i]['CITY'].toLowerCase()] == undefined)
        {
            city[hotelList[i]['CITY'].toLowerCase()] = [];
        }
        city[hotelList[i]['CITY'].toLowerCase()].push(hotelList[i]);
    }
}
var loadKeyConfiguration = function()
{
    var data = fs.readFileSync(path.join(__dirname, 'resources','apikeys.json'), { encoding : 'utf8'}); // loading key configuration
    key_configurations = JSON.parse(data);
    console.log(key_configurations)
}

var getallowance = function(key)  // function to check if the key is allowed qurying or not
{
    if(key_configurations['api_key'][key]['last_checked'] == undefined)
        key_configurations['api_key'][key]['last_checked'] = Date.now()   //update the last checked if not present
    if(key_configurations['api_key'][key].rate_limit == undefined)
        key_configurations['api_key'][key]['rate_limit'] = key_configurations['global_rate_limit']  // if rate limit is not defined initialize it to global rate limit
    var current = Date.now()
    var time_passed = current - key_configurations['api_key'][key]['last_checked'];  // calculate the time passed from the last call
    if(key_configurations['api_key'][key]['lock'] == true)  // checking if the lock was enabled before
    {
      if(time_passed >= key_configurations['lock_time'] *1000)  // cheking how much time the lock was enable. remove the lock if the time of locking completed.
      {
          key_configurations['api_key'][key]['lock'] = false
      }
      else
      {
        return false;
      }
    }
    if(key_configurations['api_key'][key]['lock'] == false)
    {
      key_configurations['api_key'][key]['last_checked'] = current; // updating the last checked
      key_configurations['api_key'][key]['allowance'] += time_passed *(key_configurations['api_key'][key]['rate_limit']/(key_configurations['time']*1000)) // adjusting the allowance for the time passed
      //console.log(time_passed *(key_configurations['api_key'][key]['rate_limit']/(key_configurations['time']*1000)))
      if(key_configurations['api_key'][key]['allowance'] > key_configurations['api_key'][key]['rate_limit']) // capping the allowance to rate limit
      {
        key_configurations['api_key'][key]['allowance'] = key_configurations['api_key'][key]['rate_limit'];
      }
      if(key_configurations['api_key'][key]['allowance'] < 1.0) // if allowance is less than one means the quota is finished
      {
          key_configurations['api_key'][key]['lock'] = true // applying lock
          return false;
      }
      else
      {
          key_configurations['api_key'][key]['allowance']-=1 // for successfull allowance substracting from overall allowance
          //console.log(key_configurations['api_key'][key])
          return true
      }
    }
}

var getHotelList = function(cityName,order) // get the hotel list from city . if order set then sorting wrt to price
{
    if(city[cityName]  != undefined)
    {
      if(order == undefined)
        return city[cityName];
      else
      {
        var byPrice = city[cityName].slice(0)
        byPrice.sort(function(a,b){
          if(order.toLowerCase() == "asc" )
            return a.PRICE - b.PRICE
          else if (order.toLowerCase() == "desc") {
              return b.PRICE-a.PRICE;
          }
        })
        return byPrice;
      }
    }
    else
        return [];
}
app.get('/listhotels', function (req, res) {
   var key = req.query.key   //getting key parameter
   var city = req.query.city // city name
   var order = req.query.order // order in which to be sorted
   if(key == undefined || city == undefined)
      res.status(403).send("query parameters missing")  // if city or key undefined then return an error message of parameter missing
   else
   {
      if(getallowance(key) == true) // checking the allownace
      {
        var data  = getHotelList(city.toLowerCase(),order);
        res.end(JSON.stringify(data,undefined,4)); // return the result
      }
      else
      {
        res.status(403).send("Request exceeded rate limit. Blocked for 5 mins"); // return error meassage is quata exceeded
      }

   }
})

var server = app.listen(8080,"127.0.0.1", function () {  //starting the server

  var host = server.address().address
  var port = server.address().port
  console.log("Server listening at http://"+ host+":"+ port)
  loadKeyConfiguration() // loading the key configuration
  loadHotelList() // loading hotel list

})
