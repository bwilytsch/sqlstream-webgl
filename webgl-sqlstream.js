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
	}

	this.updateTorus = function(){
		var speedT = counter/that.torus.frequency;
		var vT, fT, value, altitudeX, altitudeY, altitudeZ;

		for ( var i = 0, lenT = that.torus.initVertices.length; i < lenT; i++ ){
			vT = that.torus.model.children[0].geometry.vertices[i];
			fT = that.torus.initVertices[i];

			value = noise.simplex3( fT.x * that.torus.amplifier, fT.y * that.torus.amplifier, speedT );

			altitudeX = that.Utils.checkValue(fT.x, value);
			altitudeY = that.Utils.checkValue(fT.y, value);
			altitudeZ = that.Utils.checkValue(fT.z, value);

			vT.x = that.Utils.calcSin(fT.x, altitudeX);
			vT.y = that.Utils.calcSin(fT.y, altitudeY);
			vT.z = that.Utils.calcSin(fT.z, altitudeZ);

		};

		that.torus.model.children[0].geometry.verticesNeedUpdate = true;
	};

	this.updateLandscapeDots = function(){
		for ( var i = 0; i < 120; i++ ){
			var index = Math.floor( Math.random() * (that.landscape.model.children.length - 2)) + 2;
			var c = dotsArray[index];
			c.animate();
		}
	};

	this.updateLandscape = function(){
		var speedL = counter/200;
		for ( var i = 0, lenL = that.landscape.initVertices.length; i < lenL; i++ ){
			var vL = that.landscape.model.children[0].geometry.vertices[i],
				fL = that.landscape.initVertices[i];

			var valueL = noise.perlin3( fL.x, fL.y, speedL );
			vL.z = fL.z + valueL;

		}
		that.landscape.model.children[0].geometry.verticesNeedUpdate = true;
	}

	this.showLandscape = function(duration){
		duration = duration || 0.3;

		var m = that.landscape.model.children[0].material,
			m1 = that.landscape.model.children[1].material;

		var oldPos = that.landscape.model.position.y;
		TweenLite.to(that.landscape.model.position, duration, {y:  (oldPos + 0.2)});

		TweenLite.to(m, duration, {opacity: 0.4});
		TweenLite.to(m1, duration, {opacity: 0.4});

		for (var i = 2, len = that.landscape.model.children.length; i < len; i++){
			TweenLite.to(that.landscape.model.children[i].material, duration, {opacity: 1});
		};
	};

	this.hideLandscape = function(duration){
		duration = duration || 0.3;
		var oldPos = that.landscape.model.position.y;
		TweenLite.to(that.landscape.model.position, duration, {y:  (oldPos - 0.2)});
		for (var i = 0, len = that.landscape.model.children.length; i < len; i++){
			TweenLite.to(that.landscape.model.children[i].material, duration, {opacity: 0});
		};
	};

	function init(){

		// Create Torus
		console.log("torus created");

		var geometry = new THREE.TorusGeometry( that.torus.radius, that.torus.thickness, that.torus.radialSegments, that.torus.tubularSegments );

		that.torus.model = new THREE.SceneUtils.createMultiMaterialObject( geometry,[
			new THREE.MeshBasicMaterial({ color: 0xFFFFFF, side: THREE.DoubleSide, transparent: true, opacity: 0.8 }),
			new THREE.MeshBasicMaterial({ color: that.torus.color, wireframe: true, transparent: true, opacity: 0.4 })
		]);

		var torus2 = new THREE.SceneUtils.createMultiMaterialObject( geometry,[
			new THREE.MeshBasicMaterial({ color: new THREE.Color(that.torus.color1), wireframe: true, transparent: true, opacity: 0.06 })
		]);

		var torus3 = new THREE.SceneUtils.createMultiMaterialObject( geometry,[
			new THREE.MeshBasicMaterial({ color: new THREE.Color(that.torus.color2), wireframe: true, transparent: true, opacity: 0.06 })
		]);

		that.torus.model.position.z = that.torus.distance;
		that.torus.model.add( torus2 );
		that.torus.model.add( torus3 );

		torus2.rotation.x = Math.PI;
		torus3.rotation.y = Math.PI;

		var g;
		for ( var i = 0; i < that.torus.model.children[0].geometry.vertices.length; i++ ){
			g = that.torus.model.children[0].geometry.vertices[i];
			that.torus.initVertices[i] = g.clone();
			that.torus.initVertices[i].random = Math.random() * 0.6;
		}

		that._SCENE.add( that.torus.model );


		// Create Landscape & Dots
		function Dot(mesh, pos){
			this.mesh = mesh;
			this.mesh.position.copy(pos);
			dotsArray.push(this);
		};

		Dot.prototype.animate = function(){
			TweenLite.to(this.mesh.material, 0.3, { opacity: 0, onComplete: function(){
				TweenLite.to(this.mesh.material, 0.3, {opacity: 1, delay: 1});
			}, onCompleteScope: this});
		};

		var height = 0.06,
			amount = 128;

		var geometry = new THREE.PlaneGeometry(6,3, amount, amount);

		that.landscape.model = new THREE.SceneUtils.createMultiMaterialObject( geometry,[
			new THREE.MeshBasicMaterial({ color: 0xFFFFFF, side: THREE.DoubleSide, transparent: true, opacity: 0.8 }),
			new THREE.MeshBasicMaterial({ color: 0xAAAAAA, wireframe: true, transparent: true, opacity: 0.4 })
		]);

		var g;
		for ( var i = 0, len = geometry.vertices.length; i < len; i++ ){
			g = that.landscape.model.children[0].geometry.vertices[i];
			g.z = Math.random() * 0.03;
			that.landscape.initVertices[i] = g.clone();
		}

		// // Get Colored dots cordinates
		// var sphereGeometry = new THREE.SphereBufferGeometry(0.0014, 4, 4);
		// var material, material2, index, pos, currentMaterial, mesh, dot;

		// for ( var i = 0, len = that.landscape.dotsAmount; i < len; i++ ){		
		// 	material = new THREE.MeshBasicMaterial({ color: new THREE.Color(that.torus.color1), transparent: true });
		// 	material2 = new THREE.MeshBasicMaterial({ color: new THREE.Color(that.torus.color2), transparent: true });

		// 	index = Math.floor( Math.random() * that.landscape.initVertices.length),
		// 		pos = that.landscape.model.children[0].geometry.vertices[index];

		// 	currentMaterial = ( i <= that.landscape.dotsAmount/2 ? material : material2 );

		// 	mesh = new THREE.Mesh( sphereGeometry, currentMaterial );
		// 	dot = new Dot(mesh, pos);

		// 	that.landscape.model.add( dot.mesh );
		// };

		that.landscape.model.position.z = -1.6;
		that.landscape.model.position.y = -0.8;
		that.landscape.model.rotation.x = Math.PI/2;

		that._SCENE.add( that.landscape.model );

		that.animate();
		that.bindEventListeneres();

	};

	this.render = function(){
		that._RENDERER.render( this._SCENE, this._CAMERA );
	};

	var elapsedTime = 0;
	this.update = function(){
		counter++;

		if ( !that.isChanging ){
			this.updateTorus();
			// this.updateLandscape();
		}

		if ( that.landscape.animate ){

			var now = performance.now(),
				dt = now - elapsedTime;

			if ( dt > 2000 ){
				elapsedTime = now;
				// this.updateLandscapeDots();
			};

		}

	};

	this.animate = function(){
		stats.begin();
		that.update();
		that.render();
		stats.end();
		requestAnimationFrame( that.animate );		
	};
	this.bindEventListeneres = function(){
		window.addEventListener("resize", that.Utils.onWindowResize, false);
	};
	
	return this;

};