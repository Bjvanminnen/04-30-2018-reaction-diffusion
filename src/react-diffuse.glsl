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

  float feed_mod = 1.; //mix(0.9, 1.0, mapVal.r);
  float kill_mod = 1.; //mix(0.9, 1.0, mapVal.g);

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
}
