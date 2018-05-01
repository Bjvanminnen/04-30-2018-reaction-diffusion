import resl from 'resl';
import createRegl from 'regl';

// TODO: interpret mouse data?
// TODO: use an input image to affect kill/growth rates

function createTexture(regl, width, height) {
  const data = new Float32Array(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    data[i * 4 + 0] = 1;
    data[i * 4 + 1] = 0;
    data[i * 4 + 2] = 0;
    data[i * 4 + 3] = 1;
  }

  const getIndex = (row, col) =>  (row * width + col) * 4;

  // add a patch of B's
  const startX = Math.floor(width / 2) - 10;
  const startY = Math.floor(height / 2) - 10;
  for (let row = startY; row < startY + 20; row++) {
    for (let col = startX; col < startX + 20; col++) {
      const index = getIndex(row, col);
      if (Math.random() < 0.2) {
        data[index + 1] = 1;
      }
    }
  }

  return regl.framebuffer({
    color: regl.texture({
      data,
      width,
      height,
      type: 'float',
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

function vec3Color(hex) {
  const match = /#([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})/.exec(hex);
  return match.slice(1).map(x => parseInt(x, 16) / 0xff);
}

export default function drawRegl(canvas, feedRate, killRate) {
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
    uniform sampler2D u_map;
    uniform vec2 u_res;
    uniform float u_f; // feed rate
    uniform float u_k; // kill rate

    void main () {
      float DA = 1.;
      float DB = 0.4;
      float dt = 1.;

      // cheat
      if (gl_FragCoord.x < 1. || gl_FragCoord.y < 1. ||
          abs(u_res.x - gl_FragCoord.x) < 1. || abs(u_res.y - gl_FragCoord.y) < 1.) {
        gl_FragColor = vec4(0., 0., 0., 1.);
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

      vec3 mapVal = texture2D(u_map, gl_FragCoord.xy / u_res).rgb;

      float feed_mod = mix(0.9, 1.0, mapVal.r);
      float kill_mod = mix(0.9, 1.0, mapVal.g);

      float feed = u_f * feed_mod; // + u_f * (gl_FragCoord.y / u_res.y) * 0.1;
      float kill = u_k * kill_mod; // - u_k * (gl_FragCoord.x / u_res.x) * 0.03;

      vec2 lap = (
        -1. * prev +
        0.05 * (diag1 + diag2 + diag3 + diag4) +
        0.2 * (neighbor1 + neighbor2 + neighbor3 + neighbor4)
      );

      color.r = clamp(A + dt * (DA * lap.r - A * B * B + feed * (1. - A)), 0., 1.);
      color.g = clamp(B + dt * (DB * lap.g + A * B * B - (kill + feed) * B), 0., 1.);

      gl_FragColor = vec4(color, 1.);
    }`,
    vert,
    attributes: {
      a_pos: quad(-1, 1, 1, -1)
    },
    uniforms: {
      u_tex: regl.prop('input'),
      u_res: [width, height],
      u_map: regl.prop('heightMap'),
      u_f: feedRate,
      u_k: killRate,
    },
    count: 6,
  });

  const drawTexture = regl({
    framebuffer: regl.prop('output'),
    frag: `
    precision mediump float;
    uniform sampler2D u_tex;
    uniform vec2 u_res;
    uniform vec3 u_color1;
    uniform vec3 u_color2;
    void main() {
      vec2 st = gl_FragCoord.xy / u_res;
      vec4 val = texture2D(u_tex, st);
      float bw = clamp(val.r - val.g, 0., 1.);
      vec3 color = mix(u_color2, u_color1, bw);
      // if (bw > 0.99) {
      //   color = color3;
      // }
      // color = val.rgb;
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
      u_color1: regl.prop('color1'),
      u_color2: regl.prop('color2'),
    },
    count: 6,
  });

  resl({
    manifest: {
      spiral: {
        type: 'image',
        src: require('./assets/triangles.png'),
      }
    },
    onDone: assets => run(assets)
  });

  function run(assets) {
    let count = 0;
    let fbos = [
      createTexture(regl, width, height),
      createTexture(regl, width, height),
    ];

    const heightMap = regl.texture(assets.spiral);

    setInterval(() => {
      count++;
      // modify fbo into fbo2
      update({
        // input: tex,
        input: fbos[0],
        output: fbos[1],
        heightMap,
      });
      // write fbo to screen
      if (count % 10 === 0) {
        drawTexture({
          input: fbos[1],
          color2: vec3Color('#3ad7ff'),
          color1: vec3Color('#5A3357'),
        });
      }

      fbos.reverse();
    }, 0);
  }
}
