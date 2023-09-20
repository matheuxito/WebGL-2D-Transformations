function normalizeVertices(width, height, vertices) {
    for (let i = 0; i < vertices.length; i += 2) {
        vertices[i] = (vertices[i] / width) * 2 - 1;
        vertices[i + 1] = 1 - (vertices[i + 1] / height) * 2;
    }

    return vertices;
}

function denormalizeVertices(width, height, vertices) {
    for (let i = 0; i < vertices.length; i += 2) {
        vertices[i] = (vertices[i] + 1) / 2 * width;
        vertices[i + 1] = (1 - vertices[i + 1]) / 2 * height;
    }

    return vertices;
}

function getCenterPoint(vertices) {
    let x = 0;
    let y = 0;

    for (let i = 0; i < vertices.length; i += 2) {
        x += vertices[i];
        y += vertices[i + 1];
    }

    x /= vertices.length / 2;
    y /= vertices.length / 2;

    return { x, y };
}

function generateCircleVertices(cx, cy, radius, segments) {
    const vertices = [];
    const angleStep = (2 * Math.PI) / segments;

    for (let i = 0; i <= segments; i++) {
        const angle = i * angleStep;
        const x = cx + radius * Math.cos(angle);
        const y = cy + radius * Math.sin(angle);
        vertices.push(x, y);
    }

    return vertices;
}

// create a function to get started with a canvas
function startCanvas(canvas) {
    const gl = canvas.getContext('webgl');

    const vsSource = `
        attribute vec2 a_position;
        uniform mat4 u_modelMatrix;
        void main() {
            gl_Position = u_modelMatrix * vec4(a_position, 0, 1);
            gl_PointSize = 2.0;
        }
    `;

    const fsSource = `
        precision mediump float;
        uniform vec3 u_color;
        void main() {
            gl_FragColor = vec4(u_color, 1.0);
        }
    `;

    const vs = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vs, vsSource);
    gl.compileShader(vs);

    const fs = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fs, fsSource);
    gl.compileShader(fs);

    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    return { gl, program };
}

function drawShape(gl, program, vertices, color, matrix) {
    gl.useProgram(program);
    positionBuffer = gl.createBuffer();

    const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
    const colorUniformLocation = gl.getUniformLocation(program, "u_color");
    const modelMatrixUniformLocation = gl.getUniformLocation(program, "u_modelMatrix");

    if (matrix) {
        gl.uniformMatrix4fv(modelMatrixUniformLocation, false, matrix);
    } else {
        const modelMatrix = mat4.create();
        mat4.identity(modelMatrix);
        gl.uniformMatrix4fv(modelMatrixUniformLocation, false, modelMatrix);
    }

    const positions = new Float32Array(vertices);

    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);
    gl.uniform3f(colorUniformLocation, color[0], color[1], color[2]);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, positions.length / 2);
}

function drawPolygon(gl, program, vertices, color, modelMatrix) {
    drawShape(gl, program, vertices, color, modelMatrix);
}

function drawPolygonWithBorder(gl, program, vertices, color, modelMatrix, scaleX = 0.98, scaleY = 0.98) {
    const borderColor = [0, 0, 0];
    const center = getCenterPoint(vertices);

    if (!modelMatrix) {
        modelMatrix = mat4.create();
        mat4.identity(modelMatrix);
    }

    const insideMatrix = mat4.create();
    mat4.identity(insideMatrix);
    mat4.translate(insideMatrix, modelMatrix, [center.x, center.y, 0]);
    mat4.scale(insideMatrix, insideMatrix, [scaleX, scaleY, 0]);
    mat4.translate(insideMatrix, insideMatrix, [-center.x, -center.y, 0]);

    drawShape(gl, program, vertices, borderColor, modelMatrix);
    drawShape(gl, program, vertices, color, insideMatrix);
}

function drawCircle(gl, program, x, y, radius, color, modelMatrix) {
    const vertices = generateCircleVertices(x, y, radius, 500);
    drawShape(gl, program, vertices, color, modelMatrix);
}

function drawCircleWithBorder(gl, program, x, y, radius, color, modelMatrix) {
    const borderColor = [0, 0, 0];
    const vertices = generateCircleVertices(x, y, radius, 500);

    if (!modelMatrix) {
        modelMatrix = mat4.create();
        mat4.identity(modelMatrix);
    }

    const insideMatrix = mat4.create();
    mat4.identity(insideMatrix);
    mat4.translate(insideMatrix, modelMatrix, [x, y, 0]);
    mat4.scale(insideMatrix, insideMatrix, [0.94, 0.94, 0]);
    mat4.translate(insideMatrix, insideMatrix, [-x, -y, 0]);

    drawShape(gl, program, vertices, borderColor, modelMatrix);
    drawShape(gl, program, vertices, color, insideMatrix);
}

