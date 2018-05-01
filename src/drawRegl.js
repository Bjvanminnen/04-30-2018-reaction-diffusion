
import createRegl from 'regl';

function createTexture(regl, width, height) {
  const data = new Uint8Array(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    data[i * 4 + 0] = 0xff;
    data[i * 4 + 1] = 0;
    data[i * 4 + 2] = 0;
    data[i * 4 + 3] = 1;
  }

  const getIndex = (row, col) =>  (row * width + col) * 4;

  // add a patch of B's
  for (let row = 100; row < 110; row++) {
    for (let col = 100; col < 110; col++) {
      const index = getIndex(row, col);
      // data[index] = 0;
      data[index + 1] = 0xff;
    }
  }

  return regl.framebuffer({
    color: regl.texture({
  	  data,
      width,
      height
  	}),
    depth: false,
    stencil: false
  });
}

function quad(left, right, top, bottom) {
  return [
    [left, bottom],
    [right, bottom],
    [right, top],

    [right, top],
    [left, bottom,],
    [left, top],
  ];
}

export default function drawRegl(canvas, updateColors) {
  const regl = createRegl({
    extensions: 'OES_texture_float',
    canvas,
  });
  const width = canvas.width;
  const height = canvas.height;

  const vert = `
  precision highp float;
  attribute vec2 a_pos;
  void main() {
    gl_Position = vec4(a_pos, 0., 1);
  }`;

  const update = regl({
    framebuffer: regl.prop('output'),
    frag: `
    precision highp float;
    uniform sampler2D u_tex;
    uniform vec2 u_res;

    void main () {
      float DA = 1.;
      float DB = 0.5;
      float f = 0.055;
      float k = 0.062;

      // cheat
      if (gl_FragCoord.x < 1. || gl_FragCoord.y < 1. ||
          abs(u_res.x - gl_FragCoord.x) < 1. || abs(u_res.y - gl_FragCoord.y) < 1.) {
        gl_FragColor = vec4(1., 0., 0., 1.);
        return;
      }

      vec2 prev = texture2D(u_tex, gl_FragCoord.xy / u_res).xy;
      float A = prev.r;
      float B = prev.g;

      vec2 diag1 = texture2D(u_tex, (gl_FragCoord.xy + vec2(-1., -1.)) / u_res).xy;
      vec2 diag2 = texture2D(u_tex, (gl_FragCoord.xy + vec2(-1., 1.)) / u_res).xy;
      vec2 diag3 = texture2D(u_tex, (gl_FragCoord.xy + vec2(1., -1.)) / u_res).xy;
      vec2 diag4 = texture2D(u_tex, (gl_FragCoord.xy + vec2(1., 1.)) / u_res).xy;

      vec2 neighbor1 = texture2D(u_tex, (gl_FragCoord.xy + vec2(1., 0.)) / u_res).xy;
      vec2 neighbor2 = texture2D(u_tex, (gl_FragCoord.xy + vec2(-1., 0.)) / u_res).xy;
      vec2 neighbor3 = texture2D(u_tex, (gl_FragCoord.xy + vec2(0., 1.)) / u_res).xy;
      vec2 neighbor4 = texture2D(u_tex, (gl_FragCoord.xy + vec2(0., -1.)) / u_res).xy;

      vec3 color = vec3(0.);

      vec2 lap = (
        -1. * prev +
        0.05 * (diag1 + diag2 + diag3 + diag4) +
        0.2 * (neighbor1 + neighbor2 + neighbor3 + neighbor4)
      );

      color.r = clamp(A + DA * lap.r - A * B * B + f * (1. - A), 0., 1.);
      color.g = clamp(B + DB * lap.g + A * B * B - (k + f) * B, 0., 1.);

      gl_FragColor = vec4(color, 1.);
    }`,
    vert,
    attributes: {
      a_pos: quad(-1, 1, 1, -1)
    },
    uniforms: {
      u_tex: regl.prop('input'),
      u_res: [width, height],
    },
    count: 6,
  });

  const drawTexture = regl({
    framebuffer: regl.prop('output'),
    frag: `
    precision mediump float;
  	uniform sampler2D u_tex;
    uniform vec2 u_res;
    void main() {
      vec2 st = gl_FragCoord.xy / u_res;
      vec4 val = texture2D(u_tex, st);
      vec3 color = vec3(val.r);
      gl_FragColor = vec4(color, 1.);
    }
    `,
    vert,
    attributes: {
      a_pos: quad(-1, 1, 1, -1)
    },
    uniforms: {
      u_tex: regl.prop('input'),
      u_res: [width, height],
    },
    count: 6,
  });

  run();

  function run(assets) {

    const getIndex = (row, col) =>  (row * width + col) * 4;

    let count = 0;
    let fbos = [
      createTexture(regl, width, height),
      createTexture(regl, width, height),
    ];

    setInterval(() => {
      count++;
      // modify fbo into fbo2
      update({
        // input: tex,
        input: fbos[0],
        output: fbos[1],
      });
      // write fbo to screen
      drawTexture({
        input: fbos[1],
      });

      if (count >= 20 && count < 50) {
        const pixels = regl.read({framebuffer: fbos[1]});
        const index = getIndex(100, 99);
        const val = Array.from(pixels.slice(index, index + 4)).map(x => x / 0xff);
        console.log(val);
      }

      fbos.reverse();
    }, 20);
  }
}
