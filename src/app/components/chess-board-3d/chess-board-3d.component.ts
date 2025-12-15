import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  HostListener,
  NgZone,
  OnDestroy,
  input,
  output,
  effect,
} from '@angular/core';
import * as THREE from 'three';
import { Chess, Square } from 'chess.js';

@Component({
  selector: 'app-chess-board-3d',
  templateUrl: './chess-board-3d.component.html',
  styleUrls: ['./chess-board-3d.component.css'],
  standalone: true,
})
export class ChessBoard3dComponent implements AfterViewInit, OnDestroy {
  @ViewChild('rendererContainer') rendererContainer!: ElementRef;

  boardTheme = input<string>('default');
  fen = input.required<string>();
  orientation = input<'white' | 'black'>('white');
  move = output<{ from: string; to: string }>();

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private boardGroup!: THREE.Group;
  private piecesGroup!: THREE.Group;
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();

  private squares: THREE.Mesh[][] = []; // 8x8 grid of meshes
  // Map 'a1' -> Piece Mesh
  private pieces = new Map<string, THREE.Object3D>();

  private selectedSquare: string | null = null;
  // Visual marker for selection
  private selectionMarker!: THREE.Mesh;

  private chess = new Chess();
  private animationId!: number;
  private textureLoader = new THREE.TextureLoader();

  constructor(private ngZone: NgZone) {
    effect(() => {
      const fen = this.fen();
      this.chess.load(fen);
      if (this.piecesGroup) {
        this.updateBoardState();
      }
    });

    effect(() => {
      const orientation = this.orientation();
      if (this.camera) {
        this.updateCameraPosition();
      }
    });

    effect(() => {
      const theme = this.boardTheme();
      if (this.boardGroup) {
        this.createBoard();
      }
    });
  }

  ngAfterViewInit() {
    this.initThree();
    this.createBoard();
    this.updatePieces();
    this.ngZone.runOutsideAngular(() => {
      this.animate();
    });
    // setTimeout to ensure size is correct after layout
    setTimeout(() => this.handleResize(), 0);
  }