// FLOWER

function renderStem(gl, program, modelMatrix = null) {
    const STEM_COORDINATES = [
        -0.03, -0.3,
        0.03, -0.3,
        0.04, -1,
        -0.04, -1,
    ];

    drawPolygon(gl, program, STEM_COORDINATES, [0.0, 0.5, 0.0], modelMatrix);
}

function renderFlowerHead(gl, program, modelMatrix = null) {
    // 8 White Petals
    drawCircle(gl, program, 0.3, 0.0, 0.15, [1.0, 1.0, 1.0], modelMatrix);
    drawCircle(gl, program, 0.0, 0.3, 0.15, [1.0, 1.0, 1.0], modelMatrix);
    drawCircle(gl, program, -0.3, 0.0, 0.15, [1.0, 1.0, 1.0], modelMatrix);
    drawCircle(gl, program, 0.0, -0.3, 0.15, [1.0, 1.0, 1.0], modelMatrix);
    drawCircle(gl, program, 0.21, 0.21, 0.15, [1.0, 1.0, 1.0], modelMatrix);
    drawCircle(gl, program, -0.21, 0.21, 0.15, [1.0, 1.0, 1.0], modelMatrix);
    drawCircle(gl, program, 0.21, -0.21, 0.15, [1.0, 1.0, 1.0], modelMatrix);
    drawCircle(gl, program, -0.21, -0.21, 0.15, [1.0, 1.0, 1.0], modelMatrix);
    
    // Middle circle
    drawCircle(gl, program, 0, 0, 0.3, [1.0, 1.0, 0.0], modelMatrix);
}

// CAR

function renderRoad(gl, program, modelMatrix = null) {
    const ROAD_COORDINATES = [
        1, -1,
        -1, -1,
        -1, -0.4,
        1, -0.4,
    ];
    drawPolygon(gl, program, ROAD_COORDINATES, [0.5, 0.5, 0.5]);

    const LINE_COORDINATES_0 = [
        -1.7, -0.72,
        -1.3, -0.72,
        -1.3, -0.7,
        -1.7, -0.7,
    ];
    drawPolygon(gl, program, LINE_COORDINATES_0, [1, 1, 1], modelMatrix);

    const LINE_COORDINATES_1 = [
        -0.7, -0.72,
        -0.3, -0.72,
        -0.3, -0.7,
        -0.7, -0.7,
    ];
    drawPolygon(gl, program, LINE_COORDINATES_1, [1, 1, 1], modelMatrix);

    const LINE_COORDINATES_2 = [
        0.7, -0.72,
        0.3, -0.72,
        0.3, -0.7,
        0.7, -0.7,
    ];
    drawPolygon(gl, program, LINE_COORDINATES_2, [1, 1, 1], modelMatrix);

    const LINE_COORDINATES_3 = [
        1.7, -0.72,
        1.3, -0.72,
        1.3, -0.7,
        1.7, -0.7,
    ];
    drawPolygon(gl, program, LINE_COORDINATES_3, [1, 1, 1], modelMatrix);
}

function updateCarBounce() {
    carBounce += carBounceDirection * carBounceSpeed;

    if (carBounce >= 0.025) {
        carBounceDirection = -1;
    } else if (carBounce <= 0) {
        carBounceDirection = 1;
    }
}

function updateRoadPosition() {
    if (carSide === 1) {
        carY = -0.33;
        roadX -= 0.01;
        if (roadX <= -1) {
            roadX = 1;
        }
    } else {
        carY = 0;
        roadX += 0.01;
        if (roadX >= 1) {
            roadX = -1;
        }
    }
}

function drawWheel(gl, program, x, y) {
    const WHEEL_DETAIL_COORDINATES = [
        -0.04, -0.005,
        -0.04, 0.005,
        0.04, 0.005,
        0.04, -0.005,
    ];

    const wheelMatrix = mat4.create();
    mat4.identity(wheelMatrix);
    mat4.translate(wheelMatrix, wheelMatrix, [x, y + carY + carBounce/3, 0]);
    if (carSide === 0) {
        mat4.rotate(wheelMatrix, wheelMatrix, Math.PI, [0, 1, 0]);
    }
    mat4.rotate(wheelMatrix, wheelMatrix, wheelRotationAngle, [0, 0, 1]);


    drawCircle(gl, program, 0, 0, 0.1, [0.3, 0.3, 0.3], wheelMatrix);
    drawCircle(gl, program, 0, 0, 0.085, [0, 0, 0], wheelMatrix);
    drawCircle(gl, program, 0, 0, 0.07, [1, 1, 1], wheelMatrix);
    drawPolygon(gl, program, WHEEL_DETAIL_COORDINATES, [0.3, 0.3, 0.3], wheelMatrix);
    mat4.rotate(wheelMatrix, wheelMatrix, Math.PI/2, [0, 0, 1]);
    drawPolygon(gl, program, WHEEL_DETAIL_COORDINATES, [0.3, 0.3, 0.3], wheelMatrix);
}


