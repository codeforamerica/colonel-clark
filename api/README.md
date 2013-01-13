# Louisville Neighborhood Crime Watch - REST API
## January Test Application: 2013 Code for America 

## APIs

### Retrieve a list of all possible geo-coded neighborhoods in Louisville, KY

#### Request
    GET /v1/neighborhoods

#### Response ([GeoJSON](http://www.geojson.org/geojson-spec.html))
    {
      "type":"FeatureCollection",
      "features":[
        {
          "type":"Feature",
          "geometry":{
            "type":"MultiPolygon",
            "coordinates":[
              [
                [
                  [ -85.7225373187882, 38.2667920900511 ],
                  [ -85.7222178006389, 38.2666780961678 ],
                  ...,
                  [ -85.7225373187882, 38.2667920900511 ]
                ]
              ]
            ]
          },
          "properties":{
            "name":"Butchertown"
          }
        },
        {
          "type":"Feature",
          "geometry":{
            "type":"MultiPolygon",
            "coordinates":[
              [
                [
                  [ -85.7510899999999, 38.2074900000001 ],
    	      [ -85.7508599999999, 38.2054690000001 ],
    	      ...,
    	      [ -85.7510899999999, 38.2074900000001 ]
                ]
              ]
            ]
          },
          "properties":{
            "name":"University"
          }
        },
        ...,
        {
          "type":"Feature",
          "geometry":{
            "type":"MultiPolygon",
            "coordinates":[
              [
                [
                  [ -85.6745999999999, 38.2153500000001 ],
    	      [ -85.67411, 38.2147400000001 ],
                  ...,
                  [ -85.6745999999999, 38.2153500000001 ]
                ]
              ]
            ]
          },
          "properties":{
            "name":"Gardiner Lane"
          }
        }
      ]
    }
        
### Retrieve a list of all possible crimes

#### Request
    GET /v1/crimes

#### Response
    {
      "crimes":[
        "AUTO THEFT",
        "VANDALISM",
        "AGGRAVATED ASSAULT",
        "ROBBERY",
        "THEFT",
        "BURGLARY",
        "SIMPLE ASSAULT",
        "HOMICIDE"
      ]
    }
    
### Retrieve a list of crime incidents

#### Requests
    GET /v1/incidents
    GET /v1/incidents?crime=AUTO+THEFT
    GET /v1/incidents?neighborhood=Gardiner+Lane
    GET /v1/incidents?crime=VANDALISM&neighborhood=University

#### Response
{
  "by_crime":{
    "AUTO THEFT":490,
    "VANDALISM":1224,
    ...,
    "HOMICIDE":14
  },
  "by_neighborhood":{
    "null":4559,
    "Jacobs":134,
    "Brownsboro Zorn":13,
    ...,
    "Prestonia":34
  }
}

