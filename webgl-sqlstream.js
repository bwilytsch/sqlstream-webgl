'use strict';
function WebGL (){

	var that = this;

	var dotsArray = [];
	var stats;

	this.defaultParams = {
		width: window.innerWidth,
		height: window.innerHeight,
		container: "#webgl-container",
		models: {
			landscape: "./models/landscape.json"
		},
		torus: {
			color: "#AAAAAA",
			color1: "#00cea0",
			color2: "#fd8925",
			model: {},
			initVertices: [],
			centroid: new THREE.Vector3(),
			height: 0.04,
			frequency: 100,
			amplifier: 2,
			radius: 0.8,
			thickness: 0.13,
			radialSegments: 96,
			tubularSegments: 96,
			distance: -2.4
		},
		landscape: {
			model: {},
			initVertices: [],
			dots: [],
			dotsAmount: 320,
			animate: false
		},
		renderer: {
			alpha: true,
			antialias: true
		}
	};

	this.Utils = {
		onWindowResize: function(){
			that._WIDTH = window.innerWidth;
			that._HEIGHT = window.innerHeight;

			that._CAMERA.aspect = that._WIDTH/that._HEIGHT;
			that._CAMERA.updateProjectionMatrix();

			that._RENDERER.setSize( that._WIDTH, that._HEIGHT );
		},
		checkValue: function(vector, value){
			var v;
			if ( vector <= 0 ){
				v = vector - value;
			} else {
				v = vector + value;
			}
			return v;
		},
		calcSin: function(vector, altitude){
			var sin = vector + Math.sin(altitude * that.torus.height );
			return sin;
		}
	};

	this.config = function(options) {

		var container = options.container || that.defaultParmas.container;
		var rendererOptions = options.renderer || that.defaultParmas.renderer;

		// Config Landscape
		that.torus = this.defaultParams.torus;
		that.torus.color = options.torus.color;
		that.torus.color1 = options.torus.color1;
		that.torus.color2 = options.torus.color2;
		that.torus.height = options.torus.height;
		that.torus.frequency = options.torus.frequency;
		that.torus.amplifier = options.torus.amplifier;
		that.torus.radius = options.torus.radius;
		that.torus.thickness = options.torus.thickness;
		that.torus.radialSegments = options.torus.radialSegments;
		that.torus.tubularSegments = options.torus.tubularSegments;
		that.torus.tubularSegments = options.torus.tubularSegments;

		// Config Landscape
		that.landscape = that.defaultParams.landscape;
		that.landscape.dotsAmount = options.landscape.dotsAmount;
		that.landscape.animate = options.landscape.animate;



		// Remove this when in production
		stats = new Stats();
		stats.showPanel( 0 ); // 0: fps, 1: ms, 2: mb, 3+: custom
		stats.domElement.style.position = "absolute";
		stats.domElement.style.top = 0;
		document.body.appendChild( stats.domElement );


		this._WIDTH = options.width || that.defaultParmas.width;
		this._HEIGHT = options.height || that.defaultParmas.height;;

		this._CONTAINER = document.querySelector( container );

		this.isChanging = false;

		this._RENDERER = new THREE.WebGLRenderer({
			alpha: rendererOptions.alpha,
			antialias: rendererOptions.antialias
		});
		this._RENDERER.setSize( this._WIDTH, this._HEIGHT );
		this._RENDERER.getPixelRatio( window.devicePixelRatio || 1 );
		this._CONTAINER.appendChild( this._RENDERER.domElement );

		this._SCENE = new THREE.Scene();

		this._CAMERA = new THREE.PerspectiveCamera( 65, this._WIDTH/this._HEIGHT, 0.01, 1000 );
		this._CAMERA.position.z = 0.1;

		init();

	};

	// Setup perlin noise
	var counter = 0;
	noise.seed(Math.random());

	// Animate objects
	this.setTorusPosition = function(x,y,z){
		that.torus.model.position.set( x, y, z);
	};

	this.animateTorusPosition = function(x,y,z, duration){
		TweenLite.to(that.torus.model.position, duration, { x: x, y: y, z: z });
	};

	this.updateTorus = function(){

		var speedT = counter/that.torus.frequency;
		var vertex, vertex2, vertex3, value, altitudeX, altitudeY, altitudeZ;

		if ( that.torus.model.geometry === undefined ){
			return;
		}

		var initArray = that.torus.initVertices,
			position = that.torus.model.geometry.attributes.position || [];

		for ( var i = 0, lenT = position.count; i < lenT; i++){
			vertex = initArray[i*3];
			vertex2 = initArray[i*3+1];
			vertex3 = initArray[i*3+2];

			value = noise.simplex3( vertex * that.torus.amplifier, vertex2 * that.torus.amplifier, speedT );

			altitudeX = that.Utils.calcSin(vertex, that.Utils.checkValue(vertex, value));
			altitudeY = that.Utils.calcSin(vertex2, that.Utils.checkValue(vertex2, value));
			altitudeZ = that.Utils.calcSin(vertex3, that.Utils.checkValue(vertex3, value));

			position.array[i*3] = altitudeX;
			position.array[i*3+1] = altitudeY;
			position.array[i*3+2] = altitudeZ;

		};

		position.needsUpdate = true;
		
	};

	that.updateLandscape = function(){

		var speedL = counter/that.torus.frequency*0.6;
		var vertex, vertex2, vertex3, value;

		if ( that.landscape.model.geometry === undefined ){
			return;
		}

		var initArray = that.landscape.initVertices,
			position = that.landscape.model.geometry.attributes.position;

		for ( var i = 0, lenL = position.count; i < lenL; i++ ){
			vertex = initArray[i*3];
			vertex2 = initArray[i*3+1];
			
			value = noise.perlin3( vertex, vertex2, speedL ) * 0.8;
			position.array[i*3+2] = initArray[i*3+2] + value;

		}
		position.needsUpdate = true;
	}

	this.createTorus = function(){

		// Create Torus
		console.log("torus created");

		var geometry = new THREE.TorusBufferGeometry( that.torus.radius, that.torus.thickness, that.torus.radialSegments, that.torus.tubularSegments );

		that.torus.model = new THREE.Mesh( geometry, new THREE.MeshBasicMaterial({ color: that.torus.color, wireframe: true, transparent: true, opacity: 0.4 }) );

		var torusSolid =new THREE.Mesh( geometry, new THREE.MeshBasicMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0.8 }) );

		var torus2 = new THREE.Mesh( geometry,
			new THREE.MeshBasicMaterial({ color: new THREE.Color(that.torus.color1), wireframe: true, transparent: true, opacity: 0.16 })
		);

		var torus3 = new THREE.Mesh( geometry,
			new THREE.MeshBasicMaterial({ color: new THREE.Color(that.torus.color2), wireframe: true, transparent: true, opacity: 0.16 })
		);

		that.torus.model.position.z = that.torus.distance;
		that.torus.model.add( torusSolid );
		that.torus.model.add( torus2 );
		that.torus.model.add( torus3 );

		torus2.rotation.x = Math.PI;
		torus3.rotation.y = Math.PI;

		that.torus.initVertices = new Float32Array(that.torus.model.geometry.attributes.position.array);

		that._SCENE.add( that.torus.model );

	};

	this.removeTorus = function(){
		that._SCENE.remove( that.torus.model );
	}

	this.createLandscape = function(){

		// Create Torus
		console.log("landscape created");

		var height = 0.06,
			amount = 96;

		var geometry = new THREE.PlaneBufferGeometry(6,2, amount, amount);

		that.landscape.model = new THREE.Mesh( geometry, new THREE.MeshBasicMaterial({ color: that.torus.color, wireframe: true, transparent: true, opacity: 0.8 }));
		var landscapeSolid = new THREE.Mesh( geometry, new THREE.MeshBasicMaterial({ color: 0xFFFFFF, side: THREE.DoubleSide,  transparent: true, opacity: 0.8 }));

		var landscape2 = new THREE.Mesh( geometry, new THREE.MeshBasicMaterial({ color: new THREE.Color(that.torus.color1), wireframe: true, transparent: true, opacity: 0.06 }));
		var landscape3 = new THREE.Mesh( geometry, new THREE.MeshBasicMaterial({ color: new THREE.Color(that.torus.color2), wireframe: true, transparent: true, opacity: 0.06 }));

		that.landscape.model.add( landscapeSolid );
		that.landscape.model.add( landscape2 );
		that.landscape.model.add( landscape3 );

		landscape2.rotation.x = Math.PI;
		landscape3.rotation.z = Math.PI;

		that.landscape.model.position.z = -1.6;
		that.landscape.model.position.y = -0.8;
		that.landscape.model.rotation.x = Math.PI/2;

		that.landscape.initVertices = new Float32Array(that.landscape.model.geometry.attributes.position.array);

		that._SCENE.add( that.landscape.model );
	}

	this.removeLandscape = function(){
		that._SCENE.remove( that.landscape.model );
	}

	function init(){

		that.createLandscape();
		that.animate();
		that.bindEventListeneres();

	};

	this.render = function(){
		that._RENDERER.render( this._SCENE, this._CAMERA );
	};

	var elapsedTime = 0;
	this.update = function(){
		counter++;

		if ( that.landscape.animate ){
			that.updateLandscape();
		};

		if ( that.torus.animate ){
			that.updateTorus();
		};

	};

	this.animate = function(){
		stats.begin(); // Remove this when in production
		that.update();
		that.render();
		stats.end(); // Remove this when in production
		requestAnimationFrame( that.animate );		
	};
	this.bindEventListeneres = function(){
		window.addEventListener("resize", that.Utils.onWindowResize, false);
	};

	return this;

};