function renderCarBody(gl, program, modelMatrix = null) {
    color = carColor; 
    
    const CAR_BODY_COORDINATES = [
        -0.72, -0.56,
        -0.72, -0.42,
        -0.64, -0.28,
        -0.28, -0.28,
        -0.08, -0.42,
        0.04, -0.44,
        0.04, -0.56,
    ];
    drawPolygon(gl, program, CAR_BODY_COORDINATES, color, modelMatrix);

    const CAR_WINDOW_0_COORDINATES = [
        -0.68, -0.42,
        -0.62, -0.31,
        -0.44, -0.31,
        -0.44, -0.42,
    ];
    
    const CAR_WINDOW_0_REFLECTION_COORDINATES_0 = [
        -0.64, -0.42,
        -0.62, -0.42,
        -0.50, -0.31,
        -0.52, -0.31,
    ];
    
    const CAR_WINDOW_0_REFLECTION_COORDINATES_1 = [
        -0.44, -0.37,
        -0.44, -0.35,
        -0.50, -0.42,
        -0.48, -0.42,
    ];

    drawPolygon(gl, program, CAR_WINDOW_0_COORDINATES, [0.67, 0.84, 1], modelMatrix);
    drawPolygon(gl, program, CAR_WINDOW_0_REFLECTION_COORDINATES_0, [1, 1, 1], modelMatrix);
    drawPolygon(gl, program, CAR_WINDOW_0_REFLECTION_COORDINATES_1, [1, 1, 1], modelMatrix);

    const CAR_WINDOW_1_COORDINATES = [
        -0.4, -0.31,
        -0.276, -0.31,
        -0.12, -0.42,
        -0.4, -0.42,
    ];

    const CAR_WINDOW_1_REFLECTION_COORDINATES_0 = [
        -0.4, -0.41,
        -0.4, -0.42,
        -0.39, -0.42,
        -0.276, -0.31,
        -0.29, -0.31,
    ];

    const CAR_WINDOW_1_REFLECTION_COORDINATES_1 = [
        -0.24, -0.341,
        -0.31, -0.42,
        -0.3, -0.42,
        -0.237, -0.35,
    ];

    drawPolygon(gl, program, CAR_WINDOW_1_COORDINATES, [0.67, 0.84, 1], modelMatrix);
    drawPolygon(gl, program, CAR_WINDOW_1_REFLECTION_COORDINATES_0, [1, 1, 1], modelMatrix);
    drawPolygon(gl, program, CAR_WINDOW_1_REFLECTION_COORDINATES_1, [1, 1, 1], modelMatrix);

    const CAR_BEAM_COORDINATES = [
        0.04, -0.45,
        0.04, -0.47,
        0, -0.47,
        0, -0.45,
    ];

    drawPolygon(gl, program, CAR_BEAM_COORDINATES, [1, 1, 0], modelMatrix);

    const CAR_TAIL_COORDINATES = [
        -0.72, -0.43,
        -0.72, -0.45,
        -0.68, -0.45,
        -0.68, -0.43,
    ];

    drawPolygon(gl, program, CAR_TAIL_COORDINATES, [1, 0, 0], modelMatrix);

    drawWheel(gl, program, -0.6, -0.58);
    drawWheel(gl, program, -0.1, -0.58);
}

// ROBOT

function generateBricks() {
    let bricks = [];
    for (let i = 0; i < 7; i++) {
        for (let j = 0; j < 6; j++) {
            const x = i % 2 ? 0 : -0.2;
            bricks.push([
                -1 + (j * 0.4) + x, 1 - (i * 0.2),
                -1 + (j * 0.4) + x, 0.8 - (i * 0.2),
                -0.6 + (j * 0.4) + x, 0.8 - (i * 0.2),
                -0.6 + (j * 0.4) + x, 1 - (i * 0.2),
            ]); 
        }
    }
    return bricks;
}

function updateRobotBounce() {
    robotBounce += robotBounceDirection * robotBounceSpeed;

    if (robotBounce >= 0.06) {
        robotBounceDirection = -1;
    } else if (robotBounce <= 0) {
        robotBounceDirection = 1;
    }
}

function updateRightArm() {
    sholderRotationAngle += 0.03 * sholderRotationDirection;

    if (sholderRotationAngle >= 0.5) {
        sholderRotationDirection = -1;
    } else if (sholderRotationAngle <= -0.8) {
        sholderRotationDirection = 1;
    }
}

