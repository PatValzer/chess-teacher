/**
 * ChessPieceFactory
 *
 * This class encapsulates the logic for creating 3D meshes for chess pieces using Three.js.
 * It provides a static method `createPiece` that returns a THREE.Object3D representing
 * a specific chess piece (pawn, rook, knight, bishop, queen, king) in a specific color.
 * The geometries are procedurally generated using LatheGeometry for bodies and basic shapes for details.
 */

import * as THREE from 'three';

export class ChessPieceFactory {
  static createPiece(type: string, color: 'w' | 'b'): THREE.Object3D {
    const isWhite = color === 'w';
    const material = new THREE.MeshStandardMaterial({
      color: isWhite ? 0xeecfa1 : 0x4b2a15,
      roughness: isWhite ? 0.5 : 0.2, // Dark pieces smoother to catch highlights
      metalness: isWhite ? 0.1 : 0.3, // Slight polish for dark pieces
      side: THREE.DoubleSide,
    });

    let mesh: THREE.Mesh | THREE.Group;

    // Helper to create lathe geometry from points
    // Ensure points start at x=0 to close bottom and end near x=0 or we cap it
    const createLathe = (points: THREE.Vector2[], segments = 32) => {
      // Add point 0,0 if not present to close bottom
      if (points[0].x > 0) {
        points.unshift(new THREE.Vector2(0, points[0].y));
      }
      const geometry = new THREE.LatheGeometry(points, segments);
      return new THREE.Mesh(geometry, material);
    };

    switch (type) {
      case 'p': // Pawn
        const pawnPoints = [
          // Base Molding
          new THREE.Vector2(0.35, 0), // Bottom radius (approx 70% of max width)
          new THREE.Vector2(0.35, 0.05), // Vertical base
          new THREE.Vector2(0.33, 0.05), // Step In
          new THREE.Vector2(0.33, 0.12), // Second vertical step (molded base)
          new THREE.Vector2(0.28, 0.18), // Curve up from base

          // Body (Column)
          new THREE.Vector2(0.24, 0.25), // Start of column
          new THREE.Vector2(0.16, 0.45), // Taper middle
          new THREE.Vector2(0.12, 0.58), // Thin neck

          // Collar
          new THREE.Vector2(0.22, 0.6), // Flared Collar bottom
          new THREE.Vector2(0.22, 0.63), // Collar Rim
          new THREE.Vector2(0.1, 0.63), // Collar Top (return to neck)

          // Close for head
          new THREE.Vector2(0, 0.63),
        ];
        const pawnBody = createLathe(pawnPoints);

        // Head (Sphere)
        const pawnHead = new THREE.Mesh(new THREE.SphereGeometry(0.16, 32, 32), material);
        pawnHead.position.y = 0.74; // Positioned right above the collar

        mesh = new THREE.Group();
        mesh.add(pawnBody);
        mesh.add(pawnHead);
        break;

      case 'r': // Rook
        // Base, straight body, slightly wider top
        const rookPoints = [
          new THREE.Vector2(0.3, 0),
          new THREE.Vector2(0.3, 0.1),
          new THREE.Vector2(0.25, 0.2),
          new THREE.Vector2(0.22, 0.6), // Body
          new THREE.Vector2(0.32, 0.7), // Flare top start
          new THREE.Vector2(0, 0.7), // Close for now, we add top details manually
        ];
        const rookBody = createLathe(rookPoints);

        // Top Rim with Battlements
        const topGroup = new THREE.Group();
        topGroup.position.y = 0.7;

        // Main rim cylinder
        const rimGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.15, 32);
        const rim = new THREE.Mesh(rimGeo, material);
        rim.position.y = 0.075;
        topGroup.add(rim);

        // Battlements (Merlons) around the edge
        const battlementCount = 6;
        const radius = 0.26;
        for (let i = 0; i < battlementCount; i++) {
          const angle = (i / battlementCount) * Math.PI * 2;
          const merlon = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.08), material);
          const mx = Math.cos(angle) * radius;
          const mz = Math.sin(angle) * radius;
          merlon.position.set(mx, 0.19, mz);
          merlon.rotation.y = -angle;
          topGroup.add(merlon);
        }

        mesh = new THREE.Group();
        mesh.add(rookBody);
        mesh.add(topGroup);
        break;

      case 'n': // Knight
        const knightGroup = new THREE.Group();
        // Base
        const kBasePoints = [
          new THREE.Vector2(0.32, 0),
          new THREE.Vector2(0.32, 0.1),
          new THREE.Vector2(0.25, 0.2),
          new THREE.Vector2(0.25, 0.3),
          new THREE.Vector2(0, 0.3), // Close top of base
        ];
        const kBase = createLathe(kBasePoints);
        knightGroup.add(kBase);

        // Body/Head
        const bodyGeo = new THREE.BoxGeometry(0.3, 0.6, 0.2);
        const body = new THREE.Mesh(bodyGeo, material);
        body.position.y = 0.5;
        body.rotation.x = -0.2;
        knightGroup.add(body);

        const snoutGeo = new THREE.BoxGeometry(0.2, 0.2, 0.3);
        const snout = new THREE.Mesh(snoutGeo, material);
        snout.position.set(0, 0.7, 0.2);
        knightGroup.add(snout);

        const maneGeo = new THREE.BoxGeometry(0.1, 0.5, 0.1);
        const mane = new THREE.Mesh(maneGeo, material);
        mane.position.set(0, 0.6, -0.15);
        knightGroup.add(mane);

        mesh = knightGroup;
        break;

      case 'b': // Bishop
        const bishopPoints = [
          new THREE.Vector2(0.32, 0),
          new THREE.Vector2(0.32, 0.1),
          new THREE.Vector2(0.2, 0.3),
          new THREE.Vector2(0.12, 0.7),
          new THREE.Vector2(0.2, 0.8), // Collar
          new THREE.Vector2(0, 0.8), // Close
        ];
        const bishopBody = createLathe(bishopPoints);

        // Head Group for non-uniform scaling
        const headGroup = new THREE.Group();
        headGroup.position.y = 0.95;
        headGroup.scale.set(1, 1.45, 1); // Elongated head

        // Sliced Sphere for the "Mitre" cut
        // phiStart=0.25, phiLength=2PI-0.5 => A wedge missing at angle 0
        const cutSphereGeo = new THREE.SphereGeometry(0.18, 32, 32, 0.25, Math.PI * 2 - 0.5);
        const cutSphere = new THREE.Mesh(cutSphereGeo, material);
        // Rotate so gap is at approx 45 degrees
        // The gap is centered at phi=0 (positive X axis in standard mapping).
        // Rotate Z by 45deg moves X axis up-left.
        cutSphere.rotation.z = Math.PI / 4;
        cutSphere.rotation.y = -Math.PI / 2; // Adjust to face front/side? Let's stick to simple Z rotation.
        // Actually, phi=0 is +X. Z rotation rotates X towards Y.
        // 45deg -> Cut is Top-Right.
        headGroup.add(cutSphere);

        // Solid Core to make the head look solid (fill the shell)
        // Since headGroup is scaled Y, a sphere inside would also be ellipsoid.
        // We want a solid filler.
        const coreGeo = new THREE.SphereGeometry(0.16, 16, 16);
        const core = new THREE.Mesh(coreGeo, material);
        headGroup.add(core);

        const bishopTop = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 16), material);
        bishopTop.position.y = 1.35; // Position relative to world (it's added to mesh, not headGroup)

        mesh = new THREE.Group();
        mesh.add(bishopBody);
        mesh.add(headGroup);
        mesh.add(bishopTop);
        break;

      case 'q': // Queen
        const queenPoints = [
          new THREE.Vector2(0.35, 0),
          new THREE.Vector2(0.35, 0.15),
          new THREE.Vector2(0.25, 0.3),
          new THREE.Vector2(0.15, 0.9),
          new THREE.Vector2(0.3, 1.0),
          new THREE.Vector2(0.3, 1.1),
          new THREE.Vector2(0, 1.1), // Close top flat
        ];
        const queenBody = createLathe(queenPoints);
        const queenBall = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 16), material);
        queenBall.position.y = 1.15;

        mesh = new THREE.Group();
        mesh.add(queenBody);
        mesh.add(queenBall);
        break;

      case 'k': // King
        const kingPoints = [
          new THREE.Vector2(0.35, 0),
          new THREE.Vector2(0.35, 0.15),
          new THREE.Vector2(0.25, 0.3),
          new THREE.Vector2(0.15, 0.9),
          new THREE.Vector2(0.3, 1.05),
          new THREE.Vector2(0, 1.05), // Close top
        ];
        const kingBody = createLathe(kingPoints);

        const crossGrp = new THREE.Group();
        const vBar = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.3, 0.08), material);
        vBar.position.y = 1.25;
        const hBar = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.08, 0.08), material);
        hBar.position.y = 1.25;
        crossGrp.add(vBar);
        crossGrp.add(hBar);

        mesh = new THREE.Group();
        mesh.add(kingBody);
        mesh.add(crossGrp);
        break;

      default:
        mesh = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), material);
    }

    mesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    return mesh;
  }
}
