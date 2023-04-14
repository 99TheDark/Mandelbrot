#version 300 es

precision highp float;

uniform vec2 size;
uniform float time;

uniform float zoom;
uniform vec2 offset;

in vec2 pos;
out vec4 color;

#define MAX_ITERATIONS 100

#define col vec3(0.18, 0.6, 0.62)

void main() {
    vec2 coord = (pos * normalize(size) - offset / size) / zoom;

    coord = pos * normalize(size) / exp(time - 2.0) + vec2(0.15101, 0.609109);

    vec2 z = vec2(0.0);
    int iters = 0;
    for(int i = 0; i < MAX_ITERATIONS; i++, iters++) {
        // https://arukiap.github.io/fractals/2019/06/02/rendering-the-mandelbrot-set-with-shaders.html
        vec2 squared = vec2(
            z.x * z.x - z.y * z.y,
            2.0 * z.x * z.y
        );

        z = squared + coord;
        if(length(z) > 2.0) break;
    }

    float lum = float(iters) / float(MAX_ITERATIONS);

    if(iters == MAX_ITERATIONS) lum = 0.0;

    color = vec4(lum * col, 1.0);
}