function updateSholderMatrix(modelMatrix = null, sholder) {
    const sholderMatrix = mat4.create();
    mat4.identity(sholderMatrix);
    mat4.translate(sholderMatrix, modelMatrix, [sholder.x, sholder.y, 0]);
    mat4.rotate(sholderMatrix, sholderMatrix, sholderRotationAngle, [0, 0, 1]);
    mat4.translate(sholderMatrix, sholderMatrix, [-sholder.x, -sholder.y, 0]);
    return sholderMatrix;
}

function updateElbowMatrix(modelMatrix = null, elbow) {
    const elbowMatrix = mat4.create();
    mat4.identity(elbowMatrix);
    mat4.translate(elbowMatrix, modelMatrix, [elbow.x, elbow.y, 0]);
    mat4.rotate(elbowMatrix, elbowMatrix, Math.PI/4 - sholderRotationAngle/3, [0, 0, 1]);
    mat4.translate(elbowMatrix, elbowMatrix, [-elbow.x, -elbow.y, 0]);
    return elbowMatrix;
}
    

function updateWallPosition() {
    if (robotSide === 1) {
        robotY = -0.33;
        wallX -= 0.01;
        if (wallX <= -0.2) {
            wallX = 0.2;
        }
    } else {
        robotY = 0;
        wallX += 0.01;
        if (wallX >=0.2) {
            wallX = -0.2;
        }
    }
}

function renderWall(gl, program) {
    const wallMatrix = mat4.create();
    mat4.identity(wallMatrix);
    mat4.translate(wallMatrix, wallMatrix, [wallX, 0, 0]);
    
    for (let i = 0; i < BRICKS.length; i++) {
        drawPolygonWithBorder(gl, program, BRICKS[i], [0.741, 0.624, 0.337], wallMatrix, 0.99, 0.99);
    }
}

function renderSolo(gl, program) {
    const SOLO_COORDINATES = [
        2, -2,
        -2, -2,
        -2, -0.2,
        2, -0.2,
    ];

    drawPolygon(gl, program, SOLO_COORDINATES, [0.431, 0.439, 0.290]);
}

function renderRobotHead(gl, program, modelMatrix = null) {
    const EYE_RADIUS = 0.0481;
    const IRIS_RADIUS = 0.0175;
    const MOUTH_SCREW = { x: 0.478, y: 0.257, r: 0.0239};
    const EYE_1 = { x: 0.532, y: 0.438 };
    const IRIS_1 = { x: 0.529, y: 0.453 };
    const EYE_2 = { x: 0.483, y: 0.427 };
    const IRIS_2 = { x: 0.510, y: 0.415 };

    const NECK_COORDINATES = [
        0.043, 0.401,
        0.300, 0.401,
        0.296, 0.320,
        0.085, 0.343,
    ];

    const HEAD_COORDINATES = [
        0.309, 0.545,
        0.509, 0.567,
        0.649, 0.121,
        0.282, 0.129,
    ];

    const ANTENA_COORDINATES = [
        0.430, 0.584,
        0.430, 0.558,
        0.404, 0.556,
        0.404, 0.583,
    ];

    const EYEBROW_COORDINATES = [
        0.556, 0.495,
        0.412, 0.454,
        0.412, 0.476,
        0.548, 0.517,
    ];

    const NOSE_COORDINATES = [
        0.538, 0.389,
        0.624, 0.432,
        0.637, 0.400,
        0.544, 0.327,
    ];

    const MOUTH_COORDINATES_1 = [
        0.464, 0.331,
        0.525, 0.250,
        0.555, 0.081,
        0.441, 0.226,
    ];
    
    const MOUTH_COORDINATES_2 = [
        0.525, 0.250,
        0.694, 0.270,
        0.789, 0.128,
        0.555, 0.081,
    ];

    const MOUTH_COORDINATES_3 = [
        0.765, 0.382,
        0.789, 0.128,
        0.694, 0.270,
    ];

    drawPolygonWithBorder(gl, program, NECK_COORDINATES, robotColor2, modelMatrix);
    drawPolygonWithBorder(gl, program, HEAD_COORDINATES, robotColor1, modelMatrix);
    drawPolygonWithBorder(gl, program, ANTENA_COORDINATES, robotColor1, modelMatrix, 0.9, 0.9);
    drawPolygonWithBorder(gl, program, EYEBROW_COORDINATES, [0, 0, 0], modelMatrix);
    drawPolygonWithBorder(gl, program, NOSE_COORDINATES, robotColor2, modelMatrix);
    drawPolygonWithBorder(gl, program, MOUTH_COORDINATES_1, robotColor2, modelMatrix);
    drawPolygonWithBorder(gl, program, MOUTH_COORDINATES_3, robotColor2, modelMatrix);
    drawPolygonWithBorder(gl, program, MOUTH_COORDINATES_2, robotColor2, modelMatrix, 1.03);
    drawCircleWithBorder(gl, program, MOUTH_SCREW.x, MOUTH_SCREW.y, MOUTH_SCREW.r, robotColor1, modelMatrix);
    drawCircleWithBorder(gl, program, EYE_1.x, EYE_1.y, EYE_RADIUS, [1, 1, 1], modelMatrix);
    drawCircleWithBorder(gl, program, IRIS_1.x, IRIS_1.y, IRIS_RADIUS, [0, 0, 0], modelMatrix);
    drawCircleWithBorder(gl, program, EYE_2.x, EYE_2.y, EYE_RADIUS, [1, 1, 1], modelMatrix);
    drawCircleWithBorder(gl, program, IRIS_2.x, IRIS_2.y, IRIS_RADIUS, [0, 0, 0], modelMatrix);
}

