# Louisville Neighborhood Crime Watch - REST API
## January Test Application: 2013 Code for America 

## APIs

### Retrieve a list of geo-coded neighborhoods
`GET /v1/neighborhoods`

Response headers:
* `Content-Type: application/json` ([GeoJSON](http://www.geojson.org/geojson-spec.html))

Response body example:

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
        
### /crimes

### /incidents