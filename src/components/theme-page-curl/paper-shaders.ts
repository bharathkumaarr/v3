/**
 * GLSL for the paper sheet.
 *
 * All deformation happens on the GPU: the CPU only writes a handful of scalar uniforms
 * per frame, so there is no per-vertex work in JS and nothing is allocated in the loop.
 *
 * Vertices arrive in normalized local space (-0.5 to 0.5 on both axes) and are scaled to
 * viewport pixels in the shader, which means a resize never rebuilds the geometry.
 */

export const paperVertexShader = /* glsl */ `
  uniform vec2 uSize;        // viewport in CSS pixels
  uniform vec2 uCorner;      // grabbed corner, world space
  uniform vec2 uDir;         // unit fold direction, world space
  uniform vec2 uPerp;        // unit vector along the crease
  uniform float uCrease;     // corner-to-crease distance
  uniform float uRadius;     // cylinder radius at the grabbed corner
  uniform float uMaxAngle;   // hard stop on the wrap angle
  uniform float uCone;       // how much looser the curl gets along the crease
  uniform float uConeSpan;   // distance over which the cone term ramps in
  uniform float uSag;        // gravity droop at the lifted tip

  varying float vArc;        // undeformed distance past the crease
  varying float vAngle;      // wrap angle at this vertex
  varying float vLift;       // height above the page
  varying vec3 vNormal;

  void main() {
    vec2 world = position.xy * uSize;
    vec2 rel = world - uCorner;

    // Distance from the crease, measured toward the grabbed corner.
    float arc = uCrease - dot(rel, uDir);
    vArc = arc;

    if (arc <= 0.0 || uRadius <= 0.0) {
      vAngle = 0.0;
      vLift = 0.0;
      vNormal = normalize(normalMatrix * vec3(0.0, 0.0, 1.0));
      gl_Position = projectionMatrix * modelViewMatrix * vec4(world, 0.0, 1.0);
      return;
    }

    // Real page turns are conical rather than cylindrical: the curl is tightest at the
    // grabbed corner and opens up along the crease. The cone term is zero at the corner,
    // so the corner still lands exactly under the pointer.
    float across = abs(dot(rel, uPerp));
    float radius = uRadius * (1.0 + uCone * clamp(across / max(uConeSpan, 1.0), 0.0, 1.0));

    // Wrap the arc around the cylinder. Past the hard stop the sheet continues along the
    // tangent instead of spiralling back into itself.
    float angle = min(arc / radius, uMaxAngle);
    float overshoot = max(arc - angle * radius, 0.0);

    float offsetAlong = radius * sin(angle) + overshoot * cos(angle);
    float offsetUp = radius * (1.0 - cos(angle)) + overshoot * sin(angle);

    // Arc length is preserved, so the sheet bends without stretching.
    vec2 towardCorner = -uDir;
    vec2 folded = world + towardCorner * (offsetAlong - arc);

    float droop = clamp(arc / max(uCrease, 1.0), 0.0, 1.0);
    folded.y -= uSag * droop * droop;

    vAngle = angle;
    vLift = offsetUp;
    vNormal = normalize(normalMatrix * vec3(uDir * sin(angle), cos(angle)));

    gl_Position = projectionMatrix * modelViewMatrix * vec4(folded, offsetUp, 1.0);
  }
`;

export const paperFragmentShader = /* glsl */ `
  uniform vec3 uFrontColor;     // page background of the active theme
  uniform vec3 uBackColor;      // page background of the theme underneath
  uniform float uReverseShade;  // this sheet's own stock, seen from behind
  uniform float uReverseBlend;  // 0 = paper stock, 1 = fully the other theme
  uniform vec3 uLightDir;
  uniform float uAmbient;
  uniform float uSpecular;
  uniform float uSpecularPower;
  uniform float uFeather;
  uniform float uOcclusion;
  uniform float uEdgeShade;
  uniform float uEdgeSpread;

  varying float vArc;
  varying float vAngle;
  varying float vLift;
  varying vec3 vNormal;

  void main() {
    // Feathering the crease keeps the seam against the real DOM from aliasing.
    float alpha = smoothstep(0.0, uFeather, vArc);
    if (alpha <= 0.002) discard;

    vec3 normal = normalize(vNormal);
    if (!gl_FrontFacing) normal = -normal;

    vec3 view = vec3(0.0, 0.0, 1.0);
    vec3 light = normalize(uLightDir);
    vec3 halfVector = normalize(light + view);

    // Normalized so an unrotated facet lands on exactly 1.0. Without this the paper
    // meets the real DOM at the crease a few percent darker and the join shows up as a
    // hairline, even though the surfaces are tangent there.
    float flatShade = uAmbient + (1.0 - uAmbient) * max(light.z, 0.0);
    float shade =
      (uAmbient + (1.0 - uAmbient) * max(dot(normal, light), 0.0)) / max(flatShade, 0.001);

    float highlight = pow(max(dot(normal, halfVector), 0.0), uSpecularPower) * uSpecular;

    // The reverse of the sheet reads as its own stock while the corner is barely lifted,
    // and becomes the other theme once it has properly turned over.
    vec3 reverse = mix(uFrontColor * uReverseShade, uBackColor, uReverseBlend);
    vec3 base = gl_FrontFacing ? uFrontColor : reverse;

    // Ambient occlusion through the tightest part of the bend.
    float bend = smoothstep(0.25, 1.5, vAngle) * (1.0 - smoothstep(2.5, 3.3, vAngle));
    float occlusion = 1.0 - uOcclusion * bend;

    // Edge-on fragments darken slightly. That gradient is what reads as sheet thickness,
    // without extruding geometry that would look like card stock.
    float facing = abs(dot(normal, view));
    float edge = 1.0 - uEdgeShade * (1.0 - smoothstep(0.0, uEdgeSpread, facing));

    vec3 color = base * shade * occlusion * edge + highlight;

    gl_FragColor = vec4(color, alpha);
  }
`;

