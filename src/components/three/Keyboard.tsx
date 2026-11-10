"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import {
  CanvasTexture,
  Matrix4,
  Quaternion,
  SRGBColorSpace,
  Vector3,
  type InstancedMesh,
  type MeshBasicMaterial,
} from "three";
import {
  KEYBOARD_AREA_D,
  KEYBOARD_AREA_W,
  KEYCAPS,
  KEYCAP_HEIGHT,
  LEGEND_CANVAS_H,
  LEGEND_CANVAS_W,
  drawKeyboardLegends,
} from "./keyboardLayout";

/** Top of the laptop base, where the keycaps sit. */
const DECK_Y = 0.1;
const LEGEND_Y = DECK_Y + KEYCAP_HEIGHT + 0.0015;

function createLegendTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = LEGEND_CANVAS_W;
  canvas.height = LEGEND_CANVAS_H;
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  return { ctx: canvas.getContext("2d"), texture };
}

type KeyboardProps = {
  /** Keycap colour. */
  keycap: string;
  /** Legend colour (the light token). */
  legend: string;
  accent: string;
  /** Centre of the keyboard area on the deck, along z. */
  z: number;
};

/** Instanced keycaps plus one legend plane: two draw calls for the whole keyboard. */
export function Keyboard({ keycap, legend, accent, z }: KeyboardProps) {
  const keys = useRef<InstancedMesh>(null);
  const legendMaterial = useRef<MeshBasicMaterial>(null);
  const legends = useRef<ReturnType<typeof createLegendTexture>>(null);

  useLayoutEffect(() => {
    const mesh = keys.current;
    if (!mesh) return;
    const matrix = new Matrix4();
    const rotation = new Quaternion();
    const position = new Vector3();
    const scale = new Vector3();
    KEYCAPS.forEach((key, index) => {
      position.set(key.x, DECK_Y + KEYCAP_HEIGHT / 2, key.z);
      scale.set(key.w, KEYCAP_HEIGHT, key.d);
      mesh.setMatrixAt(index, matrix.compose(position, rotation, scale));
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, []);

  // Texture lives in a ref and is attached to the material imperatively, then disposed on unmount.
  useEffect(() => {
    const material = legendMaterial.current;
    const created = createLegendTexture();
    legends.current = created;
    if (material) {
      material.map = created.texture;
      material.needsUpdate = true;
    }
    return () => {
      if (material) material.map = null;
      created.texture.dispose();
      legends.current = null;
    };
  }, []);

  // Redraw the legends only when the theme colours change.
  useEffect(() => {
    const target = legends.current;
    if (!target?.ctx) return;
    drawKeyboardLegends(target.ctx, { legend, accent });
    target.texture.needsUpdate = true;
  }, [legend, accent]);

  return (
    <group position={[0, 0, z]}>
      <instancedMesh ref={keys} args={[undefined, undefined, KEYCAPS.length]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={keycap} roughness={0.6} />
      </instancedMesh>
      <mesh position={[0, LEGEND_Y, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[KEYBOARD_AREA_W, KEYBOARD_AREA_D]} />
        <meshBasicMaterial ref={legendMaterial} transparent depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  );
}
