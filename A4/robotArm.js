"use strict";

var canvas, gl, program;

var NumVertices = 36; //(6 faces)(2 triangles/face)(3 vertices/triangle)

var points = [];
var colors = [];

var vertices = [
    vec4( -0.5, -0.5,  0.5, 1.0 ),
    vec4( -0.5,  0.5,  0.5, 1.0 ),
    vec4(  0.5,  0.5,  0.5, 1.0 ),
    vec4(  0.5, -0.5,  0.5, 1.0 ),
    vec4( -0.5, -0.5, -0.5, 1.0 ),
    vec4( -0.5,  0.5, -0.5, 1.0 ),
    vec4(  0.5,  0.5, -0.5, 1.0 ),
    vec4(  0.5, -0.5, -0.5, 1.0 )
];

// RGBA colors
var vertexColors = [
    vec4( 0.0, 0.0, 0.0, 1.0 ),  // black
    vec4( 1.0, 0.0, 0.0, 1.0 ),  // red
    vec4( 1.0, 1.0, 0.0, 1.0 ),  // yellow
    vec4( 0.0, 1.0, 0.0, 1.0 ),  // green
    vec4( 0.0, 0.0, 1.0, 1.0 ),  // blue
    vec4( 1.0, 0.0, 1.0, 1.0 ),  // magenta
    vec4( 0.0, 1.0, 1.0, 1.0 ),  // white
    vec4( 0.0, 1.0, 1.0, 1.0 )   // cyan
];

var cylinderData = cylinder(36,1,true);
var cylinderVerts = cylinderData.TriangleVertices;
var cylinderColor = cylinderData.TriangleVertexColors;
var cylinderNormals = cylinderData.TriangleNormals;
// Parameters controlling the size of the Robot's arm

var BASE_HEIGHT      = 0.5;
var BASE_WIDTH       = 1.0;
var LOWER_ARM_HEIGHT = 2.0;
var LOWER_ARM_WIDTH  = 0.3;
var UPPER_ARM_HEIGHT = 2.0;
var UPPER_ARM_WIDTH  = 0.3;

// Shader transformation matrices

var modelViewMatrix, projectionMatrix;

// Buffers
var vColor, vPosition;

// Array of rotation angles (in degrees) for each rotation axis

var Base = 0;
var LowerArm = 1;
var UpperArm = 2;


var theta= [ 0, 0, 0];

var angle = 0;

var modelViewMatrixLoc;

var cylinderVBuffer, cylinderCBuffer;
var cubeVBuffer, cubeCBuffer;

//----------------------------------------------------------------------------

function quad(  a,  b,  c,  d ) {
    colors.push(vertexColors[a]);
    points.push(vertices[a]);
    colors.push(vertexColors[a]);
    points.push(vertices[b]);
    colors.push(vertexColors[a]);
    points.push(vertices[c]);
    colors.push(vertexColors[a]);
    points.push(vertices[a]);
    colors.push(vertexColors[a]);
    points.push(vertices[c]);
    colors.push(vertexColors[a]);
    points.push(vertices[d]);
}


function colorCube() {
    quad( 1, 0, 3, 2 );
    quad( 2, 3, 7, 6 );
    quad( 3, 0, 4, 7 );
    quad( 6, 5, 1, 2 );
    quad( 4, 5, 6, 7 );
    quad( 5, 4, 0, 1 );
}

//____________________________________________

// Remmove when scale in MV.js supports scale matrices

function scale4(a, b, c) {
   var result = mat4();
   result[0][0] = a;
   result[1][1] = b;
   result[2][2] = c;
   return result;
}


//--------------------------------------------------


