Promise.all([
    fetch("shader.vert"),
    fetch("shader.frag")
])
    .then(files => Promise.all(
        files.map(file => file.text())
    ))
    .then(texts => main.apply(null, texts))

var main = (vertexSource, fragmentSource) => {
    const canvas = document.getElementById("mandelbrot");
    const gl = canvas.getContext("webgl2");

    const [width, height] = [canvas.width, canvas.height] = [innerWidth, innerHeight];

    if(!gl) {
        throw "Your browser does not support WebGL.";
    }

    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

    gl.shaderSource(vertexShader, vertexSource);
    gl.shaderSource(fragmentShader, fragmentSource);

    gl.compileShader(vertexShader);
    gl.compileShader(fragmentShader);

    if(!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS))
        throw "Error compiling vertex shader.\n\n" + gl.getShaderInfoLog(vertexShader);
    if(!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS))
        throw "Error compiling fragment shader.\n\n" + gl.getShaderInfoLog(fragmentShader);

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if(!gl.getProgramParameter(program, gl.LINK_STATUS))
        throw "Error linking program.\n\n" + gl.getProgramInfoLog(program);

    gl.validateProgram(program);
    if(!gl.getProgramParameter(program, gl.VALIDATE_STATUS))
        throw "Error validating program.\n\n" + gl.getProgramInfoLog(program);

    const fs = Float32Array.BYTES_PER_ELEMENT;

    const tris = new Float32Array([
        -1, 1,
        1, 1,
        -1, -1,
        1, -1,
        1, 1,
        -1, -1
    ]);

    const triBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, triBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, tris, gl.STATIC_DRAW);

    const posAttribLocation = gl.getAttribLocation(program, "vertPos");
    gl.vertexAttribPointer(posAttribLocation, 2, gl.FLOAT, gl.FALSE, 2 * fs, 0);
    gl.enableVertexAttribArray(posAttribLocation);

    gl.useProgram(program);

    gl.viewport(0, 0, width, height);

    const sizeUniformLocation = gl.getUniformLocation(program, "size");
    gl.uniform2f(sizeUniformLocation, width, height);

    let pos = {
        zoom: 0.5,
        x: width / 2,
        y: 0
    };

    let mouse = {
        x: 0,
        y: 0
    };

    const draw = () => {
        let time = performance.now() / 1000;

        const timeUniformLocation = gl.getUniformLocation(program, "time");
        gl.uniform1f(timeUniformLocation, time);

        const zoomUniformLocation = gl.getUniformLocation(program, "zoom");
        gl.uniform1f(zoomUniformLocation, pos.zoom);

        const offsetUniformLocation = gl.getUniformLocation(program, "offset");
        gl.uniform2f(offsetUniformLocation, pos.x, pos.y);

        gl.clearColor(1.0, 1.0, 1.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
        requestAnimationFrame(draw);
    };

    document.addEventListener("wheel", e => {
        pos.zoom = Math.max(0, pos.zoom - e.deltaY / 100);
        
        let mat = new DOMMatrix()
            .translateSelf(mouse.x, mouse.y)
            .scaleSelf(pos.zoom, pos.zoom)
            .translateSelf(-mouse.x, -mouse.y);
        
        let p = new DOMPoint(pos.x, pos.y).matrixTransform(mat);
        
        pos.x = p.x;
        pos.y = p.y;
    });

    document.addEventListener("mousemove", e => {
        mouse.x = e.screenX;
        mouse.y = e.screenY;
    });

    requestAnimationFrame(draw);
};