/**
 * Shadow pass.
 *
 * A flat viewport-sized quad drawn under the sheet. Because the canvas composites over
 * the real DOM, semi-transparent dark pixels here darken the revealed page directly. The
 * pass discards everything on the flat side of the crease so the untouched part of the
 * site stays pixel-identical.
 */
export const shadowVertexShader = /* glsl */ `
  uniform vec2 uSize;
  varying vec2 vWorld;

  void main() {
    vWorld = position.xy * uSize;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(vWorld, 0.0, 1.0);
  }
`;

export const shadowFragmentShader = /* glsl */ `
  uniform vec2 uCorner;
  uniform vec2 uDir;
  uniform float uCrease;
  uniform float uRadius;
  uniform float uStrength;
  uniform float uSpread;
  uniform float uMaxSpread;
  uniform float uSpill;
  uniform float uSpillReach;
  uniform float uMaxSpillReach;
  uniform float uSpillOnset;
  uniform float uMinContact;
  uniform float uContactFade;
  uniform float uProgress;
  uniform vec3 uBackColor;
  uniform vec3 uShadowColor;

  varying vec2 vWorld;

  void main() {
    float arc = uCrease - dot(vWorld - uCorner, uDir);
    if (uRadius <= 0.0) discard;

    // How far the sheet has lifted, and therefore how soft and spread out its shadow is.
    float lift = uRadius * 2.0;

    // Contact darkness eases off as the paper separates from the page, down to a floor.
    float contact = mix(1.0, uMinContact, clamp(lift / uContactFade, 0.0, 1.0));

    // Beyond the roll, toward the original corner, the sheet has left the page. Without
    // a fill that region shows empty margin as a blank slab in front of the fold. Match
    // the reveal theme underneath (uBackColor) so light→dark does not flash medium grey
    // from a front/back mix; fade out late so the real reveal can take over for commit.
    if (arc > uRadius * 0.9) {
      float fill = (1.0 - smoothstep(0.32, 0.78, uProgress)) *
        smoothstep(uRadius * 0.7, uRadius * 1.05, arc);
      if (fill > 0.01) {
        gl_FragColor = vec4(uBackColor, fill);
        return;
      }
    }

    float alpha;

    if (arc > 0.0) {
      // Revealed side. The roll's silhouette sits one radius past the crease, so the
      // shade is deepest there and falls off toward the sheet's original corner.
      float spread = min(uSpread + lift * 0.55, uMaxSpread);
      float falloff = exp(-max(arc - uRadius, 0.0) / max(spread, 1.0));

      // Ease in from the crease. Everything inside this ramp is hidden behind the roll,
      // so nothing is lost, and it stops the shade bleeding through the roll's feathered
      // edge as a hairline along the fold.
      float enter = smoothstep(0.0, max(uRadius * 0.5, 8.0), arc);

      alpha = uStrength * falloff * enter * contact;
    } else {
      // Untouched page. The roll overhangs it and drops a soft shadow across, which is
      // what seats the fold on the page. Ramped in over a few pixels so it meets the
      // revealed side at zero and the crease itself stays seamless.
      float past = -arc;
      float reach = min(uSpillReach + lift * 0.16, uMaxSpillReach);
      alpha =
        uStrength * uSpill * contact *
        smoothstep(0.0, uSpillOnset, past) * exp(-past / max(reach, 1.0));
    }

    if (alpha <= 0.003) discard;
    gl_FragColor = vec4(uShadowColor, alpha);
  }
`;