window.onload = function init() {

    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );

    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
    gl.enable( gl.DEPTH_TEST );

    //
    //  Load shaders and initialize attribute buffers
    //
    program = initShaders( gl, "vertex-shader", "fragment-shader" );

    gl.useProgram( program );

    colorCube();

    // Load shaders and use the resulting shader program

    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    // Create and initialize  buffer objects

    // Cube Buffer
    cubeVBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cubeVBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );

    cubeCBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cubeCBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW );

    // Cylinder Buffer
    cylinderVBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cylinderVBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(cylinderVerts), gl.STATIC_DRAW );

    cylinderCBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cylinderCBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(cylinderColor), gl.STATIC_DRAW );



    vColor = gl.getAttribLocation( program, "vColor" );
    gl.enableVertexAttribArray( vColor );

    vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.enableVertexAttribArray( vPosition );


    document.getElementById("slider1").onchange = function(event) {
        theta[0] = event.target.value;
    };
    document.getElementById("slider2").onchange = function(event) {
         theta[1] = event.target.value;
    };
    document.getElementById("slider3").onchange = function(event) {
         theta[2] =  event.target.value;
    };

    modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");

    projectionMatrix = ortho(-10, 10, -10, 10, -10, 10);
    gl.uniformMatrix4fv( gl.getUniformLocation(program, "projectionMatrix"),  false, flatten(projectionMatrix) );
    render();
}

//----------------------------------------------------------------------------


function base() {
    var s = scale4(BASE_WIDTH, BASE_HEIGHT, BASE_WIDTH);
    var instanceMatrix = mult( translate( 0.0, 0.5 * BASE_HEIGHT, 0.0 ), s);
    var t = mult(modelViewMatrix, instanceMatrix);
    gl.uniformMatrix4fv(modelViewMatrixLoc,  false, flatten(t) );
    gl.drawArrays( gl.TRIANGLES, 0, cylinderVerts.length );
}

//----------------------------------------------------------------------------


function upperArm() {
    var s = scale4(UPPER_ARM_WIDTH, UPPER_ARM_HEIGHT, UPPER_ARM_WIDTH);
    var instanceMatrix = mult(translate( 0.0, 0.5 * UPPER_ARM_HEIGHT, 0.0 ),s);
    var t = mult(modelViewMatrix, instanceMatrix);
    gl.uniformMatrix4fv( modelViewMatrixLoc,  false, flatten(t) );
    gl.drawArrays( gl.TRIANGLES, 0, NumVertices );
}

//----------------------------------------------------------------------------


function lowerArm()
{
    var s = scale4(LOWER_ARM_WIDTH, LOWER_ARM_HEIGHT, LOWER_ARM_WIDTH);
    var instanceMatrix = mult( translate( 0.0, 0.5 * LOWER_ARM_HEIGHT, 0.0 ), s);
    var t = mult(modelViewMatrix, instanceMatrix);
    gl.uniformMatrix4fv( modelViewMatrixLoc,  false, flatten(t) );
    gl.drawArrays( gl.TRIANGLES, 0, NumVertices );
}

//----------------------------------------------------------------------------


var render = function() {

    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
    modelViewMatrix = rotate(theta[Base], 0, 1, 0 );
    
    gl.bindBuffer( gl.ARRAY_BUFFER, cylinderVBuffer );
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, gl.FALSE, 0, 0);

    gl.bindBuffer( gl.ARRAY_BUFFER, cylinderCBuffer );
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, gl.FALSE, 0, 0);
    base();
    gl.bindBuffer( gl.ARRAY_BUFFER, cubeVBuffer );
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, gl.FALSE, 0, 0);

    gl.bindBuffer( gl.ARRAY_BUFFER, cubeCBuffer );
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, gl.FALSE, 0, 0);

    modelViewMatrix = mult(modelViewMatrix, translate(0.0, BASE_HEIGHT, 0.0));
    modelViewMatrix = mult(modelViewMatrix, rotate(theta[LowerArm], 0, 0, 1 ));
    lowerArm();

    modelViewMatrix  = mult(modelViewMatrix, translate(0.0, LOWER_ARM_HEIGHT, 0.0));
    modelViewMatrix  = mult(modelViewMatrix, rotate(theta[UpperArm], 0, 0, 1) );
    upperArm();

    requestAnimationFrame(render);
}
requestAnimationFrame(render);