function renderRobotBody(gl, program, modelMatrix = null) {
    const TOP_COORDINATES = [
        -0.132, 0.443,
        0.096, 0.463,
        0.227, 0.251,
        0.068, 0.238,
    ];

    const FRONT_COORDINATES = [
        0.227, 0.251,
        0.068, 0.238,
        -0.218, -0.244,
        -0.054, -0.217,
    ];

    const LATERAL_COORDINATES = [
        -0.218, -0.244,
        0.068, 0.238,
        -0.132, 0.443,
        -0.434, -0.055,
    ];

    drawPolygonWithBorder(gl, program, TOP_COORDINATES, robotColor1, modelMatrix);
    drawPolygonWithBorder(gl, program, LATERAL_COORDINATES, robotColor1, modelMatrix);
    drawPolygonWithBorder(gl, program, FRONT_COORDINATES, robotColor2, modelMatrix);
}
     
function renderRobotLeftArm(gl, program, modelMatrix = null) {
    const SHOLDER = { x: 0.027, y: 0.233 };
    const ELBOW = { x: 0.372, y: -0.109 };
    const HAND = { x: 0.680, y: -0.085 };
    const HAND_SCREW = { x: 0.725, y: -0.082, r: 0.027 }
    const ELBOW_SCREW = { x: 0.376, y: -0.109, r: 0.016}

    const ARM_COORDINATES = [
        0.055, 0.266,
        0, 0.2,
        0.348, -0.145,
        0.394, -0.074,
    ];

    const FOREARM_COORDINATES = [
        0.342, -0.090,
        0.348, -0.145,
        0.394, -0.074,
        0.683, -0.056,
        0.676, -0.117,
        0.348, -0.145,
    ];

    const HAND_COORDINATES_1 = [
        0.683, -0.056,
        0.676, -0.117,
        0.734, -0.132,
        0.759, -0.114,
        0.776, 0.026,
        0.709, 0.070,
    ];

    const HAND_COORDINATES_2 = [
        0.776, 0.026,
        0.709, 0.070,
        0.831, 0.091,
        0.855, 0.021,
    ];

    const HAND_COORDINATES_3 = [
        0.836, -0.184,
        0.865, -0.230,
        0.869, -0.091,
        0.827, -0.150,
        0.759, -0.114,
        0.734, -0.132,
        0.676, -0.117,
        0.865, -0.230,

    ];

    drawPolygonWithBorder(gl, program, ARM_COORDINATES, robotColor2, modelMatrix, 0.96, 0.96);
    drawPolygonWithBorder(gl, program, FOREARM_COORDINATES, robotColor2, modelMatrix);
    drawCircleWithBorder(gl, program, ELBOW_SCREW.x, ELBOW_SCREW.y, ELBOW_SCREW.r, robotColor2, modelMatrix);
    drawPolygonWithBorder(gl, program, HAND_COORDINATES_1, robotColor1, modelMatrix, 0.94, 1);
    drawPolygonWithBorder(gl, program, HAND_COORDINATES_2, robotColor1, modelMatrix, 1.02);
    drawPolygonWithBorder(gl, program, HAND_COORDINATES_3, robotColor1, modelMatrix, 0.96, 0.96);
    drawCircleWithBorder(gl, program, HAND_SCREW.x, HAND_SCREW.y, HAND_SCREW.r, robotColor1, modelMatrix);
}

