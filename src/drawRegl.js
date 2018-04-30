
import createRegl from 'regl';
import resl from 'resl';

function createTexture(regl, width, height) {
  const data = new Uint8Array(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    let x = i % width;
    let y = height - Math.floor(i / width);
    data[i * 4 + 0] = 0x35;
    data[i * 4 + 1] = 0;
    data[i * 4 + 2] = 0;
    data[i * 4 + 3] = 1;
  }

  const getIndex = (row, col) =>  (row * width + col) * 4;

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

  const updateBZ = regl({
    framebuffer: regl.prop('output'),
    frag: `
    precision highp float;
    uniform sampler2D u_tex;
    uniform vec2 u_res;

    float gte(float a, float b) {
      return step(a, b);
    }

    void main () {
      vec3 color = vec3(0.);

      vec2 loc1 = vec2(0.5, 0.) / u_res;
      vec2 loc2 = vec2(1.5, 0.) / u_res;
      float val1 = texture2D(u_tex, loc1).r * 255.;
      float val2 = texture2D(u_tex, loc1).r * 255.;
      if (val1 == val2) {
        color.r = 1.;
      } else {
        color.r = 0.;
      }
      if (val1 == 53.) {
        color.g = 1.;
      } else {
        color.g = 0.;
      }
      // if (val2 == 53.) {
      //   color.b = 1.;
      // } else {
      //   color.b = 0.;
      // }
      gl_FragColor = vec4(color, 1.);
    }`,
    vert: `
    precision highp float;
    attribute vec2 a_pos;
    void main() {
      gl_Position = vec4(a_pos, 0., 1);
    }
    `,
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
      gl_FragColor = texture2D(u_tex, st);
    }
    `,
    vert: `
    precision mediump float;
    attribute vec2 a_pos;
    void main() {
      gl_Position = vec4(a_pos, 0., 1);
    }
    `,
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
    const fbos = [
      createTexture(regl, width, height),
      createTexture(regl, width, height),
    ];
    const getIndex = (row, col) =>  (row * width + col) * 4;

    const colors = [];

    const colorAt = (pixels, row, col) => {
      const baseIndex = (row * width + col) * 4;
      const num = (pixels[baseIndex] << 16) +
        (pixels[baseIndex + 1] << 8) +
        pixels[baseIndex + 2];
      const hex = ('0000000' + num.toString(16)).slice(-6);
      return '#' + hex;
    };

    // modify fbo into fbo2
    updateBZ({
      // input: tex,
      input: fbos[0],
      output: fbos[1],
    });
    // write fbo to screen
    drawTexture({
      input: fbos[1],
    });
  }
}
