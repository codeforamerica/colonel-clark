if (!window.requestAnimationFrame) {
  window.requestAnimationFrame = (function() {
    return window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    function(/* function FrameRequestCallback */ callback, /* DOMElement Element */ element) {
      window.setTimeout( callback, 1000 / 60 );
    };
  })();
}

var heatmap3d = (function(){
  var main = {};

  var SCREEN_WIDTH = window.innerWidth;
  var SCREEN_HEIGHT = window.innerHeight;
  var FLOOR = -1000;

  var container;

  var camera;
  var scene;
  var webglRenderer;

  var renderGl = 1;
  var hasGl = 0;

  var rotation = 0;

  var cubeMesh;
  var textureCube;

  function addMesh(geometry, scale, x, y, z, rx, ry, rz, material) {
    mesh = new THREE.Mesh( geometry, material );
    mesh.scale.x = mesh.scale.y = mesh.scale.z = scale;
    mesh.position.x = x;
    mesh.position.y = y;
    mesh.position.z = z;
    mesh.rotation.x = rx;
    mesh.rotation.y = ry;
    mesh.rotation.z = rz;
    mesh.overdraw = true;
    mesh.doubleSided = false;
    mesh.updateMatrix();
    scene.addObject(mesh);

    return mesh;
  }
    
  function initialize() {
    container = document.createElement('div');
    document.body.appendChild(container);
    
    var aspect = SCREEN_WIDTH / SCREEN_HEIGHT;

    camera = new THREE.Camera(75, aspect, 1, 100000);
    camera.position.z = 650;
    camera.position.x = 0;
    camera.position.y = FLOOR + 5750;

    scene = new THREE.Scene();

    scene.fog = new THREE.Fog(0x34583e, 0, 10000);

    // Lights

    var ambient = new THREE.AmbientLight(0xffffff);
    scene.addLight(ambient);

    var cube = new Cube(1, 1, 1, 1, 1);
    cubeMesh = addMesh(cube, 1,  0, FLOOR, 0, 0, 0, 0, 
        new THREE.MeshLambertMaterial({ color: 0xFF3333 }));
    cubeMesh.visible = false;
    camera.target = cubeMesh;
    
    var data = getHeightData();

    // Plane

    plane = new Plane(128, 128, 128, 128);

    console.log(plane.vertices.length);

    var minx = 0, miny = 0, maxx = -99999, maxy = -99999;

    var count = 200;
    var found = 0;
    var notFound = 0;

    for (var i in plane.vertices) {
      var vertice = plane.vertices[i];

      var x = vertice.position.x + 64;
      var y = vertice.position.y + 64;
      vertice.position.z = (parseFloat(y) / 20) + (parseFloat(x) / 20);

    }

/*
    for (var x = 0; x < 128; x++) {
      for (var y = 0; y < 128; y++) {
        var vertice = plane.vertices[z];

        var realX = plane.vertices[y * 128 + x].position.x;
        var realY = plane.vertices[y * 128 + x].position.y;*/

        /*var isFound = false;
        for (var z in plane.vertices) {
          var vertice = plane.vertices[z];

          if ((vertice.position.x == x - 64) && (vertice.position.y == y - 64)) {
            found++;
            isFound = true;

            vertice.position.z = (parseFloat(y) / 20) + (parseFloat(x) / 20);

            break;
          } 
        }
        if (!isFound) {
          notFound++;
        }*/

/*        var xx = plane.vertices[y * 128 + x].position.x;
        var yy = plane.vertices[y * 128 + x].position.y;

        count--;
        if (count == 0) {
          return;
        }

        if (xx < minx) { minx = xx; }
        if (yy < miny) { miny = yy; }
        if (xx > maxx) { maxx = xx; }
        if (yy > maxy) { maxy = yy; }


        //plane.vertices[y * 128 + x].position.z = (parseFloat(y) / 20) + (parseFloat(x) / 20);
        */
      /*}
    }*/

    //console.log(minx, maxx, miny, maxy);
    console.log('found', found);
    console.log('not found', notFound);

    /*for (var i = 0, l = plane.vertices.length; i < l; i++) {
      plane.vertices[i].position.z = data[i];
    }*/

    var planeMesh = addMesh(plane, 100,  0, FLOOR, 0, 
        -Math.PI / 2, 0, 0, getTerrainMaterial());

    try {
      webglRenderer = new THREE.WebGLRenderer({ 
          scene: scene, clearColor: 0x34583e, clearAlpha: 0.5 
      });
      webglRenderer.setFaceCulling(0);
      webglRenderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
      container.appendChild(webglRenderer.domElement);
      hasGl = 1;
    } catch(e) {
      alert('no webgl');
      return;
    }
  }

  function getHeightData() {
    var TEXTURE_SIZE = 128;

    var size = TEXTURE_SIZE * TEXTURE_SIZE;
    var data = new Float32Array(size);

    for (var i = 0; i < size; i++) {
      data[i] = 0;
    }

    for (var x = 0; x < TEXTURE_SIZE; x++) {
      for (var y = 0; y < TEXTURE_SIZE; y++) {
        data[y * TEXTURE_SIZE + x] = (parseFloat(y) / 20) + (parseFloat(x) / 20);
      }
    }

    return data;
  }

  function getTerrainMaterial() {
    var terrainMaterial = new THREE.MeshPhongMaterial({ 
        map: new THREE.Texture(null, THREE.UVMapping, THREE.RepeatWrapping, THREE.RepeatWrapping), ambient: 0xaaaaaa, specular: 0xffffff, shininess: 1, shading: THREE.SmoothShading });

    var img = new Image();
    terrainMaterial.map.image = img;
    img.onload = function () {
      terrainMaterial.map.image.loaded = 1;
    };
    img.src = "staticmap.jpeg";

    return terrainMaterial;
  }

  function animate() {
    requestAnimationFrame(animate);
    loop();
  }

  function loop() {
    var dist = 4000;

    camera.position.x = dist * Math.cos(rotation);
    camera.position.z = dist * Math.sin(rotation);
    
    //cubeMesh.position.y = FLOOR + 1500 - (Math.sin(r*5)*1000);
    //cubeMesh.position.x = 500 - (Math.cos(r*5)*1000);
    //cubeMesh.position.z = 500 - (Math.sin(r*5)*1000);

    rotation += 0.0005;

    if (renderGl && hasGl) {
      webglRenderer.render(scene, camera);
    }
  }

  main.init = function(){
    initialize();
    animate();
  }

  return main;
})();