  ngOnDestroy() {
    cancelAnimationFrame(this.animationId);
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer.domElement.remove();
    }
  }

  @HostListener('window:resize')
  handleResize() {
    if (this.camera && this.rendererContainer) {
      const width = this.rendererContainer.nativeElement.clientWidth;
      const height = this.rendererContainer.nativeElement.clientHeight;
      if (width && height) {
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
      }
    }
  }

  private initThree() {
    const width = this.rendererContainer.nativeElement.clientWidth;
    const height = this.rendererContainer.nativeElement.clientHeight;

    this.scene = new THREE.Scene();
    // Removed background color for transparency

    this.camera = new THREE.PerspectiveCamera(30, width / height, 0.1, 100);
    this.updateCameraPosition();

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setClearColor(0x000000, 0); // Transparent background
    this.renderer.shadowMap.enabled = true;
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.rendererContainer.nativeElement.appendChild(this.renderer.domElement);

    // Lighting - Increased intensity
    // Lighting - Updated for better definition of dark pieces
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
    this.scene.add(ambientLight);

    // Main Key Light
    const dirLight = new THREE.DirectionalLight(0xffffff, 2.5);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    this.scene.add(dirLight);

    // Rim/Back Light to catch edges of black pieces
    const backLight = new THREE.DirectionalLight(0xcceeff, 2.0);
    backLight.position.set(-10, 15, -5);
    this.scene.add(backLight);

    // Fill Light
    const pointLight = new THREE.PointLight(0xffaa00, 1.0);
    pointLight.position.set(-5, 10, 5);
    this.scene.add(pointLight);

    this.boardGroup = new THREE.Group();
    this.scene.add(this.boardGroup);

    this.piecesGroup = new THREE.Group();
    this.scene.add(this.piecesGroup);

    // Selection Marker
    const markerGeo = new THREE.PlaneGeometry(0.9, 0.9);
    const markerMat = new THREE.MeshBasicMaterial({
      color: 0xffff00,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
    });
    this.selectionMarker = new THREE.Mesh(markerGeo, markerMat);
    this.selectionMarker.rotation.x = -Math.PI / 2;
    this.selectionMarker.visible = false;
    this.scene.add(this.selectionMarker);
  }

  private updateCameraPosition() {
    if (!this.camera) return;
    if (this.orientation() === 'white') {
      this.camera.position.set(0, 16, 12); // Moved back/up for lower FOV
      this.camera.lookAt(0, -1, 0); // Look slightly below center to center board better
    } else {
      this.camera.position.set(0, 16, -12);
      this.camera.lookAt(0, -1, 0);
    }
  }

  // ...

  private createBoard() {
    this.boardGroup.clear();
    this.squares = [];

    const squareSize = 1;

    let texturePath = 'assets/board.svg';
    let lightColor = 0xf0d9b5; // Default light square color
    let darkColor = 0xb58863; // Default dark (used if we were drawing squares, but here usually texture handles it)

    if (this.boardTheme() === 'wood') {
      texturePath = 'assets/wood.svg';
      lightColor = 0xe8c49e;
    }
    if (this.boardTheme() === 'marble') {
      texturePath = 'assets/marble.svg';
      lightColor = 0xe8e8e8;
    }

    // 1. Base Mesh (Physical board body + Light square color background)
    // This ensures that if the texture has transparency (e.g. for light squares), we see this color.
    const boardWidth = 8;
    const boardThickness = 0.25;
    const baseGeometry = new THREE.BoxGeometry(boardWidth, boardThickness, boardWidth);
    const baseMaterial = new THREE.MeshStandardMaterial({
      color: lightColor,
      roughness: 0.5,
      metalness: 0.1,
    });
    const baseMesh = new THREE.Mesh(baseGeometry, baseMaterial);
    baseMesh.position.y = -boardThickness / 2;
    baseMesh.receiveShadow = true;
    baseMesh.userData = { isBoard: true };
    this.boardGroup.add(baseMesh);

    // 2. Texture Overlay (Top Plane)
    const texture = this.textureLoader.load(texturePath);
    texture.colorSpace = THREE.SRGBColorSpace;

    // Use standard material with transparent: true to respect SVG alpha
    const overlayMaterial = new THREE.MeshStandardMaterial({
      map: texture,
      transparent: true,
      roughness: 0.6,
      metalness: 0.05,
      side: THREE.FrontSide,
    });

    const overlayGeometry = new THREE.PlaneGeometry(boardWidth, boardWidth);
    const overlayMesh = new THREE.Mesh(overlayGeometry, overlayMaterial);
    overlayMesh.rotation.x = -Math.PI / 2;
    overlayMesh.position.y = 0.001; // Slightly above base to avoid z-fighting
    overlayMesh.receiveShadow = true;
    // Also mark as board for click detection if we click purely on top
    overlayMesh.userData = { isBoard: true };
    this.boardGroup.add(overlayMesh);

    // 3. Board Border
    const borderGeo = new THREE.BoxGeometry(8.5, boardThickness * 1.2, 8.5);
    const borderMat = new THREE.MeshStandardMaterial({ color: 0x443322, roughness: 0.8 });
    const border = new THREE.Mesh(borderGeo, borderMat);
    border.position.y = -boardThickness / 2 - 0.05;
    border.receiveShadow = true;
    this.boardGroup.add(border);

    // 4. Invisible squares for strict individual square click detection
    const invisibleGeo = new THREE.PlaneGeometry(1, 1);
    const invisibleMat = new THREE.MeshBasicMaterial({ visible: false });

    for (let x = 0; x < 8; x++) {
      for (let z = 0; z < 8; z++) {
        const plane = new THREE.Mesh(invisibleGeo, invisibleMat);
        const posX = (x - 3.5) * squareSize;
        const posZ = (z - 3.5) * squareSize;
        plane.position.set(posX, 0.01, posZ); // Slightly higher than overlay
        plane.rotation.x = -Math.PI / 2;

        const file = 'abcdefgh'[x];
        const rank = (8 - z).toString();
        const squareName = file + rank;

        plane.userData = { square: squareName, isSquare: true };
        this.boardGroup.add(plane);
      }
    }
  }

  private getSquarePosition(square: string): THREE.Vector3 {
    if (!square) return new THREE.Vector3(0, 0, 0);
    const file = square.charCodeAt(0) - 97; // 'a' -> 0
    const rank = parseInt(square[1]) - 1; // '1' -> 0

    const x = file - 3.5;
    const z = 3.5 - rank;

    return new THREE.Vector3(x, 0, z);
  }

  private updateBoardState() {
    // Diff pieces or just clear and rebuild?
    // For simplicity/robustness, let's clear and rebuild for now.
    // Optimisation: reuse meshes.
    this.updatePieces();
  }

  private updatePieces() {
    this.piecesGroup.clear();
    this.pieces.clear();

    const board = this.chess.board();

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece) {
          const square = ('abcdefgh'[c] + (8 - r).toString()) as string;
          const mesh = this.createPieceMesh(piece.type, piece.color);
          const pos = this.getSquarePosition(square);
          mesh.position.set(pos.x, 0, pos.z);

          // Rotation
          if (piece.color === 'w') {
            if (piece.type === 'n') mesh.rotation.y = Math.PI;
          } else {
            if (piece.type === 'n') mesh.rotation.y = 0;
            else mesh.rotation.y = Math.PI; // Optional: Rotate blacks to face white?
          }

          mesh.userData = { square };
          this.piecesGroup.add(mesh);
          this.pieces.set(square, mesh);
        }
      }
    }
  }

  private createPieceMesh(type: string, color: 'w' | 'b'): THREE.Object3D {
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

  // --- Interaction & Drag-and-Drop ---

  private dragInfo: {
    piece: THREE.Object3D;
    startPos: THREE.Vector3;
    squaresMap: Map<string, THREE.Vector3>;
  } | null = null;
  private isMouseDown = false;
  private mouseDownPos = new THREE.Vector2();

  @HostListener('mousedown', ['$event'])
  onMouseDown(event: MouseEvent) {
    if (!this.rendererContainer) return;

    this.isMouseDown = true;
    this.mouseDownPos.set(event.clientX, event.clientY);
    this.updateMouse(event);

    // 1. Check if clicking a Piece
    this.raycaster.setFromCamera(this.mouse, this.camera);
    // Raycast recursively for pieces
    const pieceIntersects = this.raycaster.intersectObjects(this.piecesGroup.children, true);

    if (pieceIntersects.length > 0) {
      // Find the root piece group/mesh from the intersection
      let target = pieceIntersects[0].object;
      while (target.parent && target.parent !== this.piecesGroup) {
        target = target.parent;
      }

      if (target.userData && target.userData['square']) {
        const square = target.userData['square'];
        const piece = this.pieces.get(square);
        const chessPiece = this.chess.get(square as any);

        // Start dragging if it's our piece
        // Note: logic allows picking up any piece, but we ideally only pick ours or handle turn check logic later
        if (piece && chessPiece) {
          this.dragInfo = {
            piece: piece,
            startPos: piece.position.clone(),
            squaresMap: new Map(), // Unused but could cache square center positions
          };
          // Optional: Lift piece slightly
          piece.position.y += 0.5;
          return;
        }
      }
    }

    // 2. Not a piece? Maybe clicking a square (processed on mouseup as click if no drag)
  }

  @HostListener('mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (!this.isMouseDown) return;
    if (this.dragInfo) {
      this.updateMouse(event);
      this.raycaster.setFromCamera(this.mouse, this.camera);

      // Raycast against the ideal "move plane" (y=0 or board height)
      // We can reuse boardGroup for intersection as it has a large plane
      const intersects = this.raycaster.intersectObjects(this.boardGroup.children);
      if (intersects.length > 0) {
        const point = intersects[0].point;
        this.dragInfo.piece.position.set(point.x, this.dragInfo.piece.position.y, point.z);
      }
    }
  }

  @HostListener('mouseup', ['$event'])
  onMouseUp(event: MouseEvent) {
    if (!this.rendererContainer || !this.isMouseDown) return;
    this.isMouseDown = false;

    // Distance moved?
    const dist = this.mouseDownPos.distanceTo(new THREE.Vector2(event.clientX, event.clientY));
    const isClick = dist < 5; // 5px threshold

    if (this.dragInfo) {
      // Drop Logic
      const piece = this.dragInfo.piece;
      // Find nearest square center to piece position
      let nearestSquare: string | null = null;
      let minDistance = Infinity;

      // Quick iterate all squares
      for (let x = 0; x < 8; x++) {
        for (let z = 0; z < 8; z++) {
          const file = 'abcdefgh'[x];
          const rank = (8 - z).toString();
          const sq = file + rank;
          const posX = x - 3.5;
          const posZ = z - 3.5; // Grid is 1.0 size
          // dist in x/z plane
          const dx = piece.position.x - posX;
          const dz = piece.position.z - posZ;
          const d = Math.sqrt(dx * dx + dz * dz);
          if (d < minDistance) {
            minDistance = d;
            nearestSquare = sq;
          }
        }
      }

      // If we have a nearest square, try to move
      if (nearestSquare) {
        const from = piece.userData['square'];
        const to = nearestSquare;

        if (from !== to && from && to) {
          // Try move
          const validMoves = this.chess.moves({ verbose: true, square: from as any });
          const move = validMoves.find((m) => m.to === to);
          if (move) {
            this.move.emit({ from, to });
            // We don't update local state instantly; we wait for ngOnChanges or we couldoptimistic update
            // But for now, snap back until updatePieces is called by parent's FEN change.
            // Actually, if we just drop it there, it might jump back if move is rejected
            // or jump to center if accepted.
            // Let's snap it to center of target for visual feedback:
            const destPos = this.getSquarePosition(to);
            piece.position.set(destPos.x, 0, destPos.z);
          } else {
            // Invalid move, revert
            piece.position.copy(this.dragInfo.startPos);
          }
        } else {
          // Dropped on same square -> Treat as click/selection?
          // Or just snap back
          if (isClick) {
            // If it was a quick click on a piece, treat as selection
            this.onSquareClick(piece.userData['square']);
          }
          piece.position.copy(this.dragInfo.startPos);
        }
      } else {
        piece.position.copy(this.dragInfo.startPos);
      }

      this.dragInfo = null;
    } else {
      // No piece dragged, just a click on the board squares?
      // If it was a click
      if (isClick) {
        this.updateMouse(event);
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.boardGroup.children);
        if (intersects.length > 0) {
          const object = intersects[0].object;
          if (object.userData && object.userData['square']) {
            this.onSquareClick(object.userData['square']);
          }
        }
      }
    }
  }

  private updateMouse(event: MouseEvent) {
    const rect = this.rendererContainer.nativeElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    this.mouse.x = (x / rect.width) * 2 - 1;
    this.mouse.y = -(y / rect.height) * 2 + 1;
  }

  private onSquareClick(square: string) {
    if (this.selectedSquare) {
      if (this.selectedSquare === square) {
        this.deselect();
        return;
      }

      // Attempt move
      const validMoves = this.chess.moves({ verbose: true, square: this.selectedSquare as any });
      const targetMove = validMoves.find((m) => m.to === square);

      if (targetMove) {
        this.move.emit({ from: this.selectedSquare, to: square });
        this.deselect();
      } else {
        // Maybe selecting another piece?
        const piece = this.chess.get(square as any);
        if (piece && piece.color === this.chess.turn()) {
          this.select(square);
        } else {
          this.deselect();
        }
      }
    } else {
      const piece = this.chess.get(square as any);
      if (piece && piece.color === this.chess.turn()) {
        this.select(square);
      }
    }
  }

  private select(square: string) {
    this.selectedSquare = square;
    const pos = this.getSquarePosition(square);
    this.selectionMarker.position.set(pos.x, 0.01, pos.z);
    this.selectionMarker.visible = true;
  }

  private deselect() {
    this.selectedSquare = null;
    this.selectionMarker.visible = false;
  }

  private animate() {
    this.animationId = requestAnimationFrame(() => this.animate());
    this.renderer.render(this.scene, this.camera);
  }
}
