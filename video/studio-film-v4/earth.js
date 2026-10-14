// 视频离线渲染专用，不进入官网运行包。真实 NASA 影像叠加球面光照和大气层。
export async function createEarthRenderer() {
  const surface = document.createElement("canvas"); surface.width = 1536; surface.height = 1536;
  const gl = surface.getContext("webgl", { alpha: true, antialias: true, preserveDrawingBuffer: true, premultipliedAlpha: false });
  if (!gl) throw new Error("Realistic earth render requires WebGL in the isolated rendering browser");
  const vertex = `attribute vec2 position; varying vec2 uv; void main(){uv=position*.5+.5;gl_Position=vec4(position,0.,1.);}`;
  const fragment = `
    precision highp float;
    varying vec2 uv;
    uniform sampler2D day;
    uniform sampler2D clouds;
    uniform float rotation;
    const float PI=3.14159265359;
    vec3 rotX(vec3 v,float a){return vec3(v.x,cos(a)*v.y-sin(a)*v.z,sin(a)*v.y+cos(a)*v.z);}
    vec3 rotY(vec3 v,float a){return vec3(cos(a)*v.x+sin(a)*v.z,v.y,-sin(a)*v.x+cos(a)*v.z);}
    vec2 sphereUV(vec3 n){return vec2(atan(n.x,n.z)/(2.*PI)+.5,asin(clamp(n.y,-1.,1.))/PI+.5);}
    void main(){
      vec2 p=(uv*2.-1.)/.92;
      float r=length(p);
      if(r>1.055){gl_FragColor=vec4(0.);return;}
      if(r>1.){
        float glow=pow(max(0.,1.-(r-1.)/.055),2.)*.55;
        gl_FragColor=vec4(.18,.53,.90,glow);return;
      }
      vec3 normal=vec3(p,sqrt(max(0.,1.-dot(p,p))));
      vec3 world=rotY(rotX(normal,-.34),rotation);
      vec3 worldCloud=rotY(rotX(normal,-.34),rotation+.011);
      vec3 light=normalize(vec3(-.65,.5,.82));
      float diffuse=max(0.,dot(normal,light));
      float shade=.035+.965*diffuse;
      vec3 sampled=texture2D(day,sphereUV(world)).rgb;
      vec3 color=pow(sampled,vec3(2.2))*shade;
      float ocean=smoothstep(.04,.21,sampled.b-sampled.r);
      vec3 halfVector=normalize(light+vec3(0.,0.,1.));
      float spec=pow(max(0.,dot(normal,halfVector)),75.);
      color+=vec3(.12,.17,.21)*spec*ocean;
      float cloud=texture2D(clouds,sphereUV(worldCloud)).r;
      float cover=smoothstep(.45,.88,cloud)*.64;
      color=mix(color,vec3(.84,.91,.98)*shade,cover);
      color=pow(max(color,vec3(0.)),vec3(1./2.2));
      float rim=pow(1.-normal.z,4.5);
      color+=vec3(.035,.11,.18)*rim*(.4+.6*diffuse);
      float edge=1.-smoothstep(.998,1.,r);
      gl_FragColor=vec4(color,edge);
    }
  `;
  function shader(type, source) {
    const s = gl.createShader(type); gl.shaderSource(s, source); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s;
  }
  const program = gl.createProgram(); gl.attachShader(program, shader(gl.VERTEX_SHADER, vertex)); gl.attachShader(program, shader(gl.FRAGMENT_SHADER, fragment)); gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
  gl.useProgram(program);
  const buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW);
  const attribute = gl.getAttribLocation(program, "position"); gl.enableVertexAttribArray(attribute); gl.vertexAttribPointer(attribute, 2, gl.FLOAT, false, 0, 0);
  async function texture(unit, name, url) {
    const image = new Image(); image.src = url; await image.decode();
    gl.activeTexture(gl.TEXTURE0 + unit); const texture = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.generateMipmap(gl.TEXTURE_2D);
    const anisotropy = gl.getExtension("EXT_texture_filter_anisotropic");
    if (anisotropy) gl.texParameterf(gl.TEXTURE_2D, anisotropy.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(8, gl.getParameter(anisotropy.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
    gl.uniform1i(gl.getUniformLocation(program, name), unit);
    return { width: image.naturalWidth, height: image.naturalHeight };
  }
  const dayDimensions = await texture(0, "day", "/assets/earth/day.jpg");
  const cloudDimensions = await texture(1, "clouds", "/assets/earth/clouds.jpg");
  const rotation = gl.getUniformLocation(program, "rotation"); gl.viewport(0, 0, surface.width, surface.height);
  return {
    dimensions: { day: dayDimensions, clouds: cloudDimensions, renderer: "1536px WebGL sphere" },
    draw(ctx, t, x, y, radius) {
      gl.uniform1f(rotation, 1.52 + t * .016); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); gl.drawArrays(gl.TRIANGLES, 0, 6); gl.finish();
      ctx.drawImage(surface, x - radius / .92, y - radius / .92, radius * 2 / .92, radius * 2 / .92);
    },
  };
}