function renderRobotRightArm (gl, program, modelMatrix = null) {
    const SHOLDER = { x: -0.114, y: 0.207 };
    const ELBOW = { x: -0.145, y: -0.175 };
    const ELBOW_SCREW = { x: -0.145, y: -0.165, r: 0.016}
    const HAND = { x: -0.180, y: -0.570 };
    const HAND_SCREW = { x: -0.167, y: -0.704, r: 0.025 }

    const ARM_COORDINATES = [
        -0.062, 0.211,
        -0.095, -0.180,
        -0.145, -0.195,
        -0.114, -0.266,
        -0.205, -0.175,
        -0.163, 0.213,
    ];
    
    const FOREARM_COORDINATES = [
        -0.145, -0.195,
        -0.188, -0.172,
        -0.233, -0.566,
        -0.126, -0.574,
        -0.095, -0.180,
    ];

    const HAND_COORDINATES_1 = [
        -0.180, -0.570,
        -0.233, -0.566,
        -0.314, -0.605,
        -0.314, -0.655,
        -0.228, -0.610,
        -0.217, -0.645,
        -0.159, -0.623, 
        -0.111, -0.655,
        -0.126, -0.574,
    ];

    const HAND_COORDINATES_2 = [
        -0.202, -0.811,
        -0.333, -0.780,
        -0.35, -0.705,
        -0.250, -0.743,
        -0.217, -0.645,
        -0.159, -0.623, 
        -0.111, -0.655,
        -0.101, -0.726,
    ];

    const sholderMatrix = updateSholderMatrix(modelMatrix, SHOLDER);
    const elbowMatrix = updateElbowMatrix(sholderMatrix, ELBOW);

    drawPolygonWithBorder(gl, program, ARM_COORDINATES, robotColor2, sholderMatrix);
    drawCircleWithBorder(gl, program, ELBOW_SCREW.x, ELBOW_SCREW.y, ELBOW_SCREW.r, robotColor2, sholderMatrix);
    drawPolygonWithBorder(gl, program, FOREARM_COORDINATES, robotColor2, elbowMatrix);
    drawPolygonWithBorder(gl, program, HAND_COORDINATES_1, robotColor1, elbowMatrix, 0.96, 0.96);
    drawPolygonWithBorder(gl, program, HAND_COORDINATES_2, robotColor1, elbowMatrix, 0.96, 0.96);
    drawCircleWithBorder(gl, program, HAND_SCREW.x, HAND_SCREW.y, HAND_SCREW.r, robotColor1, elbowMatrix);
}

function renderRobotLeftLeg(gl, program, modelMatrix = null) {
    const FRAME = [
        {
            KNEE_SCREW: { x: -0.031, y: -0.335, r: 0.016 },
            THIGH: [
                -0.175, -0.238,
                -0.052, -0.376,
                -0.010, -0.372,
                0.014, -0.328,
                -0.083, -0.222,
            ],
            CALF: [
                -0.052, -0.376,
                0, -0.616,
                0.060, -0.532,
                0.014, -0.328,
            ],
            FOOT_LATERAL: [
                0, -0.616,
                0, -0.671,
                0.119, -0.500,
                0.117, -0.450,
            ],
            FOOT_FRONT: [
                0.119, -0.500,
                0.266, -0.500,
                0.266, -0.450,
                0.117, -0.450,
            ],
            FOOT_BOTTOM: [
                0.119, -0.500,
                0.266, -0.500,
                0.122, -0.673,
                0, -0.671,
            ],
        },
        {
            KNEE_SCREW: { x: 0, y: 0, r: 0 },
            THIGH: [
                -0.140, -0.449,
                -0.259, -0.207,
                -0.215, -0.245,
                -0.167, -0.237,
                -0.067, -0.443,
            ],
            CALF: [
                -0.067, -0.443,
                -0.140, -0.449,
                -0.223, -0.695,
                -0.156, -0.666,
            ],
            FOOT_LATERAL: [
                -0.137, -0.778,
                -0.139, -0.835,
                -0.320, -0.762,
                -0.319, -0.707,
            ],
            FOOT_FRONT: [
                0.021, -0.717,
                -0.137, -0.778,
                -0.139, -0.835,
                0.021, -0.775,
            ],
            FOOT_BOTTOM: [
                -0.160, -0.666,
                0.021, -0.717,
                -0.137, -0.778,
                -0.319, -0.707,
            ],
        },
    ]

    let i = robotStep;
    drawPolygonWithBorder(gl, program, FRAME[i].CALF, robotColor2, modelMatrix);
    drawPolygonWithBorder(gl, program, FRAME[i].THIGH, robotColor2, modelMatrix);
    drawCircleWithBorder(gl, program, FRAME[i].KNEE_SCREW.x, FRAME[i].KNEE_SCREW.y, FRAME[i].KNEE_SCREW.r, robotColor2, modelMatrix);
    drawPolygonWithBorder(gl, program, FRAME[i].FOOT_LATERAL, robotColor1, modelMatrix);
    drawPolygonWithBorder(gl, program, FRAME[i].FOOT_FRONT, robotColor1, modelMatrix);
    drawPolygonWithBorder(gl, program, FRAME[i].FOOT_BOTTOM, robotColor1, modelMatrix);
}

