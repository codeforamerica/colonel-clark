window.requestAnimFrame = (function(callback){
    return window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    function(callback){
        window.setTimeout(callback, 1000 / 60);
    };
})();

var heatmap3d = (function(){
  var main = {};
 
  function animate(lastTime, angularSpeed, three){
    // update
    var date = new Date();
    var time = date.getTime();
    var timeDiff = time - lastTime;
    var angleChange = angularSpeed * timeDiff * 2 * Math.PI / 1000;

    //three.cube.rotation.y += angleChange;
    //three.cube2.rotation.y += angleChange;

    lastTime = time;

    // render
    three.renderer.render(three.scene, three.camera);

    // request new frame
    requestAnimFrame(function(){
        animate(lastTime, angularSpeed, three);
    });
  }

  main.init = function(parentEl) {
      var lastTime = 0;

      var width = parentEl.offsetWidth;
      var height = parentEl.offsetHeight;

      // renderer
      var renderer = new THREE.WebGLRenderer({
        antialias   : true, // to get smoother output          
      });
      renderer.shadowMapEnabled = true;
      //renderer.shadowMapSoft    = true;
      renderer.setSize(width, height);
      parentEl.appendChild(renderer.domElement);

      // camera
      var camera = new THREE.PerspectiveCamera(10, width / height, 1, 10000);
      camera.position.x = -1000 * 2; 
      camera.position.y = -1000 * 2;
      camera.position.z = 900 * 2;

      camera.rotation.x = 1;
      camera.rotation.y = -0.7;
      //camera.rotation.z = 3.1415;

      // scene
      var scene = new THREE.Scene();

      // material
      var material = new THREE.MeshLambertMaterial({
          map: THREE.ImageUtils.loadTexture("crate.jpg")
      });

      // cube
      var cube = new THREE.Mesh(new THREE.CubeGeometry(200, 200, 200), material);
      cube.overdraw = true;
      //cube.castShadow   = true;
      //cube.receiveShadow  = true;
      //scene.add(cube);

      cube.position.z = 600;
      cube.position.x = 200;


      //var material = new THREE.MeshLambertMaterial({ color: 0xaaaaaa });

      var material = new THREE.MeshLambertMaterial({
          map: THREE.ImageUtils.loadTexture("crate.jpg")
      });

      var cube2 = new THREE.Mesh(new THREE.CubeGeometry(200, 200, 200), material);
      cube2.overdraw = true;
      //cube2.castShadow   = true;
      //cube2.receiveShadow  = true;
      //scene.add(cube2);

      cube2.position.x = -400;
      cube2.position.z = 600;

      //plane = new Plane(256, 256, 256, 256);

      var PLANE_SIZE = 800;

      var material  = new THREE.MeshPhongMaterial({
        ambient   : 0x444444,
        color   : 0xffffff,
        shininess : 3000, 
        specular  : 0x33AA33,
        shading   : THREE.SmoothShading,
        map: THREE.ImageUtils.loadTexture("staticmap.jpg")
      });

      var plane = new THREE.Mesh(
          new THREE.PlaneGeometry(PLANE_SIZE, PLANE_SIZE, 128, 128),
          //new THREE.MeshBasicMaterial({ color: 0x0000ff })
          material
      );

      //var plane = new THREE.Plane(1000, 1000, 4, 4);

      plane.position.x = 0;
      plane.position.z = 550;
      //plane.rotation.x = 0;
      plane.overdraw = true;

      plane.castShadow   = true;
      plane.receiveShadow  = true;

      plane.geometry.dynamic = true;

      scene.add(plane);        

      for (var i in plane.geometry.vertices) {
        var vertice = plane.geometry.vertices[i];

        var x = (vertice.x + PLANE_SIZE / 2) / PLANE_SIZE;
        var y = (vertice.y + PLANE_SIZE / 2) / PLANE_SIZE;

        var z = (Math.sin(x * 3.14) + Math.sin(y * 3.14)) * 0;

        if ((x >= 0.4) && (x <= 0.6) && (y >= 0.4) && (y <= 0.6)) {
          z += Math.sin((x - 0.4) / .2 * 3.14) * Math.sin((y - 0.4) / .2 * 3.14) * 100;
        }

        if ((x >= 0.1) && (x <= 0.2) && (y >= 0.1) && (y <= 0.2)) {
          z += Math.sin((x - 0.1) / .2 * 3.14) * Math.sin((y - 0.1) / .2 * 3.14) * 80;
        }

        vertice.z = z;
      }

      //plane.geometry.__dirtyVertices = true;
      //plane.geometry.__dirtyNormals = true;

      //camera.target = cube;
      //camera.target.position.copy(cube);

      // add subtle ambient lighting
      var ambientLight = new THREE.AmbientLight(0x222222);
      scene.add(ambientLight);

      // add directional light source
      /*var directionalLight = new THREE.DirectionalLight(0xffffff);
      directionalLight.position.set(100, 100, 100);//.normalize();
      directionalLight.cameraVisible = true;
      scene.add(directionalLight);*/

      var light = new THREE.SpotLight( 0xdddddd, 3 );
      light.position.set( 800, -800, 1200 );
      light.target.position.set( 0, 0, 600 );
      light.castShadow    = true;
      light.shadowCameraFov = 40;
      light.shadowCameraNear    = 100;   
      light.shadowCameraFar = 1600;
      light.shadowDarkness    = 0.8;
      light.shadowCameraVisible = true;
      scene.add(light);

      // create wrapper object that contains three.js objects
      var three = {
          renderer: renderer,
          camera: camera,
          scene: scene,
          cube: cube,
          plane: plane,
          cube2: cube2
      };

      animate(lastTime, 0, three, this);

  };

  return main;
})();