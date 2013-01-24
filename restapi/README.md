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
    
### Retrieve a summary of crime incidents

#### Requests
    GET /v1/incidents-summary
    GET /v1/incidents-summary?crime=AUTO+THEFT
    GET /v1/incidents-summary?neighborhood=Gardiner+Lane
    GET /v1/incidents-summary?crime=VANDALISM&neighborhood=University

#### Response
    {
      "query": {
        "filters": { ... }
      },
      "dateRange": {
        "start": "2012-10-11T07:00:00.000Z",
        "end": "2013-01-09T08:00:00.000Z"
      },
      "byCrime":{
        "AUTO THEFT":490,
        "VANDALISM":1224,
        ...,
        "HOMICIDE":14
      },
      "byNeighborhood":{
        "Jacobs":134,
        "Brownsboro Zorn":13,
        ...,
        "Prestonia":34
      }
    }

### Retrieve a list of geo-coded crime incidents

#### Request
    GET /v1/incidents
    GET /v1/incidents?crime=HOMICIDE
    GET /v1/incidents?crime=HOMICIDE,AUTO+THEFT

#### Response ([GeoJSON](http://www.geojson.org/geojson-spec.html))
    {
      "query": {
        "filters": {
          "crime": "HOMICIDE,AUTO THEFT"
        }
      },
      "incidents": {
        "type": "FeatureCollection",
        "features": [
          {
            "type": "Feature",
            "geometry": {
              "type": "Point",
              "coordinates": [ -85.7843, 38.1994 ]
            },
            "properties": {}
          },
          ...
        ]
      }
    }

### Subscribe to neighborhood crime emails

#### Request
    POST /v1/user/shaunak@codeforamerica.org/subscriptions
    {
      "neighborhoods": [ "Prestonia", "Central Business District" ]
    }

### Update subscription status to VERIFIED

#### Request
    PUT /v1/subscription/b45a0c2d-2f2f-4362-9ed8-bc7a5efc2352/status
    {
      "status": "VERIFIED"
    }

### Delete a specific subscription

#### Request
    DELETE /v1/subscription/b45a0c2d-2f2f-4362-9ed8-bc7a5efc2352