function renderRobotRightLeg(gl, program, modelMatrix = null) {
    const FRAME = [
        {
            KNEE_SCREW: { x: -0.427, y: -0.420, r: 0.016 },
            THIGH: [
                -0.329, -0.147,
                -0.459, -0.389,
                -0.381, -0.441,
                -0.266, -0.202,
            ],
            CALF: [
                -0.4, -0.386,
                -0.381, -0.441,
                -0.586, -0.627,
                -0.678, -0.612,
                -0.459, -0.389,
            ],
            FOOT_TOP: [
                -0.586, -0.627,
                -0.678, -0.612,
                -0.782, -0.650,
                -0.552, -0.708,
                -0.375, -0.652,
                -0.564, -0.607,
            ],
            FOOT_LATERAL: [
                -0.782, -0.650,
                -0.552, -0.708,
                -0.552, -0.784,
                -0.782, -0.712,
            ],
            FOOT_FRONT: [
                -0.552, -0.708,
                -0.375, -0.652,
                -0.375, -0.722,
                -0.552, -0.784,
            ],
        },
        {
            KNEE_SCREW: { x: -0.0495, y: -0.379, r: 0.016 },
            THIGH: [
                -0.024, -0.426,
                -0.018, -0.369,
                -0.082, -0.222,
                -0.167, -0.237,
                -0.090, -0.388,
            ],
            CALF: [
                -0.024, -0.426,
                -0.090, -0.388,
                -0.258, -0.454,
                -0.273, -0.527,
            ],
            FOOT_TOP: [
                -0.365, -0.446,
                -0.183, -0.442,
                -0.228, -0.768,
                -0.414, -0.772,
            ],
            FOOT_LATERAL: [
                -0.414, -0.772,
                -0.365, -0.446,
                -0.413, -0.413,
                -0.466, -0.749,
            ],
            FOOT_FRONT: [
                -0.413, -0.413,
                -0.365, -0.446,
                -0.183, -0.442,
                -0.218, -0.410,
            ],
        },
    ]
    let i = robotStep;
    drawPolygonWithBorder(gl, program, FRAME[i].FOOT_LATERAL, robotColor1, modelMatrix);
    drawPolygonWithBorder(gl, program, FRAME[i].FOOT_FRONT, robotColor1, modelMatrix);
    drawPolygonWithBorder(gl, program, FRAME[i].FOOT_TOP, robotColor1, modelMatrix);
    drawPolygonWithBorder(gl, program, FRAME[i].THIGH, robotColor2, modelMatrix);
    drawPolygonWithBorder(gl, program, FRAME[i].CALF, robotColor2, modelMatrix);
    drawCircleWithBorder(gl, program, FRAME[i].KNEE_SCREW.x, FRAME[i].KNEE_SCREW.y, FRAME[i].KNEE_SCREW.r, robotColor2, modelMatrix);
}


function renderFlower() {
    const gl = flower.gl;
    const program = flower.program;
    
    gl.clearColor(0.67, 0.84, 1, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    renderStem(gl, program);

    if (isFlowerRotating) {
        flowerAnimationFrameId = requestAnimationFrame(() => renderFlower());
        flowerRotationAngle += 0.01;
    } else {
        cancelAnimationFrame(flowerAnimationFrameId);
    }
    const modelMatrix = mat4.create();
    mat4.identity(modelMatrix);
    mat4.rotate(modelMatrix, modelMatrix, flowerRotationAngle, [0, 0, 1]);
    renderFlowerHead(gl, program, modelMatrix);
}

function renderCar() {
    const gl = car.gl;
    const program = car.program;

    gl.clearColor(0.67, 0.84, 1, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    if (isCarMoving) {
        carAnimationFrameId = requestAnimationFrame(() => renderCar());
        updateCarBounce();
        updateRoadPosition();
        wheelRotationAngle += 0.1;
    } else {
        cancelAnimationFrame(carAnimationFrameId);
    }

    const roadMatrix = mat4.create();
    mat4.identity(roadMatrix);
    mat4.translate(roadMatrix, roadMatrix, [roadX, 0, 0]);
    renderRoad(gl, program, roadMatrix);

    const x = carCenterX;
    const y = carCenterY + carBounce;
    const carMatrix = mat4.create();
    mat4.identity(carMatrix);
    mat4.translate(carMatrix, carMatrix, [x, y, 0]);
    
    
    if (carSide === 0) {
        mat4.rotate(carMatrix, carMatrix, Math.PI, [0, 1, 0]);
    }
    mat4.translate(carMatrix, carMatrix, [-x, -y, 0]);
    mat4.translate(carMatrix, carMatrix, [0, carY + carBounce, 0]);
    renderCarBody(gl, program, carMatrix);
}

function renderRobot() {
    const gl = robot.gl;
    const program = robot.program;

    gl.clearColor(0.741, 0.624, 0.337, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    if (isRobotMoving) {
        requestAnimationFrame(() => renderRobot());
        updateWallPosition();
        updateRobotBounce();
        updateRightArm();
        robotFrameCount++;

        if (robotFrameCount >= robotFramesToStep) {
            robotFrameCount = 0;
            robotStep = robotStep === 0 ? 1 : 0;
        }
    } else {
        cancelAnimationFrame(robotAnimationFrameId);
    }

    renderWall(gl, program);
    renderSolo(gl, program);

    const legsMatrix = mat4.create();
    const bodyMatrix = mat4.create();
    mat4.identity(legsMatrix);
    mat4.identity(bodyMatrix);
    mat4.translate(bodyMatrix, bodyMatrix, [0, -robotBounce, 0]);
    if (robotSide === 0) {
        mat4.rotate(legsMatrix, legsMatrix, Math.PI, [0, 1, 0]);
        mat4.rotate(bodyMatrix, bodyMatrix, Math.PI, [0, 1, 0]);
    }

    renderRobotLeftArm(gl, program, bodyMatrix);
    renderRobotLeftLeg(gl, program, legsMatrix);
    renderRobotRightLeg(gl, program, legsMatrix);
    renderRobotBody(gl, program, bodyMatrix);
    renderRobotHead(gl, program, bodyMatrix);
    renderRobotRightArm(gl, program, bodyMatrix);
}


const canvasFlower = document.getElementById('flower');
const canvasCar = document.getElementById('car');
const canvasRobot = document.getElementById('robot');

const flower = startCanvas(canvasFlower);
let flowerAnimationFrameId = null;
let flowerRotationAngle = 0;
let isFlowerRotating = false;

const car = startCanvas(canvasCar);
let carAnimationFrameId = null;
let isCarMoving = false;
let carSide = 1;
let carY = -0.33;
let carBounce = 0;
let carBounceDirection = 1;
let carBounceSpeed = 0.001;
let carCenterX = -0.341;
let carCenterY = -0.457;
let roadX = 0;
let wheelRotationAngle = 0;
let carColor = [Math.random(), Math.random(), Math.random()];

const robot = startCanvas(canvasRobot);
const robotColor1 = [0.188, 0.494, 0.439];
const robotColor2 = [0.529, 0.784, 0.651];
const BRICKS = generateBricks();
let robotAnimationFrameId = null;
let isRobotMoving = false;
let robotSide = 1;
let wallX = 0;
let robotBounce = 0;
let robotBounceDirection = 1;
let robotBounceSpeed = 0.002;
let robotStep = 0;
let robotFrameCount = 0;
let robotFramesToStep = 20;
let sholderRotationAngle = 0;
let sholderRotationDirection = 1;

renderFlower();
renderCar();
renderRobot();

$('#flowerCheckbox').change(function() {
    if(this.checked) {
        isFlowerRotating = true;
        flowerAnimationFrameId = requestAnimationFrame(() => renderFlower());
    } else {
        isFlowerRotating = false;
    }
});

$('#carCheckbox').change(function() {
    if(this.checked) {
        isCarMoving = true;
        carAnimationFrameId = requestAnimationFrame(() => renderCar());
    } else {
        isCarMoving = false;
    }
});

$('#carDirection').change(function() {
    carSide = parseInt(this.value);
});

$(document).on("keydown", function(event) {
    if (event.key === "d" || event.key === "ArrowRight") {
        if (!isRobotMoving && robotSide === 1) {
            isRobotMoving = true;
            robotAnimationFrameId = requestAnimationFrame(() => renderRobot());
        } else if (robotSide === 0) {
            robotSide = 1;
            isRobotMoving = false;
            robotAnimationFrameId = requestAnimationFrame(() => renderRobot());
        } else if (!isRobotMoving) {
            robotSide = 1;
            robotAnimationFrameId = requestAnimationFrame(() => renderRobot());
        }
    }
    if (event.key === "a" || event.key === "ArrowLeft") {
        if (!isRobotMoving && robotSide === 0) {
            isRobotMoving = true;
            robotAnimationFrameId = requestAnimationFrame(() => renderRobot());
        } else if (robotSide === 1) {
            robotSide = 0;
            isRobotMoving = false;
            robotAnimationFrameId = requestAnimationFrame(() => renderRobot());
        } else if (!isRobotMoving){
            robotSide = 0;
            robotAnimationFrameId = requestAnimationFrame(() => renderRobot());
        }
    }
});